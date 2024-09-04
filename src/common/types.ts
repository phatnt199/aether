import { BaseIdEntity, BaseTzEntity } from '@/base';
import { BindingKey } from '@loopback/core';
import { Count, DataObject, Entity, Filter, Options, Where } from '@loopback/repository';

export interface IApplication {
  models: Set<string>;
  staticConfigure(): void;
  getProjectRoot(): string;
  preConfigure(): void;
  postConfigure(): void;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IDataSource {
  name: string;
  config: object;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export type ClassType<T> = Function & { prototype: T };

export type EntityClassType<T extends Entity> = typeof Entity & {
  prototype: T & { id?: IdType };
};

export type EntityRelationType = {};

export type NumberIdType = number;
export type StringIdType = string;
export type IdType = string | number;

export type AnyType = any;
export type AnyObject = Record<string | symbol | number, any>;
export type ValueOrPromise<T> = T | Promise<T>;

export type NullableType = undefined | null | void;

export type TRelationType = 'belongsTo' | 'hasOne' | 'hasMany' | 'hasManyThrough';

export type TBullQueueRole = 'queue' | 'worker';

export type TPermissionEffect = 'allow' | 'deny';

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IEntity {
  id: IdType;
}

// ----------------------------------------------------------------------------------------------------------------------------------------
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
  mixUserAudit(entity: DataObject<E>, options?: { newInstance: boolean; authorId: IdType }): DataObject<E>;
  // mixTextSearch(entity: DataObject<E>, options?: { moreData: any; ignoreUpdate: boolean }): DataObject<E>;
}
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IDangerFilter extends Omit<Filter, 'order'> {
  // !DANGER this will not compatible with LB3
  order: string | string[];
}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IService {}

// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IController {}

export interface ICRUDController extends IController {
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
export interface IError<N extends number = number> extends Error {
  statusCode: N;
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
