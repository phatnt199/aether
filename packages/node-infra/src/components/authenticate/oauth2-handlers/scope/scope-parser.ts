import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { IParsedScope } from '../../common';

/**
 * ScopeParser handles parsing of hierarchical OAuth2 scopes
 *
 * Scope Format: resource:action:path[:subpath...]
 * Examples:
 *   - "user:read:basic" -> { resource: 'user', action: 'read', path: ['basic'] }
 *   - "user:read:profile:firstName" -> { resource: 'user', action: 'read', path: ['profile', 'firstName'] }
 *   - "user:read:id" -> { resource: 'user', action: 'read', path: ['id'] }
 */
export class ScopeParser {
  private logger: ApplicationLogger;
  private readonly MINIMUM_PARTS = 3;
  private readonly SEPARATOR = ':';

  constructor(scope?: string) {
    this.logger = LoggerFactory.getLogger([scope ?? ScopeParser.name]);
  }

  /**
   * Parse a single scope string into structured format
   * @param scopeString - The scope string to parse (e.g., "user:read:basic")
   * @returns Parsed scope object or null if invalid
   */
  parse(scopeString: string): IParsedScope | null {
    if (!scopeString || typeof scopeString !== 'string') {
      this.logger.warn('[parse] Invalid scope string: %s', scopeString);
      return null;
    }

    const parts = scopeString.trim().split(this.SEPARATOR);

    if (parts.length < this.MINIMUM_PARTS) {
      this.logger.warn(
        '[parse] Invalid scope format: %s (expected resource:action:path)',
        scopeString,
      );
      return null;
    }

    const [resource, action, ...path] = parts;

    if (!resource || !action || path.length === 0) {
      this.logger.warn('[parse] Scope has empty parts: %s', scopeString);
      return null;
    }

    return {
      original: scopeString,
      resource: resource.toLowerCase(),
      action: action.toLowerCase(),
      path: path.map(p => p.trim()).filter(Boolean),
    };
  }

  /**
   * Parse multiple scope strings
   * @param scopeStrings - Array of scope strings or space-separated string
   * @returns Array of parsed scopes (invalid scopes are filtered out)
   */
  parseMultiple(scopeStrings: string[] | string): IParsedScope[] {
    const scopes = Array.isArray(scopeStrings)
      ? scopeStrings
      : scopeStrings.split(' ').filter(Boolean);

    return scopes
      .map(scope => this.parse(scope))
      .filter((parsed): parsed is IParsedScope => parsed !== null);
  }

  /**
   * Check if a scope string is valid without fully parsing
   * @param scopeString - The scope string to validate
   * @returns true if the scope format is valid
   */
  isValidFormat(scopeString: string): boolean {
    return this.parse(scopeString) !== null;
  }

  /**
   * Extract resource from scope string without full parsing
   * @param scopeString - The scope string
   * @returns Resource name or null
   */
  extractResource(scopeString: string): string | null {
    const parts = scopeString.split(this.SEPARATOR);
    return parts.length >= this.MINIMUM_PARTS ? parts[0].toLowerCase() : null;
  }

  /**
   * Extract action from scope string without full parsing
   * @param scopeString - The scope string
   * @returns Action name or null
   */
  extractAction(scopeString: string): string | null {
    const parts = scopeString.split(this.SEPARATOR);
    return parts.length >= this.MINIMUM_PARTS ? parts[1].toLowerCase() : null;
  }
}
