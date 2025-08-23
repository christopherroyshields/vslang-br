import * as assert from 'assert'
import LightweightSourceDocument from '../../class/LightweightSourceDocument'
import { Uri } from 'vscode'

suite('LightweightSourceDocument Test Suite', () => {
	test('Extract library functions with line numbers', () => {
		const content = `100 DEF LIBRARY fnTestFunc(x, y)
110   RETURN x + y
120 FNEND

200 DEF LIBRARY FnAnotherFunc
210   PRINT "Hello"
220 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 2, 'Should find 2 library functions')
		assert.ok(doc.libraryFunctions.has('fnTestFunc'), 'Should find fnTestFunc')
		assert.ok(doc.libraryFunctions.has('FnAnotherFunc'), 'Should find FnAnotherFunc')
	})

	test('Extract library functions without line numbers', () => {
		const content = `DEF LIBRARY fnNoLineNum(param)
  RETURN param * 2
FNEND

DEF LIBRARY FnSecondFunc
  PRINT "No line numbers"
FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 2, 'Should find 2 library functions')
		assert.ok(doc.libraryFunctions.has('fnNoLineNum'), 'Should find fnNoLineNum')
		assert.ok(doc.libraryFunctions.has('FnSecondFunc'), 'Should find FnSecondFunc')
	})

	test('Ignore regular (non-library) functions', () => {
		const content = `100 DEF fnRegularFunc(x)
110   RETURN x * 2
120 FNEND

200 DEF LIBRARY fnLibraryFunc(y)
210   RETURN y * 3
220 FNEND

300 DEF FnAnotherRegular
310   PRINT "Regular"
320 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnLibraryFunc'), 'Should find fnLibraryFunc')
		assert.ok(!doc.libraryFunctions.has('fnRegularFunc'), 'Should not find regular function')
		assert.ok(!doc.libraryFunctions.has('FnAnotherRegular'), 'Should not find another regular function')
	})

	test('Ignore DEF LIBRARY in single-line comments', () => {
		const content = `100 ! This is a comment with DEF LIBRARY fnCommented(x)
110 DEF LIBRARY fnRealFunc(y)
120   RETURN y
130 FNEND
140 REM DEF LIBRARY fnRemComment
150 ! DEF LIBRARY fnAnotherComment()`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find real function')
		assert.ok(!doc.libraryFunctions.has('fnCommented'), 'Should not find commented function')
		assert.ok(!doc.libraryFunctions.has('fnRemComment'), 'Should not find REM commented function')
		assert.ok(!doc.libraryFunctions.has('fnAnotherComment'), 'Should not find another commented function')
	})

	test('Ignore DEF LIBRARY in multiline comments', () => {
		const content = `100 /* This is a multiline comment
110 DEF LIBRARY fnInComment(x)
120   RETURN x
130 */
140 DEF LIBRARY fnRealFunc(y)
150   RETURN y
160 FNEND
170 /*
180 DEF LIBRARY fnAnotherCommented
190 */`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find real function')
		assert.ok(!doc.libraryFunctions.has('fnInComment'), 'Should not find function in multiline comment')
		assert.ok(!doc.libraryFunctions.has('fnAnotherCommented'), 'Should not find another function in comment')
	})

	test('Ignore DEF LIBRARY in strings', () => {
		const content = `100 LET testStr$ = "DEF LIBRARY fnInString(x)"
110 PRINT "Another DEF LIBRARY fnStringFunc"
120 DEF LIBRARY fnRealFunc(z)
130   RETURN z
140 FNEND
150 LET multiline$ = "This is a
160 DEF LIBRARY fnMultilineString
170 string"`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find real function')
		assert.ok(!doc.libraryFunctions.has('fnInString'), 'Should not find function in string')
		assert.ok(!doc.libraryFunctions.has('fnStringFunc'), 'Should not find function in print string')
		assert.ok(!doc.libraryFunctions.has('fnMultilineString'), 'Should not find function in multiline string')
	})

	test('Handle mixed case DEF LIBRARY declarations', () => {
		const content = `100 def library fnLowerCase(x)
110   RETURN x
120 FNEND
130 Def Library fnMixedCase(y)
140   RETURN y
150 FNEND
160 DEF LIBRARY fnUpperCase(z)
170   RETURN z
180 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 3, 'Should find all 3 library functions')
		assert.ok(doc.libraryFunctions.has('fnLowerCase'), 'Should find lowercase def library')
		assert.ok(doc.libraryFunctions.has('fnMixedCase'), 'Should find mixed case def library')
		assert.ok(doc.libraryFunctions.has('fnUpperCase'), 'Should find uppercase def library')
	})

	test('Handle various whitespace patterns', () => {
		const content = `100 DEF  LIBRARY  fnExtraSpaces(x)
110   RETURN x
120 FNEND
130 DEF	LIBRARY	fnTabSeparated(y)
140   RETURN y
150 FNEND
160    DEF LIBRARY fnIndented(z)
170   RETURN z
180 FNEND
190 		DEF LIBRARY fnTabIndented(a)
200   RETURN a
210 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 4, 'Should find all 4 library functions')
		assert.ok(doc.libraryFunctions.has('fnExtraSpaces'), 'Should find function with extra spaces')
		assert.ok(doc.libraryFunctions.has('fnTabSeparated'), 'Should find function with tabs')
		assert.ok(doc.libraryFunctions.has('fnIndented'), 'Should find indented function')
		assert.ok(doc.libraryFunctions.has('fnTabIndented'), 'Should find tab-indented function')
	})

	test('Complex scenario with mixed content', () => {
		const content = `100 ! Program header comment
110 REM This program has various functions
120 
130 /* Multiline comment
140 DEF LIBRARY fnCommented(x)
150 */
160 
170 LET description$ = "DEF LIBRARY fnInString()"
180 
190 DEF LIBRARY fnValidLibrary1(param1, param2)
200   ! This is a real library function
210   RETURN param1 + param2
220 FNEND
230 
240 DEF fnRegularFunction(x)
250   RETURN x * 2
260 FNEND
270 
280 ! DEF LIBRARY fnCommentedOut
290 
300 def library FnCaseInsensitive
310   PRINT "Mixed case"
320 FNEND
330 
340 PRINT "Testing: DEF LIBRARY fnAnotherString"
350 
360    DEF   LIBRARY   fnWhitespaceVariations  (  )
370   RETURN 0
380 FNEND
390 
400 /* Another comment block
410 with multiple lines
420 DEF LIBRARY fnStillCommented
430 and more text */
440 
450 DEF LIBRARY FN_WITH_UNDERSCORE
460   RETURN 1
470 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		// Should only find the real library functions
		const expectedFunctions = [
			'fnValidLibrary1',
			'FnCaseInsensitive',
			'fnWhitespaceVariations',
			'FN_WITH_UNDERSCORE'
		]

		assert.strictEqual(doc.libraryFunctions.size, expectedFunctions.length, `Should find ${expectedFunctions.length} library functions`)
		
		for (const funcName of expectedFunctions) {
			assert.ok(doc.libraryFunctions.has(funcName), `Should find ${funcName}`)
		}

		// Should not find these
		const notExpected = [
			'fnCommented',
			'fnInString',
			'fnRegularFunction',
			'fnCommentedOut',
			'fnAnotherString',
			'fnStillCommented'
		]

		for (const funcName of notExpected) {
			assert.ok(!doc.libraryFunctions.has(funcName), `Should not find ${funcName}`)
		}
	})

	test('hasFunction method case-insensitive check', () => {
		const content = `100 DEF LIBRARY fnTestFunc(x)
110   RETURN x
120 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		// Test case-insensitive matching
		assert.ok(doc.hasFunction('fnTestFunc'), 'Should find exact case')
		assert.ok(doc.hasFunction('FNTESTFUNC'), 'Should find uppercase')
		assert.ok(doc.hasFunction('fntestfunc'), 'Should find lowercase')
		assert.ok(doc.hasFunction('FnTestFunc'), 'Should find mixed case')
		assert.ok(!doc.hasFunction('fnOtherFunc'), 'Should not find non-existent function')
	})

	test('isLibraryFile method', () => {
		const libraryContent = `100 DEF LIBRARY fnLibFunc(x)
110   RETURN x
120 FNEND`

		const regularContent = `100 DEF fnRegularFunc(x)
110   RETURN x
120 FNEND`

		const emptyContent = ``

		const libDoc = new LightweightSourceDocument(Uri.file('lib.brs'), libraryContent)
		const regDoc = new LightweightSourceDocument(Uri.file('reg.brs'), regularContent)
		const emptyDoc = new LightweightSourceDocument(Uri.file('empty.brs'), emptyContent)

		assert.ok(libDoc.isLibraryFile(), 'Should identify library file')
		assert.ok(!regDoc.isLibraryFile(), 'Should not identify regular file as library')
		assert.ok(!emptyDoc.isLibraryFile(), 'Should not identify empty file as library')
	})

	test('getAllFunctionNames method', () => {
		const content = `100 DEF LIBRARY fnFunc1(x)
110   RETURN x
120 FNEND
130 DEF LIBRARY fnFunc2(y)
140   RETURN y
150 FNEND
160 DEF fnRegular(z)
170   RETURN z
180 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		const allFunctions = doc.getAllFunctionNames()
		assert.strictEqual(allFunctions.length, 2, 'Should return only library functions')
		assert.ok(allFunctions.includes('fnFunc1'), 'Should include fnFunc1')
		assert.ok(allFunctions.includes('fnFunc2'), 'Should include fnFunc2')
		assert.ok(!allFunctions.includes('fnRegular'), 'Should not include regular function')
	})

	test('Ignore DEF LIBRARY in Lexi backtick strings', () => {
		const content = `100 LET template$ = \`This is a backtick string
110 DEF LIBRARY fnInBacktick(x)
120 that spans multiple lines\`
130 DEF LIBRARY fnRealFunc(y)
140   RETURN y
150 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find real function')
		assert.ok(!doc.libraryFunctions.has('fnInBacktick'), 'Should not find function in backtick string')
	})

	test('Ignore DEF LIBRARY in Lexi interpolation', () => {
		const content = `100 LET name$ = "Test"
110 LET message$ = \`Hello {{name$}}
120 DEF LIBRARY fnInInterpolation
130 is not real\`
140 DEF LIBRARY fnActualFunc(z)
150   RETURN z
160 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnActualFunc'), 'Should find actual function')
		assert.ok(!doc.libraryFunctions.has('fnInInterpolation'), 'Should not find function in interpolation')
	})

	test('Handle escaped backticks in Lexi strings', () => {
		const content = `100 LET text$ = \`This has a \`\` backtick\`
110 DEF LIBRARY fnRealFunc(x)
120   RETURN x
130 FNEND
140 LET another$ = \`Text with \`\` escaped
150 DEF LIBRARY fnFakeInBacktick
160 backticks \`\` here\``

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 1, 'Should only find 1 library function')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find real function')
		assert.ok(!doc.libraryFunctions.has('fnFakeInBacktick'), 'Should not find function in backtick string with escaped backticks')
	})

	test('Mixed quotes and backticks', () => {
		const content = `100 LET str1$ = "Regular string"
110 LET str2$ = 'Single quotes'
120 LET str3$ = \`Backtick with "quotes" inside\`
130 DEF LIBRARY fnRealFunc1(a)
140   LET msg$ = \`Template
150   DEF LIBRARY fnNotReal
160   string\`
170   RETURN a
180 FNEND
190 PRINT "DEF LIBRARY fnInDoubleQuotes"
200 PRINT 'DEF LIBRARY fnInSingleQuotes'
210 PRINT \`DEF LIBRARY fnInBackticks\`
220 DEF LIBRARY fnRealFunc2(b)
230   RETURN b
240 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 2, 'Should find 2 library functions')
		assert.ok(doc.libraryFunctions.has('fnRealFunc1'), 'Should find fnRealFunc1')
		assert.ok(doc.libraryFunctions.has('fnRealFunc2'), 'Should find fnRealFunc2')
		assert.ok(!doc.libraryFunctions.has('fnNotReal'), 'Should not find function in backtick string')
		assert.ok(!doc.libraryFunctions.has('fnInDoubleQuotes'), 'Should not find function in double quotes')
		assert.ok(!doc.libraryFunctions.has('fnInSingleQuotes'), 'Should not find function in single quotes')
		assert.ok(!doc.libraryFunctions.has('fnInBackticks'), 'Should not find function in backticks')
	})

	test('Backtick string on same line', () => {
		const content = `100 LET inline$ = \`DEF LIBRARY fnInline(x)\`
110 DEF LIBRARY fnRealFunc(y)
120   RETURN y
130 FNEND
140 LET another$ = \`Start DEF LIBRARY fnFake\` : DEF LIBRARY fnAfterBacktick
150   RETURN 1
160 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		assert.strictEqual(doc.libraryFunctions.size, 2, 'Should find 2 library functions')
		assert.ok(doc.libraryFunctions.has('fnRealFunc'), 'Should find fnRealFunc')
		assert.ok(doc.libraryFunctions.has('fnAfterBacktick'), 'Should find function after backtick string ends')
		assert.ok(!doc.libraryFunctions.has('fnInline'), 'Should not find function in inline backtick string')
		assert.ok(!doc.libraryFunctions.has('fnFake'), 'Should not find function in backtick string')
	})

	test('Line continuation with !: and !_', () => {
		const content = `100 DEF LIBRARY fnWithContinuation(x, !:
110   y, z)
120   RETURN x + y + z
130 FNEND
140 ! This is a comment with DEF LIBRARY fnInComment
150 !: This is not a comment, it's a continuation
160 !_ This is also a continuation
170 DEF LIBRARY fnAnotherFunc
180   RETURN 1
190 FNEND`

		const doc = new LightweightSourceDocument(
			Uri.file('test.brs'),
			content
		)

		// Note: Our simple parser doesn't handle line continuations for the DEF itself,
		// but it should handle !: and !_ as non-comments
		assert.strictEqual(doc.libraryFunctions.size, 2, 'Should find 2 library functions')
		assert.ok(doc.libraryFunctions.has('fnWithContinuation'), 'Should find function with continuation')
		assert.ok(doc.libraryFunctions.has('fnAnotherFunc'), 'Should find another function')
		assert.ok(!doc.libraryFunctions.has('fnInComment'), 'Should not find function in comment')
	})
})