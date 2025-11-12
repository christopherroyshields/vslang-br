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

    // For functions, check if it's a library function before cross-file search
    if (nodeType === "function_name") {
      // PRIORITY 1: Search current document first for immediate results
      const localRanges = this.parser.getOccurences(word, document, wordRange)
      localRanges.forEach(r => {
        locations.push(new Location(document.uri, r))
      })

      // PRIORITY 2: Only search other files if this is a library function
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
          // Check if this is a library function
          let isLibraryFunction = false
          let libFuncMetadata = project.libraryIndex.getFunction(word)
          if (!libFuncMetadata && word.toLowerCase().startsWith('fn')) {
            libFuncMetadata = project.libraryIndex.getFunction(word.substring(2))
          }
          isLibraryFunction = !!libFuncMetadata

          // Only search across files for library functions
          if (!isLibraryFunction) {
            return locations // Return only local results for non-library functions
          }
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

    // For line numbers and line references, search in current document only
    if (nodeType === "line_number" || nodeType === "line_reference") {
      const ranges = this.searchByNodeType(word, document, nodeType)
      ranges.forEach(r => {
        locations.push(new Location(document.uri, r))
      })
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
      case "line_number":
      case "line_reference": {
        // For line numbers, search for both definitions and references
        // Get all line numbers and line references, filter manually
        query = `((line_number) @line) ((line_reference) @line_ref)`
        break
      }
      default:
        return occurrences
    }

    const results = this.parser.match(query, tree.rootNode)
    results.forEach(r => {
      const node = r.captures[0].node

      // For line numbers, manually filter by numeric value (handles different leading zeros)
      if (nodeType === "line_number" || nodeType === "line_reference") {
        const targetLineNum = parseInt(word.trim(), 10)
        const nodeLineNum = parseInt(node.text.trim(), 10)
        if (nodeLineNum !== targetLineNum) {
          return // Skip this node if numeric value doesn't match
        }
      }

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