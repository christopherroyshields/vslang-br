import ProjectConfig from "../interface/ProjectConfig"
import BrSourceDocument from "./BrSourceDocument"
import ProjectSourceDocument from "./ProjectSourceDocument"

export default class ConfiguredProject {
	config: ProjectConfig
	sourceDocuments = new Map<string, ProjectSourceDocument>()
	constructor(config: ProjectConfig) {
		this.config = config
	}
}