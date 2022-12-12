import dayjs from 'dayjs/esm/index.js';
import utc from 'dayjs/plugin/utc';
import minMax from 'dayjs/plugin/minMax';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(minMax)
dayjs.extend(utc)
dayjs.extend(relativeTime)

export default dayjs;