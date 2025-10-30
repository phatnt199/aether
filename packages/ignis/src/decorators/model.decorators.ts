import type { AnyObject, ClassType } from '@/common/types';
import { MetadataRegistry } from '@/core/metadata/registry';
import type { IPropertyMetadata, RelationMetadata } from '@/core/metadata/types';

/**
 * Drizzle ORM specific settings for the @model decorator
 */
export interface DrizzleModelSettings {
  /**
   * PostgreSQL schema name (e.g., 'public', 'auth', 'app')
   * @default 'public'
   */
  schema?: string;

  /**
   * Custom table name in the database
   * If not provided, uses the model name (lowercased)
   */
  tableName?: string;

  /**
   * Enable strict mode - requires all properties to be defined with @property decorator
   * @default true
   */
  strict?: boolean;

  /**
   * PostgreSQL table-level options
   */
  postgresql?: {
    /**
     * Enable Row-Level Security (RLS)
     * @default false
     */
    rowLevelSecurity?: boolean;

    /**
     * Table inheritance - inherit from another table
     * @example 'base_entity'
     */
    inherits?: string;

    /**
     * Table storage parameters
     * @example { fillfactor: 70, autovacuum_enabled: true }
     */
    storageParameters?: Record<string, any>;

    /**
     * Tablespace for the table
     */
    tablespace?: string;

    /**
     * Enable unlogged table (faster but not crash-safe)
     * @default false
     */
    unlogged?: boolean;
  };

  /**
   * Indexes to create at table level
   */
  indexes?: Array<{
    /**
     * Index name
     */
    name?: string;

    /**
     * Columns to include in the index
     */
    columns: string[];

    /**
     * Index type
     * @default 'btree'
     */
    type?: 'btree' | 'hash' | 'gist' | 'gin' | 'brin';

    /**
     * Create unique index
     * @default false
     */
    unique?: boolean;

    /**
     * Partial index WHERE clause
     * @example 'deleted_at IS NULL'
     */
    where?: string;

    /**
     * Index method options
     */
    using?: string;
  }>;

  /**
   * Composite unique constraints
   */
  uniqueConstraints?: Array<{
    /**
     * Constraint name
     */
    name?: string;

    /**
     * Columns that form the unique constraint
     */
    columns: string[];
  }>;

  /**
   * Check constraints
   */
  checkConstraints?: Array<{
    /**
     * Constraint name
     */
    name?: string;

    /**
     * SQL expression for the check
     * @example 'age >= 18'
     */
    expression: string;
  }>;

  /**
   * Enable soft delete support
   * Automatically filters out deleted records in queries
   * @default false
   */
  softDelete?: boolean;

  /**
   * Enable timestamp tracking (createdAt, updatedAt)
   * @default false
   */
  timestamps?: boolean;

  /**
   * Enable user audit tracking (createdBy, modifiedBy)
   * @default false
   */
  userAudit?: boolean;

  /**
   * Additional Drizzle-specific options
   */
  drizzle?: {
    /**
     * Skip generating migrations for this table
     * @default false
     */
    skipMigration?: boolean;

    /**
     * Table comment (PostgreSQL)
     */
    comment?: string;
  };
}

/**
 * @model decorator - marks a class as a model/entity with Drizzle ORM support
 * @param options - Model options including Drizzle-specific settings
 *
 * @example Basic usage:
 * ```ts
 * @model({ name: 'users' })
 * export class User extends BaseNumberTzEntity {
 *   @property({ type: 'string', required: true })
 *   email: string;
 * }
 * ```
 *
 * @example With PostgreSQL schema:
 * ```ts
 * @model({
 *   name: 'users',
 *   settings: {
 *     schema: 'auth',
 *     tableName: 'app_users'
 *   }
 * })
 * export class User extends Entity { }
 * ```
 *
 * @example With indexes and constraints:
 * ```ts
 * @model({
 *   name: 'products',
 *   settings: {
 *     indexes: [
 *       { columns: ['sku'], unique: true },
 *       { columns: ['category', 'price'], type: 'btree' }
 *     ],
 *     uniqueConstraints: [
 *       { name: 'unique_product_code', columns: ['code', 'vendor_id'] }
 *     ],
 *     checkConstraints: [
 *       { name: 'positive_price', expression: 'price > 0' }
 *     ]
 *   }
 * })
 * export class Product extends Entity { }
 * ```
 *
 * @example With PostgreSQL features:
 * ```ts
 * @model({
 *   name: 'audit_logs',
 *   settings: {
 *     postgresql: {
 *       rowLevelSecurity: true,
 *       unlogged: false,
 *       storageParameters: { fillfactor: 70 }
 *     },
 *     timestamps: true,
 *     userAudit: true
 *   }
 * })
 * export class AuditLog extends Entity { }
 * ```
 */
export function model(options?: {
  /**
   * Model/table name
   * Used as the table name in the database (unless tableName is specified in settings)
   */
  name?: string;

  /**
   * Drizzle ORM-specific settings
   */
  settings?: DrizzleModelSettings;
}) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    const metadata = {
      name: options?.name || target.name,
      settings: options?.settings || {},
    };

    MetadataRegistry.setModelMetadata(target, metadata);
    return target;
  };
}

/**
 * @property decorator - defines a model property
 * @param metadata - Property metadata
 *
 * @example
 * ```ts
 * @property({
 *   type: 'string',
 *   required: true,
 *   length: 100,
 *   index: true
 * })
 * email: string;
 * ```
 */
export function property(metadata?: IPropertyMetadata) {
  return function (target: any, propertyKey: string | symbol) {
    const designType = Reflect.getMetadata('design:type', target, propertyKey);

    const fullMetadata: IPropertyMetadata = {
      type: metadata?.type || designType?.name?.toLowerCase(),
      required: metadata?.required,
      id: metadata?.id,
      generated: metadata?.generated,
      default: metadata?.default,
      description: metadata?.description,
      jsonSchema: metadata?.jsonSchema,
      ...metadata,
    };

    MetadataRegistry.addPropertyMetadata(target, propertyKey, fullMetadata);
  };
}

/**
 * @belongsTo decorator - defines a belongsTo relation
 * @param target - Target model class or name
 * @param definition - Relation definition
 *
 * @example
 * ```ts
 * @belongsTo(() => User, { keyFrom: 'userId', keyTo: 'id' })
 * userId: number;
 *
 * // Accessor property
 * user?: User;
 * ```
 */
export function belongsTo<T>(
  target: () => ClassType<T>,
  definition?: {
    keyFrom?: string;
    keyTo?: string;
    name?: string;
  },
) {
  return (targetPrototype: any, propertyKey: string | symbol) => {
    const targetModel = typeof target === 'function' && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: 'belongsTo',
      target: targetModel,
      foreignKey: definition?.keyFrom || `${String(propertyKey)}Id`,
      keyFrom: definition?.keyFrom,
      keyTo: definition?.keyTo || 'id',
    };

    MetadataRegistry.addRelationMetadata(targetPrototype, propertyKey, metadata);
  };
}

/**
 * @hasOne decorator - defines a hasOne relation
 * @param target - Target model class or getter
 * @param definition - Relation definition
 *
 * @example
 * ```ts
 * @hasOne(() => Profile, { keyTo: 'userId' })
 * profile?: Profile;
 * ```
 */
export function hasOne<T>(
  target: () => ClassType<T>,
  definition?: {
    keyFrom?: string;
    keyTo?: string;
  },
) {
  return function (targetPrototype: any, propertyKey: string | symbol) {
    const targetModel = typeof target === 'function' && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: 'hasOne',
      target: targetModel,
      keyFrom: definition?.keyFrom || 'id',
      keyTo: definition?.keyTo,
    };

    MetadataRegistry.addRelationMetadata(targetPrototype, propertyKey, metadata);
  };
}

/**
 * @hasMany decorator - defines a hasMany relation
 * @param target - Target model class or getter
 * @param definition - Relation definition
 *
 * @example
 * ```ts
 * @hasMany(() => Order, { keyTo: 'userId' })
 * orders?: Order[];
 * ```
 */
export function hasMany<T>(
  target: () => ClassType<T>,
  definition?: {
    keyFrom?: string;
    keyTo?: string;
    through?: {
      model: string | ClassType<any>;
      keyFrom?: string;
      keyTo?: string;
    };
  },
) {
  return function (targetPrototype: any, propertyKey: string | symbol) {
    const targetModel = typeof target === 'function' && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: definition?.through ? 'hasManyThrough' : 'hasMany',
      target: targetModel,
      keyFrom: definition?.keyFrom || 'id',
      keyTo: definition?.keyTo,
      through: definition?.through,
    };

    MetadataRegistry.addRelationMetadata(targetPrototype, propertyKey, metadata);
  };
}

/**
 * Helper to get model schema reference (for OpenAPI)
 */
export function getModelSchemaRef(
  modelClass: ClassType<any>,
  options?: { includeRelations?: boolean; exclude?: string[] },
) {
  const modelMetadata = MetadataRegistry.getModelMetadata(modelClass);
  const properties = MetadataRegistry.getPropertiesMetadata(modelClass.prototype);

  const schema: AnyObject = {
    title: modelMetadata?.name || modelClass.name,
    type: 'object',
    properties: {},
  };

  if (properties) {
    properties.forEach((propMeta, propName) => {
      if (options?.exclude?.includes(String(propName))) {
        return;
      }

      schema.properties[propName] = {
        type: propMeta.type,
        description: propMeta.description,
        ...propMeta.jsonSchema,
      };
    });
  }

  return schema;
}

/**
 * Get filter schema for a model (for query parameters)
 */
export function getFilterSchemaFor(_modelClass: ClassType<any>) {
  return {
    type: 'object',
    properties: {
      where: { type: 'object' },
      fields: { type: 'object' },
      include: { type: 'array' },
      order: { type: 'array' },
      limit: { type: 'number' },
      skip: { type: 'number' },
      offset: { type: 'number' },
    },
  };
}
