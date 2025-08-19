import * as assert from 'assert'
import * as vscode from 'vscode'
import BrSymbolProvider from '../../providers/BrSymbolProvider'
import BrParser from '../../parser'
import path = require('path')

suite('BrSymbolProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrSymbolProvider tests.')

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

	test('Provide symbols for functions', async () => {
		console.log('Running function symbols test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `def fnTestFunc(x)
  print x
fnend

def library fnLibFunc(y$)
  print y$
fnend`
		})
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide symbols')
		
		const functionSymbols = symbols.filter(symbol => 
			symbol.kind === vscode.SymbolKind.Function ||
			(symbol instanceof vscode.DocumentSymbol && symbol.detail === 'function')
		)
		
		assert.ok(functionSymbols.length >= 2, 'Should find both function definitions')
		
		const testFuncSymbol = functionSymbols.find(symbol => symbol.name === 'fnTestFunc')
		const libFuncSymbol = functionSymbols.find(symbol => symbol.name === 'fnLibFunc')
		
		assert.ok(testFuncSymbol, 'Should find fnTestFunc symbol')
		assert.ok(libFuncSymbol, 'Should find fnLibFunc symbol')
		
		console.log('Function symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Provide symbols for variables', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `dim testVar
dim anotherVar$*100
dim numArray(10)
dim strArray$(5)`
		})
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide symbols')
		
		const variableSymbols = symbols.filter(symbol => 
			(symbol instanceof vscode.DocumentSymbol && symbol.kind === vscode.SymbolKind.Variable)
		)
		
		assert.ok(variableSymbols.length >= 4, 'Should find all variable declarations')
		const varNames = variableSymbols.map(symbol => symbol.name)
		assert.ok(varNames.includes('testVar'), 'Should find testVar')
		assert.ok(varNames.includes('anotherVar$'), 'Should find anotherVar$')
		assert.ok(varNames.includes('numArray'), 'Should find numArray')
		assert.ok(varNames.includes('strArray$'), 'Should find strArray$')
		
		console.log('Variable symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Provide symbols for labels', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `start: !
print "Begin"
loop: !
  print "In loop"
  if x > 0 then goto loop
goto start`
		})
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide symbols')
		
		const labelSymbols = symbols.filter(symbol => 
			symbol.kind === vscode.SymbolKind.Null ||
			(symbol instanceof vscode.DocumentSymbol && symbol.detail === 'label')
		)
		
		assert.ok(labelSymbols.length >= 2, 'Should find both labels')
		
		const labelNames = labelSymbols.map(symbol => symbol.name)
		assert.ok(labelNames.some(name => name.includes('start')), 'Should find start label')
		assert.ok(labelNames.some(name => name.includes('loop')), 'Should find loop label')
		
		console.log('Label symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Provide mixed symbols', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `dim counter
def fnIncrement(x)
  let counter = counter + 1
  return x + 1
fnend

start:
  let result = fnIncrement(counter)
  if result > 10 then goto end
  goto start
end:`
		})
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide symbols')
		assert.ok(symbols.length >= 4, 'Should find multiple symbol types')
		
		// Check for different symbol types
		const hasFunction = symbols.some(symbol => 
			symbol.kind === vscode.SymbolKind.Function ||
			(symbol instanceof vscode.DocumentSymbol && symbol.detail === 'function')
		)
		const hasVariable = symbols.some(symbol => 
			(symbol instanceof vscode.DocumentSymbol && symbol.kind === vscode.SymbolKind.Variable) ||
			(!(symbol instanceof vscode.DocumentSymbol) && typeof symbol === 'object' && symbol !== null && 'kind' in symbol && (symbol as any).kind === vscode.SymbolKind.Variable)
		)
		const hasLabel = symbols.some(symbol => 
			(symbol instanceof vscode.DocumentSymbol && symbol.detail === 'label') ||
			(!(symbol instanceof vscode.DocumentSymbol) && typeof symbol === 'object' && symbol !== null && 'kind' in symbol && (symbol as any).kind === vscode.SymbolKind.Null)
		)
		
		assert.ok(hasFunction, 'Should find function symbols')
		assert.ok(hasVariable, 'Should find variable symbols')
		assert.ok(hasLabel, 'Should find label symbols')
		
		console.log('Mixed symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Provide symbols for test file', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide symbols for test file')
		assert.ok(symbols.length > 0, 'Should find symbols in test file')
		
		// Look for the fnfoo function
		const fnfooSymbol = symbols.find(symbol => symbol.name === 'fnfoo')
		assert.ok(fnfooSymbol, 'Should find fnfoo function symbol')
		
		// Verify symbol properties
		if (fnfooSymbol instanceof vscode.DocumentSymbol) {
			assert.strictEqual(fnfooSymbol.detail, 'function', 'Should identify as function')
			assert.strictEqual(fnfooSymbol.kind, vscode.SymbolKind.Function, 'Should have function symbol kind')
		}
		
		console.log('Test file symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Empty document symbols', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: `! Just a comment
print "hello world"`
		})
		
		const symbolProvider = new BrSymbolProvider(parser)
		const symbols = await symbolProvider.provideDocumentSymbols(
			document, 
			new vscode.CancellationTokenSource().token
		)

		// Should return empty array or no symbols for documents without declarations
		assert.ok(Array.isArray(symbols), 'Should return an array')
		
		console.log('Empty document symbols test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})