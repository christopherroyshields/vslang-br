import ProjectSourceDocument from '../class/ProjectSourceDocument'
import Layout from '../class/Layout'

export type Project = {
	sourceFiles: Map<string, ProjectSourceDocument>;
	layouts: Map<string, Layout>;
};
