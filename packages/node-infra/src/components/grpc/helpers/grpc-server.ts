import { AnyObject, TInjectionGetter } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError } from '@/utilities';
import { Binding, ControllerClass, CoreBindings, MetadataInspector } from '@loopback/core';
import {
  GrpcServerKeys,
  GrpcTags,
  IGrpcMethodOptions,
  IGrpcServerOptions,
  METADATA_GRPC_METHOD,
} from '../common';

import * as grpc from '@grpc/grpc-js';
import * as grpcLoader from '@grpc/proto-loader';
import get from 'lodash/get';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export class GrpcServer extends grpc.Server {
  private identifier: string;
  private logger: ApplicationLogger;

  private address: string | number;
  private credentials: grpc.ServerCredentials;

  private injectionGetter: TInjectionGetter;

  // ---------------------------------------------------------------------
  constructor(opts: {
    identifier: string;
    address: string | number;
    credentials: grpc.ServerCredentials;
    options?: grpc.ServerOptions;
    injectionGetter: TInjectionGetter;
  }) {
    const { identifier, address, credentials, options = {}, injectionGetter } = opts;
    super(options);

    this.identifier = identifier;
    this.address = address;
    this.credentials = credentials;
    this.injectionGetter = injectionGetter;

    this.logger = LoggerFactory.getLogger([this.identifier]);
    this.logger.info(' Initializing GrpcServer | Options: %j', options);

    this.bindingServices();
  }

  // ---------------------------------------------------------------------
  override start() {
    if (!this.address) {
      throw getError({
        message: '[GrpcServer][start] Invalid start up server address!',
      });
    }

    this.bindAsync(`${this.address}`, this.credentials, (error, port) => {
      if (error) {
        this.logger.error('[defineServer] Failed to init grpc server | Error: %s', error);
        return;
      }

      this.logger.info('[defineServer] Successfully binding grpc server | Port: %s', port);
    });
  }

  // ---------------------------------------------------------------------
  private setupHandler<T>(opts: {
    controller: Readonly<Binding<ControllerClass>>;
    method: string;
  }) {
    const { controller, method } = opts;

    return (call: { request: AnyObject }, next: (error: Error | null, rs?: T) => void) => {
      const instance = this.injectionGetter<
        ControllerClass & { [method: string | symbol]: Function }
      >(`controllers.${controller.valueConstructor?.name}`);

      if (!instance?.[method]) {
        throw getError({
          message: `[setupHandler] Invalid implementation instance method | Controller: ${controller?.valueConstructor?.name} | method: ${method}`,
        });
      }

      Promise.resolve(instance?.[method]?.(call.request))
        .then(rs => {
          next(null, rs);
        })
        .catch(next);
    };
  }

  // ---------------------------------------------------------------------
  private loadService(opts: { service: string; protoFile: string }) {
    const { service, protoFile } = opts;
    const grpcOptions = this.injectionGetter<IGrpcServerOptions>(GrpcServerKeys.GRPC_OPTIONS);
    const { protoFolder } = grpcOptions;

    const protoPath = join(protoFolder, protoFile);
    const isProtoFileExisted = existsSync(protoPath);
    if (!isProtoFileExisted) {
      this.logger.error(
        '[bindingService] Proto file not found | protoFolder: %s | protoFile: %s',
        protoFolder,
        protoFile,
      );
      return null;
    }

    const packageDef = grpcLoader.loadSync(protoPath);
    const proto = grpc.loadPackageDefinition(packageDef);

    const serviceConstructor = get(proto, service) as grpc.ServiceClientConstructor;
    return serviceConstructor.service;
  }

  // ---------------------------------------------------------------------
  private bindingService(opts: { controller: Readonly<Binding<ControllerClass>> }) {
    const t = performance.now();
    const { controller } = opts;
    this.logger.info(
      '[bindingService] Controller: %s | START binding grpc service',
      controller?.valueConstructor?.name,
    );

    const methodDescriptors = MetadataInspector.getAllMethodMetadata<IGrpcMethodOptions>(
      METADATA_GRPC_METHOD,
      controller.valueConstructor?.prototype,
    );

    if (!methodDescriptors) {
      this.logger.error(
        '[bindingService] Controller: %s | Invalid method method descriptor map',
        controller?.valueConstructor?.name,
      );
      return;
    }

    const services: Record<
      string,
      {
        serviceDef: grpc.ServiceDefinition;
        methods: grpc.UntypedServiceImplementation;
      }
    > = {};

    for (const methodName in methodDescriptors) {
      const methodDescriptor = get(methodDescriptors, methodName);
      if (!methodDescriptor) {
        this.logger.error(
          '[bindingService] Controller: %s | method: %s | Skip binding service | Invalid method method descriptor',
          controller?.valueConstructor?.name,
          methodName,
        );
        continue;
      }

      this.logger.info('[bindingService] Method descriptor: %j', methodDescriptor);
      const { proto: protoFile, service, method = methodName } = methodDescriptor;

      const serviceDef = this.loadService({ service, protoFile });
      if (!serviceDef) {
        this.logger.error(
          '[bindingService] Service: %s | protoFile: %s | Skip binding service | Invalid service definition',
          service,
          protoFile,
        );
        continue;
      }

      if (!services[service]) {
        services[service] = { serviceDef, methods: {} };
      }

      services[service].methods[method] = this.setupHandler({
        controller,
        method,
      });
    }

    for (const name in services) {
      const { serviceDef, methods } = services[name];
      this.addService(serviceDef, methods);
      this.logger.info('[bindingService] serviceName: %s | Successfully add grpc service!', name);
    }

    this.logger.info(
      '[bindingService] Controller: %s | DONE binding grpc service | Took: %d(ms)',
      controller?.valueConstructor?.name,
      performance.now() - t,
      // performance.n({ from: t, digit: 8 }),
    );
  }

  // ---------------------------------------------------------------------
  private bindingServices() {
    const application = this.injectionGetter(CoreBindings.APPLICATION_INSTANCE);
    const controllers = application.findByTag(GrpcTags.CONTROLLERS);
    this.logger.info('[bindingServices][controllers] Controllers: %j', controllers);

    for (const controller of controllers) {
      this.bindingService({ controller });
    }
  }
}
