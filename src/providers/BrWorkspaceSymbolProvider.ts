import { CancellationToken, Position, ProviderResult, Range, SymbolInformation, TextDocument, TextDocumentShowOptions, Uri, WorkspaceFolder, WorkspaceSymbolProvider, languages, window, workspace } from "vscode";
import BrParser from "../parser";
import { Project } from "../class/Project";
import { performance } from "perf_hooks";
import Parser = require("web-tree-sitter");
import { SymbolKind } from "vscode-languageclient";
import { Location } from "vscode";

export default class BrWorkspaceSymbolProvider implements WorkspaceSymbolProvider {
  parser: BrParser
  configuredProjects: Map<WorkspaceFolder, Project>
  constructor(parser: BrParser, configuredProjects: Map<WorkspaceFolder, Project>) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }
  async provideWorkspaceSymbols(query: string, token: CancellationToken): Promise<SymbolInformation[]> {
    const symbols: SymbolInformation[] = []

    const startTime = performance.now()

    this.configuredProjects.forEach(project => {
      if (project){
        for (const [uri, lib] of project.sourceFiles) {
          for (const fn of lib.functions){
            const loc = new Location(Uri.parse(uri),fn.range)
            const symbolInfo = new SymbolInformation(fn.name,SymbolKind.Function,"",loc)
            symbols.push(symbolInfo)
          }
        }
      }
    })

    // const uris = await workspace.findFiles("**/*.brs")
    // for (const uri of uris) {
    //   if (token.isCancellationRequested) break
    //   const buffer = await workspace.fs.readFile(uri)
    //   const text = buffer.toString()
    //   const DEF_FN = /def\s+(?:(?<isLibrary>lib\w*)\s+)?(?<name>\w*\$?)/gi
    //   // DEF_FN.lastIndex = 0
    //   const match = DEF_FN.exec(text)
    //   if (match?.groups?.name && match?.groups?.name.toLocaleLowerCase().search(query.toLocaleLowerCase())>=0){
    //     match.groups.name
    //     const lines = text.substring(0,match.index).split(/\r?\n/)
    //     const startRow = lines.length - 1
    //     const startCol = lines[lines.length-1].length
    //     const matchLines = match[0].split(/\r?\n/)
    //     const endRow = startRow + matchLines.length-1
    //     const endCol = matchLines[matchLines.length-1].length
    //     const matchRange = new Range(startRow,startCol,endRow, endCol)
    //     const loc = new Location(uri,matchRange)
    //     const symbolInfo = new SymbolInformation(match.groups.name,SymbolKind.Function,"test",loc)
    //     symbols.push(symbolInfo)
    //   }
    // }
    const endTime = performance.now()
    console.log(`WS Token File: ${endTime - startTime} milliseconds`)
    return symbols
  }

  resolveWorkspaceSymbol?(symbol: SymbolInformation, token: CancellationToken): ProviderResult<SymbolInformation> {
    return symbol
  }
}