<script>

export default {
  props: ["data","Pos"],
  data() {
    return {
      count: 0,
      dates: ["5/4","5/11","5/18","5/25"]
    }
  },
  computed:{
  }
}
</script>

<template>
  <td>{{data.Name}}</td>
  <td>{{data.Cat}}</td>
  <td v-for="(race, idx) in dates" :key="idx">{{data[race]}}</td>

</template>