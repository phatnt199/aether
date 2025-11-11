import { BaseApplication } from '@/base';
import { BaseComponent } from '@/base/components';
import { ValueOrPromise } from '@/common';
import { CoreBindings } from '@/common/bindings';
import { inject } from '@/helpers/inversion/decorators';
import { Hono } from 'hono';
import { HealthBindingKeys } from './common';
import { Binding } from '@/helpers/inversion';

interface IHealthCheckOptions {
  restOptions: {
    path: string;
  };
}

export class HealthComponent extends BaseComponent {
  private route: Hono;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: HealthComponent.name });

    this.bindings = {
      [HealthBindingKeys.HEALTH_OPTIONS]: Binding.bind<IHealthCheckOptions>({
        key: HealthBindingKeys.HEALTH_OPTIONS,
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
      key: HealthBindingKeys.HEALTH_OPTIONS,
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
