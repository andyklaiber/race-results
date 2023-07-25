<script>

export default {
  props: ["data","Pos","dates"],
  data() {
    return {
      count: 0,
    }
  },
  computed:{
  }
}
</script>

<template>
  <td>{{data.Name}}</td>
  <td>{{data.Cat}}</td>
  <td v-for="(race, idx) in dates" :key="idx">{{data[race] || '-'}}</td>

</template>