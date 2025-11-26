import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { IScopeDefinition, IScopeValidationResult } from '../../common';
import { ScopeParser } from './scope-parser';
import { IScopeValidatorOptions, ScopeValidator } from './scope-validator';

/**
 * ScopeManager orchestrates scope parsing and validation
 * This is the main entry point for scope-related operations
 */
export class ScopeManager {
  private logger: ApplicationLogger;
  private parser: ScopeParser;
  private validator: ScopeValidator;

  constructor(opts: {
    availableScopes: IScopeDefinition[];
    defaultScopes: string[];
    scope?: string;
  }) {
    const { availableScopes, defaultScopes, scope } = opts;

    this.logger = LoggerFactory.getLogger([scope ?? ScopeManager.name]);
    this.parser = new ScopeParser({ scope });

    const validatorOptions: IScopeValidatorOptions = {
      availableScopes,
      defaultScopes,
      supportedResources: ['user'],
      supportedActions: ['read'],
    };

    this.validator = new ScopeValidator({ options: validatorOptions, scope });

    this.logger.info(
      '[constructor] Initialized | Available scopes: %d | Default scopes: %s',
      availableScopes.length,
      defaultScopes.join(', '),
    );
  }

  /**
   * Normalize scope input to array format
   * @param scopes - String, array, or undefined
   * @returns Array of scope strings
   */
  normalizeScopes(scopes?: string | string[]): string[] {
    if (!scopes) {
      return [];
    }

    if (Array.isArray(scopes)) {
      return scopes.filter(Boolean);
    }

    if (typeof scopes === 'string') {
      return scopes.split(' ').filter(Boolean);
    }

    return [];
  }

  /**
   * Validate scopes with normalization
   * @param scopes - Scopes in any format
   * @returns Validation result
   */
  async validateScopes(scopes?: string | string[]): Promise<IScopeValidationResult> {
    const normalized = this.normalizeScopes(scopes);
    return this.validator.validate(normalized);
  }

  /**
   * Parse scopes
   * @param scopes - Scopes in any format
   * @returns Array of parsed scopes
   */
  parseScopes(scopes?: string | string[]) {
    const normalized = this.normalizeScopes(scopes);
    return this.parser.parseMultiple(normalized);
  }

  /**
   * Check if a field is allowed
   * Returns actual field names (handles aliases)
   * @param relation - Relation name or '_base'
   * @param field - Field name (can be an alias)
   * @returns Array of resolved field names
   */
  isFieldAllowed(relation: string, field: string): string[] {
    return this.validator.isFieldAllowed(relation, field);
  }

  /**
   * Get default scopes
   * @returns Array of default scope strings
   */
  getDefaultScopes(): string[] {
    return this.validator.getDefaultScopes();
  }

  /**
   * Get available scope definitions
   * @returns Array of scope definitions
   */
  getAvailableScopes(): IScopeDefinition[] {
    return this.validator.getAvailableScopes();
  }

  /**
   * Get parser instance
   * @returns ScopeParser instance
   */
  getParser(): ScopeParser {
    return this.parser;
  }

  /**
   * Get validator instance
   * @returns ScopeValidator instance
   */
  getValidator(): ScopeValidator {
    return this.validator;
  }
}
