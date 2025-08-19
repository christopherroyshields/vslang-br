import ProjectSourceDocument from './ProjectSourceDocument'
import Layout from './Layout'
import TreeSitterSourceDocument from './TreeSitterSourceDocument';

export type Project = {
	sourceFiles: Map<string, TreeSitterSourceDocument>;
	layouts: Map<string, Layout>;
};
