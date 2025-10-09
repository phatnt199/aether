import { IController } from '@/common';
import { applicationLogger } from '@/helpers';
import { Constructor, MetadataMap } from '@loopback/core';
import union from 'lodash/union';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EnforcerDefinitions } from '../common';
import { getDecoratorData, IPermissionDecorator, MetadataDecoratorKeys } from '../decorators';
import { Permission } from '../models';
import { PermissionRepository } from '../repositories';

//---------------------------------------------------------------------------
export interface IPermission {
  code: string;
  subject: string;
  action: string;
  scope: string;
  name: string;
  parentId: number;
  pType: string;
  details?: IPermissionDecorator;
}

export class GeneratePermissionService {
  getMethodsClass(controllerPrototype: object) {
    return Reflect.ownKeys(controllerPrototype).slice(1) as string[];
  }

  getAllMethodsClass(controllerPrototype: object): string[] {
    let methods: string[] = [];
    let currentPrototype: object | null = controllerPrototype;

    while (currentPrototype && currentPrototype !== Object.prototype) {
      methods = [...methods, ...this.getMethodsClass(currentPrototype)];
      currentPrototype = Reflect.getPrototypeOf(currentPrototype);
    }

    return methods;
  }

  async generateParentPermissions(opts: {
    controller: Constructor<IController>;
    permissionRepository: PermissionRepository;
  }) {
    const { controller, permissionRepository } = opts ?? {};
    const controllerName = controller.name;
    const permissionSubject = controllerName.replace(/Controller/g, '')?.toLowerCase();

    const parentPermissions = {
      name: `All permissions of ${permissionSubject}`,
      code: `${permissionSubject}.*`,
      subject: permissionSubject,
      action: EnforcerDefinitions.ACTION_EXECUTE,
      pType: 'p',
    };

    await permissionRepository.upsertWith(
      { ...parentPermissions },
      { code: parentPermissions.code },
    );
  }

  generatePermissions(opts: {
    methods: string[];
    permissionSubject: string;
    parentId: number;
    allPermissionDecoratorData: MetadataMap<IPermissionDecorator>;
  }) {
    const { methods, permissionSubject, parentId, allPermissionDecoratorData } = opts ?? {};

    return methods.map(m => {
      return {
        name: `Permission ${m} ${permissionSubject}`,
        code: `${permissionSubject}.${m}`,
        subject: permissionSubject,
        action: EnforcerDefinitions.ACTION_EXECUTE,
        scope: m.match(/get|find|search|count/gim)
          ? EnforcerDefinitions.ACTION_READ
          : EnforcerDefinitions.ACTION_WRITE,
        pType: 'p',
        parentId,
        details: allPermissionDecoratorData?.[m],
      };
    }) as IPermission[];
  }

  generatePermissionBaseInherit(opts: {
    methodsParentsClass: string[];
    methodsChildClass: string[];
    parentPermission: Permission;
    allPermissionDecoratorData: MetadataMap<IPermissionDecorator>;
  }) {
    const { methodsChildClass, methodsParentsClass, parentPermission, allPermissionDecoratorData } =
      opts ?? {};

    const defaultPermissions = [
      'count',
      'create',
      'find',
      'findOne',
      'findById',
      'replaceById',
      'updateById',
      'deleteById',
      'updateAll',
    ];

    const permissions = this.generatePermissions({
      methods: union(defaultPermissions, methodsParentsClass, methodsChildClass),
      permissionSubject: parentPermission.subject,
      parentId: parentPermission.id,
      allPermissionDecoratorData,
    });

    return permissions;
  }

  generatePermissionRecords(opts: {
    controller: Constructor<IController>;
    parentPermission: Permission;
    permissionRepository: PermissionRepository;
    allPermissionDecoratorData: MetadataMap<IPermissionDecorator>;
  }) {
    const { controller, parentPermission, allPermissionDecoratorData } = opts;
    const permissionRecords: IPermission[] = [];
    const controllerPrototype = controller.prototype;
    const methodsChildClass = this.getMethodsClass(controllerPrototype);

    const parentClass = Reflect.getPrototypeOf(controllerPrototype) as object;
    const methodsParentsClass = this.getAllMethodsClass(parentClass);

    permissionRecords.push(
      ...this.generatePermissionBaseInherit({
        methodsParentsClass,
        methodsChildClass,
        parentPermission,
        allPermissionDecoratorData,
      }),
    );

    return permissionRecords;
  }

  async updatePermissionByChangeMethodName(
    permissionSubject: string,
    allPermissionDecoratorData: MetadataMap<IPermissionDecorator>,
    permissionRepository: PermissionRepository,
  ) {
    if (!Object.values(allPermissionDecoratorData).length) {
      return;
    }

    const allPermissionDecorators = Object.entries(allPermissionDecoratorData);

    for (const [key, value] of allPermissionDecorators) {
      const permissionsFound: Permission[] = await permissionRepository.find({
        where: {
          subject: permissionSubject,
          code: {
            neq: `${permissionSubject}.*`,
          },
        },
      });

      for (const p of permissionsFound) {
        if (!p?.details?.idx || p?.details?.idx !== value.idx) {
          continue;
        }

        await permissionRepository.updateById(p.id, {
          ...p,
          code: `${permissionSubject}.${key}`,
          details: { ...value },
        });
      }
    }
  }

  async startMigration(opts: {
    permissionRepository: PermissionRepository;
    controllers: Array<Constructor<IController>>;
  }) {
    const { permissionRepository, controllers } = opts;
    const permissions: IPermission[] = [];

    for (const controller of controllers) {
      const permissionSubject = controller.name.replace(/Controller/g, '').toLowerCase();
      const controllerPrototype = controller.prototype;

      applicationLogger.info(
        '[Migrate Permissions] Migration permissions for: %s',
        controller.name,
      );

      await this.generateParentPermissions({ controller, permissionRepository });

      const parentPermission = await permissionRepository.findOne({
        where: { subject: permissionSubject },
      });

      if (!parentPermission) {
        continue;
      }

      const allPermissionDecoratorData: MetadataMap<IPermissionDecorator> =
        getDecoratorData(controllerPrototype, MetadataDecoratorKeys.PERMISSION) ?? {};

      const permissionList = this.generatePermissionRecords({
        controller,
        parentPermission,
        permissionRepository,
        allPermissionDecoratorData,
      });

      await this.updatePermissionByChangeMethodName(
        permissionSubject,
        allPermissionDecoratorData,
        permissionRepository,
      );

      permissions.push(...permissionList);
    }

    for (const p of permissions) {
      await permissionRepository.upsertWith(p, { code: p.code });
    }
  }

  /**
   * Obtain all permission codes for a controller
   *
   * @returns {string[]} List of permission codes
   */
  getPermissionCodes(opts: { controllers: Array<Constructor<IController>> }): string[] {
    const { controllers } = opts;

    const permissionCodes: string[] = [];

    for (const controller of controllers) {
      const permissionSubject = controller.name.replace(/Controller/g, '').toLowerCase();

      permissionCodes.push(`${permissionSubject}.*`);

      const methods = this.getAllMethodsClass(controller.prototype);

      for (const method of methods) {
        permissionCodes.push(`${permissionSubject}.${method}`);
      }
    }

    applicationLogger.info('[getPermissionCodes] Permission codes: %o', permissionCodes);

    return permissionCodes;
  }

  /**
   * Write all permission codes for a list of controllers to a file
   *
   * @param outputPath - Path to write
   *
   * @example
   * const generatePermissionService = new GeneratePermissionService();
   *
   * generatePermissionService.getPermissionCodesAndWriteToFile({
   *    controllers: [XboxController, PSController, NintendoController],
   *    outputPath: './src/migrations/',
   *    fileName: 'permissionCodes',
   *    fileType: 'ts',
   * });
   */
  getPermissionCodesAndWriteToFile(opts: {
    controllers: Array<Constructor<IController>>;
    outputPath?: string;
    fileName?: string;
    fileType?: 'ts' | 'txt';
  }) {
    const {
      controllers,
      outputPath = './src/',
      fileName = 'permission-codes',
      fileType = 'ts',
    } = opts;

    const permissionCodes = this.getPermissionCodes({ controllers });

    if (permissionCodes.length === 0) {
      return;
    }

    const fileContent: string[] = [];

    if (fileType === 'ts') {
      fileContent.push('const permissionCodes: string[] = [');
    }

    fileContent.push(...permissionCodes.map(code => ` '${code}',`));

    if (fileType === 'ts') {
      fileContent.push(' ];');
    }

    const filePath = `${outputPath}/${fileName}.${fileType}`;

    writeFileSync(resolve(filePath), fileContent.join('\n'), 'utf8');
  }

  // async generatePermissionMapping(opts: {
  //   controllers: Array<Constructor<IController>>;
  //   permissionRepository: PermissionRepository;
  //   permissionMappingRepository: PermissionMappingRepository;
  // }) {}
}
