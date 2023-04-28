import { CancellationToken, Position, ProviderResult, Range, RenameProvider, TextDocument, TextEdit, WorkspaceEdit } from "vscode";
import BrParser from "../parser";

export default class BrRenameProvider implements RenameProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken): ProviderResult<WorkspaceEdit> {
    const node = this.parser.getNodeAtPosition(document, position)
    const occurences = this.parser.getOccurences(node.text,document,this.parser.getNodeRange(node))
    const workspaceEdit = new WorkspaceEdit()
    for (const occurrence of occurences) {
      workspaceEdit.replace(document.uri,occurrence,newName)
    }
    return workspaceEdit
  }
  prepareRename?(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Range | { range: Range; placeholder: string; }> {
    const node = this.parser.getNodeAtPosition(document, position)
    if (node.type == "stringidentifier" || node.type == "numberidentifier" || node.type == "function_name"){
      return new Range(
        new Position(
          node.startPosition.row,
          node.startPosition.column
        ),
        new Position(
          node.endPosition.row,
          node.endPosition.column
        )
      )
    } else {
      throw new Error("No rename provider available")
    }
  }
}