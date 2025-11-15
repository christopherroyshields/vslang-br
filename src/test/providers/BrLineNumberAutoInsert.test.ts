import * as assert from 'assert'
import * as vscode from 'vscode'
import BrParser from '../../parser'
import { calculateNextLineNumber, detectIncrement, isContinuationLine, extractLineNumber } from '../../utils/lineNumbers'

suite('Auto Line Number Insertion Test Suite', () => {
	let parser: BrParser

	suiteSetup(async () => {
		console.log('Starting auto line number test suite setup...')
		const context = {
			subscriptions: []
		} as any
		parser = new BrParser()
		parser.activate(context)
		console.log('Auto line number test suite setup complete')
	})

	test('Extract line number from tree node', async () => {
		console.log('Running line number extraction test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "test"'
		})

		const tree = parser.getDocumentTree(document)
		const lineNode = tree.rootNode.firstChild

		const lineInfo = extractLineNumber(lineNode)

		assert.ok(lineInfo, 'Should extract line number info')
		assert.strictEqual(lineInfo?.value, 100, 'Should extract numeric value 100')
		assert.strictEqual(lineInfo?.padding, 5, 'Should detect 5-digit padding')
		assert.strictEqual(lineInfo?.formatted, '00100', 'Should preserve formatted string')

		console.log('Line number extraction test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Detect increment from multiple lines', async () => {
		console.log('Running increment detection utility test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00110 print "second"\n00120 print "third"'
		})

		const increment = detectIncrement(parser, document, 3, 10)

		assert.strictEqual(increment, 10, 'Should detect increment of 10')

		console.log('Increment detection utility test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Detect increment of 5', async () => {
		console.log('Running increment of 5 detection test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00105 print "second"'
		})

		const increment = detectIncrement(parser, document, 2, 10)

		assert.strictEqual(increment, 5, 'Should detect increment of 5')

		console.log('Increment of 5 detection test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Detect continuation line', async () => {
		console.log('Running continuation detection test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "start" !:\n00110 print "normal"'
		})

		const isCont0 = isContinuationLine(parser, document, 0)
		const isCont1 = isContinuationLine(parser, document, 1)

		assert.strictEqual(isCont0, true, 'Line 0 should be detected as continuation')
		assert.strictEqual(isCont1, false, 'Line 1 should not be detected as continuation')

		console.log('Continuation detection test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Calculate next line number utility', async () => {
		console.log('Running calculate next line number test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00110 print "second"'
		})

		const nextLineNum = calculateNextLineNumber(parser, document, 2, 10, 5)

		assert.strictEqual(nextLineNum, '00120', 'Should calculate next line number as 00120')

		console.log('Calculate next line number test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Calculate next line number with no padding', async () => {
		console.log('Running no padding test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '100 print "first"'
		})

		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '110', 'Should preserve 3-digit format')

		console.log('No padding test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Return null when previous line has no line number', async () => {
		console.log('Running no previous line number test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: 'print "hello"'
		})

		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, null, 'Should return null when previous line has no line number')

		console.log('No previous line number test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Return null after continuation line', async () => {
		console.log('Running continuation line test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "start" !:'
		})

		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, null, 'Should return null after continuation line')

		console.log('Continuation line test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Fit line number between existing lines', async () => {
		console.log('Running fit between existing lines test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00120 print "third"'
		})

		// Inserting between line 0 (00100) and line 1 (00120)
		// Should calculate for new line at index 1
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '00110', 'Should insert 00110 between 00100 and 00120')

		console.log('Fit between existing lines test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Use smaller increment when next line is too close', async () => {
		console.log('Running smaller increment test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00105 print "second"'
		})

		// Inserting between line 0 (00100) and line 1 (00105)
		// Detected increment would be 10, but max available is 4
		// Preferred increments: [1, 2, 10, 20, 100]
		// Should use highest that fits: 2
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '00102', 'Should use increment of 2 (00102)')

		console.log('Smaller increment test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Return null when no space between lines', async () => {
		console.log('Running no space test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00101 print "second"'
		})

		// Inserting between line 0 (00100) and line 1 (00101)
		// No space available
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, null, 'Should return null when no space available')

		console.log('No space test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Normal increment when no next line exists', async () => {
		console.log('Running normal increment test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"'
		})

		// Inserting after last line, no constraint from next line
		// Detected increment = 10, should match preferred increment 10
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '00110', 'Should use increment of 10 (00110)')

		console.log('Normal increment test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Use increment of 2 when space is 7', async () => {
		console.log('Running prefer increment 2 test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00108 print "second"'
		})

		// Available space is 7 (108 - 100 - 1 = 7)
		// Detected increment = 10 doesn't fit
		// Preferred increments: [1, 2, 10, 20, 100]
		// Should use highest that fits: 2
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '00102', 'Should use increment of 2 (00102)')

		console.log('Prefer increment 2 test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Use increment of 10 when detected and fits', async () => {
		console.log('Running prefer increment 10 test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00150 print "second"'
		})

		// Available space is 49 (150 - 100 - 1 = 49)
		// Detected increment = 10, it's in preferred list and fits
		// Should use 10
		const nextLineNum = calculateNextLineNumber(parser, document, 1, 10, 5)

		assert.strictEqual(nextLineNum, '00110', 'Should use increment of 10 (00110)')

		console.log('Prefer increment 10 test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Use increment of 20 when detected increment is 20', async () => {
		console.log('Running increment 20 test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00120 print "second"'
		})

		// Pattern suggests increment of 20
		// Should use 20 (matches preferred list)
		const nextLineNum = calculateNextLineNumber(parser, document, 2, 10, 5)

		assert.strictEqual(nextLineNum, '00140', 'Should use increment of 20 (00140)')

		console.log('Increment 20 test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Use next lower preferred when detected is not in list', async () => {
		console.log('Running non-preferred increment test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n00105 print "second"\n00110 print "third"'
		})

		// Pattern suggests increment of 5 (not in preferred list)
		// Preferred increments: [1, 2, 10, 20, 100]
		// Should use next lower: 2
		const nextLineNum = calculateNextLineNumber(parser, document, 3, 10, 5)

		assert.strictEqual(nextLineNum, '00112', 'Should use next lower preferred increment 2 (00112)')

		console.log('Non-preferred increment test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Walk backwards through blank lines to find previous line number', async () => {
		console.log('Running walk backwards test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n\n\nprint "no line number"'
		})

		// Line 0: 00100 print "first"
		// Line 1: (blank)
		// Line 2: (blank)
		// Line 3: print "no line number"
		// Inserting at line 4 (after line 3), should find line 0's number (00100)
		const nextLineNum = calculateNextLineNumber(parser, document, 4, 10, 5)

		assert.strictEqual(nextLineNum, '00110', 'Should find 00100 and calculate 00110')

		console.log('Walk backwards test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	test('Walk backwards with comments and blank lines', async () => {
		console.log('Running walk backwards with comments test...')
		const document = await vscode.workspace.openTextDocument({
			language: 'br',
			content: '00100 print "first"\n! comment\n\n! another comment'
		})

		// Should walk back past comments and blanks to find 00100
		const nextLineNum = calculateNextLineNumber(parser, document, 4, 10, 5)

		assert.strictEqual(nextLineNum, '00110', 'Should find 00100 and calculate 00110')

		console.log('Walk backwards with comments test passed')
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	})

	// Note: The BrLineNumberProvider now only auto-inserts line numbers when
	// pressing Enter on a line that already has a line number. This prevents
	// unwanted line number insertion when pressing Enter on blank lines.
	// Manual testing required:
	// 1. Line with number -> Enter -> Should auto-insert next number
	// 2. Blank line -> Enter -> Should NOT auto-insert, just newline
	// 3. Line without number -> Enter -> Should NOT auto-insert, just newline
})
