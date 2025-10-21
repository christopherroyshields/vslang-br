import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const LexiPath = path.normalize(__dirname + "\\..\\Lexi");
let searchOutputChannel: vscode.OutputChannel;
let searchResultsProvider: BrSearchResultsProvider;
let searchTreeView: vscode.TreeView<vscode.TreeItem>;

/**
 * URI Handler for opening BR files at specific internal line numbers
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
        this.iconPath = new vscode.ThemeIcon('go-to-file');
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
        // Use resourceUri to get the correct file icon based on extension
        this.resourceUri = vscode.Uri.file(filePath);
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
}

/**
 * Execute BR search across workspace files
 */
export async function executeSearch() {
    try {
        // Get search terms from user
        const input = await vscode.window.showInputBox({
            prompt: 'Enter search terms (comma-separated)',
            placeHolder: 'e.g., LET, FNEND, OPEN',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter at least one search term';
                }
                return null;
            }
        });

        if (!input) {
            return; // User cancelled
        }

        // Parse search terms
        const searchTerms = input.split(',').map(term => term.trim()).filter(term => term.length > 0);

        if (searchTerms.length === 0) {
            vscode.window.showWarningMessage('No valid search terms provided');
            return;
        }

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
        await generateProcedureFile(prcFile, files, searchTerms, tmpPath);

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
 */
async function generateProcedureFile(
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
        const isCompiled = ['.br', '.bro', '.wb', '.wbo'].includes(ext);

        if (isCompiled) {
            // For compiled files, use LOAD then LIST
            lines.push(`LOAD ":${filePath}"`);

            for (let j = 0; j < searchTerms.length; j++) {
                const term = searchTerms[j];
                const appendMode = j === 0 ? '>' : '>>';
                const listCommand = `LIST ${term} ${appendMode}":${resultFile}"`;
                lines.push(listCommand);
            }
        } else {
            // For source files, use input redirection
            for (let j = 0; j < searchTerms.length; j++) {
                const term = searchTerms[j];
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

    return { treeItems, matchCount: totalMatchCount };
}
