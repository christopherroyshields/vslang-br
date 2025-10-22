import * as assert from 'assert'
import { scanLibraryFunctions, hasLibraryFunctions, formatFunctionSignature } from '../../util/libraryScanner'
import { Uri } from 'vscode'

suite('LibraryScanner Test Suite', () => {

	test('Extract library functions with line numbers', () => {
		const content = Buffer.from(`100 def library fnTest(x, y$, z)
110   print "test"
120 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should find one library function')
		assert.strictEqual(functions[0].name, 'Test', 'Should extract function name')
		assert.strictEqual(functions[0].parameters, 'x, y$, z', 'Should extract parameters')
		assert.strictEqual(functions[0].lineNumber, 1, 'Should have correct line number')
	})

	test('Extract library functions without line numbers', () => {
		const content = Buffer.from(`def library fnMyFunc(a$, b)
  return a$ + str$(b)
fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should find one library function')
		assert.strictEqual(functions[0].name, 'MyFunc', 'Should extract function name')
		assert.strictEqual(functions[0].parameters, 'a$, b', 'Should extract parameters')
	})

	test('Ignore regular (non-library) functions', () => {
		const content = Buffer.from(`100 def fnRegular(x)
110   return x * 2
120 fnend
130 def library fnLibFunc()
140   return 42
150 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should only find library functions')
		assert.strictEqual(functions[0].name, 'LibFunc', 'Should be the library function')
	})

	test('Ignore DEF LIBRARY in single-line comments with !', () => {
		const content = Buffer.from(`100 ! def library fnCommented(x)
110 def library fnReal(y)
120   return y
130 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore commented function')
		assert.strictEqual(functions[0].name, 'Real', 'Should find the real function')
	})

	test('Ignore DEF LIBRARY in single-line comments with REM', () => {
		const content = Buffer.from(`100 REM def library fnCommented(x)
110 rem This is a comment with def library fnAnother()
120 def library fnActual(z$)
130   return z$
140 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore REM commented functions')
		assert.strictEqual(functions[0].name, 'Actual', 'Should find the actual function')
	})

	test('Ignore DEF LIBRARY in multiline comments', () => {
		const content = Buffer.from(`100 /* This is a comment
110    def library fnInComment(x)
120    more comment
130 */
140 def library fnRealFunc(a, b)
150   return a + b
160 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore function in block comment')
		assert.strictEqual(functions[0].name, 'RealFunc', 'Should find the real function')
	})

	test('Ignore DEF LIBRARY in double-quoted strings', () => {
		const content = Buffer.from(`100 let msg$ = "def library fnInString(x)"
110 print "Another string with def library fnFake()"
120 def library fnGenuine(param$)
130   return param$
140 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore functions in double-quoted strings')
		assert.strictEqual(functions[0].name, 'Genuine', 'Should find the genuine function')
	})

	test('Ignore DEF LIBRARY in single-quoted strings', () => {
		const content = Buffer.from(`100 let text$ = 'def library fnInSingleQuote(x)'
110 print 'This has def library fnAnother() in it'
120 def library fnRealOne(value)
130   return value * 2
140 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore functions in single-quoted strings')
		assert.strictEqual(functions[0].name, 'RealOne', 'Should find the real function')
	})

	test('Ignore DEF LIBRARY in backtick strings', () => {
		const content = Buffer.from('100 let code$ = `def library fnInBacktick(x)`\n' +
			'110 print `Another with def library fnFakeFunc()`\n' +
			'120 def library fnValidFunc(n)\n' +
			'130   return n\n' +
			'140 fnend')
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should ignore functions in backtick strings')
		assert.strictEqual(functions[0].name, 'ValidFunc', 'Should find the valid function')
	})

	test('Handle mixed case DEF LIBRARY declarations', () => {
		const content = Buffer.from(`100 DeF LiBrArY fnMixedCase(x)
110   return x
120 fnend
130 DEF LIBRARY fnUpperCase(y)
140   return y
150 fnend
160 def library fnLowerCase(z)
170   return z
180 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 3, 'Should find all case variations')
		assert.strictEqual(functions[0].name, 'MixedCase', 'Should find mixed case')
		assert.strictEqual(functions[1].name, 'UpperCase', 'Should find upper case')
		assert.strictEqual(functions[2].name, 'LowerCase', 'Should find lower case')
	})

	test('Handle various whitespace patterns', () => {
		const content = Buffer.from(`100    def    library    fnSpaces(x)
110 fnend
120 def	library	fnTabs(y)
130 fnend
140 def library fnNormal(z)
150 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 3, 'Should handle various whitespace')
	})

	test('Complex scenario with mixed content', () => {
		const content = Buffer.from(`100 ! This file has various scenarios
110 REM def library fnCommented1()
120 /* def library fnCommented2()
130    more comment */
140 let s1$ = "def library fnInString()"
150 let s2$ = 'def library fnInSingle()'
160 let s3$ = \`def library fnInBacktick()\`
170 
180 def library fnValid1(a, b, c$)
190   ! def library fnCommentedInside()
200   return c$
210 fnend
220
230 def fnNonLibrary(x)
240   return x
250 fnend
260
270 def library fnValid2()
280   return 42
290 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 2, 'Should find only valid library functions')
		assert.strictEqual(functions[0].name, 'Valid1', 'Should find first valid function')
		assert.strictEqual(functions[1].name, 'Valid2', 'Should find second valid function')
		assert.strictEqual(functions[0].parameters, 'a, b, c$', 'Should have correct parameters')
	})

	test('Extract JSDoc comments', () => {
		const content = Buffer.from(`100 /**
110  * This is a test function
120  * @param x - First parameter
130  * @param y - Second parameter
140  */
150 def library fnDocumented(x, y)
160   return x + y
170 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should find documented function')
		assert.ok(functions[0].documentation, 'Should have documentation')
		assert.ok(functions[0].documentation!.includes('@param x'), 'Should include parameter docs')
	})

	test('hasLibraryFunctions utility', () => {
		const withLibrary = Buffer.from('def library fnTest()\nfnend')
		const withoutLibrary = Buffer.from('def fnRegular()\nfnend')
		const inComment = Buffer.from('! def library fnComment()\n')
		
		assert.strictEqual(hasLibraryFunctions(withLibrary), true, 'Should detect library function')
		assert.strictEqual(hasLibraryFunctions(withoutLibrary), false, 'Should not detect regular function')
		assert.strictEqual(hasLibraryFunctions(inComment), false, 'Should not detect commented function')
	})

	test('formatFunctionSignature utility', () => {
		assert.strictEqual(
			formatFunctionSignature('Test', 'x, y, z'),
			'fnTest(x, y, z)',
			'Should format with parameters'
		)
		assert.strictEqual(
			formatFunctionSignature('NoParams'),
			'fnNoParams()',
			'Should format without parameters'
		)
		assert.strictEqual(
			formatFunctionSignature('Empty', ''),
			'fnEmpty()',
			'Should handle empty parameter string'
		)
	})

	test('Nested strings and comments', () => {
		const content = Buffer.from(`100 ! Comment with "string containing def library fnFake()"
110 let x$ = "String with ! that looks like comment def library fnFake2()"
120 /* Block comment with
130    let y$ = "def library fnFake3()"
140 */
150 def library fnOnlyReal(param)
160   return param
170 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should handle nested scenarios')
		assert.strictEqual(functions[0].name, 'OnlyReal', 'Should find only the real function')
	})

	test('Functions with string parameters', () => {
		const content = Buffer.from(`100 def library fnStringParam(x$*255, y$)
110   return x$ + y$
120 fnend`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		assert.strictEqual(functions.length, 1, 'Should find function with string parameters')
		assert.strictEqual(functions[0].name, 'StringParam', 'Should extract function name')
		assert.strictEqual(functions[0].parameters, 'x$*255, y$', 'Should preserve parameter details')
	})

	test('Multiple functions on same line should not work', () => {
		// BR doesn't actually allow this, but testing the scanner behavior
		const content = Buffer.from(`100 def library fnFirst() : def library fnSecond()`)
		
		const uri = Uri.file('/test.brs')
		const functions = scanLibraryFunctions(content, uri)
		
		// The regex anchors to line start, so only the first should match
		assert.strictEqual(functions.length, 1, 'Should only match first function on line')
		assert.strictEqual(functions[0].name, 'First', 'Should be the first function')
	})
})