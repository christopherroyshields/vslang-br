import ProjectConfig from "../interface/ProjectConfig"
import BrSourceDocument from "./BrSourceDocument"

export default class ConfiguredProject {
	config: ProjectConfig
	libraries = new Map<string, BrSourceDocument>()
	constructor(config: ProjectConfig) {
		this.config = config
	}
}