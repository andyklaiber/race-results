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
        "series",
        "seriesData"
    ],
    emits: ['saved'],
    data() {
        return {
            birthdate: "",
            formError: [],
            submitted: false,
            paymentType: 'season',
            prevBibError:[],
            bibError: [],
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
            
            // Add race payment options
            _.forEach(this.payments, (element) => {
                options[element.type] = element.name;
            });
            
            // Add series group payment options (season passes)
            if (this.seriesData?.categoryGroups) {
                this.seriesData.categoryGroups.forEach(group => {
                    if (group.paymentOptions) {
                        group.paymentOptions.forEach(opt => {
                            // Only add if not already present (race options take precedence)
                            if (!options[opt.type]) {
                                options[opt.type] = `${opt.name} (${group.name})`;
                            }
                        });
                    }
                });
            }
            
            // Add special admin-only payment types
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
        onBibChange(bibNumber) {
            if (!bibNumber) {
                this.bibError = [];
                return;
            }
            
            request.post(`/api/racers/bib/${bibNumber}`, {
                series: `${this.series}`,
            })
                .then(({ data }) => {
                    console.log('bib check:', data);
                    // If we found a racer with this bib, check if it's the same person
                    
                    // Check if it's the same payment ID (in edit mode)
                    if (this.formMode === 'edit' && data.paymentId && 
                        this.racerData.paymentId && 
                        data.paymentId.toString() === this.racerData.paymentId.toString()) {
                        // Same racer by payment ID, no error
                        this.bibError = [];
                        return;
                    }
                    
                    // Check if it's the same person by name (allow bib reuse by same person)
                    const currentFirstName = (this.formInputData.first_name || '').toLowerCase().trim();
                    const currentLastName = (this.formInputData.last_name || '').toLowerCase().trim();
                    const existingFirstName = (data.first_name || '').toLowerCase().trim();
                    const existingLastName = (data.last_name || '').toLowerCase().trim();
                    if (currentFirstName && currentLastName && 
                        currentFirstName === existingFirstName && 
                        currentLastName === existingLastName) {
                        // Same person by name, allow bib reuse
                        this.bibError = [];
                        return;
                    }
                    
                    // Different racer already has this bib
                    this.bibError = [`Bib number ${bibNumber} is already in use by ${data.first_name} ${data.last_name}`];
                })
                .catch(({ response }) => {
                    console.log('bib check response:', response);
                    if (response && response.status == 404) {
                        // Bib not found, which is good - it's available
                        this.bibError = [];
                    } else {
                        // Some other error occurred
                        console.error('Error checking bib:', response);
                    }
                });
        },
        async submitHandler(formData) {
            console.log(formData);

            // Prevent submission if there's a bib error
            if (this.bibError.length > 0) {
                this.formError = ["Please fix the bib number error before submitting"];
                return;
            }

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
        <FormKit id="bibNumber" type="text" name="bibNumber" label="Bib Number" :delay="500" @input="onBibChange" :errors="bibError" />
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