<script>
import draggable from 'vuedraggable';
import request from "@/lib/ApiClient";
import _ from "lodash";
import ModalComponent from './ModalComponent.vue';
import { Pencil, FilePlus, Trash2 } from 'lucide-vue-next';

export default {
    components: {
        draggable,
        ModalComponent,
        Pencil,
        FilePlus,
        Trash2
    },
    props: [
        "coupons",
        "show"
    ],
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            formInputData: {},
            formCoupons: [],
            editCouponId: null,
        }
    },
    mounted() {
        console.log(this.coupons)
        Object.keys(this.coupons).forEach(couponCode => {
            let coupon = this.coupons[couponCode];
            this.formCoupons.push(Object.assign({ code: couponCode }, coupon));
        })
    },
    computed: {
        sortedCoupons() {
            return _.sortBy(this.formCoupons, ['fractionDiscount', 'code']);
        },
    },
    methods: {
        fractionToPercentage(fraction) {
            return fraction * 100;
        },
        percentageToFraction(percentage) {
            return percentage / 100
        },
        async submitHandler() {
            let coupons = {};
            this.formCoupons.forEach((coupon, idx) => {
                if(!coupons[coupon.code]){
                    coupons[coupon.code] = { ...coupon };
                    delete coupons[coupon.code].code;
                }
            })
            console.log(coupons)
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { couponCodes: coupons }
            ).then((response) => {
                if (response.data) {
                    
                    this.$emit('save', coupons);
                    console.log(response.data);
                    
                }
            })
                .catch((error) => {
                    this.formError = ["Error submitting request"];
                    console.log(error);
                });
        },
        submitForm(clickEvent) {
            clickEvent.stopPropagation();
            this.$formkit.submit("editingCouponForm");
        },
        coupon_exists({ value }) {
            return this.formCoupons.filter((coupon) => coupon.code === value).length == 1;
        },

        saveCoupon(formData) {
            let id = this.editCouponId;
            this.sortedCoupons[id] = formData;
            this.sortedCoupons[id].fractionDiscount = this.percentageToFraction(formData.percentDiscount);
            delete this.sortedCoupons[id].percentDiscount;
            this.editCouponId = null;
            console.log(this.formCoupons[id])

            console.log("update: ", formData)

        },

        onDragStart(event) {


        },
        onDragEnd() {

        },
        editCouponData(index) {
            if (this.editCouponId === null) {
                return this.editCouponId = index
            }

        },
        cancelEdit(event) {
            event.stopPropagation();
            this.editCouponId = null;
        },
        createCoupon(event, code) {
            this.formCoupons.push({ code: "NewCode", fractionDiscount: 0.1 });
            this.editCouponId = this.sortedCoupons.findIndex((coupon) => coupon.code === "NewCode");
        },
        deleteCoupon(event, index) {
            event.stopPropagation();
            _.remove(this.formCoupons, (coupon) => coupon.code === this.sortedCoupons[index].code);
        },
    }
}
</script>
    
<template>
    <modal-component :show="show" @close="$emit('close')">
        <template #header>
            <h5>
                Edit Discount Coupons
            </h5>
            <FilePlus class="mx-3" color="black" @click="createCoupon"></FilePlus>
            Click to Edit
        </template>
        <template #body>


            <div class="edit-categories-form">

                <div v-for="(element, index) in sortedCoupons" :key="index" class="edit-coupon-form">
                    <div class="cat-group" @click="editCouponData(index)">

                        <FormKit v-if="editCouponId === index" type="form" id="editingCouponForm" validation="required"
                            @submit="saveCoupon" :actions="false">
                            <div class="double">
                                <FormKit type="text" v-model="element.code" name="code" label="Coupon Code"
                                    validation="coupon_exists|alphanumeric" validation-visibility="live"
                                    :validation-rules="{ coupon_exists }" :validation-messages="{
                                        coupon_exists: 'This coupon code already exists.',
                                        alphanumeric: 'The coupon code can only contain alphanumeric characters.',
                                    }" />
                                <FormKit type="number" :value="fractionToPercentage(element.fractionDiscount)"
                                    name="percentDiscount" validation="min:0|max:100" validation-visibility="live"
                                    label="Discount Percentage" number="integer" />

                            </div>
                            <FormKit type="checkbox" v-model="element.singleUse" name="singleUse" label="singleUse" />
                            <button class="btn btn-primary my-3 mx-2" type="button" @click="submitForm">Save</button>
                        </FormKit>
                        <div v-else class="d-flex flex-row justify-content-between">
                            <div class="coupon-code">{{ fractionToPercentage(element.fractionDiscount) + "% off" }} - {{
                                element.code }}
                                <strong v-if="element.singleUse">One Time Use</strong>
                            </div>
                            <div class="">
                                <label class="">{{ index + 1 }} of {{ formCoupons.length }}
                                </label>
                                <Trash2 color="black" @click="deleteCoupon($event, index)"></Trash2>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer-buttons mt-3">
                <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save</button>
                <button class="btn btn-sm btn-danger px-3 mx-3" @click="$emit('close')">Cancel</button>
            </div>
        </template>
        <template #footer>
            <div></div>
        </template>
    </modal-component>
</template>
<style>
.edit-categories-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 160px);
}

.double {
    display: flex;
    justify-content: space-between;
}

.double>.formkit-outer {
    width: calc(50% - 0.5em);
}

.formkit-inner>.formkit-input {
    padding: 8px;
}

.cat-group {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0 5px;
    margin-bottom: 2px;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
}

.cat-name {
    cursor: move;
}</style>