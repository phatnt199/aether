import { ClassDecoratorFactory, MethodDecoratorFactory } from '@loopback/core';
import {
  IGrpcControllerOptions,
  IGrpcMethodOptions,
  METADATA_GRPC_CONTROLLER,
  METADATA_GRPC_METHOD,
} from '../common';

export const grpcController = (opts?: IGrpcControllerOptions) => {
  return ClassDecoratorFactory.createDecorator(METADATA_GRPC_CONTROLLER, opts);
};

export const grpcMethod = (opts: IGrpcMethodOptions) => {
  return MethodDecoratorFactory.createDecorator(METADATA_GRPC_METHOD, opts);
};
