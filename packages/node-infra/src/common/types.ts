import { BaseEntity, TBaseIdEntity, TBaseTzEntity } from '@/base/models';
import { AbstractTzRepository } from '@/base/repositories';
import {
  Binding,
  BindingFromClassOptions,
  BindingKey,
  Constructor,
  ControllerClass,
} from '@loopback/core';
import {
  Count,
  DataObject,
  Entity,
  Filter,
  JugglerDataSource,
  Options,
  Repository,
  Transaction,
  Where,
} from '@loopback/repository';
import { RequestContext, SequenceHandler } from '@loopback/rest';
import { IncomingHttpHeaders } from 'node:http';
import { ParsedUrlQuery } from 'node:querystring';

// ----------------------------------------------------------------------------------------------------------------------------------------
export type NumberIdType = number;
export type StringIdType = string;
export type IdType = string | number;
export type NullableType = undefined | null | void;

export type AnyType = any;
export type AnyObject = Record<string | symbol | number, any>;

export type ValueOrPromise<T> = T | Promise<T>;
export type ValueOf<T> = T[keyof T];

export type ValueOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ValueOptionalExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * Alias for {@link ValueOf<T>}
 */
export type ClassProps<T> = ValueOf<T>;

export type ClassType<T> = Function & { prototype: T };

export type TStatusFromClass<T extends ClassType<AnyObject>> = ValueOf<
  Omit<T, 'prototype' | 'isValid' | 'SCHEME_SET' | 'TYPE_SET'>
>;

export type TStringConstValue<T extends ClassType<any>> = Extract<ValueOf<T>, string>;
export type TNumberConstValue<T extends ClassType<any>> = Extract<ValueOf<T>, number>;
export type TConstValue<T extends ClassType<any>> = Extract<ValueOf<T>, string | number>;

export type TPrettify<T> = { [K in keyof T]: T[K] } & {};

// ----------------------------------------------------------------------------------------------------------------------------------------
export type TRelationType = 'belongsTo' | 'hasOne' | 'hasMany' | 'hasManyThrough';

export type TBullQueueRole = 'queue' | 'worker';

export type TPermissionEffect = 'allow' | 'deny';

// ----------------------------------------------------------------------------------------------------------------------------------------
export type TFieldMappingDataType = 'string' | 'number' | 'strings' | 'numbers' | 'boolean';
export interface IFieldMapping {
  name: string;
  type: TFieldMappingDataType;
  default?: string | number | Array<string> | Array<number> | boolean;
}

export type TFieldMappingNames<T extends Array<IFieldMapping>> = Extract<
  T[number],
  { type: Exclude<T[number]['type'], undefined> }
>['name'];

export type TObjectFromFieldMappings<
  T extends readonly { name: string; type: string; [extra: string | symbol]: any }[],
> = {
  [K in T[number]['name']]: T extends { name: K; type: 'string'; [extra: string | symbol]: any }
    ? string
    : T extends { name: K; type: 'number'; [extra: string | symbol]: any }
      ? number
      : T extends { name: K; type: 'boolean'; [extra: string | symbol]: any }
        ? boolean
        : T extends { name: K; type: 'strings'; [extra: string | symbol]: any }
          ? string[]
          : T extends { name: K; type: 'numbers'; [extra: string | symbol]: any }
            ? number[]
            : never;
};

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IApplication {
  models: Set<string>;

  initialize(opts: { sequence?: Constructor<SequenceHandler> }): ValueOrPromise<void>;

  staticConfigure(): void;
  getProjectRoot(): string;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  grpcController<T>(
    ctor: ControllerClass<T>,
    nameOrOptions?: string | BindingFromClassOptions,
  ): Binding<T>;

  getServerHost(): string;
  getServerPort(): number;
  getServerAddress(): string;

  getDatasourceSync<T extends JugglerDataSource>(dsName: string): T;
  getRepositorySync<T extends IRepository>(c: ClassType<T>): T;
  getServiceSync<T extends IService>(c: ClassType<T>): T;

  getMigrateModels(opts: {
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<Array<Repository<BaseEntity>>>;

  migrateModels(opts: {
    existingSchema: string;
    ignoreModels?: string[];
    migrateModels?: string[];
  }): ValueOrPromise<void>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IDataSource<T extends object = object> {
  name: string;
  config: T;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IEntity {
  id: IdType;
}

export type EntityClassType<T extends Entity> = typeof Entity & {
  prototype: T & { id?: IdType };
};

export type EntityRelationType = {};

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IDangerFilter extends Omit<Filter, 'order'> {
  // !DANGER this will not compatible with LB3
  order: string | string[];
}

export interface IRepository {}
export type TDBAction = Options & { transaction?: Transaction };

export interface IPersistableRepository<E extends TBaseIdEntity> extends IRepository {
  findOne(filter?: Filter<E>, options?: TDBAction): Promise<E | null>;

  existsWith(where?: Where<any>, options?: TDBAction): Promise<boolean>;

  create(data: DataObject<E>, options?: TDBAction): Promise<E>;
  createAll(datum: DataObject<E>[], options?: TDBAction): Promise<E[]>;
  createWithReturn(data: DataObject<E>, options?: TDBAction): Promise<E>;

  updateById(id: IdType, data: DataObject<E>, options?: TDBAction): Promise<void>;
  updateWithReturn(id: IdType, data: DataObject<E>, options?: TDBAction): Promise<E>;
  updateAll(data: DataObject<E>, where?: Where<any>, options?: TDBAction): Promise<Count>;

  upsertWith(data: DataObject<E>, where: Where<any>, options?: TDBAction): Promise<E | null>;
  replaceById(id: IdType, data: DataObject<E>, options?: TDBAction): Promise<void>;
}

export interface ITzRepository<E extends TBaseTzEntity> extends IPersistableRepository<E> {
  mixTimestamp(entity: DataObject<E>, options?: { newInstance: boolean }): DataObject<E>;
  mixUserAudit(
    entity: DataObject<E>,
    options?: { newInstance: boolean; authorId: IdType },
  ): DataObject<E>;
  // mixTextSearch(entity: DataObject<E>, options?: { moreData: any; ignoreUpdate: boolean }): DataObject<E>;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IService {}

export interface ICrudMethodOptions {
  currentUser: {
    userId: IdType;
    roles: Array<{ id: IdType; identifier: string; priority: number }>;
    [extra: string | symbol]: any;
  } | null;

  requestContext: RequestContext;

  [extra: symbol | string]: any;
}

export interface ICrudService<E extends TBaseTzEntity> extends IService {
  repository: AbstractTzRepository<E, EntityRelationType>;

  // R
  find(filter: Filter<E>, options: ICrudMethodOptions): Promise<Array<E & EntityRelationType>>;
  findById(
    id: IdType,
    filter: Filter<E>,
    options: ICrudMethodOptions,
  ): Promise<E & EntityRelationType>;
  findOne(filter: Filter<E>, options: ICrudMethodOptions): Promise<(E & EntityRelationType) | null>;
  count(where: Where<E>, options: ICrudMethodOptions): Promise<Count>;

  // CUD
  create(data: Omit<E, 'id'>, options: ICrudMethodOptions): Promise<E>;
  updateAll(data: Partial<E>, where: Where<E>, options: ICrudMethodOptions): Promise<Count>;
  updateWithReturn(id: IdType, data: Partial<E>, options: ICrudMethodOptions): Promise<E>;
  replaceById(id: IdType, data: E, options: ICrudMethodOptions): Promise<E>;
  deleteById(id: IdType, options: ICrudMethodOptions): Promise<{ id: IdType }>;
}

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
export interface IApplicationEnvironment {
  get<ReturnType>(key: string): ReturnType;
  set<ValueType>(key: string, value: ValueType): any;
}

export interface IEnvironmentValidationResult {
  result: boolean;
  message?: string;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IError<StatusCode extends number = number> extends Error {
  statusCode: StatusCode;
  message: string;
  [key: string]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IRequestedRemark {
  id: string;
  url: string;
  method: string;
  [extra: string | symbol]: any;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export type TInjectionGetter = <T>(key: string | BindingKey<T>) => T;

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IHandshake {
  headers: IncomingHttpHeaders;
  time: string;
  address: string;
  xdomain: boolean;
  secure: boolean;
  issued: number;
  url: string;
  query: ParsedUrlQuery;
  auth: {
    [key: string]: any;
  };
}
