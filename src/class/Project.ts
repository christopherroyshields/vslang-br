import Layout from './Layout'
import SourceDocument from './SourceDocument';
import LibraryFunctionIndex from './LibraryFunctionIndex';

export type Project = {
	sourceFiles: Map<string, SourceDocument>;
	layouts: Map<string, Layout>;
	libraryIndex: LibraryFunctionIndex;
};
