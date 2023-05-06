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

    const dummyRange = new Range(0,0,0,0)
    this.configuredProjects.forEach(project => {
      if (project){
        for (const [uri, lib] of project.sourceFiles) {
          for (const fn of lib.functions){
            const loc = new Location(lib.uri,dummyRange)
            const symbolInfo = new SymbolInformation(fn.name,SymbolKind.Function,"",loc)
            symbols.push(symbolInfo)
          }
        }
      }
    })

    return symbols
  }

  async resolveWorkspaceSymbol(symbol: SymbolInformation, token: CancellationToken): Promise<SymbolInformation> {
    if (symbol.kind === SymbolKind.Function){
      const fn = await this.parser.getFunctionByName(symbol.name,symbol.location.uri)
      if (fn){
        symbol.location.range = fn.nameRange
      }
    }
    return symbol
  }
}