import dayjs from 'dayjs/esm/index.js';
import utc from 'dayjs/plugin/utc';
import minMax from 'dayjs/plugin/minMax';
dayjs.extend(minMax)
dayjs.extend(utc)

export default dayjs;