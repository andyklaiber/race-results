<script>
import _ from "lodash";
import dayjs from '@/lib/dayjs'

export default {
  props: ["categories", "raceDate"],
  data() {
    return {};
  },
  methods: {
    formatStartTime(startTime) {
      return dayjs(`${dayjs(this.raceDate).format("YYYY-MM-DD")} ${startTime}`).format("h:mm A");
    },
  },
  computed: {
    groupByStartTimes() {
      let sorted = this.categories.toSorted((a, b) => dayjs(a.startTime, 'H:mm').diff(dayjs(b.startTime, 'H:mm')));
      return _.groupBy(sorted,
        "startTime"
      );
    },
    hasStartTimes(){
      return !!_.some(this.categories, 'startTime')
    }
  },
};
</script>

<template>
  <div v-if="categories.length && hasStartTimes">
    <h5>Race Start Times:</h5>
  <div class="row gap-5 mb-3">
    <div v-for="(timeGroup, time) in groupByStartTimes" :key="time" class="col-md-5">
        <h6 class="">{{formatStartTime(time)}}:</h6>
        <div class="row g-2 px-4 gx-4 border bg-light">
          <div v-for="category in groupByStartTimes[time]" :key="category.id" class="col-lg text-nowrap my-1">{{category.catdispname}}</div>
        </div>
  </div>
  </div>
  </div>
</template>