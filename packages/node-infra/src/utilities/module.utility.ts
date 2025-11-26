import { LoggerFactory } from '@/helpers';
import { getError } from './error.utility';

export const validateModule = (opts: { scope?: string; modules: Array<string> }) => {
  const { scope = '', modules = [] } = opts;
  for (const module of modules) {
    try {
      require.resolve(module);
    } catch (error) {
      LoggerFactory.getLogger([scope]).error(
        "[validateModule] Failed to import '%s' | Error: %s",
        error,
      );
      throw getError({
        message: `[validateModule] ${module} is required${scope ? ` for ${scope}` : ''}. Please install '${module}'`,
      });
    }
  }
};
