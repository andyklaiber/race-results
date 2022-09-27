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
    emits:['saved'],
    data() {
        return {
            birthdate: "",
            formError: [],
            submitted: false,

        }
    },
    updated(){
        let bibNode = document.querySelector('#bibNumber');
        bibNode.focus();
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
            return options;
        },
        racerAge() {
            if (this.birthdate) {
                //calculate racer age on dec 31
                const dec31 = dayjs();
                const bday = dayjs(this.birthdate);

                return dec31.year() - bday.year();

            }
        }

    },
    methods: {
        async submitHandler() {
            await request
                .patch(
                    `/api/racers/race/${this.$route.params.raceid}`,
                    this.racerData,
                    {
                        params: {
                            paymentId: this.racerData.paymentId
                        }
                    }
                )
                .then((response) => {
                    if (response.data) {
                        this.submitted = true;
                        console.log(response.data);
                        return new Promise((resolve) =>
                            setTimeout(() => {
                                this.$emit('saved');
                                resolve();
                            }, 1000)
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
    <FormKit type="form" id="race-registration" v-model="racerData" :form-class="submitted ? 'hide' : 'show'"
        :errors="formError" submit-label="Save" @submit="submitHandler">

        <FormKit type="text" name="first_name" label="First name" help="What is your first name"
            validation="required" />
        <FormKit type="text" name="last_name" label="Last name" help="What is your last name" validation="required" />

        <FormKit type="email" name="email" label="Your email" help="Enter an email address"
            validation="required|email" />

        <FormKit type="text" name="sponsor" label="Your Team or Sponsor"
            help="Enter an optional Team or Sponsor name" />
        <FormKit type="text" name="racerAge" label="Racer Age" help="age on dec 31" />

        <FormKit type="select" id="category" label="Race Category:" placeholder="Select a category" name="category"
            :options="sortedCats" validation="required" validation-visibility="dirty" :validation-messages="{
              is: 'You must select a race category',
            }" />

        <FormKit id="bibNumber" type="text" name="bibNumber" label="Bib Number" />

    </FormKit>
</template>
    
<style>

</style>