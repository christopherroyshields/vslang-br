import * as Parser from "../../vendor/tree-sitter";
import { TextDocument } from 'vscode';
import BrParser from '../parser';

export interface LineNumberInfo {
    value: number;
    padding: number;
    formatted: string;
}

/**
 * Extract line number from a tree-sitter line node
 * @param lineNode The line node from tree-sitter
 * @returns LineNumberInfo with the numeric value, padding length, and formatted string, or null if no line number found
 */
export function extractLineNumber(lineNode: Parser.SyntaxNode | null): LineNumberInfo | null {
    if (!lineNode) {
        return null;
    }

    // Find the line_number child node
    const lineNumberNode = lineNode.children.find(child => child.type === 'line_number');

    if (!lineNumberNode) {
        return null;
    }

    const text = lineNumberNode.text.trim();
    const value = parseInt(text, 10);

    if (isNaN(value)) {
        return null;
    }

    return {
        value,
        padding: text.length,
        formatted: text
    };
}

/**
 * Detect line number increment pattern from previous lines
 * @param parser The BrParser instance
 * @param document The text document
 * @param currentLineIndex The current line index (0-based)
 * @param defaultIncrement The default increment to use if pattern cannot be detected
 * @returns The detected increment value
 */
export function detectIncrement(
    parser: BrParser,
    document: TextDocument,
    currentLineIndex: number,
    defaultIncrement = 10
): number {
    const tree = parser.getDocumentTree(document);

    // Look at up to 10 previous lines to detect pattern
    const lineNumbers: number[] = [];

    for (let i = currentLineIndex - 1; i >= Math.max(0, currentLineIndex - 10); i--) {
        const lineNode = getLineNodeAtIndex(tree, i);
        const lineInfo = extractLineNumber(lineNode);

        if (lineInfo) {
            lineNumbers.push(lineInfo.value);
        }

        // Stop if we have at least 2 line numbers to compare
        if (lineNumbers.length >= 2) {
            break;
        }
    }

    // Calculate increment from the two most recent line numbers
    if (lineNumbers.length >= 2) {
        const increment = lineNumbers[0] - lineNumbers[1];
        if (increment > 0) {
            return increment;
        }
    }

    return defaultIncrement;
}

/**
 * Get the line node at a specific line index
 * @param tree The tree-sitter tree
 * @param lineIndex The 0-based line index
 * @returns The line node or null
 */
function getLineNodeAtIndex(tree: Parser.Tree, lineIndex: number): Parser.SyntaxNode | null {
    // Use column 1 instead of 0 to ensure we get a node within the line, not before it
    const point: Parser.Point = { row: lineIndex, column: 1 };
    const node = tree.rootNode.descendantForPosition(point, point);

    // Walk up to find the line node
    let current: Parser.SyntaxNode | null = node;
    while (current) {
        if (current.type === 'line') {
            // Verify this is actually the line we want
            if (current.startPosition.row === lineIndex) {
                return current;
            }
        }
        current = current.parent;
    }

    return null;
}

/**
 * Check if a line ends with continuation (!:)
 * @param parser The BrParser instance
 * @param document The text document
 * @param lineIndex The 0-based line index
 * @returns True if the line ends with !:
 */
export function isContinuationLine(
    parser: BrParser,
    document: TextDocument,
    lineIndex: number
): boolean {
    const tree = parser.getDocumentTree(document);
    const lineNode = getLineNodeAtIndex(tree, lineIndex);

    if (!lineNode) {
        return false;
    }

    // Check if the line has a continuation node
    const hasContinuation = lineNode.children.some(child =>
        child.type === 'continuation'
    );

    return hasContinuation;
}

/**
 * Format a line number with zero padding
 * @param value The numeric line number value
 * @param padding The total number of digits (including leading zeros)
 * @returns The formatted line number string
 */
export function formatLineNumber(value: number, padding: number): string {
    return value.toString().padStart(padding, '0');
}

/**
 * Calculate the next line number based on the previous line
 * @param parser The BrParser instance
 * @param document The text document
 * @param currentLineIndex The current line index (0-based, where cursor is)
 * @param configIncrement The configured default increment
 * @param configPadding The configured zero padding
 * @returns The formatted next line number, or null if line number should not be added
 */
export function calculateNextLineNumber(
    parser: BrParser,
    document: TextDocument,
    currentLineIndex: number,
    configIncrement = 10,
    configPadding = 5
): string | null {
    // Get the previous line (the line before the cursor)
    const prevLineIndex = currentLineIndex - 1;

    if (prevLineIndex < 0) {
        // No previous line, don't add line number
        return null;
    }

    // Check if previous line ends with continuation
    if (isContinuationLine(parser, document, prevLineIndex)) {
        // Don't add line number after continuation, just indent
        return null;
    }

    const tree = parser.getDocumentTree(document);
    const prevLineNode = getLineNodeAtIndex(tree, prevLineIndex);
    const prevLineInfo = extractLineNumber(prevLineNode);

    if (!prevLineInfo) {
        // Previous line has no line number, don't add one
        return null;
    }

    // Check if there's a next line with a line number
    const nextLineIndex = currentLineIndex;
    let maxPossibleValue: number | null = null;

    if (nextLineIndex < document.lineCount) {
        const nextLineNode = getLineNodeAtIndex(tree, nextLineIndex);
        const nextLineInfo = extractLineNumber(nextLineNode);

        if (nextLineInfo) {
            // There's already a line number on the next line
            // We need to fit between prevLineInfo.value and nextLineInfo.value
            maxPossibleValue = nextLineInfo.value - 1;

            // If there's no room, we can't insert a line number
            if (maxPossibleValue <= prevLineInfo.value) {
                return null;
            }
        }
    }

    // Detect increment pattern
    const detectedIncrement = detectIncrement(parser, document, currentLineIndex, configIncrement);

    // Preferred increments: 1, 2, 10, 20, 100
    const preferredIncrements = [1, 2, 10, 20, 100];
    let selectedIncrement = detectedIncrement;

    // If there's a next line with a number, we need to ensure we fit
    if (maxPossibleValue !== null) {
        const availableSpace = maxPossibleValue - prevLineInfo.value;

        if (availableSpace < 1) {
            // No space available
            return null;
        }

        // If detected increment doesn't fit, find the highest preferred increment that does
        if (detectedIncrement > availableSpace) {
            selectedIncrement = 1; // default to minimum

            // Find the highest preferred increment that fits
            for (const inc of preferredIncrements) {
                if (inc <= availableSpace) {
                    selectedIncrement = inc; // keep updating to get the largest
                } else {
                    break; // stop when we exceed available space
                }
            }
        } else {
            // Detected increment fits, but prefer a matching preferred increment
            // Use the highest preferred increment that is <= detected increment and fits
            let bestMatch = 1;
            for (const inc of preferredIncrements) {
                if (inc <= detectedIncrement && inc <= availableSpace) {
                    bestMatch = inc;
                } else if (inc > detectedIncrement) {
                    break; // no need to check larger increments
                }
            }
            selectedIncrement = bestMatch;
        }
    } else {
        // No constraint from next line, use the highest preferred increment <= detected
        let bestMatch = detectedIncrement;
        for (const inc of preferredIncrements) {
            if (inc <= detectedIncrement) {
                bestMatch = inc;
            } else {
                break; // found the first one larger than detected
            }
        }
        selectedIncrement = bestMatch;
    }

    // Calculate next line number
    const nextValue = prevLineInfo.value + selectedIncrement;

    // Use the padding from previous line or config
    const padding = prevLineInfo.padding || configPadding;

    // Check for overflow
    const maxValue = Math.pow(10, padding) - 1;
    if (nextValue > maxValue) {
        // Would overflow the current padding
        return null;
    }

    return formatLineNumber(nextValue, padding);
}

/**
 * Get the indentation that should be used for continuation lines
 * @param document The text document
 * @param lineIndex The 0-based line index of the continuation line
 * @returns The indentation string (spaces/tabs after line number, or empty)
 */
export function getContinuationIndent(document: TextDocument, lineIndex: number): string {
    if (lineIndex < 0 || lineIndex >= document.lineCount) {
        return '';
    }

    const lineText = document.lineAt(lineIndex).text;

    // Match line number followed by whitespace
    const match = lineText.match(/^(\d+)(\s+)/);

    if (match && match[2]) {
        // Return the whitespace after the line number
        return match[2];
    }

    // Default: single space
    return ' ';
}
