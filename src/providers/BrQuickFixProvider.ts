import {
	CodeActionProvider,
	TextDocument,
	Range,
	CodeActionContext,
	CancellationToken,
	CodeAction,
	CodeActionKind,
	WorkspaceEdit,
	Position,
	WorkspaceFolder
} from "vscode";
import BrParser from "../parser";
import { Project } from "../class/Project";
import { VariableType } from "../types/VariableType";
import Parser = require("../../vendor/tree-sitter");

/**
 * Provides quick fixes for BR language diagnostics
 * Currently supports creating missing function definitions
 */
export default class BrQuickFixProvider implements CodeActionProvider {
	parser: BrParser;
	configuredProjects: Map<WorkspaceFolder, Project>;

	constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
		this.configuredProjects = configuredProjects;
		this.parser = parser;
	}

	provideCodeActions(
		document: TextDocument,
		range: Range,
		context: CodeActionContext,
		token: CancellationToken
	): CodeAction[] | undefined {
		const actions: CodeAction[] = [];

		// Check for undefined function diagnostics
		const undefinedFunctionDiags = context.diagnostics.filter(
			diag => diag.code === 'undefined-function'
		);

		for (const diagnostic of undefinedFunctionDiags) {
			const action = this.createFunctionDefinitionAction(document, diagnostic.range);
			if (action) {
				actions.push(action);
			}
		}

		return actions.length > 0 ? actions : undefined;
	}

	/**
	 * Creates a quick fix action to generate a missing function definition
	 */
	private createFunctionDefinitionAction(document: TextDocument, range: Range): CodeAction | undefined {
		// Get the function call node at this position
		const tree = this.parser.getDocumentTree(document);
		const startPoint = { row: range.start.line, column: range.start.character };
		const endPoint = { row: range.end.line, column: range.end.character };

		// Find the function call node
		const callNode = tree.rootNode.descendantForPosition(startPoint, endPoint);
		if (!callNode) return undefined;

		// Find the parent function call node (numeric_user_function or string_user_function)
		let functionCallNode: Parser.SyntaxNode | null = callNode;
		while (functionCallNode &&
			functionCallNode.type !== 'numeric_user_function' &&
			functionCallNode.type !== 'string_user_function') {
			functionCallNode = functionCallNode.parent;
			if (!functionCallNode) return undefined;
		}

		if (!functionCallNode) return undefined;

		// Determine if it's a string or numeric function
		const isStringFunction = functionCallNode.type === 'string_user_function';

		// Get function name
		const nameNode = functionCallNode.firstNamedChild;
		if (!nameNode) return undefined;
		const functionName = nameNode.text;

		// Get parameters from the function call
		const argsNode = functionCallNode.childForFieldName('arguments');
		const parameters = this.extractParameters(argsNode);

		// Create the function definition
		const functionDef = this.generateFunctionDefinition(functionName, parameters, isStringFunction, document);

		// Create the code action
		const action = new CodeAction(
			`Create function '${functionName}'`,
			CodeActionKind.QuickFix
		);

		// Find the best insertion point (end of file)
		const insertPosition = this.findInsertionPoint(document);

		const edit = new WorkspaceEdit();
		edit.insert(document.uri, insertPosition, functionDef);
		action.edit = edit;
		action.diagnostics = []; // This action fixes the diagnostic

		return action;
	}

	/**
	 * Extract parameter information from function call arguments
	 */
	private extractParameters(argsNode: Parser.SyntaxNode | null): Array<{ name: string, type: VariableType }> {
		if (!argsNode) return [];

		const parameters: Array<{ name: string, type: VariableType }> = [];
		const argumentNodes = argsNode.namedChildren.filter(child => child.type === 'argument');

		for (let i = 0; i < argumentNodes.length; i++) {
			const argNode = argumentNodes[i];

			// Detect parameter type from argument expression
			const type = this.getArgumentType(argNode);

			// Try to infer parameter name from simple reference, otherwise use generic name
			const paramName = this.inferParameterName(argNode, i + 1, type);

			parameters.push({ name: paramName, type });
		}

		return parameters;
	}

	/**
	 * Infer parameter name from argument node
	 * If argument is a simple reference, use the variable name
	 * Otherwise, generate a generic parameter name
	 */
	private inferParameterName(argNode: Parser.SyntaxNode, index: number, type: VariableType): string {
		// Look for simple variable references
		const stringrefs = argNode.descendantsOfType('stringreference');
		const numberrefs = argNode.descendantsOfType('numberreference');
		const stringarrays = argNode.descendantsOfType('stringarray');
		const numberarrays = argNode.descendantsOfType('numberarray');

		// Check if this is a simple reference (only one reference node and it's the main content)
		let referenceName: string | null = null;

		if (type === VariableType.stringarray && stringarrays.length === 1) {
			// String array reference - get the identifier
			const arrayNode = stringarrays[0];
			const identifier = arrayNode.childForFieldName('name');
			if (identifier) {
				referenceName = `Mat ${identifier.text}`;
			}
		} else if (type === VariableType.numberarray && numberarrays.length === 1) {
			// Number array reference - get the identifier
			const arrayNode = numberarrays[0];
			const identifier = arrayNode.childForFieldName('name');
			if (identifier) {
				referenceName = `Mat ${identifier.text}`;
			}
		} else if (type === VariableType.string && stringrefs.length === 1 && this.isSimpleReference(argNode)) {
			// String reference
			referenceName = stringrefs[0].text;
		} else if (type === VariableType.number && numberrefs.length === 1 && this.isSimpleReference(argNode)) {
			// Number reference
			referenceName = numberrefs[0].text;
		}

		// If we found a simple reference name, use it; otherwise generate generic name
		return referenceName || this.generateParameterName(index, type);
	}

	/**
	 * Check if argument is a simple reference (not a complex expression)
	 * A simple reference is ONLY a single variable reference with no other operations
	 */
	private isSimpleReference(argNode: Parser.SyntaxNode): boolean {
		// Check for function calls - these are definitely not simple references
		const functionCalls = argNode.descendantsOfType('numeric_user_function')
			.concat(argNode.descendantsOfType('string_user_function'))
			.concat(argNode.descendantsOfType('numeric_system_function'))
			.concat(argNode.descendantsOfType('string_system_function'));

		if (functionCalls.length > 0) {
			return false;
		}

		// Check if there are multiple expressions at the same level, which indicates a complex expression
		// For example, "OrderID + 100" has multiple children in the expression tree
		// while "OrderID" alone has just one reference
		const expressions = argNode.descendantsOfType('numeric_expression')
			.concat(argNode.descendantsOfType('string_expression'));

		// If there are multiple expression nodes or if an expression has multiple meaningful children, it's complex
		if (expressions.length > 1) {
			return false;
		}

		// Check if the expression contains multiple child nodes (indicating operators, literals, etc.)
		if (expressions.length === 1) {
			const expr = expressions[0];
			// Count non-trivial children (ignore whitespace and simple wrappers)
			const meaningfulChildren = expr.namedChildren.filter(child =>
				child.type !== 'expression' &&
				child.type !== 'numeric_expression' &&
				child.type !== 'string_expression'
			);
			// If there are multiple meaningful children, it's a complex expression
			if (meaningfulChildren.length > 1) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get the type of an argument from its tree-sitter node
	 * Uses the same logic as BrFunctionDiagnostics
	 */
	private getArgumentType(argNode: Parser.SyntaxNode): VariableType {
		// Look for type indicators in descendants
		const numberrefs = argNode.descendantsOfType('numberreference');
		const stringrefs = argNode.descendantsOfType('stringreference');
		const numberarrays = argNode.descendantsOfType('numberarray');
		const stringarrays = argNode.descendantsOfType('stringarray');

		// Check arrays first (more specific)
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

		// Default to number if type cannot be determined
		return VariableType.number;
	}

	/**
	 * Generate parameter name based on type
	 */
	private generateParameterName(index: number, type: VariableType): string {
		switch (type) {
			case VariableType.string:
				return `Param${index}$`;
			case VariableType.stringarray:
				return `Mat Param${index}$`;
			case VariableType.numberarray:
				return `Mat Param${index}`;
			case VariableType.number:
			default:
				return `Param${index}`;
		}
	}

	/**
	 * Generate the function definition code
	 */
	private generateFunctionDefinition(
		functionName: string,
		parameters: Array<{ name: string, type: VariableType }>,
		isStringFunction: boolean,
		document: TextDocument
	): string {
		// Find the last line number in the document
		const lastLineNumber = this.findLastLineNumber(document);
		const startLineNumber = lastLineNumber + 10;

		const lines: string[] = [];

		// Add blank line before function
		lines.push('');

		// Create DEF statement
		const paramList = parameters.map(p => p.name).join(', ');
		const defLine = `${this.formatLineNumber(startLineNumber)} DEF ${functionName}(${paramList})`;
		lines.push(defLine);

		// Add function body with TODO comment
		const bodyLineNumber = startLineNumber + 10;
		lines.push(`${this.formatLineNumber(bodyLineNumber)} ! TODO: Implement ${functionName}`);

		// Add return statement
		const returnLineNumber = startLineNumber + 20;
		const returnValue = isStringFunction ? '""' : '0';
		lines.push(`${this.formatLineNumber(returnLineNumber)} LET ${functionName}=${returnValue}`);

		// Add FNEND
		const fnendLineNumber = startLineNumber + 30;
		lines.push(`${this.formatLineNumber(fnendLineNumber)} FNEND`);

		// Add final blank line
		lines.push('');

		return lines.join('\n');
	}

	/**
	 * Find the last line number used in the document
	 */
	private findLastLineNumber(document: TextDocument): number {
		const tree = this.parser.getDocumentTree(document);
		const lineNumberQuery = '(line_number) @linenum';
		const results = this.parser.match(lineNumberQuery, tree.rootNode);

		let maxLineNumber = 0;
		for (const result of results) {
			const lineNumNode = result.captures[0].node;
			const lineNum = parseInt(lineNumNode.text, 10);
			if (!isNaN(lineNum) && lineNum > maxLineNumber) {
				maxLineNumber = lineNum;
			}
		}

		return maxLineNumber;
	}

	/**
	 * Format line number with zero padding to match document style
	 */
	private formatLineNumber(lineNum: number): string {
		// Default to 5-digit padding (can be enhanced to detect document style)
		return lineNum.toString().padStart(5, '0');
	}

	/**
	 * Find the best position to insert the new function
	 */
	private findInsertionPoint(document: TextDocument): Position {
		// Insert at the end of the document
		const lastLine = document.lineCount - 1;
		const lastLineText = document.lineAt(lastLine).text;

		// If the last line is not empty, add after it
		if (lastLineText.trim().length > 0) {
			return new Position(lastLine + 1, 0);
		}

		// Otherwise, insert at the last line
		return new Position(lastLine, 0);
	}
}
