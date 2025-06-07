# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension providing language support for Business Rules! (BR), a BASIC-like programming language. The extension uses Tree-sitter for parsing and provides comprehensive IDE features including IntelliSense, hover information, syntax highlighting, and Lexi compiler integration.

## Business Rules! Language Overview

Business Rules! (BR) is a line-numbered procedural language designed for application programming, especially in business environments that require structured I/O, reporting, file manipulation, and forms processing. Its syntax resembles older BASIC-style languages but with extensive support for structured data access and GUI/RTF integration.

### Language Syntax Rules
- **Line Numbers**: Every line must start with a numeric label (e.g., `100`, `105`, `1200`)
- **Statement Delimiter**: Colon `:` separates multiple statements on the same line
- **Multi-line Continuation**: Use `!:` to continue logic across lines
- **Case Insensitive**: All keywords and identifiers are case-insensitive

### Data Types
- **Strings**: Declared with `DIM Var$*##` (e.g., `DIM Name$*30` for 30-char string)
- **Numerics**: Implicitly declared, no DIM needed unless for arrays
- **Arrays**: Support up to 3 dimensions (e.g., `DIM ArrayName(N)` or `DIM StrArray$(N)*##`)
- **Function Returns**: Functions return values by assigning to function name (e.g., `LET MyFunc=42 : FNEND`)

### Control Structures
- **Conditionals**: `IF...THEN`, `IF...THEN...ELSE`, `END IF`
- **Loops**: `DO...LOOP` (with `WHILE`/`UNTIL`), `FOR...TO...NEXT`
- **Branching**: `GOTO`, `GOSUB`, `RETURN`, `ON GOTO`, `ON GOSUB`, `LABEL`

### File I/O
- **OPEN Statement**: `OPEN #1: "name=FILENAME", display, input, sequential`
- **File Types**: DISPLAY (text), INTERNAL (structured records)
- **Access Modes**: SEQUENTIAL, RELATIVE, KEYED
- **I/O Commands**: `INPUT #`, `LINPUT #`, `PRINT #`, `READ`, `WRITE`, `REWRITE`

### Libraries and DLLs
- **LIBRARY Statement**: Load external libraries (e.g., `LIBRARY "FNSnap.dll": FNPRINT_FILE`)
- **Common Libraries**: FNSnap.dll (GUI), RTFLIB.dll (RTF generation)
- **Library Functions**: Use `DEF LIBRARY` declaration with `FNEND` return

### Key Features
- **Syntax Highlighting**: Full BR language syntax support
- **IntelliSense**: Code completion for functions, statements, keywords, and variables
- **Function Signatures**: Parameter hints and function documentation
- **Hover Information**: Inline documentation for functions and symbols
- **Symbol Navigation**: Go to definition, find references, workspace symbols
- **Document Outline**: Hierarchical view of functions and line labels
- **Diagnostics**: Real-time syntax error detection
- **Renaming**: Safe symbol renaming across files
- **Layout File Support**: Specialized features for BR layout files
- **Lexi Integration**: Built-in compiler/runtime support with version switching
- **Line Number Management**: Add/strip line numbers for legacy systems
- **Library Management**: Library path configuration and function discovery
- **Code Snippets**: Pre-defined code templates
- **Symbol Highlighting**: Occurrence highlighting for selected symbols

## Development Commands

### Build and Test
```bash
npm run compile    # Compile TypeScript to JavaScript
npm run watch      # Watch mode for development
npm run lint       # Run ESLint
npm run test       # Run tests (requires compilation first)
```

### Extension Development
- Use F5 or the "Run Extension" launch configuration to open extension in new VS Code window
- Use "Extension Tests" launch configuration to run tests
- Tests are in `src/test/` and use VS Code test framework

## Architecture

### Core Components

- **BrParser** (`src/parser.ts`): Tree-sitter based parser for BR language files. Maintains parse trees and provides querying capabilities.
- **Project** (`src/class/Project.ts`): Container for workspace source files and layouts, maps URIs to TreeSitterSourceDocument instances.
- **Extension** (`src/extension.ts`): Main activation point, registers all language providers and sets up file watchers.

### Language Server (Currently Inactive)
- Server (`src/server.ts`) and Client (`src/client.ts`) provide language server protocol support
- Currently commented out in extension activation but infrastructure exists

### Provider Architecture
All language features are implemented as separate providers in `src/providers/`:
- **BrHoverProvider**: Function hover information with JSDoc support
- **BrSignatureHelpProvider**: Parameter hints during function calls
- **FuncCompletionProvider**: User-defined function completions
- **StatementCompletionProvider**: BR language statements
- **BrSymbolProvider**: Document symbol navigation
- **BrReferenceProvider**: Find references functionality
- **BrRenameProvider**: Symbol renaming
- **LocalCompletionProvider**: Local variable completions
- **LayoutSemanticTokenProvider**: Syntax highlighting for layout files

### Source Document Types
- **TreeSitterSourceDocument**: Primary document parser using Tree-sitter
- **ProjectSourceDocument**: Legacy regex-based parser (being phased out)
- Both implement function extraction and variable analysis

### File Watching System
The extension monitors workspace changes for:
- BR source files (`.brs`, `.wbs`) using configurable glob patterns
- Layout files in `filelay/` directory
- Configuration changes trigger re-parsing

### Tree-sitter Integration
- Uses `tree-sitter-br` grammar for parsing
- Query files in `tree-query/` define extraction patterns
- Incremental parsing for performance on document changes

## Configuration
Extension settings in `package.json` under `contributes.configuration`:
- `br.searchPath`: Subdirectory for relative paths
- `br.sourceFileGlobPattern`: Pattern for finding BR files
- `br.layoutPath`: Directory for layout files
- `br.diagnosticsDelay`: Debounce for syntax checking

## Lexi Integration
- `src/lexi.ts`: Integration with BR compiler/runtime
- Commands for compile, run, add/strip line numbers
- Version switching (4.1, 4.2, 4.3)
- Executable located in `Lexi/` directory

## Testing
- Tests use VS Code extension testing framework
- BrHoverProvider tests demonstrate testing patterns
- Tests require workspace setup with test files in `testcode/`
- Tests validate IntelliSense, hover, and function detection