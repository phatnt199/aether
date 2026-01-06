import { Store } from '@reduxjs/toolkit';
import { Container } from '@venizia/ignis-inversion';
import { CoreAdminProps, ResourceProps } from 'ra-core';
import { RouteProps } from 'react-router-dom';

// -------------------------------------------------------------
export interface IApplication extends Omit<CoreAdminProps, 'children'> {
  container: Container;

  enableDebug?: boolean;
  reduxStore: Store;
  suspense: React.ReactNode;

  resources: Array<ResourceProps>;
  customRoutes?: {
    // layout?: React.ReactNode | null;
    routes: Array<RouteProps>;
  };
}

// -------------------------------------------------------------
/**
 * @description A type for synchronous functional components that return React nodes (React 19+).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SyncFC<P = {}> {
  (props: P): React.ReactNode;
}
