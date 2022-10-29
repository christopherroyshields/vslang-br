import { ProjectConfig } from "../interface/ProjectConfig"
import { SourceLibrary } from "./SourceLibrary"

export class ConfiguredProject {
	config: ProjectConfig
	libraries = new Map<string, SourceLibrary>()
	constructor(config: ProjectConfig) {
		this.config = config
	}
}