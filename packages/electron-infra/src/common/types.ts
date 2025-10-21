import { TStatusFromClass, ValueOrPromise } from '@minimaltech/node-infra';
import {
  BindingTag,
  Constructor,
  DynamicValueProviderClass,
} from '@minimaltech/node-infra/@lb/core';
import { JsonSchema } from '@minimaltech/node-infra/@lb/rest';
import { AppUpdater, ProgressInfo, UpdateInfo } from 'electron-updater';
import { BrowserWindow, TBrowserWindowOptions } from '../base/models';
import { ExposeVerbs } from './constants';

// ------------------------------------------------------------------------------
export interface IExposeMetadata {
  verb: TStatusFromClass<typeof ExposeVerbs>;
  payload?: { schema: JsonSchema };
}

// ----------------------------------------------------------------------
export interface IWindowManager {
  getContainer(): Map<string, { window: BrowserWindow; options: TBrowserWindowOptions }>;

  open(opts: TBrowserWindowOptions): Promise<BrowserWindow>;

  getWindowByIdentifier(identifier: string): BrowserWindow | null;
  getWindows(opts: { identifier?: string; name?: string }): Array<BrowserWindow>;
  getAll(): Array<BrowserWindow>;

  closeByIdentifier(identifier: string): void;
  closeWindows(opts: { identifier?: string; name?: string }): void;
  closeAll(): void;
}

// --------------------------------------------------------------------------------
export interface IAutoUpdaterOptions<S> {
  use: true;
  autoInstallAfterDownloaded: boolean;
  forceUpdateNewVersion?: boolean;
  verify:
    | { caType: 'trusted-ca' }
    | {
        caType: 'self-signed-ca';
        doVerifySignToolStatus?: boolean;
        validSubjects?: Array<string>;
        verifySignature?: (opts: {
          publishers: Array<string>;
          tmpPath: string;
          signature: S;
        }) => Promise<string | null>;
      };
}

// ----------------------------------------------------------------------
export interface IElectronUpdater {
  bindAutoUpdater(): ValueOrPromise<void>;
  getAutoUpdater(): AppUpdater;

  onCheckingForUpdate(): ValueOrPromise<void>;
  onUpdateAvailable(updateInfo: UpdateInfo): ValueOrPromise<void>;
  onUpdateNotAvailable(updateInfo: UpdateInfo): ValueOrPromise<void>;
  onDownloadProgress(progress: ProgressInfo): ValueOrPromise<void>;
  onUpdateDownloaded(updateInfo: UpdateInfo): ValueOrPromise<void>;
  onUpdateError(error: Error): ValueOrPromise<void>;
}

export interface IElectronApplication extends IElectronUpdater {
  getApplicationInstance(): Electron.Main.App;
  getWindowManager(): IWindowManager;
  getDialog(): Electron.Main.Dialog;

  // ------------------------------------------------------------------------------
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;
  buildRoutes(): ValueOrPromise<void>;
  bindContext(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  onWillFinishLaunching(): void;
  onReady(
    event: Electron.Event,
    launchInfo: Record<string, any> | Electron.NotificationResponse,
  ): void;
  onSecondApplicationInstance(
    event: Electron.Event,
    args: string[],
    dir: string,
    additionalData: any,
  ): void;
  onBrowserWindowCreated(event: Electron.Event, window: BrowserWindow): void;
  onAllWindowsClosed(): void;
  onWillQuit(event: Electron.Event): void;
  onBeforeQuit(event: Electron.Event): void;
  onQuit(event: Electron.Event, exitCode: number): void;

  // ------------------------------------------------------------------------------
  injectable<T>(
    scope: string,
    value: DynamicValueProviderClass<T> | Constructor<T>,
    tags?: Array<BindingTag>,
  ): void;
  datasource<T>(value: DynamicValueProviderClass<T> | Constructor<T>): void;
  repository<T>(value: DynamicValueProviderClass<T> | Constructor<T>): void;

  // ------------------------------------------------------------------------------
  start(): ValueOrPromise<void>;
}
