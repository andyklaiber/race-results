<script>
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import RichTextEditor from './RichTextEditor.vue';

export default {
    components: {
        ModalComponent,
        RichTextEditor
    },
    props: [
        "waiver",
        "show"
    ],
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            waiverData: {
                format: 'html',
                header: '',
                text: ''
            }
        }
    },
    mounted() {
        this.loadWaiver();
    },
    watch: {
        waiver: {
            handler() {
                this.loadWaiver();
            },
            immediate: true
        }
    },
    methods: {
        loadWaiver() {
            console.log("Loading waiver:", this.waiver);
            
            if (!this.waiver) {
                this.waiverData = {
                    format: 'html',
                    header: '',
                    text: ''
                };
                return;
            }
            
            // Deep clone to avoid mutating props
            this.waiverData = {
                format: this.waiver.format || 'html',
                header: this.waiver.header || '',
                text: this.waiver.text || ''
            };
            
            console.log("Loaded waiverData:", this.waiverData);
        },
        async submitHandler() {
            console.log("Saving waiver:", this.waiverData);
            
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { waiver: this.waiverData }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', this.waiverData);
                    console.log(response.data);
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
    <modal-component :show="show" @close="$emit('close')">
        <template #header>
            <h5 class="mb-0">Edit Waiver / Liability Release</h5>
        </template>
        <template #body>
            <div class="edit-waiver-form">
                <div class="alert alert-info py-2 mb-3">
                    <small>
                        <strong>Tip:</strong> This waiver text will be shown to users during registration. 
                        They must check a box acknowledging they've read and accepted it.
                    </small>
                </div>
                
                <FormKit 
                    type="select" 
                    v-model="waiverData.format" 
                    label="Format" 
                    :options="{
                        html: 'HTML (Rich Text)',
                        text: 'Plain Text'
                    }"
                    help="HTML format allows rich formatting. Plain text shows header and text separately."
                />
                
                <FormKit 
                    v-if="waiverData.format !== 'html'"
                    type="text" 
                    v-model="waiverData.header" 
                    label="Header" 
                    help="Header text (shown in plain text mode only)"
                />
                
                <RichTextEditor
                    v-if="waiverData.format === 'html'"
                    v-model="waiverData.text"
                    label="Waiver Text"
                    placeholder="Enter your waiver/liability release text here..."
                    :show-preview="true"
                    min-height="400px"
                />
                
                <FormKit 
                    v-else
                    type="textarea" 
                    v-model="waiverData.text" 
                    label="Waiver Text"
                    rows="10"
                />
            </div>
            
            <div class="modal-footer-buttons mt-4">
                <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save Waiver</button>
                <button class="btn btn-sm btn-secondary px-3 mx-3" @click="$emit('close')">Cancel</button>
            </div>
        </template>
        <template #footer>
            <div></div>
        </template>
    </modal-component>
</template>

<style scoped>
.edit-waiver-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 200px);
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}
</style>

