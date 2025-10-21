import { getError } from '@/utilities';
import { MixinTarget } from '@loopback/core';
import { Entity, property } from '@loopback/repository';

export const NumberIdMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  class Mixed extends superClass {
    @property({
      type: 'number',
      id: true,
      generated: true,
    })
    id: number;
  }

  return Mixed;
};

export const StringIdMixin = <E extends MixinTarget<Entity>>(superClass: E) => {
  class Mixed extends superClass {
    @property({
      type: 'string',
      id: true,
      defaultFn: 'uuidv4',
    })
    id?: string;
  }

  return Mixed;
};

export const IdMixin = <E extends MixinTarget<Entity>>(
  superClass: E,
  opts: {
    idType: 'string' | 'number';
  },
) => {
  switch (opts.idType) {
    case 'string': {
      return StringIdMixin(superClass);
    }
    case 'number': {
      return NumberIdMixin(superClass);
    }
    default: {
      throw getError({
        message: `[IdMixin] Invalid id type | type: ${opts.idType} | Valids: ['string', 'number']`,
      });
    }
  }
};
