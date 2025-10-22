export const hrTimeToPerformance = () => {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + nanoseconds / 1000000;
};
