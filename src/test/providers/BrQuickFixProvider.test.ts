import * as assert from 'assert'
import * as vscode from 'vscode'
import BrQuickFixProvider from '../../providers/BrQuickFixProvider'
import BrParser from '../../parser'
import BrDiagnostics from '../../class/BrDiagnostics'
import { Project } from '../../class/Project'
import Layout from '../../class/Layout'
import LibraryFunctionIndex from '../../class/LibraryFunctionIndex'
import path = require('path')

suite('BrQuickFixProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrQuickFixProvider tests.')

	const parser = new BrParser()
	let diagnostics: BrDiagnostics
	let configuredProjects: Map<vscode.WorkspaceFolder, Project>

	suiteSetup(async () => {
		console.log('Starting BrQuickFixProvider test suite setup...')
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')

		parser.activate({
			subscriptions: [{
				dispose: () => {return}
			}]
		} as vscode.ExtensionContext)

		configuredProjects = new Map<vscode.WorkspaceFolder, Project>()

		// Create diagnostics instance
		diagnostics = new BrDiagnostics(parser, {
			subscriptions: [{
				dispose: () => {return}
			}]
		} as vscode.ExtensionContext, configuredProjects)

		console.log('Test suite setup complete')
	})

	test('Generate numeric function with simple numeric parameters', async () => {
		console.log('Running numeric function generation test...')

		const testFilePath = path.join(__dirname, '../../../testcode/temp_quickfix_numeric.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `00010 DIM OrderID, TotalAmount
00020
00030 LET Result = FnCalculateTotal(OrderID, TotalAmount)
00040 PRINT Result
00050
00060 END`

		await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(content))
		const document = await vscode.workspace.openTextDocument(testFileUri)
		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)
		assert.ok(testWorkspaceFolder, 'Workspace folder should exist')

		const project = {
			sourceFiles: new Map(),
			layouts: new Map(),
			libraryIndex: new LibraryFunctionIndex()
		}
		configuredProjects.set(testWorkspaceFolder, project)

		// Wait for diagnostics to update
		await new Promise(resolve => setTimeout(resolve, 200))

		// Update diagnostics manually
		diagnostics.updateDiagnostics(document)

		// Get diagnostics for the document
		const diags = vscode.languages.getDiagnostics(testFileUri)
		const undefinedFuncDiag = diags.find(d => d.code === 'undefined-function')
		assert.ok(undefinedFuncDiag, 'Should have undefined function diagnostic')

		// Create quick fix provider and get code actions
		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)
		const context: vscode.CodeActionContext = {
			diagnostics: [undefinedFuncDiag],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			undefinedFuncDiag.range,
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(actions && actions.length > 0, 'Should provide code actions')
		assert.strictEqual(actions[0].title, "Create function 'FnCalculateTotal'")
		assert.ok(actions[0].edit, 'Action should have edit')

		// Apply the edit
		const edit = actions[0].edit!
		const success = await vscode.workspace.applyEdit(edit)
		assert.ok(success, 'Edit should be applied successfully')

		// Verify the generated function
		const updatedContent = document.getText()
		assert.ok(updatedContent.includes('DEF FnCalculateTotal(OrderID, TotalAmount)'), 'Should generate function with inferred parameter names')
		assert.ok(updatedContent.includes('LET FnCalculateTotal=0'), 'Should have numeric return value')
		assert.ok(updatedContent.includes('FNEND'), 'Should have FNEND')
		assert.ok(updatedContent.includes('TODO: Implement FnCalculateTotal'), 'Should have TODO comment')

		console.log('Numeric function generation test passed')

		// Cleanup
		configuredProjects.delete(testWorkspaceFolder)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.commands.executeCommand('workbench.action.files.revert')
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
	})

	test('Generate string function with string parameters', async () => {
		console.log('Running string function generation test...')

		const testFilePath = path.join(__dirname, '../../../testcode/temp_quickfix_string.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `00010 DIM CustomerName$*50
00020
00030 LET Result$ = FnFormatName$(CustomerName$)
00040 PRINT Result$
00050
00060 END`

		await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(content))
		const document = await vscode.workspace.openTextDocument(testFileUri)
		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)
		assert.ok(testWorkspaceFolder, 'Workspace folder should exist')

		const project = {
			sourceFiles: new Map(),
			layouts: new Map(),
			libraryIndex: new LibraryFunctionIndex()
		}
		configuredProjects.set(testWorkspaceFolder, project)

		// Wait for diagnostics
		await new Promise(resolve => setTimeout(resolve, 200))
		diagnostics.updateDiagnostics(document)

		const diags = vscode.languages.getDiagnostics(testFileUri)
		const undefinedFuncDiag = diags.find(d => d.code === 'undefined-function')
		assert.ok(undefinedFuncDiag, 'Should have undefined function diagnostic')

		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)
		const context: vscode.CodeActionContext = {
			diagnostics: [undefinedFuncDiag],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			undefinedFuncDiag.range,
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(actions && actions.length > 0, 'Should provide code actions')

		// Apply the edit
		const success = await vscode.workspace.applyEdit(actions[0].edit!)
		assert.ok(success, 'Edit should be applied successfully')

		// Verify the generated function
		const updatedContent = document.getText()
		assert.ok(updatedContent.includes('DEF FnFormatName$(CustomerName$)'), 'Should generate string function with string parameter')
		assert.ok(updatedContent.includes('LET FnFormatName$=""'), 'Should have string return value')

		console.log('String function generation test passed')

		// Cleanup
		configuredProjects.delete(testWorkspaceFolder)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.commands.executeCommand('workbench.action.files.revert')
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
	})

	test('Generate function with array parameters', async () => {
		console.log('Running array parameter generation test...')

		const testFilePath = path.join(__dirname, '../../../testcode/temp_quickfix_arrays.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `00010 DIM Names$(10)*30, Scores(10)
00020
00030 LET Summary$ = FnGenerateReport$(Names$(), Scores())
00040 PRINT Summary$
00050
00060 END`

		await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(content))
		const document = await vscode.workspace.openTextDocument(testFileUri)
		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)
		assert.ok(testWorkspaceFolder, 'Workspace folder should exist')

		const project = {
			sourceFiles: new Map(),
			layouts: new Map(),
			libraryIndex: new LibraryFunctionIndex()
		}
		configuredProjects.set(testWorkspaceFolder, project)

		await new Promise(resolve => setTimeout(resolve, 200))
		diagnostics.updateDiagnostics(document)

		const diags = vscode.languages.getDiagnostics(testFileUri)
		const undefinedFuncDiag = diags.find(d => d.code === 'undefined-function')
		assert.ok(undefinedFuncDiag, 'Should have undefined function diagnostic')

		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)
		const context: vscode.CodeActionContext = {
			diagnostics: [undefinedFuncDiag],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			undefinedFuncDiag.range,
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(actions && actions.length > 0, 'Should provide code actions')

		// Apply the edit
		const success = await vscode.workspace.applyEdit(actions[0].edit!)
		assert.ok(success, 'Edit should be applied successfully')

		// Verify the generated function
		const updatedContent = document.getText()
		assert.ok(updatedContent.includes('DEF FnGenerateReport$(Mat Names$, Mat Scores)'), 'Should generate function with array parameters using MAT')
		assert.ok(updatedContent.includes('LET FnGenerateReport$=""'), 'Should have string return value')

		console.log('Array parameter generation test passed')

		// Cleanup
		configuredProjects.delete(testWorkspaceFolder)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.commands.executeCommand('workbench.action.files.revert')
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
	})

	test('Generate function with mixed parameter types', async () => {
		console.log('Running mixed parameter types test...')

		const testFilePath = path.join(__dirname, '../../../testcode/temp_quickfix_mixed.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `00010 DIM OrderID, Status$*20, Prices(10), Items$(10)*30
00020
00030 LET Valid = FnValidateOrder(OrderID, Status$, Prices(), Items$())
00040 PRINT Valid
00050
00060 END`

		await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(content))
		const document = await vscode.workspace.openTextDocument(testFileUri)
		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)
		assert.ok(testWorkspaceFolder, 'Workspace folder should exist')

		const project = {
			sourceFiles: new Map(),
			layouts: new Map(),
			libraryIndex: new LibraryFunctionIndex()
		}
		configuredProjects.set(testWorkspaceFolder, project)

		await new Promise(resolve => setTimeout(resolve, 200))
		diagnostics.updateDiagnostics(document)

		const diags = vscode.languages.getDiagnostics(testFileUri)
		const undefinedFuncDiag = diags.find(d => d.code === 'undefined-function')
		assert.ok(undefinedFuncDiag, 'Should have undefined function diagnostic')

		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)
		const context: vscode.CodeActionContext = {
			diagnostics: [undefinedFuncDiag],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			undefinedFuncDiag.range,
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(actions && actions.length > 0, 'Should provide code actions')

		// Apply the edit
		const success = await vscode.workspace.applyEdit(actions[0].edit!)
		assert.ok(success, 'Edit should be applied successfully')

		// Verify the generated function
		const updatedContent = document.getText()
		assert.ok(updatedContent.includes('DEF FnValidateOrder(OrderID, Status$, Mat Prices, Mat Items$)'),
			'Should generate function with all four parameter types')
		assert.ok(updatedContent.includes('LET FnValidateOrder=0'), 'Should have numeric return value')

		console.log('Mixed parameter types test passed')

		// Cleanup
		configuredProjects.delete(testWorkspaceFolder)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.commands.executeCommand('workbench.action.files.revert')
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
	})

	test('Use generic parameter names for literals and expressions', async () => {
		console.log('Running generic parameter names test...')

		const testFilePath = path.join(__dirname, '../../../testcode/temp_quickfix_literals.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `00010 DIM OrderID
00020
00030 LET Result = FnProcessOrder(OrderID + 100, "USD", 0.08)
00040 PRINT Result
00050
00060 END`

		await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(content))
		const document = await vscode.workspace.openTextDocument(testFileUri)
		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)
		assert.ok(testWorkspaceFolder, 'Workspace folder should exist')

		const project = {
			sourceFiles: new Map(),
			layouts: new Map(),
			libraryIndex: new LibraryFunctionIndex()
		}
		configuredProjects.set(testWorkspaceFolder, project)

		await new Promise(resolve => setTimeout(resolve, 200))
		diagnostics.updateDiagnostics(document)

		const diags = vscode.languages.getDiagnostics(testFileUri)
		const undefinedFuncDiag = diags.find(d => d.code === 'undefined-function')
		assert.ok(undefinedFuncDiag, 'Should have undefined function diagnostic')

		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)
		const context: vscode.CodeActionContext = {
			diagnostics: [undefinedFuncDiag],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			undefinedFuncDiag.range,
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(actions && actions.length > 0, 'Should provide code actions')

		// Apply the edit
		const success = await vscode.workspace.applyEdit(actions[0].edit!)
		assert.ok(success, 'Edit should be applied successfully')

		// Verify the generated function
		const updatedContent = document.getText()
		// Expression (OrderID + 100) should use generic name, literals should use generic names
		assert.ok(updatedContent.includes('DEF FnProcessOrder(Param1, Param2$, Param3)'),
			'Should use generic parameter names for expressions and literals')

		console.log('Generic parameter names test passed')

		// Cleanup
		configuredProjects.delete(testWorkspaceFolder)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.commands.executeCommand('workbench.action.files.revert')
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
	})

	test('No quick fix for non-undefined-function diagnostics', async () => {
		console.log('Running no quick fix test...')

		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00010 PRINT "Hello"'
		})

		await vscode.window.showTextDocument(document)

		const testWorkspaceFolder = vscode.workspace.workspaceFolders?.[0]
		if (testWorkspaceFolder) {
			const project = {
				sourceFiles: new Map(),
				layouts: new Map(),
				libraryIndex: new LibraryFunctionIndex()
			}
			configuredProjects.set(testWorkspaceFolder, project)
		}

		const quickFixProvider = new BrQuickFixProvider(configuredProjects, parser)

		// Create a diagnostic that's not undefined-function
		const context: vscode.CodeActionContext = {
			diagnostics: [{
				code: 'some-other-error',
				message: 'Some other error',
				range: new vscode.Range(0, 0, 0, 5),
				severity: vscode.DiagnosticSeverity.Error,
				source: 'test'
			}],
			only: undefined,
			triggerKind: vscode.CodeActionTriggerKind.Automatic
		}

		const actions = quickFixProvider.provideCodeActions(
			document,
			new vscode.Range(0, 0, 0, 5),
			context,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(!actions || actions.length === 0, 'Should not provide quick fix for non-undefined-function diagnostics')

		console.log('No quick fix test passed')

		// Cleanup
		if (testWorkspaceFolder) {
			configuredProjects.delete(testWorkspaceFolder)
		}
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})
