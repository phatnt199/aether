import { BaseDataSource } from '@/base/datasources';
import { ApplicationLogger, LoggerFactory } from '@/helpers';
import { FilteredAdapter, Model } from 'casbin';
import { EnforcerDefinitions } from '../common';

// -----------------------------------------------------------------------------------------
export abstract class AbstractCasbinAdapter implements FilteredAdapter {
  protected logger: ApplicationLogger;
  protected datasource: BaseDataSource;

  constructor(opts: { scope: string; datasource: BaseDataSource }) {
    const { scope, datasource } = opts;

    this.logger = LoggerFactory.getLogger([scope]);
    this.datasource = datasource;
  }

  abstract loadFilteredPolicy(model: Model, filter: any): Promise<void>;

  // -----------------------------------------------------------------------------------------
  isFiltered(): boolean {
    return true;
  }

  // -----------------------------------------------------------------------------------------
  loadPolicy(_: Model): Promise<void> {
    return Promise.resolve();
  }

  // -----------------------------------------------------------------------------------------
  savePolicy(model: Model): Promise<boolean> {
    this.logger.info('[savePolicy] Ignore save policy method with options: ', {
      model,
    });
    return Promise.resolve(true);
  }

  // -----------------------------------------------------------------------------------------
  addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.logger.info('[addPolicy] Ignore add policy method with options: ', {
      sec,
      ptype,
      rule,
    });
    return Promise.resolve();
  }

  // -----------------------------------------------------------------------------------------
  removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.logger.info('[removePolicy] Ignore remove policy method with options: ', {
      sec,
      ptype,
      rule,
    });
    return Promise.resolve();
  }

  // -----------------------------------------------------------------------------------------
  removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    switch (ptype) {
      case EnforcerDefinitions.PREFIX_USER: {
        // Remove user policy
        break;
      }
      case EnforcerDefinitions.PREFIX_ROLE: {
        // Remove role policy
        break;
      }
      default: {
        break;
      }
    }

    this.logger.info('[removeFilteredPolicy] Ignore remove filtered policy method with options: ', {
      sec,
      ptype,
      fieldIndex,
      fieldValues,
    });
    return Promise.resolve();
  }
}
