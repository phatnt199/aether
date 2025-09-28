import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { IGrpcController } from '../common';
import { grpcController } from '../decorators';

abstract class AbstractGrpcController implements IGrpcController {
  protected logger: ApplicationLogger;

  constructor(opts: { scope: string }) {
    const { scope } = opts;
    this.logger = LoggerFactory.getLogger([scope]);
  }
}

@grpcController()
export class BaseGrpcController extends AbstractGrpcController {
  constructor(opts: { scope: string }) {
    super(opts);
  }
}
