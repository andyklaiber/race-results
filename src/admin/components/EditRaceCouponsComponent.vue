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
            formCoupons: [],
        }
    },
    mounted() {
        this.loadCoupons();
    },
    watch: {
        coupons: {
            handler() {
                this.loadCoupons();
            },
            immediate: true
        }
    },
    methods: {
        loadCoupons() {
            console.log("Loading coupons:", this.coupons);
            this.formCoupons = [];
            
            if (!this.coupons || typeof this.coupons !== 'object') {
                console.log("No coupons to load");
                return;
            }
            
            Object.keys(this.coupons).forEach(couponCode => {
                let coupon = this.coupons[couponCode];
                
                // Handle both fractionDiscount and percentDiscount properties, treating null as 0
                let percentValue = 0;
                if (coupon.fractionDiscount !== undefined && coupon.fractionDiscount !== null) {
                    percentValue = coupon.fractionDiscount * 100;
                } else if (coupon.percentDiscount !== undefined && coupon.percentDiscount !== null) {
                    percentValue = coupon.percentDiscount;
                }
                
                this.formCoupons.push({
                    code: couponCode,
                    percentDiscount: percentValue,
                    singleUse: coupon.singleUse || false
                });
            });
            
            console.log("Loaded formCoupons:", this.formCoupons);
        },
        async submitHandler() {
            let coupons = {};
            this.formCoupons.forEach((coupon) => {
                if(!coupons[coupon.code]){
                    // Ensure percentDiscount is a valid number, default to 0
                    let percentValue = parseFloat(coupon.percentDiscount) || 0;
                    
                    coupons[coupon.code] = {
                        fractionDiscount: percentValue / 100,
                        singleUse: coupon.singleUse || false
                    };
                }
            })
            console.log("Saving coupons:", coupons)
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
        createCoupon() {
            this.formCoupons.push({ 
                code: "NEWCODE", 
                percentDiscount: 10, 
                singleUse: false 
            });
        },
        deleteCoupon(index) {
            this.formCoupons.splice(index, 1);
        },
    }
}
</script>
    
<template>
    <modal-component :show="show" @close="$emit('close')">
        <template #header>
            <div class="d-flex justify-content-between align-items-center w-100">
                <h5 class="mb-0">Edit Discount Coupons</h5>
                <button class="btn btn-sm btn-success" @click="createCoupon">
                    <FilePlus :size="16" class="me-1" />
                    Add Coupon
                </button>
            </div>
        </template>
        <template #body>
            <div class="edit-coupons-form">
                <div v-if="formCoupons.length === 0" class="text-center text-muted py-4">
                    No coupons yet. Click "Add Coupon" to create one.
                </div>
                
                <div v-for="(coupon, index) in formCoupons" :key="index" class="coupon-row">
                    <div class="coupon-fields">
                        <div class="field-group">
                            <label class="field-label">Code</label>
                            <input 
                                type="text" 
                                v-model="coupon.code" 
                                class="form-control form-control-sm"
                                placeholder="COUPON10"
                            />
                        </div>
                        
                        <div class="field-group">
                            <label class="field-label">Discount %</label>
                            <input 
                                type="number" 
                                v-model.number="coupon.percentDiscount" 
                                class="form-control form-control-sm"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>
                        
                        <div class="field-group checkbox-group">
                            <label class="form-check-label">
                                <input 
                                    type="checkbox" 
                                    v-model="coupon.singleUse" 
                                    class="form-check-input"
                                />
                                Single Use
                            </label>
                        </div>
                        
                        <div class="field-group">
                            <button 
                                class="btn btn-sm btn-danger" 
                                @click="deleteCoupon(index)"
                                title="Delete coupon"
                            >
                                <Trash2 :size="16" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer-buttons mt-3">
                <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save All</button>
                <button class="btn btn-sm btn-secondary px-3 mx-3" @click="$emit('close')">Cancel</button>
            </div>
        </template>
        <template #footer>
            <div></div>
        </template>
    </modal-component>
</template>
<style scoped>
.edit-coupons-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 200px);
}

.coupon-row {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background-color: #f8f9fa;
    transition: background-color 0.2s;
}

.coupon-row:hover {
    background-color: #e9ecef;
}

.coupon-fields {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 12px;
    align-items: end;
}

.field-group {
    display: flex;
    flex-direction: column;
}

.field-label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 4px;
    color: #495057;
}

.checkbox-group {
    justify-content: center;
    padding-top: 8px;
}

.checkbox-group .form-check-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.875rem;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}

@media (max-width: 768px) {
    .coupon-fields {
        grid-template-columns: 1fr;
        gap: 8px;
    }
    
    .checkbox-group {
        padding-top: 0;
    }
}
</style>