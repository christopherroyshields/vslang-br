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
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.')

	// test('Sample test', () => {
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(5))
	// 	assert.strictEqual(-1, [1, 2, 3].indexOf(0))
	// })

	test('BrHoverProvider Tests', async () => {
		const parser = new BrParser()
		parser.activate({
			subscriptions: [{
				dispose: () => {return}
			}]
		} as vscode.ExtensionContext) // Fixed by using type assertion since we don't need real context
		const workspaceFolder = new Map<vscode.WorkspaceFolder, Project>()
		
		const folder: vscode.WorkspaceFolder = {
			uri: Uri.parse('file://test'),
			name: 'test',
			index: 0
		}

		const project: Project = {
			sourceFiles: new Map<string, TreeSitterSourceDocument>(),
			layouts: new Map<string, Layout>()
		}

		workspaceFolder.set(folder, project)

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
	})
})
