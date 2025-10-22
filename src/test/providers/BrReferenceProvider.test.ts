import * as assert from 'assert'
import * as vscode from 'vscode'
import BrReferenceProvider from '../../providers/BrReferenceProvider'
import BrParser from '../../parser'
import path = require('path')

suite('BrReferenceProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrReferenceProvider tests.');

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

	test('Find references to variable', async () => {
		console.log('Running variable references test...')
		
		// Create a temporary file in the test workspace
		const testFilePath = path.join(__dirname, '../../../testcode/temp_var_refs_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)
		
		// Write content to file
		const content = `dim testVar
let testVar = 10
print testVar
let testVar = testVar + 5`

		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from(content)
		)
		
		// Open the saved document
		const document = await vscode.workspace.openTextDocument(testFileUri)
		
		// Position on the first occurrence of testVar
		const position = new vscode.Position(0, 4)
		
		const referenceProvider = new BrReferenceProvider(parser)
		const references = await referenceProvider.provideReferences(
			document, 
			position, 
			{ includeDeclaration: true } as vscode.ReferenceContext, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references')
		assert.ok(references.length >= 3, 'Should find multiple references to the variable')
		
		// Verify all references are in the same document
		references.forEach(ref => {
			assert.strictEqual(ref.uri.toString(), document.uri.toString(), 'All references should be in the same document')
		})
		
		console.log('Variable references test passed')
		
		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
		
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find references to function name', async () => {
		// Create a temporary file in the test workspace
		const testFilePath = path.join(__dirname, '../../../testcode/temp_func_refs_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)
		
		// Write content to file
		const content = `def fnTestFunc(x)
  print x
fnend

let result = fnTestFunc(5)
print fnTestFunc(10)`

		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from(content)
		)
		
		// Open the saved document
		const document = await vscode.workspace.openTextDocument(testFileUri)
		
		// Position on the function definition
		const position = new vscode.Position(0, 4)
		
		const referenceProvider = new BrReferenceProvider(parser)
		const references = await referenceProvider.provideReferences(
			document, 
			position, 
			{ includeDeclaration: true } as vscode.ReferenceContext, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references')
		assert.ok(references.length >= 2, 'Should find function definition and calls')
		
		console.log('Function references test passed')
		
		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
		
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find references to label', async () => {
		// Create a temporary file in the test workspace
		const testFilePath = path.join(__dirname, '../../../testcode/temp_label_refs_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)
		
		// Write content to file
		const content = `start:
print "Begin"
goto start
if x > 0 then goto start`

		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from(content)
		)
		
		// Open the saved document
		const document = await vscode.workspace.openTextDocument(testFileUri)
		
		// Position on the label definition
		const position = new vscode.Position(0, 0)
		
		const referenceProvider = new BrReferenceProvider(parser)
		const references = await referenceProvider.provideReferences(
			document, 
			position, 
			{ includeDeclaration: true } as vscode.ReferenceContext, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references')
		assert.ok(references.length >= 2, 'Should find label definition and goto statements')
		
		console.log('Label references test passed')
		
		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
		
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('No references for non-existent symbol', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `dim testVar
print "hello world"`
		})
		
		// Position on a word that doesn't have other references
		const position = new vscode.Position(1, 6) // "hello"
		
		const referenceProvider = new BrReferenceProvider(parser)
		const references = await referenceProvider.provideReferences(
			document, 
			position, 
			{ includeDeclaration: true } as vscode.ReferenceContext, 
			new vscode.CancellationTokenSource().token
		)

		// Should return empty array or undefined for strings
		assert.ok(!references || references.length === 0, 'Should not find references for string literals')
		
		console.log('No references test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find references using test file', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)
		
		// Position on the function name in the call
		const position = new vscode.Position(0, 8) // "fnfoo" in the print statement
		
		const referenceProvider = new BrReferenceProvider(parser)
		const references = await referenceProvider.provideReferences(
			document, 
			position, 
			{ includeDeclaration: true } as vscode.ReferenceContext, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references')
		assert.ok(references.length >= 2, 'Should find function definition and call')
		
		// Verify references point to correct locations
		const definitionRef = references.find(ref => ref.range.start.line === 8) // Function definition line
		const callRef = references.find(ref => ref.range.start.line === 0) // Function call line
		
		assert.ok(definitionRef, 'Should find function definition reference')
		assert.ok(callRef, 'Should find function call reference')
		
		console.log('Test file references test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})