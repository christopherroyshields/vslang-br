# Business Rules! Language Support Extension for VS Code

Welcome BR programmers! This extension brings modern IDE features to Business Rules! development in Visual Studio Code.

## Quick Start for BR Programmers New to VS Code

### First Time Setup
1. **Install VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com)
2. **Install this Extension**: Search for "BR Language Extension" in VS Code's Extensions marketplace (Ctrl+Shift+X)
3. **Open your BR project**: File → Open Folder → Select your BR project directory
4. **Start coding**: Create or open `.brs` or `.wbs` files - the extension activates automatically!

### Interactive Tutorial
**In VS Code**: Press `Ctrl+Shift+P` and type "BR: Open Getting Started Walkthrough" for a guided tour!
Or go to Help → Get Started → BR Language Extension

## Essential VS Code Concepts for BR Developers

### The VS Code Interface
- **Editor**: Main area where you write code
- **Explorer** (Ctrl+Shift+E): File browser on the left - shows all your BR source files
- **Terminal** (Ctrl+`): Built-in command line for running Lexi commands
- **Command Palette** (Ctrl+Shift+P): Access all VS Code commands - type to search
- **Status Bar**: Bottom bar showing current BR version, line/column position, encoding

### Working with BR Files
- **File Extensions**: `.brs` (BR source) and `.wbs` (workfile source) are automatically recognized
- **Encoding**: BR files use CP437 encoding by default (DOS/OEM character set)
- **Line Numbers**: BR requires line numbers - this extension helps manage them

## Core Features for BR Development

### 🎨 Syntax Highlighting
Full color-coding for BR syntax including:
- Keywords (DIM, LET, IF, FOR, DO, etc.)
- Functions (both built-in and user-defined)
- Strings, numbers, and operators
- Comments (REM and !)
- Line labels

### ✨ IntelliSense (Auto-Completion)
Press **Ctrl+Space** to trigger suggestions:
- **BR Statements**: Type partial keywords like `pri` → `PRINT`
- **Functions**: Shows all available functions with descriptions
- **Variables**: Auto-completes variable names you've already used
- **Libraries**: Suggests functions from loaded libraries
- **Snippets**: Quick templates for common code patterns

### 📝 Function Documentation
- **Hover Information**: Hover over any function to see its documentation
- **Signature Help**: Press **Ctrl+Shift+Space** while typing function parameters
- **JSDoc Support**: Document your own functions with JSDoc-style comments:
  ```br
  ! /**
  !  * Calculate sales tax
  !  * @param amount - Purchase amount
  !  * @returns Tax amount
  !  */
  00100 DEF FNCALCTAX(amount)
  ```

### 🔍 Code Navigation
- **Symbol Search** (Ctrl+Shift+O): Quick navigation to any function or label
- **Outline View**: See document structure in the Explorer sidebar
- **Breadcrumbs**: Navigation trail at top of editor

### ✏️ Smart Editing
- **Multi-line Comments**: Select lines and press **Ctrl+/** to toggle comments
- **Auto-Rename** (F2): Rename variables/functions in program or function scope
- **Symbol Highlighting**: Click on a variable to highlight all occurrences
- **Next/Previous Occurrence**: 
  - **Ctrl+Shift+Down**: Jump to next occurrence
  - **Ctrl+Shift+Up**: Jump to previous occurrence

### 🚀 Lexi Integration
Common Lexi Features Supported:
- **Ctrl+Alt+1**: Compile current BR program
- **Ctrl+Alt+2**: Run current BR program  
- **Ctrl+Alt+3**: Add/Strip line numbers (context-aware)
- **Ctrl+Alt+4**: Switch to BR 4.1
- **Ctrl+Alt+5**: Switch to BR 4.2
- **Ctrl+Alt+6**: Switch to BR 4.3

Access all Lexi commands through Command Palette (Ctrl+Shift+P) → type "Lexi"

### 📋 Layout File Support
- Automatic recognition of files in `filelay/` directory
- Specialized syntax highlighting for layout files
- IntelliSense for subscripts

### ⚡ Real-Time Diagnostics
- **Syntax Checking**: Errors appear as you type with red squiggles
- **Problems Panel** (Ctrl+Shift+M): Lists all errors in your project

## Keyboard Shortcuts Reference

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Compile** | Ctrl+Alt+1 | Compile current BR file with Lexi |
| **Run** | Ctrl+Alt+2 | Execute current BR program |
| **Line Numbers** | Ctrl+Alt+3 | Add/Strip line numbers (smart toggle) |
| **BR 4.1** | Ctrl+Alt+4 | Switch to BR version 4.1 |
| **BR 4.2** | Ctrl+Alt+5 | Switch to BR version 4.2 |
| **BR 4.3** | Ctrl+Alt+6 | Switch to BR version 4.3 |
| **Scan Project** | Ctrl+Alt+7 | Re-scan all BR source files |
| **Toggle Comment** | Ctrl+/ | Comment/uncomment selected lines |
| **Next Match** | Ctrl+Shift+Down | Jump to next occurrence of symbol |
| **Previous Match** | Ctrl+Shift+Up | Jump to previous occurrence |
| **Go to Definition** | F12 | Jump to definition |
| **Rename Symbol** | F2 | Rename across files |
| **IntelliSense** | Ctrl+Space | Trigger suggestions |
| **Parameter Hints** | Ctrl+Shift+Space | Show function signatures |

## Configuration Options

Access through: File → Preferences → Settings → Search "BR"

- **Search Path**: Base directory for relative paths (default: workspace root)
- **Source Pattern**: File pattern for BR sources (default: `**/*.{brs,wbs}`)
- **Layout Path**: Directory containing file layouts (default: `filelay`)
- **Diagnostics Delay**: Milliseconds before checking syntax (default: 500ms)

## Tips for BR Developers

### Coming from BR Console?
- **No F5 to Run**: Use Ctrl+Alt+2 or click Run button in editor
- **Project-wide editing**: VS Code works with entire folders, not just single files
- **Version Control**: Built-in Git support - track changes to your BR code
- **Multiple Files**: Edit many BR files simultaneously in tabs
- **Split Views**: Right-click tab → "Split Right" to view files side-by-side

## Advanced Features

### Code Snippets
Type these prefixes and press Tab:
- `for` → FOR/NEXT loop template
- `do` → DO/LOOP template  
- `if` → IF/THEN/ELSE structure
- `open` → File OPEN statement template
- `def` → Function definition template

### Library Management
- Automatic detection of LIBRARY statements
- Function discovery from external libraries
- IntelliSense for library functions

### Project-Wide Features
- **Global Symbol Search** (Ctrl+T): Search functions/variables across all files
- **Find and Replace** (Ctrl+Shift+H): Replace across multiple files
- **Problems View**: See all syntax errors project-wide

## Getting Help

- **Command Palette** (Ctrl+Shift+P): Your gateway to all commands
- **Interactive Walkthrough**: Help → Get Started → BR Language Extension
- **VS Code Docs**: [code.visualstudio.com/docs](https://code.visualstudio.com/docs)
- **Report Issues**: [GitHub Issues](https://github.com/christopherroyshields/vslang-br/issues)

## Development & Contributing

### Building the Extension
```bash
npm install        # Install dependencies
npm run compile    # Compile TypeScript
npm run watch      # Watch mode for development
npm run lint       # Run ESLint
npm run test       # Run tests
```

### Packaging for Distribution
The extension uses optimized packaging to reduce file size from ~36MB to ~7.5MB:

```bash
npm run package:clean  # Creates optimized .vsix file (7.5 MB)
# OR
npm run package        # Standard packaging (larger file size)
```

The `package:clean` script removes unnecessary build artifacts while preserving all runtime requirements.

### Inspecting Package Contents
```bash
npm run vsce:ls        # List all files included in the package
```

---

💡 **Pro Tip**: Don't try to learn everything at once! Start with basic editing and IntelliSense, then gradually explore more features as you get comfortable with VS Code.
