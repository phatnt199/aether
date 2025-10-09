import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError, int } from '@/utilities';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import { inject, Provider } from '@loopback/core';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';
import { AuthorizerKeys, EnforcerDefinitions } from './common';
import { EnforcerService } from './services';

export class AuthorizeProvider implements Provider<Authorizer> {
  private logger: ApplicationLogger;

  constructor(
    @inject(AuthorizerKeys.ENFORCER) private enforcerService: EnforcerService,
    @inject(AuthorizerKeys.ALWAYS_ALLOW_ROLES)
    private alwaysAllowRoles: string[],
    @inject(AuthorizerKeys.NORMALIZE_PAYLOAD_FN)
    private normalizePayloadFn: (opts: { subject: string; object: string; scope?: string }) => {
      subject: string;
      object: string;
      action: string;
    },
  ) {
    this.logger = LoggerFactory.getLogger([AuthorizeProvider.name]);
  }

  value(): Authorizer<AuthorizationMetadata> {
    return this.authorize.bind(this);
  }

  // -------------------------------------------------------------------------------------------------------------------
  normalizeEnforcePayload(opts: { subject: string; object: string; scope?: string }) {
    const { subject, object, scope } = opts;
    return {
      subject: subject?.toLowerCase() || '',
      object:
        scope?.toLowerCase() ??
        (object?.toLowerCase() || '')?.replace(/controller/g, '')?.replace(/.prototype/g, ''),
      action: EnforcerDefinitions.ACTION_EXECUTE,
    };
  }

  // -------------------------------------------------------------------------------------------------------------------
  async authorizePermission(userId: number, object: string, scopes?: string[]): Promise<boolean> {
    let isSingleAuthRs = false;
    let isScopeAuthRs = true;

    const enforcer = await this.enforcerService.getTypeEnforcer(userId);
    if (!enforcer) {
      this.logger.debug('[authorizePermission] Skip authorization for NULL enforcer!');
      return false;
    }

    const subject = `${EnforcerDefinitions.PREFIX_USER}_${userId}`;
    for (const scope of scopes ?? []) {
      const enforcePayload =
        this.normalizePayloadFn?.({ subject, object, scope }) ??
        this.normalizeEnforcePayload({ subject, object, scope });
      isScopeAuthRs = await enforcer.enforce(
        enforcePayload.subject,
        enforcePayload.object,
        enforcePayload.action,
      );
      this.logger.debug(
        '[authorizePermission] Payload: %j | scopeAuthRs: %s',
        enforcePayload,
        isScopeAuthRs,
      );

      if (!isScopeAuthRs) {
        this.logger.debug('[authorizePermission] Permission denied | Payload: %j', enforcePayload);
        break;
      }
    }

    if (!isScopeAuthRs) {
      return isScopeAuthRs;
    }

    if (object) {
      const enforcePayload =
        this.normalizePayloadFn?.({ subject, object }) ??
        this.normalizeEnforcePayload({ subject, object });
      isSingleAuthRs = await enforcer.enforce(
        enforcePayload.subject,
        enforcePayload.object,
        enforcePayload.action,
      );
      this.logger.debug(
        '[authorizePermission] Payload: %j | singleAuthRs: %s',
        enforcePayload,
        isSingleAuthRs,
      );
    }
    return isScopeAuthRs && isSingleAuthRs;
  }

  // -------------------------------------------------------------------------------------------------------------------
  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    const t = new Date().getTime();
    if (context?.principals.length <= 0) {
      return AuthorizationDecision.DENY;
    }

    const { userId, roles: encodedRoles } = context.principals[0];
    const roleIds: number[] = [];
    const roleIdentifiers: string[] = [];
    const roles: { id: number; identifier: string }[] = [];

    for (const encodedRole of encodedRoles) {
      if (!encodedRole || isEmpty(encodedRole)) {
        continue;
      }

      const { id, identifier } = encodedRole;

      roleIds.push(int(id));
      roleIdentifiers.push(identifier);
      roles.push({ id, identifier });
    }

    // DENY all unknown user and unknow roles
    if (!userId || !roles?.length) {
      return AuthorizationDecision.DENY;
    }

    const { resource, allowedRoles = [], scopes, voters } = metadata;
    const requestResource = resource ?? context.resource;

    // Verify static roles
    if (
      intersection(this.alwaysAllowRoles, roleIdentifiers)?.length > 0 ||
      intersection(allowedRoles, roleIdentifiers)?.length > 0
    ) {
      return AuthorizationDecision.ALLOW;
    }

    if (voters && voters?.length > 0) {
      const voterRs = await Promise.all(
        voters?.map(el => {
          switch (typeof el) {
            case 'function': {
              return el?.(context, metadata);
            }
            default: {
              throw getError({
                message: '[authorize][voter] voter implementation must be function type!',
              });
            }
          }
        }),
      );
      const voterSet = new Set(voterRs);

      if (voterSet.size === 1 && voterSet.has(AuthorizationDecision.ALLOW)) {
        return AuthorizationDecision.ALLOW;
      }

      if (voterSet.has(AuthorizationDecision.DENY)) {
        return AuthorizationDecision.DENY;
      }
    }

    // Authorize by role and user permissions
    const isAuthorized = await this.authorizePermission(userId, requestResource, scopes);
    const rs = isAuthorized ? AuthorizationDecision.ALLOW : AuthorizationDecision.DENY;

    this.logger.debug(
      '[authorize] Authorizing... | Resource: %s | allowedRoles: %j | scopes: %j | Took: %d(ms)',
      requestResource,
      allowedRoles,
      scopes,
      new Date().getTime() - t,
    );
    return rs;
  }
}
