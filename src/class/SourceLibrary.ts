import path = require("path")
import { Uri, WorkspaceFolder } from "vscode"
import { getSearchPath } from "../util/common"
import { ConfiguredProject } from "./ConfiguredProject"
import { UserFunction } from "./UserFunction"

export class SourceLibrary {
	uri: Uri
	libraryList: UserFunction[]
	/** relative path for library statemtents */
	linkPath: string
	constructor(uri: Uri, libraryList: UserFunction[], workspaceFolder: WorkspaceFolder, project: ConfiguredProject) {
		this.uri = uri
		this.libraryList = libraryList
		this.linkPath = this.getLinkPath(workspaceFolder, project)
	}
	private getLinkPath(workspaceFolder: WorkspaceFolder, project: ConfiguredProject): string {
		const searchPath = getSearchPath(workspaceFolder, project)
		const parsedPath = path.parse(this.uri.fsPath.substring(searchPath.fsPath.length + 1))
		const libPath = path.join(parsedPath.dir, parsedPath.name)
		return libPath
	}
}

