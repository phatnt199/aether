import { TInjectionGetter } from '@/common';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { getError } from '@/utilities';
import { IScopeDefinition } from '../common';
import { OAuth2Scope } from '../models';
import { OAuth2ScopeRepository } from '../repositories';

export interface IOAuth2ScopeServiceOptions {
  injectionGetter: TInjectionGetter;
  repositoryKey?: string;
}

export class OAuth2ScopeService {
  private logger: ApplicationLogger;
  private injectionGetter: TInjectionGetter;
  private repositoryKey: string;
  private scopeCache: IScopeDefinition[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 60000; // 1 minute cache TTL

  constructor(opts: { options: IOAuth2ScopeServiceOptions; scope?: string }) {
    const { options, scope } = opts;
    this.logger = LoggerFactory.getLogger([scope ?? OAuth2ScopeService.name]);
    this.injectionGetter = options.injectionGetter;
    this.repositoryKey = options.repositoryKey ?? 'repositories.OAuth2ScopeRepository';

    this.logger.info('[constructor] Initialized | Repository: %s', this.repositoryKey);
  }

  async loadScopes(useCache = true): Promise<IScopeDefinition[]> {
    if (useCache && this.isCacheValid()) {
      this.logger.debug(
        '[loadScopes] Returning cached scopes | count: %d',
        this.scopeCache!.length,
      );
      return this.scopeCache!;
    }

    try {
      this.logger.info('[loadScopes] Loading scopes from database');
      const repository = this.injectionGetter<OAuth2ScopeRepository>(this.repositoryKey);
      this.logger.info('[loadScopes] Repository injected: %s', this.repositoryKey);
      const scopes = await repository.find({
        where: { isActive: true },
        order: ['identifier ASC'],
      });

      this.logger.info('[loadScopes] Loaded scopes from database | count: %d', scopes.length);

      const scopeDefinitions = this.convertToScopeDefinitions(scopes);

      this.scopeCache = scopeDefinitions;
      this.cacheTimestamp = Date.now();

      return scopeDefinitions;
    } catch (error) {
      this.logger.error('[loadScopes] Error loading scopes: %s', getError(error).message);

      if (this.scopeCache) {
        this.logger.warn('[loadScopes] Returning stale cached scopes due to error');
        return this.scopeCache;
      }

      return [];
    }
  }

  private convertToScopeDefinitions(scopes: OAuth2Scope[]): IScopeDefinition[] {
    return scopes.map(scope => ({
      identifier: scope.identifier,
      name: scope.name,
      description: scope.description,
      fields: scope?.fields,
      relations: scope?.relations,
    }));
  }

  private isCacheValid(): boolean {
    if (!this.scopeCache) {
      return false;
    }

    const age = Date.now() - this.cacheTimestamp;
    return age < this.cacheTTL;
  }
}
