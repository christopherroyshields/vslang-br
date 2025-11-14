import { Diagnostic, DiagnosticSeverity, Position, Range, TextDocument } from "vscode";
import BrParser from "../parser";
import { Project } from "./Project";
import Parser = require("../../vendor/tree-sitter");
import { getFunctionByName } from "../completions/functions";
import { VariableType } from "../types/VariableType";

/**
 * Function-specific diagnostics for BR language
 * Detects issues like undefined functions, duplicate definitions, parameter mismatches, and missing FNEND
 */
export default class BrFunctionDiagnostics {
	parser: BrParser;

	constructor(parser: BrParser) {
		this.parser = parser;
	}

	/**
	 * Get all function diagnostics for a document
	 * @param document - The document to analyze
	 * @param project - Optional project context for cross-file validation
	 * @returns Array of diagnostics
	 */
	getDiagnostics(document: TextDocument, project?: Project): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const tree = this.parser.getDocumentTree(document);

		// Run all diagnostic checks
		diagnostics.push(...this.checkMissingFnend(tree, document));
		diagnostics.push(...this.checkDuplicateFunctions(tree, document, project));
		diagnostics.push(...this.checkUndefinedFunctions(tree, document, project));
		diagnostics.push(...this.checkParameterMismatches(tree, document, project));
		diagnostics.push(...this.checkParameterTypeMismatches(tree, document, project));

		return diagnostics;
	}

	/**
	 * Check for functions missing FNEND statement
	 */
	private checkMissingFnend(tree: Parser.Tree, document: TextDocument): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const fnQuery = `
			(def_statement) @def
			(fnend_statement) @fnend
		`;

		const results = this.parser.match(fnQuery, tree.rootNode);

		let openDefNode: Parser.SyntaxNode | undefined = undefined;

		for (const result of results) {
			const node = result.captures[0].node;

			if (node.type === "def_statement") {
				// Check if there's already an open DEF (previous one missing FNEND)
				if (openDefNode) {
					const functionName = this.getFunctionNameFromDef(openDefNode);
					diagnostics.push({
						code: 'missing-fnend',
						message: `Function '${functionName}' is missing FNEND statement`,
						range: new Range(
							new Position(openDefNode.startPosition.row, openDefNode.startPosition.column),
							new Position(openDefNode.endPosition.row, openDefNode.endPosition.column)
						),
						severity: DiagnosticSeverity.Error,
						source: 'BR Function Diagnostics',
					});
				}

				// Check if this is an inline function (has expression in same line)
				const numericExpr = node.descendantsOfType("numeric_expression");
				const stringExpr = node.descendantsOfType("string_expression");
				const hasInlineReturn = (numericExpr.length > 0 || stringExpr.length > 0);

				if (!hasInlineReturn) {
					// Multi-line function needs FNEND
					openDefNode = node;
				} else {
					// Inline function doesn't need FNEND
					openDefNode = undefined;
				}
			} else if (node.type === "fnend_statement") {
				if (openDefNode) {
					// Found matching FNEND for the open DEF
					openDefNode = undefined;
				}
			}
		}

		// If we have an open DEF at end of file, it's missing FNEND
		if (openDefNode) {
			const functionName = this.getFunctionNameFromDef(openDefNode);
			diagnostics.push({
				code: 'missing-fnend',
				message: `Function '${functionName}' is missing FNEND statement`,
				range: new Range(
					new Position(openDefNode.startPosition.row, openDefNode.startPosition.column),
					new Position(openDefNode.endPosition.row, openDefNode.endPosition.column)
				),
				severity: DiagnosticSeverity.Error,
				source: 'BR Function Diagnostics',
			});
		}

		return diagnostics;
	}

	/**
	 * Check for duplicate function definitions
	 */
	private checkDuplicateFunctions(tree: Parser.Tree, document: TextDocument, project?: Project): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const functionMap = new Map<string, Parser.SyntaxNode[]>();

		// Find all function definitions in current document
		const defQuery = '(def_statement) @def';
		const results = this.parser.match(defQuery, tree.rootNode);

		for (const result of results) {
			const defNode = result.captures[0].node;
			const functionName = this.getFunctionNameFromDef(defNode);
			const isLibrary = defNode.firstChild?.type === "library_keyword";

			if (!functionName) continue;

			const key = functionName.toLowerCase();
			if (!functionMap.has(key)) {
				functionMap.set(key, []);
			}
			functionMap.get(key)!.push(defNode);

			// For library functions, check across the entire project
			if (isLibrary && project) {
				const existingLibraryFuncs = project.libraryIndex.getFunctionsByName(functionName);
				// Check if there are existing library functions from other files
				const duplicatesInOtherFiles = existingLibraryFuncs.filter(
					f => f.uri.toString() !== document.uri.toString()
				);

				if (duplicatesInOtherFiles.length > 0) {
					// Found duplicate in another file
					const nameNode = this.getFunctionNameNode(defNode);
					if (nameNode) {
						diagnostics.push({
							code: 'duplicate-library-function',
							message: `Library function '${functionName}' is already defined in another file`,
							range: new Range(
								new Position(nameNode.startPosition.row, nameNode.startPosition.column),
								new Position(nameNode.endPosition.row, nameNode.endPosition.column)
							),
							severity: DiagnosticSeverity.Error,
							source: 'BR Function Diagnostics',
						});
					}
				}
			}
		}

		// Check for duplicates within the same file
		for (const [name, nodes] of functionMap) {
			if (nodes.length > 1) {
				// Mark all but the first as duplicates
				for (let i = 1; i < nodes.length; i++) {
					const nameNode = this.getFunctionNameNode(nodes[i]);
					if (nameNode) {
						const functionName = this.getFunctionNameFromDef(nodes[i]);
						diagnostics.push({
							code: 'duplicate-function',
							message: `Function '${functionName}' is already defined in this file`,
							range: new Range(
								new Position(nameNode.startPosition.row, nameNode.startPosition.column),
								new Position(nameNode.endPosition.row, nameNode.endPosition.column)
							),
							severity: DiagnosticSeverity.Error,
							source: 'BR Function Diagnostics',
						});
					}
				}
			}
		}

		return diagnostics;
	}

	/**
	 * Check for calls to undefined functions
	 */
	private checkUndefinedFunctions(tree: Parser.Tree, document: TextDocument, project?: Project): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		// Find all function calls
		const callQuery = `
			(numeric_user_function) @call
			(string_user_function) @call
		`;
		const results = this.parser.match(callQuery, tree.rootNode);

		for (const result of results) {
			const callNode = result.captures[0].node;
			const nameNode = callNode.firstNamedChild;

			if (!nameNode) continue;

			const functionName = nameNode.text;

			// Check if function is defined
			const isDefined = this.isFunctionDefined(functionName, document, project);

			if (!isDefined) {
				diagnostics.push({
					code: 'undefined-function',
					message: `Function '${functionName}' is not defined`,
					range: new Range(
						new Position(nameNode.startPosition.row, nameNode.startPosition.column),
						new Position(nameNode.endPosition.row, nameNode.endPosition.column)
					),
					severity: DiagnosticSeverity.Warning,
					source: 'BR Function Diagnostics',
				});
			}
		}

		return diagnostics;
	}

	/**
	 * Check for parameter count mismatches in function calls
	 */
	private checkParameterMismatches(tree: Parser.Tree, document: TextDocument, project?: Project): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		// Find all function calls
		const callQuery = `
			(numeric_user_function) @call
			(string_user_function) @call
		`;
		const results = this.parser.match(callQuery, tree.rootNode);

		for (const result of results) {
			const callNode = result.captures[0].node;
			const nameNode = callNode.firstNamedChild;

			if (!nameNode) continue;

			const functionName = nameNode.text;

			// Get argument count from call
			const argsNode = callNode.childForFieldName('arguments');
			const argCount = argsNode ? argsNode.namedChildCount : 0;

			// Find function definition and get expected parameter count
			const funcDef = this.getFunctionDefinition(functionName, document, project);

			if (funcDef) {
				const { requiredCount, totalCount } = funcDef;

				// Check if argument count is valid
				if (argCount < requiredCount || argCount > totalCount) {
					const expectedRange = requiredCount === totalCount
						? `${requiredCount}`
						: `${requiredCount}-${totalCount}`;

					diagnostics.push({
						code: 'parameter-mismatch',
						message: `Function '${functionName}' expects ${expectedRange} parameter(s), but ${argCount} provided`,
						range: new Range(
							new Position(callNode.startPosition.row, callNode.startPosition.column),
							new Position(callNode.endPosition.row, callNode.endPosition.column)
						),
						severity: DiagnosticSeverity.Warning,
						source: 'BR Function Diagnostics',
					});
				}
			}
		}

		return diagnostics;
	}

	/**
	 * Helper: Check if a function is defined (system, local, or library)
	 */
	private isFunctionDefined(functionName: string, document: TextDocument, project?: Project): boolean {
		// Check system/internal functions
		const systemFunc = getFunctionByName(functionName);
		if (systemFunc) return true;

		// Check local functions in current document
		const localFuncs = this.parser.getLocalFunctionList(document);
		const localFunc = localFuncs.find(f => f.name.toLowerCase() === functionName.toLowerCase());
		if (localFunc) return true;

		// Check LIBRARY statements in current document (e.g., LIBRARY "dll": FNNAME1, FNNAME2)
		if (this.isDeclaredInLibraryStatement(functionName, document)) {
			return true;
		}

		// Check library functions in project
		if (project) {
			const libraryFuncs = project.libraryIndex.getFunctionsByName(functionName);
			if (libraryFuncs.length > 0) return true;

			// Library functions are stored without the "FN" prefix in the scanner
			// So also try searching without the prefix if the name starts with "FN"
			if (functionName.toLowerCase().startsWith('fn')) {
				const nameWithoutFn = functionName.substring(2);
				const libraryFuncsWithoutPrefix = project.libraryIndex.getFunctionsByName(nameWithoutFn);
				if (libraryFuncsWithoutPrefix.length > 0) return true;
			}
		}

		return false;
	}

	/**
	 * Helper: Check if a function is declared in a LIBRARY statement in the document
	 */
	private isDeclaredInLibraryStatement(functionName: string, document: TextDocument): boolean {
		const tree = this.parser.getDocumentTree(document);
		const libraryQuery = '(library_statement) @lib';
		const results = this.parser.match(libraryQuery, tree.rootNode);

		for (const result of results) {
			const libNode = result.captures[0].node;
			const text = libNode.text;

			// Parse LIBRARY statement format: LIBRARY "path": FNNAME1, FNNAME2, ...
			// The function names come after the colon
			const colonIndex = text.indexOf(':');
			if (colonIndex !== -1) {
				const functionList = text.substring(colonIndex + 1);
				// Split by comma and check each function name
				const declaredFunctions = functionList.split(',').map(f => f.trim());
				for (const declaredFunc of declaredFunctions) {
					// Remove any trailing/leading whitespace and compare
					if (declaredFunc.toLowerCase() === functionName.toLowerCase()) {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Helper: Get function definition with parameter counts
	 */
	private getFunctionDefinition(functionName: string, document: TextDocument, project?: Project): { requiredCount: number, totalCount: number } | null {
		// Check system/internal functions
		const systemFunc = getFunctionByName(functionName);
		if (systemFunc && systemFunc.params) {
			const requiredParams = systemFunc.params.filter(p => !p.isOptional).length;
			const totalParams = systemFunc.params.length;
			return { requiredCount: requiredParams, totalCount: totalParams };
		}

		// Check local functions
		const localFuncs = this.parser.getLocalFunctionList(document);
		const localFunc = localFuncs.find(f => f.name.toLowerCase() === functionName.toLowerCase());
		if (localFunc) {
			return this.getParamCountsFromUserFunction(localFunc);
		}

		// Check library functions
		if (project) {
			let libraryFuncs = project.libraryIndex.getFunctionsByName(functionName);

			// Library functions are stored without the "FN" prefix in the scanner
			// So also try searching without the prefix if the name starts with "FN"
			if (libraryFuncs.length === 0 && functionName.toLowerCase().startsWith('fn')) {
				const nameWithoutFn = functionName.substring(2);
				libraryFuncs = project.libraryIndex.getFunctionsByName(nameWithoutFn);
			}

			if (libraryFuncs.length > 0) {
				// Get the full function from source document
				const metadata = libraryFuncs[0];
				const sourceDoc = project.sourceFiles.get(metadata.uri.toString());
				if (sourceDoc) {
					// Parse parameters from the metadata if available
					// Note: For now, we'll skip parameter validation for library functions
					// as it would require async parsing of the source document
					return null;
				}
			}
		}

		return null;
	}

	/**
	 * Helper: Extract parameter counts from UserFunction
	 */
	private getParamCountsFromUserFunction(func: any): { requiredCount: number, totalCount: number } {
		let requiredCount = 0;
		let totalCount = 0;

		if (func.params) {
			for (const param of func.params) {
				totalCount++;
				if (!param.isOptional) {
					requiredCount++;
				}
			}
		}

		return { requiredCount, totalCount };
	}

	/**
	 * Helper: Get function name from DEF statement node
	 */
	private getFunctionNameFromDef(defNode: Parser.SyntaxNode): string {
		// Look for function_name node within the def_statement
		const functionNames = defNode.descendantsOfType('function_name');
		if (functionNames.length > 0) {
			return functionNames[0].text;
		}
		return '';
	}

	/**
	 * Helper: Get function name node from DEF statement
	 */
	private getFunctionNameNode(defNode: Parser.SyntaxNode): Parser.SyntaxNode | null {
		// Look for function_name node within the def_statement
		const functionNames = defNode.descendantsOfType('function_name');
		if (functionNames.length > 0) {
			return functionNames[0];
		}
		return null;
	}

	/**
	 * Check for parameter type mismatches in function calls
	 */
	private checkParameterTypeMismatches(tree: Parser.Tree, document: TextDocument, project?: Project): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		// Find all function calls
		const callQuery = `
			(numeric_user_function) @call
			(string_user_function) @call
		`;
		const results = this.parser.match(callQuery, tree.rootNode);

		for (const result of results) {
			const callNode = result.captures[0].node;
			const nameNode = callNode.firstNamedChild;

			if (!nameNode) continue;

			const functionName = nameNode.text;

			// Get the function definition
			const localFuncs = this.parser.getLocalFunctionList(document);
			const localFunc = localFuncs.find(f => f.name.toLowerCase() === functionName.toLowerCase());

			if (!localFunc || !localFunc.params || localFunc.params.length === 0) {
				// Skip if no local function definition or no parameters
				continue;
			}

			// Skip if parameter types are not set (can't validate types without type info)
			const hasTypeInfo = localFunc.params.some(p => p.type !== undefined);
			if (!hasTypeInfo) {
				continue;
			}

			// Get arguments from call
			const argsNode = callNode.childForFieldName('arguments');
			if (!argsNode) continue;

			const argumentNodes = argsNode.namedChildren.filter(child => child.type === 'argument');

			// Check each argument's type against the expected parameter type
			for (let i = 0; i < argumentNodes.length && i < localFunc.params.length; i++) {
				const argNode = argumentNodes[i];
				const param = localFunc.params[i];

				if (param.type === undefined) continue; // Skip if parameter type is unknown

				const argType = this.getArgumentType(argNode);
				if (argType === null) continue; // Skip if we can't determine argument type

				// Check if types match
				if (!this.typesMatch(argType, param.type)) {
					const exprNode = argNode.firstNamedChild; // Get the expression node
					if (exprNode) {
						diagnostics.push({
							code: 'parameter-type-mismatch',
							message: `Parameter '${param.name}' expects ${this.formatType(param.type)}, but got ${this.formatType(argType)}`,
							range: new Range(
								new Position(exprNode.startPosition.row, exprNode.startPosition.column),
								new Position(exprNode.endPosition.row, exprNode.endPosition.column)
							),
							severity: DiagnosticSeverity.Warning,
							source: 'BR Function Diagnostics',
						});
					}
				}
			}
		}

		return diagnostics;
	}

	/**
	 * Helper: Get the type of an argument from its tree-sitter node
	 */
	private getArgumentType(argNode: Parser.SyntaxNode): VariableType | null {
		// Look for type indicators in descendants
		const numberrefs = argNode.descendantsOfType('numberreference');
		const stringrefs = argNode.descendantsOfType('stringreference');
		const numberarrays = argNode.descendantsOfType('numberarray');
		const stringarrays = argNode.descendantsOfType('stringarray');

		if (stringarrays.length > 0) return VariableType.stringarray;
		if (numberarrays.length > 0) return VariableType.numberarray;
		if (stringrefs.length > 0) return VariableType.string;
		if (numberrefs.length > 0) return VariableType.number;

		// Check for string/numeric expressions
		const stringExprs = argNode.descendantsOfType('string_expression');
		const numericExprs = argNode.descendantsOfType('numeric_expression');

		if (stringExprs.length > 0 && numericExprs.length === 0) return VariableType.string;
		if (numericExprs.length > 0 && stringExprs.length === 0) return VariableType.number;

		// Check for string/numeric array expressions
		const stringArrayExprs = argNode.descendantsOfType('string_array_expression');
		const numericArrayExprs = argNode.descendantsOfType('numeric_array_expression');

		if (stringArrayExprs.length > 0) return VariableType.stringarray;
		if (numericArrayExprs.length > 0) return VariableType.numberarray;

		return null; // Can't determine type
	}

	/**
	 * Helper: Check if argument type matches parameter type
	 */
	private typesMatch(argType: VariableType, paramType: VariableType): boolean {
		// Exact match
		if (argType === paramType) return true;

		// Allow numeric and number to match (both are numbers)
		if ((argType === VariableType.number && paramType === VariableType.number) ||
			(argType === VariableType.string && paramType === VariableType.string)) {
			return true;
		}

		return false;
	}

	/**
	 * Helper: Format variable type for error messages
	 */
	private formatType(type: VariableType): string {
		switch (type) {
			case VariableType.number: return 'number';
			case VariableType.string: return 'string';
			case VariableType.numberarray: return 'number array';
			case VariableType.stringarray: return 'string array';
			default: return 'unknown type';
		}
	}
}
