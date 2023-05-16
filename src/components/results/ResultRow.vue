<script>

let msToTimeString = (ms, showMillis = false)=>{
    const d = new Date(Date.UTC(0,0,0,0,0,0,ms)),
    parts = [
        d.getUTCMinutes(),
        d.getUTCSeconds()
    ]
    let minSecMillis=parts.map(s => String(s).padStart(2,'0')).join(':');
    if(showMillis){
      minSecMillis = minSecMillis.concat('.'+`${d.getUTCMilliseconds()}`.padStart(3,'0'));
    }
    if(d.getUTCHours()){
        minSecMillis = d.getUTCHours() + ":" +minSecMillis;
    }
    return minSecMillis;
}

export default {
  props: ["data","Pos","totLaps", "showMillis"],
  data() {
    return {
      count: 0
    }
  },
  methods:{
    msToTimeString(millis){
      return msToTimeString(millis, this.showMillis);
    }
  },

  computed:{
      incompleteLaps(){
          let filler = new Array(this.totLaps - this.data.laps.length);
          return filler.fill('-') 
      },
      formattedTime(){
          return msToTimeString(this.data.duration, this.showMillis);
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
  <td v-for="(lap, idx) in data.laps" :key="idx">{{msToTimeString(lap.duration)}}</td>
  <template v-if="totLaps-data.laps.length > 0">
      <td v-for="fill in incompleteLaps">{{fill}}</td>
  </template>
  <td>{{formattedTime}}</td>
  <td>{{data.back || "-"}}</td>

</template>