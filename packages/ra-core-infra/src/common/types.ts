import { Filter, Where } from '@loopback/filter';
import { TClass } from '@venizia/ignis-inversion';
import {
  CreateParams,
  CreateResult,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  Identifier,
  Locale,
  QueryFunctionContext,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
  UserIdentity,
} from 'ra-core';

import { DefaultNetworkRequestService } from '@/base';
import { Environments, RequestBodyTypes, RequestMethods, RequestTypes } from './constants';

//-----------------------------------------------------------
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

//-----------------------------------------------------------
export type EntityRelationType = {};

//-----------------------------------------------------------
export type TRequestMethod = TStatusFromClass<typeof RequestMethods>;
export type TEnvironment = TStatusFromClass<typeof Environments>;

//-----------------------------------------------------------
export interface IRequestProps {
  headers?: { [key: string]: string | number };
  body?: any;
  query?: any;
}

export interface ISendParams {
  id?: string | number;
  method?: TRequestMethod;
  bodyType?: TRequestBodyType;
  body?: any;
  file?: any;
  query?: { [key: string]: any };
  headers?: { [key: string]: string | number };
  [key: string]: any;
}

export interface ISendResponse<T = AnyType> {
  data: T;
  [key: string]: any;
}

export type TRequestBodyType = Extract<ValueOf<typeof RequestBodyTypes>, string>;
export type TRequestType = Extract<ValueOf<typeof RequestTypes>, string>;

export interface IGetRequestPropsParams {
  resource: string;
  body?: any;
  bodyType?: TRequestBodyType;
}

export interface IGetRequestPropsResult {
  headers?: HeadersInit;
  body?: any;
}

export interface ICustomParams {
  params?: Record<string, AnyType>;
  [key: string]: AnyType;
}

export interface IReactAdminDataProvider<TResource extends string = string> {
  getList: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: GetListParams & QueryFunctionContext & ICustomParams,
  ) => Promise<GetListResult<RecordType>>;

  getOne: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: GetOneParams<RecordType> & QueryFunctionContext & ICustomParams,
  ) => Promise<GetOneResult<RecordType>>;

  getMany: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: GetManyParams<RecordType> & QueryFunctionContext & ICustomParams,
  ) => Promise<GetManyResult<RecordType>>;

  getManyReference: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: GetManyReferenceParams & QueryFunctionContext & ICustomParams,
  ) => Promise<GetManyReferenceResult<RecordType>>;

  update: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: UpdateParams,
  ) => Promise<UpdateResult<RecordType>>;

  updateMany: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: UpdateManyParams,
  ) => Promise<UpdateManyResult<RecordType>>;

  create: <
    RecordType extends Omit<RaRecord, 'id'> = AnyType,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(
    resource: TResource,
    params: CreateParams,
  ) => Promise<CreateResult<ResultRecordType>>;

  delete: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: DeleteParams<RecordType>,
  ) => Promise<DeleteResult<RecordType>>;

  deleteMany: <RecordType extends RaRecord = AnyType>(
    resource: TResource,
    params: DeleteManyParams<RecordType>,
  ) => Promise<DeleteManyResult<RecordType>>;
}

export interface IDataProvider<TResource extends string = string>
  extends IReactAdminDataProvider<TResource> {
  send: <ReturnType = AnyType>(opts: {
    resource: TResource;
    params: ISendParams;
  }) => Promise<ISendResponse<ReturnType>>;

  getNetworkService(): DefaultNetworkRequestService;
}

export interface IReactAdminAuthProvider {
  login: (params: AnyType) => Promise<{ redirectTo?: string | boolean } | void | any>;
  logout: (params: AnyType) => Promise<void | false | string>;
  checkAuth: (params: AnyType & QueryFunctionContext) => Promise<void>;
  checkError: (error: AnyType) => Promise<void>;
  getIdentity?: (params?: QueryFunctionContext) => Promise<UserIdentity>;
  getPermissions: (params: AnyType & QueryFunctionContext) => Promise<AnyType>;
}

export interface IAuthProvider extends IReactAdminAuthProvider {
  getRoles: (params?: AnyType) => Promise<Set<string>>;
}

// ----------------------------------------------------------------------
export interface IAuthProviderOptions {
  endpoints?: {
    afterLogin?: string;
  };
  paths?: {
    signIn?: string;
    signUp?: string;
    checkAuth?: string;
  };
}

// ----------------------------------------------------------------------
export interface IRestDataProviderOptions {
  url: string;
  noAuthPaths?: Array<string>;
  headers?: HeadersInit;
}

// ----------------------------------------------------------------------
export interface II18nProviderOptions {
  i18nSources?: Record<string | symbol, any>;
  listLanguages?: Locale[];
}

// ----------------------------------------------------------------------
export interface IService {}

// ----------------------------------------------------------------------
export interface ICrudService<E extends { id: IdType; [extra: string | symbol]: any } = any>
  extends IService {
  find(filter: Filter<E>): Promise<Array<E & EntityRelationType>>;
  findById(id: IdType, filter: Filter<E>): Promise<E & EntityRelationType>;
  findOne(filter: Filter<E>): Promise<(E & EntityRelationType) | null>;
  count(where: Where<E>): Promise<{ count: number }>;

  // CUD
  create(data: Omit<E, 'id'>): Promise<E>;
  updateAll(data: Partial<E>, where: Where<E>): Promise<{ count: number }>;
  updateById(id: IdType, data: Partial<E>): Promise<E>;
  replaceById(id: IdType, data: E): Promise<E>;
  deleteById(id: IdType): Promise<{ id: IdType }>;
}

// ----------------------------------------------------------------------
export interface ICoreRaApplication {
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;
  bindContext(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  injectable<T>(scope: string, value: TClass<T>, tags?: Array<string>): void;
  service<T>(value: TClass<T>): void;

  // ------------------------------------------------------------------------------
  start(): ValueOrPromise<void>;
}

// --------------------------------------------------
type TDeepPath = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// --------------------------------------------------
export type TPaths<T, DeepLevel extends number = 10> = DeepLevel extends 0
  ? never
  : T extends Array<AnyType>
    ? never
    : T extends object
      ? {
          [K in keyof T]-?: K extends string | number
            ? NonNullable<T[K]> extends Array<AnyType>
              ? `${K}`
              : NonNullable<T[K]> extends object
                ? `${K}` | `${K}.${TPaths<NonNullable<T[K]>, TDeepPath[DeepLevel]>}`
                : `${K}`
            : never;
        }[keyof T]
      : never;

// --------------------------------------------------
export type TFullPaths<T, DeepLevel extends number = 10> = DeepLevel extends never
  ? never
  : T extends Array<infer U>
    ? TFullPaths<U>
    : T extends object
      ? {
          [K in keyof T]-?: K extends string | number
            ? T[K] extends Array<any> | object
              ? `${K}.${TFullPaths<T[K], TDeepPath[DeepLevel]>}`
              : `${K}`
            : never;
        }[keyof T]
      : never;
