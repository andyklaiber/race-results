<script>
import ResultRow from './components/ResultRow.vue';

let dataUrl = '/public/data/pcrs-race-1.json'
if(import.meta.env.DEV){
    dataUrl = "http://localhost:3000"+dataUrl;
}

export default {
  components: {
    ResultRow
  },
  data() {
    return {
  	categories: {}
    }
  },
  mounted: function(){
  	let $this = this
    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
        $this.categories = data.categories
        })
	}
}
</script>

<template>
<div class="text-center">
    <h2>2022 Prairie City Race Series</h2>
    <h2>Preliminary Race Results - Wednesday March 23</h2>
</div>
<div class="container text-center">
    <template  v-for="(cat, key) in categories" :key="cat.id">
    <a :href="'#'+key">{{cat.catdispname}}</a>&nbsp
    </template>
</div>
<div class="container-fluid">
<div v-for="(cat, key) in categories" :key="cat.id" class="mt-5">
  
  <h3 :id="key" >{{cat.catdispname}}</h3>
  <table class="table table-striped table-hover">
    <thead>
    <tr>
      <th v-for="(columnName, index) in cat.columns" scope="col" :key="index">{{columnName}}</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(racer, idx) in cat.results" :key="idx" >
        <ResultRow :totLaps="cat.laps" :Pos="idx" :data="racer" />
    </tr>
  </tbody>
</table>
</div>
</div>
</template>

<style>
@import "./assets/base.css";

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;

  font-weight: normal;
}
</style>
