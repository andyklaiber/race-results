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
            editPaytypeId: null,
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
            
            console.log(this.formInputData);
            // await request.patch(
            //     `/api/races/${this.$route.params.raceid}`,
            //     { paymentOptions: formData }
            // ).then((response) => {
            //     if (response.data) {
            //         this.$emit('save', this.formInputData);
            //     }
            // })
            //     .catch((error) => {
            //         this.formError = ["Error submitting request"];
            //         console.log(error);
            //     });
        },
        submitForm(clickEvent) {
            clickEvent.stopPropagation();
            this.$formkit.submit("editingCategoryForm");
        },
        savePaytype(formData) {
            let existingCatData = this.formPayTypes[this.editPaytypeId];
            
            Object.assign(existingCatData, formData)
            
            console.log("update: ", existingCatData)
            this.formPayTypes.splice(this.editPaytypeId, 1, existingCatData);
            this.editPaytypeId = null;
        },
        formatNameToId(name) {
            return name.replace(/\s+/g, '_').toLowerCase().replace('+', '_plus_').replace('-', '_minus_').replace(/\W/g, '');
        },

        editPaytypeData(index) {
            if (this.editPaytypeId === null) {
                return this.editPaytypeId = index
            }
        },
        cancelEdit(event) {
            event.stopPropagation();
            this.editPaytypeId = null;
        },
        copyPaytype(event, index) {
            event.stopPropagation();
            const newCat = { ...this.formPayTypes[index] };
            newCat.catdispname = newCat.catdispname + ' (copy)';
            newCat.id = this.formatNameToId(newCat.catdispname);
            this.formPayTypes.splice(index + 1, 0, newCat);
        },
        deletePaytype(event, index) {
            event.stopPropagation();
            this.formPayTypes.splice(index, 1);
        },
        checkMove: function (evt) {
            return this.editPaytypeId === null;
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
                Click to Edit
              </template>
              <template #body>
    <div class="edit-categories-form">

        <!-- <FormKit type="form" id="edit-categories" v-model="formInputData" 
        :errors="formError" submit-label="Save" @submit="submitHandler"> -->
       <div v-for="(element, index) in formPayTypes" class="cat-group-container">
                <div class="cat-group" @click="editPaytypeData(index)">

                    <FormKit v-if="editPaytypeId === index" type="form" id="editingCategoryForm" label="Category Name"
                        validation="required" @submit="savePaytype" :actions="false">
                        <div class="double">
                            <FormKit type="text" :value="element.name" name="name" label="Pay type description"
                                validation="required" />
                            <FormKit type="number" :value="element.amount" name="amount" label="Amount" number="integer" />
                            <!-- <FormKit type="select" name="type" label="Payment Type"
                                help="Select the type of payment" :value="element.type"
                                :options="paymentTypeOptions" /> -->
                      
                        </div>
                        <button class="btn btn-primary my-3 mx-2" type="button" @click="submitForm">Save</button>
                        <button class="btn btn-danger my-3 mx-2" type="button" @click="cancelEdit">Cancel</button>
                    </FormKit>
                    <div v-else class="d-flex flex-row justify-content-between">
                        <div class="cat-name">{{ element.name }} 
                        </div>
                        <div class="">
                            <label class="">{{ index + 1 }} of {{ formPayTypes.length }}
                            </label>
                            <!-- <Copy class="mx-3" color="black" @click="copyPaytype($event, index)"></Copy>
                            <Trash2 color="black" @click="deletePaytype($event, index)"></Trash2> -->
                        </div>
                    </div>
                </div>
            </div>
        <!-- </FormKit> -->


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

</style>