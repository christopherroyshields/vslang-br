import { LibraryFunctionMetadata } from '../class/LibraryFunctionIndex';
import { Uri } from 'vscode';

/**
 * Regular expressions for scanning library functions without full parsing
 */
const LIBRARY_FUNCTION_REGEX = /^(\s*\d+)?\s*def\s+lib\w+\s+fn([a-zA-Z_][a-zA-Z0-9_]*\$?)(\s*\*\d+)?\s*\(([^)]*)\)/gmi;
const JSDOC_REGEX = /\/\*\*([\s\S]*?)\*\//g;
const LINE_NUMBER_REGEX = /^(\d+)\s+/;

/**
 * Extract JSDoc comment that appears before a given position
 */
function extractJSDocBefore(content: string, position: number): string | undefined {
  JSDOC_REGEX.lastIndex = 0;
  let lastJSDoc: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  
  while ((match = JSDOC_REGEX.exec(content)) !== null) {
    if (match.index + match[0].length < position) {
      lastJSDoc = match;
    } else {
      break;
    }
  }
  
  if (lastJSDoc && position - (lastJSDoc.index + lastJSDoc[0].length) < 200) {
    return lastJSDoc[0];
  }
  
  return undefined;
}

/**
 * Count line number for a position in the content
 */
function getLineNumber(content: string, position: number): number {
  const lines = content.substring(0, position).split('\n');
  return lines.length;
}

/**
 * Represents a range in the text that should be excluded from parsing
 */
interface ExcludedRange {
  start: number;
  end: number;
  type: 'string' | 'comment';
}

/**
 * Find all strings and comments in the content
 * This approach is more efficient as it scans once and identifies all excluded regions
 */
function findExcludedRanges(content: string): ExcludedRange[] {
  const excludedRanges: ExcludedRange[] = [];
  const lines = content.split('\n');
  let position = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineStart = position;
    
    // Check for line comments (! or REM)
    const lineCommentMatch = /^(\s*\d+\s+)?(rem\s|!)/i.exec(line);
    if (lineCommentMatch) {
      excludedRanges.push({
        start: lineStart + lineCommentMatch.index,
        end: lineStart + line.length,
        type: 'comment'
      });
      position += line.length + 1; // +1 for newline
      continue;
    }
    
    // Process the line character by character for strings and block comments
    let i = 0;
    while (i < line.length) {
      const globalPos = lineStart + i;
      
      // Check for block comment start
      if (line[i] === '/' && line[i + 1] === '*') {
        const commentStart = globalPos;
        i += 2;
        
        // Find the end of the block comment (may span multiple lines)
        let commentEnd = -1;
        const searchPos = globalPos + 2;
        const searchContent = content.substring(searchPos);
        const endMatch = searchContent.indexOf('*/');
        
        if (endMatch !== -1) {
          commentEnd = searchPos + endMatch + 2;
          excludedRanges.push({
            start: commentStart,
            end: commentEnd,
            type: 'comment'
          });
          
          // Skip to the end of the comment in the current line
          const commentEndInLine = commentEnd - lineStart;
          if (commentEndInLine <= line.length) {
            i = commentEndInLine;
          } else {
            // Comment ends in a future line, skip rest of this line
            i = line.length;
          }
        } else {
          // Unclosed comment, exclude rest of file
          excludedRanges.push({
            start: commentStart,
            end: content.length,
            type: 'comment'
          });
          return excludedRanges;
        }
      }
      // Check for string start (single quotes, double quotes, or backticks)
      else if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
        const stringChar = line[i];
        const stringStart = globalPos;
        i++;
        
        // Find the end of the string
        let stringEnd = -1;
        while (i < line.length) {
          if (line[i] === stringChar) {
            // Check if it's escaped
            if (i === 0 || line[i - 1] !== '\\') {
              stringEnd = lineStart + i + 1;
              i++;
              break;
            }
          }
          i++;
        }
        
        if (stringEnd === -1) {
          // Unclosed string, exclude rest of line
          stringEnd = lineStart + line.length;
        }
        
        excludedRanges.push({
          start: stringStart,
          end: stringEnd,
          type: 'string'
        });
      }
      else {
        i++;
      }
    }
    
    position += line.length + 1; // +1 for newline
  }
  
  return excludedRanges;
}

/**
 * Check if a position is within any excluded range
 */
function isPositionExcluded(position: number, excludedRanges: ExcludedRange[]): boolean {
  for (const range of excludedRanges) {
    if (position >= range.start && position < range.end) {
      return true;
    }
  }
  return false;
}

/**
 * Scan buffer content for library functions using regex
 * This is much faster than full Tree-sitter parsing
 * First identifies all excluded regions (strings/comments) then searches only in code sections
 */
export function scanLibraryFunctions(buffer: Buffer, uri: Uri): LibraryFunctionMetadata[] {
  const content = buffer.toString();
  const functions: LibraryFunctionMetadata[] = [];
  
  // First pass: identify all strings and comments
  const excludedRanges = findExcludedRanges(content);
  
  // Second pass: search for library functions only in non-excluded regions
  LIBRARY_FUNCTION_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = LIBRARY_FUNCTION_REGEX.exec(content)) !== null) {
    const position = match.index;
    
    // Skip if inside an excluded range (comment or string)
    if (isPositionExcluded(position, excludedRanges)) {
      continue;
    }
    
    // Extract function details
    // match[1] is line number, match[2] is function name, match[3] is string size indicator, match[4] is parameters
    const functionName = match[2];
    const parameters = (match[4] || '').trim();
    
    // Extract JSDoc if present (and not in excluded range)
    const jsDoc = extractJSDocBefore(content, position);
    
    // Get line number
    const lineNumber = getLineNumber(content, position);
    
    functions.push({
      name: functionName,
      uri: uri,
      parameters: parameters || undefined,
      documentation: jsDoc,
      lineNumber: lineNumber
    });
  }
  
  return functions;
}

/**
 * Check if a buffer contains any library functions
 */
export function hasLibraryFunctions(buffer: Buffer): boolean {
  const content = buffer.toString();
  LIBRARY_FUNCTION_REGEX.lastIndex = 0;
  return LIBRARY_FUNCTION_REGEX.test(content);
}

/**
 * Extract a simple function signature for display
 */
export function formatFunctionSignature(name: string, parameters?: string): string {
  if (parameters) {
    return `fn${name}(${parameters})`;
  }
  return `fn${name}()`;
}