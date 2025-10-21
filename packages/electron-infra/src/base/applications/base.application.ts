import { verifySelfCodeSigningSignature } from '@/helpers/self-code-siging.helper';
import {
  AnyType,
  ApplicationLogger,
  LoggerFactory,
  ResultCodes,
  ValueOrPromise,
  getError,
} from '@minimaltech/node-infra';
import {
  Application,
  Binding,
  BindingTag,
  Constructor,
  DynamicValueProviderClass,
  MetadataInspector,
} from '@minimaltech/node-infra/lb-core';
import { IpcMainEvent, IpcMainInvokeEvent, dialog, ipcMain } from 'electron';
import { AppUpdater, NsisUpdater, ProgressInfo, UpdateInfo } from 'electron-updater';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WindowManager } from '../services';
import {
  BindingKeys,
  CASignTypes,
  ExposeVerbs,
  IAutoUpdaterOptions,
  IElectronApplication,
  IExposeMetadata,
  IWindowManager,
} from '@/common';

// --------------------------------------------------------------------------------
export abstract class AbstractElectronApplication
  extends Application
  implements IElectronApplication
{
  protected logger: ApplicationLogger;

  protected application: Electron.App;
  protected autoUpdater: AppUpdater;

  protected windowManager: IWindowManager;

  protected autoUpdaterOptions?: { use: false } | IAutoUpdaterOptions<AnyType>;
  // routes: Map<string | symbol, Function>;

  // ------------------------------------------------------------------------------
  constructor(opts: {
    scope: string;
    appName?: string;

    application: Electron.App;
    autoUpdater?: AppUpdater;
    windowManager?: IWindowManager;

    autoUpdaterOptions?: { use: false } | IAutoUpdaterOptions<AnyType>;
  }) {
    super();
    this.logger = LoggerFactory.getLogger([opts.scope]);

    // this.routes = new Map<string | symbol, Function>();
    this.application = opts.application;

    if (opts.appName) {
      this.application.setName(opts.appName);
    }

    this.windowManager = opts.windowManager ?? WindowManager.getInstance();
    this.autoUpdaterOptions = opts.autoUpdaterOptions;

    if (!this.autoUpdaterOptions?.use) {
      return;
    }

    if (!opts.autoUpdater) {
      throw getError({
        message: 'Missing arg opts.autoUpdater!',
      });
    }

    this.autoUpdater = opts.autoUpdater;
  }

  // ------------------------------------------------------------------------------
  // Events Binding
  // ------------------------------------------------------------------------------
  // Default Electron App Events
  abstract onBeforeMigrate(): ValueOrPromise<void>;
  abstract onMigrate(): ValueOrPromise<void>;
  abstract onAfterMigrate(): ValueOrPromise<void>;

  abstract onWillFinishLaunching(): void;

  abstract onReady(): void;

  abstract onSecondApplicationInstance(
    event: Electron.Event,
    args: string[],
    dir: string,
    additionalData: any,
  ): void;
  abstract onBrowserWindowCreated(
    event: Electron.Event,
    window: Electron.BrowserWindow,
  ): void;

  abstract onAllWindowsClosed(): void;
  abstract onWillQuit(event: Electron.Event): void;
  abstract onBeforeQuit(event: Electron.Event): void;
  abstract onQuit(event: Electron.Event, exitCode: number): void;

  abstract getProjectRoot(): string;
  abstract bindContext(): ValueOrPromise<void>;

  // ------------------------------------------------------------------------------
  // Default Auto Updater Events
  abstract onCheckingForUpdate(): ValueOrPromise<void>;
  abstract onUpdateAvailable(updateInfo: UpdateInfo): ValueOrPromise<void>;
  abstract onUpdateNotAvailable(updateInfo: UpdateInfo): ValueOrPromise<void>;
  abstract onDownloadProgress(progress: ProgressInfo): ValueOrPromise<void>;
  abstract onUpdateDownloaded(updateInfo: UpdateInfo): ValueOrPromise<void>;
  abstract onUpdateError(error: Error): ValueOrPromise<void>;

  getAutoUpdater(): AppUpdater {
    return this.autoUpdater;
  }

  executeWin32SignatureVerification() {
    if (!this.autoUpdaterOptions?.use) {
      return;
    }

    const verifyOptions = this.autoUpdaterOptions.verify;
    if (verifyOptions.caType !== CASignTypes.SELF_SIGNED_CA) {
      return;
    }

    const { verifySignature = verifySelfCodeSigningSignature } = verifyOptions;
    const nsisUpdater = this.autoUpdater as NsisUpdater;

    nsisUpdater.verifyUpdateCodeSignature = async (
      publishers,
      unescapedTempUpdateFile,
    ) => {
      if (!this.autoUpdaterOptions) {
        return 'Invalid verifySelfCodeSigningSignature implementation!';
      }

      try {
        const tmpPath = path.normalize(unescapedTempUpdateFile.replace(/'/g, "''"));
        this.logger.info(
          '[verifyUpdateCodeSignature] Verifying signature | publisherNames: %s | tmpPath: %s',
          publishers,
          tmpPath,
        );

        const signatureAuthRs = execFileSync(
          `set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`,
          [
            '-NoProfile',
            '-NonInteractive',
            '-InputFormat',
            'None',
            '-Command',
            `"Get-AuthenticodeSignature -LiteralPath '${tmpPath}' | ConvertTo-Json -Compress"`,
          ],
          { shell: true, timeout: 20_000 },
        );

        const verifyRs = await verifySignature({
          publishers,
          tmpPath,
          signature: JSON.parse(signatureAuthRs.toString('utf8')),
          autoUpdaterOptions: this.autoUpdaterOptions,
        });

        this.logger.info('[verifyUpdateCodeSignature] verifyRs: %j', verifyRs);
        return verifyRs;
      } catch (error) {
        const message =
          '[verifyUpdateCodeSignature] Failed to get authentication code signature!';
        this.logger.error('%s | Error: %s', message, error);
        return Promise.resolve(message);
      }
    };
  }

  bindAutoUpdater(): ValueOrPromise<void> {
    if (!this.autoUpdaterOptions?.use) {
      this.logger.warn('[bindAutoUpdater] Ignore configuring Application Auto Updater!');
      return;
    }

    this.autoUpdater.autoDownload = true;
    this.autoUpdater.autoInstallOnAppQuit = true;
    this.autoUpdater.autoRunAppAfterInstall = true;

    this.autoUpdater.on('error', error => {
      return this.onUpdateError(error);
    });

    this.autoUpdater.on('checking-for-update', () => {
      return this.onCheckingForUpdate();
    });

    this.autoUpdater.on('update-available', updateInfo => {
      this.onUpdateAvailable(updateInfo);
    });

    this.autoUpdater.on('update-not-available', updateInfo => {
      this.onUpdateNotAvailable(updateInfo);
    });

    this.autoUpdater.on('download-progress', progress => {
      this.onDownloadProgress(progress);
    });

    this.autoUpdater.on('update-downloaded', updateInfo => {
      this.onUpdateDownloaded(updateInfo);
    });

    const platform = os.platform();
    switch (platform) {
      case 'win32': {
        this.executeWin32SignatureVerification();
        break;
      }
      default: {
        this.logger.warn(
          '[bindAutoUpdater] Unsupported custom verifyUpdateCodeSignature | platform: %s | supported: %s',
          platform,
          ['win32'],
        );
        return;
      }
    }
  }

  // ------------------------------------------------------------------------------
  getApplicationInstance(): Electron.App {
    return this.application;
  }

  getDialog(): Electron.Main.Dialog {
    return dialog;
  }

  getWindowManager(): IWindowManager {
    return this.windowManager;
  }

  getPreloadPath(opts?: { fileName?: string }): string {
    const { fileName = 'preload.js' } = opts ?? { fileName: 'preload.js' };

    const projectRoot = this.getProjectRoot();
    const preloadPath = path.join(projectRoot, fileName);
    this.logger.debug('[getPreloadPath] preloadPath: %s', preloadPath);

    if (!fs.existsSync(preloadPath)) {
      throw getError({
        statusCode: ResultCodes.RS_4.NotFound,
        message: `[getPreloadPath] Path: ${preloadPath} | preloadPath NOT FOUND`,
      });
    }

    return preloadPath;
  }

  // ------------------------------------------------------------------------------
  // Context Binding
  // ------------------------------------------------------------------------------
  preConfigure(): ValueOrPromise<void> {
    const isFirstInstance = this.application.requestSingleInstanceLock();
    if (!isFirstInstance) {
      this.logger.warn(
        '[preConfigure] Quiting application | Application instance was locked by another process | Please check whether or not another application was opening!',
      );
      this.application.quit();
    }

    this.bindAutoUpdater();
    this.bindContext();
    this.bindEvents();
  }

  // ------------------------------------------------------------------------------
  postConfigure(): ValueOrPromise<void> {
    this.buildRoutes();
  }

  // ------------------------------------------------------------------------------
  getMethodExecutor(opts: { binding: Readonly<Binding<any>>; methodName: string }) {
    const { binding, methodName } = opts;
    const ctor = binding.valueConstructor;
    const ctorPrototype = ctor?.prototype;
    const className = ctorPrototype?.name ?? '';

    return (...args: any[]) => {
      if (args?.length > 1) {
        this.logger.warn(
          '[%s] executor use only FIRST arg | Please check again caller args!',
          methodName,
        );
      }

      const controller = binding.getValue(this);
      if (!controller?.[methodName]) {
        throw getError({
          message: `[getMethodExecutor] Class: ${className} | Method: ${methodName} | Method is not available!`,
        });
      }

      return Reflect.apply(controller[methodName], controller, args);
    };
  }

  // ------------------------------------------------------------------------------
  buildRoute(opts: { binding: Readonly<Binding<any>>; methodName: string }) {
    const { binding, methodName } = opts;

    const ctor = binding.valueConstructor;
    const ctorPrototype = ctor?.prototype;

    if (!ctorPrototype) {
      throw getError({
        message: `[buildRoute] Binding: ${binding.key} | Class: ${ctor?.name} | method: ${methodName} | Skip build route | Invalid ctor prototype`,
      });
    }

    const exposeMetadata = MetadataInspector.getMethodMetadata(
      BindingKeys.EXPOSE_METHOD_KEY,
      ctorPrototype,
      methodName,
    );

    if (!exposeMetadata) {
      this.logger.warn(
        '[buildRoute] Class: %s | Method: %s | Skip method initialize!',
        ctor.name,
        methodName,
      );
      return;
    }

    const { verb } = exposeMetadata as IExposeMetadata;

    let ipcAction: 'on' | 'handle' | null = null;
    const executor = this.getMethodExecutor(opts);

    const ipcChannel = `${ctor.name}.${methodName}`;
    switch (verb) {
      case ExposeVerbs.SUBSCRIBER: {
        ipcAction = 'on';
        ipcMain.on(ipcChannel, (_event: IpcMainEvent, ...args: any[]) => {
          executor(...args);
        });
        break;
      }
      case ExposeVerbs.HANDLER: {
        ipcAction = 'handle';
        ipcMain.handle(ipcChannel, (_event: IpcMainInvokeEvent, ...args: any[]) => {
          return Promise.resolve(executor(...args));
        });
        break;
      }
      default: {
        break;
      }
    }

    this.logger.info(
      '[buildRoute][%s] Binding route | Class: %s | Method: %s | ipcMethod: %s',
      ipcAction,
      ctor.name,
      methodName,
      ipcChannel,
    );

    /* this.routes.set(`${ctor.name}_${methodName}`, () => {
      executor!(method ?? methodName, (_event, ...args: any[]) => {});
    }); */
  }

  // ------------------------------------------------------------------------------
  buildRoutes() {
    const controllers = this.findByTag('controllers');
    for (const binding of controllers) {
      const prototype = binding.valueConstructor?.prototype;
      if (!prototype) {
        continue;
      }

      const methodDescriptors = Object.getOwnPropertyDescriptors(prototype);
      for (const methodName in methodDescriptors) {
        if (methodName === 'constructor') {
          continue;
        }

        this.buildRoute({ binding, methodName });
        /* this.routes.set(methodName, (...args: any[]) => {
          const controller = binding.getValue(this);
          Reflect.apply(controller[methodName], controller, args);
        }); */
      }
    }
  }

  // ------------------------------------------------------------------------------
  injectable<T>(
    scope: string,
    value: DynamicValueProviderClass<T> | Constructor<T>,
    tags?: BindingTag[],
  ) {
    this.bind(`${scope}.${value.name}`)
      .toInjectable(value)
      .tag(...(tags ?? []), scope);
  }

  // ------------------------------------------------------------------------------
  datasource<T>(value: DynamicValueProviderClass<T> | Constructor<T>) {
    this.injectable('datasources', value);
  }

  // ------------------------------------------------------------------------------
  repository<T>(value: DynamicValueProviderClass<T> | Constructor<T>) {
    this.injectable('repositories', value);
  }

  // ------------------------------------------------------------------------------
  bindEvents() {
    if (!this.application) {
      throw getError({
        message: '[binding] Invalid application instance to bind',
      });
    }

    this.on('before-migrate', () => {
      Promise.resolve(this.onBeforeMigrate())
        .then(() => {
          this.emit('migrate');
        })
        .catch(error => {
          this.logger.error(
            '[onBeforeMigrate] Error while handling before migrate application | Error: %s',
            error,
          );
        });
    });

    this.on('migrate', () => {
      Promise.resolve(this.onMigrate())
        .then(() => {
          this.emit('after-migrate');
        })
        .catch(error => {
          this.logger.error(
            '[migrate] Error while handling migrate application | Error: %s',
            error,
          );
        });
    });

    this.on('after-migrate', () => {
      Promise.resolve(this.onAfterMigrate())
        .then(() => {
          this.onReady();
        })
        .catch(error => {
          this.logger.error(
            '[onAfterMigrate] Error while handling after migrate application | Error: %s',
            error,
          );
        });
    });

    this.application.on('will-finish-launching', () => this.onWillFinishLaunching());
    this.application.on('ready', (_event, _launchInfo) => {
      this.emit('before-migrate');
    });
    this.application.on('second-instance', (event, args, dir, additionalData) =>
      this.onSecondApplicationInstance(event, args, dir, additionalData),
    );
    this.application.on('browser-window-created', (event, window) =>
      this.onBrowserWindowCreated(event, window),
    );
    this.application.on('window-all-closed', () => this.onAllWindowsClosed());
    this.application.on('will-quit', event => this.onWillQuit(event));
    this.application.on('before-quit', event => this.onBeforeQuit(event));
    this.application.on('quit', (event, exitCode) => this.onQuit(event, exitCode));
  }

  // ------------------------------------------------------------------------------
  override async start() {
    super.start();
    await this.preConfigure();
    await this.postConfigure();
  }
}

// --------------------------------------------------------------------------------
export abstract class BaseElectronApplication extends AbstractElectronApplication {
  // ----------------------------------------------------------------------
  // Main Application Events
  // ----------------------------------------------------------------------
  override onBeforeMigrate(): ValueOrPromise<void> {
    return;
  }

  override onMigrate(): ValueOrPromise<void> {
    return;
  }

  override onAfterMigrate(): ValueOrPromise<void> {
    return;
  }

  override onWillFinishLaunching(): void {
    this.logger.debug('[onWillFinishLaunching] Application finishing launching');
  }

  override onSecondApplicationInstance(
    event: Electron.Event,
    args: string[],
    _dir: string,
    _additionalData: any,
  ): void {
    this.logger.debug(
      '[onSecondApplicationInstance] New Application was requested to create | Args: %j',
      event,
      args,
    );
  }

  override onBrowserWindowCreated(
    event: Electron.Event,
    window: Electron.BrowserWindow,
  ): void {
    this.logger.debug(
      '[onBrowserWindowCreated] New BrowserWindow CREATED | Window: %j',
      event,
      window,
    );
  }

  override onAllWindowsClosed(): void {
    this.logger.debug(
      '[onAllWindowsClosed] All BrowserWindows was CLOSED | Quiting application!',
    );

    if (process.platform === 'darwin') {
      return;
    }

    this.application.quit();
  }

  override onWillQuit(event: Electron.Event): void {
    this.logger.debug('[onWillQuit] Application WILL_QUIT', event);
  }

  override onBeforeQuit(event: Electron.Event): void {
    this.logger.debug('[onBeforeQuit] Application BEFORE_QUIT', event);
  }

  override onQuit(event: Electron.Event, exitCode: number): void {
    this.logger.debug('[onQuit] Application QUIT | exitCode: %s', event, exitCode);
  }

  // ----------------------------------------------------------------------
  // Application Updater Events
  // ----------------------------------------------------------------------
  override onUpdateError(error: Error): ValueOrPromise<void> {
    this.logger.error('[onUpdateError] Failed to update new version | Error: %s', error);

    this.getDialog().showMessageBoxSync({
      type: 'error',
      title: 'Update Error',
      message: `Failed to update new version\n\n${error.name}\n${error.message}`,
    });

    this.application.quit();
  }

  override onCheckingForUpdate(): ValueOrPromise<void> {
    this.logger.info('[onCheckingForUpdate] Checking for update...');
  }

  override onUpdateNotAvailable(updateInfo: UpdateInfo): ValueOrPromise<void> {
    const currentVersion = this.application.getVersion();
    this.logger.info(
      '[onUpdateNotAvailable] currentVersion: %s | updateInfo: %j',
      currentVersion,
      updateInfo,
    );
  }

  override async onUpdateAvailable(updateInfo: UpdateInfo) {
    if (!this.autoUpdaterOptions?.use) {
      return;
    }

    const { forceUpdateNewVersion } = this.autoUpdaterOptions;

    const currentVersion = this.application.getVersion();

    this.logger.info(
      '[onUpdateAvailable] New version is now available | currentVersion: %s | updateInfo: %j',
      currentVersion,
      updateInfo,
    );

    // Force update new application version
    if (forceUpdateNewVersion) {
      this.logger.info(
        '[onUpdateAvailable] FORCE update new version | Start downloading new version...!',
      );
      await this.autoUpdater.downloadUpdate();
      return;
    }

    // Notify new application version
    const applicationName = this.application.getName();
    const userChoice = this.getDialog().showMessageBoxSync({
      type: 'info',
      title: 'Update Available',
      message: `New ${applicationName} version is now available\n\nCurrent version: ${currentVersion}\nNew version: ${updateInfo.version}\nRelease date: ${updateInfo.releaseDate}`,
      buttons: ['NO', 'YES'],
    });

    if (!userChoice) {
      this.logger.error(
        '[onUpdateAvailable] DENIED update new version | Force close application!',
      );
      this.application.quit();
    }

    this.logger.info(
      '[onUpdateAvailable] ACCEPTED update new version | Start downloading new version...!',
    );
    await this.autoUpdater.downloadUpdate();
  }

  override onDownloadProgress(progress: ProgressInfo): ValueOrPromise<void> {
    this.logger.info(
      '[onDownloadProgress] Downloading new version | progress: %j',
      progress,
    );
  }

  override onUpdateDownloaded(updateInfo: UpdateInfo): ValueOrPromise<void> {
    const willQuitAndInstall =
      this.autoUpdaterOptions &&
      this.autoUpdaterOptions.use &&
      this.autoUpdaterOptions.autoInstallAfterDownloaded;
    this.logger.info(
      '[onUpdateDownloaded] willQuitAndInstall: %s | updateInfo: %j',
      willQuitAndInstall,
      updateInfo,
    );

    if (!willQuitAndInstall) {
      return;
    }

    this.logger.info(
      '[onUpdateDownloaded] Quit and install new version | updateInfo: %j',
      updateInfo,
    );
    return this.autoUpdater.quitAndInstall();
  }
}
