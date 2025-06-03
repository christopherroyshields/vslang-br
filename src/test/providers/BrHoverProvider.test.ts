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

	const workspaceFolder = new Map<vscode.WorkspaceFolder, Project>()
	
	const project: Project = {
		sourceFiles: new Map<string, TreeSitterSourceDocument>(),
		layouts: new Map<string, Layout>()
	}

	const folder = vscode.workspace.workspaceFolders?.[0]
	if (!folder) {
		throw new Error('Workspace folder not found')
	}
	
	workspaceFolder.set(folder, project)
	// Set up library files in the mock project
	const testlibPath = path.join(folder.uri.fsPath, 'testlib.brs')
	const testlibContent = readFileSync(testlibPath, 'utf8')
	const testlibUri = Uri.file(testlibPath)
	const testlibBuffer = Buffer.from(testlibContent)
	const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, folder)
	project.sourceFiles.set(testlibUri.toString(), testlibDoc)

	// Close all editors before running tests
	suiteSetup(async () => {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	})

	test('Hover over internal function', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT val("123")'
		})
		
		const position = new vscode.Position(0, 7)
		
		const hoverProvider = new BrHoverProvider(workspaceFolder, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("```br\nVAL(<string>)\n```\n---\nThe Val(A$) internal function returns A$ expressed as a numeric value rather than a string."),
			new vscode.Range(0,6,0,9)
		);
		
		assert.deepStrictEqual(hover, expectedHover)

		// Close the document/editor after test
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Hover over user defined function', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)
		
		const position = new vscode.Position(0, 10)
		
		const hoverProvider = new BrHoverProvider(workspaceFolder, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("'```br\nfnfoo(a,b,c)\n```\n---\ndescription This is a test function\r\n * @param `a` - First parameter description\r\n * @param `b` - Second parameter description\r\n * @param `c` - Third parameter description'"),
			new vscode.Range(0,6,0,11)
		);
		
		try {
			assert.deepStrictEqual(hover, expectedHover)
		} catch (error) {
			await vscode.window.showTextDocument(document)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			throw error
		}

		// Close the document/editor after test
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
	
	test('Hover over library function', async () => {
		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)
		
		const position = new vscode.Position(16, 7)
		
		const hoverProvider = new BrHoverProvider(workspaceFolder, parser)
		const hover = await hoverProvider.provideHover(document, position)

		const expectedHover = new vscode.Hover(
			new vscode.MarkdownString("```br\nfnbar(x,y$,z,foo$)\n```\n---\nThis is a test library\r\n * @param `x` - First parameter\r\n * @param `y$` - Second parameter\r\n * @param `z` - Third parameter\r\n * @param `foo$` - Fourth parameter"),
			new vscode.Range(12,6,12,11)
		);
		
		try {
			assert.deepStrictEqual(hover, expectedHover)
		} catch (error) {
			await vscode.window.showTextDocument(document)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
			throw error
		}

		// Close the document/editor after test
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

})
