import * as assert from 'assert'
import * as vscode from 'vscode'
import BrDefinitionProvider from '../../providers/BrDefinitionProvider'
import BrParser from '../../parser'
import { Project } from '../../class/Project'
import { Uri } from 'vscode'
import SourceDocument from '../../class/SourceDocument'
import Layout from '../../class/Layout'
import LibraryFunctionIndex from '../../class/LibraryFunctionIndex'
import { readFileSync } from 'fs'
import path = require('path')

suite('BrDefinitionProvider Test Suite', () => {
	vscode.window.showInformationMessage('Start BrDefinitionProvider tests.')

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

	test('Find definition of local function', async () => {
		console.log('Running local function definition test...')
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

		// Add the current document to project source files for local function lookup
		const documentContent = document.getText()
		const documentBuffer = Buffer.from(documentContent)
		const documentSource = new SourceDocument(parser, uri, documentBuffer, testWorkspaceFolder)
		project.sourceFiles.set(uri.toString(), documentSource)

		// Position on the function call (line 0, "fnfoo")
		const position = new vscode.Position(0, 10)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(definition, 'Should provide definition for local function')

		// Check if it's a single Location
		if (definition instanceof vscode.Location) {
			assert.strictEqual(definition.uri.toString(), uri.toString(), 'Definition should be in the same file')
			assert.strictEqual(definition.range.start.line, 8, 'Definition should be on line 8 (function def line)')
		} else if (Array.isArray(definition)) {
			assert.strictEqual(definition.length, 1, 'Should return one definition')
			assert.strictEqual(definition[0].uri.toString(), uri.toString(), 'Definition should be in the same file')
			assert.strictEqual(definition[0].range.start.line, 8, 'Definition should be on line 8 (function def line)')
		}

		console.log('Local function definition test passed')

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find definition of library function', async () => {
		console.log('Running library function definition test...')
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

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(definition, 'Should provide definition for library function')

		// Check if it's a single Location
		if (definition instanceof vscode.Location) {
			assert.strictEqual(definition.uri.toString(), testlibUri.toString(), 'Definition should be in testlib.brs')
			assert.strictEqual(definition.range.start.line, 7, 'Definition should be on line 7 (library function def line)')
		} else if (Array.isArray(definition)) {
			assert.strictEqual(definition.length, 1, 'Should return one definition')
			assert.strictEqual(definition[0].uri.toString(), testlibUri.toString(), 'Definition should be in testlib.brs')
			assert.strictEqual(definition[0].range.start.line, 7, 'Definition should be on line 7 (library function def line)')
		}

		console.log('Library function definition test passed')

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find definition of label', async () => {
		console.log('Running label definition test...')

		// Create a temporary file with labels
		const testFilePath = path.join(__dirname, '../../../testcode/temp_label_def_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `start:
print "Begin"
goto start
if x > 0 then goto start
end:`

		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from(content)
		)

		const document = await vscode.workspace.openTextDocument(testFileUri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)

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

		// Position on the label reference (line 2, "goto start")
		const position = new vscode.Position(2, 8)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(definition, 'Should provide definition for label')

		// Check if it's a single Location
		if (definition instanceof vscode.Location) {
			assert.strictEqual(definition.range.start.line, 0, 'Definition should be on line 0 (label definition line)')
		} else if (Array.isArray(definition)) {
			assert.strictEqual(definition.length, 1, 'Should return one definition')
			assert.strictEqual(definition[0].range.start.line, 0, 'Definition should be on line 0 (label definition line)')
		}

		console.log('Label definition test passed')

		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}

		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find definition of variable', async () => {
		console.log('Running variable definition test...')

		// Create a temporary file with variable definitions
		const testFilePath = path.join(__dirname, '../../../testcode/temp_var_def_test.brs')
		const testFileUri = vscode.Uri.file(testFilePath)

		const content = `dim myVar
let myVar = 10
print myVar
let myVar = myVar + 5`

		await vscode.workspace.fs.writeFile(
			testFileUri,
			Buffer.from(content)
		)

		const document = await vscode.workspace.openTextDocument(testFileUri)

		const testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(testFileUri)

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

		// Position on the variable usage (line 1, "myVar")
		const position = new vscode.Position(1, 6)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(definition, 'Should provide definition for variable')

		// Check if it's a single Location
		if (definition instanceof vscode.Location) {
			assert.strictEqual(definition.range.start.line, 0, 'Definition should be on line 0 (DIM statement line)')
		} else if (Array.isArray(definition)) {
			assert.strictEqual(definition.length, 1, 'Should return one definition')
			assert.strictEqual(definition[0].range.start.line, 0, 'Definition should be on line 0 (DIM statement line)')
		}

		console.log('Variable definition test passed')

		// Cleanup
		try {
			await vscode.workspace.fs.delete(testFileUri)
		} catch (error) {
			console.error('Failed to cleanup test file:', error)
		}

		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('No definition for system function', async () => {
		console.log('Running system function test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'print val("123")'
		})

		// Position on the system function "val"
		const position = new vscode.Position(0, 7)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.strictEqual(definition, undefined, 'Should not provide definition for system function')

		console.log('System function test passed')

		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Case-insensitive function lookup', async () => {
		console.log('Running case-insensitive lookup test...')
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

		// Position on the case-variant function call (line 17, "fNbar" with mixed case)
		const position = new vscode.Position(17, 7)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.ok(definition, 'Should provide definition for case-variant function name')

		// Check if it's a single Location
		if (definition instanceof vscode.Location) {
			assert.strictEqual(definition.uri.toString(), testlibUri.toString(), 'Definition should be in testlib.brs')
		} else if (Array.isArray(definition)) {
			assert.ok(definition.length >= 1, 'Should return at least one definition')
			assert.strictEqual(definition[0].uri.toString(), testlibUri.toString(), 'Definition should be in testlib.brs')
		}

		console.log('Case-insensitive lookup test passed')

		// Clean up
		project.sourceFiles.delete(uri.toString())
		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('No definition for non-existent symbol', async () => {
		console.log('Running non-existent symbol test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'print "hello world"'
		})

		// Position on a string literal (no definition available)
		const position = new vscode.Position(0, 8)

		const definitionProvider = new BrDefinitionProvider(projects, parser)
		const definition = await definitionProvider.provideDefinition(
			document,
			position,
			new vscode.CancellationTokenSource().token
		)

		assert.strictEqual(definition, undefined, 'Should not provide definition for string literal')

		console.log('Non-existent symbol test passed')

		await vscode.window.showTextDocument(document)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})
