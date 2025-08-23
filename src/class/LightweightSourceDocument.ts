import { Uri, WorkspaceFolder } from "vscode";

/**
 * Lightweight document representation for fast initial loading.
 * Extracts only library function names and basic metadata without full parsing.
 */
export default class LightweightSourceDocument {
  public uri: Uri;
  public workspaceFolder: WorkspaceFolder | undefined;
  public libraryFunctions: Set<string> = new Set();
  public linkPath: string;
  private content: string;

  constructor(uri: Uri, content: string | Buffer | Uint8Array, workspaceFolder?: WorkspaceFolder) {
    this.uri = uri;
    this.workspaceFolder = workspaceFolder;
    if (typeof content === 'string') {
      this.content = content;
    } else if (content instanceof Buffer) {
      this.content = content.toString();
    } else {
      this.content = Buffer.from(content).toString();
    }
    this.linkPath = this.uri.fsPath.replace(/\.[^\\/.]+$/, "").replace(/\//g, "\\");
    this.extractFunctions();
  }

  /**
   * Quick extraction of library function names using regex (much faster than full parsing)
   * Filters out DEF LIBRARY in comments, strings, and Lexi backtick strings
   */
  private extractFunctions(): void {
    // Split content into lines for line-by-line processing
    const lines = this.content.split('\n');
    
    // Track if we're inside various multiline constructs
    let inMultilineComment = false;
    let inMultilineString = false;
    let inBacktickString = false;
    
    // Regex to match DEF LIBRARY at the start of a line (with optional line number and whitespace)
    const functionRegex = /^\s*(?:\d+\s+)?DEF\s+LIBRARY\s+(FN[A-Z0-9_$]+)/i;
    
    for (let line of lines) {
      // If we're in a backtick string, look for the closing backtick
      if (inBacktickString) {
        let backtickClosed = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '`') {
            // Check if it's an escaped backtick (double backtick)
            if (i + 1 < line.length && line[i + 1] === '`') {
              i++; // Skip the next backtick
            } else {
              // Found closing backtick
              inBacktickString = false;
              backtickClosed = true;
              // Only process the part after the backtick
              line = line.substring(i + 1);
              break;
            }
          }
        }
        if (!backtickClosed) {
          // Entire line is inside a backtick string
          continue;
        }
      }
      
      // If we're in a regular multiline string, look for the closing quote
      if (inMultilineString) {
        const quoteIndex = line.indexOf('"');
        if (quoteIndex !== -1) {
          // String ends on this line
          inMultilineString = false;
          // Only process the part after the string
          line = line.substring(quoteIndex + 1);
        } else {
          // Entire line is inside a string
          continue;
        }
      }
      
      // Check for multiline comment start/end
      const multilineStart = line.indexOf('/*');
      const multilineEnd = line.indexOf('*/');
      
      if (multilineStart !== -1 && multilineEnd !== -1) {
        // Comment starts and ends on same line
        // Remove the comment portion
        line = line.substring(0, multilineStart) + line.substring(multilineEnd + 2);
      } else if (multilineStart !== -1) {
        // Comment starts on this line
        inMultilineComment = true;
        // Only process the part before the comment
        line = line.substring(0, multilineStart);
      } else if (multilineEnd !== -1) {
        // Comment ends on this line
        inMultilineComment = false;
        // Only process the part after the comment
        line = line.substring(multilineEnd + 2);
      } else if (inMultilineComment) {
        // Entire line is inside a multiline comment
        continue;
      }
      
      // Remove single-line comments (! or REM), but check if they're in strings first
      let processedLine = '';
      let inString = false;
      let inSingleQuote = false;
      let inLocalBacktick = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        // Handle backtick strings (Lexi syntax)
        if (char === '`' && !inString && !inSingleQuote) {
          // Check for double backtick (escaped)
          if (i + 1 < line.length && line[i + 1] === '`') {
            // Escaped backtick - only add if we're not in a backtick string
            if (!inLocalBacktick) {
              processedLine += char;
            }
            i++; // Skip the next backtick
          } else {
            inLocalBacktick = !inLocalBacktick;
            if (inLocalBacktick) {
              // Starting a backtick string that might continue to next line
              inBacktickString = true;
            } else {
              // Ending a backtick string on this line
              inBacktickString = false;
            }
          }
        }
        // Handle regular double-quoted strings
        else if (char === '"' && !inLocalBacktick && !inSingleQuote) {
          inString = !inString;
        }
        // Handle single-quoted strings
        else if (char === "'" && !inLocalBacktick && !inString) {
          inSingleQuote = !inSingleQuote;
        }
        // Handle comments (! or REM)
        else if (char === '!' && !inString && !inSingleQuote && !inLocalBacktick) {
          // Check if it's !: or !_ (line continuation)
          if (i + 1 < line.length && (line[i + 1] === ':' || line[i + 1] === '_')) {
            processedLine += char;
          } else {
            // It's a comment, stop processing this line
            break;
          }
        }
        // Check for REM keyword and add character if not inside any string
        else if (!inString && !inSingleQuote && !inLocalBacktick) {
          const remMatch = line.substring(i).match(/^REM\b/i);
          if (remMatch) {
            // It's a REM comment, stop processing this line
            break;
          }
          processedLine += char;
        }
      }
      
      // If we ended with an open regular string, it continues to the next line
      if (inString) {
        inMultilineString = true;
      }
      
      // Now check for DEF LIBRARY pattern
      // BR allows multiple statements per line separated by colons
      // Split by colon and check each statement
      const statements = processedLine.split(':');
      for (const statement of statements) {
        const match = functionRegex.exec(statement.trim());
        if (match) {
          const functionName = match[1]; // Keep original case for display, includes FN prefix
          this.libraryFunctions.add(functionName);
        }
      }
    }
  }

  /**
   * Check if this document contains a library function (case-insensitive)
   */
  public hasFunction(name: string): boolean {
    const upperName = name.toUpperCase();
    // Check case-insensitively
    for (const funcName of this.libraryFunctions) {
      if (funcName.toUpperCase() === upperName) return true;
    }
    return false;
  }

  /**
   * Get all library function names
   */
  public getAllFunctionNames(): string[] {
    return [...this.libraryFunctions];
  }

  /**
   * Check if this is a library file (has library functions)
   */
  public isLibraryFile(): boolean {
    return this.libraryFunctions.size > 0;
  }

  /**
   * Get the raw content for full parsing when needed
   */
  public getContent(): string {
    return this.content;
  }

  /**
   * Clear content to save memory (after full parse is cached)
   */
  public clearContent(): void {
    this.content = "";
  }
}