import React from 'react';

import { Context } from '@loopback/context';
import { Store } from '@reduxjs/toolkit';
import { CoreAdmin, CustomRoutes, I18nProvider, Resource } from 'ra-core';
import { Provider as ReduxProvider } from 'react-redux';
import { Route } from 'react-router-dom';

import { CoreBindings, IAuthProvider, IDataProvider } from '@/common';
import { Logger } from '@/helpers';
import { ApplicationContext } from '../context';
import { IApplication } from '../types';

const Wrapper: React.FC<{
  applicationName?: string;
  context: Context;
  reduxStore: Store;
  suspense: React.ReactNode;
  enableDebug?: boolean;
  children: React.ReactNode;
}> = ({
  applicationName = 'CoreRaApplication',
  context,
  reduxStore,
  suspense,
  enableDebug = false,
  children,
}) => {
  return (
    <ApplicationContext.Provider
      value={{
        context,
        registry: context,
        logger: Logger.getInstance({ scope: applicationName, enableDebug }),
      }}
    >
      <ReduxProvider store={reduxStore}>
        <React.Suspense fallback={suspense}>{children}</React.Suspense>
      </ReduxProvider>
    </ApplicationContext.Provider>
  );
};

// -----------------------------------------------------------------
export const CoreRaApplication: React.FC<IApplication> = (props: IApplication) => {
  const {
    context,
    reduxStore,
    suspense,
    enableDebug = false,
    resources,
    customRoutes,
    ...raProps
  } = props;

  const { routes } = customRoutes ?? {};

  // -------------------------------------------------------------------------------
  const adminProps = React.useMemo(() => {
    const dataProvider = context.getSync<IDataProvider>(
      CoreBindings.DEFAULT_REST_DATA_PROVIDER,
    );
    const authProvider = context.getSync<IAuthProvider>(
      CoreBindings.DEFAULT_AUTH_PROVIDER,
    );
    const i18nProvider = context.getSync<I18nProvider>(
      CoreBindings.DEFAULT_I18N_PROVIDER,
    );

    return { dataProvider, authProvider, i18nProvider, ...raProps };
  }, [context, raProps]);

  // -------------------------------------------------------------------------------
  return (
    <Wrapper
      context={context}
      reduxStore={reduxStore}
      suspense={suspense}
      enableDebug={enableDebug}
    >
      <CoreAdmin {...adminProps}>
        {resources.map(resource => {
          return <Resource key={resource.name} {...resource} />;
        })}

        <CustomRoutes>
          {routes?.map(resource => {
            return <Route key={resource.id ?? resource.path} {...resource} />;
          })}
        </CustomRoutes>
      </CoreAdmin>
    </Wrapper>
  );
};
