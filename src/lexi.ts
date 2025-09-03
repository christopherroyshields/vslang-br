import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

const LexiPath = path.normalize(__dirname+"\\..\\Lexi")
let autoCompileStatusBarItem: vscode.StatusBarItem;
const AutoCompileState: Map<string, boolean> = new Map(); 

export function activateLexi(context: vscode.ExtensionContext) {
	// Create a custom editor provider for compiled BR files
	const provider = new CompiledBRFileProvider();
	
	// Register for all compiled BR file extensions
	const disposable = vscode.window.registerCustomEditorProvider('vslang-br.compiledBREditor', provider, {
		supportsMultipleEditorsPerDocument: false
	});
	
	context.subscriptions.push(disposable);
	
	context.subscriptions.push(vscode.commands.registerCommand('vslang-br.compile', () => {
		const activeFilename: string | undefined = vscode.window.activeTextEditor?.document.fileName;
		if (activeFilename){
			compileBrProgram(activeFilename);
		}
	}));

	const autoCompileCommand = 'vslang-br.toggleAutoCompile';
	autoCompileStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
	autoCompileStatusBarItem.command = autoCompileCommand;
	autoCompileStatusBarItem.text = 'Auto-Compile Off';
	context.subscriptions.push(autoCompileStatusBarItem);

	const editor = vscode.window.activeTextEditor;
	if (editor && editor.document.languageId === "br"){
		autoCompileStatusBarItem.show();
	}

	context.subscriptions.push(vscode.commands.registerCommand(
		autoCompileCommand,
		() => {
			toggleAutoCompile();
		}
	))

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === 'br') {
			autoCompileStatusBarItem.show();
		} else {
			autoCompileStatusBarItem.hide();
		}
	}))

	vscode.workspace.onDidSaveTextDocument((document) => {
		if (AutoCompileState.get(document.fileName)){
			compileBrProgram(document.fileName);
		}
	}, context.subscriptions)

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.run', (editor) => {
    if (editor.document.languageId === "br"){
      exec(`${LexiPath}\\RunBR.cmd ${editor.document.fileName}`, {
        cwd: `${LexiPath}`
      });
    }
  }))
  
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.addLineNumbers', (editor) => {
    if (editor.document.languageId === "br"){
      exec(`${LexiPath}\\AddLN.cmd ${editor.document.fileName}`, {
        cwd: `${LexiPath}`
      });
    }
  }))

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('vslang-br.stripLineNumbers', (editor) => {
    if (editor.document.languageId === "br"){
      exec(`${LexiPath}\\StripLN.cmd ${editor.document.fileName}`, {
        cwd: `${LexiPath}`
      });
    }
  }))

  context.subscriptions.push(vscode.commands.registerCommand('vslang-br.setBr41', () => {
    exec(`${LexiPath}\\set41.cmd`, {
      cwd: `${LexiPath}`
    });
  }))

  context.subscriptions.push(vscode.commands.registerCommand('vslang-br.setBr42', () => {
    exec(`${LexiPath}\\set42.cmd`, {
      cwd: `${LexiPath}`
    });
  }))

  context.subscriptions.push(vscode.commands.registerCommand('vslang-br.setBr43', () => {
    exec(`${LexiPath}\\set43.cmd`, {
      cwd: `${LexiPath}`
    });
  }))

  context.subscriptions.push(vscode.commands.registerCommand('vslang-br.Decompile', (fileUri: vscode.Uri) => {
    // This command requires a file URI parameter from explorer context
    if (!fileUri) {
      vscode.window.showErrorMessage('Please use this command from the file explorer context menu');
      return;
    }
    
    const targetFile = fileUri.fsPath;
    
    if (targetFile) {
      // Get configured extensions
      const config = vscode.workspace.getConfiguration('br.decompile');
      const extensionMap = config.get<Record<string, string>>('sourceExtensions', {
        '.br': '.brs',
        '.bro': '.brs',
        '.wb': '.wbs',
        '.wbo': '.wbs'
      });
      
      // Check if the file is a compiled BR program
      const ext = path.extname(targetFile).toLowerCase();
      if (ext in extensionMap) {
        decompileBrProgram(targetFile);
      } else {
        const supportedExts = Object.keys(extensionMap).join(', ');
        vscode.window.showErrorMessage(`Please select a compiled BR program file (${supportedExts})`);
      }
    } else {
      vscode.window.showErrorMessage('Please select a file to decompile');
    }
  }))
}

async function decompileBrProgram(activeFilename: string) {
	// Show success message since this is called from explicit user action
	vscode.window.showInformationMessage(`Decompiling ${path.basename(activeFilename)}...`);
	await decompileAndOpen(activeFilename, true, true);
}

function compileBrProgram(activeFilename: string) {
	exec(`${LexiPath}\\ConvStoO.cmd ${activeFilename}`, {
		cwd: `${LexiPath}`
	});
}

function toggleAutoCompile() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		if (AutoCompileState.get(editor.document.fileName) === undefined){
			AutoCompileState.set(editor.document.fileName, true);
			autoCompileStatusBarItem.text = "Auto-Compile On";
		} else {
			AutoCompileState.set(editor.document.fileName, !AutoCompileState.get(editor.document.fileName));
			autoCompileStatusBarItem.text = AutoCompileState.get(editor.document.fileName) ? "Auto-Compile On" : "Auto-Compile Off";
		}
	}
}

// Custom editor provider for compiled BR files
class CompiledBRFileProvider implements vscode.CustomReadonlyEditorProvider {
	
	public async openCustomDocument(
		uri: vscode.Uri,
		openContext: vscode.CustomDocumentOpenContext,
		_token: vscode.CancellationToken
	): Promise<CompiledBRDocument> {
		// Immediately handle the file opening
		await this.handleCompiledFile(uri);
		return new CompiledBRDocument(uri);
	}

	public async resolveCustomEditor(
		document: CompiledBRDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Show a simple message in the webview instead of disposing
		webviewPanel.webview.html = `
			<html>
				<body style="padding: 20px;">
					<h3>BR Compiled File</h3>
					<p>This file has been automatically handled.</p>
					<p>The source code should be opening in another tab.</p>
				</body>
			</html>
		`;
		
		// Close the webview after a delay to avoid disposal errors
		setTimeout(() => {
			try {
				webviewPanel.dispose();
			} catch (e) {
				// Ignore disposal errors
			}
		}, 500);
	}
	
	private async handleCompiledFile(uri: vscode.Uri): Promise<void> {
		// Get configured extensions
		const config = vscode.workspace.getConfiguration('br.decompile');
		const extensionMap = config.get<Record<string, string>>('sourceExtensions', {
			'.br': '.brs',
			'.bro': '.brs',
			'.wb': '.wbs',
			'.wbo': '.wbs'
		});
		
		const filePath = uri.fsPath;
		const ext = path.extname(filePath).toLowerCase();
		
		// Check if this is a compiled BR file
		if (ext in extensionMap) {
			// Determine the source file path
			const parsedPath = path.parse(filePath);
			const sourceExt = extensionMap[ext];
			const sourceFilePath = path.join(parsedPath.dir, parsedPath.name + sourceExt);
			
			// Check if source file already exists
			if (fs.existsSync(sourceFilePath)) {
				// Open the existing source file
				const doc = await vscode.workspace.openTextDocument(sourceFilePath);
				await vscode.window.showTextDocument(doc, { preview: false });
			} else {
				// Decompile and open
				vscode.window.showInformationMessage(`Decompiling ${path.basename(filePath)}...`);
				decompileAndOpen(filePath, false, false); // Don't prompt for overwrite since file doesn't exist
			}
		}
	}
}

// Custom document for compiled BR files
class CompiledBRDocument implements vscode.CustomDocument {
	constructor(public readonly uri: vscode.Uri) {}
	
	dispose(): void {
		// Nothing to dispose
	}
}


async function decompileAndOpen(activeFilename: string, showSuccessMessage: boolean, checkOverwrite: boolean) {
	const parsedPath = path.parse(activeFilename);
	
	// Get extension mapping from configuration
	const config = vscode.workspace.getConfiguration('br.decompile');
	const extensionMap = config.get<Record<string, string>>('sourceExtensions', {
		'.br': '.brs',
		'.bro': '.brs',
		'.wb': '.wbs',
		'.wbo': '.wbs'
	});
	
	// Determine output extension based on input
	const inputExt = parsedPath.ext.toLowerCase();
	const outputExt = extensionMap[inputExt] || '.brs';
	
	const npneName = parsedPath.name;
	const folder = parsedPath.dir;
	const outputFileName = npneName + outputExt;
	const finalOutputPath = path.join(folder, outputFileName);
	
	// Check if output file exists and warn user
	if (checkOverwrite && fs.existsSync(finalOutputPath)) {
		const answer = await vscode.window.showWarningMessage(
			`${outputFileName} already exists. Do you want to overwrite it?`,
			'Yes, Overwrite',
			'No, Cancel'
		);
		
		if (answer !== 'Yes, Overwrite') {
			return; // User cancelled
		}
	}
	
	// Ensure tmp directory exists
	const tmpDir = path.join(LexiPath, 'tmp');
	if (!fs.existsSync(tmpDir)) {
		fs.mkdirSync(tmpDir, { recursive: true });
	}
	
	// Create the .prc file content
	let prcContent = '';
	prcContent += 'proc noecho\n';
	prcContent += `load ":${activeFilename}"\n`;
	prcContent += `list >":${path.join(LexiPath, 'tmp', outputFileName)}"\n`;
	prcContent += 'system\n';
	
	// Write the .prc file
	const prcFilePath = path.join(LexiPath, 'decompile.prc');
	fs.writeFileSync(prcFilePath, prcContent);
	
	// Start lexitip first - don't wait for it to finish
	exec(`start lexitip`, {
		cwd: LexiPath
	});
	
	// Execute the decompilation
	exec(`brnative proc decompile.prc`, {
		cwd: LexiPath
	}, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(`Decompilation failed: ${error.message}`);
			return;
		}
		
		// Copy the decompiled file back to the original location
		const tempFilePath = path.join(LexiPath, 'tmp', outputFileName);
		
		if (fs.existsSync(tempFilePath)) {
			fs.copyFileSync(tempFilePath, finalOutputPath);
			fs.unlinkSync(tempFilePath); // Delete temp file
			
			// Open the decompiled file in VS Code
			vscode.workspace.openTextDocument(finalOutputPath).then(doc => {
				vscode.window.showTextDocument(doc);
				if (showSuccessMessage) {
					vscode.window.showInformationMessage(`Successfully decompiled to ${outputFileName}`);
				}
			});
		}
		
		// Clean up the .prc file
		if (fs.existsSync(prcFilePath)) {
			fs.unlinkSync(prcFilePath);
		}
	});
}

