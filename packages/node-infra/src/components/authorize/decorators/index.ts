import { MetadataInspector, MethodDecoratorFactory } from '@loopback/metadata';

export class MetadataDecoratorKeys {
  static readonly PERMISSION = 'metadata-key-for-permission-decorator';
}

export interface IPermissionDecorator {
  idx: number;
}

// Read more: https://loopback.io/doc/en/lb4/Creating-decorators.html#inspect-metadata-of-a-property
/**
 * @example
 * ```typescript
 * class MyController {
 *   @permission({ idx: 1, allowedRoles: ['admin'], deniedRoles: ['guest'] })
 *   myMethod() {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function permission(spec: IPermissionDecorator): MethodDecorator {
  return MethodDecoratorFactory.createDecorator<IPermissionDecorator>(
    MetadataDecoratorKeys.PERMISSION,
    spec,
  );
}

// Read more: https://loopback.io/doc/en/lb4/Creating-decorators.html#to-create-a-decorator-that-can-be-used-multiple-times-on-a-single-method
export const getDecoratorData = (controllerPrototype: object, keyTargetDecorator: string) => {
  return MetadataInspector.getAllPropertyMetadata<any>(keyTargetDecorator, controllerPrototype);
};
