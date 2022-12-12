<script>

export default {
  props: ["data","Pos"],
  data() {
    return {
      count: 0
    }
  },
  computed:{
  }
}
</script>

<template>
  <td>{{Pos + 1}}</td>
  <td>{{data.Bib}}</td>
  <td>{{data.Name}}</td>
  <td>{{data.Age}}</td>
  <td>{{data.Sponsor}}</td>
  <td :class='{"text-danger":race.dropped}' v-for="(race, idx) in data.results" :key="idx">{{race.resultString}}</td>
  <td>{{data.seriesPoints}}</td>

</template>

<style>

.dropped {
color: #ff7676;
}
</style>