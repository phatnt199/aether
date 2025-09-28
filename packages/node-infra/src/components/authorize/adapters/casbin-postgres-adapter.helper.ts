import { BaseDataSource } from '@/base/datasources';
import { getError } from '@/utilities';
import { Helper, Model } from 'casbin';

import flatten from 'lodash/flatten';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { EnforcerDefinitions, IEnforcerFilterValue } from '../common';
import { AbstractCasbinAdapter } from './base.adapter';

// -----------------------------------------------------------------------------------------
export class CasbinPostgresAdapter extends AbstractCasbinAdapter {
  constructor(datasource: BaseDataSource) {
    super({ scope: CasbinPostgresAdapter.name, datasource });
  }

  // -----------------------------------------------------------------------------------------
  generateGroupLine(rule: { userId: number; roleId: number }) {
    const { userId, roleId } = rule;
    const rs = [
      EnforcerDefinitions.PTYPE_GROUP,
      `${EnforcerDefinitions.PREFIX_USER}_${userId}`,
      `${EnforcerDefinitions.PREFIX_ROLE}_${roleId}`,
    ];
    return rs.join(',');
  }

  // -----------------------------------------------------------------------------------------
  async loadFilteredPolicy(model: Model, filter: IEnforcerFilterValue) {
    if (filter?.principalType?.toLowerCase() === 'role') {
      throw getError({
        statusCode: 500,
        message: '[loadFilteredPolicy] Only "User" is allowed for filter principal type!',
      });
    }

    const aclQueries = [
      this.datasource.execute(`SELECT * FROM public."ViewAuthorizePolicy" WHERE subject=$1`, [
        `user_${filter.principalValue}`,
      ]),
    ];

    // Load role permission policies
    const userRoles = await this.datasource.execute(
      `SELECT * FROM public."UserRole" WHERE user_id=$1`,
      [filter.principalValue],
    );
    for (const userRole of userRoles) {
      const execution = this.datasource.execute(
        `SELECT * FROM public."ViewAuthorizePolicy" WHERE subject=$1`,
        [`role_${userRole.principal_id}`],
      );
      aclQueries.push(execution);
    }

    // Load policy lines
    const policyRs = flatten(await Promise.all(aclQueries));
    this.logger.debug('[loadFilteredPolicy] policyRs: %j | filter: %j', policyRs, filter);
    for (const el of policyRs) {
      if (!el) {
        continue;
      }

      el.policies?.forEach((policyLine: string) => {
        Helper.loadPolicyLine(policyLine, model);
        this.logger.debug('[loadFilteredPolicy] Load policy: %s', policyLine);
      });
    }

    // Load group lines
    for (const userRole of userRoles) {
      const groupLine = this.generateGroupLine({
        userId: get(userRole, 'user_id'),
        roleId: get(userRole, 'principal_id'),
      });

      if (!groupLine || isEmpty(groupLine)) {
        continue;
      }

      Helper.loadPolicyLine(groupLine, model);
      this.logger.debug('[loadFilteredPolicy] Load groupLine: %s', groupLine);
    }
  }
}
