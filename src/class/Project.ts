import Layout from './Layout'
import TreeSitterSourceDocument from './TreeSitterSourceDocument';
import { ProjectManager } from './ProjectManager';

export type Project = {
	sourceFiles: Map<string, TreeSitterSourceDocument>;
	layouts: Map<string, Layout>;
};

// Export ProjectManager as the new preferred way
export { ProjectManager };
