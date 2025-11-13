<script>
import draggable from 'vuedraggable';
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import { Pencil, Copy, Trash2 } from 'lucide-vue-next';

export default {
    components: {
        ModalComponent,
        Pencil,
        Copy,
        Trash2
    },
    props: [
        "paymentOptions",
    ],
    emits: ['save', 'show', 'close'],
    data() {
        return {
            formError: [],
            formInputData: {},
            formPayTypes: [],
            show: false,
        }
    },
    mounted() {
        this.formPayTypes = this.paymentOptions.map(cat => Object.assign({}, cat));
    },
    computed: {
        paymentTypeOptions() {

            return {
                season: 'Pays for all races in the series',
                single: 'Pays for only the current race',
                custom: 'create a custom paytype category, single race only',
            }
        }
        
    },
    methods: {
        async submitHandler() {
            // Filter to only include the fields needed by the backend
            const cleanedPaymentOptions = this.formPayTypes.map(payType => ({
                name: payType.name,
                type: payType.type,
                amount: payType.amount
            }));
            
            console.log('Submitting payment options:', cleanedPaymentOptions);
            
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { paymentOptions: cleanedPaymentOptions }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', cleanedPaymentOptions);
                    this.$emit('close');
                }
            })
                .catch((error) => {
                    this.formError = ["Error submitting request"];
                    console.log(error);
                });
        },
        addPaytype() {
            this.formPayTypes.push({
                name: '',
                type: '',
                amount: ''
            });
        },
        addSpecialPaytype(type) {
            // Check if this special type already exists
            const exists = this.formPayTypes.some(pt => pt.type === type);
            if (exists) {
                alert(`A ${type} payment type already exists`);
                return;
            }
            
            const newPaytype = {
                type: type,
                amount: type === 'cash' ? '0' : ''
            };
            
            if (type === 'season') {
                newPaytype.name = 'Season Pass';
            } else if (type === 'cash') {
                newPaytype.name = 'Cash Payment (at event)';
            }
            
            this.formPayTypes.push(newPaytype);
        },
        deletePaytype(index) {
            if (confirm('Are you sure you want to delete this payment type?')) {
                this.formPayTypes.splice(index, 1);
            }
        },
        isSpecialType(type) {
            return type === 'season' || type === 'cash';
        }
    }
}
</script>
    
<template>
    
            <!-- use the modal component, pass in the prop -->
            <modal-component :show="show" @close="emit('close')">
              <template #header>
                <h5>
                  Edit Payments
                </h5>
              </template>
              <template #body>
    <div class="edit-categories-form">
       <div v-for="(element, index) in formPayTypes" :key="index" class="cat-group-container">
                <div class="cat-group">
                    <div class="payment-header">
                        <h6>Payment Type {{ index + 1 }}</h6>
                        <button class="btn btn-sm btn-danger" @click="deletePaytype(index)">
                            <Trash2 :size="16" />
                        </button>
                    </div>
                    <div class="triple">
                        <FormKit type="text" v-model="element.name" label="Description"
                            validation="required" />
                        <FormKit type="text" v-model="element.type" label="Type ID" 
                            :help="isSpecialType(element.type) ? 'Special type: ' + element.type : 'Maps to registration category'"
                            validation="required" 
                            :disabled="isSpecialType(element.type)" />
                        <FormKit type="number" v-model="element.amount" label="Amount ($)" number="integer" 
                            validation="required" />
                    </div>
                </div>
            </div>
        
        <div class="add-buttons mt-3">
            <button class="btn btn-sm btn-success mx-2" @click="addPaytype">
                + Add Custom Payment Type
            </button>
            <button class="btn btn-sm btn-info mx-2" @click="addSpecialPaytype('season')">
                + Add Season Pass
            </button>
            <button class="btn btn-sm btn-info mx-2" @click="addSpecialPaytype('cash')">
                + Add Cash Payment
            </button>
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
    gap: 1em;
}

.double>.formkit-outer {
    flex: 1;
}

.triple {
    display: flex;
    justify-content: space-between;
    gap: 1em;
}

.triple>.formkit-outer {
    flex: 1;
}

.formkit-inner>.formkit-input {
    padding: 8px;
}

.cat-group {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
}

.payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.payment-header h6 {
    margin: 0;
}

.add-buttons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid #eee;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
}

</style>