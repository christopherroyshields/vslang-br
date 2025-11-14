import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Disposable, ExtensionContext, Position, Range, TextDocument, Uri, WorkspaceFolder, commands, languages, window, workspace } from "vscode";
import BrParser from "../parser";
import { debounce } from "../util/common";
import { Project } from "./Project";
import BrFunctionDiagnostics from "./BrFunctionDiagnostics";

export default class BrDiagnostics implements Disposable {
  parser: BrParser
  diagnosticCollection = languages.createDiagnosticCollection('BR Scanner')
  functionDiagnostics: BrFunctionDiagnostics
  configuredProjects: Map<WorkspaceFolder, Project>

  constructor(parser: BrParser, context: ExtensionContext, configuredProjects: Map<WorkspaceFolder, Project>) {
    this.parser = parser
    this.configuredProjects = configuredProjects
    this.functionDiagnostics = new BrFunctionDiagnostics(parser)
    context.subscriptions.push(this.diagnosticCollection)
    if (window.activeTextEditor && window.activeTextEditor.document.languageId == "br"){
      const editor = window.activeTextEditor
      this.updateDiagnostics(editor.document);
    }

    const func = (document: TextDocument) => {
      this.updateDiagnostics(document);
    }
  
    const fn = debounce(func)
  
    context.subscriptions.push(workspace.onDidChangeTextDocument(e => {
      const document  = e.document;
      if (document.languageId === "br"){
        fn(document)
      }
    }))

    context.subscriptions.push(window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === "br") {
        this.updateDiagnostics(editor.document);
      }
    }));
  
    context.subscriptions.push(workspace.onDidCloseTextDocument(document => {
      this.diagnosticCollection.delete(document.uri)
    }))

    context.subscriptions.push(commands.registerCommand('vslang-br.scanAll', async () => {
      await this.scanAll()
    }))

  }

  dispose() {
    this.diagnosticCollection.clear()
  }

  async scanAll() {
    const globPattern = workspace.getConfiguration('br').get('sourceFileGlobPattern', '**/*.{brs,wbs}')
    const sourceFiles = await workspace.findFiles(globPattern)
    for (const sourceUri of sourceFiles) {
      const libText = await workspace.fs.readFile(sourceUri)
      if (libText){
        console.log("scanning: " + sourceUri.toString())
        const diagnostics = await this.parser.getErrors(sourceUri, libText.toString())
        this.diagnosticCollection.set(sourceUri, diagnostics)
      }
    }
  }

  updateDiagnostics(document: TextDocument){
    const diagnostics: Diagnostic[] = this.parser.getDiagnostics(document)

    // Add function diagnostics
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)
    const project = workspaceFolder ? this.configuredProjects.get(workspaceFolder) : undefined
    const functionDiags = this.functionDiagnostics.getDiagnostics(document, project)
    diagnostics.push(...functionDiags)

    this.diagnosticCollection.set(document.uri, diagnostics)
  }
}
