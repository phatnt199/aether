import type { BaseEntity, TBaseIdEntity, TBaseTzEntity } from "@/base/models";
import type { AbstractTzRepository } from "@/base/repositories";
import type { Context } from "hono";

// ----------------------------------------------------------------------------------------------------------------------------------------
// Basic Types
// ----------------------------------------------------------------------------------------------------------------------------------------
export type NumberIdType = number;
export type StringIdType = string;
export type IdType = string | number;
export type TNullable = undefined | null | void;

export type AnyType = any;
export type AnyObject = Record<string | symbol | number, any>;

export type ValueOrPromise<T> = T | Promise<T>;
export type ValueOf<T> = T[keyof T];

export type ValueOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
export type ValueOptionalExcept<T, K extends keyof T> = Pick<T, K> &
  Partial<Omit<T, K>>;

export type ClassProps<T> = ValueOf<T>;
export type ClassType<T> = Function & { prototype: T };

export type TStringConstValue<T extends ClassType<any>> = Extract<
  ValueOf<T>,
  string
>;
export type TNumberConstValue<T extends ClassType<any>> = Extract<
  ValueOf<T>,
  number
>;
export type TConstValue<T extends ClassType<any>> = Extract<
  ValueOf<T>,
  string | number
>;

export type TPrettify<T> = { [K in keyof T]: T[K] } & {};

// ----------------------------------------------------------------------------------------------------------------------------------------
// Domain Types
// ----------------------------------------------------------------------------------------------------------------------------------------
export type TRelationType =
  | "belongsTo"
  | "hasOne"
  | "hasMany"
  | "hasManyThrough";

export type TBullQueueRole = "queue" | "worker";

export type TPermissionEffect = "allow" | "deny";

// ----------------------------------------------------------------------------------------------------------------------------------------
// Field Mapping Types
// ----------------------------------------------------------------------------------------------------------------------------------------
export type TFieldMappingDataType =
  | "string"
  | "number"
  | "strings"
  | "numbers"
  | "boolean";
export interface IFieldMapping {
  name: string;
  type: TFieldMappingDataType;
  default?: string | number | Array<string> | Array<number> | boolean;
}

export type TFieldMappingNames<T extends Array<IFieldMapping>> = Extract<
  T[number],
  { type: Exclude<T[number]["type"], undefined> }
>["name"];

export type TObjectFromFieldMappings<
  T extends readonly {
    name: string;
    type: string;
    [extra: string | symbol]: any;
  }[],
> = {
  [K in T[number]["name"]]: T extends {
    name: K;
    type: "string";
    [extra: string | symbol]: any;
  }
    ? string
    : T extends { name: K; type: "number"; [extra: string | symbol]: any }
      ? number
      : T extends { name: K; type: "boolean"; [extra: string | symbol]: any }
        ? boolean
        : T extends { name: K; type: "strings"; [extra: string | symbol]: any }
          ? string[]
          : T extends {
                name: K;
                type: "numbers";
                [extra: string | symbol]: any;
              }
            ? number[]
            : never;
};

// ----------------------------------------------------------------------------------------------------------------------------------------
// Application Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IApplication {
  models: Set<string>;

  initialize(opts?: { sequence?: ClassType<any> }): ValueOrPromise<void>;

  staticConfigure(): void;
  getProjectRoot(): string;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  controller<T>(ctor: ClassType<T>, nameOrOptions?: string | any): any;
  component<T>(ctor: ClassType<T>): void;

  getServerHost(): string;
  getServerPort(): number;
  getServerAddress(): string;

  getDatasourceSync<T extends IDataSource>(dsName: string): T;
  getRepositorySync<T extends IRepository>(c: ClassType<T>): T;
  getServiceSync<T extends IService>(c: ClassType<T>): T;

  getMigrateModels(opts: {
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<Array<IRepository>>;

  migrateModels(opts: {
    existingSchema: string;
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<void>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// DataSource Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IDataSource<T extends object = object> {
  name: string;
  config: T;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Entity Interfaces
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IEntity {
  id: IdType;
}

export type EntityClassType<T extends BaseEntity> = typeof BaseEntity & {
  prototype: T & { id?: IdType };
};

export type EntityRelationType = Record<string, any>;

// ----------------------------------------------------------------------------------------------------------------------------------------
// Repository Interfaces
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface Filter<T = any> {
  where?: Where<T>;
  fields?: Fields<T>;
  include?: Inclusion[];
  order?: string | string[];
  limit?: number;
  offset?: number;
  skip?: number;
}

export type Where<T = any> = {
  and?: Where<T>[];
  or?: Where<T>[];
  [key: string]: any;
};

export type Fields<T = any> = {
  [K in keyof T]?: boolean;
};

export interface Inclusion {
  relation: string;
  scope?: Filter;
}

export interface Count {
  count: number;
}

export type DataObject<T> = Partial<T>;

export interface IRepository {}

export interface IPersistableRepository<E extends TBaseIdEntity>
  extends IRepository {
  findOne(filter?: Filter<E>, options?: AnyObject): Promise<E | null>;

  existsWith(where?: Where<any>, options?: AnyObject): Promise<boolean>;

  create(data: DataObject<E>, options?: AnyObject): Promise<E>;
  createAll(datum: DataObject<E>[], options?: AnyObject): Promise<E[]>;
  createWithReturn(data: DataObject<E>, options?: AnyObject): Promise<E>;

  updateById(
    id: IdType,
    data: DataObject<E>,
    options?: AnyObject,
  ): Promise<void>;
  updateWithReturn(
    id: IdType,
    data: DataObject<E>,
    options?: AnyObject,
  ): Promise<E>;
  updateAll(
    data: DataObject<E>,
    where?: Where<any>,
    options?: AnyObject,
  ): Promise<Count>;

  upsertWith(
    data: DataObject<E>,
    where: Where<any>,
    options?: AnyObject,
  ): Promise<E | null>;
  replaceById(
    id: IdType,
    data: DataObject<E>,
    options?: AnyObject,
  ): Promise<void>;
}

export interface ITzRepository<E extends TBaseTzEntity>
  extends IPersistableRepository<E> {
  mixTimestamp(
    entity: DataObject<E>,
    options?: { newInstance: boolean },
  ): DataObject<E>;
  mixUserAudit(
    entity: DataObject<E>,
    options?: { newInstance: boolean; authorId: IdType },
  ): DataObject<E>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Service Interfaces
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IService {}

export interface ICrudMethodOptions {
  currentUser: {
    userId: IdType;
    roles: Array<{ id: IdType; identifier: string; priority: number }>;
    [extra: string | symbol]: any;
  } | null;

  requestContext: Context;

  [extra: symbol | string]: any;
}

export interface ICrudService<E extends TBaseTzEntity> extends IService {
  repository: AbstractTzRepository<E, EntityRelationType>;

  // Read
  find(
    filter: Filter<E>,
    options: ICrudMethodOptions,
  ): Promise<Array<E & EntityRelationType>>;
  findById(
    id: IdType,
    filter: Filter<E>,
    options: ICrudMethodOptions,
  ): Promise<E & EntityRelationType>;
  findOne(
    filter: Filter<E>,
    options: ICrudMethodOptions,
  ): Promise<(E & EntityRelationType) | null>;
  count(where: Where<E>, options: ICrudMethodOptions): Promise<Count>;

  // Create, Update, Delete
  create(data: Omit<E, "id">, options: ICrudMethodOptions): Promise<E>;
  updateAll(
    data: Partial<E>,
    where: Where<E>,
    options: ICrudMethodOptions,
  ): Promise<Count>;
  updateWithReturn(
    id: IdType,
    data: Partial<E>,
    options: ICrudMethodOptions,
  ): Promise<E>;
  replaceById(id: IdType, data: E, options: ICrudMethodOptions): Promise<E>;
  deleteById(id: IdType, options: ICrudMethodOptions): Promise<{ id: IdType }>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Controller Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IController {}

export interface ICrudController extends IController {
  defaultLimit: number;
  relation?: { name: string; type: string };
  repository?: IRepository;
  sourceRepository?: IRepository;
  targetRepository?: IRepository;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Environment Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IApplicationEnvironment {
  get<ReturnType>(key: string): ReturnType;
  set<ValueType>(key: string, value: ValueType): any;
}

export interface IEnvironmentValidationResult {
  result: boolean;
  message?: string;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Error Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IError<StatusCode extends number = number> extends Error {
  statusCode: StatusCode;
  messageCode?: string;
  message: string;
  [key: string]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Request Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IRequestedRemark {
  id: string;
  url: string;
  method: string;
  [extra: string | symbol]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
// Injection Getter
// ----------------------------------------------------------------------------------------------------------------------------------------
export type TInjectionGetter = <T>(key: string | symbol) => T;
