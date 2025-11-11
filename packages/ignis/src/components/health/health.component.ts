import { BaseApplication } from '@/base';
import { BaseComponent } from '@/base/components';
import { ValueOrPromise } from '@/common';
import { CoreBindings } from '@/common/bindings';
import { inject } from '@/helpers/inversion/decorators';
import { Hono } from 'hono';

export class HealthComponent extends BaseComponent {
  private route: Hono;

  constructor(
    @inject({ key: CoreBindings.APPLICATION_INSTANCE }) private application: BaseApplication,
  ) {
    super({ scope: HealthComponent.name });
    this.route = new Hono({ strict: true });
  }

  override binding(): ValueOrPromise<void> {
    this.route.get('/', async context => {
      return context.json({ status: 'ok' });
    });

    const applicationRoute = this.application.getServer();
    applicationRoute.route('/health', this.route);
  }
}
