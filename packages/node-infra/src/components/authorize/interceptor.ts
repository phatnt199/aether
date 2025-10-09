import {
  asGlobalInterceptor,
  BindingAddress,
  config,
  Context,
  injectable,
  Interceptor,
  InvocationContext,
  Next,
  NonVoid,
  Provider,
} from '@loopback/core';
import { SecurityBindings, UserProfile, securityId } from '@loopback/security';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationError,
  AuthorizationOptions,
  Authorizer,
  AuthorizationBindings,
  AuthorizationTags,
  getAuthorizationMetadata,
} from '@loopback/authorization';
import { ApplicationLogger, LoggerFactory } from '@/helpers';

async function loadAuthorizers(ctx: Context) {
  const authorizerFunctions: Authorizer[] = [];
  const bindings = ctx.findByTag<Authorizer>(AuthorizationTags.AUTHORIZER);
  const authorizers: (Authorizer | BindingAddress<Authorizer>)[] = bindings.map(b => b.key);

  for (const keyOrFn of authorizers) {
    if (typeof keyOrFn === 'function') {
      authorizerFunctions.push(keyOrFn);
      continue;
    }

    const fn = await ctx.get(keyOrFn);
    authorizerFunctions.push(fn);
  }

  return authorizerFunctions;
}

@injectable(asGlobalInterceptor('authorization'))
export class AuthorizateInterceptor implements Provider<Interceptor> {
  private options: AuthorizationOptions;
  private logger: ApplicationLogger;

  constructor(
    @config({ fromBinding: AuthorizationBindings.COMPONENT })
    options: AuthorizationOptions = {},
  ) {
    this.options = {
      defaultDecision: AuthorizationDecision.DENY,
      precedence: AuthorizationDecision.DENY,
      defaultStatusCodeForDeny: 403,
      ...options,
    };
    this.logger = LoggerFactory.getLogger([AuthorizateInterceptor.name]);
  }

  value(): Interceptor {
    return this.intercept.bind(this);
  }

  async intercept(invocationCtx: InvocationContext, next: Next): Promise<NonVoid> {
    let metadata = getAuthorizationMetadata(invocationCtx.target, invocationCtx.methodName);

    const description = invocationCtx.description;
    if (!metadata) {
      this.logger.debug('[intercept] No authorization metadata is found for %s', description);
    }

    metadata = metadata ?? this.options.defaultMetadata;
    if (!metadata || metadata?.skip) {
      this.logger.debug('[intercept] Authorization is skipped for %s', description);
      const result = await next();
      return result;
    }
    this.logger.debug('[intercept] Authorization metadata for %s', description);

    // retrieve it from authentication module
    const user = await invocationCtx.get<UserProfile>(SecurityBindings.USER, {
      optional: true,
    });
    this.logger.debug('[intercept] Current user: %s', user);

    const authorizationCtx: AuthorizationContext = {
      principals: user
        ? [
            {
              ...user,
              name: user.name ?? user[securityId],
              type: 'USER',
            },
          ]
        : [],
      roles: [],
      scopes: [],
      resource: invocationCtx.targetName,
      invocationContext: invocationCtx,
    };

    this.logger.debug('[intercept] Security context for %s', description);
    const authorizers = await loadAuthorizers(invocationCtx);

    let finalDecision = this.options.defaultDecision;
    for (const fn of authorizers) {
      const decision = await fn(authorizationCtx, metadata);
      this.logger.debug('[intercept] Decision: %s', decision);

      if (decision && decision !== AuthorizationDecision.ABSTAIN) {
        finalDecision = decision;
      }

      if (
        decision === AuthorizationDecision.DENY &&
        this.options.precedence === AuthorizationDecision.DENY
      ) {
        this.logger.debug('[intercept] Access denied');
        const error = new AuthorizationError('Access denied');
        error.statusCode = this.options.defaultStatusCodeForDeny;
        throw error;
      }

      if (
        decision === AuthorizationDecision.ALLOW &&
        this.options.precedence === AuthorizationDecision.ALLOW
      ) {
        this.logger.debug('[intercept] Access allowed');
        break;
      }
    }

    this.logger.debug('[intercept] Final decision: %s', finalDecision);
    if (finalDecision === AuthorizationDecision.DENY) {
      const error = new AuthorizationError('Access denied');
      error.statusCode = this.options.defaultStatusCodeForDeny;
      throw error;
    }

    return next();
  }
}
