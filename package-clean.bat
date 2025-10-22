@echo off
echo Cleaning build artifacts before packaging...

REM Save the required .node file
copy node_modules\tree-sitter\build\Release\tree_sitter_runtime_binding.node node_modules\tree-sitter\tree_sitter_runtime_binding.node.tmp

REM Remove build directory
rmdir /s /q node_modules\tree-sitter\build

REM Create minimal Release directory with just the required file
mkdir node_modules\tree-sitter\build\Release
move node_modules\tree-sitter\tree_sitter_runtime_binding.node.tmp node_modules\tree-sitter\build\Release\tree_sitter_runtime_binding.node

REM Remove source files
rmdir /s /q node_modules\tree-sitter\src
rmdir /s /q node_modules\tree-sitter\vendor
del node_modules\tree-sitter\binding.gyp

echo Packaging extension...
call npx @vscode/vsce package

echo Done! Package created.