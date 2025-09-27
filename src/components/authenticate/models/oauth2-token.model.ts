import { BaseTzEntity } from '@/base/models';
import { AnyObject, IdType, OAuth2TokenStatuses } from '@/common';
import { belongsTo, model, property } from '@loopback/repository';
import { OAuth2Client } from './oauth2-client.model';

@model({
  settings: {
    postgresql: {
      schema: 'open_auth',
      table: 'OAuth2Token',
    },
    hiddenProperties: ['createdAt', 'modifiedAt'],
  },
})
export class OAuth2Token extends BaseTzEntity {
  @property({
    type: 'string',
  })
  token: string;

  @property({
    type: 'string',
  })
  type: string;

  @property({
    type: 'string',
    default: OAuth2TokenStatuses.UNKNOWN,
  })
  status: string;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
    postgresql: {
      columnName: 'scopes',
      dataType: 'jsonb',
    },
  })
  scopes: Array<string>;

  @belongsTo(
    () => OAuth2Client,
    { keyFrom: 'clientId' },
    { postgresql: { columnName: 'client_id', dataType: 'integer' } },
  )
  clientId: IdType;

  @property({
    type: 'number',
    postgresql: { columnName: 'user_id', dataType: 'integer' },
  })
  userId: IdType;

  @property({
    type: 'object',
    postgresql: {
      columnName: 'details',
      dataType: 'jsonb',
    },
  })
  details?: AnyObject;

  constructor(data?: Partial<OAuth2Token>) {
    super(data);
  }
}
