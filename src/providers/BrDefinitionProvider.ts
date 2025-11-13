import {
  CancellationToken,
  Definition,
  DefinitionProvider,
  Location,
  Position,
  ProviderResult,
  TextDocument,
  WorkspaceFolder
} from "vscode";
import BrParser from "../parser";
import { Project } from '../class/Project';
import { getFunctionByName } from '../completions/functions';
import { SyntaxNode } from "../../vendor/tree-sitter";

export default class BrDefinitionProvider implements DefinitionProvider {
  parser: BrParser
  configuredProjects: Map<WorkspaceFolder, Project>

  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }

  async provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<Definition | undefined> {
    const wordRange = document.getWordRangeAtPosition(position, /\w+\$?/)
    if (!wordRange) return undefined

    let node = this.parser.getNodeAtPosition(document, position)
    if (!node) return undefined

    // If we're on a goto_statement or gosub_statement, try to get the line_reference child
    if (node.type === 'goto_statement' || node.type === 'gosub_statement') {
      const lineRefChild = node.children.find(child => child.type === 'line_reference')
      if (lineRefChild) {
        node = lineRefChild
      }
    }

    switch (node.type) {
      case 'function_name':
        // Don't provide definitions for system functions
        if (node.parent?.type === "numeric_system_function" || node.parent?.type === "string_system_function"){
          return undefined
        }
        return this.findFunctionDefinition(node.text, document)

      case 'label_reference':
        return this.findLabelDefinition(node.text, document)

      case 'line_reference':
        return this.findLineNumberDefinition(node.text, document)

      case 'stringidentifier':
      case 'numberidentifier':
        return this.findVariableDefinition(node, document)

      default:
        return undefined
    }
  }

  private async findFunctionDefinition(
    functionName: string,
    document: TextDocument
  ): Promise<Location | undefined> {
    // 1. Check for system function (no definition to navigate to)
    const systemFunc = getFunctionByName(functionName)
    if (systemFunc) return undefined

    // 2. Find workspace folder
    let workspaceFolder: WorkspaceFolder | undefined
    for (const [folder] of this.configuredProjects) {
      if (document.uri.fsPath.startsWith(folder.uri.fsPath)) {
        workspaceFolder = folder
        break
      }
    }
    if (!workspaceFolder) return undefined

    const project = this.configuredProjects.get(workspaceFolder)
    if (!project) return undefined

    // 3. Check current document for local functions first (highest priority)
    const currentDocSource = project.sourceFiles.get(document.uri.toString())
    if (currentDocSource) {
      const fn = await currentDocSource.getFunctionByName(functionName)
      if (fn && !fn.isLibrary) {
        return new Location(document.uri, fn.nameRange)
      }
    }

    // 4. Then check library index (lower priority)
    let libFuncMetadata = project.libraryIndex.getFunction(functionName)
    if (!libFuncMetadata && functionName.toLowerCase().startsWith('fn')) {
      libFuncMetadata = project.libraryIndex.getFunction(functionName.substring(2))
    }

    if (libFuncMetadata) {
      const sourceDoc = project.sourceFiles.get(libFuncMetadata.uri.toString())
      if (sourceDoc) {
        const fn = await sourceDoc.getFunctionByName(functionName)
        if (fn) {
          return new Location(libFuncMetadata.uri, fn.nameRange)
        }
      }
    }

    return undefined
  }

  private findLabelDefinition(
    labelName: string,
    document: TextDocument
  ): Location | undefined {
    // Use parser to find label definition in current document
    const tree = this.parser.getDocumentTree(document)
    if (!tree) return undefined

    // Create case-insensitive regex pattern
    const name_match = labelName.replace(/[A-Za-z]/g, (c: string) => {
      return `[${c.toUpperCase()}${c.toLowerCase()}]`
    }).replace("$","\\\\$").replace(":","")

    const query = `((label) @label (#match? @label "^${name_match}:$"))`
    const results = this.parser.match(query, tree.rootNode)

    if (results.length > 0) {
      const labelNode = results[0].captures[0].node
      return new Location(
        document.uri,
        this.parser.getNodeRange(labelNode)
      )
    }

    return undefined
  }

  private findLineNumberDefinition(
    lineNumber: string,
    document: TextDocument
  ): Location | undefined {
    // Use parser to find line_number definition in current document
    const tree = this.parser.getDocumentTree(document)
    if (!tree) return undefined

    // Normalize line number by converting to integer (handles different leading zeros)
    const targetLineNum = parseInt(lineNumber.trim(), 10)
    if (isNaN(targetLineNum)) return undefined

    // Get all line_number nodes and manually check text
    const query = `((line_number) @line)`
    const results = this.parser.match(query, tree.rootNode)

    for (const result of results) {
      const lineNumNode = result.captures[0].node
      const nodeLineNum = parseInt(lineNumNode.text.trim(), 10)
      if (nodeLineNum === targetLineNum) {
        return new Location(
          document.uri,
          this.parser.getNodeRange(lineNumNode)
        )
      }
    }

    return undefined
  }

  private findVariableDefinition(
    node: SyntaxNode,
    document: TextDocument
  ): Location | undefined {
    // Find DIM statement for variable
    const tree = this.parser.getDocumentTree(document)
    if (!tree) return undefined

    // Create case-insensitive regex pattern
    const name_match = node.text.replace(/[A-Za-z]/g, (c: string) => {
      return `[${c.toUpperCase()}${c.toLowerCase()}]`
    }).replace("$","\\\\$")

    // Query for variable declarations in DIM statements
    const query = `(dim_statement [
      (stringreference name: (_) @name)
      (numberreference name: (_) @name)
      (stringarray name: (_) @name)
      (numberarray name: (_) @name)
    ] (#match? @name "^${name_match}$"))`

    const results = this.parser.match(query, tree.rootNode)
    if (results.length > 0) {
      const dimNode = results[0].captures[0].node
      return new Location(document.uri, this.parser.getNodeRange(dimNode))
    }

    return undefined
  }
}
