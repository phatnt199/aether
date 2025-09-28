import { MetadataInspector } from '@loopback/metadata';
import { getJsonSchema, jsonToSchemaObject, SchemaObject } from '@loopback/rest';

import { BaseEntity, BaseIdEntity } from '@/base/models/base.model';

// --------------------------------------------------------------------------------------------------------------
export const getIdSchema = <E extends BaseIdEntity>(
  entity: typeof BaseIdEntity & { prototype: E },
): SchemaObject => {
  const idProp = entity.getIdProperties()[0];
  const modelSchema = jsonToSchemaObject(getJsonSchema(entity)) as SchemaObject;
  return modelSchema.properties?.[idProp] as SchemaObject;
};

// --------------------------------------------------------------------------------------------------------------
export const getIdType = <E extends BaseEntity>(
  entity: typeof BaseEntity & { prototype: E },
): 'string' | 'number' => {
  let idType: 'string' | 'number' = 'number';

  try {
    const idMetadata = MetadataInspector.getPropertyMetadata<{ type: 'string' | 'number' }>(
      'loopback:model-properties',
      entity,
      'id',
    );

    idType = idMetadata?.type ?? 'number';
  } catch (e) {
    console.error(
      "[getIdType] Failed to inspect entity id type! Use 'number' by default | Error: ",
      e,
    );

    idType = 'number';
    return idType;
  }

  return idType;
};
