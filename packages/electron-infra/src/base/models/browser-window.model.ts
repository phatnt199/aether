import { ResultCodes, getError, getUID } from '@minimaltech/node-infra';
import {
  BrowserWindowConstructorOptions,
  BrowserWindow as ElectronBrowserWindow,
} from 'electron';
import { AbstractMenuFactory } from '../services';

export type TBrowserWindowOptions = BrowserWindowConstructorOptions & {
  identifier?: string;
  name: string;
  url: string;

  useDevTool?: boolean;
  menuFactory?: AbstractMenuFactory;

  onClose?: (opts: { event: Electron.Event; window: BrowserWindow }) => void;
  onClosed?: (window: BrowserWindow) => void;
  onReadyToShow?: (window: BrowserWindow) => void;
  onShow?: (window: BrowserWindow) => void;
  onResize?: (window: BrowserWindow) => void;
  onResized?: (window: BrowserWindow) => void;
  onMove?: (window: BrowserWindow) => void;
  onMoved?: (window: BrowserWindow) => void;
  onBlur?: (window: BrowserWindow) => void;
  onFocus?: (window: BrowserWindow) => void;
};

export class BrowserWindow extends ElectronBrowserWindow {
  private identifier: string;
  private name: string;
  private url: string;

  constructor(opts: TBrowserWindowOptions) {
    const { identifier, name, url, ...rest } = opts;
    super(rest);

    this.identifier = identifier ?? getUID();
    this.name = name;
    this.url = url;

    this.loadUI();
  }

  getIdentifier() {
    return this.identifier;
  }

  getName() {
    return this.name;
  }

  loadUI(opts?: { url?: string }) {
    const url = opts?.url ?? this.url;
    if (!url) {
      throw getError({
        statusCode: ResultCodes.RS_5.InternalServerError,
        message: `[load] Identifier: ${this.identifier} | Name: ${this.name} | Invalid url to load!`,
      });
    }

    this.loadURL(url);
  }
}
