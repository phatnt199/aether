import { type Store } from '@reduxjs/toolkit';
import { type Container } from '@venizia/ignis-inversion';
import { type CoreAdminProps, type ResourceProps } from 'ra-core';
import { type RouteProps } from 'react-router-dom';

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
