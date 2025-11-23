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
  props: {
    stripePaymentId: {
      type: String,
      default: null
    },
    paymentId: {
      type: String,
      default: null
    }
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
      showModal:false,
      orphanedPayments: [],
      orphanedLoading: false,
      orphanedError: null,
      fixingOrphaned: false,
      fixResults: null,
      duplicatePayments: [],
      duplicatesLoading: false,
      duplicatesError: null,
      showDetailsModal: false,
      selectedPaymentDetails: null
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
    async getReceipt(paymentId) {
      try {
        const response = await request(`/api/payments/receipt?payment_id=${paymentId}`);
        if (response.data && response.data.receipt_url) {
          window.open(response.data.receipt_url, '_blank');
        }
      } catch (err) {
        console.error('Error fetching receipt:', err);
        alert('Unable to retrieve receipt. This payment may not have a Stripe receipt available.');
      }
    },
    hasStripeReceipt(payment) {
      return payment.stripePayment && 
             payment.stripePayment.payment_intent && 
             payment.status === 'paid' &&
             payment.stripePayment.amount_total > 0;
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
    },
    isSponsoredCategory(record) {
      if (!this.selectedRaceData || !this.selectedRaceData.regCategories || !record.regData?.category) {
        return false;
      }
      const category = _.find(this.selectedRaceData.regCategories, { id: record.regData.category });
      return category?.sponsored === true;
    },
    async checkOrphanedPayments() {
      if (!this.selectedRaceId) {
        return;
      }
      
      this.orphanedLoading = true;
      this.orphanedError = null;
      this.fixResults = null;
      
      try {
        const response = await request(`/api/payments/admin/orphaned-payments?raceid=${this.selectedRaceId}`);
        this.orphanedPayments = response.data.payments || [];
      } catch (err) {
        console.error('Error checking orphaned payments:', err);
        this.orphanedError = err.message || 'Failed to check orphaned payments';
      } finally {
        this.orphanedLoading = false;
      }
    },
    async fixOrphanedPayments() {
      if (!this.selectedRaceId || this.orphanedPayments.length === 0) {
        return;
      }
      
      const confirmed = confirm(
        `This will retry registration for ${this.orphanedPayments.length} orphaned payment(s). ` +
        `Confirmation emails will NOT be sent. Continue?`
      );
      
      if (!confirmed) {
        return;
      }
      
      this.fixingOrphaned = true;
      this.orphanedError = null;
      
      try {
        const response = await request.post('/api/payments/admin/batch-retry-registration', {
          raceid: this.selectedRaceId,
          sendEmails: false
        });
        
        this.fixResults = response.data;
        
        // Refresh the orphaned payments list
        await this.checkOrphanedPayments();
        
        // Refresh the main payments list
        await this.getPaymentsForRace(this.selectedRaceId);
        
        // Show results
        const { successful, failed, alreadyRegistered } = this.fixResults;
        let message = `Results:\n`;
        message += `✓ Successfully registered: ${successful.length}\n`;
        if (alreadyRegistered.length > 0) {
          message += `ℹ Already registered: ${alreadyRegistered.length}\n`;
        }
        if (failed.length > 0) {
          message += `✗ Failed: ${failed.length}\n`;
        }
        alert(message);
        
      } catch (err) {
        console.error('Error fixing orphaned payments:', err);
        this.orphanedError = err.message || 'Failed to fix orphaned payments';
        alert('Error: ' + this.orphanedError);
      } finally {
        this.fixingOrphaned = false;
      }
    },
    async retryOrphanedPayment(paymentId) {
      const confirmed = confirm('Retry registration for this payment? No confirmation email will be sent.');
      
      if (!confirmed) {
        return;
      }
      
      try {
        const response = await request.post('/api/payments/admin/retry-registration', {
          paymentId: paymentId
        });
        
        alert('Registration completed successfully!');
        
        // Refresh lists
        await this.checkOrphanedPayments();
        await this.getPaymentsForRace(this.selectedRaceId);
        
      } catch (err) {
        console.error('Error retrying payment:', err);
        alert('Error: ' + (err.message || 'Failed to retry registration'));
      }
    },
    async checkDuplicatePayments() {
      if (!this.selectedRaceId) {
        return;
      }
      
      this.duplicatesLoading = true;
      this.duplicatesError = null;
      
      try {
        const response = await request(`/api/payments/admin/duplicate-payments?raceid=${this.selectedRaceId}`);
        this.duplicatePayments = response.data.duplicates || [];
      } catch (err) {
        console.error('Error checking duplicate payments:', err);
        this.duplicatesError = err.message || 'Failed to check duplicate payments';
      } finally {
        this.duplicatesLoading = false;
      }
    },
    async deletePayment(paymentId, personName) {
      const confirmed = confirm(
        `Are you sure you want to delete this payment record for ${personName}?\n\n` +
        `This will:\n` +
        `- Delete the payment record\n` +
        `- Remove the racer from the race registration\n\n` +
        `This action cannot be undone!`
      );
      
      if (!confirmed) {
        return;
      }
      
      try {
        await request.delete(`/api/payments/admin/payment/${paymentId}`);
        
        alert('Payment deleted successfully!');
        
        // Refresh lists
        await this.checkDuplicatePayments();
        await this.getPaymentsForRace(this.selectedRaceId);
        
      } catch (err) {
        console.error('Error deleting payment:', err);
        alert('Error: ' + (err.message || 'Failed to delete payment'));
      }
    },
    showPaymentDetails(payment) {
      this.selectedPaymentDetails = payment;
      this.showDetailsModal = true;
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
      this.selectedPaymentDetails = null;
    },
    getStripePaymentLink(payment) {
      if (!payment.stripePayment?.payment_intent) {
        return null;
      }
      // Stripe dashboard payment link format for Connect accounts
      const isTestMode = payment.stripePayment.livemode === false;
      const baseUrl = isTestMode ? 'https://dashboard.stripe.com/test' : 'https://dashboard.stripe.com';
      
      // Check if this is a Connect account payment
      // The on_behalf_of field or account field indicates the connected account
      const connectedAccount = payment.stripePayment.on_behalf_of || payment.stripePayment.account;
      
      if (connectedAccount) {
        // For Connect accounts, use the connect/accounts/{account_id}/payments format
        return `${baseUrl}/connect/accounts/${connectedAccount}/payments/${payment.stripePayment.payment_intent}`;
      }
      
      // For platform payments
      return `${baseUrl}/payments/${payment.stripePayment.payment_intent}`;
    },
    getStripeCustomerLink(payment) {
      if (!payment.stripePayment?.customer) {
        return null;
      }
      const isTestMode = payment.stripePayment.livemode === false;
      const baseUrl = isTestMode ? 'https://dashboard.stripe.com/test' : 'https://dashboard.stripe.com';
      
      // Check if this is a Connect account payment
      const connectedAccount = payment.stripePayment.on_behalf_of || payment.stripePayment.account;
      
      if (connectedAccount) {
        // For Connect accounts, use the connect/accounts/{account_id}/customers format
        return `${baseUrl}/connect/accounts/${connectedAccount}/customers/${payment.stripePayment.customer}`;
      }
      
      // For platform customers
      return `${baseUrl}/customers/${payment.stripePayment.customer}`;
    },
    formatStripeDate(timestamp) {
      if (!timestamp) return '-';
      return dayjs(timestamp * 1000).format('MMM DD, YYYY HH:mm:ss');
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
    selectedRaceData(){
      return _.find(this.races, {raceid: this.selectedRaceId});
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
        "paid":"paid",
        "free":"free"
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
      
      // First, filter by payment ID or Stripe payment ID if provided
      let filtered = this.payments;
      if (this.paymentId) {
        filtered = _.filter(this.payments, (record) => {
          return record._id === this.paymentId;
        });
      } else if (this.stripePaymentId) {
        filtered = _.filter(this.payments, (record) => {
          return record.stripePayment?.payment_intent === this.stripePaymentId ||
                 record.payment_id === this.stripePaymentId;
        });
      }
      
      // Then apply other filters
      if(filtered && (filterKey.length || this.filterPayStatus !== 'all' || this.filterPaytype !== 'all' || this.filterOptionalPurchases !== 'all')){
        return _.filter(filtered, (record)=>{
          if(this.filterOptionalPurchases !== 'all'){
            if(!record.regData.optionalPurchases || record.regData.optionalPurchases[this.filterOptionalPurchases] !== true){
              return false;
            }
          }
          if(this.filterPayStatus !== 'all'){
            if(this.filterPayStatus === 'free'){
              // Free includes volunteers and racers in sponsored categories
              const isVolunteer = record.regData?.paytype === 'volunteer';
              const isSponsored = this.isSponsoredCategory(record);
              if(!isVolunteer && !isSponsored){
                return false;
              }
            } else {
              if(this.filterPayStatus !== record.status){
                return false;
              }
              // For paid status, also check that a non-zero amount was paid
              if(this.filterPayStatus === 'paid'){
                if(!record.stripePayment?.amount_total || record.stripePayment.amount_total === 0){
                  return false;
                }
              }
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
      return filtered;
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <!-- Payment ID Filter Alert -->
      <div v-if="paymentId || stripePaymentId" class="alert alert-info alert-dismissible fade show mb-3" role="alert">
        <i class="bi bi-funnel-fill me-2"></i>
        <strong v-if="paymentId">Filtering by Payment Record ID:</strong>
        <strong v-else-if="stripePaymentId">Filtering by Stripe Payment ID:</strong>
        <code>{{ paymentId || stripePaymentId }}</code>
        <button type="button" class="btn-close" @click="$router.push({ name: 'payments' })" aria-label="Clear filter"></button>
      </div>

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

        <!-- Orphaned Payments Section -->
        <div class="card mb-4 border-warning">
          <div class="card-header bg-warning bg-opacity-10">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                Orphaned Payments Check
              </h5>
              <button 
                class="btn btn-sm btn-warning" 
                @click="checkOrphanedPayments"
                :disabled="orphanedLoading || !selectedRaceId">
                <span v-if="orphanedLoading">Checking...</span>
                <span v-else>Check for Orphaned Payments</span>
              </button>
            </div>
          </div>
          <div class="card-body" v-if="orphanedPayments.length > 0 || orphanedError">
            <div v-if="orphanedError" class="alert alert-danger">
              {{ orphanedError }}
            </div>
            <div v-else-if="orphanedPayments.length > 0">
              <div class="alert alert-warning">
                <strong>Found {{ orphanedPayments.length }} orphaned payment(s)</strong> - 
                These payments were completed but registration was not saved.
              </div>
              <div class="mb-3">
                <button 
                  class="btn btn-primary" 
                  @click="fixOrphanedPayments"
                  :disabled="fixingOrphaned">
                  <span v-if="fixingOrphaned">Fixing...</span>
                  <span v-else>Fix All Orphaned Payments</span>
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Category</th>
                      <th>Pay Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="payment in orphanedPayments" :key="payment._id">
                      <td>{{ payment.regData.first_name }} {{ payment.regData.last_name }}</td>
                      <td>{{ payment.regData.email }}</td>
                      <td>{{ payment.regData.category }}</td>
                      <td>{{ payment.regData.paytype }}</td>
                      <td>{{ dollas(payment.amount) }}</td>
                      <td>{{ payment.created ? dayjs(payment.created).format('MM/DD/YY HH:mm') : '-' }}</td>
                      <td>
                        <button 
                          class="btn btn-sm btn-success" 
                          @click="retryOrphanedPayment(payment._id)">
                          Retry
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="alert alert-success">
              <i class="bi bi-check-circle-fill me-2"></i>
              No orphaned payments found for this race.
            </div>
          </div>
        </div>

        <!-- Duplicate Payments Section -->
        <div class="card mb-4 border-danger">
          <div class="card-header bg-danger bg-opacity-10">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-files text-danger me-2"></i>
                Duplicate Payments Check
              </h5>
              <button 
                class="btn btn-sm btn-danger" 
                @click="checkDuplicatePayments"
                :disabled="duplicatesLoading || !selectedRaceId">
                <span v-if="duplicatesLoading">Checking...</span>
                <span v-else>Check for Duplicate Payments</span>
              </button>
            </div>
          </div>
          <div class="card-body" v-if="duplicatePayments.length > 0 || duplicatesError">
            <div v-if="duplicatesError" class="alert alert-danger">
              {{ duplicatesError }}
            </div>
            <div v-else-if="duplicatePayments.length > 0">
              <div class="alert alert-danger">
                <strong>Found {{ duplicatePayments.length }} person(s) with duplicate payments</strong> - 
                Review and delete unwanted payment records.
              </div>
              
              <div v-for="duplicate in duplicatePayments" :key="duplicate.key" class="mb-4">
                <h6 class="border-bottom pb-2">
                  {{ duplicate.first_name }} {{ duplicate.last_name }} - {{ duplicate.category }}
                  <span class="badge bg-danger ms-2">{{ duplicate.count }} payments</span>
                  <span v-if="duplicate.registeredCount > 0" class="badge bg-success ms-2">
                    {{ duplicate.registeredCount }} registered
                  </span>
                  <span v-else class="badge bg-warning ms-2">
                    None registered
                  </span>
                </h6>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Email</th>
                        <th>Pay Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Bib</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="payment in duplicate.payments" :key="payment._id" 
                          :class="{'table-success': payment.isRegistered}">
                        <td>
                          <span v-if="payment.isRegistered" class="badge bg-success">
                            <i class="bi bi-check-circle-fill"></i> Registered
                          </span>
                          <span v-else class="badge bg-secondary">
                            Not Registered
                          </span>
                        </td>
                        <td>{{ payment.regData.email }}</td>
                        <td>{{ payment.regData.paytype }}</td>
                        <td>{{ dollas(payment.amount) }}</td>
                        <td>{{ payment.created ? dayjs(payment.created).format('MM/DD/YY HH:mm') : '-' }}</td>
                        <td>{{ payment.regData.bibNumber || '-' }}</td>
                        <td>
                          <button 
                            class="btn btn-sm btn-danger" 
                            @click="deletePayment(payment._id, `${duplicate.first_name} ${duplicate.last_name}`)"
                            :disabled="payment.isRegistered && duplicate.registeredCount === 1"
                            :title="payment.isRegistered && duplicate.registeredCount === 1 ? 'Cannot delete the only registered payment' : 'Delete this payment'">
                            Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div v-else class="alert alert-success">
              <i class="bi bi-check-circle-fill me-2"></i>
              No duplicate payments found for this race.
            </div>
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
                <th scope="col">Paytype</th>
                <th scope="col">Sponsored</th>
                <th scope="col">Amount</th>
                <th scope="col">Bib</th>
                <th scope="col">Confirmation</th>
                <th scope="col">Receipt</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, idx) in filteredPayments" :key="idx">
                <td>{{payment.status}}</td>
                <td>{{payment.regData.first_name+' '+payment.regData.last_name}}</td>
                <td><a :href="`mailto:${payment.regData.email}`">{{payment.regData.email}}</a></td>
                <td>{{payment.regData.paytype}}</td>
                <td>{{isSponsoredCategory(payment) ? 'Yes' : ''}}</td>
                <td>{{dollas(payment.stripePayment?.amount_total)}}</td>
                <td>{{payment.regData.bibNumber}}</td>
                <td><a :href="`/#/regconfirmation/${payment.regData.raceid}/${payment._id}`" target="_blank">View</a></td>
                <td>
                  <button 
                    v-if="hasStripeReceipt(payment)" 
                    class="btn btn-sm btn-primary" 
                    @click="getReceipt(payment._id)"
                    title="View Stripe Receipt">
                    Receipt
                  </button>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <button class='btn btn-sm btn-info me-1' @click="showPaymentDetails(payment)" title="View Details">
                    <i class="bi bi-info-circle"></i> Details
                  </button>
                  <button class='btn btn-sm btn-secondary' v-if="payment.status !== 'unpaid' && payment.regData.paytype != 'season'" @click="editPayment(payment._id)">Edit</button>
                </td>
              </tr>

            </tbody>
          </table>
          <!-- <pre>
            {{payments[0]}}
          </pre> -->
          <Teleport to="body">
          <!-- Edit payment modal -->
          <modal-component v-if="payments.length>0" :show="showModal" @close="closeModal">
            <template #body>
             <EditPaymentComponent :races="seriesRaces" :paymentData="paymentToEdit" :formMode="paymentFormMode" ></EditPaymentComponent>
            </template>
          </modal-component>

          <!-- Payment details modal -->
          <modal-component :show="showDetailsModal" @close="closeDetailsModal">
            <template #header>
              <h4 class="modal-title">Payment Details</h4>
            </template>
            <template #body>
              <div v-if="selectedPaymentDetails" class="payment-details">
                <!-- Coupon/Sponsored Alert -->
                <div v-if="selectedPaymentDetails.sponsoredPayment || (selectedPaymentDetails.regData.coupon && !selectedPaymentDetails.stripePayment)" class="alert alert-info mb-3">
                  <h5 class="alert-heading">
                    <i class="bi bi-gift-fill me-2"></i>Sponsored/Free Registration
                  </h5>
                  <p class="mb-2">This registration was completed without payment.</p>
                  <p v-if="selectedPaymentDetails.regData.coupon" class="mb-0">
                    <strong>Coupon Code:</strong> <span class="badge bg-info fs-6">{{ selectedPaymentDetails.regData.coupon }}</span>
                    <span v-if="selectedPaymentDetails.regData.fractionDiscount" class="ms-2">
                      ({{ (selectedPaymentDetails.regData.fractionDiscount * 100).toFixed(0) }}% discount)
                    </span>
                  </p>
                  <p v-if="selectedPaymentDetails.sponsoredPayment" class="mb-0 text-muted">
                    <small>Marked as sponsored payment in system</small>
                  </p>
                </div>

                <!-- Registration Information -->
                <div class="card mb-3">
                  <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-person-fill me-2"></i>Registration Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <p><strong>Name:</strong> {{ selectedPaymentDetails.regData.first_name }} {{ selectedPaymentDetails.regData.last_name }}</p>
                        <p><strong>Email:</strong> <a :href="`mailto:${selectedPaymentDetails.regData.email}`">{{ selectedPaymentDetails.regData.email }}</a></p>
                        <p><strong>Category:</strong> {{ selectedPaymentDetails.regData.category }}</p>
                        <p><strong>Bib Number:</strong> {{ selectedPaymentDetails.regData.bibNumber || 'Not assigned' }}</p>
                      </div>
                      <div class="col-md-6">
                        <p><strong>Race ID:</strong> {{ selectedPaymentDetails.regData.raceid }}</p>
                        <p><strong>Payment Type:</strong> {{ selectedPaymentDetails.regData.paytype }}</p>
                        <p><strong>Status:</strong> <span class="badge" :class="{'bg-success': selectedPaymentDetails.status === 'paid', 'bg-warning': selectedPaymentDetails.status === 'unpaid'}">{{ selectedPaymentDetails.status }}</span></p>
                        <p v-if="selectedPaymentDetails.regData.team"><strong>Team:</strong> {{ selectedPaymentDetails.regData.team }}</p>
                      </div>
                    </div>
                    
                    <!-- Optional Purchases -->
                    <div v-if="selectedPaymentDetails.regData.optionalPurchases && Object.keys(selectedPaymentDetails.regData.optionalPurchases).length > 0" class="mt-3">
                      <h6>Optional Purchases:</h6>
                      <ul class="list-unstyled">
                        <li v-for="(value, key) in selectedPaymentDetails.regData.optionalPurchases" :key="key">
                          <i class="bi bi-check-circle-fill text-success me-2" v-if="value"></i>
                          {{ key }}: {{ value }}
                        </li>
                      </ul>
                    </div>

                    <!-- Emergency Contact -->
                    <div v-if="selectedPaymentDetails.regData.emergencyContact" class="mt-3">
                      <h6>Emergency Contact:</h6>
                      <p class="mb-1"><strong>Name:</strong> {{ selectedPaymentDetails.regData.emergencyContact }}</p>
                      <p class="mb-0" v-if="selectedPaymentDetails.regData.emergencyPhone"><strong>Phone:</strong> {{ selectedPaymentDetails.regData.emergencyPhone }}</p>
                    </div>
                  </div>
                </div>

                <!-- Stripe Payment Information -->
                <div v-if="selectedPaymentDetails.stripePayment" class="card mb-3">
                  <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="bi bi-credit-card-fill me-2"></i>Stripe Payment Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <p><strong>Amount:</strong> {{ dollas(selectedPaymentDetails.stripePayment.amount_total) }}</p>
                        <p><strong>Currency:</strong> {{ selectedPaymentDetails.stripePayment.currency?.toUpperCase() }}</p>
                        <p><strong>Payment Status:</strong> <span class="badge bg-success">{{ selectedPaymentDetails.stripePayment.payment_status }}</span></p>
                        <p><strong>Mode:</strong> <span class="badge" :class="selectedPaymentDetails.stripePayment.livemode ? 'bg-danger' : 'bg-warning'">{{ selectedPaymentDetails.stripePayment.livemode ? 'Live' : 'Test' }}</span></p>
                      </div>
                      <div class="col-md-6">
                        <p><strong>Created:</strong> {{ formatStripeDate(selectedPaymentDetails.stripePayment.created) }}</p>
                        <p v-if="selectedPaymentDetails.stripePayment.payment_intent"><strong>Payment Intent:</strong> <code class="small">{{ selectedPaymentDetails.stripePayment.payment_intent }}</code></p>
                        <p v-if="selectedPaymentDetails.stripePayment.customer"><strong>Customer ID:</strong> <code class="small">{{ selectedPaymentDetails.stripePayment.customer }}</code></p>
                      </div>
                    </div>

                    <!-- Stripe Dashboard Links -->
                    <div class="mt-3 d-flex gap-2">
                      <a v-if="getStripePaymentLink(selectedPaymentDetails)" 
                         :href="getStripePaymentLink(selectedPaymentDetails)" 
                         target="_blank" 
                         class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-box-arrow-up-right me-1"></i>View in Stripe Dashboard
                      </a>
                      <a v-if="getStripeCustomerLink(selectedPaymentDetails)" 
                         :href="getStripeCustomerLink(selectedPaymentDetails)" 
                         target="_blank" 
                         class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-person-badge me-1"></i>View Customer
                      </a>
                    </div>

                    <!-- Payment Method Details -->
                    <div v-if="selectedPaymentDetails.stripePayment.payment_method_types" class="mt-3">
                      <p><strong>Payment Methods:</strong> {{ selectedPaymentDetails.stripePayment.payment_method_types.join(', ') }}</p>
                    </div>
                  </div>
                </div>

                <!-- No Stripe Payment Notice -->
                <div v-else class="card mb-3">
                  <div class="card-header bg-light">
                    <h5 class="mb-0"><i class="bi bi-credit-card me-2"></i>Payment Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="alert alert-secondary mb-0">
                      <i class="bi bi-info-circle me-2"></i>
                      No Stripe payment associated with this registration.
                      <span v-if="selectedPaymentDetails.sponsoredPayment || selectedPaymentDetails.regData.coupon">
                        This was a sponsored or free entry.
                      </span>
                    </div>
                  </div>
                </div>

                <!-- System Information -->
                <div class="card">
                  <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0"><i class="bi bi-gear-fill me-2"></i>System Information</h5>
                  </div>
                  <div class="card-body">
                    <p><strong>Payment Record ID:</strong> <code>{{ selectedPaymentDetails._id }}</code></p>
                    <p v-if="selectedPaymentDetails.payment_id"><strong>Stripe Session ID:</strong> <code class="small">{{ selectedPaymentDetails.payment_id }}</code></p>
                    <p v-if="selectedPaymentDetails.sponsoredPayment"><strong>Sponsored Payment:</strong> <span class="badge bg-success">Yes</span></p>
                  </div>
                </div>
              </div>
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
