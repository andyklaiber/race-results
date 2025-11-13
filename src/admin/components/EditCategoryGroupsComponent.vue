<script>
import draggable from 'vuedraggable';
import { Pencil, Copy, Trash2, Plus, ChevronDown, ChevronUp, Edit } from 'lucide-vue-next';

export default {
    components: {
        draggable,
        Pencil,
        Copy,
        Trash2,
        Plus,
        ChevronDown,
        ChevronUp,
        Edit
    },
    props: {
        categoryGroups: {
            type: Array,
            default: () => []
        },
        regCategories: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:categoryGroups'],
    data() {
        return {
            formGroups: [],
            editGroupId: null,
            editFormData: {},
            expandedGroups: [], // Array for tracking expanded groups
            editModeEnabled: false
        }
    },
    mounted() {
        this.formGroups = this.categoryGroups.map(group => ({
            ...group,
            categories: [...(group.categories || [])],
            paymentOptions: [...(group.paymentOptions || [])],
            isExisting: true
        }));
    },
    watch: {
        categoryGroups: {
            handler(newGroups) {
                this.formGroups = newGroups.map(group => ({
                    ...group,
                    categories: [...(group.categories || [])],
                    paymentOptions: [...(group.paymentOptions || [])],
                    isExisting: true
                }));
            },
            deep: true
        }
    },
    methods: {
        emitUpdate() {
            const formData = this.formGroups.map(group => {
                let newGroup = { ...group };
                delete newGroup.isExisting;
                return newGroup;
            });
            this.$emit('update:categoryGroups', formData);
        },
        
        toggleExpand(index) {
            const idx = this.expandedGroups.indexOf(index);
            if (idx > -1) {
                this.expandedGroups.splice(idx, 1);
            } else {
                this.expandedGroups.push(index);
            }
        },
        
        isExpanded(index) {
            return this.expandedGroups.includes(index);
        },
        
        editGroup(index) {
            if (this.editGroupId === index) {
                return;
            }
            this.editGroupId = index;
            this.editFormData = {
                name: this.formGroups[index].name,
                categories: [...this.formGroups[index].categories],
                paymentOptions: this.formGroups[index].paymentOptions.map(po => ({ ...po }))
            };
        },
        
        saveGroup() {
            let existingGroup = this.formGroups[this.editGroupId];
            
            this.formGroups[this.editGroupId] = {
                ...this.editFormData,
                isExisting: existingGroup.isExisting
            };
            this.editGroupId = null;
            this.emitUpdate();
        },
        
        cancelEdit() {
            this.editGroupId = null;
            this.editFormData = {};
        },
        
        addGroup() {
            const newGroup = {
                name: 'New Category Group',
                categories: [],
                paymentOptions: [],
                isExisting: false
            };
            this.formGroups.push(newGroup);
            this.editGroupId = this.formGroups.length - 1;
            this.editFormData = {
                name: newGroup.name,
                categories: [],
                paymentOptions: []
            };
        },
        
        copyGroup(event, index) {
            event.stopPropagation();
            let newGroup = {
                name: this.formGroups[index].name + ' (copy)',
                categories: [...this.formGroups[index].categories],
                paymentOptions: this.formGroups[index].paymentOptions.map(po => ({ ...po })),
                isExisting: false
            };
            this.formGroups.splice(index + 1, 0, newGroup);
            this.emitUpdate();
        },
        
        deleteGroup(event, index) {
            event.stopPropagation();
            if (confirm('Delete this category group? Categories will become ungrouped.')) {
                this.formGroups.splice(index, 1);
                this.emitUpdate();
            }
        },
        
        addPaymentOption() {
            this.editFormData.paymentOptions.push({
                name: '',
                type: '',
                amount: 0
            });
        },
        
        removePaymentOption(index) {
            this.editFormData.paymentOptions.splice(index, 1);
        },
        
        addSpecialPaymentType(type) {
            // Check if this type already exists
            const exists = this.editFormData.paymentOptions.some(pt => pt.type === type);
            if (exists) {
                alert(`A ${type} payment type already exists in this group`);
                return;
            }
            
            const newPaytype = {
                type: type,
                amount: type === 'cash' ? 0 : 0
            };
            
            if (type === 'season') {
                newPaytype.name = 'Season Pass';
            } else if (type === 'cash') {
                newPaytype.name = 'Cash Payment (at event)';
            }
            
            this.editFormData.paymentOptions.push(newPaytype);
        },
        
        isSpecialPaymentType(type) {
            return type === 'season' || type === 'cash';
        },
        
        getCategoryName(categoryId) {
            const category = this.regCategories.find(cat => cat.id === categoryId);
            return category ? category.catdispname : categoryId;
        },
        
        getAvailableCategories() {
            // Get all categories already assigned to OTHER groups (not the one being edited)
            const assignedCategories = new Set();
            this.formGroups.forEach((group, index) => {
                // Skip the group currently being edited
                if (index !== this.editGroupId) {
                    group.categories.forEach(catId => assignedCategories.add(catId));
                }
            });
            
            // Return categories not yet assigned to other groups
            return this.regCategories.filter(cat => !assignedCategories.has(cat.id));
        },
        
        toggleCategory(categoryId) {
            const index = this.editFormData.categories.indexOf(categoryId);
            if (index > -1) {
                this.editFormData.categories.splice(index, 1);
            } else {
                this.editFormData.categories.push(categoryId);
            }
        },
        
        selectAllCategories() {
            // Get all available categories (not in other groups)
            const availableCategories = this.getAvailableCategories();
            // Add all available category IDs to the selection
            this.editFormData.categories = availableCategories.map(cat => cat.id);
        },
        
        clearAllCategories() {
            this.editFormData.categories = [];
        },
        
        submitForm(event) {
            event.preventDefault();
            event.stopPropagation();
            
            if (!this.editFormData.name) {
                alert('Group name is required');
                return;
            }
            
            if (this.editFormData.categories.length === 0) {
                alert('Please select at least one category for this group');
                return;
            }
            
            this.saveGroup();
        }
    }
}
</script>

<template>
    <div class="edit-category-groups">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <button 
                    class="btn btn-sm" 
                    :class="editModeEnabled ? 'btn-secondary' : 'btn-outline-secondary'"
                    @click="editModeEnabled = !editModeEnabled"
                >
                    <Edit :size="16" class="me-1" />
                    {{ editModeEnabled ? 'View Mode' : 'Enable Editing' }}
                </button>
                <p v-if="!editModeEnabled" class="text-muted mb-0 mt-2 small">
                    Click group headers to expand/collapse details
                </p>
                <p v-else class="text-muted mb-0 mt-2 small">
                    Create groups of categories with their payment options. Each category can only belong to one group.
                </p>
            </div>
            <button v-if="editModeEnabled" class="btn btn-sm btn-primary" @click="addGroup">
                <Plus :size="16" class="me-1" />
                Add Group
            </button>
        </div>

        <div v-if="formGroups.length === 0" class="text-center text-muted py-4 border rounded">
            No category groups defined. Click "Add Group" to create one.
        </div>

        <div v-for="(group, index) in formGroups" :key="index" class="group-container mb-3">
            <!-- Edit Mode -->
            <form v-if="editGroupId === index" @submit.prevent="submitForm" class="p-3 border rounded bg-light">
                <div class="mb-3">
                    <label class="form-label small fw-bold">Group Name *</label>
                    <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        v-model="editFormData.name"
                        placeholder="e.g., High School Categories"
                        required
                    >
                </div>

                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label small fw-bold mb-0">Categories in this Group *</label>
                        <div class="btn-group btn-group-sm" role="group">
                            <button 
                                type="button" 
                                class="btn btn-outline-primary btn-sm"
                                @click="selectAllCategories"
                                :disabled="getAvailableCategories().length === 0"
                            >
                                Select All
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-outline-secondary btn-sm"
                                @click="clearAllCategories"
                                :disabled="editFormData.categories.length === 0"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div class="category-selector border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                        <div v-if="regCategories.length === 0" class="text-muted small">
                            No categories defined yet. Please add categories first.
                        </div>
                        <div v-else-if="getAvailableCategories().length === 0 && editFormData.categories.length === 0" class="text-muted small">
                            All categories are already assigned to other groups.
                        </div>
                        <div v-else>
                            <div 
                                v-for="cat in regCategories" 
                                :key="cat.id"
                                class="form-check"
                                v-show="editFormData.categories.includes(cat.id) || getAvailableCategories().some(c => c.id === cat.id)"
                            >
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    :id="'cat-' + index + '-' + cat.id"
                                    :value="cat.id"
                                    :checked="editFormData.categories.includes(cat.id)"
                                    @change="toggleCategory(cat.id)"
                                >
                                <label class="form-check-label" :for="'cat-' + index + '-' + cat.id">
                                    {{ cat.catdispname }}
                                </label>
                            </div>
                        </div>
                    </div>
                    <small class="text-muted">
                        {{ editFormData.categories.length }} categories selected
                        <span v-if="getAvailableCategories().length > 0">
                            ({{ getAvailableCategories().length }} available)
                        </span>
                    </small>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">Payment Options</label>
                    
                    <div v-if="editFormData.paymentOptions.length === 0" class="text-center text-muted py-2 border rounded mb-2">
                        No payment options defined for this group.
                    </div>
                    
                    <div v-else class="payment-options-list mb-2">
                        <div 
                            v-for="(payOpt, payIndex) in editFormData.paymentOptions" 
                            :key="payIndex"
                            class="payment-option-item border rounded p-2 mb-2"
                        >
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <small class="text-muted">Payment Option {{ payIndex + 1 }}</small>
                                <button 
                                    class="btn btn-sm btn-outline-danger py-0 px-1" 
                                    @click="removePaymentOption(payIndex)"
                                    type="button"
                                >
                                    <Trash2 :size="12" />
                                </button>
                            </div>
                            
                            <div class="row g-2">
                                <div class="col-md-5">
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm" 
                                        v-model="payOpt.name"
                                        placeholder="e.g., Early Bird"
                                        required
                                    >
                                </div>
                                <div class="col-md-4">
                                    <input 
                                        type="text" 
                                        class="form-control form-control-sm" 
                                        v-model="payOpt.type"
                                        placeholder="e.g., early_bird"
                                        :disabled="isSpecialPaymentType(payOpt.type)"
                                        required
                                    >
                                </div>
                                <div class="col-md-3">
                                    <input 
                                        type="number" 
                                        class="form-control form-control-sm" 
                                        v-model.number="payOpt.amount"
                                        placeholder="Amount"
                                        min="0"
                                        step="1"
                                        required
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex gap-2 flex-wrap">
                        <button 
                            class="btn btn-sm btn-success" 
                            @click="addPaymentOption"
                            type="button"
                        >
                            + Custom Payment
                        </button>
                        <button 
                            class="btn btn-sm btn-info" 
                            @click="addSpecialPaymentType('season')"
                            type="button"
                        >
                            + Season Pass
                        </button>
                        <button 
                            class="btn btn-sm btn-info" 
                            @click="addSpecialPaymentType('cash')"
                            type="button"
                        >
                            + Cash Payment
                        </button>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" type="submit">Save Group</button>
                    <button class="btn btn-sm btn-secondary" type="button" @click.stop="cancelEdit">Cancel</button>
                </div>
            </form>

            <!-- Display Mode -->
            <div v-else class="group-card border rounded bg-white">
                <div class="group-header p-3 d-flex align-items-center" @click="toggleExpand(index)" style="cursor: pointer;">
                    <div class="flex-grow-1">
                        <strong>{{ group.name }}</strong>
                        <div class="text-muted small mt-1">
                            <span class="badge bg-secondary me-2">{{ group.categories.length }} categories</span>
                            <span class="badge bg-info">{{ group.paymentOptions.length }} payment options</span>
                        </div>
                    </div>
                    <div class="group-actions d-flex align-items-center gap-2">
                        <button v-if="editModeEnabled" class="btn btn-sm btn-outline-primary" @click.stop="editGroup(index)" title="Edit">
                            <Pencil :size="14" />
                        </button>
                        <button v-if="editModeEnabled" class="btn btn-sm btn-outline-secondary" @click.stop="copyGroup($event, index)" title="Copy">
                            <Copy :size="14" />
                        </button>
                        <button v-if="editModeEnabled" class="btn btn-sm btn-outline-danger" @click.stop="deleteGroup($event, index)" title="Delete">
                            <Trash2 :size="14" />
                        </button>
                        <button class="btn btn-sm btn-link text-muted" type="button">
                            <ChevronDown v-if="!isExpanded(index)" :size="16" />
                            <ChevronUp v-else :size="16" />
                        </button>
                    </div>
                </div>
                
                <div v-if="isExpanded(index)" class="group-details p-3 border-top bg-light">
                    <div class="mb-3">
                        <h6 class="small fw-bold mb-2">Categories:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            <span 
                                v-for="catId in group.categories" 
                                :key="catId"
                                class="badge bg-secondary"
                            >
                                {{ getCategoryName(catId) }}
                            </span>
                        </div>
                    </div>
                    
                    <div v-if="group.paymentOptions.length > 0">
                        <h6 class="small fw-bold mb-2">Payment Options:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th class="text-end">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(payOpt, payIndex) in group.paymentOptions" :key="payIndex">
                                        <td>{{ payOpt.name }}</td>
                                        <td>
                                            <code>{{ payOpt.type }}</code>
                                            <span v-if="isSpecialPaymentType(payOpt.type)" class="badge bg-warning text-dark ms-1">
                                                Special
                                            </span>
                                        </td>
                                        <td class="text-end">${{ payOpt.amount }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-else class="text-muted small">
                        No payment options defined for this group.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.group-container {
    transition: all 0.2s;
}

.group-card {
    transition: all 0.2s;
}

.group-card:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.group-header:hover {
    background-color: #f8f9fa;
}

.category-selector {
    background-color: white;
}

.payment-option-item {
    background-color: #f8f9fa;
}

.gap-2 {
    gap: 0.5rem;
}

code {
    font-size: 0.85em;
    color: #d63384;
    background-color: #f8f9fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
}
</style>

