import path = require("path");
import { Uri, workspace, WorkspaceFolder } from "vscode"
import BrSourceDocument from "./BrSourceDocument"

export default class ProjectSourceDocument extends BrSourceDocument {
  uri: Uri
  workspaceFolder: WorkspaceFolder
  linkPath: string

  constructor(text: string, uri: Uri, workspaceFolder: WorkspaceFolder) {
    super(text)
    this.uri = uri
    this.workspaceFolder = workspaceFolder
    this.linkPath = workspace.asRelativePath(uri, false).replace("/","\\").replace(/\.[^\\/.]+$/,"")
  }
}