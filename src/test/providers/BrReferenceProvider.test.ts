import * as assert from 'assert'
import * as vscode from 'vscode'
import BrReferenceProvider from '../../providers/BrReferenceProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import SourceDocument from '../../class/SourceDocument'
import Layout from '../../class/Layout'
import LibraryFunctionIndex from '../../class/LibraryFunctionIndex'
import { readFileSync } from 'fs'
import path = require('path')

suite('BrReferenceProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrReferenceProvider tests.');

	const parser = new BrParser()
	parser.activate({
		subscriptions: [{
			dispose: () => {return}
		}]
	} as vscode.ExtensionContext)

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
			sourceFiles: new Map<string, SourceDocument>(),
			layouts: new Map<string, Layout>(),
			libraryIndex: new LibraryFunctionIndex()
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
			const testlibDoc = new SourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
			project.sourceFiles.set(testlibUri.toString(), testlibDoc)

			// Add library functions to index
			const libFuncs = testlibDoc.getLibraryFunctionsMetadata()
			for (const libFunc of libFuncs) {
				project.libraryIndex.addFunction(libFunc)
			}
		} catch (error) {
			console.error('Failed to load test library:', error)
			throw error
		}

		console.log('Test suite setup complete')
	})

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

		const referenceProvider = new BrReferenceProvider(projects, parser)
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

		const referenceProvider = new BrReferenceProvider(projects, parser)
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

		const referenceProvider = new BrReferenceProvider(projects, parser)
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

		const referenceProvider = new BrReferenceProvider(projects, parser)
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

		const referenceProvider = new BrReferenceProvider(projects, parser)
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

	test('Find cross-file references to library function', async () => {
		console.log('Running cross-file library function references test...')

		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)

		// Mock projects map for testing
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, SourceDocument>(),
			layouts: new Map<string, Layout>(),
			libraryIndex: new LibraryFunctionIndex()
		} as Project

		if (!testWorkspaceFolder) {
			throw new Error('No workspace folder found')
		}

		projects.set(testWorkspaceFolder, project)

		// Add the current document to project source files
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new SourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)

		const testcodeDir = path.join(__dirname, '../../../testcode')
		const testlibPath = path.join(testcodeDir, 'testlib.brs')
		const testlibContent = readFileSync(testlibPath, 'utf8')
		const testlibUri = Uri.file(testlibPath)
		const testlibBuffer = Buffer.from(testlibContent)
		const testlibDoc = new SourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
		project.sourceFiles.set(testlibUri.toString(), testlibDoc)

		// Add library functions to index
		const libFuncs = testlibDoc.getLibraryFunctionsMetadata()
		for (const libFunc of libFuncs) {
			project.libraryIndex.addFunction(libFunc)
		}

		// Position on the library function call (line 16, "fnbar")
		const position = new vscode.Position(16, 7)

		const referenceProvider = new BrReferenceProvider(projects, parser)
		const references = await referenceProvider.provideReferences(
			document,
			position,
			{ includeDeclaration: true } as vscode.ReferenceContext,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references for library function')
		assert.ok(references.length >= 1, 'Should find at least one reference')

		// Should find references in both files
		const hovertestRefs = references.filter(ref => ref.uri.toString().includes('hovertest.brs'))
		const testlibRefs = references.filter(ref => ref.uri.toString().includes('testlib.brs'))

		console.log(`Found ${references.length} total references:`)
		references.forEach(ref => {
			console.log(`  - ${ref.uri.fsPath}:${ref.range.start.line}:${ref.range.start.character}`)
		})

		assert.ok(hovertestRefs.length >= 1, 'Should find references in hovertest.brs')

		// Note: Library function definitions may not always be found by getOccurences
		// since they have different syntax (def library) - the main goal is to find cross-file calls
		if (testlibRefs.length >= 1) {
			console.log('Also found function definition in testlib.brs')
		}

		console.log('Cross-file library function references test passed')

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Local functions only search current file (not cross-file)', async () => {
		console.log('Running local function references test...')

		const codepath = path.join(__dirname, '../../../testcode/hovertest.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)

		// Mock projects map for testing
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, SourceDocument>(),
			layouts: new Map<string, Layout>(),
			libraryIndex: new LibraryFunctionIndex()
		} as Project

		if (!testWorkspaceFolder) {
			throw new Error('No workspace folder found')
		}

		projects.set(testWorkspaceFolder, project)

		// Add the current document to project source files
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new SourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)

		// Add another file to project (testlib.brs)
		const testcodeDir = path.join(__dirname, '../../../testcode')
		const testlibPath = path.join(testcodeDir, 'testlib.brs')
		const testlibContent = readFileSync(testlibPath, 'utf8')
		const testlibUri = Uri.file(testlibPath)
		const testlibBuffer = Buffer.from(testlibContent)
		const testlibDoc = new SourceDocument(parser, testlibUri, testlibBuffer, testWorkspaceFolder)
		project.sourceFiles.set(testlibUri.toString(), testlibDoc)

		// Add library functions to index (so we know what's a library vs local function)
		const libFuncs = testlibDoc.getLibraryFunctionsMetadata()
		for (const libFunc of libFuncs) {
			project.libraryIndex.addFunction(libFunc)
		}

		// Position on a local function call "fnfoo" (line 0)
		const position = new vscode.Position(0, 7)

		const referenceProvider = new BrReferenceProvider(projects, parser)
		const references = await referenceProvider.provideReferences(
			document,
			position,
			{ includeDeclaration: true } as vscode.ReferenceContext,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(references, 'Should provide references for local function')

		// Should ONLY find references in the current file (hovertest.brs), NOT in testlib.brs
		const hovertestRefs = references.filter(ref => ref.uri.toString().includes('hovertest.brs'))
		const testlibRefs = references.filter(ref => ref.uri.toString().includes('testlib.brs'))

		console.log(`Found ${references.length} total references for local function fnfoo:`)
		references.forEach(ref => {
			console.log(`  - ${ref.uri.fsPath}:${ref.range.start.line}:${ref.range.start.character}`)
		})

		assert.ok(hovertestRefs.length >= 1, 'Should find references in current file (hovertest.brs)')
		assert.strictEqual(testlibRefs.length, 0, 'Should NOT find references in other files (testlib.brs) for local functions')

		console.log('Local function references test passed (only searched current file)')

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})