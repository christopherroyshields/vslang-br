import { Uri } from 'vscode';

/**
 * Metadata for a library function stored in the index
 */
export interface LibraryFunctionMetadata {
  name: string;
  uri: Uri;
  parameters?: string;
  documentation?: string;
  lineNumber?: number;
}

/**
 * Centralized index for library functions across all source files.
 * Provides O(1) lookup performance for library function discovery.
 */
export default class LibraryFunctionIndex {
  private functionMap: Map<string, LibraryFunctionMetadata[]> = new Map();
  
  /**
   * Add a library function to the index
   */
  public addFunction(metadata: LibraryFunctionMetadata): void {
    const key = metadata.name.toLowerCase();
    const existing = this.functionMap.get(key) || [];
    existing.push(metadata);
    this.functionMap.set(key, existing);
  }
  
  /**
   * Get all library functions with the given name (case-insensitive)
   */
  public getFunctionsByName(name: string): LibraryFunctionMetadata[] {
    return this.functionMap.get(name.toLowerCase()) || [];
  }
  
  /**
   * Get the first library function with the given name
   */
  public getFunction(name: string): LibraryFunctionMetadata | undefined {
    const functions = this.getFunctionsByName(name);
    return functions.length > 0 ? functions[0] : undefined;
  }
  
  /**
   * Remove all functions from a specific URI
   */
  public removeFunctionsFromUri(uri: Uri): void {
    const uriString = uri.toString();
    for (const [key, functions] of this.functionMap.entries()) {
      const filtered = functions.filter(f => f.uri.toString() !== uriString);
      if (filtered.length === 0) {
        this.functionMap.delete(key);
      } else {
        this.functionMap.set(key, filtered);
      }
    }
  }
  
  /**
   * Get all library functions in the index
   */
  public getAllFunctions(): LibraryFunctionMetadata[] {
    const allFunctions: LibraryFunctionMetadata[] = [];
    for (const functions of this.functionMap.values()) {
      allFunctions.push(...functions);
    }
    return allFunctions;
  }
  
  /**
   * Clear the entire index
   */
  public clear(): void {
    this.functionMap.clear();
  }
  
  /**
   * Get the number of unique function names in the index
   */
  public get size(): number {
    return this.functionMap.size;
  }
  
  /**
   * Get the total number of library functions in the index
   */
  public get totalFunctions(): number {
    let count = 0;
    for (const functions of this.functionMap.values()) {
      count += functions.length;
    }
    return count;
  }
}