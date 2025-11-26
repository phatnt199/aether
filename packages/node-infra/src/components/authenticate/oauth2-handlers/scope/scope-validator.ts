import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { IParsedScope, IScopeDefinition, IScopeValidationResult } from '../../common';
import { ScopeParser } from './scope-parser';
import { OAuth2Actions, OAuth2Resources } from '../constants';

// Constant for base fields scope identifier
export const BASE_FIELDS_SCOPE = '_base';

export interface IScopeValidatorOptions {
  availableScopes: IScopeDefinition[];
  defaultScopes: string[];
  supportedResources?: string[];
  supportedActions?: string[];
}

/**
 * ScopeValidator validates OAuth2 scopes against configuration
 * Ensures that requested scopes are allowed and properly formatted
 */
export class ScopeValidator {
  private logger: ApplicationLogger;
  private parser: ScopeParser;
  private options: IScopeValidatorOptions;

  constructor(opts: { options: IScopeValidatorOptions; scope?: string }) {
    const { options, scope } = opts;
    this.logger = LoggerFactory.getLogger([scope ?? ScopeValidator.name]);
    this.parser = new ScopeParser({ scope });
    this.options = {
      supportedResources: [OAuth2Resources.USER],
      supportedActions: [OAuth2Actions.READ],
      ...options,
    };
  }

  /**
   * Validate requested scopes against available scopes configuration
   * @param requestedScopes - Array of scope strings requested by client
   * @returns Validation result with granted and invalid scopes
   */
  async validate(requestedScopes: string[]): Promise<IScopeValidationResult> {
    // If no scopes requested, use default scopes
    if (!requestedScopes || requestedScopes.length === 0) {
      this.logger.debug('[validate] No scopes requested, using defaults');
      return {
        valid: true,
        grantedScopes: this.options.defaultScopes,
      };
    }

    // If no available scopes configured, grant all (backward compatibility mode)
    if (this.options.availableScopes.length === 0) {
      this.logger.warn(
        '[validate] No available scopes configured, granting all requested scopes (backward compatibility)',
      );
      return {
        valid: true,
        grantedScopes: requestedScopes,
      };
    }

    const grantedScopes: string[] = [];
    const invalidScopes: string[] = [];

    for (const scopeString of requestedScopes) {
      const parsed = this.parser.parse(scopeString);

      if (!parsed) {
        invalidScopes.push(scopeString);
        continue;
      }

      const validationError = this.validateParsedScope(parsed);

      if (validationError) {
        this.logger.warn('[validate] Invalid scope: %s | Reason: %s', scopeString, validationError);
        invalidScopes.push(scopeString);
      } else {
        grantedScopes.push(scopeString);
      }
    }

    const isValid = invalidScopes.length === 0;

    this.logger.info(
      '[validate] Validation result | Valid: %s | Requested: %s | Granted: %s | Invalid: %s',
      isValid,
      requestedScopes.join(', '),
      grantedScopes.join(', '),
      invalidScopes.join(', ') || 'none',
    );

    return {
      valid: isValid,
      grantedScopes,
      invalidScopes: invalidScopes.length > 0 ? invalidScopes : undefined,
    };
  }

  /**
   * Validate a single parsed scope
   * @param parsed - Parsed scope object
   * @returns Error message if invalid, null if valid
   */
  private validateParsedScope(parsed: IParsedScope): string | null {
    // Check if resource is supported
    if (!this.options.supportedResources?.includes(parsed.resource)) {
      return `Unsupported resource: ${parsed.resource}`;
    }

    // Check if action is supported
    if (!this.options.supportedActions?.includes(parsed.action)) {
      return `Unsupported action: ${parsed.action}`;
    }

    // Validate path against available scopes
    if (!this.isPathValid(parsed.path)) {
      return `Invalid path: ${parsed.path.join(':')}`;
    }

    return null;
  }

  /**
   * Check if a scope path is valid based on configuration
   * @param path - Scope path (e.g., ['basic'], ['profile', 'firstName'])
   * @returns true if valid, false otherwise
   */
  private isPathValid(path: string[]): boolean {
    if (path.length === 0) {
      return false;
    }

    const [firstPart] = path;

    // Check if it's a scope group identifier
    const isScopeGroup = this.options.availableScopes.some(s => s.identifier === firstPart);

    if (isScopeGroup) {
      return true;
    }

    // For single-level paths, allow as direct field access
    if (path.length === 1) {
      return true;
    }

    // For nested paths, check if relation exists in any scope group
    const [relation] = path;
    const hasRelation = this.options.availableScopes.some(s =>
      s.relations?.some(r => r.relation === relation),
    );

    return hasRelation;
  }

  /**
   * Check if a specific field is allowed in a relation
   * Supports field aliases mapping (e.g., 'name' -> ['firstName', 'lastName'])
   * @param relation - Relation name or '_base' for base fields
   * @param field - Field name (can be an alias)
   * @returns Array of actual fields allowed, or empty array if not allowed
   */
  isFieldAllowed(relation: string, field: string): string[] {
    const allowedFields: string[] = [];

    for (const scopeConfig of this.options.availableScopes) {
      // Check base fields
      if (relation === BASE_FIELDS_SCOPE && scopeConfig.fields) {
        if (scopeConfig.fields.includes(field)) {
          allowedFields.push(field);
        }
      }

      // Check relation fields and aliases
      if (scopeConfig.relations) {
        for (const rel of scopeConfig.relations) {
          if (rel.relation === relation) {
            // Check if field is a direct field
            if (rel.fields?.includes(field)) {
              allowedFields.push(field);
            }

            // Check if field is an alias
            if (rel.fieldAliases?.[field]) {
              allowedFields.push(...rel.fieldAliases[field]);
            }
          }
        }
      }
    }

    return allowedFields;
  }

  /**
   * Get default scopes
   * @returns Array of default scope strings
   */
  getDefaultScopes(): string[] {
    return this.options.defaultScopes;
  }

  /**
   * Get available scope definitions
   * @returns Array of scope definitions
   */
  getAvailableScopes(): IScopeDefinition[] {
    return this.options.availableScopes;
  }
}
