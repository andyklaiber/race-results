<script>
import _ from "lodash";
import dayjs from 'dayjs/esm/index.js';
import request from "@/lib/ApiClient";

export default {
    props: [
        "racerData",
        "series"
    ],
    emits: ['saved'],
    data() {
        return {
            formError: [],
            submitted: false,
            formInputData: {},
        }
    },
    mounted() {
        this.formInputData = this.racerData;
    },
    computed: {
        
    },
    methods: {
        async submitHandler(formData) {
            console.log(formData);

            let requestPromise;
                requestPromise = request
                    .post(
                        `/api/team-comp/racers/?series=${this.series}`,
                        formData,
                    )
            
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
            Team Competition Info
        </h5>
    </div>
    <div class="edit-racer-form">
        
    <FormKit type="form" id="admin-registration" v-model="formInputData" :form-class="submitted ? 'hide' : 'show'"
        :errors="formError" submit-label="Save" @submit="submitHandler">
        <div class="double">
            <FormKit type="number" name="Bib" label="Bib Number" />
            <FormKit type="text" name="Name" label="Name" validation="required" />
            <FormKit type="text" name="Sponsor" label="Team Name" />
            <FormKit type="text" name="Cat" label="Category" />
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