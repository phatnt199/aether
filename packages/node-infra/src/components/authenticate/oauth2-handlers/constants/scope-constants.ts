export const OAuth2Resources = {
  USER: 'user',
} as const;

export const OAuth2Actions = {
  READ: 'read',
} as const;

export class ScopeBuilder {
  private scopes: Set<string> = new Set();

  /**
   * Add a scope to the builder
   * @param scope - Scope string (e.g., "user:read:basic")
   * @returns This builder for chaining
   */
  add(scope: string): this {
    this.scopes.add(scope);
    return this;
  }

  /**
   * Add multiple scopes at once
   * @param scopes - Array of scope strings
   * @returns This builder for chaining
   */
  addMultiple(scopes: string[]): this {
    scopes.forEach(scope => this.scopes.add(scope));
    return this;
  }

  /**
   * Build a scope string from resource, action, and path components
   * @param resource - Resource name (e.g., 'user')
   * @param action - Action name (e.g., 'read')
   * @param path - Path components (e.g., ['basic'] or ['profile', 'firstName'])
   * @returns This builder for chaining
   */
  buildScope(resource: string, action: string, ...path: string[]): this {
    const scope = [resource, action, ...path].join(':');
    this.scopes.add(scope);
    return this;
  }

  /**
   * Build the final scope string (space-separated)
   * @returns Space-separated scope string
   */
  build(): string {
    return Array.from(this.scopes).join(' ');
  }

  /**
   * Get scopes as array
   * @returns Array of scope strings
   */
  toArray(): string[] {
    return Array.from(this.scopes);
  }

  /**
   * Clear all scopes
   * @returns This builder for chaining
   */
  clear(): this {
    this.scopes.clear();
    return this;
  }

  /**
   * Get number of scopes
   * @returns Number of scopes
   */
  count(): number {
    return this.scopes.size;
  }
}

/**
 * Helper function to create a new scope builder
 * @returns New ScopeBuilder instance
 */
export function createScopeBuilder(): ScopeBuilder {
  return new ScopeBuilder();
}

/**
 * Helper function to build scope string from array
 * @param scopes - Array of scope strings
 * @returns Space-separated scope string
 */
export function buildScopeString(...scopes: string[]): string {
  return scopes.join(' ');
}

/**
 * Helper function to build a single scope string
 * @param resource - Resource name
 * @param action - Action name
 * @param path - Path components
 * @returns Scope string in format "resource:action:path1:path2:..."
 */
export function buildScope(resource: string, action: string, ...path: string[]): string {
  return [resource, action, ...path].join(':');
}

/**
 * Helper function to parse scope string into components
 * @param scope - Scope string (e.g., "user:read:basic")
 * @returns Object with resource, action, and path components or null if invalid
 */
export function parseScopeString(scope: string): {
  resource: string;
  action: string;
  path: string[];
} | null {
  const parts = scope.split(':');
  if (parts.length < 3) {
    return null;
  }
  const [resource, action, ...path] = parts;
  return { resource, action, path };
}
