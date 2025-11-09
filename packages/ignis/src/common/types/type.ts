import { IApplicationConfig } from '@/base/applications/types';
import type { BaseEntity, TBaseIdEntity, TBaseTzEntity } from '@/base/models';
import type { AbstractTzRepository } from '@/base/repositories';
import type { Context as HonoContext } from 'hono';
import { AnyObject, IdType, ValueOrPromise } from './basic';

// ----------------------------------------------------------------------------------------------------------------------------------------
// Domain Types
// ----------------------------------------------------------------------------------------------------------------------------------------
export type TRelationType = 'belongsTo' | 'hasOne' | 'hasMany' | 'hasManyThrough';

export type TBullQueueRole = 'queue' | 'worker';

export type TPermissionEffect = 'allow' | 'deny';

// ----------------------------------------------------------------------------------------------------------------------------------------
// Application Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IApplication {
  initialize(): ValueOrPromise<void>;

  staticConfigure(): void;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;

  getProjectConfigs(): IApplicationConfig;
  getProjectRoot(): string;
  getServerHost(): string;
  getServerPort(): number;
  getServerAddress(): string;

  start(): ValueOrPromise<void>;
  stop(): ValueOrPromise<void>;
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
export interface IFilter<T = any> {
  where?: TWhere<T>;
  fields?: TFields<T>;
  include?: IInclusion[];
  order?: string | string[];
  limit?: number;
  offset?: number;
  skip?: number;
}

export type TWhere<T = any> = {
  [key in keyof T]: any;
} & {
  and?: TWhere<T>[];
  or?: TWhere<T>[];
};

export type TFields<T = any> = {
  [K in keyof T]?: boolean;
};

export interface IInclusion {
  relation: string;
  scope?: IFilter;
}

export interface ICount {
  count: number;
}

export type DataObject<T> = Partial<T>;

export interface IRepository {}

export interface IPersistableRepository<E extends TBaseIdEntity> extends IRepository {
  findOne(filter?: IFilter<E>, options?: AnyObject): Promise<E | null>;

  existsWith(where?: TWhere<any>, options?: AnyObject): Promise<boolean>;

  create(data: DataObject<E>, options?: AnyObject): Promise<E>;
  createAll(datum: DataObject<E>[], options?: AnyObject): Promise<E[]>;
  createWithReturn(data: DataObject<E>, options?: AnyObject): Promise<E>;

  updateById(id: IdType, data: DataObject<E>, options?: AnyObject): Promise<void>;
  updateWithReturn(id: IdType, data: DataObject<E>, options?: AnyObject): Promise<E>;
  updateAll(data: DataObject<E>, where?: TWhere<any>, options?: AnyObject): Promise<ICount>;

  upsertWith(data: DataObject<E>, where: TWhere<any>, options?: AnyObject): Promise<E | null>;
  replaceById(id: IdType, data: DataObject<E>, options?: AnyObject): Promise<void>;
}

export interface ITzRepository<E extends TBaseTzEntity> extends IPersistableRepository<E> {
  mixTimestamp(entity: DataObject<E>, options?: { newInstance: boolean }): DataObject<E>;
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

  requestContext: HonoContext;

  [extra: symbol | string]: any;
}

export interface ICrudService<E extends TBaseTzEntity> extends IService {
  repository: AbstractTzRepository<E, EntityRelationType>;

  // Read
  find(filter: IFilter<E>, options: ICrudMethodOptions): Promise<Array<E & EntityRelationType>>;
  findById(
    id: IdType,
    filter: IFilter<E>,
    options: ICrudMethodOptions,
  ): Promise<E & EntityRelationType>;
  findOne(
    filter: IFilter<E>,
    options: ICrudMethodOptions,
  ): Promise<(E & EntityRelationType) | null>;
  count(where: TWhere<E>, options: ICrudMethodOptions): Promise<ICount>;

  // Create, Update, Delete
  create(data: Omit<E, 'id'>, options: ICrudMethodOptions): Promise<E>;
  updateAll(data: Partial<E>, where: TWhere<E>, options: ICrudMethodOptions): Promise<ICount>;
  updateWithReturn(id: IdType, data: Partial<E>, options: ICrudMethodOptions): Promise<E>;
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

// ----------------------------------------------------------------------------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IProvider<T> {
  value(): ValueOrPromise<T>;
}
