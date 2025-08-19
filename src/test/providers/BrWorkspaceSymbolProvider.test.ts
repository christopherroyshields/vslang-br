import * as assert from 'assert'
import * as vscode from 'vscode'
import BrWorkspaceSymbolProvider from '../../providers/BrWorkspaceSymbolProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import TreeSitterSourceDocument from '../../class/TreeSitterSourceDocument'
import Layout from '../../class/Layout'
import { readFileSync } from 'fs'
import path = require('path')

suite('BrWorkspaceSymbolProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrWorkspaceSymbolProvider tests.')

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

	const projects = new Map<vscode.WorkspaceFolder, Project>()
	let testWorkspaceFolder: vscode.WorkspaceFolder
	let project: Project

	suiteSetup(async () => {
		console.log('Starting BrWorkspaceSymbolProvider test suite setup...')
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		
		const testcodeDir = path.join(__dirname, '../../../testcode')
		console.log('Test directory:', testcodeDir)
		
		testWorkspaceFolder = {
			uri: Uri.file(testcodeDir),
			name: 'testcode',
			index: 0
		}
		
		project = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}
		
		projects.set(testWorkspaceFolder, project)
		console.log('BrWorkspaceSymbolProvider workspace folder set up')

		// Set up test files in the mock project
		try {
			// Add hovertest.brs
			const hovertestPath = path.join(testcodeDir, 'hovertest.brs')
			const hovertestContent = readFileSync(hovertestPath, 'utf8')
			const hovertestUri = Uri.file(hovertestPath)
			const hovertestBuffer = Buffer.from(hovertestContent)
			const hovertestDoc = new TreeSitterSourceDocument(parser, hovertestUri, hovertestBuffer, testWorkspaceFolder)
			project.sourceFiles.set(hovertestUri.toString(), hovertestDoc)

			// Add testlib.brs
			const testlibPath = path.join(testcodeDir, 'testlib.brs')
			const testlibContent = readFileSync(testlibPath, 'utf8')
			const testlibUri = Uri.file(testlibPath)
			const testlibBuffer = Buffer.from(testlibContent)
			const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
			project.sourceFiles.set(testlibUri.toString(), testlibDoc)
			
			console.log('Test files loaded successfully.')
		} catch (error) {
			console.error('Failed to load test files:', error)
			throw error
		}
		
		console.log('BrWorkspaceSymbolProvider test suite setup complete')
	})

	test('Provide workspace symbols', async () => {
		console.log('Running workspace symbols test...')
		
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, projects)
		const symbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'', // Empty query to get all symbols
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols, 'Should provide workspace symbols')
		assert.ok(Array.isArray(symbols), 'Should return an array of symbols')
		assert.ok(symbols.length > 0, 'Should have workspace symbols')
		
		// Check for functions from our test files
		const symbolNames = symbols.map(symbol => symbol.name)
		
		assert.ok(symbolNames.includes('fnfoo'), 'Should include fnfoo from hovertest.brs')
		assert.ok(symbolNames.includes('fnbar'), 'Should include fnbar from testlib.brs')
		
		// Check symbol properties
		const fnfooSymbol = symbols.find(symbol => symbol.name === 'fnfoo')
		
		if (fnfooSymbol) {
			assert.strictEqual(fnfooSymbol.kind, vscode.SymbolKind.Function, 'Should be function symbol kind')
			assert.ok(fnfooSymbol.location, 'Should have location')
			assert.ok(fnfooSymbol.location.uri, 'Should have URI in location')
		}
		
		console.log('Workspace symbols test passed')
	})

	test('Resolve workspace symbol', async () => {
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, projects)
		const symbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'',
			new vscode.CancellationTokenSource().token
		)

		const fnfooSymbol = symbols.find(symbol => symbol.name === 'fnfoo')
		assert.ok(fnfooSymbol, 'Should find fnfoo symbol')
		
		// Resolve the symbol to get accurate range
		const resolvedSymbol = await workspaceSymbolProvider.resolveWorkspaceSymbol(
			fnfooSymbol,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(resolvedSymbol, 'Should resolve workspace symbol')
		assert.strictEqual(resolvedSymbol.name, 'fnfoo', 'Resolved symbol should have same name')
		assert.ok(resolvedSymbol.location.range, 'Should have accurate range after resolution')
		
		// The range should not be the dummy range (0,0,0,0)
		const range = resolvedSymbol.location.range
		assert.ok(
			!(range.start.line === 0 && range.start.character === 0 && 
				range.end.line === 0 && range.end.character === 0),
			'Should have non-dummy range after resolution'
		)
		
		console.log('Resolve workspace symbol test passed')
	})

	test('Filter symbols with query', async () => {
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, projects)
		
		// Get all symbols first
		const allSymbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'',
			new vscode.CancellationTokenSource().token
		)
		
		// Note: This provider doesn't implement query filtering in the current implementation
		// It returns all symbols regardless of query. This test documents the current behavior.
		const filteredSymbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'fnfoo',
			new vscode.CancellationTokenSource().token
		)

		assert.ok(filteredSymbols, 'Should provide symbols for query')
		// Current implementation returns all symbols regardless of query
		assert.strictEqual(filteredSymbols.length, allSymbols.length, 'Current implementation returns all symbols')
		
		console.log('Filter symbols test passed')
	})

	test('Multiple workspace folders', async () => {
		// Create additional workspace folder
		const additionalProjects = new Map<vscode.WorkspaceFolder, Project>()
		
		// Copy existing project
		additionalProjects.set(testWorkspaceFolder, project)
		
		// Add another workspace folder
		const testWorkspaceFolder2 = {
			uri: Uri.file('/test/workspace2'),
			name: 'workspace2',
			index: 1
		}
		
		const project2 = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}
		
		// Add a mock function to the second project
		const mockUri = Uri.file('/test/workspace2/mock.brs')
		const mockContent = `def fnMockFunc(x)\n  return x\nfnend`
		const mockBuffer = Buffer.from(mockContent)
		const mockDoc = new TreeSitterSourceDocument(parser, mockUri, mockBuffer, testWorkspaceFolder2)
		project2.sourceFiles.set(mockUri.toString(), mockDoc)
		
		additionalProjects.set(testWorkspaceFolder2, project2)
		
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, additionalProjects)
		const symbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'',
			new vscode.CancellationTokenSource().token
		)

		assert.ok(symbols.length > 0, 'Should have symbols from multiple workspaces')
		
		// Should include symbols from both workspaces
		const symbolNames = symbols.map(symbol => symbol.name)
		assert.ok(symbolNames.includes('fnfoo'), 'Should include symbols from first workspace')
		assert.ok(symbolNames.includes('fnMockFunc'), 'Should include symbols from second workspace')
		
		console.log('Multiple workspace folders test passed')
	})

	test('Empty workspace', async () => {
		const emptyProjects = new Map<vscode.WorkspaceFolder, Project>()
		const emptyProject = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}
		emptyProjects.set(testWorkspaceFolder, emptyProject)
		
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, emptyProjects)
		const symbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'',
			new vscode.CancellationTokenSource().token
		)

		assert.ok(Array.isArray(symbols), 'Should return array for empty workspace')
		assert.strictEqual(symbols.length, 0, 'Should return empty array for empty workspace')
		
		console.log('Empty workspace test passed')
	})

	test('Symbol locations point to correct files', async () => {
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, projects)
		const symbols = await workspaceSymbolProvider.provideWorkspaceSymbols(
			'',
			new vscode.CancellationTokenSource().token
		)

		const fnfooSymbol = symbols.find(symbol => symbol.name === 'fnfoo')
		const fnbarSymbol = symbols.find(symbol => symbol.name === 'fnbar')
		
		assert.ok(fnfooSymbol, 'Should find fnfoo symbol')
		assert.ok(fnbarSymbol, 'Should find fnbar symbol')
		
		// Check that symbols point to correct files
		assert.ok(fnfooSymbol.location.uri.fsPath.includes('hovertest.brs'), 'fnfoo should point to hovertest.brs')
		assert.ok(fnbarSymbol.location.uri.fsPath.includes('testlib.brs'), 'fnbar should point to testlib.brs')
		
		console.log('Symbol locations test passed')
	})

	test('Resolve non-function symbol', async () => {
		// Create a mock symbol that's not a function
		const mockSymbol = new vscode.SymbolInformation(
			'mockVar',
			vscode.SymbolKind.Variable,
			'',
			new vscode.Location(Uri.file('/test/mock.brs'), new vscode.Range(0, 0, 0, 0))
		)
		
		const workspaceSymbolProvider = new BrWorkspaceSymbolProvider(parser, projects)
		const resolvedSymbol = await workspaceSymbolProvider.resolveWorkspaceSymbol(
			mockSymbol,
			new vscode.CancellationTokenSource().token
		)

		// Should return the same symbol for non-function symbols
		assert.strictEqual(resolvedSymbol.name, mockSymbol.name, 'Should return same symbol for non-function')
		assert.strictEqual(resolvedSymbol.kind, mockSymbol.kind, 'Should preserve symbol kind')
		
		console.log('Resolve non-function symbol test passed')
	})
})