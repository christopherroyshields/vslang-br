import { CancellationToken, Position, ProviderResult, Range, RenameProvider, TextDocument, TextEdit, WorkspaceEdit } from "vscode";
import BrParser from "../parser";

export default class BrRenameProvider implements RenameProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideRenameEdits(document: TextDocument, position: Position, newName: string, token: CancellationToken): ProviderResult<WorkspaceEdit> {
    const node = this.parser.getNodeAtPosition(document, position)
    if (node){
      const occurences = this.parser.getOccurences(node.text,document,this.parser.getNodeRange(node))
      const workspaceEdit = new WorkspaceEdit()
      for (const occurrence of occurences) {
        workspaceEdit.replace(document.uri,occurrence,newName)
      }
      return workspaceEdit
    }
  }

  prepareRename?(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Range | { range: Range; placeholder: string; }> {
    const node = this.parser.getNodeAtPosition(document, position)
    if (node){
      if (node.type == "stringidentifier" || node.type == "numberidentifier"){
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
      } else if (node.type == "function_name" && node.text.toLowerCase().startsWith("fn")){
        if (node.text.toLowerCase().startsWith("fn")){
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
          throw new Error("Cannot rename system function")
        }
      } else if (node.type == "label") {
        return {
          range: new Range(
            new Position(
              node.startPosition.row,
              node.startPosition.column
            ),
            new Position(
              node.endPosition.row,
              node.endPosition.column-1
            )
          ),
          placeholder: node.text.replace(":","")
        }
      } else {
        throw new Error("No rename provider available")
      }
    }
  }
}