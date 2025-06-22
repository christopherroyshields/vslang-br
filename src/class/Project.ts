import ProjectSourceDocument from './ProjectSourceDocument'
import Layout from './Layout'
import SourceDocument from './SourceDocument';

export type Project = {
	sourceFiles: Map<string, SourceDocument>;
	layouts: Map<string, Layout>;
};
