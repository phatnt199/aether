import { AnyObject, AnyType, IdType, ITzRepository, TInjectionGetter } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError, int } from '@/utilities';
import { IScopeDefinition } from '../../common';
import { BASE_FIELDS_SCOPE, ScopeManager } from '../scope';
import { OAuth2Actions, OAuth2Resources } from '../constants';

export interface IUserDataFetcherOptions {
  injectionGetter: TInjectionGetter;
  scopeManager: ScopeManager;
}

export interface IFetchByScopes {
  userId: IdType;
  grantedScopes: string[];
}

/**
 * UserDataFetcher handles fetching user data based on granted OAuth2 scopes
 * Builds optimized repository queries with proper field selection and relation includes
 */
interface IRelationMetadata {
  name: string;
  type: 'hasOne' | 'hasMany';
  groupBy?: string; // field to group by for hasMany
}

export class UserDataFetcher {
  private logger: ApplicationLogger;
  private injectionGetter: TInjectionGetter;
  private userRepositoryKey: string;
  private scopeManager: ScopeManager;
  private relationMetadata: Map<string, IRelationMetadata>;

  constructor(opts: { options: IUserDataFetcherOptions; scope?: string }) {
    const { options, scope } = opts;

    this.logger = LoggerFactory.getLogger([scope ?? UserDataFetcher.name]);
    this.injectionGetter = options.injectionGetter;
    this.userRepositoryKey = 'repositories.UserRepository';
    this.scopeManager = options.scopeManager;

    // Build relationMetadata dynamically from available scopes
    this.relationMetadata = this.buildRelationMetadata();

    this.logger.info('[constructor] Initialized | UserRepository: %s', this.userRepositoryKey);
    this.logger.debug(
      '[constructor] Relation metadata loaded: %s',
      Array.from(this.relationMetadata.keys()).join(', '),
    );
  }

  /**
   * Build relation metadata from available scopes configuration
   * Extracts relation type and groupBy settings from scope definitions
   * @returns Map of relation name to metadata
   */
  private buildRelationMetadata(): Map<string, IRelationMetadata> {
    const metadata = new Map<string, IRelationMetadata>();
    const availableScopes = this.scopeManager.getAvailableScopes();

    for (const scopeDef of availableScopes) {
      if (!scopeDef.relations) {
        continue;
      }

      for (const relationDef of scopeDef.relations) {
        // Skip if already registered (first definition wins)
        if (metadata.has(relationDef.relation)) {
          continue;
        }

        // Default to 'hasOne' if type not specified
        const relationType = relationDef.type ?? 'hasOne';

        metadata.set(relationDef.relation, {
          name: relationDef.relation,
          type: relationType,
          groupBy: relationDef.groupBy,
        });

        this.logger.debug(
          '[buildRelationMetadata] Registered relation | name: %s | type: %s | groupBy: %s',
          relationDef.relation,
          relationType,
          relationDef.groupBy ?? 'none',
        );
      }
    }

    return metadata;
  }

  /**
   * Fetch user data based on granted scopes
   * Builds a single optimized query to UserRepository
   * @param options - Fetch options containing userId and granted scopes
   * @returns User data object
   */
  async fetchByScopes(options: IFetchByScopes): Promise<AnyObject> {
    const { userId, grantedScopes } = options;

    // Normalize and use default scopes if none provided
    let scopesToUse = grantedScopes;
    if (!scopesToUse || scopesToUse.length === 0) {
      scopesToUse = this.scopeManager.getDefaultScopes();
      this.logger.debug(
        '[fetchByScopes] No scopes provided, using defaults: %s',
        scopesToUse.join(', '),
      );
    }

    // Parse scopes and build query structure
    const queryStructure = this.buildQueryStructure(scopesToUse);

    // Execute query
    try {
      let userData = await this.executeQuery(int(userId), queryStructure);
      userData = this.flattenUserData(userData);

      if (!userData) {
        this.logger.error('[fetchByScopes] User not found | userId: %s', userId);
        return { id: int(userId) };
      }

      this.logger.info(
        '[fetchByScopes] User data fetched successfully | userId: %s | scopes: %s | relations: %s',
        userId,
        scopesToUse.join(', '),
        queryStructure.relations.map(r => r.relation).join(', '),
      );

      return userData;
    } catch (error) {
      this.logger.error(
        '[fetchByScopes] Error fetching user data | userId: %s | error: %s',
        userId,
        getError(error).message,
      );
      return { id: int(userId) };
    }
  }

  /**
   * Build query structure from granted scopes
   * Determines which base fields and relations to fetch
   * @param scopes - Array of granted scope strings
   * @returns Query structure with base fields and relation includes
   */
  private buildQueryStructure(scopes: string[]): {
    baseFields: string[];
    relations: Array<{ relation: string; fields: string[] }>;
  } {
    const parsedScopes = this.scopeManager.parseScopes(scopes);
    const relationFieldsMap = new Map<string, Set<string>>();
    const baseFieldsSet = new Set<string>(['id']); // Always include id

    for (const parsed of parsedScopes) {
      // Only handle 'user' resource
      if (parsed.resource !== OAuth2Resources.USER) {
        this.logger.warn('[buildQueryStructure] Skipping non-user resource: %s', parsed.original);
        continue;
      }

      // Only handle 'read' action
      if (parsed.action !== OAuth2Actions.READ) {
        this.logger.warn('[buildQueryStructure] Skipping non-read action: %s', parsed.original);
        continue;
      }

      this.processScope(parsed.path, relationFieldsMap, baseFieldsSet);
    }

    // Build relations array
    const relations = Array.from(relationFieldsMap.entries()).map(([relation, fieldsSet]) => ({
      relation,
      fields: Array.from(fieldsSet).sort(),
    }));

    const baseFields = Array.from(baseFieldsSet).sort();

    this.logger.debug(
      '[buildQueryStructure] Query structure | Base fields: %s | Relations: %s',
      baseFields.join(', '),
      relations.map(r => `${r.relation}(${r.fields.join(',')})`).join(', '),
    );

    return { baseFields, relations };
  }

  /**
   * Process a single scope path
   * Determines if it's a base field, relation field, or scope group
   * @param path - Scope path array
   * @param relationFieldsMap - Map to collect relation fields
   * @param baseFieldsSet - Set to collect base fields
   */
  private processScope(
    path: string[],
    relationFieldsMap: Map<string, Set<string>>,
    baseFieldsSet: Set<string>,
  ): void {
    if (path.length === 0) {
      return;
    }

    const [firstPart, ...rest] = path;
    const availableScopes = this.scopeManager.getAvailableScopes();

    // Check if it's a relation with specific fields FIRST
    // This must be checked before scope groups because identifiers can be both
    const isRelation = availableScopes.some(s => s.relations?.some(r => r.relation === firstPart));

    if (isRelation && rest.length > 0) {
      // It's a relation field: user:read:profile:firstName or user:read:identifiers:identifier
      const relation = firstPart;
      const field = rest.join('.');

      // Validate field is allowed (now returns array of actual fields)
      const allowedFields = this.scopeManager.isFieldAllowed(relation, field);

      if (allowedFields.length > 0) {
        if (!relationFieldsMap.has(relation)) {
          relationFieldsMap.set(relation, new Set());
        }
        // Add all resolved fields (handles both direct fields and aliases)
        allowedFields.forEach(f => relationFieldsMap.get(relation)!.add(f));
      } else {
        this.logger.warn(
          '[processScope] Field not allowed | relation: %s | field: %s',
          relation,
          field,
        );
      }
      return;
    }

    // Check if it's a scope group identifier (only if not a relation with fields)
    const scopeGroup = availableScopes.find(s => s.identifier === firstPart);

    if (scopeGroup) {
      // It's a scope group, expand it
      this.expandScopeGroup(scopeGroup, relationFieldsMap, baseFieldsSet);
      return;
    }

    // It's a base field: user:read:id
    if (path.length === 1) {
      const field = firstPart;
      const resolvedFields = this.scopeManager.isFieldAllowed(BASE_FIELDS_SCOPE, field);

      if (resolvedFields.length > 0) {
        resolvedFields.forEach(f => baseFieldsSet.add(f));
      } else {
        this.logger.warn('[processScope] Base field not allowed | field: %s', field);
      }
    }
  }

  /**
   * Expand a scope group into base fields and relations
   * @param scopeGroup - Scope group definition
   * @param relationFieldsMap - Map to collect relation fields
   * @param baseFieldsSet - Set to collect base fields
   */
  private expandScopeGroup(
    scopeGroup: IScopeDefinition,
    relationFieldsMap: Map<string, Set<string>>,
    baseFieldsSet: Set<string>,
  ): void {
    // Add base fields
    if (scopeGroup.fields) {
      scopeGroup.fields.forEach(field => baseFieldsSet.add(field));
    }

    // Add relations
    if (scopeGroup.relations) {
      for (const relationDef of scopeGroup.relations) {
        if (!relationFieldsMap.has(relationDef.relation)) {
          relationFieldsMap.set(relationDef.relation, new Set());
        }

        const fieldsSet = relationFieldsMap.get(relationDef.relation)!;
        if (relationDef.fields) {
          relationDef.fields.forEach(field => fieldsSet.add(field));
        }
      }
    }
  }

  /**
   * Execute repository query with built structure
   * @param userId - User ID to fetch
   * @param structure - Query structure with fields and relations
   * @returns User data object or null
   */
  private async executeQuery(
    userId: number,
    structure: {
      baseFields: string[];
      relations: Array<{ relation: string; fields: string[] }>;
    },
  ): Promise<AnyObject | null> {
    const userRepository = this.injectionGetter<ITzRepository<AnyType>>(this.userRepositoryKey);

    const filter: AnyObject = {
      where: { id: userId },
      fields: structure.baseFields,
    };

    // Add relation includes
    if (structure.relations.length > 0) {
      filter.include = structure.relations.map(r => {
        // Always include 'id' and 'userId' (foreign key) in relation fields
        // This ensures hasMany relations work correctly and foreign key is always returned
        const relationFields = [...r.fields];

        // Add 'id' if not present (primary key of related entity)
        if (!relationFields.includes('id')) {
          relationFields.unshift('id');
        }

        // Add 'userId' if not present (foreign key for hasMany/hasOne relations)
        if (!relationFields.includes('userId')) {
          relationFields.push('userId');
        }

        return {
          relation: r.relation,
          scope: { fields: relationFields },
        };
      });
    }

    this.logger.debug('[executeQuery] Repository filter: %j', filter);

    return userRepository.findOne(filter);
  }

  /**
   * Fetch minimal user data (just ID)
   * @param userId - User ID
   * @returns User object with ID only
   */
  async fetchMinimal(userId: IdType): Promise<AnyObject> {
    try {
      const userRepository = this.injectionGetter<ITzRepository<AnyType>>(this.userRepositoryKey);
      const userData = await userRepository.findOne({
        where: { id: int(userId) },
        fields: ['id'],
      });

      return userData ?? { id: int(userId) };
    } catch (error) {
      this.logger.error(
        '[fetchMinimal] Error fetching user | userId: %s | error: %s',
        userId,
        getError(error).message,
      );
      return { id: int(userId) };
    }
  }

  /**
   * Flatten user data by removing internal fields and flattening relations
   * - Base fields and primitives are kept as-is
   * - hasOne relations are flattened with configured prefix
   * - hasMany relations are grouped by configured field with prefix
   * @param obj - Raw user object from repository
   * @returns Flattened user data object
   */
  private flattenUserData(obj: any): any {
    if (!this.isValidObject(obj)) {
      return obj;
    }

    const result: any = {};

    const relations = new Set(this.relationMetadata.keys());
    const INTERNAL_SKIP_FIELDS = new Set(['id', 'userId']);

    // Process base fields
    this.addBaseFields(obj, result, relations);

    // Process relations
    for (const [relationName, metadata] of this.relationMetadata) {
      switch (metadata.type) {
        case 'hasOne': {
          this.flattenHasOneRelation(relationName, metadata, obj, result, INTERNAL_SKIP_FIELDS);
          break;
        }
        case 'hasMany': {
          this.flattenHasManyRelation(relationName, metadata, obj, result, INTERNAL_SKIP_FIELDS);
          break;
        }
        default: {
          console.warn(`Unknown relation type for ${relationName}: ${metadata.type}`);
          break;
        }
      }
    }

    return result;
  }

  /**
   * Check if value is a valid object for processing
   */
  private isValidObject(obj: any): boolean {
    return obj !== null && obj !== undefined && typeof obj === 'object';
  }

  /**
   * Check if a value is a primitive (non-object) type
   */
  private isPrimitive(value: any): boolean {
    return value !== null && value !== undefined && typeof value !== 'object';
  }

  /**
   * Add base fields from the user object
   */
  private addBaseFields(obj: any, result: any, relationsToSkip: Set<string>): void {
    // Always include top-level id
    if (obj.id !== undefined) {
      result.id = obj.id;
    }

    // Add other primitive fields, excluding relations
    for (const key in obj) {
      if (
        !Object.prototype.hasOwnProperty.call(obj, key) ||
        key === 'id' ||
        relationsToSkip.has(key)
      ) {
        continue;
      }

      const value = obj[key];
      if (this.isPrimitive(value)) {
        result[key] = value;
      }
    }
  }

  /**
   * Flatten hasOne relation with configured prefix
   */
  private flattenHasOneRelation(
    relationName: string,
    metadata: IRelationMetadata,
    obj: any,
    result: any,
    internalFields: Set<string>,
  ): void {
    if (!this.isValidObject(obj[relationName])) {
      return;
    }

    const prefix = metadata.name;

    for (const key in obj[relationName]) {
      if (
        !Object.prototype.hasOwnProperty.call(obj[relationName], key) ||
        internalFields.has(key)
      ) {
        continue;
      }

      const value = obj[relationName][key];
      if (!this.isPrimitive(value)) {
        continue;
      }

      const serializedValue = value instanceof Date ? value.toISOString() : value;
      const fieldName = `${prefix}_${key}`;
      result[fieldName] = serializedValue;
    }
  }

  /**
   * Flatten hasMany relation grouped by configured field with prefix
   */
  private flattenHasManyRelation(
    relationName: string,
    metadata: IRelationMetadata,
    obj: any,
    result: any,
    internalFields: Set<string>,
  ): void {
    if (!Array.isArray(obj[relationName])) {
      return;
    }

    const groupByField = metadata.groupBy;
    if (!groupByField) {
      console.warn(`flattenHasManyRelation (${relationName}) skipped: no groupBy field configured`);
      return;
    }

    obj[relationName].forEach((item: any) => {
      if (!this.isValidObject(item)) {
        return;
      }

      const groupValue = item[groupByField];
      if (!groupValue) {
        return;
      }

      for (const key in item) {
        if (
          !Object.prototype.hasOwnProperty.call(item, key) ||
          internalFields.has(key) ||
          key === groupByField
        ) {
          continue;
        }

        const value = item[key];
        if (this.isPrimitive(value)) {
          const fieldName = `${groupValue}_${key}`;
          result[fieldName] = value;
        }
      }
    });
  }
}
