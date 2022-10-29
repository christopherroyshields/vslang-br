import { Uri } from "vscode"
import { UserFunction } from "../class/UserFunction"

export interface ProjectConfig {
	globalIncludes?: string[]
	searchPath?: string,
	libraries?: Map<Uri, UserFunction[]>
}