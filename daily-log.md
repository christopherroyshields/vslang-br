Date: 2025-06-03
# What I Did
* Rewrote hover provider to use tree-sitter queries instead of regex
* Refactored TreeSitterSourceDocument class to handle function lookups
* Added function indexing using tree-sitter queries
* Improved hover documentation parsing with tree-sitter nodes
* Added workspace folder support to source documents
* Set up basic test infrastructure for workspace functionality

# Whats Next
* need to get unit test actuallly working by getting hover to work with new source class with tree-sitter.  Needs to lookup libraries correctly with tree sitter and maybe config.