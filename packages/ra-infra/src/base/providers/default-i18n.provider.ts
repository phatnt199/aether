import {
  CoreBindings,
  englishMessages,
  II18nProviderOptions,
  ValueOrPromise,
} from '@/common';
import { inject } from '@loopback/context';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import { I18nProvider } from 'react-admin';
import { BaseProvider } from './base.provider';

const [language] = (navigator?.language || 'en-US').split('-');

export class DefaultI18nProvider extends BaseProvider<I18nProvider> {
  constructor(
    @inject(CoreBindings.I18N_PROVIDER_OPTIONS)
    protected i18nProviderOptions: II18nProviderOptions,
  ) {
    super({ scope: DefaultI18nProvider.name });
  }

  override value(): ValueOrPromise<I18nProvider> {
    const {
      i18nSources = { en: englishMessages },
      listLanguages = [{ locale: 'en', name: 'English' }],
    } = this.i18nProviderOptions;

    const listLocales = listLanguages.map(({ locale }) => locale);

    const initialLocale = listLocales.includes(language) ? language : 'en';

    return polyglotI18nProvider(
      locale => {
        return i18nSources?.[locale] ?? englishMessages;
      },
      initialLocale,
      listLanguages,
      {
        allowMissing: true,
        onMissingKey: (key: string, _: any, __: any) => key,
      },
    );
  }
}
