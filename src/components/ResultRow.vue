<script>

export default {
  props: ["data","Pos","totLaps"],
  data() {
    return {
      count: 0
    }
  },
  computed:{
      incompleteLaps(){
          let filler = new Array(this.totLaps - this.data.laps.length);
          return filler.fill('-') 
      }
  }
}
</script>

<template>
  <td>{{Pos + 1}}</td>
  <td>{{data.Bib}}</td>
  <td>{{data.Name}}</td>
  <!-- <td>{{data.Age}}</td> -->
  <td>{{data.Sponsor}}</td>
  <td v-for="(lap, idx) in data.laps" :key="idx">{{lap.timeString}}</td>
  <template v-if="totLaps-data.laps.length > 0">
      <td v-for="fill in incompleteLaps">{{fill}}</td>
  </template>
  <td>{{data.Time}}</td>
  <td>{{data.back || "-"}}</td>

</template>