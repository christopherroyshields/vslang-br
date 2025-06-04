import * as assert from 'assert'

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode'
import BrHoverProvider from '../../providers/BrHoverProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import TreeSitterSourceDocument from '../../class/TreeSitterSourceDocument'
import Layout from '../../class/Layout'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { MarkupContent } from 'vscode-languageclient'
import { readFileSync } from 'fs'
import path = require('path')

suite('BrHoverProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.')

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext) // Fixed by using type assertion since we don't need real context

	const projects = new Map<vscode.WorkspaceFolder, Project>()
	let testWorkspaceFolder: vscode.WorkspaceFolder
	let project: Project

	// Setup workspace and library files before running tests
	suiteSetup(async () => {
		console.log('Starting test suite setup...')
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		
		// Create a test workspace folder
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
		console.log('Workspace folder set up')
		
		// Set up library files in the mock project
		try {
			const testlibPath = path.join(testcodeDir, 'testlib.brs')
			console.log('Loading test library from:', testlibPath)
			const testlibContent = readFileSync(testlibPath, 'utf8')
			const testlibUri = Uri.file(testlibPath)
			const testlibBuffer = Buffer.from(testlibContent)
			const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
			
			console.log('Test library loaded successfully. Functions found:', testlibDoc.functions)
		} catch (error) {
			console.error('Failed to load test library:', error)
			throw error
		}
		
		console.log('Test suite setup complete')
	})

	test('Hover over internal function', async () => {
		console.log('Running internal function test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT val("123")'
		})
		
		const position = new vscode.Position(0, 7)
		
		const hoverProvider = new BrHoverProvider(projects, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("```br\nVAL(<string>)\n```\n---\nThe Val(A$) internal function returns A$ expressed as a numeric value rather than a string."),
			new vscode.Range(0,6,0,9)
		);
		
		try {
			assert.deepStrictEqual(hover, expectedHover)
			console.log('Internal function test passed')
		} catch (error) {
			console.error('Internal function test failed:', error)
			console.log('Actual hover:', hover)
			console.log('Expected hover:', expectedHover)
			throw error
		} finally {
			// Close the document/editor after test
			await vscode.window.showTextDocument(document)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		}
	})

	test('Hover over user defined function', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
		
		// Mock projects map for testing
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>()
		} as Project
		
		if (!testWorkspaceFolder) {
			throw new Error('No workspace folder found')
		}
		
		projects.set(testWorkspaceFolder, project)
		
		// Add the current document to project source files for local function lookup
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new TreeSitterSourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)
		
		const position = new vscode.Position(0, 10)
		
		const hoverProvider = new BrHoverProvider(projects, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("```br\nfnfoo(a,b,c)\n```\n---\ndescription This is a test function\r\n * @param `a` - First parameter description\r\n * @param `b` - Second parameter description\r\n * @param `c` - Third parameter description"),
			new vscode.Range(0,6,0,11)
		);
		
		try {
			assert.deepStrictEqual(hover, expectedHover)
		} catch (error) {
			console.error('Hover test failed:', error)
			console.log('Actual hover:', hover)
			console.log('Expected hover:', expectedHover)
			await vscode.window.showTextDocument(document)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			throw error
		}

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
	
	test('Hover over library function', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
		
		// Mock projects map for testing
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

		const testcodeDir = path.join(__dirname, '../../../testcode')
		const testlibPath = path.join(testcodeDir, 'testlib.brs')
		console.log('Loading test library from:', testlibPath)
		const testlibContent = readFileSync(testlibPath, 'utf8')
		const testlibUri = Uri.file(testlibPath)
		const testlibBuffer = Buffer.from(testlibContent)
		const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
		project.sourceFiles.set(testlibUri.toString(), testlibDoc)
		
		const position = new vscode.Position(16, 7)
		
		const hoverProvider = new BrHoverProvider(projects, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("```br\nfnbar(x,y$,z,[foo$])\n```\n---\nThis is a test library\r\n * @param `x` - First parameter\r\n * @param `y$` - Second parameter\r\n * @param `z` - Third parameter\r\n * @param `foo$` - Fourth parameter"),
			new vscode.Range(16,4,16,9)
		);
		
		try {
			assert.deepStrictEqual(hover, expectedHover)
		} catch (error) {
			console.error('Library hover test failed:', error)
			console.log('Actual hover:', hover)
			console.log('Expected hover:', expectedHover)
			console.log('Project source files:', Array.from(project.sourceFiles.keys()))
			await vscode.window.showTextDocument(document)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			throw error
		}

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

})
