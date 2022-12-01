import ProjectSourceDocument from './ProjectSourceDocument'
import Layout from './Layout'

export type Project = {
	sourceFiles: Map<string, ProjectSourceDocument>;
	layouts: Map<string, Layout>;
};
