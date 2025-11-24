import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { IAuthenticateOAuth2Options, IScopeDefinition } from '../../common';
import { OAuth2Actions, OAuth2Resources } from '../constants';

export interface IScopeConfigValidationError {
  field: string;
  message: string;
  scopeIdentifier?: string;
}

export interface IScopeConfigValidationResult {
  valid: boolean;
  errors: IScopeConfigValidationError[];
  warnings: string[];
}

/**
 * ScopeConfigValidator validates OAuth2 scope configuration at startup
 * Ensures configuration is well-formed and consistent
 */
export class ScopeConfigValidator {
  private logger: ApplicationLogger;

  constructor(scope?: string) {
    this.logger = LoggerFactory.getLogger([scope ?? ScopeConfigValidator.name]);
  }

  /**
   * Validate OAuth2 configuration
   * @param config - OAuth2 options configuration
   * @returns Validation result with errors and warnings
   */
  validate(config: IAuthenticateOAuth2Options): IScopeConfigValidationResult {
    const errors: IScopeConfigValidationError[] = [];
    const warnings: string[] = [];

    if (!config.enable) {
      this.logger.info('[validate] OAuth2 is disabled, skipping validation');
      return { valid: true, errors: [], warnings: [] };
    }

    const restOptions = config.restOptions;

    if (!restOptions) {
      warnings.push('No restOptions configured for OAuth2');
      return { valid: true, errors, warnings };
    }

    // Validate available scopes
    if (restOptions.availableScopes) {
      this.validateAvailableScopes(restOptions.availableScopes, errors, warnings);
    } else {
      warnings.push(
        'No availableScopes configured - all scopes will be allowed (backward compatibility mode)',
      );
    }

    // Validate default scopes
    if (restOptions.defaultScopes) {
      this.validateDefaultScopes(
        restOptions.defaultScopes,
        restOptions.availableScopes,
        errors,
        warnings,
      );
    } else {
      warnings.push('No defaultScopes configured - empty scopes will result in no data access');
    }

    const isValid = errors.length === 0;

    if (isValid) {
      this.logger.info(
        '[validate] Configuration valid | Warnings: %d | Available scopes: %d | Default scopes: %s',
        warnings.length,
        restOptions.availableScopes?.length ?? 0,
        restOptions.defaultScopes?.join(', ') ?? 'none',
      );
    } else {
      this.logger.error('[validate] Configuration invalid | Errors: %d', errors.length);
      errors.forEach(error => {
        this.logger.error('[validate] Error: %s - %s', error.field, error.message);
      });
    }

    if (warnings.length > 0) {
      warnings.forEach(warning => {
        this.logger.warn('[validate] Warning: %s', warning);
      });
    }

    return { valid: isValid, errors, warnings };
  }

  /**
   * Validate available scopes configuration
   */
  private validateAvailableScopes(
    scopes: IScopeDefinition[],
    errors: IScopeConfigValidationError[],
    warnings: string[],
  ): void {
    const identifiers = new Set<string>();

    for (const scope of scopes) {
      // Check for duplicate identifiers
      if (identifiers.has(scope.identifier)) {
        errors.push({
          field: 'availableScopes',
          message: `Duplicate scope identifier: ${scope.identifier}`,
          scopeIdentifier: scope.identifier,
        });
      }
      identifiers.add(scope.identifier);

      // Validate identifier format
      if (!scope.identifier || scope.identifier.trim() === '') {
        errors.push({
          field: 'availableScopes',
          message: 'Scope identifier cannot be empty',
          scopeIdentifier: scope.identifier,
        });
      }

      // Validate name
      if (!scope.name || scope.name.trim() === '') {
        errors.push({
          field: 'availableScopes',
          message: `Scope name cannot be empty for identifier: ${scope.identifier}`,
          scopeIdentifier: scope.identifier,
        });
      }

      // Check if scope has either fields or relations
      if (
        (!scope.fields || scope.fields.length === 0) &&
        (!scope.relations || scope.relations.length === 0)
      ) {
        warnings.push(
          `Scope '${scope.identifier}' has no fields or relations - it will not provide any data`,
        );
      }

      // Validate relations
      if (scope.relations) {
        this.validateRelations(scope, errors, warnings);
      }
    }
  }

  /**
   * Validate relations in a scope definition
   */
  private validateRelations(
    scope: IScopeDefinition,
    errors: IScopeConfigValidationError[],
    warnings: string[],
  ): void {
    const relationNames = new Set<string>();

    for (const relation of scope.relations!) {
      // Check for duplicate relation names
      if (relationNames.has(relation.relation)) {
        errors.push({
          field: 'availableScopes.relations',
          message: `Duplicate relation name '${relation.relation}' in scope: ${scope.identifier}`,
          scopeIdentifier: scope.identifier,
        });
      }
      relationNames.add(relation.relation);

      // Validate relation name
      if (!relation.relation || relation.relation.trim() === '') {
        errors.push({
          field: 'availableScopes.relations',
          message: `Relation name cannot be empty in scope: ${scope.identifier}`,
          scopeIdentifier: scope.identifier,
        });
      }

      // Warn if relation has no fields
      if (!relation.fields || relation.fields.length === 0) {
        warnings.push(
          `Relation '${relation.relation}' in scope '${scope.identifier}' has no fields specified`,
        );
      }
    }
  }

  /**
   * Validate default scopes
   */
  private validateDefaultScopes(
    defaultScopes: string[],
    availableScopes: IScopeDefinition[] | undefined,
    errors: IScopeConfigValidationError[],
    warnings: string[],
  ): void {
    if (defaultScopes.length === 0) {
      warnings.push('Default scopes array is empty');
      return;
    }

    // If no available scopes, can't validate default scopes
    if (!availableScopes || availableScopes.length === 0) {
      return;
    }

    // Check if default scopes are valid hierarchical scopes
    for (const defaultScope of defaultScopes) {
      const parts = defaultScope.split(':');

      if (parts.length < 3) {
        errors.push({
          field: 'defaultScopes',
          message: `Invalid scope format: ${defaultScope} (expected resource:action:path)`,
        });
        continue;
      }

      const [resource, action, ...path] = parts;

      // Validate resource
      if (resource !== OAuth2Resources.USER) {
        errors.push({
          field: 'defaultScopes',
          message: `Unsupported resource in default scope: ${defaultScope} (only 'user' is supported)`,
        });
      }

      // Validate action
      if (action !== OAuth2Actions.READ) {
        errors.push({
          field: 'defaultScopes',
          message: `Unsupported action in default scope: ${defaultScope} (only 'read' is supported)`,
        });
      }

      // Check if path refers to an existing scope identifier
      if (path.length > 0) {
        const [firstPart] = path;
        const isScopeFound = availableScopes.some(s => s.identifier === firstPart);

        if (!isScopeFound && path.length > 1) {
          // Check if it's a valid relation
          const isRelationFound = availableScopes.some(s =>
            s.relations?.some(r => r.relation === firstPart),
          );

          if (!isRelationFound) {
            warnings.push(
              `Default scope '${defaultScope}' references unknown scope/relation: ${firstPart}`,
            );
          }
        }
      }
    }
  }

  /**
   * Validate configuration and throw if invalid
   * @param config - OAuth2 configuration
   * @throws Error if configuration is invalid
   */
  validateOrThrow(config: IAuthenticateOAuth2Options): void {
    const result = this.validate(config);

    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      throw new Error(`Invalid OAuth2 configuration:\n${errorMessages}`);
    }
  }
}
