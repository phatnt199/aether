import { IWindowManager } from '@/common';
import { BaseService, ResultCodes, getError } from '@minimaltech/node-infra';
import { Menu } from 'electron';
import { debounceTime, fromEvent } from 'rxjs';
import { BrowserWindow, TBrowserWindowOptions } from '../models';

export class WindowManager extends BaseService implements IWindowManager {
  private static instance: WindowManager | null;
  private container: Map<
    string,
    {
      window: BrowserWindow;
      options: TBrowserWindowOptions;
    }
  >;

  private constructor() {
    super({ scope: WindowManager.name });
    this.container = new Map();
  }

  // -----------------------------------------------------------------------------------
  static getInstance() {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }

    return WindowManager.instance;
  }

  // -----------------------------------------------------------------------------------
  getContainer() {
    return this.container;
  }

  // -----------------------------------------------------------------------------------
  async open(opts: TBrowserWindowOptions) {
    const {
      name,
      useDevTool = false,
      onClose,
      onClosed,
      onReadyToShow,
      onShow,
      onMove,
      onResize,
      onBlur,
      onFocus,
    } = opts;

    if (opts.identifier && this.container.has(opts.identifier)) {
      throw getError({
        statusCode: ResultCodes.RS_4.BadRequest,
        message: `[open] Identifier: ${opts.identifier} | Invalid window identifier | Existed in container`,
      });
    }

    const window = new BrowserWindow(opts);
    const identifier = window.getIdentifier();
    this.container.set(identifier, { window, options: opts });

    if (opts.menuFactory) {
      const menu = await opts.menuFactory.getMenu(window);
      Menu.setApplicationMenu(menu);
    }

    this.logger.info(
      '[open] Identifier: %s | Name: %s | Window CREATED',
      identifier,
      name,
    );

    // --------------------------------------------------
    const subscriptionResize = fromEvent(window, 'resize')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        onResize?.(window);
      });
    const subscriptionMove = fromEvent(window, 'move')
      .pipe(debounceTime(1000))
      .subscribe(() => {
        onMove?.(window);
      });

    // --------------------------------------------------
    window.on('ready-to-show', () => {
      onReadyToShow?.(window);

      window.show();
    });

    window.on('show', () => {
      onShow?.(window);
    });

    // --------------------------------------------------
    window.on('closed', () => {
      onClosed?.(window);

      if (!this.container.has(identifier)) {
        return;
      }

      subscriptionResize.unsubscribe();
      subscriptionMove.unsubscribe();
      this.container.delete(identifier);
    });

    window.on('close', event => {
      onClose?.({ window, event });
    });

    // -----------------------------------------------------------------------------------
    window.on('focus', () => {
      onFocus?.(window);
    });

    window.on('blur', () => {
      onBlur?.(window);
    });

    if (useDevTool) {
      window.webContents.toggleDevTools();
    }

    return window;
  }

  // -----------------------------------------------------------------------------------
  getWindowByIdentifier(identifier: string) {
    return this.container.get(identifier)?.window ?? null;
  }

  // -----------------------------------------------------------------------------------
  getWindows(opts: { identifier?: string; name?: string }) {
    const { identifier, name } = opts;
    const rs: Array<BrowserWindow> = [];

    if (!identifier && !name) {
      for (const el of this.container.values()) {
        rs.push(el.window);
      }

      return rs;
    }

    if (identifier && this.container.has(identifier)) {
      const el = this.container.get(identifier)!;
      if (el?.window) {
        rs.push(el.window);
      }
    }

    if (name) {
      for (const [_, v] of this.container) {
        const windowName = v.window.getName();
        if (name !== windowName) {
          continue;
        }

        rs.push(v.window);
      }
    }

    return rs;
  }

  // -----------------------------------------------------------------------------------
  getAll() {
    return Array.from(this.container.values()).map(v => v.window);
  }

  // -----------------------------------------------------------------------------------
  closeByIdentifier(identifier: string) {
    const window = this.container.get(identifier)?.window;
    if (window) {
      window.close();
    }
  }

  // -----------------------------------------------------------------------------------
  closeWindows(opts: { identifier?: string; name?: string }) {
    const { identifier, name } = opts;

    this.getWindows({ identifier, name }).forEach(w => w.close());
  }

  // -----------------------------------------------------------------------------------
  closeAll() {
    for (const el of this.container.values()) {
      el.window.close();
    }
  }
}
