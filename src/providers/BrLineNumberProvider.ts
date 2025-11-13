import * as vscode from 'vscode';
import BrParser from '../parser';
import { calculateNextLineNumber, getContinuationIndent, isContinuationLine } from '../utils/lineNumbers';

export class BrLineNumberProvider {
    private hasShownOverflowWarning = false;

    constructor(private parser: BrParser) {}

    /**
     * Handle Enter key press to auto-insert line numbers
     */
    handleEnterKey(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit): void {
        const document = textEditor.document;
        const selection = textEditor.selection;
        const position = selection.active;

        // Check if feature is enabled
        const config = vscode.workspace.getConfiguration('br');
        const enabled = config.get<boolean>('autoLineNumbers.enabled', true);

        if (!enabled) {
            // Just insert newline
            edit.insert(position, '\n');
            return;
        }

        // Get configuration values
        const configIncrement = config.get<number>('autoLineNumbers.increment', 10);
        const configPadding = config.get<number>('autoLineNumbers.zeroPadding', 5);

        const currentLineIndex = position.line;

        // Check if current line (before pressing Enter) ends with continuation
        if (isContinuationLine(this.parser, document, currentLineIndex)) {
            // Current line is a continuation, add appropriate indentation
            const indent = getContinuationIndent(document, currentLineIndex);
            edit.insert(position, '\n' + indent);
            return;
        }

        // Calculate the next line number (for the new line we're about to create)
        const nextLineNumber = calculateNextLineNumber(
            this.parser,
            document,
            currentLineIndex + 1, // +1 because we're calculating for the line AFTER Enter
            configIncrement,
            configPadding
        );

        if (nextLineNumber === null) {
            // Check if we hit overflow
            if (currentLineIndex >= 0) {
                const tree = this.parser.getDocumentTree(document);
                const point = { row: currentLineIndex, column: 1 };
                const currentLineNode = tree.rootNode.descendantForPosition(point, point);

                // Walk up to find line node
                let lineNode: any = currentLineNode;
                while (lineNode && lineNode.type !== 'line') {
                    lineNode = lineNode.parent;
                }

                if (lineNode) {
                    const lineNumberNode = lineNode.children.find((child: any) => child.type === 'line_number');
                    if (lineNumberNode) {
                        const value = parseInt(lineNumberNode.text.trim(), 10);
                        const maxValue = Math.pow(10, configPadding) - 1;

                        if (value + configIncrement > maxValue && !this.hasShownOverflowWarning) {
                            vscode.window.showWarningMessage(
                                `BR: Line number overflow detected (exceeds ${maxValue}). Auto line numbering disabled.`
                            );
                            this.hasShownOverflowWarning = true;
                        }
                    }
                }
            }

            // Just insert newline
            edit.insert(position, '\n');
            return;
        }

        // Handle selections - if text is selected, delete it first
        if (!selection.isEmpty) {
            edit.delete(selection);
        }

        // Insert newline with line number as a single operation
        edit.insert(position, '\n' + nextLineNumber + ' ');
    }
}
