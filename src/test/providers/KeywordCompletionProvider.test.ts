import * as assert from 'assert'
import * as vscode from 'vscode'
import KeywordCompletionProvider from '../../providers/KeywordCompletionProvider'

suite('KeywordCompletionProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start KeywordCompletionProvider tests.')

	test('Provide keyword completions', async () => {
		console.log('Running keyword completions test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		assert.ok(Array.isArray(completions), 'Should return an array of completions')
		assert.ok(completions.length > 0, 'Should have keyword completions')
		
		// Check for some expected keywords
		const keywordNames = completions.map(item => 
			typeof item.label === 'string' ? item.label : item.label.label
		)
		
		assert.ok(keywordNames.includes('while'), 'Should include while keyword')
		assert.ok(keywordNames.includes('fields'), 'Should include fields keyword')
		assert.ok(keywordNames.includes('until'), 'Should include until keyword')
		assert.ok(keywordNames.includes('wait'), 'Should include wait keyword')
		
		// Check completion item properties
		const whileCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'while'
		)
		
		if (whileCompletion) {
			assert.strictEqual(whileCompletion.kind, vscode.CompletionItemKind.Keyword, 'Should be keyword completion kind')
			if (typeof whileCompletion.label === 'object') {
				assert.strictEqual(whileCompletion.label.description, 'keyword', 'Should be marked as keyword')
			}
		}
		
		console.log('Keyword completions test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Case sensitivity - uppercase context', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'WHILE'
		})
		
		const position = new vscode.Position(0, 5) // After WHILE
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should provide uppercase completions when context is uppercase
		const whileCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'WHILE'
		)
		
		assert.ok(whileCompletion, 'Should provide uppercase completion in uppercase context')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Case sensitivity - lowercase context', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'while'
		})
		
		const position = new vscode.Position(0, 5) // After while
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should provide lowercase completions when context is lowercase
		const whileCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'while'
		)
		
		assert.ok(whileCompletion, 'Should provide lowercase completion in lowercase context')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Keyword with documentation', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Find a keyword that should have documentation (wait)
		const waitCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'wait'
		)
		
		assert.ok(waitCompletion, 'Should find wait keyword completion')
		assert.ok(waitCompletion.documentation, 'Should have documentation')
		
		if (waitCompletion.documentation instanceof vscode.MarkdownString) {
			assert.ok(waitCompletion.documentation.value.length > 0, 'Documentation should not be empty')
			assert.ok(waitCompletion.documentation.value.includes('WAIT='), 'Documentation should mention WAIT parameter')
		}
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Keywords without documentation', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Find a keyword that should not have documentation (while)
		const whileCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'while'
		)
		
		assert.ok(whileCompletion, 'Should find while keyword completion')
		
		// Should either have no documentation or empty documentation
		if (whileCompletion.documentation) {
			if (whileCompletion.documentation instanceof vscode.MarkdownString) {
				// Documentation may be empty for keywords without explicit docs
				assert.ok(typeof whileCompletion.documentation.value === 'string', 'Documentation should be string')
			}
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
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
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
				assert.strictEqual(completion.label.description, 'keyword', 'Should be marked as keyword')
				assert.ok(completion.label.label, 'Should have label text')
			}
		}
		
		console.log('All completions properties test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Empty document context', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: ''
		})
		
		const position = new vscode.Position(0, 0)
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		// Should still provide completions even in empty document
		assert.ok(completions, 'Should provide completions in empty document')
		assert.ok(completions.length > 0, 'Should have keyword completions in empty document')
		
		console.log('Empty document context test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Mixed case in existing word', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'WhIlE'
		})
		
		const position = new vscode.Position(0, 5) // After WhIlE
		
		const keywordProvider = new KeywordCompletionProvider()
		const completions = await keywordProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completions with mixed case context')
		
		// Should provide uppercase completions when there are uppercase letters in context
		const whileCompletion = completions.find(item => 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'WHILE'
		)
		
		assert.ok(whileCompletion, 'Should provide uppercase completion with mixed case context')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})