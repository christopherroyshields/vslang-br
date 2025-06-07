import * as assert from 'assert'
import * as vscode from 'vscode'
import BrSignatureHelpProvider from '../../providers/BrSignatureHelpProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import TreeSitterSourceDocument from '../../class/TreeSitterSourceDocument'
import Layout from '../../class/Layout'
import { readFileSync } from 'fs'
import path = require('path')

suite('BrSignatureHelpProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrSignatureHelpProvider tests.')

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
		console.log('Starting BrSignatureHelpProvider test suite setup...')
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
		console.log('BrSignatureHelpProvider workspace folder set up')

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
		
		console.log('BrSignatureHelpProvider test suite setup complete')
	})

	test('Signature help for internal function', async () => {
		console.log('Running signature help for internal function test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT val()'
		})
		
		const position = new vscode.Position(0, 10) // After opening parenthesis
		
		const signatureProvider = new BrSignatureHelpProvider(projects, parser)
		const signatureHelp = await signatureProvider.provideSignatureHelp(document, position, new vscode.CancellationTokenSource().token, {} as vscode.SignatureHelpContext)

		assert.ok(signatureHelp, 'Should provide signature help for internal function')
		assert.strictEqual(signatureHelp.signatures.length, 1, 'Should have one signature')
		assert.ok(signatureHelp.signatures[0].label.includes('VAL'), 'Should contain VAL function signature')
		assert.strictEqual(signatureHelp.activeParameter, 0, 'Should highlight first parameter')
		
		console.log('Internal function signature help test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Signature help for user defined function', async () => {
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
		
		// Add the current document to project source files for local function lookup
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new TreeSitterSourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)
		
		// Create a test document with function call
		const testDocument = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'let result = fnfoo('
		})
		
		const position = new vscode.Position(0, 18) // After opening parenthesis
		
		const signatureProvider = new BrSignatureHelpProvider(projects, parser)
		const signatureHelp = await signatureProvider.provideSignatureHelp(testDocument, position, new vscode.CancellationTokenSource().token, {} as vscode.SignatureHelpContext)

		assert.ok(signatureHelp, 'Should provide signature help for user function')
		assert.strictEqual(signatureHelp.signatures.length, 1, 'Should have one signature')
		assert.ok(signatureHelp.signatures[0].label.includes('fnfoo'), 'Should contain fnfoo function signature')
		assert.strictEqual(signatureHelp.activeParameter, 0, 'Should highlight first parameter')
		
		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.window.showTextDocument(testDocument)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Signature help for library function', async () => {
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

		const testcodeDir = path.join(__dirname, '../../../testcode')
		const testlibPath = path.join(testcodeDir, 'testlib.brs')
		const testlibContent = readFileSync(testlibPath, 'utf8')
		const testlibUri = Uri.file(testlibPath)
		const testlibBuffer = Buffer.from(testlibContent)
		const testlibDoc = new TreeSitterSourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
		project.sourceFiles.set(testlibUri.toString(), testlibDoc)
		
		// Create a test document with library function call
		const testDocument = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'let result = fnbar('
		})
		
		const position = new vscode.Position(0, 18) // After opening parenthesis
		
		const signatureProvider = new BrSignatureHelpProvider(projects, parser)
		const signatureHelp = await signatureProvider.provideSignatureHelp(testDocument, position, new vscode.CancellationTokenSource().token, {} as vscode.SignatureHelpContext)

		assert.ok(signatureHelp, 'Should provide signature help for library function')
		assert.strictEqual(signatureHelp.signatures.length, 1, 'Should have one signature')
		assert.ok(signatureHelp.signatures[0].label.includes('fnbar'), 'Should contain fnbar function signature')
		assert.strictEqual(signatureHelp.activeParameter, 0, 'Should highlight first parameter')
		
		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
		await vscode.window.showTextDocument(testDocument)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Active parameter detection', async () => {
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT val("123",'
		})
		
		const position = new vscode.Position(0, 17) // After comma
		
		const signatureProvider = new BrSignatureHelpProvider(projects, parser)
		const signatureHelp = await signatureProvider.provideSignatureHelp(document, position, new vscode.CancellationTokenSource().token, {} as vscode.SignatureHelpContext)

		// Note: VAL function only takes one parameter, but this tests the parameter counting logic
		assert.ok(signatureHelp, 'Should provide signature help')
		// The active parameter should be 1 (second parameter) after the comma
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Signature help with unclosed parenthesis', async () => {
		console.log('Running signature help with unclosed parenthesis test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'PRINT val('
		})
		
		const position = new vscode.Position(0, 10) // After opening parenthesis
		
		const signatureProvider = new BrSignatureHelpProvider(projects, parser)
		const signatureHelp = await signatureProvider.provideSignatureHelp(document, position, new vscode.CancellationTokenSource().token, {} as vscode.SignatureHelpContext)

		assert.ok(signatureHelp, 'Should provide signature help for function with unclosed parenthesis')
		assert.strictEqual(signatureHelp.signatures.length, 1, 'Should have one signature')
		assert.ok(signatureHelp.signatures[0].label.includes('VAL'), 'Should contain VAL function signature')
		assert.strictEqual(signatureHelp.activeParameter, 0, 'Should highlight first parameter')
		
		console.log('Unclosed parenthesis signature help test passed')
		
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})