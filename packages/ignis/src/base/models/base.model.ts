import type { IdType, NumberIdType, StringIdType } from '@/common/types';
import { property } from '@/decorators/model.decorators';
import { pgTable } from 'drizzle-orm/pg-core';

// -------------------------------------------------------------------------------------------
export abstract class Entity {
  protected ormProvider: 'drizzle-orm';
  protected definitions: ReturnType<typeof pgTable>;

  abstract build(): void;
}

// -------------------------------------------------------------------------------------------
export abstract class BaseEntity<ID extends IdType = IdType> extends Entity {
  id: ID;

  constructor(data: Partial<BaseEntity<ID>>) {
    super();
    Object.assign(this, data);
  }

  toObject() {
    return Object.assign({}, this);
  }
}

// -------------------------------------------------------------------------------------------
export abstract class BaseNumberIdEntity extends BaseEntity<NumberIdType> {
  @property({ type: 'number', id: true, generated: true })
  override id: number;
}

export abstract class BaseStringIdEntity extends BaseEntity<StringIdType> {
  @property({ type: 'string', id: true })
  override id: string;
}

export type TBaseIdEntity = BaseNumberIdEntity | BaseStringIdEntity;

// -------------------------------------------------------------------------------------------
export abstract class BaseNumberTzEntity extends BaseNumberIdEntity {
  @property({ type: 'date' })
  createdAt?: Date;

  @property({ type: 'date' })
  modifiedAt?: Date;
}

export abstract class BaseStringTzEntity extends BaseStringIdEntity {
  @property({ type: 'date' })
  createdAt?: Date;

  @property({ type: 'date' })
  modifiedAt?: Date;
}

export type TBaseTzEntity = BaseNumberTzEntity | BaseStringTzEntity;

// -------------------------------------------------------------------------------------------
export abstract class BaseNumberUserAuditTzEntity extends BaseNumberTzEntity {
  @property({ type: 'number' })
  createdBy?: number;

  @property({ type: 'number' })
  modifiedBy?: number;
}

export abstract class BaseStringUserAuditTzEntity extends BaseStringTzEntity {
  @property({ type: 'string' })
  createdBy?: string;

  @property({ type: 'string' })
  modifiedBy?: string;
}

export type TBaseUserAuditTzEntity = BaseNumberUserAuditTzEntity | BaseStringUserAuditTzEntity;
