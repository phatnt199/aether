import { MetadataRegistry } from "@/core/metadata/registry";
import type { PropertyMetadata, RelationMetadata } from "@/core/metadata/types";
import type { ClassType, AnyObject } from "@/common/types";

/**
 * @model decorator - marks a class as a model/entity
 * Matches Loopback 4's @model()
 *
 * @param options - Model options
 *
 * @example
 * ```ts
 * @model({ settings: { strict: true } })
 * export class User extends Entity {
 *   @property({ type: 'number', id: true, generated: true })
 *   id: number;
 *
 *   @property({ type: 'string', required: true })
 *   name: string;
 * }
 * ```
 */
export function model(options?: { name?: string; settings?: AnyObject }) {
  return function <T extends { new (...args: any[]): {} }>(target: T) {
    const metadata = {
      name: options?.name || target.name,
      settings: options?.settings,
    };

    MetadataRegistry.setModelMetadata(target, metadata);
    return target;
  };
}

/**
 * @property decorator - defines a model property
 * Matches Loopback 4's @property()
 *
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
export function property(metadata?: PropertyMetadata) {
  return function (target: any, propertyKey: string | symbol) {
    // Get design-time type from TypeScript
    const designType = Reflect.getMetadata("design:type", target, propertyKey);

    const fullMetadata: PropertyMetadata = {
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
 * Matches Loopback 4's @belongsTo()
 *
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
export function belongsTo(
  target: string | ClassType<any> | (() => ClassType<any>),
  definition?: {
    keyFrom?: string;
    keyTo?: string;
    name?: string;
  },
) {
  return function (targetPrototype: any, propertyKey: string | symbol) {
    const targetModel =
      typeof target === "function" && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: "belongsTo",
      target: targetModel,
      foreignKey: definition?.keyFrom || `${String(propertyKey)}Id`,
      keyFrom: definition?.keyFrom,
      keyTo: definition?.keyTo || "id",
    };

    MetadataRegistry.addRelationMetadata(
      targetPrototype,
      propertyKey,
      metadata,
    );
  };
}

/**
 * @hasOne decorator - defines a hasOne relation
 * Matches Loopback 4's @hasOne()
 *
 * @param target - Target model class or getter
 * @param definition - Relation definition
 *
 * @example
 * ```ts
 * @hasOne(() => Profile, { keyTo: 'userId' })
 * profile?: Profile;
 * ```
 */
export function hasOne(
  target: string | ClassType<any> | (() => ClassType<any>),
  definition?: {
    keyFrom?: string;
    keyTo?: string;
  },
) {
  return function (targetPrototype: any, propertyKey: string | symbol) {
    const targetModel =
      typeof target === "function" && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: "hasOne",
      target: targetModel,
      keyFrom: definition?.keyFrom || "id",
      keyTo: definition?.keyTo,
    };

    MetadataRegistry.addRelationMetadata(
      targetPrototype,
      propertyKey,
      metadata,
    );
  };
}

/**
 * @hasMany decorator - defines a hasMany relation
 * Matches Loopback 4's @hasMany()
 *
 * @param target - Target model class or getter
 * @param definition - Relation definition
 *
 * @example
 * ```ts
 * @hasMany(() => Order, { keyTo: 'userId' })
 * orders?: Order[];
 * ```
 */
export function hasMany(
  target: string | ClassType<any> | (() => ClassType<any>),
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
    const targetModel =
      typeof target === "function" && target.length === 0 ? target() : target;

    const metadata: RelationMetadata = {
      type: definition?.through ? "hasManyThrough" : "hasMany",
      target: targetModel,
      keyFrom: definition?.keyFrom || "id",
      keyTo: definition?.keyTo,
      through: definition?.through,
    };

    MetadataRegistry.addRelationMetadata(
      targetPrototype,
      propertyKey,
      metadata,
    );
  };
}

/**
 * Helper to get model schema reference (for OpenAPI)
 * Matches Loopback's getModelSchemaRef()
 */
export function getModelSchemaRef(
  modelClass: ClassType<any>,
  options?: { includeRelations?: boolean; exclude?: string[] },
) {
  const modelMetadata = MetadataRegistry.getModelMetadata(modelClass);
  const properties = MetadataRegistry.getPropertiesMetadata(
    modelClass.prototype,
  );

  const schema: AnyObject = {
    title: modelMetadata?.name || modelClass.name,
    type: "object",
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
 * Matches Loopback's getFilterSchemaFor()
 */
export function getFilterSchemaFor(modelClass: ClassType<any>) {
  return {
    type: "object",
    properties: {
      where: { type: "object" },
      fields: { type: "object" },
      include: { type: "array" },
      order: { type: "array" },
      limit: { type: "number" },
      skip: { type: "number" },
      offset: { type: "number" },
    },
  };
}
