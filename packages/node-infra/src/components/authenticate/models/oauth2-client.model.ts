import { BaseNumberTzEntity } from '@/base/models';
import { NumberIdType } from '@/common';
import { model, property } from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      schema: 'open_auth',
      table: 'OAuth2Client',
    },
    hiddenProperties: ['createdAt', 'modifiedAt', 'clientSecret'],
  },
})
export class OAuth2Client extends BaseNumberTzEntity {
  @property({
    type: 'string',
    postgresql: { columnName: 'provider' },
  })
  provider: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'identifier' },
  })
  identifier: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'client_id' },
  })
  clientId: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'name' },
  })
  name: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'description' },
  })
  description: string;

  @property({
    type: 'string',
    postgresql: { columnName: 'client_secret' },
  })
  clientSecret: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
    /* jsonSchema: {
      enum: ['authorization_code'],
    }, */
    postgresql: { columnName: 'grants', dataType: 'jsonb' },
  })
  grants: Array<string>; // ['authorization_code']

  @property({
    type: 'object',
    jsonSchema: {
      properties: {
        rootUrl: { type: 'string' },
        homeUrl: { type: 'string' },
        redirectUrls: { type: 'array', items: { type: 'string' } },
        callbackUrls: { type: 'array', items: { type: 'string' } },
        originUrls: { type: 'array', items: { type: 'string' } },
      },
    },
    postgresql: { columnName: 'endpoints', dataType: 'jsonb' },
  })
  endpoints: {
    rootUrl: string;
    homeUrl: string;
    redirectUrls: Array<string>;
    callbackUrls: Array<string>;
    originUrls: Array<string>;
  };

  @property({
    type: 'number',
    postgresql: { columnName: 'user_id', dataType: 'integer' },
  })
  userId?: NumberIdType;

  constructor(data?: Partial<OAuth2Client>) {
    super(data);
  }
}
