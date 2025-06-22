import { DocumentUri, Hover, MarkupKind, Position, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import BrParser from "./BrParser";
import { SourceDocumentManager } from "./SourceDocumentManager";
import { getFunctionByName } from "../completions/functions";
import InternalFunction from "./InternalFunction";
import { nodeRange } from "../util/common";
import { URI } from "vscode-uri";
import UserFunction from "./UserFunction";

export default class HoverHandler {
    constructor(
        private parser: BrParser,
        private documentManager: SourceDocumentManager
    ) {}

    public async provideHover(uri: DocumentUri, position: Position): Promise<Hover | undefined> {
        const doc = await this.documentManager.get(uri);
        const node = this.parser.getNodeAtPosition(doc, position);

        if (node?.type === "function_name") {
            const range = nodeRange(node);

            // System function
            if (node.parent?.type === "numeric_system_function" || node.parent?.type === "string_system_function") {
                const internalFunction = getFunctionByName(node.text);
                if (internalFunction) {
                    return this.createHoverFromFunction(internalFunction, range);
                }
            }

            // User function
            const userFunction = doc?.getFunctionByName(node.text);
            if (userFunction) {
                return this.createHoverFromFunction(userFunction, range);
            }

            const workspaceFolder = doc?.workspaceFolder
            if (workspaceFolder) {
                for (const doc of this.documentManager.all(workspaceFolder)) {
                    const userFunction = doc.getFunctionByName(node.text);
                    if (userFunction) {
                        return this.createHoverFromFunction(userFunction, range);
                    }
                }
            }
        }
        return undefined;
    }

    private createHoverFromFunction(fn: InternalFunction | UserFunction, range: Range): Hover {
        let markdown = '```br\n' + fn.generateSignature() + '\n```';
        if (fn.documentation) {
            markdown += `\n---\n${fn.documentation}`;
        }
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: markdown,
            },
            range: range,
        };
    }
}