import * as path from 'path'
import * as Mocha from 'mocha'
import * as glob from 'glob'
import { promisify } from 'util'

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000 // Increase timeout to 10s
	})

	const testsRoot = path.resolve(__dirname, '..')
	const globPromise = promisify(glob.glob)

	try {
		// Use promisified glob
		const files: string[] = await globPromise('**/**.test.js', { cwd: testsRoot })

		// Add files to the test suite
		for (const file of files) {
			mocha.addFile(path.resolve(testsRoot, file))
		}

		// Run the mocha tests
		return new Promise<void>((resolve, reject) => {
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`))
				} else {
					resolve()
				}
			})
		})
	} catch (err) {
		console.error('Error running tests:', err)
		throw err
	}
}
