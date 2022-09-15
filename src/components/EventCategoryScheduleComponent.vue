<script>
import _ from "lodash";
import dayjs from 'dayjs/esm/index.js'

export default {
  props: ["categories", "raceDate"],
  data() {
    return {};
  },
  methods: {
    formatStartTime(startTime) {
      return dayjs(`${dayjs(this.raceDate).format("YYYY-MM-DD")} ${startTime}`).format("ddd, MMM D, h:mm A");
    },
  },
  computed: {
    groupByStartTimes() {
      return _.groupBy(
        _.orderBy(this.categories, ["startTime", "disporder"]),
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

    <div v-for="(timeGroup, time) in groupByStartTimes" :key="time" class="col">
        <h6 class="">{{formatStartTime(time)}}:</h6>
        <div class="row g-2 px-4 gx-4 border bg-light">
          <div v-for="category in groupByStartTimes[time]" :key="category.id" class="col-auto">{{category.catdispname}}</div>
        </div>
  </div>
  </div>
  </div>
</template>