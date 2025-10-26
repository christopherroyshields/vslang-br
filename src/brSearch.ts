/**
 * Proc Search - Advanced search for Business Rules! compiled programs
 *
 * This module implements a search feature that uses BR's native LIST command
 * to search compiled BR programs (.br, .bro, .wb, .wbo) using dynamically
 * generated procedure files.
 *
 * Features:
 * - Case-insensitive multi-term search
 * - Tree view results grouped by file
 * - Automatic decompilation when needed
 * - Smart navigation to internal BR line numbers
 * - Integration with Lexi compiler
 *
 * @module brSearch
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

let LexiPath: string;
let searchOutputChannel: vscode.OutputChannel;
let searchResultsProvider: BrSearchResultsProvider;
let searchTreeView: vscode.TreeView<vscode.TreeItem>;
let lastSearchTerms: string | undefined;

/**
 * URI Handler for opening BR files at specific internal line numbers
 *
 * Handles custom URIs in the format:
 * vscode://crs-dev.vslang-br/open?file=<path>&line=<number>
 *
 * @example
 * // Triggered when user clicks a search result link
 * vscode://crs-dev.vslang-br/open?file=C%3A%5Cpath%5Cprogram.br&line=100
 */
export class BrSearchUriHandler implements vscode.UriHandler {
    handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
        if (uri.path === '/open') {
            const query = new URLSearchParams(uri.query);
            const filePath = query.get('file');
            const internalLine = query.get('line');

            if (filePath && internalLine) {
                return openAtInternalLine(filePath, parseInt(internalLine));
            }
        }
    }
}

/**
 * Open a BR file at the line containing the specified internal line number
 *
 * This function handles the mapping between BR internal line numbers (e.g., 00100, 00200)
 * and actual file line positions. It automatically decompiles compiled files if needed.
 *
 * @param filePath - Full path to the BR file (compiled or source)
 * @param internalLineNumber - BR internal line number (e.g., 100, 200, 1000)
 *
 * @example
 * // Open program.br at internal line 100
 * await openAtInternalLine('C:\\path\\program.br', 100);
 * // This will:
 * // 1. Check if program.brs exists, decompile if not
 * // 2. Search for line starting with "00100"
 * // 3. Open program.brs at that actual line position
 */
async function openAtInternalLine(filePath: string, internalLineNumber: number): Promise<void> {
    try {
        // Determine if this is a compiled file
        const ext = path.extname(filePath).toLowerCase();
        const isCompiled = ['.br', '.bro', '.wb', '.wbo'].includes(ext);

        let sourceFilePath = filePath;
        let needsDecompile = false;

        if (isCompiled) {
            // Check for corresponding source file
            const parsedPath = path.parse(filePath);
            const sourceExt = ext.startsWith('.br') ? '.brs' : '.wbs';
            sourceFilePath = path.join(parsedPath.dir, parsedPath.name + sourceExt);

            if (!fs.existsSync(sourceFilePath)) {
                needsDecompile = true;
            }
        }

        // Decompile if needed
        if (needsDecompile) {
            await decompileFile(filePath, sourceFilePath);
            // Wait a moment for file to be written
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Open the source file
        const document = await vscode.workspace.openTextDocument(sourceFilePath);

        // Find the line containing the internal line number
        // Try multiple formats: 00100, 100, with/without leading zeros
        const lineNumberStr = String(internalLineNumber).padStart(5, '0');
        const lineNumberStrNoZeros = String(internalLineNumber);
        let actualLine = 0;
        let found = false;

        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            const trimmedText = lineText.trim();

            // Check if line starts with the line number (with or without leading zeros)
            // Handle various formats: "00100 LET", " 00100 LET", "100 LET"
            if (trimmedText.startsWith(lineNumberStr) ||
                trimmedText.startsWith(lineNumberStrNoZeros + ' ') ||
                trimmedText.match(new RegExp(`^0*${internalLineNumber}\\s`))) {
                actualLine = i;
                found = true;
                break;
            }
        }

        if (!found) {
            vscode.window.showWarningMessage(
                `Line number ${internalLineNumber} not found in ${path.basename(sourceFilePath)}. Opening at start of file.`
            );
        }

        // Show the document at the found line
        await vscode.window.showTextDocument(document, {
            selection: new vscode.Range(actualLine, 0, actualLine, 0),
            viewColumn: vscode.ViewColumn.One,
            preview: false
        });

        // Reveal the line in the center of the editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.revealRange(
                new vscode.Range(actualLine, 0, actualLine, 0),
                vscode.TextEditorRevealType.InCenter
            );
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to open file: ${errorMessage}`);
    }
}

/**
 * Decompile a BR file to source
 */
async function decompileFile(compiledPath: string, sourcePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const outputFileName = path.basename(sourcePath);
        const tmpOutputPath = path.join(LexiPath, 'tmp', outputFileName);

        // Create procedure file
        let prcContent = '';
        prcContent += 'proc noecho\n';

        // Add STYLE command from configuration
        const styleCommand = vscode.workspace.getConfiguration('br.decompile').get('styleCommand', 'indent 2 45 keywords lower labels mixed comments mixed');
        if (styleCommand && styleCommand.trim().length > 0) {
            prcContent += `config STYLE ${styleCommand}\n`;
        }

        prcContent += `load ":${compiledPath}"\n`;
        prcContent += `list >":${tmpOutputPath}"\n`;
        prcContent += 'system\n';

        const prcFilePath = path.join(LexiPath, 'tmp', 'search-decompile.prc');
        fs.writeFileSync(prcFilePath, prcContent);

        // Start lexitip
        exec(`start lexitip`, { cwd: LexiPath });

        // Execute decompilation
        setTimeout(() => {
            exec(`brnative proc tmp\\search-decompile.prc`, {
                cwd: LexiPath
            }, (error, stdout, stderr) => {
                // Cleanup procedure file
                try {
                    if (fs.existsSync(prcFilePath)) {
                        fs.unlinkSync(prcFilePath);
                    }
                } catch (e) {//
                     }

                if (error) {
                    reject(error);
                    return;
                }

                // Copy decompiled file to final location
                if (fs.existsSync(tmpOutputPath)) {
                    fs.copyFileSync(tmpOutputPath, sourcePath);
                    fs.unlinkSync(tmpOutputPath);
                    resolve();
                } else {
                    reject(new Error('Decompiled file not found'));
                }
            });
        }, 500);
    });
}

/**
 * Tree item representing a search result match
 */
class SearchMatchItem extends vscode.TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly internalLineNumber: number,
        public readonly lineContent: string
    ) {
        super(lineContent, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `Line ${internalLineNumber}: ${lineContent}`;
        this.command = {
            command: 'br.openSearchResult',
            title: 'Open Search Result',
            arguments: [filePath, internalLineNumber]
        };
        // Use a simple arrow icon for match items
        this.iconPath = new vscode.ThemeIcon('arrow-right');
        // Set context value for menu items
        this.contextValue = 'searchMatch';
    }
}

/**
 * Tree item representing a file with search results
 */
class SearchFileItem extends vscode.TreeItem {
    constructor(
        public readonly filePath: string,
        public readonly matches: SearchMatchItem[]
    ) {
        super(path.basename(filePath), vscode.TreeItemCollapsibleState.Expanded);
        this.tooltip = filePath;
        this.description = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;

        // Use binary file icon for BR compiled programs
        this.iconPath = new vscode.ThemeIcon('file-binary');

        this.contextValue = 'searchFile';
    }
}

/**
 * Tree data provider for BR search results
 */
export class BrSearchResultsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private results: SearchFileItem[] = [];

    refresh(results: SearchFileItem[]): void {
        this.results = results;
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        this.results = [];
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            // Root level - return files
            return this.results;
        } else if (element instanceof SearchFileItem) {
            // File level - return matches
            return element.matches;
        }
        return [];
    }

    getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
        // If element is a SearchMatchItem, find its parent SearchFileItem
        if (element instanceof SearchMatchItem) {
            for (const fileItem of this.results) {
                if (fileItem.matches.includes(element)) {
                    return fileItem;
                }
            }
        }
        // SearchFileItem has no parent (root level)
        return null;
    }
}

/**
 * Initialize the search output channel
 */
export function initializeSearchOutputChannel(context: vscode.ExtensionContext) {
    // Initialize LexiPath using the extension's installation directory
    LexiPath = path.join(context.extensionPath, 'Lexi');

    searchOutputChannel = vscode.window.createOutputChannel('Proc Search');
    context.subscriptions.push(searchOutputChannel);

    // Register URI handler
    const uriHandler = new BrSearchUriHandler();
    context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

    // Create and register tree view
    searchResultsProvider = new BrSearchResultsProvider();
    searchTreeView = vscode.window.createTreeView('brSearchResults', {
        treeDataProvider: searchResultsProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(searchTreeView);

    // Register command to open search results
    context.subscriptions.push(
        vscode.commands.registerCommand('br.openSearchResult', async (filePath: string, internalLineNumber: number) => {
            await openAtInternalLine(filePath, internalLineNumber);
        })
    );

    // Register command to clear search results
    context.subscriptions.push(
        vscode.commands.registerCommand('br.clearSearch', () => {
            clearSearchResults();
        })
    );

    // Register command to modify search
    context.subscriptions.push(
        vscode.commands.registerCommand('br.modifySearch', async () => {
            await modifySearch();
        })
    );

    // Register command to list line in compiled program
    context.subscriptions.push(
        vscode.commands.registerCommand('br.listLine', async (item: SearchMatchItem) => {
            await listLineInCompiledProgram(item.filePath, item.internalLineNumber);
        })
    );
}

/**
 * List a specific line in a compiled BR program
 *
 * This function compiles the source file, loads the compiled program,
 * and runs a LIST command for the specific line number. The output is
 * displayed on screen and the BR console remains open for debugging.
 *
 * @param compiledFilePath - Path to the compiled BR file
 * @param internalLineNumber - BR internal line number to list
 */
async function listLineInCompiledProgram(compiledFilePath: string, internalLineNumber: number): Promise<void> {
    try {
        // Determine source file path
        const parsedPath = path.parse(compiledFilePath);
        const ext = parsedPath.ext.toLowerCase();
        const sourceExt = ext.startsWith('.br') ? '.brs' : '.wbs';
        const sourceFilePath = path.join(parsedPath.dir, parsedPath.name + sourceExt);

        // Check if source file exists
        if (!fs.existsSync(sourceFilePath)) {
            vscode.window.showErrorMessage(`Source file not found: ${sourceFilePath}`);
            return;
        }

        // Format line number as BR expects (00100, 00200, etc.)
        const lineNumberStr = String(internalLineNumber).padStart(5, '0');

        // Create output file for results
        const tmpPath = path.join(LexiPath, 'tmp');
        if (!fs.existsSync(tmpPath)) {
            fs.mkdirSync(tmpPath, { recursive: true });
        }

        // Create procedure file
        let prcContent = '';
        prcContent += 'PROCERR RETURN\n';
        prcContent += `LOAD ":${compiledFilePath}"\n`;
        prcContent += `LIST -${lineNumberStr}\n`;  // No output redirection - display to screen
        // No 'system' command - leave console open for debugging

        const prcFilePath = path.join(tmpPath, 'listLine.prc');
        fs.writeFileSync(prcFilePath, prcContent, 'utf8');

        // Start lexitip
        exec(`start lexitip`, { cwd: LexiPath });

        // Execute the procedure in a new console window that stays open
        setTimeout(() => {
            const relativePrcFile = path.relative(LexiPath, prcFilePath);
            // Use 'start' with /wait to keep the console window open
            exec(`brnative proc ${relativePrcFile}`, {
                cwd: LexiPath
            });

            // Cleanup procedure file after a delay
            setTimeout(() => {
                try {
                    if (fs.existsSync(prcFilePath)) {
                        fs.unlinkSync(prcFilePath);
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }
            }, 2000); // Wait 2 seconds before cleanup
        }, 500); // Wait for lexitip to start

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to list line: ${errorMessage}`);
    }
}

/**
 * Validate BR LIST command search parameters
 *
 * Valid formats (BR LIST native syntax):
 * - 'string' - case-insensitive search
 * - "string" - case-sensitive search
 * - ~'string' - NOT case-insensitive
 * - ~"string" - NOT case-sensitive
 * - Up to 3 search terms allowed (BR LIST limitation)
 *
 * @param input - User input string
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateListParameters("'LET'") → { }
 * validateListParameters("'LET' 'FNEND'") → { }
 * validateListParameters("LET") → { error: "..." }
 */
function validateListParameters(input: string): { error?: string } {
    const trimmed = input.trim();

    // Must contain quotes
    if (!/['"]/.test(trimmed)) {
        return { error: 'Search terms must be quoted. Use \'term\' for case-insensitive or "term" for case-sensitive' };
    }

    // Try to parse as LIST parameters
    const parseResult = parseListSyntax(trimmed);

    if (parseResult.error) {
        return { error: parseResult.error };
    }

    if (parseResult.terms.length > 3) {
        return { error: 'Maximum 3 search terms allowed (BR LIST limitation)' };
    }

    return {};
}

/**
 * Parse search input into BR LIST command parameters
 *
 * Only accepts BR LIST format: 'term1' "term2" ~'term3'
 *
 * @param input - User input string in BR LIST format
 * @returns Parsed terms or error message
 */
function parseSearchInput(input: string): { terms: string[], error?: string } {
    return parseListSyntax(input.trim());
}

/**
 * Parse BR LIST command syntax
 *
 * Matches BR LIST search parameter formats:
 * - 'string' - case-insensitive search
 * - "string" - case-sensitive search
 * - ~'string' - NOT case-insensitive
 * - ~"string" - NOT case-sensitive
 *
 * @param input - User input in BR LIST format
 * @returns Parsed terms array or error message
 *
 * @example
 * parseListSyntax("'LET'") → { terms: ["'LET'"] }
 * parseListSyntax("'LET' \"OPEN\"") → { terms: ["'LET'", "\"OPEN\""] }
 * parseListSyntax("~'test'") → { terms: ["~'test'"] }
 */
function parseListSyntax(input: string): { terms: string[], error?: string } {
    const terms: string[] = [];

    // Regex to match BR LIST search parameters
    // Matches: ~?['"].*?['"]
    const pattern = /(~?)(['"])((?:(?!\2).)*)\2/g;
    let match;

    while ((match = pattern.exec(input)) !== null) {
        const notOp = match[1];      // ~ or empty
        const quote = match[2];      // ' or "
        const term = match[3];       // the search term

        if (!term) {
            return { terms: [], error: 'Empty search term not allowed' };
        }

        // Reconstruct the full parameter as it should appear in LIST command
        terms.push(`${notOp}${quote}${term}${quote}`);
    }

    // Check if we parsed everything (no leftover non-whitespace characters)
    const reconstructed = terms.join(' ');
    const cleanInput = input.replace(/\s+/g, ' ').trim();
    const cleanReconstructed = reconstructed.replace(/\s+/g, ' ').trim();

    if (cleanInput !== cleanReconstructed && terms.length > 0) {
        // There are characters that weren't parsed
        return {
            terms: [],
            error: 'Invalid syntax. Use BR LIST format: \'term\' "term" ~\'term\''
        };
    }

    if (terms.length === 0) {
        return { terms: [], error: 'No valid search terms found. Use quoted strings: \'term\' or "term"' };
    }

    return { terms };
}

/**
 * Execute BR Proc Search across workspace files
 *
 * Main entry point for the Proc Search feature. This function:
 * 1. Prompts user for search terms (comma-separated)
 * 2. Scans workspace for compiled BR programs (.br, .bro, .wb, .wbo)
 * 3. Generates a dynamic BR procedure file with LOAD and LIST commands
 * 4. Executes the search via brnative
 * 5. Parses results and displays in tree view
 * 6. Handles cleanup of temporary files
 *
 * @async
 * @returns Promise that resolves when search is complete
 *
 * @example
 * // Triggered by Ctrl+Alt+F or command palette
 * await executeSearch();
 * // User enters: "LET, FNEND"
 * // Results appear in Proc Search sidebar panel
 */
export async function executeSearch() {
    try {
        // Get search terms from user
        const input = await vscode.window.showInputBox({
            prompt: 'Enter BR LIST search parameters (up to 3 terms)',
            placeHolder: 'e.g., \'LET\' or "OPEN" or \'LET\' "FNEND" ~\'test\'',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter at least one search parameter';
                }

                // Validate BR LIST command syntax
                const validation = validateListParameters(value);
                return validation.error || null;
            }
        });

        if (!input) {
            return; // User cancelled
        }

        // Parse and validate search terms
        const parseResult = parseSearchInput(input);

        if (parseResult.error) {
            vscode.window.showErrorMessage(`Invalid search parameters: ${parseResult.error}`);
            return;
        }

        const searchTerms = parseResult.terms;

        if (searchTerms.length === 0) {
            vscode.window.showWarningMessage('No valid search terms provided');
            return;
        }

        // Store the search terms for modify function
        lastSearchTerms = input;

        // Clear previous results
        searchOutputChannel.clear();
        searchOutputChannel.show(true);
        searchOutputChannel.appendLine(`Proc Search - Searching for: ${searchTerms.join(', ')}`);
        searchOutputChannel.appendLine('');

        // Clear and focus tree view
        searchResultsProvider.clear();

        // Focus the BR Search view
        await vscode.commands.executeCommand('brSearchResults.focus');

        // Find all BR files in workspace (both source and compiled)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        searchOutputChannel.appendLine('Scanning workspace files...');

        // Search only compiled programs (.br, .bro, .wb, .wbo)
        const brFilePattern = '**/*.{br,bro,wb,wbo}';
        const files = await vscode.workspace.findFiles(brFilePattern, '**/node_modules/**');

        if (files.length === 0) {
            searchOutputChannel.appendLine('No compiled BR programs found in workspace');
            return;
        }

        searchOutputChannel.appendLine(`Found ${files.length} files to search`);
        searchOutputChannel.appendLine('');

        // Prepare Lexi directories
        const tmpPath = path.join(LexiPath, 'tmp');

        // Ensure tmp directory exists
        if (!fs.existsSync(tmpPath)) {
            fs.mkdirSync(tmpPath, { recursive: true });
        }

        const prcFile = path.join(tmpPath, 'brSearch.prc');

        // Clean up old result files
        const oldResults = fs.readdirSync(tmpPath).filter(f => f.startsWith('searchResult_'));
        for (const oldFile of oldResults) {
            fs.unlinkSync(path.join(tmpPath, oldFile));
        }

        // Generate procedure file
        searchOutputChannel.appendLine('Generating search procedure...');
        await generateSearchProcedureFile(prcFile, files, searchTerms, tmpPath);

        // Execute BR search
        searchOutputChannel.appendLine('Executing BR search...');
        const success = await executeBRNative(prcFile);

        if (!success) {
            searchOutputChannel.appendLine('');
            searchOutputChannel.appendLine('Search execution failed');
            return;
        }

        // Parse and display results
        searchOutputChannel.appendLine('');
        searchOutputChannel.appendLine('Parsing search results...');

        const { treeItems, matchCount } = await parseAndDisplayResults(tmpPath, files, searchTerms);

        // Update tree view
        searchResultsProvider.refresh(treeItems);

        // Show summary in output channel
        searchOutputChannel.appendLine(`Total matches found: ${matchCount} in ${treeItems.length} file(s)`);

        // Ensure the tree view is visible and focused
        if (treeItems.length > 0) {
            // Reveal the first result
            await searchTreeView.reveal(treeItems[0], {
                select: false,
                focus: false,
                expand: true
            });
        }

        // Cleanup with retry (files may be locked by brnative)
        setTimeout(() => {
            try {
                if (fs.existsSync(prcFile)) {
                    fs.unlinkSync(prcFile);
                }
            } catch (e) {
                // Ignore cleanup errors
            }

            // Clean up result files
            try {
                const resultFiles = fs.readdirSync(tmpPath).filter(f => f.startsWith('searchResult_'));
                for (const resultFile of resultFiles) {
                    try {
                        fs.unlinkSync(path.join(tmpPath, resultFile));
                    } catch (e) {
                        // Ignore individual file cleanup errors
                    }
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        }, 1000); // Wait 1 second before cleanup

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Proc Search error: ${errorMessage}`);
        searchOutputChannel.appendLine(`Error: ${errorMessage}`);
    }
}

/**
 * Generate the BR procedure file for searching
 *
 * Creates a dynamic .prc file that uses BR's LOAD and LIST commands to search
 * compiled programs. For each file and search term, generates appropriate commands.
 *
 * Generated procedure file structure:
 * ```
 * proc noecho
 * PROCERR RETURN
 * LOAD ":C:\path\file.br"
 * LIST searchterm1 >":results.txt"
 * LIST searchterm2 >>":results.txt"
 * system
 * ```
 *
 * @param prcFile - Path where the procedure file will be written
 * @param files - Array of BR file URIs to search
 * @param searchTerms - Array of search terms to look for
 * @param tmpPath - Temporary directory for result files
 *
 * @example
 * await generateProcedureFile(
 *     'C:\\Lexi\\tmp\\brSearch.prc',
 *     [Uri.file('program.br')],
 *     ['LET', 'FNEND'],
 *     'C:\\Lexi\\tmp'
 * );
 */
async function generateSearchProcedureFile(
    prcFile: string,
    files: vscode.Uri[],
    searchTerms: string[],
    tmpPath: string
): Promise<void> {
    const lines: string[] = [];

    lines.push('proc noecho');
    lines.push('PROCERR RETURN');

    // For each file, create a separate output file and search for all terms
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = file.fsPath;
        const resultFile = path.join(tmpPath, `searchResult_${i}.txt`);

        // Check if this is a compiled file
        const ext = path.extname(filePath).toLowerCase();
        const isObject = ['.bro', '.wbo'].includes(ext);

        if (isObject) {
            // For compiled files, use LOAD then LIST
            lines.push(`LOAD ":${filePath}"`);

            for (let j = 0; j < searchTerms.length; j++) {
                const term = searchTerms[j];  // Already formatted: 'term' or "term" or ~'term'
                const appendMode = j === 0 ? '>' : '>>';
                const listCommand = `LIST ${term} ${appendMode}":${resultFile}"`;
                lines.push(listCommand);
            }
        } else {
            // For source files, use input redirection
            for (let j = 0; j < searchTerms.length; j++) {
                const term = searchTerms[j];  // Already formatted: 'term' or "term" or ~'term'
                const appendMode = j === 0 ? '>' : '>>';
                const listCommand = `LIST <":${filePath}" ${term} ${appendMode}":${resultFile}"`;
                lines.push(listCommand);
            }
        }
    }

    lines.push('system');
    lines.push('');

    fs.writeFileSync(prcFile, lines.join('\n'), 'utf8');
}

/**
 * Execute brnative with the procedure file
 */
function executeBRNative(prcFile: string): Promise<boolean> {
    return new Promise((resolve) => {
        const relativePrcFile = path.relative(LexiPath, prcFile);

        // Start lexitip first - don't wait for it to finish
        exec(`start lexitip`, {
            cwd: LexiPath
        });

        // Wait a moment for lexitip to start, then execute the search
        setTimeout(() => {
            exec(`brnative proc ${relativePrcFile}`, {
                cwd: LexiPath
            }, (error, stdout, stderr) => {
                if (error) {
                    searchOutputChannel.appendLine(`brnative exited with error: ${error.message}`);
                    if (stderr) {
                        searchOutputChannel.appendLine(`Error output: ${stderr}`);
                    }
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        }, 500); // Wait 500ms for lexitip to start
    });
}

/**
 * Parse search results and return tree items
 */
async function parseAndDisplayResults(
    tmpPath: string,
    files: vscode.Uri[],
    searchTerms: string[]
): Promise<{ treeItems: SearchFileItem[], matchCount: number }> {
    const treeItems: SearchFileItem[] = [];
    let totalMatchCount = 0;

    // Process each result file
    for (let i = 0; i < files.length; i++) {
        const resultFile = path.join(tmpPath, `searchResult_${i}.txt`);

        if (!fs.existsSync(resultFile)) {
            continue; // No results for this file
        }

        const content = fs.readFileSync(resultFile, 'utf8');

        if (!content || content.trim().length === 0) {
            continue; // Empty results
        }

        const file = files[i];
        const filePath = file.fsPath;
        const matches: SearchMatchItem[] = [];

        // Parse each line from the result file
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0) {
                continue;
            }

            // Extract line number from the beginning of the line
            // BR LIST output format: "00100 LET X=42"
            const match = trimmedLine.match(/^(\d+)\s+(.*)$/);

            if (match) {
                const lineNumber = parseInt(match[1]);
                const lineContent = trimmedLine;

                matches.push(new SearchMatchItem(filePath, lineNumber, lineContent));
                totalMatchCount++;
            }
        }

        if (matches.length > 0) {
            treeItems.push(new SearchFileItem(filePath, matches));
        }
    }

    if (totalMatchCount === 0) {
        searchOutputChannel.appendLine('No matches found');
    }

    // Sort tree items by file path for consistent ordering
    treeItems.sort((a, b) => a.filePath.localeCompare(b.filePath));

    return { treeItems, matchCount: totalMatchCount };
}

/**
 * Clear all search results from the tree view and output channel
 */
function clearSearchResults(): void {
    searchResultsProvider.clear();
    searchOutputChannel.clear();
    searchOutputChannel.appendLine('Search results cleared');
    lastSearchTerms = undefined;
}

/**
 * Modify the current search by opening the input box with the last search terms
 * pre-populated, allowing the user to edit and re-run the search
 */
async function modifySearch(): Promise<void> {
    // Get search terms from user, pre-populated with last search if available
    const input = await vscode.window.showInputBox({
        prompt: 'Enter BR LIST search parameters (up to 3 terms)',
        placeHolder: 'e.g., \'LET\' or "OPEN" or \'LET\' "FNEND" ~\'test\'',
        value: lastSearchTerms, // Pre-populate with last search
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter at least one search parameter';
            }

            // Validate BR LIST command syntax
            const validation = validateListParameters(value);
            return validation.error || null;
        }
    });

    if (!input) {
        return; // User cancelled
    }

    // Parse and validate search terms
    const parseResult = parseSearchInput(input);

    if (parseResult.error) {
        vscode.window.showErrorMessage(`Invalid search parameters: ${parseResult.error}`);
        return;
    }

    const searchTerms = parseResult.terms;

    if (searchTerms.length === 0) {
        vscode.window.showWarningMessage('No valid search terms provided');
        return;
    }

    // Store the search terms for next modify
    lastSearchTerms = input;

    // Clear previous results
    searchOutputChannel.clear();
    searchOutputChannel.show(true);
    searchOutputChannel.appendLine(`Proc Search - Searching for: ${searchTerms.join(', ')}`);
    searchOutputChannel.appendLine('');

    // Clear and focus tree view
    searchResultsProvider.clear();

    // Focus the BR Search view
    await vscode.commands.executeCommand('brSearchResults.focus');

    // Find all BR files in workspace (both source and compiled)
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    searchOutputChannel.appendLine('Scanning workspace files...');

    // Search only compiled programs (.br, .bro, .wb, .wbo)
    const brFilePattern = '**/*.{br,bro,wb,wbo}';
    const files = await vscode.workspace.findFiles(brFilePattern, '**/node_modules/**');

    if (files.length === 0) {
        searchOutputChannel.appendLine('No compiled BR programs found in workspace');
        return;
    }

    searchOutputChannel.appendLine(`Found ${files.length} files to search`);
    searchOutputChannel.appendLine('');

    // Prepare Lexi directories
    const tmpPath = path.join(LexiPath, 'tmp');

    // Ensure tmp directory exists
    if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath, { recursive: true });
    }

    const prcFile = path.join(tmpPath, 'brSearch.prc');

    // Clean up old result files
    const oldResults = fs.readdirSync(tmpPath).filter(f => f.startsWith('searchResult_'));
    for (const oldFile of oldResults) {
        fs.unlinkSync(path.join(tmpPath, oldFile));
    }

    // Generate procedure file
    searchOutputChannel.appendLine('Generating search procedure...');
    await generateSearchProcedureFile(prcFile, files, searchTerms, tmpPath);

    // Execute BR search
    searchOutputChannel.appendLine('Executing BR search...');
    const success = await executeBRNative(prcFile);

    if (!success) {
        searchOutputChannel.appendLine('');
        searchOutputChannel.appendLine('Search execution failed');
        return;
    }

    // Parse and display results
    searchOutputChannel.appendLine('');
    searchOutputChannel.appendLine('Parsing search results...');

    const { treeItems, matchCount } = await parseAndDisplayResults(tmpPath, files, searchTerms);

    // Update tree view
    searchResultsProvider.refresh(treeItems);

    // Show summary in output channel
    searchOutputChannel.appendLine(`Total matches found: ${matchCount} in ${treeItems.length} file(s)`);

    // Ensure the tree view is visible and focused
    if (treeItems.length > 0) {
        // Reveal the first result
        await searchTreeView.reveal(treeItems[0], {
            select: false,
            focus: false,
            expand: true
        });
    }

    // Cleanup with retry (files may be locked by brnative)
    setTimeout(() => {
        try {
            if (fs.existsSync(prcFile)) {
                fs.unlinkSync(prcFile);
            }
        } catch (e) {
            // Ignore cleanup errors
        }

        // Clean up result files
        try {
            const resultFiles = fs.readdirSync(tmpPath).filter(f => f.startsWith('searchResult_'));
            for (const resultFile of resultFiles) {
                try {
                    fs.unlinkSync(path.join(tmpPath, resultFile));
                } catch (e) {
                    // Ignore individual file cleanup errors
                }
            }
        } catch (e) {
            // Ignore cleanup errors
        }
    }, 1000); // Wait 1 second before cleanup
}
