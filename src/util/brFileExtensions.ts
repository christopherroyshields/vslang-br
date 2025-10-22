import * as vscode from 'vscode';

/**
 * Utility class for managing BR file extensions and their mappings between
 * compiled and source files.
 */
export class BrFileExtensions {

	/**
	 * Gets the configured mapping of compiled BR file extensions to source file extensions.
	 * @returns Object mapping compiled extensions (e.g., '.br', '.wb') to source extensions (e.g., '.brs', '.wbs')
	 */
	static getExtensionMapping(): Record<string, string> {
		const config = vscode.workspace.getConfiguration('br.decompile');
		return config.get<Record<string, string>>('sourceExtensions', {
			'.br': '.brs',
			'.bro': '.brs',
			'.wb': '.wbs',
			'.wbo': '.wbs'
		});
	}

	/**
	 * Gets the source file extension for a given compiled file extension.
	 * @param compiledExt The compiled file extension (e.g., '.br', '.wb')
	 * @returns The corresponding source extension (e.g., '.brs', '.wbs'), or undefined if not found
	 */
	static getSourceExtension(compiledExt: string): string | undefined {
		const mapping = this.getExtensionMapping();
		return mapping[compiledExt.toLowerCase()];
	}

	/**
	 * Gets the compiled file extension for a given source file extension.
	 * Uses reverse lookup of the extension mapping.
	 * @param sourceExt The source file extension (e.g., '.brs', '.wbs')
	 * @returns The corresponding compiled extension (e.g., '.br', '.wb'), or undefined if not found
	 */
	static getCompiledExtension(sourceExt: string): string | undefined {
		const mapping = this.getExtensionMapping();
		const lowerSourceExt = sourceExt.toLowerCase();

		// Reverse lookup: find compiled extension for source extension
		for (const [compiled, source] of Object.entries(mapping)) {
			if (source.toLowerCase() === lowerSourceExt) {
				return compiled;
			}
		}

		// If no mapping found, use convention: .brs -> .br, .wbs -> .wb
		if (lowerSourceExt === '.brs') {
			return '.br';
		} else if (lowerSourceExt === '.wbs') {
			return '.wb';
		}

		return undefined;
	}

	/**
	 * Checks if a file extension is a compiled BR file extension.
	 * @param fileExt The file extension to check (e.g., '.br', '.bro')
	 * @returns True if the extension is a compiled BR file extension
	 */
	static isCompiledBrFile(fileExt: string): boolean {
		const mapping = this.getExtensionMapping();
		return fileExt.toLowerCase() in mapping;
	}

	/**
	 * Gets a comma-separated list of supported compiled BR file extensions.
	 * @returns String like '.br, .bro, .wb, .wbo'
	 */
	static getSupportedCompiledExtensions(): string {
		const mapping = this.getExtensionMapping();
		return Object.keys(mapping).join(', ');
	}

	/**
	 * Checks if a file extension is a source BR file extension.
	 * @param fileExt The file extension to check (e.g., '.brs', '.wbs')
	 * @returns True if the extension is a source BR file extension
	 */
	static isSourceBrFile(fileExt: string): boolean {
		const mapping = this.getExtensionMapping();
		const lowerExt = fileExt.toLowerCase();
		return Object.values(mapping).some(ext => ext.toLowerCase() === lowerExt);
	}

	/**
	 * Gets a comma-separated list of supported source BR file extensions.
	 * @returns String like '.brs, .wbs'
	 */
	static getSupportedSourceExtensions(): string {
		const mapping = this.getExtensionMapping();
		const uniqueSourceExts = [...new Set(Object.values(mapping))];
		return uniqueSourceExts.join(', ');
	}
}
