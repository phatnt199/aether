import { Container, inject } from '@venizia/ignis-inversion';
import omit from 'lodash/omit';
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
  QueryFunctionContext,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from 'ra-core';

import { DefaultNetworkRequestService } from '@/base/services';
import {
  AnyType,
  CoreBindings,
  ICustomParams,
  IDataProvider,
  IRestDataProviderOptions,
  ISendParams,
  ISendResponse,
  RequestMethods,
  RequestTypes,
  TRequestMethod,
  TRequestType,
} from '@/common';
import { getError } from '@/utilities';
import { BaseProvider } from './base.provider';

export class DefaultRestDataProvider<TResource extends string = string> extends BaseProvider<
  IDataProvider<TResource>
> {
  protected networkService: DefaultNetworkRequestService;

  constructor(
    @inject({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
    protected restDataProviderOptions: IRestDataProviderOptions,
  ) {
    super({ scope: DefaultRestDataProvider.name });

    this.networkService = new DefaultNetworkRequestService({
      name: 'default-application-network-service',
      baseUrl: this.restDataProviderOptions.url,
      noAuthPaths: this.restDataProviderOptions.noAuthPaths,
      headers: this.restDataProviderOptions.headers,
    });
  }

  //---------------------------------------------------------------------------
  getNetworkService() {
    return this.networkService;
  }

  //---------------------------------------------------------------------------
  getListHelper<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    type: TRequestType;
    queryKey: Record<string, AnyType>;
    filter: Record<string, AnyType>;
    requestProps: { headers?: HeadersInit; body?: AnyType; method: TRequestMethod };
  }) {
    const { type, resource, queryKey, filter, requestProps } = opts;

    const paths = [resource];
    const response = this.networkService.doRequest<RecordType[]>({
      type,
      paths,
      query: { ...queryKey, filter },
      ...requestProps,
    });

    return response;
  }

  // -------------------------------------------------------------
  // GET_LIST
  // -------------------------------------------------------------
  getList<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: GetListParams & QueryFunctionContext & ICustomParams;
  }): Promise<GetListResult<RecordType>> {
    const { resource, params } = opts;
    const { pagination, sort, filter: filterGetList, meta, ...rest } = params;

    let filter: Record<string, AnyType> = {};

    if (filterGetList?.where) {
      filter = { ...filterGetList, where: filterGetList.where };
    } else {
      filter['where'] = {
        ...omit(filterGetList, ['include', 'params', 'noLimit', 'fields']),
      };
      filter['include'] = filterGetList?.include;
      filter['fields'] = filterGetList?.fields;
      filter['params'] = filterGetList?.params;
      filter['noLimit'] = filterGetList?.noLimit;
    }

    if (sort?.field) {
      filter['order'] = [`${sort.field} ${sort.order}`];
    }

    // Remove default limit and skip in react-admin
    if (filter?.noLimit) {
      filter['limit'] = undefined;
      filter['skip'] = undefined;
      filter['offset'] = undefined;
      filter['noLimit'] = undefined;
    } else {
      const { page = 0, perPage = 0 } = pagination ?? {};

      if (perPage >= 0) {
        filter['limit'] = perPage;
      }

      if (perPage > 0 && page >= 0) {
        filter['skip'] = (page - 1) * perPage;
        filter['offset'] = (page - 1) * perPage;
      }
    }

    for (const key in rest) {
      if (!params[key]) {
        continue;
      }
      filter[key] = params[key];
    }

    const queryKey: Record<string, AnyType> = {};

    if (filter?.params) {
      for (const key in filter.params) {
        queryKey[key] = filter.params[key];
      }
      filter['params'] = undefined;
    }

    if (meta) {
      for (const key in meta) {
        queryKey[key] = meta[key];
      }
    }

    const request = this.networkService.getRequestProps({ resource });

    const requestProps = {
      method: RequestMethods.GET as TRequestMethod,
      ...request,
    };

    const response = this.getListHelper<RecordType>({
      type: RequestTypes.GET_LIST,
      resource,
      queryKey,
      filter,
      requestProps,
    });

    return response;
  }

  // -------------------------------------------------------------
  // GET_ONE
  // -------------------------------------------------------------
  getOne<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: GetOneParams<RecordType> & QueryFunctionContext & ICustomParams;
  }): Promise<GetOneResult<RecordType>> {
    const { resource, params } = opts;

    const request = this.networkService.getRequestProps({ resource });
    const filter = params?.meta?.filter || {};
    const queryKey: Record<string, AnyType> = {};

    if (filter?.params) {
      for (const key in filter.params) {
        queryKey[key] = filter.params[key];
      }
    }

    const response = this.networkService.doRequest<RecordType>({
      type: RequestTypes.GET_ONE,
      method: RequestMethods.GET,
      query: { ...queryKey, filter: { ...omit(filter, 'params') } },
      paths: [resource, `${params.id}`],
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // GET_MANY
  // -------------------------------------------------------------
  getMany<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: GetManyParams<RecordType> & QueryFunctionContext & ICustomParams;
  }): Promise<GetManyResult<RecordType>> {
    const { resource, params } = opts;

    const request = this.networkService.getRequestProps({ resource });
    const filter = params?.meta?.filter || {};
    const queryKey: Record<string, AnyType> = {};

    if (filter?.params) {
      for (const key in filter.params) {
        queryKey[key] = filter.params[key];
      }
    }

    const response = this.networkService.doRequest<RecordType[]>({
      type: RequestTypes.GET_MANY,
      method: RequestMethods.GET,
      query: {
        ...queryKey,
        filter: {
          ...omit(filter, 'params'),
          where: { ...filter?.where, id: { inq: params.ids } },
        },
      },
      paths: [resource],
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // GET_MANY_REFERENCE
  // -------------------------------------------------------------
  getManyReference<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: GetManyReferenceParams & QueryFunctionContext & ICustomParams;
  }): Promise<GetManyReferenceResult<RecordType>> {
    const { resource, params } = opts;

    const { pagination, sort, filter: filterGetMany, meta, target, id, ...rest } = params;

    let filter: Record<string, AnyType> = {};

    if (filterGetMany?.where) {
      filter = { ...filterGetMany, where: { ...filterGetMany.where } };
    } else {
      filter['where'] = {
        ...omit(filterGetMany, ['include', 'params', 'noLimit', 'fields']),
      };
      filter['include'] = filterGetMany?.include;
      filter['fields'] = filterGetMany?.fields;
      filter['params'] = filterGetMany?.params;
      filter['noLimit'] = filterGetMany?.noLimit;
    }

    // Add target id to filter
    filter.where[target] = id;

    if (sort?.field) {
      filter['order'] = [`${sort.field} ${sort.order}`];
    }

    // Remove default limit and skip in react-admin
    if (filter?.noLimit) {
      filter['limit'] = undefined;
      filter['skip'] = undefined;
      filter['offset'] = undefined;
      filter['noLimit'] = undefined;
    } else {
      const { page = 0, perPage = 0 } = pagination;

      if (perPage >= 0) {
        filter['limit'] = perPage;
      }

      if (perPage > 0 && page >= 0) {
        filter['skip'] = (page - 1) * perPage;
        filter['offset'] = (page - 1) * perPage;
      }
    }

    for (const key in rest) {
      if (!params[key]) {
        continue;
      }
      filter[key] = params[key];
    }

    const queryKey: Record<string, AnyType> = {};

    if (filter?.params) {
      for (const key in filter.params) {
        queryKey[key] = filter.params[key];
      }
      filter['params'] = undefined;
    }

    if (meta) {
      for (const key in meta) {
        queryKey[key] = meta[key];
      }
    }

    const request = this.networkService.getRequestProps({ resource });

    const requestProps = {
      method: RequestMethods.GET as TRequestMethod,
      ...request,
    };

    const response = this.getListHelper<RecordType>({
      type: RequestTypes.GET_MANY_REFERENCE,
      resource,
      queryKey,
      filter,
      requestProps,
    });

    return response;
  }

  // -------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------
  update<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: UpdateParams;
  }): Promise<UpdateResult<RecordType>> {
    const { resource, params } = opts;

    const request = this.networkService.getRequestProps({
      resource,
      body: params.data,
    });

    const response = this.networkService.doRequest<RecordType>({
      type: RequestTypes.UPDATE,
      method: RequestMethods.PATCH,
      paths: [resource, `${params.id}`],
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // UPDATE_MANY
  // -------------------------------------------------------------
  updateMany<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: UpdateManyParams;
  }): Promise<UpdateManyResult<RecordType>> {
    const { resource, params } = opts;
    const { ids, data } = params;

    if (!ids.length) {
      throw getError({ message: '[updateMany] No IDs to execute update!' });
    }

    const request = this.networkService.getRequestProps({ resource, body: data });

    const response = this.networkService.doRequest<RecordType['id'][]>({
      type: RequestTypes.UPDATE_MANY,
      method: RequestMethods.PATCH,
      paths: [resource],
      query: { filter: { where: { id: { inq: ids } } } },
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------
  create<
    RecordType extends Omit<RaRecord, 'id'> = AnyType,
    ResultRecordType extends RaRecord = RecordType & { id: Identifier },
  >(opts: { resource: TResource; params: CreateParams }): Promise<CreateResult<ResultRecordType>> {
    const { resource, params } = opts;

    const request = this.networkService.getRequestProps({ resource, body: params.data });

    const response = this.networkService.doRequest<ResultRecordType>({
      type: RequestTypes.CREATE,
      method: RequestMethods.POST,
      paths: [resource],
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------
  delete<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: DeleteParams<RecordType>;
  }): Promise<DeleteResult<RecordType>> {
    const { resource, params } = opts;

    const request = this.networkService.getRequestProps({ resource });

    const response = this.networkService.doRequest<RecordType>({
      type: RequestTypes.DELETE,
      method: RequestMethods.DELETE,
      paths: [resource, `${params.id}`],
      ...request,
    });

    return response;
  }

  // -------------------------------------------------------------
  // DELETE_MANY
  // -------------------------------------------------------------
  deleteMany<RecordType extends RaRecord = AnyType>(opts: {
    resource: TResource;
    params: DeleteManyParams<RecordType>;
  }): Promise<DeleteManyResult<RecordType>> {
    const { resource, params } = opts;

    const { ids } = params;

    if (!ids.length) {
      throw getError({ message: '[deleteMany] No IDs to execute delete!' });
    }

    const request = this.networkService.getRequestProps({ resource });

    const rs = Promise.all(
      ids
        .map(id => [resource, `${id}`])
        .map(paths => {
          return this.networkService.doRequest<RecordType['id']>({
            type: RequestTypes.DELETE_MANY,
            method: RequestMethods.DELETE,
            paths,
            ...request,
          });
        }),
    ).then(responses => {
      return {
        data: responses.map(response => response.data),
      };
    });

    return rs;
  }

  // -------------------------------------------------------------
  // SEND
  // -------------------------------------------------------------
  send<ReturnType = AnyType>(opts: {
    resource: TResource;
    params: ISendParams;
  }): Promise<ISendResponse<ReturnType>> {
    const { resource, params } = opts;

    if (!params?.method) {
      throw getError({
        message: '[send] Invalid http method to send request!',
      });
    }

    const { method, query, ...rest } = params;

    const request = this.networkService.getRequestProps({ ...rest, resource });

    const response = this.networkService.doRequest<ReturnType>({
      type: RequestTypes.SEND,
      method,
      query,
      paths: [resource],
      ...request,
    });

    return response;
  }

  override value(_container: Container): IDataProvider<TResource> {
    return {
      getList: (resource, params) => {
        return this.getList({ resource, params });
      },
      getOne: (resource, params) => {
        return this.getOne({ resource, params });
      },
      getMany: (resource, params) => {
        return this.getMany({ resource, params });
      },
      getManyReference: (resource, params) => {
        return this.getManyReference({ resource, params });
      },
      create: (resource, params) => {
        return this.create({ resource, params });
      },
      update: (resource, params) => {
        return this.update({ resource, params });
      },
      updateMany: (resource, params) => {
        return this.updateMany({ resource, params });
      },
      delete: (resource, params) => {
        return this.delete({ resource, params });
      },
      deleteMany: (resource, params) => {
        return this.deleteMany({ resource, params });
      },
      send: (opts: { resource: TResource; params: ISendParams }) => {
        return this.send(opts);
      },
      getNetworkService: () => {
        return this.getNetworkService();
      },
    };
  }
}
