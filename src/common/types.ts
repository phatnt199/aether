import { AbstractTzRepository } from '@/base';
import { BaseEntity, BaseIdEntity, BaseTzEntity } from '@/base/base.model';
import { Binding, BindingFromClassOptions, BindingKey, ControllerClass } from '@loopback/core';
import {
  Count,
  DataObject,
  Entity,
  Filter,
  Options,
  Repository,
  Where,
} from '@loopback/repository';
import { RequestContext } from '@loopback/rest';

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
  Omit<T, 'prototype' | 'isValid' | 'SCHEME_SET'>
>;

export type TRelationType = 'belongsTo' | 'hasOne' | 'hasMany' | 'hasManyThrough';

export type TBullQueueRole = 'queue' | 'worker';

export type TPermissionEffect = 'allow' | 'deny';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IApplication {
  models: Set<string>;

  staticConfigure(): void;
  getProjectRoot(): string;
  preConfigure(): void;
  postConfigure(): void;

  grpcController<T>(
    ctor: ControllerClass<T>,
    nameOrOptions?: string | BindingFromClassOptions,
  ): Binding<T>;

  getServerHost(): string;
  getServerPort(): number;
  getServerAddress(): string;

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

export interface IPersistableRepository<E extends BaseIdEntity> extends IRepository {
  findOne(filter?: Filter<E>, options?: Options): Promise<E | null>;

  existsWith(where?: Where<any>, options?: Options): Promise<boolean>;

  create(data: DataObject<E>, options?: Options): Promise<E>;
  createAll(datum: DataObject<E>[], options?: Options): Promise<E[]>;
  createWithReturn(data: DataObject<E>, options?: Options): Promise<E>;

  updateById(id: IdType, data: DataObject<E>, options?: Options): Promise<void>;
  updateWithReturn(id: IdType, data: DataObject<E>, options?: Options): Promise<E>;
  updateAll(data: DataObject<E>, where?: Where<any>, options?: Options): Promise<Count>;

  upsertWith(data: DataObject<E>, where: Where<any>): Promise<E | null>;
  replaceById(id: IdType, data: DataObject<E>, options?: Options): Promise<void>;
}

export interface ITzRepository<E extends BaseTzEntity> extends IPersistableRepository<E> {
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

export interface ICrudService<E extends BaseTzEntity> extends IService {
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
