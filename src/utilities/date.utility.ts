import dayjs from 'dayjs';

import CustomParseFormatPlugin from 'dayjs/plugin/customParseFormat';
import IsoWeekPlugin from 'dayjs/plugin/isoWeek';
import TimezonePlugin from 'dayjs/plugin/timezone';
import UTCPlugin from 'dayjs/plugin/utc';
import WeekdayPlugin from 'dayjs/plugin/weekday';
import { float } from './parse.utility';

dayjs.extend(CustomParseFormatPlugin);
dayjs.extend(UTCPlugin);
dayjs.extend(TimezonePlugin);
dayjs.extend(WeekdayPlugin);
dayjs.extend(IsoWeekPlugin);

const tz = process.env.APP_ENV_APPLICATION_TIMEZONE ?? 'Asia/Ho_Chi_Minh';
dayjs.tz.setDefault(tz);

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isWeekday = (date: dayjs.Dayjs) => {
  const isoWeekday = dayjs(date)?.isoWeekday();
  return isoWeekday > 0 && isoWeekday < 6;
};

export const getPreviousWeekday = () => {
  let date = dayjs();
  while (!isWeekday(date)) {
    date = date.subtract(1, 'day');
  }

  return date;
};

export const getNextWeekday = () => {
  let date = dayjs();
  while (!isWeekday(date)) {
    date = date.add(1, 'day');
  }

  return date;
};

export const getDateTz = (opts: {
  date: string;
  timezone: string;
  useClientTz?: boolean;
  timeOffset?: number;
}) => {
  const { date, timezone, useClientTz = false, timeOffset = 0 } = opts;
  return dayjs(date).tz(timezone, useClientTz).add(timeOffset, 'hour');
};

export const hrTime = () => {
  const curr = process.hrtime();
  return float(curr[0] + curr[1] / 10 ** 9, 9);
};

export { dayjs };
