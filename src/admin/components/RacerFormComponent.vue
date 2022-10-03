<script>
import _ from "lodash";
import dayjs from 'dayjs/esm/index.js';
import request from "@/lib/ApiClient";

export default {
    props: [
        "racerData",
        "categories",
        "payments",
    ],
    emits: ['saved'],
    data() {
        return {
            birthdate: "",
            formError: [],
            submitted: false,
        }
    },
    mounted() {
        if(!this.unpaidReg){
            return;
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
            options['season'] = 'Volunteer/Season Comp';
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
            return this.racerData.status == 'unpaid';
        },
        paymentAmount() {
            if (this.racerData.paytype === 'cash') {
                let payOpt = _.find(this.payments, { type: 'single' })
                return payOpt.amount;
            }
        }
    },
    methods: {
        dollas(amt) {
            if (typeof amt === 'string') {
                amt = parseInt(amt);
            }
            return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
        },
        async submitHandler(formData) {
            console.log(formData);
            let requestPromise;
            if (this.unpaidReg) {
                requestPromise = request
                    .post(
                        `/api/payments/register`,
                        { ...formData, paymentAmount: this.paymentAmount },
                        {
                            params: {
                                paymentId: this.racerData.paymentId,
                                raceId: this.$route.params.raceid
                            }
                        }
                    )
            } else {
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

    <FormKit type="form" id="race-registration" :value="racerData" :form-class="submitted ? 'hide' : 'show'"
        :errors="formError" submit-label="Save" @submit="submitHandler">
        <div class="double">
            <FormKit type="text" name="first_name" label="First name" validation="required" />
            <FormKit type="text" name="last_name" label="Last name" validation="required" />
        </div>
        <div class="double">
            <FormKit type="email" name="email" label="Email" validation="required|email" />
    
            <FormKit type="text" name="sponsor" label="Team or Sponsor" />
        </div>
    
        <FormKit type="text" name="racerAge" label="Racer Age" help="age on dec 31" />
        <div class="double">
            <FormKit type="select" id="category" label="Race Category:" placeholder="Select a category" name="category"
                :options="sortedCats" validation="required" validation-visibility="dirty" :validation-messages="{
                        is: 'You must select a race category',
                    }" />
    
            <FormKit type="select" id="paytype" label="Payment Type:" name="paytype" :options="paymentOptions"
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
</template>
    
<style>
#race-registration > .formkit-outer{
    width: 372px;
}
.double {
  display: flex;
  justify-content: space-between;
}
.double > .formkit-outer {
  width: calc(50% - 0.5em);
}

</style>