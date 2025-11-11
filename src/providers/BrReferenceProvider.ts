import { CancellationToken, Location, Position, ProviderResult, Range, ReferenceContext, ReferenceProvider, TextDocument, WorkspaceFolder, workspace } from "vscode";
import BrParser from "../parser";
import { Project } from "../class/Project";
import { performance } from 'perf_hooks';

export default class BrReferenceProvder implements ReferenceProvider {
  parser: BrParser
  configuredProjects: Map<WorkspaceFolder, Project>

  constructor(configuredProjects: Map<WorkspaceFolder, Project>, parser: BrParser) {
    this.configuredProjects = configuredProjects
    this.parser = parser
  }

  async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Promise<Location[]> {
    const locations: Location[] = []
    const wordRange = document.getWordRangeAtPosition(position, /\w+\$?/)

    if (!wordRange) {
      return locations
    }

    const word = document.getText(wordRange)
    const node = this.parser.getNodeAtPosition(document, position)

    if (!node) {
      return locations
    }

    const nodeType = node.type

    // For functions, search across all files in workspace
    if (nodeType === "function_name") {
      // PRIORITY 1: Search current document first for immediate results
      const localRanges = this.parser.getOccurences(word, document, wordRange)
      localRanges.forEach(r => {
        locations.push(new Location(document.uri, r))
      })

      // PRIORITY 2: Search other files in workspace
      // Find workspace folder
      let workspaceFolder: WorkspaceFolder | undefined
      for (const [folder] of this.configuredProjects) {
        if (document.uri.fsPath.startsWith(folder.uri.fsPath)) {
          workspaceFolder = folder
          break
        }
      }

      if (workspaceFolder) {
        const project = this.configuredProjects.get(workspaceFolder)
        if (project) {
          // Create case-insensitive regex for fast pre-scan
          const searchRegex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

          const searchStartTime = performance.now()
          let totalFiles = 0
          let filesScanned = 0
          let filesWithMatches = 0

          // Search in all OTHER source files for function references
          for (const [uriString, sourceDoc] of project.sourceFiles) {
            // Skip current document (already searched)
            if (uriString === document.uri.toString()) {
              continue
            }

            totalFiles++

            try {
              // OPTIMIZATION: Fast regex pre-scan before expensive parsing
              const fileContent = sourceDoc.buffer.toString()

              // If regex doesn't find the word at all, skip this file
              if (!searchRegex.test(fileContent)) {
                continue
              }

              filesScanned++

              // Regex found matches, now do precise tree-sitter search
              // Search by node type, not by position
              const fileUri = sourceDoc.uri
              const fileDoc = await workspace.openTextDocument(fileUri)
              const ranges = this.searchByNodeType(word, fileDoc, nodeType)
              if (ranges.length > 0) {
                filesWithMatches++
              }
              ranges.forEach(r => {
                locations.push(new Location(fileUri, r))
              })
            } catch (error) {
              // Skip files that can't be opened
              console.error(`Error searching file ${uriString}:`, error)
            }
          }

          const searchEndTime = performance.now()
          const searchTime = searchEndTime - searchStartTime
          const externalRefs = locations.length - localRanges.length
          console.log(`Find References: Searched ${totalFiles} files in ${searchTime.toFixed(2)}ms - Scanned ${filesScanned} files, found ${externalRefs} references in ${filesWithMatches} files`)
        }
      }

      return locations
    }

    // For variables, labels, and other symbols, search only in current document
    const ranges = this.parser.getOccurences(word, document, wordRange)
    ranges.forEach(r => {
      locations.push(new Location(document.uri, r))
    })

    return locations
  }

  /**
   * Search for occurrences based on node type without requiring a position
   */
  private searchByNodeType(word: string, document: TextDocument, nodeType: string): Range[] {
    const occurrences: Range[] = []
    const tree = this.parser.getDocumentTree(document)

    if (!tree) {
      return occurrences
    }

    // Create case-insensitive pattern
    const name_match = word.replace(/[A-Za-z]/g, (c: string) => {
      return `[${c.toUpperCase()}${c.toLowerCase()}]`
    }).replace("$", "\\\\$").replace(":", "")

    // Build query based on node type
    let query = ""
    switch (nodeType) {
      case "function_name": {
        const selector = `(function_name) @occurrence`
        const predicate = `(#match? @occurrence "^${name_match}$")`
        query = `(${selector} ${predicate})`
        break
      }
      case "label_reference":
      case "label": {
        query = `((label) @label (#match? @label "^${name_match}:$"))
                 ((label_reference) @label_ref (#match? @label_ref "^${name_match}$"))`
        break
      }
      case "stringidentifier":
      case "numberidentifier": {
        // For variables, search for all identifiers with matching name
        // We can't use parent type filtering without a specific position
        query = `((stringidentifier) @occurrence (#match? @occurrence "^${name_match}$"))
                 ((numberidentifier) @occurrence (#match? @occurrence "^${name_match}$"))`
        break
      }
      default:
        return occurrences
    }

    const results = this.parser.match(query, tree.rootNode)
    results.forEach(r => {
      const node = r.captures[0].node
      if (nodeType === "label" && node.type === "label") {
        // Special handling for labels to exclude the colon
        occurrences.push(new Range(
          new Position(node.startPosition.row, node.startPosition.column),
          new Position(node.endPosition.row, node.endPosition.column - 1)
        ))
      } else {
        occurrences.push(this.parser.getNodeRange(node))
      }
    })

    return occurrences
  }
}