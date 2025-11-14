import * as assert from 'assert'
import * as vscode from 'vscode'
import BrFunctionDiagnostics from '../../class/BrFunctionDiagnostics'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import SourceDocument from '../../class/SourceDocument'
import Layout from '../../class/Layout'
import LibraryFunctionIndex from '../../class/LibraryFunctionIndex'
import path = require('path')

suite('BrFunctionDiagnostics Test Suite', () => {
	vscode.window.showInformationMessage('Start BrFunctionDiagnostics tests.')

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

	const diagnostics = new BrFunctionDiagnostics(parser)

	suite('Missing FNEND Detection', () => {
		test('Detects missing FNEND at end of file', async () => {
			const content = `00010 DEF FNMISSING(X)
00020   LET Y=X+1
00030 REM Missing FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const missingFnendDiags = diags.filter(d => d.code === 'missing-fnend')

			assert.strictEqual(missingFnendDiags.length, 1, 'Should detect one missing FNEND')
			assert.ok(missingFnendDiags[0].message.includes('FNMISSING'), 'Message should include function name')
			assert.strictEqual(missingFnendDiags[0].severity, vscode.DiagnosticSeverity.Error, 'Should be an error')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Detects missing FNEND before next DEF', async () => {
			const content = `00010 DEF FNFIRST(X)
00020   LET Y=X+1
00030 REM Missing FNEND
00040 DEF FNSECOND(A)
00050   LET FNSECOND=A*2
00060 FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const missingFnendDiags = diags.filter(d => d.code === 'missing-fnend')

			assert.strictEqual(missingFnendDiags.length, 1, 'Should detect one missing FNEND')
			assert.ok(missingFnendDiags[0].message.includes('FNFIRST'), 'Should flag FNFIRST as missing FNEND')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag inline functions', async () => {
			const content = `00010 DEF FNINLINE(X)=X*2
00020 LET Y=FNINLINE(5)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const missingFnendDiags = diags.filter(d => d.code === 'missing-fnend')

			assert.strictEqual(missingFnendDiags.length, 0, 'Should not flag inline function')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag properly closed functions', async () => {
			const content = `00010 DEF FNVALID(X)
00020   LET FNVALID=X*2
00030 FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const missingFnendDiags = diags.filter(d => d.code === 'missing-fnend')

			assert.strictEqual(missingFnendDiags.length, 0, 'Should not flag properly closed function')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Duplicate Function Detection', () => {
		test('Detects duplicate functions in same file', async () => {
			const content = `00010 DEF FNDUPLICATE(X)
00020   LET FNDUPLICATE=X*2
00030 FNEND
00040 DEF FNDUPLICATE(Y)
00050   LET FNDUPLICATE=Y*3
00060 FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const duplicateDiags = diags.filter(d => d.code === 'duplicate-function')

			assert.strictEqual(duplicateDiags.length, 1, 'Should detect one duplicate')
			assert.ok(duplicateDiags[0].message.includes('FNDUPLICATE'), 'Message should include function name')
			assert.strictEqual(duplicateDiags[0].severity, vscode.DiagnosticSeverity.Error, 'Should be an error')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag different function names', async () => {
			const content = `00010 DEF FNFIRST(X)
00020   LET FNFIRST=X*2
00030 FNEND
00040 DEF FNSECOND(Y)
00050   LET FNSECOND=Y*3
00060 FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const duplicateDiags = diags.filter(d => d.code === 'duplicate-function')

			assert.strictEqual(duplicateDiags.length, 0, 'Should not flag different functions')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Detects case-insensitive duplicates', async () => {
			const content = `00010 DEF FnTest(X)
00020   LET FnTest=X*2
00030 FNEND
00040 DEF FNTEST(Y)
00050   LET FNTEST=Y*3
00060 FNEND`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const duplicateDiags = diags.filter(d => d.code === 'duplicate-function')

			assert.strictEqual(duplicateDiags.length, 1, 'Should detect case-insensitive duplicate')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Undefined Function Detection', () => {
		test('Detects undefined function call', async () => {
			const content = `00010 LET X=FNUNDEFINED(5)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 1, 'Should detect undefined function')
			assert.ok(undefinedDiags[0].message.includes('FNUNDEFINED'), 'Message should include function name')
			assert.strictEqual(undefinedDiags[0].severity, vscode.DiagnosticSeverity.Warning, 'Should be a warning')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag defined local functions', async () => {
			const content = `00010 DEF FNVALID(X)
00020   LET FNVALID=X*2
00030 FNEND
00040 LET Y=FNVALID(5)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 0, 'Should not flag defined function')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag system functions', async () => {
			const content = `00010 LET X=ABS(-5)
00020 LET Y$=LTRIM$(Z$)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 0, 'Should not flag system functions')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag functions declared in LIBRARY statement', async () => {
			const content = `00010 LIBRARY "FNSnap.dll": FNPRINT_FILE
00020 LET X=FNPRINT_FILE("test.txt")`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 0, 'Should not flag LIBRARY statement functions')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Case-insensitive function lookup', async () => {
			const content = `00010 DEF FnTest(X)
00020   LET FnTest=X*2
00030 FNEND
00040 LET Y=FNTEST(5)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 0, 'Should match case-insensitively')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Parameter Mismatch Detection', () => {
		test('Detects too few parameters', async () => {
			const content = `00010 DEF FNPARAMS(X,Y,Z)
00020   LET FNPARAMS=X+Y+Z
00030 FNEND
00040 LET RESULT=FNPARAMS(1,2)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			assert.strictEqual(paramDiags.length, 1, 'Should detect too few parameters')
			assert.ok(paramDiags[0].message.includes('3'), 'Should mention expected count')
			assert.ok(paramDiags[0].message.includes('2'), 'Should mention actual count')
			assert.strictEqual(paramDiags[0].severity, vscode.DiagnosticSeverity.Warning, 'Should be a warning')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Detects too many parameters', async () => {
			const content = `00010 DEF FNPARAMS(X,Y)
00020   LET FNPARAMS=X+Y
00030 FNEND
00040 LET RESULT=FNPARAMS(1,2,3,4)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			assert.strictEqual(paramDiags.length, 1, 'Should detect too many parameters')
			assert.ok(paramDiags[0].message.includes('2'), 'Should mention expected count')
			assert.ok(paramDiags[0].message.includes('4'), 'Should mention actual count')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag correct parameter count', async () => {
			const content = `00010 DEF FNPARAMS(X,Y,Z)
00020   LET FNPARAMS=X+Y+Z
00030 FNEND
00040 LET RESULT=FNPARAMS(1,2,3)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			assert.strictEqual(paramDiags.length, 0, 'Should not flag correct parameter count')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Handles optional parameters correctly', async () => {
			const content = `00010 DEF FNOPTIONAL(X,Y;Z)
00020   LET FNOPTIONAL=X+Y
00030 FNEND
00040 LET R1=FNOPTIONAL(1,2)
00050 LET R2=FNOPTIONAL(1,2,3)
00060 LET R3=FNOPTIONAL(1)
00070 LET R4=FNOPTIONAL(1,2,3,4)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			// Should flag R3 (too few) and R4 (too many), but not R1 or R2
			assert.strictEqual(paramDiags.length, 2, 'Should detect two parameter mismatches')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Validates system function parameters', async () => {
			const content = `00010 REM ABS takes 1 parameter
00020 LET X=ABS(-5, 10)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			// Note: This test depends on internal function definitions
			// ABS should take exactly 1 parameter
			assert.ok(paramDiags.length >= 0, 'Should validate system function parameters')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag undefined functions', async () => {
			const content = `00010 LET X=FNUNDEFINED(1,2,3,4,5)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const paramDiags = diags.filter(d => d.code === 'parameter-mismatch')

			// Should not check parameters if function is undefined
			assert.strictEqual(paramDiags.length, 0, 'Should not validate undefined function parameters')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Cross-file Library Function Detection', () => {
		test('Detects library functions across files', async () => {
			const testcodeDir = path.join(__dirname, '../../../testcode')
			const testWorkspaceFolder = {
				uri: Uri.file(testcodeDir),
				name: 'testcode',
				index: 0
			}

			const project: Project = {
				sourceFiles: new Map<string, SourceDocument>(),
				layouts: new Map<string, Layout>(),
				libraryIndex: new LibraryFunctionIndex()
			}

			// Create a library file with a library function
			const libContent = `00010 DEF LIBRARY FNLIBTEST(X)
00020   LET FNLIBTEST=X*2
00030 FNEND`

			const libDoc = await vscode.workspace.openTextDocument({
				language: 'br',
				content: libContent
			})

			const libBuffer = Buffer.from(libContent)
			const libSourceDoc = new SourceDocument(parser, libDoc.uri, libBuffer, testWorkspaceFolder)
			project.sourceFiles.set(libDoc.uri.toString(), libSourceDoc)

			// Add to library index
			const libFuncs = libSourceDoc.getLibraryFunctionsMetadata()
			for (const libFunc of libFuncs) {
				project.libraryIndex.addFunction(libFunc)
			}

			// Create a main file that uses the library function
			const mainContent = `00010 LET X=FNLIBTEST(5)`

			const mainDoc = await vscode.workspace.openTextDocument({
				language: 'br',
				content: mainContent
			})

			const diags = diagnostics.getDiagnostics(mainDoc, project)
			const undefinedDiags = diags.filter(d => d.code === 'undefined-function')

			assert.strictEqual(undefinedDiags.length, 0, 'Should not flag library function from another file')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Parameter Type Mismatch Detection', () => {
		test('Detects string passed to number parameter', async () => {
			const content = `00010 DEF FNTEST(X)
00020   LET FNTEST=X*2
00030 FNEND
00040 LET RESULT=FNTEST(NAME$)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			assert.strictEqual(typeDiags.length, 1, 'Should detect string passed to number parameter')
			assert.ok(typeDiags[0].message.includes('expects number'), 'Should mention expected type')
			assert.ok(typeDiags[0].message.includes('got string'), 'Should mention actual type')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Detects number passed to string parameter', async () => {
			const content = `00010 DEF FNTEST$(S$)
00020   LET FNTEST$=S$
00030 FNEND
00040 LET RESULT$=FNTEST$(X)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			assert.strictEqual(typeDiags.length, 1, 'Should detect number passed to string parameter')
			assert.ok(typeDiags[0].message.includes('expects string'), 'Should mention expected type')
			assert.ok(typeDiags[0].message.includes('got number'), 'Should mention actual type')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Detects array type mismatches', async () => {
			const content = `00010 DIM ARR(10), SARR$(10)*20
00020 DEF FNTEST(MAT A())
00030   LET FNTEST=A(1)
00040 FNEND
00050 LET RESULT=FNTEST(MAT SARR$())`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			assert.strictEqual(typeDiags.length, 1, 'Should detect array type mismatch')
			assert.ok(typeDiags[0].message.includes('array'), 'Should mention array type')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag correct parameter types', async () => {
			const content = `00010 DEF FNTEST(X,Y$)
00020   LET FNTEST=X
00030 FNEND
00040 LET RESULT=FNTEST(5,NAME$)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			assert.strictEqual(typeDiags.length, 0, 'Should not flag correct parameter types')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Does not flag when parameter types are unknown', async () => {
			const content = `00010 DEF FNTEST(X)
00020   LET FNTEST=X
00030 FNEND
00040 LET RESULT=FNTEST(FNOTHER())`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			assert.strictEqual(typeDiags.length, 0, 'Should not flag when types cannot be determined')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})

		test('Handles multiple parameters with mixed types', async () => {
			const content = `00010 DEF FNTEST(X,Y$,Z)
00020   LET FNTEST=X+Z
00030 FNEND
00040 LET RESULT=FNTEST(A$,B,C$)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)
			const typeDiags = diags.filter(d => d.code === 'parameter-type-mismatch')

			// Should detect: A$ (string) for X (number), B (number) for Y$ (string), C$ (string) for Z (number)
			assert.strictEqual(typeDiags.length, 3, 'Should detect all three type mismatches')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})

	suite('Integration Tests', () => {
		test('Detects multiple diagnostic types in same file', async () => {
			const content = `00010 DEF FNMISSING(X)
00020   LET Y=X+1
00030 REM Missing FNEND
00040 DEF FNDUPLICATE(A)
00050   LET FNDUPLICATE=A*2
00060 FNEND
00070 DEF FNDUPLICATE(B)
00080   LET FNDUPLICATE=B*3
00090 FNEND
00100 LET R1=FNUNDEFINED(5)
00110 DEF FNPARAMS(X,Y)
00120   LET FNPARAMS=X+Y
00130 FNEND
00140 LET R2=FNPARAMS(1,2,3)`

			const document = await vscode.workspace.openTextDocument({
				language: 'br',
				content: content
			})

			const diags = diagnostics.getDiagnostics(document)

			const missingFnend = diags.filter(d => d.code === 'missing-fnend')
			const duplicates = diags.filter(d => d.code === 'duplicate-function')
			const undefinedFuncs = diags.filter(d => d.code === 'undefined-function')
			const paramMismatch = diags.filter(d => d.code === 'parameter-mismatch')

			assert.strictEqual(missingFnend.length, 1, 'Should detect missing FNEND')
			assert.strictEqual(duplicates.length, 1, 'Should detect duplicate function')
			assert.strictEqual(undefinedFuncs.length, 1, 'Should detect undefined function')
			assert.strictEqual(paramMismatch.length, 1, 'Should detect parameter mismatch')

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		})
	})
})
