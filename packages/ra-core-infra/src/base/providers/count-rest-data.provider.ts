import { RaRecord } from 'ra-core';

import { AnyType, RequestTypes, TRequestMethod, TRequestType } from '@/common';
import { DefaultRestDataProvider } from './default-rest-data.provider';

export class CountRestDataProvider<
  TResource extends string = string,
> extends DefaultRestDataProvider<TResource> {
  //---------------------------------------------------------------------------
  override getListHelper<RecordType extends RaRecord = AnyType>(opts: {
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

    const responseCount = this.networkService.doRequest({
      type: RequestTypes.SEND,
      paths: [resource, 'count'],
      query: { ...queryKey, where: filter?.where },
      ...requestProps,
    });

    const responseAll = Promise.all([response, responseCount]).then(
      (responses: AnyType[]) => {
        return {
          data: responses?.[0]?.data,
          total: responses?.[1]?.data?.count || 0,
        };
      },
    );

    return responseAll;
  }
}
