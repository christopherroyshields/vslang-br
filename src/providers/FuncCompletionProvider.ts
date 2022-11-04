import path = require("path");
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionList, MarkdownString, Position, TextDocument, workspace, WorkspaceFolder } from "vscode";
import ConfiguredProject from "../class/ConfiguredProject";
import BrSourceDocument from "../class/BrSourceDocument";
import BaseCompletionProvider from "./BaseCompletionProvider";
import ProjectSourceDocument from "../class/ProjectSourceDocument";
import { VariableType } from "../types/VariableType";
import { BrVariable } from "../class/BrVariable";

/**
 * Library statement linkage list completion provider
 */
 export default class FuncCompletionProvider extends BaseCompletionProvider {
  constructor(configuredProjects: Map<WorkspaceFolder, Map<string, ProjectSourceDocument>>) {
    super(configuredProjects)
  }
  provideCompletionItems(doc: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const completionItems: CompletionItem[] = []

    const workspaceFolder = workspace.getWorkspaceFolder(doc.uri)
    if (workspaceFolder){
      const project = this.configuredProjects.get(workspaceFolder)
      if (project){
        for (const [uri, lib] of project) {
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
      }
    }

    let docText = doc.getText()
    const currentWordRange = doc.getWordRangeAtPosition(position, /\w+\$?/)
    if (currentWordRange){
      const start = doc.offsetAt(currentWordRange.start)
      const end = doc.offsetAt(currentWordRange.end)
      docText = docText.substring(0, start) + "@".repeat(end - start) + docText.substring(end)
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
        label: v.name.replace(/mat /i, ""),
        detail: ` (${typeLabel.get(v.type)})`
      }
      const completionItem = new CompletionItem(label, CompletionItemKind.Variable)
      completionItem.detail = `(variable) ${v.name}: ${typeLabel.get(v.type)}`
      completionItems.push(completionItem)
    }

    return completionItems
  }
}

const typeLabel = new Map<VariableType, string>([
  [VariableType.number, "Number"],
  [VariableType.string, "String"],
  [VariableType.numberarray, "Number Array"],
  [VariableType.stringarray, "String Array"]
])