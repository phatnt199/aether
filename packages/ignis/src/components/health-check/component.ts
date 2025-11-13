import { BaseApplication } from '@/base/applications';
import { BaseComponent } from '@/base/components';
import { CoreBindings } from '@/common/bindings';
import { ValueOrPromise } from '@/common/types';
import { Binding } from '@/helpers/inversion';
import { inject } from '@/helpers/inversion/decorators';
import { Hono } from 'hono';
import { HealthCheckBindingKeys } from './keys';
import { IHealthCheckOptions } from './types';

export class HealthCheckComponent extends BaseComponent {
  private route: Hono;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: HealthCheckComponent.name });

    this.bindings = {
      [HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS]: Binding.bind<IHealthCheckOptions>({
        key: HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS,
      }).toValue({
        restOptions: {
          path: '/health',
        },
      }),
    };

    this.route = new Hono({ strict: true });
  }

  override binding(): ValueOrPromise<void> {
    const healthOptions = this.application.get<IHealthCheckOptions>({
      key: HealthCheckBindingKeys.HEALTH_CHECK_OPTIONS,
      optional: true,
    }) ?? {
      restOptions: { path: '/health' },
    };

    this.route.get('/', async context => {
      return context.json({ status: 'ok' });
    });

    const applicationRoute = this.application.getServer();
    applicationRoute.route(healthOptions.restOptions.path, this.route);
  }
}
