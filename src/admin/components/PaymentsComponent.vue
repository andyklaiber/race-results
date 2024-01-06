<script>
import _ from "lodash";
import ModalComponent from './ModalComponent.vue';
import EditPaymentComponent from './EditPaymentComponent.vue';
import request from "@/lib/ApiClient";
import dayjs from 'dayjs/esm/index.js';

export default {
  components: {
    ModalComponent,
    EditPaymentComponent,
  },
  data() {
    return {
      loading: false,
      error: null,
      races:[],
      filterKey:'',
      filterPayStatus:'all',
      filterEvent:false,
      filterPaytype:'all',
      filterOptionalPurchases: 'all',
      payments:[],
      selectedRaceId:'',
      showModal:false
    };
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  watch:{
    selectedRaceId:{
      handler(val){
       this.getPaymentsForRace(this.selectedRaceId);
      },
      immediate: true
    }
  },
  methods: {
    dollas(amtPennies) {
      if(!_.isNumber(amtPennies)){
        return '';
      }
      let amtDollas = parseFloat(amtPennies/100)
      return amtDollas.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route) {
        return request(`/api/races/`)
          .then((response) => {
            this.races = response.data;
            if(this.races.length > 0){
              this.selectedRaceId = this.races[0].raceid
            }
            this.loading = false;
            
          })
          .catch((err) => {
            this.loading = false;
            this.error = err.toString();
            console.error(err);
          });
      }
        
      
    },
    getPaymentsForRace(race_id){
      if(race_id){

        request(`/api/payments/${race_id}`)
        .then((response) => {
          this.payments = response.data;
          this.loading = false;
          
        })
        .catch((err) => {
          this.loading = false;
          this.error = err.toString();
          console.error(err);
        });
      }
    },
    editPayment(paymentId){
      let payment = _.clone(_.find(this.payments, {_id: paymentId}));
      if(payment){
        console.log('payment Data:')
        console.log(payment)
        this.paymentToEdit = payment;
        this.paymentFormMode = 'edit'
        this.showModal=true;
      }else{
        alert('no payment id found for racer')
      }
    },
    closeModal(){
      this.showModal = false
    }
  },
  computed: {
    loaded() {
      if (!this.payments) {
        return false;
      }
      return true;
    },
    raceSelectOptions(){
      let out ={};
      _.each(this.races,({raceid, displayName})=>out[raceid]=displayName)
      return out;
    },
    seriesRaces(){
      let selectedRaceData = _.find(this.races,{raceid:this.selectedRaceId});
      console.log('race data')
      console.log(selectedRaceData);
      if(!selectedRaceData || !selectedRaceData.series){
        return [];
      }
      console.log('series races')
      console.log()
      let out ={};
      _.each(_.filter(this.races, {series:selectedRaceData.series}),({raceid, displayName})=>out[raceid]=displayName)
      return out;
    },
    filterOptionalOptions(){
      let options = {"all":"All"};
      this.payments.forEach(({regData})=>{
        if(regData && regData.optionalPurchases){

          Object.keys(regData.optionalPurchases).forEach((optionName)=>{
            if(regData.optionalPurchases[optionName]=== true){
              options[optionName] = optionName;
            }
          })
        }
        })
      return options;
    },
    filterPayStatusOptions(){
      return {
        "all":"All",
        "unpaid":"unpaid",
        "paid":"paid"
      }
    },
    filterPayTypeOptions(){
      return {
        "all":"All",
        "season":"Season",
        "single":"Single",
        "cash":"cash"
      }
    },
    filteredPayments(){
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      if(this.payments && (filterKey.length || this.filterPayStatus !== 'all' || this.filterPaytype !== 'all' || this.filterOptionalPurchases !== 'all')){
        return _.filter(this.payments, (record)=>{
          if(this.filterOptionalPurchases !== 'all'){
            if(!record.regData.optionalPurchases || record.regData.optionalPurchases[this.filterOptionalPurchases] !== true){
              return false;
            }
          }
          if(this.filterPayStatus !== 'all'){
            if(this.filterPayStatus !== record.status){
              return false;
            }
          }
          if(this.filterPaytype !== 'all'){
            if(record.regData?.paytype !== this.filterPaytype){
              return false;
            }
          }
          if(parseInt(filterKey)){
                  return parseInt(filterKey) === parseInt(record.regData['bibNumber']);
          }
          return ['first_name','last_name'].some((key) => {
                
                return String(record.regData[key]).toLowerCase().indexOf(filterKey) > -1
              })
        });
      }
      return this.payments;
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <div
          class="
            d-flex
            justify-content-between
            flex-wrap flex-md-nowrap
            align-items-center
            pt-3
            pb-2
            mb-3
            border-bottom
          "
        >
        <div class="btn-toolbar mb-2 mb-md-0">
            <FormKit
                type="select"
                label="Select an Event:"
                name="selectedRace"
                v-model="selectedRaceId"
                :options="raceSelectOptions"
              />
          </div>  
        <div class="btn-toolbar mb-2 mb-md-0">
          <FormKit id='racerFilterTxtInput' type="text" name="search" label="Search:" help="search in first, last, bib number" :delay="300"
            v-model="filterKey" />
          </div>
        <div class="btn-toolbar mb-2 mb-md-0">
            <FormKit
                type="select"
                label="Filter by Status:"
                name="filterPayStatus"
                v-model="filterPayStatus"
                default="all"
                :options="filterPayStatusOptions"
              />
          </div>
        
          <div class="btn-toolbar mb-2 mb-md-0">
            <FormKit
                type="select"
                label="Filter by PayType:"
                name="filterPaytype"
                v-model="filterPaytype"
                default="all"
                :options="filterPayTypeOptions"
              />
          </div>
          <div class="btn-toolbar mb-2 mb-md-0">
            <FormKit
                type="select"
                label="Filter by optional purchases:"
                name="filterOptionalPurchases"
                v-model="filterOptionalPurchases"
                default="All"
                :options="filterOptionalOptions"
              />
          </div>
        </div>
        <div class="d-flex justify-content-between
            flex-wrap flex-md-nowrap
            align-items-center">
          <h2>Payments</h2><div class="h5">Count: {{ filteredPayments.length }}</div>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover table-sm">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">name</th>
                <th scope="col">Reg Email</th>
                <th scope="col">Race</th>
                <th scope="col">Paytype</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, idx) in filteredPayments" :key="idx">
                <td>{{payment.status}}</td>
                <td>{{payment.regData.first_name+' '+payment.regData.last_name}}</td>
                <td><a :href="`mailto:${payment.regData.email}`">{{payment.regData.email}}</a></td>
                <td>{{payment.regData.paytype}}</td>
                <td>{{dollas(payment.stripePayment?.amount_total)}}</td>
                <td><a :href="`/#/regconfirmation/${payment.regData.raceid}/${payment._id}`">Reg Confirmation Page</a></td>
                <td>{{payment.regData.bibNumber}}</td>
                <td><div class='btn btn-sm btn-secondary' v-if="payment.status !== 'unpaid' && payment.regData.paytype != 'season'" @click="editPayment(payment._id)">Edit</div>
                </td>
              </tr>

            </tbody>
          </table>
          <!-- <pre>
            {{payments[0]}}
          </pre> -->
          <Teleport to="body">
          <!-- use the modal component, pass in the prop -->
          <modal-component v-if="payments.length>0" :show="showModal" @close="closeModal">
            <template #body>
             <EditPaymentComponent :races="seriesRaces" :paymentData="paymentToEdit" :formMode="paymentFormMode" ></EditPaymentComponent>
            </template>
          </modal-component>
        </Teleport>
        </div>
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Error loading payments...</h2>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}
</style>
