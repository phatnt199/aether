import { property } from "@/decorators/model.decorators";
import type { AnyObject, IdType } from "@/common/types";

/**
 * Base entity class
 * All models should extend this
 */
export class BaseEntity {
  /**
   * Get model ID
   */
  getId(): IdType | undefined {
    return (this as any).id;
  }

  /**
   * Get ID object (for consistency with Loopback)
   */
  getIdObject(): AnyObject {
    return { id: this.getId() };
  }

  /**
   * Convert entity to plain object
   */
  toObject(): AnyObject {
    return { ...this };
  }

  /**
   * Convert entity to JSON
   */
  toJSON(): AnyObject {
    return this.toObject();
  }
}

/**
 * Base KV entity for key-value stores
 */
export class BaseKVEntity<T = any> extends BaseEntity {
  @property({ type: "object" })
  payload: T;
}

/**
 * Base entity with numeric ID
 */
export class BaseNumberIdEntity extends BaseEntity {
  @property({ type: "number", id: true, generated: true })
  id: number;
}

/**
 * Base entity with string ID
 */
export class BaseStringIdEntity extends BaseEntity {
  @property({ type: "string", id: true })
  id: string;
}

/**
 * Default base entity with numeric ID
 */
export class BaseIdEntity extends BaseNumberIdEntity {}

/**
 * Type alias for entities with ID
 */
export type TBaseIdEntity = BaseNumberIdEntity | BaseStringIdEntity;

/**
 * Base entity with timestamps (inherits from mixins)
 */
export class BaseNumberTzEntity extends BaseNumberIdEntity {
  @property({ type: "date" })
  createdAt?: Date;

  @property({ type: "date" })
  modifiedAt?: Date;

  @property({ type: "date" })
  deletedAt?: Date;
}

export class BaseStringTzEntity extends BaseStringIdEntity {
  @property({ type: "date" })
  createdAt?: Date;

  @property({ type: "date" })
  modifiedAt?: Date;

  @property({ type: "date" })
  deletedAt?: Date;
}

export class BaseTzEntity extends BaseNumberTzEntity {}

export type TBaseTzEntity = BaseNumberTzEntity | BaseStringTzEntity;

/**
 * Base entity with user audit fields
 */
export class BaseNumberUserAuditTzEntity extends BaseNumberTzEntity {
  @property({ type: "number" })
  createdBy?: number;

  @property({ type: "number" })
  modifiedBy?: number;
}

export class BaseStringUserAuditTzEntity extends BaseStringTzEntity {
  @property({ type: "string" })
  createdBy?: string;

  @property({ type: "string" })
  modifiedBy?: string;
}

export class BaseUserAuditTzEntity extends BaseNumberUserAuditTzEntity {}

export type TBaseUserAuditTzEntity =
  | BaseNumberUserAuditTzEntity
  | BaseStringUserAuditTzEntity;

/**
 * Entity type with Tz (Timestamp)
 */
export type Entity = BaseEntity;
