import * as assert from 'assert'
import * as vscode from 'vscode'
import StatementCompletionProvider from '../../providers/StatementCompletionProvider'

suite('StatementCompletionProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start StatementCompletionProvider tests.')

	test('Provide statement completions', async () => {
		console.log('Running statement completions test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		assert.ok(Array.isArray(completions), 'Should return an array of completions')
		assert.ok(completions.length > 0, 'Should have statement completions')
		
		// Check for some common statements
		const statementNames = completions.map(item => 
			typeof item.label === 'string' ? item.label : item.label.label
		)
		
		assert.ok(statementNames.includes('print'), 'Should include print statement')
		assert.ok(statementNames.includes('dim'), 'Should include dim statement')
		assert.ok(statementNames.includes('def'), 'Should include def statement')
		assert.ok(statementNames.includes('if'), 'Should include if statement')
		
		// Check completion item properties
		const printCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'print'
		)
		
		if (printCompletion) {
			assert.strictEqual(printCompletion.kind, vscode.CompletionItemKind.Keyword, 'Should be keyword completion kind')
			assert.ok(printCompletion.detail, 'Should have detail')
		}
		
		console.log('Statement completions test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Case sensitivity - uppercase context', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT'
		})
		
		const position = new vscode.Position(0, 5) // After PRINT
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should provide uppercase completions when context is uppercase
		const printCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'PRINT'
		)
		
		assert.ok(printCompletion, 'Should provide uppercase completion in uppercase context')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Case sensitivity - lowercase context', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'print'
		})
		
		const position = new vscode.Position(0, 5) // After print
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should provide lowercase completions when context is lowercase
		const printCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'print'
		)
		
		assert.ok(printCompletion, 'Should provide lowercase completion in lowercase context')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Statement with documentation', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Find a statement that should have documentation (def)
		const defCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'def'
		)
		
		assert.ok(defCompletion, 'Should find def statement completion')
		assert.ok(defCompletion.detail, 'Should have detail')
		assert.ok(defCompletion.documentation, 'Should have documentation')
		
		if (defCompletion.documentation instanceof vscode.MarkdownString) {
			assert.ok(defCompletion.documentation.value.length > 0, 'Documentation should not be empty')
			assert.ok(defCompletion.documentation.value.includes('function'), 'Documentation should mention function')
		}
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Statement with example', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Find a statement that should have an example (def)
		const defCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'def'
		)
		
		assert.ok(defCompletion, 'Should find def statement completion')
		
		if (defCompletion.documentation instanceof vscode.MarkdownString) {
			assert.ok(defCompletion.documentation.value.includes('def fnfoo'), 'Should include example code')
			assert.ok(defCompletion.documentation.value.includes('fnend'), 'Should include complete example')
		}
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Statement with documentation URL', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Find a statement that should have a documentation URL
		const defCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'def'
		)
		
		assert.ok(defCompletion, 'Should find def statement completion')
		
		if (defCompletion.documentation instanceof vscode.MarkdownString) {
			assert.ok(defCompletion.documentation.value.includes('docs...'), 'Should include documentation link')
			assert.ok(defCompletion.documentation.value.includes('brwiki'), 'Should link to BR wiki')
		}
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('All completions have correct properties', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions.length > 0, 'Should have completions')
		
		// Check that all completions have required properties
		for (const completion of completions) {
			assert.ok(completion.label, 'Should have label')
			assert.strictEqual(completion.kind, vscode.CompletionItemKind.Keyword, 'Should be keyword kind')
			
			if (typeof completion.label === 'object') {
				assert.strictEqual(completion.label.description, 'statement', 'Should be marked as statement')
			}
		}
		
		console.log('All completions properties test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Multi-word statements', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const statementProvider = new StatementCompletionProvider()
		const completions = await statementProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Check for multi-word statements
		const statementNames = completions.map(item => 
			typeof item.label === 'string' ? item.label : item.label.label
		)
		
		assert.ok(statementNames.includes('def library'), 'Should include def library statement')
		assert.ok(statementNames.includes('end if'), 'Should include end if statement')
		assert.ok(statementNames.includes('exit do'), 'Should include exit do statement')
		
		console.log('Multi-word statements test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})