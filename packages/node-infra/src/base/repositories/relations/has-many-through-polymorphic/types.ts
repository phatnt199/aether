import { HasManyDefinition } from '@loopback/repository';

export type THasManyThroughPolymorphic = {
  discriminator: string | { typeField: string; idField: string };
};

export interface IHasManyThroughPolymorphicDefinition extends HasManyDefinition {
  polymorphic: THasManyThroughPolymorphic;
}
