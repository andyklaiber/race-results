<script>
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import { Trash2, FilePlus } from 'lucide-vue-next';

export default {
    components: {
        ModalComponent,
        Trash2,
        FilePlus
    },
    props: [
        "optionalPurchases",
        "show"
    ],
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            formPurchases: [],
            showHtmlHelp: {},
        }
    },
    mounted() {
        this.loadPurchases();
    },
    watch: {
        optionalPurchases: {
            handler() {
                this.loadPurchases();
            },
            immediate: true
        }
    },
    methods: {
        loadPurchases() {
            console.log("Loading optional purchases:", this.optionalPurchases);
            
            if (!this.optionalPurchases || !Array.isArray(this.optionalPurchases)) {
                this.formPurchases = [];
                return;
            }
            
            // Deep clone to avoid mutating props
            this.formPurchases = this.optionalPurchases.map(purchase => ({
                id: purchase.id || this.generateId(),
                label: purchase.label || '',
                description: purchase.description || '',
                amount: purchase.amount || '0',
                optionsLabel: purchase.optionsLabel || '',
                options: purchase.options ? [...purchase.options] : []
            }));
            
            console.log("Loaded formPurchases:", this.formPurchases);
        },
        generateId() {
            return 'opt_' + Math.random().toString(36).substr(2, 9);
        },
        async submitHandler() {
            // Clean up the data before submitting
            const cleanedPurchases = this.formPurchases.map(purchase => {
                const cleaned = {
                    id: purchase.id,
                    label: purchase.label,
                    description: purchase.description,
                    amount: purchase.amount
                };
                
                // Only include optionsLabel and options if they exist
                if (purchase.optionsLabel && purchase.optionsLabel.trim()) {
                    cleaned.optionsLabel = purchase.optionsLabel;
                }
                
                if (purchase.options && purchase.options.length > 0) {
                    // Filter out empty options
                    const validOptions = purchase.options.filter(opt => opt && opt.trim());
                    if (validOptions.length > 0) {
                        cleaned.options = validOptions;
                    }
                }
                
                return cleaned;
            });
            
            console.log("Saving optional purchases:", cleanedPurchases);
            
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { optionalPurchases: cleanedPurchases }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', cleanedPurchases);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                this.formError = ["Error submitting request"];
                console.log(error);
            });
        },
        addPurchase() {
            this.formPurchases.push({
                id: this.generateId(),
                label: '',
                description: '',
                amount: '0',
                optionsLabel: '',
                options: []
            });
        },
        deletePurchase(index) {
            if (confirm('Are you sure you want to delete this optional purchase?')) {
                this.formPurchases.splice(index, 1);
            }
        },
        addOption(purchaseIndex) {
            if (!this.formPurchases[purchaseIndex].options) {
                this.formPurchases[purchaseIndex].options = [];
            }
            this.formPurchases[purchaseIndex].options.push('');
        },
        removeOption(purchaseIndex, optionIndex) {
            this.formPurchases[purchaseIndex].options.splice(optionIndex, 1);
        },
        toggleHtmlHelp(index) {
            this.showHtmlHelp[index] = !this.showHtmlHelp[index];
        },
        insertHtmlTemplate(purchaseIndex, template) {
            const currentDesc = this.formPurchases[purchaseIndex].description || '';
            
            // Insert template at the end with a space if there's existing content
            const separator = currentDesc.trim() ? ' ' : '';
            this.formPurchases[purchaseIndex].description = currentDesc + separator + template;
        }
    }
}
</script>
    
<template>
    <modal-component :show="show" @close="$emit('close')">
        <template #header>
            <div class="d-flex justify-content-between align-items-center w-100">
                <h5 class="mb-0">Edit Optional Purchases</h5>
                <button class="btn btn-sm btn-success" @click="addPurchase">
                    <FilePlus :size="16" class="me-1" />
                    Add Purchase
                </button>
            </div>
        </template>
        <template #body>
            <div class="edit-purchases-form">
                <div v-if="formPurchases.length === 0" class="text-center text-muted py-4">
                    No optional purchases yet. Click "Add Purchase" to create one.
                </div>
                
                <div v-for="(purchase, index) in formPurchases" :key="purchase.id" class="purchase-group">
                    <div class="purchase-header">
                        <h6>Optional Purchase {{ index + 1 }}</h6>
                        <button class="btn btn-sm btn-danger" @click="deletePurchase(index)">
                            <Trash2 :size="16" />
                        </button>
                    </div>
                    
                    <div class="purchase-fields">
                        <FormKit 
                            type="text" 
                            v-model="purchase.label" 
                            label="Label" 
                            help="Short name shown to user (e.g., 'T-Shirt')"
                            validation="required" 
                        />
                        
                        <div class="description-field">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <label class="form-label mb-0">Description</label>
                                <button 
                                    type="button"
                                    class="btn btn-sm btn-outline-info" 
                                    @click="toggleHtmlHelp(index)"
                                >
                                    {{ showHtmlHelp[index] ? 'Hide' : 'Show' }} HTML Help
                                </button>
                            </div>
                            
                            <div v-if="showHtmlHelp[index]" class="html-help-panel mb-2">
                                <div class="help-title">Quick Insert:</div>
                                <div class="help-buttons">
                                    <button 
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="insertHtmlTemplate(index, `<a href='https://example.com' target='_blank'>Link Text</a>`)"
                                        title="Insert link that opens in new tab"
                                    >
                                        + Link
                                    </button>
                                    <button 
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="insertHtmlTemplate(index, `<strong>bold text</strong>`)"
                                        title="Insert bold text"
                                    >
                                        + Bold
                                    </button>
                                    <button 
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="insertHtmlTemplate(index, `<em>italic text</em>`)"
                                        title="Insert italic text"
                                    >
                                        + Italic
                                    </button>
                                    <button 
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="insertHtmlTemplate(index, `<br>`)"
                                        title="Insert line break"
                                    >
                                        + Line Break
                                    </button>
                                </div>
                                <div class="help-examples">
                                    <small class="text-muted">
                                        <strong>Examples:</strong><br>
                                        Link: <code>&lt;a href='https://example.com' target='_blank'&gt;Click here&lt;/a&gt;</code><br>
                                        Bold: <code>&lt;strong&gt;text&lt;/strong&gt;</code> | 
                                        Italic: <code>&lt;em&gt;text&lt;/em&gt;</code> | 
                                        Break: <code>&lt;br&gt;</code>
                                    </small>
                                </div>
                            </div>
                            
                            <FormKit 
                                type="textarea" 
                                v-model="purchase.description" 
                                help="HTML description shown above the checkbox"
                                rows="3"
                            />
                            
                            <div v-if="purchase.description && purchase.description.trim()" class="description-preview">
                                <div class="preview-label">Preview:</div>
                                <div class="preview-content" v-html="purchase.description"></div>
                            </div>
                        </div>
                        
                        <FormKit 
                            type="number" 
                            v-model="purchase.amount" 
                            label="Amount ($)" 
                            number="float"
                            step="0.01"
                            validation="required" 
                        />
                        
                        <div class="options-section">
                            <div class="options-header">
                                <label class="form-label">Options (Optional)</label>
                                <button 
                                    type="button"
                                    class="btn btn-sm btn-outline-primary" 
                                    @click="addOption(index)"
                                >
                                    + Add Option
                                </button>
                            </div>
                            
                            <FormKit 
                                v-if="purchase.options && purchase.options.length > 0"
                                type="text" 
                                v-model="purchase.optionsLabel" 
                                label="Options Label" 
                                help="Label for the dropdown (e.g., 'Size', 'Color')"
                            />
                            
                            <div v-if="purchase.options && purchase.options.length > 0" class="options-list">
                                <div 
                                    v-for="(option, optIdx) in purchase.options" 
                                    :key="optIdx" 
                                    class="option-row"
                                >
                                    <input 
                                        type="text" 
                                        v-model="purchase.options[optIdx]" 
                                        class="form-control form-control-sm"
                                        :placeholder="`Option ${optIdx + 1}`"
                                    />
                                    <button 
                                        type="button"
                                        class="btn btn-sm btn-outline-danger" 
                                        @click="removeOption(index, optIdx)"
                                    >
                                        <Trash2 :size="14" />
                                    </button>
                                </div>
                            </div>
                            
                            <small class="text-muted">
                                Options allow users to select variants (e.g., shirt sizes: S, M, L, XL)
                            </small>
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
.edit-purchases-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 200px);
}

.purchase-group {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
    background-color: #f8f9fa;
}

.purchase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #dee2e6;
}

.purchase-header h6 {
    margin: 0;
    font-weight: 600;
}

.purchase-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.options-section {
    margin-top: 8px;
    padding: 12px;
    background-color: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

.options-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.options-header .form-label {
    margin-bottom: 0;
    font-weight: 500;
}

.options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
    margin-bottom: 8px;
}

.option-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.option-row input {
    flex: 1;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}

.description-field {
    margin-bottom: 12px;
}

.html-help-panel {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 12px;
}

.help-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 8px;
    color: #495057;
}

.help-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
}

.help-examples {
    padding-top: 8px;
    border-top: 1px solid #dee2e6;
}

.help-examples code {
    background-color: #e9ecef;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.8rem;
}

.description-preview {
    margin-top: 8px;
    padding: 10px;
    background-color: #fff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

.preview-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6c757d;
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
}

.preview-content {
    font-size: 0.95rem;
    color: #212529;
}

.preview-content a {
    color: #0d6efd;
    text-decoration: underline;
}

@media (max-width: 768px) {
    .purchase-group {
        padding: 12px;
    }
    
    .help-buttons {
        flex-direction: column;
    }
    
    .help-buttons .btn {
        width: 100%;
    }
}
</style>

