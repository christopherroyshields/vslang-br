import * as assert from 'assert'
import * as vscode from 'vscode'
import BrRenameProvider from '../../providers/BrRenameProvider'
import BrParser from '../../parser'
import path = require('path')

suite('BrRenameProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrRenameProvider tests.')

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

	test('Rename variable', async () => {
		console.log('Running variable rename test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `dim testVar
let testVar = 10
print testVar
let testVar = testVar + 5`
		})
		
		// Position on the first occurrence of testVar
		const position = new vscode.Position(0, 4)
		const newName = 'renamedVar'
		
		const renameProvider = new BrRenameProvider(parser)
		const workspaceEdit = await renameProvider.provideRenameEdits(
			document, 
			position, 
			newName,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(workspaceEdit, 'Should provide workspace edit for rename')
		
		const edits = workspaceEdit.get(document.uri)
		assert.ok(edits && edits.length > 0, 'Should have text edits')
		assert.ok(edits.length >= 3, 'Should rename multiple occurrences')
		
		// Verify all edits replace with the new name
		edits.forEach(edit => {
			assert.strictEqual(edit.newText, newName, 'All edits should use the new name')
		})
		
		console.log('Variable rename test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Rename function', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `def fnTestFunc(x)
  print x
fnend

let result = fnTestFunc(5)
print fnTestFunc(10)`
		})
		
		// Position on the function definition
		const position = new vscode.Position(0, 4)
		const newName = 'fnRenamedFunc'
		
		const renameProvider = new BrRenameProvider(parser)
		const workspaceEdit = await renameProvider.provideRenameEdits(
			document, 
			position, 
			newName,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(workspaceEdit, 'Should provide workspace edit for function rename')
		
		const edits = workspaceEdit.get(document.uri)
		assert.ok(edits && edits.length > 0, 'Should have text edits')
		assert.ok(edits.length >= 2, 'Should rename function definition and calls')
		
		console.log('Function rename test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Rename label', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `start:
print "Begin"
goto start
if x > 0 then goto start`
		})
		
		// Position on the label definition
		const position = new vscode.Position(0, 0)
		const newName = 'begin'
		
		const renameProvider = new BrRenameProvider(parser)
		const workspaceEdit = await renameProvider.provideRenameEdits(
			document, 
			position, 
			newName,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(workspaceEdit, 'Should provide workspace edit for label rename')
		
		const edits = workspaceEdit.get(document.uri)
		assert.ok(edits && edits.length > 0, 'Should have text edits')
		assert.ok(edits.length >= 2, 'Should rename label definition and goto references')
		
		console.log('Label rename test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Prepare rename for variable', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `dim myVariable
let myVariable = 10`
		})
		
		// Position on the variable
		const position = new vscode.Position(0, 4)
		
		const renameProvider = new BrRenameProvider(parser)
		const prepareResult = await renameProvider.prepareRename?.(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(prepareResult, 'Should provide prepare rename result')
		
		if (prepareResult instanceof vscode.Range) {
			assert.ok(prepareResult.start.line === 0, 'Should identify correct range for variable')
		} else if (prepareResult && 'range' in prepareResult) {
			assert.ok(prepareResult.range.start.line === 0, 'Should identify correct range for variable')
		}
		
		console.log('Prepare rename for variable test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Prepare rename for label with placeholder', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `mylabel:
goto mylabel`
		})
		
		// Position on the label
		const position = new vscode.Position(0, 0)
		
		const renameProvider = new BrRenameProvider(parser)
		const prepareResult = await renameProvider.prepareRename?.(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(prepareResult, 'Should provide prepare rename result for label')
		
		if (prepareResult && 'range' in prepareResult && 'placeholder' in prepareResult) {
			assert.strictEqual(prepareResult.placeholder, 'mylabel', 'Should provide label name without colon as placeholder')
			assert.ok(prepareResult.range.start.line === 0, 'Should identify correct range for label')
		}
		
		console.log('Prepare rename for label test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Reject rename for system function', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `print val("123")`
		})
		
		// Position on the system function "val"
		const position = new vscode.Position(0, 6)
		
		const renameProvider = new BrRenameProvider(parser)
		
		try {
			await renameProvider.prepareRename?.(
				document, 
				position, 
				new vscode.CancellationTokenSource().token
			)
			assert.fail('Should throw error for system function rename')
		} catch (error) {
			assert.ok(error instanceof Error, 'Should throw an error')
			assert.ok(error.message.includes('Cannot rename system function') || error.message.includes('No rename provider available'), 'Should indicate system functions cannot be renamed')
		}
		
		console.log('System function rename rejection test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Rename using test file', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)
		
		// Position on the function name in the call
		const position = new vscode.Position(0, 8) // "fnfoo" in the print statement
		const newName = 'fnRenamedFoo'
		
		const renameProvider = new BrRenameProvider(parser)
		const workspaceEdit = await renameProvider.provideRenameEdits(
			document, 
			position, 
			newName,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(workspaceEdit, 'Should provide workspace edit for test file rename')
		
		const edits = workspaceEdit.get(document.uri)
		assert.ok(edits && edits.length > 0, 'Should have text edits')
		assert.ok(edits.length >= 2, 'Should rename function definition and call')
		
		console.log('Test file rename test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})