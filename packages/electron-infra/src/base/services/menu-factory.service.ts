import { BaseService } from '@minimaltech/node-infra';
import { BrowserWindow } from '../models';

// --------------------------------------------------------------------------------
export abstract class AbstractMenuFactory extends BaseService {
  abstract getMenu(window: BrowserWindow): Promise<Electron.Menu>;
}
