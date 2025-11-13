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
- **Auto Line Numbers**: Automatically insert line numbers when pressing Enter, with smart increment detection and continuation handling
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

### Packaging for Distribution
The extension uses optimized packaging to significantly reduce file size:
```bash
npm run package:clean  # Creates optimized .vsix file (~7.5 MB)
npm run package        # Standard packaging (~16 MB, includes build artifacts)
npm run vsce:ls        # Inspect package contents with tree view
```

**Packaging Details:**
- The `package:clean` script (package-clean.bat) removes unnecessary build artifacts from node_modules/tree-sitter
- Reduces package size from ~36MB to ~7.5MB by excluding .obj, .pdb, .iobj, .ipdb files
- Preserves only the essential tree_sitter_runtime_binding.node file needed for runtime
- The .vscodeignore file excludes source files, tests, and development artifacts

### Extension Development
- Use F5 or the "Run Extension" launch configuration to open extension in new VS Code window
- Use "Extension Tests" launch configuration to run tests
- Tests are in `src/test/` and use VS Code test framework

## Architecture

### Core Components

- **BrParser** (`src/parser.ts`): Tree-sitter based parser for BR language files. Maintains parse trees and provides querying capabilities. Enhanced with methods for retrieving syntax nodes at specific positions and finding nearest nodes of specific types.
- **Project** (`src/class/Project.ts`): Type definition for workspace source files and layouts, maps URIs to TreeSitterSourceDocument instances. Improved file monitoring with status bar updates during project loading.
- **Extension** (`src/extension.ts`): Main activation point, registers all language providers and sets up file watchers.

### Language Server (Removed)
- Language features implemented directly through VS Code extension API providers
- No separate language server process required

### Provider Architecture
All language features are implemented as separate providers in `src/providers/`:
- **BrDefinitionProvider**: Go to definition for symbols (functions, variables, labels)
  - Cross-file navigation for library functions via library index
  - Local function definitions within current file
  - Variable definitions (DIM statements)
  - Label definitions
  - System functions return undefined (no definition available)
- **BrReferenceProvider**: Find all references with cross-file search
  - **Performance optimized**: Two-stage search with regex pre-scan before parsing
  - Cross-file search for function references across workspace
  - Local results shown first for immediate feedback
  - Type-based search via `searchByNodeType()` method
  - Supports functions, labels, and variables
- **BrHoverProvider**: Function hover information with JSDoc support
- **BrSignatureHelpProvider**: Parameter hints during function calls with improved handling of unclosed parentheses and detailed JSDoc documentation
- **FuncCompletionProvider**: User-defined function completions
- **StatementCompletionProvider**: BR language statements
- **BrSymbolProvider**: Document symbol navigation
- **BrRenameProvider**: Symbol renaming
- **LocalCompletionProvider**: Local variable completions
- **LocalFunctionCompletionProvider**: Local function completions within current document
- **InternalFunctionCompletionProvider**: Built-in BR function completions
- **KeywordCompletionProvider**: BR keyword completions
- **OccurenceHighlightProvider**: Highlight all occurrences of selected symbol
- **LayoutSemanticTokenProvider**: Syntax highlighting for layout files
- **BrLineNumberProvider**: Auto-insert line numbers on Enter key
  - Implements OnTypeFormattingEditProvider for '\n' trigger
  - Uses tree-sitter to detect line numbers and continuation lines
  - Auto-detects increment pattern from surrounding lines
  - Preserves zero-padding format
  - Handles continuation lines (!:) with indentation only

### Source Document Types
- **TreeSitterSourceDocument**: Primary document parser using Tree-sitter. Functions stored in a Map for improved lookups with case-insensitive retrieval

### File Watching System
The extension monitors workspace changes for:
- BR source files (`.brs`, `.wbs`) using configurable glob patterns
- Layout files in `filelay/` directory
- Configuration changes trigger re-parsing

### Tree-sitter Integration
- Uses `tree-sitter-br` grammar for parsing (v0.25.3+)
- Query files in `tree-query/` define extraction patterns for functions and libraries
- Incremental parsing for performance on document changes
- Enhanced diagnostics for missing nodes in addition to syntax errors

## Configuration
Extension settings in `package.json` under `contributes.configuration`:
- `br.searchPath`: Subdirectory for relative paths
- `br.sourceFileGlobPattern`: Pattern for finding BR files
- `br.layoutPath`: Directory for layout files
- `br.diagnosticsDelay`: Debounce for syntax checking
- `br.autoLineNumbers.enabled`: Enable/disable auto line number insertion (default: true)
- `br.autoLineNumbers.increment`: Default increment value (default: 10, overridden by detected pattern)
- `br.autoLineNumbers.zeroPadding`: Number of digits for padding (default: 5, overridden by detected format)

## Lexi Integration
- `src/lexi.ts`: Integration with BR compiler/runtime
- Commands for compile, run, add/strip line numbers
- Version switching (4.1, 4.2, 4.3)
- Executable located in `Lexi/` directory
- Keyboard shortcuts:
  - Ctrl+Alt+1: Compile current BR file
  - Ctrl+Alt+2: Run current BR program
  - Ctrl+Alt+3: Add/Strip line numbers (context-aware)

## Testing
- Tests use VS Code extension testing framework with new test CLI configuration (`.vscode-test.mjs`)
- Comprehensive test suites for all completion providers in `src/test/providers/`
- Tests require workspace setup with test files in `testcode/`
- Run single test file: `npm test -- --grep "TestName"`
- Tests validate IntelliSense, hover, function detection, and edge cases like unclosed parentheses