<script>
import draggable from 'vuedraggable';
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import { Pencil, Copy, Trash2 } from 'lucide-vue-next';

export default {
    components: {
        draggable,
        ModalComponent,
        Pencil,
        Copy,
        Trash2
    },
    props: [
        "categories",
        "payTypes",
    ],
    emits: ['save', 'show', 'close'],
    data() {
        return {
            formError: [],
            formInputData: {},
            formCats: [],
            editCatId: null,
            show: false,
        }
    },
    mounted() {
        this.formCats = this.categories.map(cat => Object.assign({}, cat));
    },
    computed: {
        payTypeOptions() {

            return {
                null: 'Not required',
                ...this.payTypes
            }
        }
    },
    methods: {
        async submitHandler() {
            let formData = this.formCats.map((cat, idx) => {
                let newCat = Object.assign({}, cat);
                if(newCat.paytype == "null"){
                    delete newCat.paytype;
                }
                newCat.disporder = idx + 1;

                return newCat;
            })
            console.log(this.formData);
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { regCategories: formData }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', formData);
                }
            })
                .catch((error) => {
                    this.formError = ["Error submitting request"];
                    console.log(error);
                });
        },
        submitForm(clickEvent) {
            clickEvent.stopPropagation();
            this.$formkit.submit("editingCategoryForm");
        },
        saveCategory(formData) {
            let existingCatData = this.formCats[this.editCatId];
            if (existingCatData.catdispname !== formData.catdispname) {
                existingCatData.id = this.formatNameToId(formData.catdispname);
            }
            Object.assign(existingCatData, formData)
            if (existingCatData.paytype === null) {
                delete existingCatData.paytype;
            }
            console.log("update: ", existingCatData)
            this.formCats.splice(this.editCatId, 1, existingCatData);
            this.editCatId = null;
        },
        formatNameToId(name) {
            return name.replace(/\s+/g, '_').toLowerCase().replace('+', '_plus_').replace('-', '_minus_').replace(/\W/g, '');
        },
        onDragStart(event) {


        },
        onDragEnd() {

        },
        editCategoryData(index) {
            if (this.editCatId === null) {
                return this.editCatId = index
            }
        },
        cancelEdit(event) {
            event.stopPropagation();
            this.editCatId = null;
        },
        copyCategory(event, index) {
            event.stopPropagation();
            const newCat = { ...this.formCats[index] };
            newCat.catdispname = newCat.catdispname + ' (copy)';
            newCat.id = this.formatNameToId(newCat.catdispname);
            this.formCats.splice(index + 1, 0, newCat);
        },
        deleteCategory(event, index) {
            event.stopPropagation();
            this.formCats.splice(index, 1);
        },
        checkMove: function (evt) {
            return this.editCatId === null;
        }
    }
}
</script>
    
<template>
    
            <!-- use the modal component, pass in the prop -->
            <modal-component :show="show" @close="emit('close')">
              <template #header>
                <h5>
                  Edit Race Categories
                </h5>
                Click to Edit, Drag to reorder categories
              </template>
              <template #body>
    <div class="edit-categories-form">

        <!-- <FormKit type="form" id="edit-categories" v-model="formInputData" 
        :errors="formError" submit-label="Save" @submit="submitHandler"> -->
        <draggable v-model="formCats" @end="onDragEnd" @start="onDragStart" item-key="id" :move="checkMove">
            <template #item="{ element, index }">
                <div class="cat-group" @click="editCategoryData(index)">

                    <FormKit v-if="editCatId === index" type="form" id="editingCategoryForm" label="Category Name"
                        validation="required" @submit="saveCategory" :actions="false">
                        <div class="double">
                            <FormKit type="text" :value="element.catdispname" name="catdispname" label="Category Name"
                                validation="required" />
                            <FormKit type="number" :value="element.laps" name="laps" label="Laps" number="integer" />

                        </div>
                        <div class="double">
                            <FormKit type="number" :value="element.minAge" name="minAge" label="Minimum Age"
                                number="integer"
                                help="Enforces age restrictions - category will be hidden if age is outside of range" />
                            <FormKit type="number" :value="element.maxAge" name="maxAge" label="Maximum Age"
                                number="integer" />
                        </div>
                        <div class="double">
                            <FormKit type="checkbox" :value="element.sponsored" name="sponsored" label="Sponsored"
                                help="If checked, no entry fee will be charged." />
                            <FormKit v-if="!element.sponsored" type="select" name="paytype" label="Category Payment Type"
                                help="Force payment type when this category is selected" :value="element.paytype"
                                :options="payTypeOptions" />
                            <FormKit v-else type="text" :value="element.sponsorName" name="sponsorName" label="Sponsor Name"
                                validation="required" />
                        </div>
                        <button class="btn btn-primary my-3 mx-2" type="button" @click="submitForm">Save</button>
                        <button class="btn btn-danger my-3 mx-2" type="button" @click="cancelEdit">Cancel</button>
                    </FormKit>
                    <div v-else class="d-flex flex-row justify-content-between">
                        <div class="cat-name">{{ element.catdispname }} <strong v-if="element.sponsored">Sponsored</strong>
                        </div>
                        <div class="">
                            <label class="">{{ index + 1 }} of {{ formCats.length }}
                            </label>
                            <Copy class="mx-3" color="black" @click="copyCategory($event, index)"></Copy>
                            <Trash2 color="black" @click="deleteCategory($event, index)"></Trash2>
                        </div>
                    </div>
                </div>
            </template>
        </draggable>
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

.cat-name {
    cursor: move;
}</style>