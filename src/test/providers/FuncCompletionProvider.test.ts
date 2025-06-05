import * as assert from 'assert'
import * as vscode from 'vscode'
import FuncCompletionProvider from '../../providers/FuncCompletionProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import TreeSitterSourceDocument from '../../class/TreeSitterSourceDocument'
import Layout from '../../class/Layout'
import { readFileSync } from 'fs'
import path = require('path')

suite('FuncCompletionProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start FuncCompletionProvider tests.')

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
		console.log('Starting FuncCompletionProvider test suite setup...')
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		
		const testcodeDir = path.join(__dirname, '../../../testcode')
		console.log('Test directory:', testcodeDir)
		
		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]) {
			testWorkspaceFolder = vscode.workspace.workspaceFolders[0]
		} else {
			throw new Error('No workspace folder found')
		}
		
		project = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}
		
		projects.set(testWorkspaceFolder, project)
		console.log('FuncCompletionProvider workspace folder set up')

		// Set up library files in the mock project
		try {
			const testlibPath = path.join(testcodeDir, 'testlib.brs')
			console.log('Loading test library from:', testlibPath)
			const testlibContent = readFileSync(testlibPath, 'utf8')
			const testlibUri = Uri.file(testlibPath)
			const testlibBuffer = Buffer.from(testlibContent)
			const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
			project.sourceFiles.set(testlibUri.toString(), testlibDoc)
			
			console.log('Test library loaded successfully.')
		} catch (error) {
			console.error('Failed to load test library:', error)
			throw error
		}
		
		console.log('FuncCompletionProvider test suite setup complete')
	})

	test('Provide library function completions', async () => {
		console.log('Running library function completions test...')
		
		// Create a temporary file in the test workspace
		const testFilePath = path.join(__dirname, '../../../testcode/temp_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)
		
		// Write initial content to file
		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from('let result = ')
		)
		
		// Open the saved document
		const document = await vscode.workspace.openTextDocument(testFileUri)
		const position = new vscode.Position(0, 13) // After the equals sign
		
		const funcCompletionProvider = new FuncCompletionProvider(projects, parser)
		const completions = await funcCompletionProvider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		assert.ok(Array.isArray(completions), 'Should return an array of completions')
		
		// Look for the library function from testlib.brs
		const libFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnbar'
		)
		
		assert.ok(libFunctionCompletion, 'Should find library function completion')
		assert.strictEqual(libFunctionCompletion.kind, vscode.CompletionItemKind.Function, 'Should be function completion kind')
		assert.ok(libFunctionCompletion.isLibrary, 'Should be marked as library function')
		
		console.log('Library function completions test passed')
		
		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
		
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Resolve completion item details', async () => {
		// Create a temporary file in the test workspace
		const testFilePath = path.join(__dirname, '../../../testcode/temp_resolve_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)
		
		// Write initial content to file
		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from('let result = ')
		)
		
		// Open the saved document
		const document = await vscode.workspace.openTextDocument(testFileUri)
		const position = new vscode.Position(0, 13)
		
		const funcCompletionProvider = new FuncCompletionProvider(projects, parser)
		const completions = await funcCompletionProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions && completions.length > 0, 'Should have completions to resolve')
		
		const libFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnbar'
		)
		
		assert.ok(libFunctionCompletion, 'Should find library function completion')
		
		// Resolve the completion item
		const resolvedItem = await funcCompletionProvider.resolveCompletionItem(
			libFunctionCompletion,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(resolvedItem, 'Should resolve completion item')
		assert.ok(resolvedItem.detail, 'Should have detail information')
		assert.ok(resolvedItem.detail.includes('fnbar'), 'Detail should contain function name')
		assert.ok(resolvedItem.detail.includes('library function'), 'Detail should indicate library function')
		assert.ok(resolvedItem.documentation, 'Should have documentation')
		
		console.log('Resolve completion item test passed')
		
		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}
		
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Exclude current document functions', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
		
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>()
		} as Project
		
		if (!testWorkspaceFolder) {
			throw new Error('No workspace folder found')
		}
		
		projects.set(testWorkspaceFolder, project)
		
		// Add the current document to project source files
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new TreeSitterSourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)

		// Add test library
		const testcodeDir = path.join(__dirname, '../../../testcode')
		const testlibPath = path.join(testcodeDir, 'testlib.brs')
		const testlibContent = readFileSync(testlibPath, 'utf8')
		const testlibUri = Uri.file(testlibPath)
		const testlibBuffer = Buffer.from(testlibContent)
		const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
		project.sourceFiles.set(testlibUri.toString(), testlibDoc)
		
		const position = new vscode.Position(1, 0) // Empty line
		
		const funcCompletionProvider = new FuncCompletionProvider(projects, parser)
		const completions = await funcCompletionProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should not include functions from current document (fnfoo)
		const localFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnfoo'
		)
		
		assert.ok(!localFunctionCompletion, 'Should not include functions from current document')
		
		// Should include library functions from other files
		const libFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnbar'
		)
		
		assert.ok(libFunctionCompletion, 'Should include library functions from other files')
		
		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Only include library functions', async () => {
		// Create a mock document with both library and non-library functions
		const mockUri = Uri.file('/test/mock.brs')
		const mockContent = `def fnLocalFunc(x)
  return x
fnend

def library fnLibraryFunc(y)
  return y
fnend`
		const mockBuffer = Buffer.from(mockContent)
		const mockDoc = new TreeSitterSourceDocument(parser, mockUri, mockBuffer, testWorkspaceFolder)
		project.sourceFiles.set(mockUri.toString(), mockDoc)
		
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'let result = '
		})
		
		const position = new vscode.Position(0, 13)
		
		const funcCompletionProvider = new FuncCompletionProvider(projects, parser)
		const completions = await funcCompletionProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		
		// Should include library function
		const libFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnLibraryFunc'
		)
		
		assert.ok(libFunctionCompletion, 'Should include library function')
		
		// Should not include regular function
		const localFunctionCompletion = completions.find(item => 
			item.label && 
			(typeof item.label === 'string' ? item.label : item.label.label) === 'fnLocalFunc'
		)
		
		assert.ok(!localFunctionCompletion, 'Should not include non-library functions')
		
		// Clean up
		project.sourceFiles.delete(mockUri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Handle empty project', async () => {
		const emptyProjects = new Map<vscode.WorkspaceFolder, Project>()
		const emptyProject = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}
		emptyProjects.set(testWorkspaceFolder, emptyProject)
		
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'let result = '
		})
		
		const position = new vscode.Position(0, 13)
		
		const funcCompletionProvider = new FuncCompletionProvider(emptyProjects, parser)
		const completions = await funcCompletionProvider.provideCompletionItems(
			document, 
			position, 
			new vscode.CancellationTokenSource().token
		)

		assert.ok(completions, 'Should provide completion items')
		assert.strictEqual(completions.length, 0, 'Should return empty array for empty project')
		
		console.log('Empty project test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})