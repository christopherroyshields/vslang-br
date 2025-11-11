# Business Rules! Language Support Extension for VS Code

Welcome BR programmers! This extension brings modern IDE features to Business Rules! development in Visual Studio Code.

## Quick Start for BR Programmers New to VS Code

### First Time Setup
1. **Install VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com)
2. **Install this Extension**: Search for "BR Language Extension" in VS Code's Extensions marketplace (Ctrl+Shift+X)
3. **Open your BR project**: File → Open Folder → Select your BR project directory
4. **Start coding**: Create or open `.brs` or `.wbs` files - the extension activates automatically!


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
```br
00100 ! Program to demonstrate syntax highlighting
00110 DIM NAMES$(100)*30, TOTAL
00120 
00130 DEF FNPROCESSDATA(AMOUNT, TAXRATE)
00140   LET FNPROCESSDATA = AMOUNT * (1 + TAXRATE)
00150 FNEND
00160 
00170 OPEN #1: "NAME=CUSTOMER.DAT", DISPLAY, INPUT
00180 
00190 FOR I = 1 TO 100
00200   INPUT #1: NAMES$(I) ERROR 300
00210   LET TOTAL = TOTAL + FNPROCESSDATA(250, 0.08)
00220 NEXT I
00230 
00240 IF TOTAL > 1000 THEN 
00250   PRINT "Total exceeds limit: "; TOTAL
00260 ELSE
00270   PRINT "Total within range"
00280 END IF
00290 
00300 CLOSE #1
00310 END
```

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
  00090 /**
  00091  * Calculate sales tax for a given amount
  00092  * @param amount - The base purchase amount before tax
  00093  * @param taxrate - Tax rate as a decimal (e.g., 0.08 for 8%)
  00094  * @returns The calculated tax amount
  00095  * @example
  00096  *   LET TAX = FNCALCTAX(100, 0.08)  ! Returns 8.00
  00097  * @see FNCALCTOTAL for total with tax included
  00098  */
  00100 DEF FNCALCTAX(AMOUNT, TAXRATE)
  00110   LET FNCALCTAX = AMOUNT * TAXRATE
  00120 FNEND
  00130 
  00140 /**
  00141  * Calculate total amount including tax
  00142  * @param amount - Base amount
  00143  * @param taxrate - Tax rate (decimal)
  00144  * @returns Total amount with tax
  00145  */
  00150 DEF FNCALCTOTAL(AMOUNT, TAXRATE)
  00160   LET FNCALCTOTAL = AMOUNT + FNCALCTAX(AMOUNT, TAXRATE)
  00170 FNEND
  ```

### 🧭 Code Navigation & Symbol Resolution

#### Go to Definition (F12)
Jump directly to where symbols are defined:
- **Functions**: Navigate to function definitions
  - **Local Functions**: Jump to `DEF` statement in current file
  - **Library Functions**: Cross-file navigation to library function definitions
  - **System Functions**: No definition navigation (built-in functions)
- **Variables**: Jump to `DIM` statement where variable is declared
- **Labels**: Navigate to label definition (e.g., `100:`)
- **Case-Insensitive**: Works regardless of letter casing

**Usage:**
- Right-click symbol → "Go to Definition"
- Press **F12** on any symbol
- Ctrl+Click on a symbol

#### Find All References (Shift+F12)
Find every usage of a symbol across your entire workspace:
- **Cross-File Search**: Finds references in all BR files, not just current file
- **Smart Performance**: Fast regex pre-scan before parsing
  - Only parses files that contain the symbol
  - ~100x faster on large workspaces (100+ files)
- **Local Results First**: Current file references appear immediately
- **Functions, Labels, Variables**: Works for all symbol types

**Usage:**
- Right-click symbol → "Find All References"
- Press **Shift+F12** on any symbol
- Results appear in "References" panel

**Example:** Finding all calls to a library function:
1. Click on `fnCalculateTax` in any file
2. Press Shift+F12
3. See all references across:
   - Current file (shown first)
   - Library definition file
   - All files calling the function

#### Other Navigation Features
- **Symbol Search** (Ctrl+Shift+O): Quick navigation to any function or label in current file
- **Workspace Symbol Search** (Ctrl+T): Search functions across all files
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
- **Auto-Compile**: Enable automatic compilation on save (toggle in status bar)
- **Decompile**: Convert compiled BR programs (.br, .bro, .wb, .wbo) back to source

Access all Lexi commands through Command Palette (Ctrl+Shift+P) → type "Lexi"

#### ⚙️ Launch Configurations
**Configure multiple BR runtime environments** - Run programs with different executables, wbconfig files, and workstation IDs.

**Quick Start:**
1. Create `.vscode/launch.json` in your workspace
2. Add BR launch configurations with `"type": "br"`
3. Press **Ctrl+Alt+2** to run - select your configuration
4. Use **"BR: Select Launch Configuration"** command to switch between configs

**Example Configuration:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "br",
      "request": "launch",
      "name": "Launch BR (Default)",
      "executable": "${extensionPath}/Lexi/brnative.exe",
      "wbconfig": "",
      "wsid": "",
      "cwd": "${fileDirname}"
    },
    {
      "type": "br",
      "request": "launch",
      "name": "Launch BR 4.2 Production",
      "executable": "C:/BR42/brnative.exe",
      "wbconfig": "${workspaceFolder}/config/wbconfig.sys",
      "wsid": "42+",
      "cwd": "${fileDirname}"
    },
    {
      "type": "br",
      "request": "launch",
      "name": "Development Environment",
      "executable": "${extensionPath}/Lexi/brnative.exe",
      "wbconfig": "${workspaceFolder}/dev/wbconfig.dev",
      "wsid": "10",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

**Configuration Properties:**
- **`executable`**: Path to BR executable (supports variables)
  - Default: `${extensionPath}/Lexi/brnative.exe`
  - Can be relative to workspace or absolute path
- **`wbconfig`**: Path to wbconfig file (e.g., `wbconfig.sys`)
  - Passed as `-[filename]` argument to BR executable
  - Leave empty to use BR's default behavior
- **`wsid`**: Workstation ID parameter
  - `"42"` → `-42` (specific workstation ID)
  - `"42+"` → `-42+` (auto-increment by 1 if in use)
  - `"21+5"` → `-21+5` (increment by 5 if needed)
  - `"WSIDCLEAR"` → `-WSIDCLEAR` (clear WSID)
  - `"+5"` → `+5` (increment only)
- **`cwd`**: Working directory (default: `${fileDirname}`)

**Variable Substitution:**
- `${workspaceFolder}` - Workspace root directory
- `${extensionPath}` - Extension installation path
- `${file}` - Current file path
- `${fileDirname}` - Current file's directory
- `${fileBasename}` - Current filename with extension
- `${fileBasenameNoExtension}` - Filename without extension

**Features:**
- **Built-in Default**: Always includes a default configuration using extension's BR executable
- **Active Configuration**: Last selected config is remembered per workspace
- **IntelliSense**: Full autocomplete support when editing launch.json
- **Quick Switch**: Use "BR: Select Launch Configuration" to change active config
- **Validation**: Checks if executable exists before launching

**Use Cases:**
- **Multiple BR Versions**: Switch between BR 4.1, 4.2, 4.3 easily
- **Environment Configs**: Dev, test, prod with different wbconfig files
- **Multi-User Testing**: Different WSID values for concurrent sessions
- **Custom Runtimes**: Use custom BR executables or installations

#### 🔄 Automatic Decompilation
When you click on a compiled BR file (.br, .bro, .wb, .wbo):
- The extension automatically decompiles it to source code
- Opens the source file (.brs or .wbs) instead of the binary
- If source already exists, opens it immediately
- If not, decompiles on-the-fly and opens the result
- Never shows binary content - always shows readable source!

#### ⚙️ Auto-Compile Feature
- **Status Bar Toggle**: Click "Auto-Compile" in status bar to enable/disable
- **Per-File Setting**: Each file remembers its auto-compile preference
- **Save Triggers Compile**: When enabled, saving automatically compiles the file

### 🔍 Proc Search
**Advanced search using BR's native LIST command** - Search compiled BR programs using procedure files for powerful, accurate results.

**Quick Start:**
- **Ctrl+Alt+F**: Open Proc Search
- Enter BR LIST search parameters: `'LET'` or `'LET' "FNEND" ~'test'`
- Results appear in the **Proc Search** sidebar panel
- Click any result to navigate to that line

**How It Works:**
1. **Enter Search Terms**: Type BR LIST parameters using quoted strings
2. **Automatic Execution**: Generates a BR procedure file with LIST commands
3. **Native BR Search**: Uses BR's built-in LIST command for accurate results
4. **Tree View Results**: Files grouped with expandable match lists
5. **Smart Navigation**: Click any match to:
   - Automatically decompile if source doesn't exist
   - Map internal BR line numbers (00100, 00200) to actual file positions
   - Open source file centered on the exact line

**Search Syntax (BR LIST Format):**
- `'term'` - Case-insensitive search (single quotes)
- `"term"` - Case-sensitive search (double quotes)
- `~'term'` - NOT case-insensitive (exclude lines with term)
- `~"term"` - NOT case-sensitive (exclude lines with term)
- Multiple terms: `'LET' 'FNEND'` or `'OPEN' ~'test'` (up to 3 terms)

**Features:**
- **BR Native Syntax**: Uses exact BR LIST command format
- **Compiled Programs**: Searches .br, .bro, .wb, .wbo files
- **Hierarchical View**: Results grouped by file with match counts
- **Auto-Decompile**: Automatically creates source files when needed
- **Line Number Mapping**: Finds BR internal line numbers in source files
- **Tree Navigation**: Expand/collapse files, navigate with keyboard
- **Error Handling**: Continues searching even if individual files fail

**Example Searches:**
- `'LET'` - Find all LET statements (case-insensitive)
- `"OPEN"` - Find OPEN statements (case-sensitive)
- `'OPEN' 'CLOSE'` - Find file operations
- `'DEF' 'FNEND'` - Find function definitions
- `'PRINT' ~'test'` - Find PRINT statements but exclude lines with "test"

**Panel Features:**
- **Sidebar Icon**: Click the search icon (🔍) in the activity bar
- **Match Counts**: Each file shows number of matches found
- **File Icons**: Uses proper BR file icons from your theme
- **Keyboard Navigation**: Use arrow keys to browse results
- **Status Updates**: Progress shown in output channel

**Technical Details:**
The Proc Search feature generates dynamic BR procedure files that use the LOAD and LIST commands:
```
proc noecho
PROCERR RETURN
LOAD ":C:\path\to\program.br"
LIST searchterm >":results.txt"
system
```

Results are parsed and displayed in a native VS Code tree view with full navigation support.

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
| **Proc Search** | Ctrl+Alt+F | Search compiled BR programs |
| **Toggle Comment** | Ctrl+/ | Comment/uncomment selected lines |
| **Next Match** | Ctrl+Shift+Down | Jump to next occurrence of symbol |
| **Previous Match** | Ctrl+Shift+Up | Jump to previous occurrence |
| **Go to Definition** | F12 | Jump to symbol definition (functions, variables, labels) |
| **Find All References** | Shift+F12 | Find all uses of symbol across workspace |
| **Rename Symbol** | F2 | Rename across files |
| **IntelliSense** | Ctrl+Space | Trigger suggestions |
| **Parameter Hints** | Ctrl+Shift+Space | Show function signatures |
| **Workspace Symbols** | Ctrl+T | Search functions across all files |

## Configuration Options

Access through: File → Preferences → Settings → Search "BR"

- **Search Path**: Base directory for relative paths (default: workspace root)
- **Source Pattern**: File pattern for BR sources (default: `**/*.{brs,wbs}`)
- **Layout Path**: Directory containing file layouts (default: `filelay`)
- **Diagnostics Delay**: Milliseconds before checking syntax (default: 500ms)
- **Decompile Extensions**: Customize file extension mappings for decompilation
  - Default mappings: `.br`→`.brs`, `.bro`→`.brs`, `.wb`→`.wbs`, `.wbo`→`.wbs`
  - Add custom mappings through settings

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

### Decompilation Features
- **Context Menu**: Right-click compiled files → "Lexi: Decompile BR Program"
- **Automatic Handling**: Click any compiled file to see source code instantly
- **Overwrite Protection**: Warns before overwriting existing source files
- **Custom Extensions**: Configure which file types can be decompiled
- **Seamless Workflow**: Never see binary content - always work with source

### Project-Wide Features
- **Global Symbol Search** (Ctrl+T): Search functions/variables across all files
- **Find and Replace** (Ctrl+Shift+H): Replace across multiple files
- **Problems View**: See all syntax errors project-wide

## Getting Help

- **Command Palette** (Ctrl+Shift+P): Your gateway to all commands
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
