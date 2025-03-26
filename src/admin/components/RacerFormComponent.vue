<script>
import _ from "lodash";
import dayjs from 'dayjs/esm/index.js';
import request from "@/lib/ApiClient";

export default {
    props: [
        "racerData",
        "categories",
        "payments",
        "formMode",
        "series"
    ],
    emits: ['saved'],
    data() {
        return {
            birthdate: "",
            formError: [],
            submitted: false,
            paymentType: 'season',
            prevBibError:[],
            formInputData: {},
        }
    },
    mounted() {
        if(this.formMode ==='create'){
            this.paymentType = this.racerData.paytype;
            return;
        }
        if(this.formMode ==='edit' || this.formMode === 'regcash'){
            this.formInputData = this.racerData;
        }
        _.defer(()=>{
            let bibNode = document.querySelector('#bibNumber');
            bibNode.focus();
        });
    },
    computed: {
        sortedCats() {
            let cats = {};
            _.forEach(
                _.orderBy(this.categories, "disporder"),
                (element) => {
                    cats[element.id] = element.catdispname;
                }
            );

            return cats;
        },
        paymentOptions() {
            let options = {};
            _.forEach(this.payments, (element) => {
                options[element.type] = element.name;
            });
            options['cash'] = 'Cash Single Entry';
            options['volunteer'] = 'Volunteer Single Entry';
            options['season'] = 'Season Comp';
            return options;
        },
        racerAge() {
            if (this.birthdate) {
                //calculate racer age on dec 31
                const dec31 = dayjs();
                const bday = dayjs(this.birthdate);

                return dec31.year() - bday.year();

            }
        },
        unpaidReg() {
            if(this.formMode === 'create'){
                return this.paymentType == 'cash';
            }
            return this.paymentType == 'cash' && this.racerData.status == 'unpaid';
        },
        paymentAmount() {
            if (this.racerData.paytype === 'cash') {
                let payOpt = _.find(this.payments, { type: 'single' })
                if(!payOpt){
                    return null;
                }
                return payOpt.amount;
            }
        }
    },
    methods: {
        dollas(amt) {
            if (typeof amt === 'string') {
                amt = parseInt(amt);
            }
            if(amt !== 0 &&!amt){
                return '';
            }
            return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
        },
        findPrevBib(bibNumber) {
            request.post(`/api/racers/bib/${bibNumber}`, {
                series: `${this.series}`,
            })
                .then(({ data }) => {
                    console.log('prevbib')
                    console.log(data);
                    if (data.paytype === 'season') {
                        this.prevBibError = ['Racer is already registered for the whole season'];
                        return;
                    }
                    //   if(data.raceid == this.$route.params.raceid){
                    //     this.prevBibError = ['Racer is already registered for this race'];
                    //       //return; 
                    //   }
                    data.prevPaymentId = data.paymentId;
                    delete data.paymentId;
                    delete data.paymentReceived;
                    delete data.raceid;

                    this.formInputData = data;
                    this.prevAge = data.racerAge
                })
                .catch(({ response }) => {
                    console.dir(response)
                    if (response.status == 404) {
                        this.prevBibError = [response.data.message]
                    }
                })

        },
        onPrevBibChange(data) {
            if (data) {
                this.findPrevBib(data);
            } else {
                this.prevBibError = [];
                this.prevAge = null;
            }
        },
        async submitHandler(formData) {
            console.log(formData);

            let requestPromise;
            if (this.formMode === 'create' || this.formMode === 'regcash') {
                let paymentAmount = this.paymentAmount;
                if (formData.paytype == 'season' || formData.paytype == 'volunteer') {
                    paymentAmount = 0;
                    formData.compedEntry = true;
                }
                requestPromise = request
                    .post(
                        `/api/payments/register`,
                        { ...formData, paymentAmount },
                        {
                            params: {
                                paymentId: formData.paymentId,
                                raceId: this.$route.params.raceid
                            }
                        }
                    )
            } else {
                delete formData.status;
                requestPromise = request
                    .patch(
                        `/api/racers/race/${this.$route.params.raceid}`,
                        formData,
                        {
                            params: {
                                paymentId: this.racerData.paymentId
                            }
                        }
                    )
            }
            return await requestPromise.then((response) => {
                if (response.data) {
                    this.submitted = true;
                    console.log('response data');
                    console.log(response.data);
                    return new Promise((resolve) =>
                        setTimeout(() => {
                            this.$emit('saved');
                            resolve();
                        }, 100)
                    );
                }
            })
                .catch((error) => {
                    this.formError = ["Error submitting request"];
                    console.log(error);
                });
        }
    }
}
</script>
    
<template>
    <div class="modal-header">
        <h5>
            {{racerData.status === 'unpaid'? 'Register Racer': 'Edit Racer Data'}}
        </h5>
    </div>
    <div class="edit-racer-form">

    <FormKit v-if="formMode=='create'"
                  type="number" name="bibNumber" 
                  label="Bib Number:" 
                  help="Enter racer's bib number from a previous race" 
                  :delay="1500" 
                  @input="onPrevBibChange"
                  :errors="prevBibError"
                  />  
        
    <FormKit type="form" id="admin-registration" v-model="formInputData" :form-class="submitted ? 'hide' : 'show'"
        :errors="formError" submit-label="Save" @submit="submitHandler">
        <div class="double">
            <FormKit type="text" name="first_name" label="First name" validation="required" />
            <FormKit type="text" name="last_name" label="Last name" validation="required" />
        </div>
        <div class="double">
            <FormKit type="email" name="email" label="Email" validation="email" />
    
            <FormKit type="text" name="sponsor" label="Team or Sponsor" />
        </div>
        <FormKit type="text" name="contactNumber" label="Phone Number" help="If there is an issue on race day, we will try to contact you via this number" />
        <FormKit type="text" name="emergencyNumber" label="Emergency Contact Name and Number" help="In case of an emergency, we will contact this person" />
        <FormKit type="text" name="racerAge" label="Racer Age" help="age on dec 31" />
        <div class="double">
            <FormKit type="select" id="category" label="Race Category:" placeholder="Select a category" name="category"
                :options="sortedCats" validation="required" validation-visibility="dirty" :validation-messages="{
                        is: 'You must select a race category',
                    }" />
    
            <FormKit type="select" id="paytype" label="Payment Type:" name="paytype" :options="paymentOptions" v-model="paymentType"
                validation="required" validation-visibility="dirty" :validation-messages="{
                        is: 'You must select a Payment Type',
                    }" />
        </div>
        <FormKit id="bibNumber" type="text" name="bibNumber" label="Bib Number" />
        <div v-if="unpaidReg">
            <p class="text-danger h4">Cash Payment Required</p>
            <FormKit type="checkbox" :label="`I Collected ${dollas(paymentAmount)} from the racer`" name="paymentReceived"
                validation="required" />
        </div>

    </FormKit>
    </div>
</template>
    
<style>
.edit-racer-form{
    padding: 0 5px
}
.double {
  display: flex;
  justify-content: space-between;
}
.double > .formkit-outer {
  width: calc(50% - 0.5em);
}

</style>