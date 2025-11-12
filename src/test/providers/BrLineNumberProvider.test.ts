import * as assert from 'assert'
import * as vscode from 'vscode'
import * as path from 'path'
import BrParser from '../../parser'
import BrDefinitionProvider from '../../providers/BrDefinitionProvider'
import BrReferenceProvider from '../../providers/BrReferenceProvider'
import { Project } from '../../class/Project'
import SourceDocument from '../../class/SourceDocument'

suite('Line Number Definition and Reference Provider Test Suite', () => {
	let parser: BrParser
	let testWorkspaceFolder: vscode.WorkspaceFolder | undefined

	suiteSetup(async () => {
		console.log('Starting line number test suite setup...')

		// Initialize parser
		const context = {
			subscriptions: []
		} as any
		parser = new BrParser()
		parser.activate(context)

		// Get workspace folder
		const testcodeDir = path.join(__dirname, '../../../testcode')
		const uri = vscode.Uri.file(testcodeDir)
		testWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)

		if (!testWorkspaceFolder) {
			throw new Error('No workspace folder found')
		}

		console.log('Test directory:', testcodeDir)
		console.log('Workspace folder set up')
		console.log('Line number test suite setup complete')
	})

	test('Go to definition on line reference (GOTO)', async () => {
		console.log('Running line reference definition test...')
		const codepath = path.join(__dirname, '../../../testcode/lineref_test.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		if (!testWorkspaceFolder) {
			throw new Error('Test workspace folder not initialized')
		}

		// Mock projects map
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, SourceDocument>(),
			layouts: new Map(),
			libraryIndex: { getFunction: () => undefined }
		} as any
		projects.set(testWorkspaceFolder, project)

		const definitionProvider = new BrDefinitionProvider(projects, parser)

		// Position on line reference "00300" in "GOTO 00300" (line 1, after GOTO)
		const position = new vscode.Position(1, 10)
		const definition = await definitionProvider.provideDefinition(document, position, {} as any)

		assert.ok(definition, 'Definition should be found')

		if (Array.isArray(definition)) {
			assert.strictEqual(definition.length, 1, 'Should find exactly one definition')
			const loc = definition[0] as vscode.Location
			assert.strictEqual(loc.uri.toString(), uri.toString(), 'Definition should be in same file')
			// Line number 00300 is on line 6 (0-indexed)
			assert.strictEqual(loc.range.start.line, 6, 'Definition should be on line 6')
		} else {
			const loc = definition as vscode.Location
			assert.strictEqual(loc.uri.toString(), uri.toString(), 'Definition should be in same file')
			assert.strictEqual(loc.range.start.line, 6, 'Definition should be on line 6')
		}

		console.log('Line reference definition test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Find all references to line number', async () => {
		console.log('Running line number references test...')
		const codepath = path.join(__dirname, '../../../testcode/lineref_test.brs')
		const uri = vscode.Uri.file(codepath)
		const document = await vscode.workspace.openTextDocument(uri)

		if (!testWorkspaceFolder) {
			throw new Error('Test workspace folder not initialized')
		}

		// Mock projects map
		const projects = new Map<vscode.WorkspaceFolder, Project>()
		const project = {
			sourceFiles: new Map<string, SourceDocument>(),
			layouts: new Map(),
			libraryIndex: { getFunction: () => undefined }
		} as any
		projects.set(testWorkspaceFolder, project)

		const referenceProvider = new BrReferenceProvider(projects, parser)

		// Position on line number 00300 (line 6, column 0)
		const position = new vscode.Position(6, 0)
		const references = await referenceProvider.provideReferences(
			document,
			position,
			{ includeDeclaration: true } as any,
			{} as any
		)

		assert.ok(references, 'References should be found')
		// Should find: line definition (00300) and the GOTO reference (line 1)
		assert.ok(references.length >= 2, `Should find at least 2 references, found ${references.length}`)

		// Verify we found both the definition and the reference
		const lines = references.map(r => r.range.start.line).sort((a, b) => a - b)
		assert.ok(lines.includes(1), 'Should include reference on line 1 (GOTO 00300)')
		assert.ok(lines.includes(6), 'Should include definition on line 6 (00300)')

		console.log('Line number references test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})
})
