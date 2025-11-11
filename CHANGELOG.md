# Change Log

All notable changes to the "vslang-br" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.11] - 2025-11-11

### Changed
- **Performance Optimization**: Workspace loading now uses regex pre-scan to detect library functions
  - Skips expensive scanning for files without library function patterns
  - Significantly faster initialization for large workspaces
  - Console logging shows scan statistics (files processed, library functions found, timing)
- **Find References Performance**: Added detailed performance logging
  - Shows total files searched, files actually scanned, and references found
  - Demonstrates optimization effectiveness in real-time

## [0.0.10] - 2025-11-11

### Added
- **Go to Definition (F12)**: Navigate to symbol definitions
  - Function definitions (local and library functions across files)
  - Variable definitions (DIM statements)
  - Label definitions
  - Cross-file navigation for library functions
  - Case-insensitive symbol lookup
- **Enhanced Find All References (Shift+F12)**: Cross-workspace reference search
  - Cross-file search for function references
  - Performance optimized with two-stage search (regex pre-scan + parsing)
  - Local results shown first for immediate feedback
  - ~100x faster on large workspaces (100+ files)
  - Supports functions, labels, and variables
- **Launch Configurations**: Configurable BR runtime environments
  - Multiple launch configurations support
  - Custom executable, wbconfig, and WSID settings
  - JSON schema validation for launch.json
  - Variable substitution support
- **Proc Search Enhancements**:
  - Search term highlighting in results
  - Relative file paths for better readability
  - Sorted search results by file path
  - Clear and modify search commands
- **Tree-sitter Packaging**: Vendored tree-sitter with prebuilds
  - Windows and Linux prebuilds included
  - Optimized packaging reduces extension size from ~36MB to ~7.5MB
  - Consistent runtime across platforms

### Changed
- BrReferenceProvider now searches across entire workspace (not just current file)
- Improved workspace symbol indexing with LibraryFunctionIndex

### Fixed
- Reference provider now correctly handles cross-file function searches
- Definition provider handles system functions appropriately (returns undefined)

## [Unreleased]

- Initial release