export type TMigrationProcess = {
  name: string;
  cleanFn?: Function;
  fn: Function;
  options?: {
    alwaysRun?: boolean;
    [key: string | symbol]: any;
  };
};
