<script>
import _ from "lodash";
import dayjs from 'dayjs/esm/index.js';
import request from "@/lib/ApiClient";

export default {
    props: [
        "paymentData",
        "races",
        "formMode",
    ],
    data() {
        return {
            formError: [],
            formInputData: {},
            target: '',
            successMessage: '',
        }
    },
    mounted() {
        console.log(this.races)
        this.target = Object.keys(this.races)[0]
        console.log(this.target)
    },
    computed: {
        raceOptions() {
            let opts = this.races;
            delete opts[this.paymentData.regData.raceid]
            return opts;
        }
    },
    methods: {
        async moveReg(event) {
            console.log(event)
            console.log(this.target);
            return request
                .put(
                    `/api/payments/move-reg`, {},
                    {
                        params: {
                            paymentId: this.paymentData._id,
                            raceId: this.target
                        }
                    }
                )
                .then((response) => {
                    this.successMessage = 'Registration moved';
                })
                .catch((error) => {
                    this.formError = ["Error submitting request"];
                    console.log(error);
                });
        },
        async deleteReg(event) {
            console.log(event)
            return request
                .delete(
                    `/api/racers/race/${this.target}`,
                    {
                        params: {
                            paymentId: this.paymentData._id,
                        }
                    }
                )
                .then((response) => {
                    this.successMessage = 'Registration deleted';
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
            Edit Payment
        </h5>
    </div>
    <div>

        Move This reg to Event:
        <FormKit type="select" label="Select an Event:" placeHolder="Select race to transfer to" name="selectedRace"
             :options="raceOptions" />
        <div class='btn btn-sm btn-primary' @click="moveReg()">Transfer</div>
    </div>
    <div>

        Delete registration
        <div class='btn btn-sm btn-primary' @click="deleteReg()">Delete!</div>
    </div>
    <div v-if="successMessage">
        {{successMessage}}
    </div>
</template>
    
<style></style>