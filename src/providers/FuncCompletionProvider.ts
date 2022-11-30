import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionList, MarkdownString, Position, TextDocument, Uri, workspace, WorkspaceFolder } from "vscode"
import BrSourceDocument from "../class/BrSourceDocument"
import BaseCompletionProvider from "./BaseCompletionProvider"
import { TypeLabel } from "../util/common"
import { Project } from "./Project"
import { InternalFunctions } from "../completions/functions";

/**
 * Library statement linkage list completion provider
 */
export default class FuncCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Project>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const completionItems: CompletionItem[] = []

    const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
        for (const [uri, lib] of project.sourceFiles) {
          if (uri !== doc.uri.toString()){
            for (const fn of lib.functions){
              if (fn.isLibrary){
                completionItems.push({
                  kind: CompletionItemKind.Function,
                  label: {
                    label: fn.name,
                    detail: ' (library function)',
                    description: path.basename(lib.uri.fsPath)
                  },
                  detail: `(library function) ${fn.name}${fn.generateSignature()}`,
                  documentation: new MarkdownString(fn.getAllDocs())
                })
              }
            }
          }
        }

        for (const [uri, layout] of project.layouts){
          for (const subscript of layout.subscripts) {
            const fileName = path.parse(Uri.parse(uri).fsPath).base
            completionItems.push({
              kind: CompletionItemKind.Variable,
              label: {
                label: layout.prefix + subscript.name.replace("$",""),
                detail: ' (subscript)',
                description: fileName
              },
              detail: `(subscript) ${subscript.name} ${subscript.format}`,
              documentation: subscript.description
            })
          }
        }
      }
    }

    let docText = doc.getText()
    const currentWordRange = doc.getWordRangeAtPosition(position, /\w+\$?/)
    if (currentWordRange){
      const start = doc.offsetAt(currentWordRange.start)
      const end = doc.offsetAt(currentWordRange.end)
      docText = docText.substring(0, start) + " ".repeat(end - start) + docText.substring(end)
    }
    
    for (const fn of InternalFunctions) {
      completionItems.push({
        kind: CompletionItemKind.Function,
        label: {
          label: fn.name,
          detail: `(internal function)`
        },
        detail: `(internal function) ${fn.name}${fn.generateSignature()}`,
        documentation: new MarkdownString(fn.getAllDocs())
      })
    }    

    const source = new BrSourceDocument(docText)
    for (const fn of source.functions) {
      completionItems.push({
        kind: CompletionItemKind.Function,
        label: {
          label: fn.name,
          detail: ` (${fn.isLibrary ? 'library' : 'local'} function)`
        },
        detail: `(${fn.isLibrary ? 'library' : 'local'} function) ${fn.name}${fn.generateSignature()}`,
        documentation: new MarkdownString(fn.getAllDocs())
      })
    }

    for (const [k,v] of source.variables){
      const label: CompletionItemLabel = {
        label: v.name.replace(/mat[ \t]*/i, ""),
        detail: ` (${TypeLabel.get(v.type)})`
      }
      const completionItem = new CompletionItem(label, CompletionItemKind.Variable)
      completionItem.detail = `(variable) ${v.name}: ${TypeLabel.get(v.type)}`
      completionItems.push(completionItem)
    }

    return completionItems
  }
}