import { IRepository } from '../repositories';

// ----------------------------------------------------------------------------------------------------------------------------------------
// Controller Interface
// ----------------------------------------------------------------------------------------------------------------------------------------
export interface IController {}

export interface ICrudController extends IController {
  defaultLimit: number;
  relation?: { name: string; type: string };
  repository?: IRepository;
  sourceRepository?: IRepository;
  targetRepository?: IRepository;
}

export interface IControllerOptions {
  scope: string;
  path: string;
  isStrict?: boolean;
}
