# Compile and Run with Lexi Integration

The BR Language Extension includes powerful Lexi integration for compiling and running your Business Rules! programs directly from VS Code.

## Quick Commands

Use these keyboard shortcuts for fast development:

- **`Ctrl+Alt+1`** - Compile BR Program
- **`Ctrl+Alt+2`** - Run BR Program  
- **`Ctrl+Alt+3`** - Add Line Numbers
- **`Ctrl+Alt+3`** - Strip Line Numbers (same key)
- **`Ctrl+Alt+4`** - Set BR Version 4.1
- **`Ctrl+Alt+5`** - Set BR Version 4.2
- **`Ctrl+Alt+6`** - Set BR Version 4.3
- **`Ctrl+Alt+7`** - Scan All Project Source

## Using the Command Palette

You can also access Lexi commands via the Command Palette (`Ctrl+Shift+P`):

1. **Press `Ctrl+Shift+P`** to open Command Palette
2. **Type "Lexi"** to see all available commands:
   - `Lexi: Compile BR Program`
   - `Lexi: Run BR Program`
   - `Lexi: Add Line Numbers to BR Source`
   - `Lexi: Strip Line Numbers from BR Source`
   - `Lexi: Set BR Version 4.1/4.2/4.3`

## Workflow Example

Here's a typical development workflow:

### 1. Write Your Program
```br
! sample.brs
print "Enter your name: ";
input name$
print "Hello, "; name$; "!"

let age = val(input("Enter your age: "))
if age >= 18 then
    print "You are an adult."
else
    print "You are a minor."
fnend
```

### 2. Compile and Test
1. **Save your file** (Ctrl+S)
2. **Press `Ctrl+Alt+1`** to compile
3. **Check for compilation errors** in the output
4. **Press `Ctrl+Alt+2`** to run if compilation succeeds

### 3. Line Numbers (Optional)
- **Add line numbers** for debugging: `Ctrl+Alt+3`
- **Strip line numbers** when done: `Ctrl+Alt+3`

## BR Version Management

Set the appropriate BR version for your project:

- **BR 4.1**: `Ctrl+Alt+4` - Legacy compatibility
- **BR 4.2**: `Ctrl+Alt+5` - Standard version  
- **BR 4.3**: `Ctrl+Alt+6` - Latest features

## Project Scanning

Use **`Ctrl+Alt+7`** to scan all project source files. This helps the extension:
- **Update symbol indexes** for better IntelliSense
- **Refresh library function** references
- **Rebuild the project** dependency tree

## Output and Error Handling

When compiling or running:
- **Output appears** in the integrated terminal
- **Compilation errors** are highlighted in the editor
- **Runtime output** shows program results
- **Error messages** provide debugging information

The Lexi integration makes BR development seamless within VS Code! 