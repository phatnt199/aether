import React from 'react';

import { Store } from '@reduxjs/toolkit';
import { Container } from '@venizia/ignis-inversion';
import { CoreAdmin, CustomRoutes, I18nProvider, Resource } from 'ra-core';
import { Provider as ReduxProvider } from 'react-redux';
import { Route } from 'react-router-dom';

import { CoreBindings, IAuthProvider, IDataProvider } from '@/common';
import { Logger } from '@/helpers';
import { ApplicationContext } from '../context';
import { IApplication } from '../types';

const Wrapper: React.FC<{
  applicationName?: string;
  container: Container;
  reduxStore: Store;
  suspense: React.ReactNode;
  enableDebug?: boolean;
  children: React.ReactNode;
}> = ({
  applicationName = 'CoreRaApplication',
  container,
  reduxStore,
  suspense,
  enableDebug = false,
  children,
}) => {
  return (
    <ApplicationContext.Provider
      value={{
        container,
        registry: container,
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
    container,
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
    const dataProvider = container.get<IDataProvider>({
      key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
    });
    const authProvider = container.get<IAuthProvider>({
      key: CoreBindings.DEFAULT_AUTH_PROVIDER,
    });
    const i18nProvider = container.get<I18nProvider>({
      key: CoreBindings.DEFAULT_I18N_PROVIDER,
    });

    return { dataProvider, authProvider, i18nProvider, ...raProps };
  }, [container, raProps]);

  // -------------------------------------------------------------------------------
  return (
    <Wrapper
      container={container}
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
