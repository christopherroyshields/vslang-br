# Advanced Development Features

Discover the powerful advanced features that make the BR Language Extension a complete development environment.

## Code Refactoring

### Rename Symbol (F2)
Safely rename variables, functions, and labels across your entire project:

```br
! Click on 'oldName' and press F2 to rename everywhere
def myFunction(oldName, param2$)
    let result = oldName * 2
    print "Result: "; result
    return result
fnend

let value = myFunction(oldName, "test")
```

1. **Place cursor** on any symbol name
2. **Press F2** or right-click and select "Rename Symbol"
3. **Type the new name** and press Enter
4. **All references update** automatically across files

## Error Detection & Diagnostics

The extension provides real-time syntax checking:

### Syntax Errors
```br
! This will show syntax errors
print "Missing quote
let x =     ! Missing value
if x then   ! Missing fnend
    print x
```

### Configuration
Adjust diagnostic sensitivity in settings:
- **Diagnostic Delay**: Control how quickly errors appear
- **Error Highlighting**: Red squiggly lines under problems
- **Problems Panel**: View all issues in one place

## File Layout Support

The extension also supports Business Rules! layout files:

### Layout File Features
- **Syntax highlighting** for `.lay` files in `filelay/` directory
- **Semantic tokens** for field definitions
- **File recognition** based on path patterns

```lay
! Example layout file (filelay/customer.lay)
CUSTOMER_ID     N 8
CUSTOMER_NAME   C 30
CUSTOMER_ADDR   C 50
CUSTOMER_PHONE  C 15
```

## Project Configuration

### BR Configuration Options
Configure the extension via VS Code settings:

- **Search Path**: Set the base directory for your BR project
- **Source File Pattern**: Customize which files are considered BR source
- **Layout Path**: Specify where layout files are stored
- **Layout Pattern**: Define layout file matching rules

### Access Settings
1. **File → Preferences → Settings** (Ctrl+,)
2. **Search for "BR"** to find BR-specific settings
3. **Configure per workspace** or globally

## Code Snippets

The extension includes helpful code snippets:

- **Type `for`** + Tab for loop templates
- **Type `if`** + Tab for conditional templates  
- **Type `def`** + Tab for function templates
- **File I/O snippets** for common operations

## Performance Features

### Background Indexing
- **Automatic parsing** of workspace files
- **Symbol indexing** for fast navigation
- **Library function** cross-referencing
- **Incremental updates** on file changes

### Memory Management
- **Efficient caching** of parsed files
- **Smart invalidation** on edits
- **Background cleanup** of unused data

## Keyboard Shortcuts Summary

| Feature | Shortcut | Description |
|---------|----------|-------------|
| **Compile** | `Ctrl+Alt+1` | Compile current program |
| **Run** | `Ctrl+Alt+2` | Run current program |
| **Go to Symbol** | `Ctrl+Shift+O` | Navigate to symbols |
| **Find References** | `Shift+F12` | Find all references |
| **Rename** | `F2` | Rename symbol |
| **Next Occurrence** | `Ctrl+Shift+Down` | Jump to next occurrence |
| **Previous Occurrence** | `Ctrl+Shift+Up` | Jump to previous occurrence |

Congratulations! You've discovered all the major features of the BR Language Extension. Happy coding with Business Rules!

---

## Need Help?

- **Check the documentation** for detailed guides
- **Report issues** on the GitHub repository
- **Request features** via the VS Code marketplace 