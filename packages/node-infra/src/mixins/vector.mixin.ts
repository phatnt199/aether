import { getError, int } from '@/utilities';
import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const VectorMixin = <
  E extends MixinTarget<Entity>,
  EmbeddingType = Array<number>,
  MetadataType = any,
  DetailType = any,
>(
  superClass: E,
  options: {
    uuid?: { columnName: string };
    embedding: {
      columnName?: string;
      vectorType?: 'string';
      vectorSize: number;
    };
  },
) => {
  const { uuid, embedding } = options;

  const vectorType = embedding?.vectorType ?? 'vector';

  if (!embedding?.vectorSize) {
    throw getError({
      message: `[VectorMixin] Invalid vector size | class: ${superClass.name} | vectorSize: ${embedding?.vectorSize}`,
    });
  }

  class Mixed extends superClass {
    @property({
      type: 'string',
      required: true,
      defaultFn: 'uuidv4',
      postgresql: {
        columnName: uuid?.columnName ?? 'uuid',
        dataType: 'text',
      },
    })
    uuid: string;

    @property({
      type: 'any',
      postgresql: {
        columnName: embedding?.columnName ?? 'embedding',
        dataType: `${vectorType}(${int(embedding.vectorSize)})`,
      },
    })
    embedding?: EmbeddingType;

    @property({
      type: 'object',
      postgresql: {
        columnName: 'metadata',
        dataType: 'jsonb',
      },
    })
    metadata?: MetadataType;

    @property({
      type: 'object',
      postgresql: {
        columnName: 'details',
        dataType: 'jsonb',
      },
    })
    details?: DetailType;
  }

  return Mixed;
};
