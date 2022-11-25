import path = require("path");
import { Uri, workspace, WorkspaceFolder } from "vscode"
import { getSearchPath } from "../util/common"
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

  private getLinkPath(workspaceFolder: WorkspaceFolder): string {
		const searchPath = getSearchPath(workspaceFolder)
		const parsedPath = path.parse(this.uri.fsPath.substring(searchPath.fsPath.length + 1))
		const libPath = path.join(parsedPath.dir, parsedPath.name)
		return libPath
	}
}