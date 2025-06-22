import {
	createConnection,
	ProposedFeatures,
} from 'vscode-languageserver/node';

import { BrLanguageServer } from './class/BrLanguageServer';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

const brLanguageServer = new BrLanguageServer(connection);