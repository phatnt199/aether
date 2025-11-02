import type { IdType, NumberIdType, StringIdType } from '@/common/types';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core';

// -------------------------------------------------------------------------------------------
// Base Entity with Drizzle ORM support
// -------------------------------------------------------------------------------------------
export abstract class Entity {
  protected ormProvider: 'drizzle-orm' = 'drizzle-orm';
  protected _table?: PgTableWithColumns<any>;

  /**
   * Get the Drizzle table schema for this entity
   * Should be implemented by child classes
   */
  abstract getTable(): PgTableWithColumns<any>;

  /**
   * Build and return the table schema
   * This method can be overridden for custom table building logic
   */
  build(): PgTableWithColumns<any> {
    if (!this._table) {
      this._table = this.getTable();
    }
    return this._table;
  }
}

// -------------------------------------------------------------------------------------------
// Base Entity with ID support
// -------------------------------------------------------------------------------------------
export abstract class BaseEntity<ID extends IdType = IdType> extends Entity {
  id!: ID;

  constructor(data?: Partial<BaseEntity<ID>>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }

  toObject() {
    return Object.assign({}, this);
  }

  toJSON() {
    return this.toObject();
  }
}

// -------------------------------------------------------------------------------------------
// Number ID Entity
// -------------------------------------------------------------------------------------------
export abstract class BaseNumberIdEntity extends BaseEntity<NumberIdType> {
  override id!: number;

  /**
   * Helper to create a table with serial primary key
   * Usage in child class:
   * ```
   * getTable() {
   *   return this.createTableWithSerial('users', {
   *     // additional columns
   *   });
   * }
   * ```
   */
  protected createTableWithSerial<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: serial('id').primaryKey(),
      ...columns,
    });
  }

  /**
   * Helper to create a table with integer primary key
   */
  protected createTableWithIntegerId<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: integer('id').primaryKey(),
      ...columns,
    });
  }
}

// -------------------------------------------------------------------------------------------
// String ID Entity
// -------------------------------------------------------------------------------------------
export abstract class BaseStringIdEntity extends BaseEntity<StringIdType> {
  override id!: string;

  /**
   * Helper to create a table with text primary key
   */
  protected createTableWithTextId<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: text('id').primaryKey(),
      ...columns,
    });
  }

  /**
   * Helper to create a table with varchar primary key
   */
  protected createTableWithVarcharId<T extends Record<string, any>>(
    tableName: string,
    columns: T,
    length: number = 255,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: varchar('id', { length }).primaryKey(),
      ...columns,
    });
  }
}

export type TBaseIdEntity = BaseNumberIdEntity | BaseStringIdEntity;

// -------------------------------------------------------------------------------------------
// Timestamp Entities (with createdAt and modifiedAt)
// -------------------------------------------------------------------------------------------
export abstract class BaseNumberTzEntity extends BaseNumberIdEntity {
  createdAt?: Date;
  modifiedAt?: Date;

  /**
   * Helper to create a table with serial ID and timestamp columns
   */
  protected override createTableWithSerial<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: serial('id').primaryKey(),
      ...columns,
      createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
      modifiedAt: timestamp('modified_at', { mode: 'date' })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    });
  }
}

export abstract class BaseStringTzEntity extends BaseStringIdEntity {
  createdAt?: Date;
  modifiedAt?: Date;

  /**
   * Helper to create a table with text ID and timestamp columns
   */
  protected override createTableWithTextId<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: text('id').primaryKey(),
      ...columns,
      createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
      modifiedAt: timestamp('modified_at', { mode: 'date' })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    });
  }
}

export type TBaseTzEntity = BaseNumberTzEntity | BaseStringTzEntity;

// -------------------------------------------------------------------------------------------
// User Audit Entities (with createdBy and modifiedBy)
// -------------------------------------------------------------------------------------------
export abstract class BaseNumberUserAuditTzEntity extends BaseNumberTzEntity {
  createdBy?: number;
  modifiedBy?: number;

  /**
   * Helper to create a table with serial ID, timestamp, and user audit columns
   */
  protected override createTableWithSerial<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: serial('id').primaryKey(),
      ...columns,
      createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
      modifiedAt: timestamp('modified_at', { mode: 'date' })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
      createdBy: integer('created_by'),
      modifiedBy: integer('modified_by'),
    });
  }
}

export abstract class BaseStringUserAuditTzEntity extends BaseStringTzEntity {
  createdBy?: string;
  modifiedBy?: string;

  /**
   * Helper to create a table with text ID, timestamp, and user audit columns
   */
  protected override createTableWithTextId<T extends Record<string, any>>(
    tableName: string,
    columns: T,
  ): PgTableWithColumns<any> {
    return pgTable(tableName, {
      id: text('id').primaryKey(),
      ...columns,
      createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
      modifiedAt: timestamp('modified_at', { mode: 'date' })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
      createdBy: text('created_by'),
      modifiedBy: text('modified_by'),
    });
  }
}

export type TBaseUserAuditTzEntity = BaseNumberUserAuditTzEntity | BaseStringUserAuditTzEntity;
