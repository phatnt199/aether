import { float } from '.';

const DEFAULT_PERFORMANCE_DECIMAL = 6;

export const getPerformanceCheckpoint = () => {
  return performance.now();
};

export const getExecutedPerformance = (opts: { from: number; digit?: number }) => {
  return float(performance.now() - opts.from, opts.digit ?? DEFAULT_PERFORMANCE_DECIMAL);
};
