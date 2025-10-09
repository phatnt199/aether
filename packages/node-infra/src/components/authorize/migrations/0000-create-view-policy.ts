import { BaseApplication } from '@/base/applications';
import { BaseDataSource } from '@/base/datasources';
import { applicationLogger } from '@/helpers';
import { getError } from '@/utilities';
import isEmpty from 'lodash/isEmpty';
import { EnforcerDefinitions } from '../common';

const sqls = [
  // UUID
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

  // View policies
  'DROP VIEW IF EXISTS "ViewAuthorizePolicy";',
  `CREATE OR REPLACE VIEW "ViewAuthorizePolicy"
  AS (
  SELECT
      uuid_generate_v4() as id,
      (t.subject_type || '_' || t.subject_id) as subject,
      t.subject_type,
      t.subject_id,
      json_agg(t.policy)::JSONB as policies
  FROM (
      SELECT
          pm.id as id,
          (CASE
              WHEN pm.user_id IS NOT NULL THEN '${EnforcerDefinitions.PREFIX_USER}'
              WHEN pm.role_id IS NOT NULL THEN '${EnforcerDefinitions.PREFIX_ROLE}'
              ELSE NULL
          END) AS subject_type,
          (CASE
              WHEN pm.user_id IS NOT NULL THEN pm.user_id
              WHEN pm.role_id IS NOT NULL THEN pm.role_id
              ELSE NULL
          END) AS subject_id,
          p.id AS permision_id,
          p.code AS permision_code,
          (CASE
              WHEN pm.user_id IS NOT NULL THEN
                  'p,${EnforcerDefinitions.PREFIX_USER}_' || pm.user_id || ',' || LOWER(p.code) || ',${EnforcerDefinitions.ACTION_EXECUTE},' || effect
              WHEN pm.role_id IS NOT NULL THEN
                  'p,${EnforcerDefinitions.PREFIX_ROLE}_' || pm.role_id || ',' || LOWER(p.code) || ',${EnforcerDefinitions.ACTION_EXECUTE},' || effect
              ELSE NULL
          END) AS policy
      FROM "PermissionMapping" AS pm INNER JOIN "Permission" AS p ON pm.permission_id = p.id
  ) AS t GROUP BY t.subject_type, t.subject_id, subject);`,
];

export const createViewPolicy = (opts: { datasourceKey: string }) => ({
  name: __filename.slice(__dirname.length + 1),
  fn: async (application: BaseApplication) => {
    if (!opts.datasourceKey || isEmpty(opts.datasourceKey)) {
      throw getError({
        statusCode: 500,
        message: '[createViewPolicy] Invalid datasourceKey to execute migration!',
      });
    }

    const { datasourceKey } = opts;
    const datasource = application.getSync<BaseDataSource>(datasourceKey);
    if (!datasource) {
      throw getError({
        statusCode: 500,
        message: `[createViewPolicy] Cannot find datasource with key ${datasourceKey} to execute migration!`,
      });
    }

    for (const sql of sqls) {
      applicationLogger.info('[creatViewPolicy] START | Execute SQL: %s', sql);
      await datasource.execute(sql);
      applicationLogger.info('[createViewPolicy] DONE | Execute SQL: %s', sql);
    }
  },
});
