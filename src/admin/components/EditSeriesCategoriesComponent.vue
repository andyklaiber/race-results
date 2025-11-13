<script>
import draggable from 'vuedraggable';
import { Pencil, Copy, Trash2, Plus, Edit } from 'lucide-vue-next';

export default {
    components: {
        draggable,
        Pencil,
        Copy,
        Trash2,
        Plus,
        Edit
    },
    props: {
        categories: {
            type: Array,
            default: () => []
        },
        payTypes: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['update:categories'],
    data() {
        return {
            formCats: [],
            editCatId: null,
            editFormData: {},
            editModeEnabled: false,
        }
    },
    mounted() {
        this.formCats = this.categories.map(cat => Object.assign({}, cat, { isExisting: true }));
    },
    watch: {
        categories: {
            handler(newCategories) {
                this.formCats = newCategories.map(cat => Object.assign({}, cat, { isExisting: true }));
            },
            deep: true
        }
    },
    methods: {
        emitUpdate() {
            const formData = this.formCats.map((cat, idx) => {
                let newCat = Object.assign({}, cat);
                newCat.disporder = idx + 1;
                delete newCat.isExisting;
                return newCat;
            });
            this.$emit('update:categories', formData);
        },
        
        editCategoryData(index) {
            if (this.editCatId === index) {
                return;
            }
            this.editCatId = index;
            this.editFormData = Object.assign({}, this.formCats[index]);
        },
        
        saveCategory(formData) {
            let existingCatData = this.formCats[this.editCatId];
            
            // Generate new ID if category name changed and it's not existing
            if (!existingCatData.isExisting && existingCatData.catdispname !== formData.catdispname) {
                formData.id = formData.catdispname.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            } else {
                formData.id = existingCatData.id;
            }
            
            this.formCats[this.editCatId] = Object.assign({}, formData, { isExisting: existingCatData.isExisting });
            this.editCatId = null;
            this.emitUpdate();
        },
        
        submitForm(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Validate required fields
            if (!this.editFormData.catdispname) {
                alert('Category name is required');
                return;
            }
            
            this.saveCategory(this.editFormData);
        },
        
        cancelEdit() {
            this.editCatId = null;
            this.editFormData = {};
        },
        
        addCategory() {
            const newCat = {
                id: 'new_category_' + Date.now(),
                catdispname: 'New Category',
                laps: 1,
                startTime: '',
                minAge: null,
                maxAge: null,
                sponsored: false,
                sponsorName: '',
                paytype: null,
                isExisting: false
            };
            this.formCats.push(newCat);
            this.editCatId = this.formCats.length - 1;
            this.editFormData = Object.assign({}, newCat);
        },
        
        copyCategory(event, index) {
            event.stopPropagation();
            let newCat = Object.assign({}, this.formCats[index]);
            newCat.catdispname = newCat.catdispname + ' (copy)';
            newCat.id = newCat.catdispname.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            newCat.isExisting = false;
            this.formCats.splice(index + 1, 0, newCat);
            this.emitUpdate();
        },
        
        deleteCategory(event, index) {
            event.stopPropagation();
            if (confirm('Delete this category?')) {
                this.formCats.splice(index, 1);
                this.emitUpdate();
            }
        },
        
        onDragEnd() {
            this.emitUpdate();
        },
        
        onDragStart() {
            if (this.editCatId !== null) {
                this.cancelEdit();
            }
        },
        
        checkMove() {
            return this.editCatId === null;
        }
    }
}
</script>

<template>
    <div class="edit-categories-form">
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
                <span v-if="editModeEnabled" class="text-muted ms-2 small">Click to edit, drag to reorder</span>
            </div>
            <button v-if="editModeEnabled" class="btn btn-sm btn-primary" @click="addCategory">
                <Plus :size="16" class="me-1" />
                Add Category
            </button>
        </div>

        <!-- Edit Mode Enabled -->
        <draggable 
            v-if="editModeEnabled"
            v-model="formCats" 
            @end="onDragEnd" 
            @start="onDragStart" 
            item-key="id" 
            :move="checkMove"
            handle=".drag-handle"
        >
            <template #item="{ element, index }">
                <div class="cat-group mb-2" @click="editCategoryData(index)">
                    <!-- Edit Form -->
                    <form v-if="editCatId === index" @submit.prevent="submitForm" class="p-3 border rounded bg-light">
                        <div class="row mb-2">
                            <div class="col-md-6">
                                <label class="form-label small">Category Name *</label>
                                <input 
                                    type="text" 
                                    class="form-control form-control-sm" 
                                    v-model="editFormData.catdispname"
                                    required
                                    style="min-width: 200px;"
                                >
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small">Laps</label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.laps"
                                    min="0"
                                >
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small">Start Time</label>
                                <div class="input-group input-group-sm">
                                    <input 
                                        type="time" 
                                        class="form-control form-control-sm" 
                                        v-model="editFormData.startTime"
                                        placeholder="HH:MM"
                                    >
                                    <button 
                                        v-if="editFormData.startTime"
                                        class="btn btn-outline-secondary" 
                                        type="button"
                                        @click="editFormData.startTime = ''"
                                        title="Clear start time"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="row mb-2">
                            <div class="col-md-3">
                                <label class="form-label small">Minimum Age</label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.minAge"
                                    min="0"
                                    placeholder="No minimum"
                                >
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small">Maximum Age</label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.maxAge"
                                    min="0"
                                    placeholder="No maximum"
                                >
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input 
                                        type="checkbox" 
                                        class="form-check-input" 
                                        id="sponsored"
                                        v-model="editFormData.sponsored"
                                    >
                                    <label class="form-check-label" for="sponsored">
                                        Sponsored (no entry fee)
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6" v-if="editFormData.sponsored">
                                <label class="form-label small">Sponsor Name</label>
                                <input 
                                    type="text" 
                                    class="form-control form-control-sm" 
                                    v-model="editFormData.sponsorName"
                                >
                            </div>
                        </div>

                        <div class="row mb-3" v-if="!editFormData.sponsored && Object.keys(payTypes).length > 0">
                            <div class="col-md-12">
                                <label class="form-label small">Force Payment Type (Optional)</label>
                                <select 
                                    class="form-select form-select-sm" 
                                    v-model="editFormData.paytype"
                                >
                                    <option :value="null">No forced payment type</option>
                                    <option v-for="(name, type) in payTypes" :key="type" :value="type">
                                        {{ name }} ({{ type }})
                                    </option>
                                </select>
                                <small class="text-muted">
                                    If set, this category will only be available with the selected payment type.
                                </small>
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-primary" type="submit">Save</button>
                            <button class="btn btn-sm btn-secondary" type="button" @click.stop="cancelEdit">Cancel</button>
                        </div>
                    </form>

                    <!-- Display Mode (Edit Mode Enabled) -->
                    <div v-else class="cat-row p-2 border rounded bg-white d-flex align-items-center">
                        <div class="drag-handle me-2" style="cursor: move;">
                            <span class="text-muted">⋮⋮</span>
                        </div>
                        <div class="cat-name flex-grow-1">
                            <strong>{{ element.catdispname }}</strong>
                            <span v-if="element.startTime" class="text-muted ms-2 small">🕐 {{ element.startTime }}</span>
                            <span v-if="element.laps" class="text-muted ms-2 small">({{ element.laps }} laps)</span>
                            <span v-if="element.minAge || element.maxAge" class="text-muted ms-2 small">
                                Ages: {{ element.minAge || '—' }} - {{ element.maxAge || '—' }}
                            </span>
                        </div>
                        <div class="cat-badges me-2">
                            <span v-if="element.sponsored" class="badge bg-success">Sponsored</span>
                            <span v-else-if="element.paytype && payTypes[element.paytype]" class="badge bg-info">
                                {{ payTypes[element.paytype] }}
                            </span>
                        </div>
                        <div class="cat-actions d-flex align-items-center gap-2">
                            <span class="badge bg-secondary">{{ index + 1 }}</span>
                            <button class="btn btn-sm btn-outline-secondary" @click.stop="copyCategory($event, index)" title="Copy">
                                <Copy :size="14" />
                            </button>
                            <button class="btn btn-sm btn-outline-danger" @click.stop="deleteCategory($event, index)" title="Delete">
                                <Trash2 :size="14" />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </draggable>

        <!-- Compact View Mode -->
        <div v-else class="compact-view">
            <div class="table-responsive">
                <table class="table table-sm table-hover table-bordered mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Category Name</th>
                            <th style="width: 100px;">Start Time</th>
                            <th style="width: 80px;">Laps</th>
                            <th style="width: 90px;">Min Age</th>
                            <th style="width: 90px;">Max Age</th>
                            <th style="width: 150px;">Sponsored</th>
                            <th style="width: 150px;">Payment Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(element, index) in formCats" :key="element.id">
                            <td class="text-center text-muted">{{ index + 1 }}</td>
                            <td><strong>{{ element.catdispname }}</strong></td>
                            <td class="text-center">
                                <span v-if="element.startTime" class="text-nowrap">{{ element.startTime }}</span>
                                <span v-else class="text-muted">—</span>
                            </td>
                            <td class="text-center">{{ element.laps || '—' }}</td>
                            <td class="text-center">{{ element.minAge || '—' }}</td>
                            <td class="text-center">{{ element.maxAge || '—' }}</td>
                            <td>
                                <span v-if="element.sponsored" class="badge bg-success">
                                    {{ element.sponsorName || 'Sponsored' }}
                                </span>
                                <span v-else class="text-muted">—</span>
                            </td>
                            <td>
                                <span v-if="element.paytype && payTypes[element.paytype]" class="badge bg-info">
                                    {{ payTypes[element.paytype] }}
                                </span>
                                <span v-else class="text-muted">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="formCats.length === 0" class="text-center text-muted py-4 border rounded">
            No categories defined. Click "Add Category" to create one.
        </div>
    </div>
</template>

<style scoped>
.cat-group {
    cursor: pointer;
    transition: all 0.2s;
}

.cat-group:hover .cat-row {
    background-color: #f8f9fa !important;
}

.cat-row {
    transition: background-color 0.2s;
}

.drag-handle {
    user-select: none;
}

.gap-2 {
    gap: 0.5rem;
}

/* Compact View Styles */
.compact-view {
    font-size: 0.875rem;
}

.compact-view table {
    background-color: white;
}

.compact-view thead th {
    font-weight: 600;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
}

.compact-view tbody tr:hover {
    background-color: #f8f9fa;
}

.compact-view .badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

/* Time input clear button */
.input-group .btn-outline-secondary {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1;
    border-color: #ced4da;
}

.input-group .btn-outline-secondary:hover {
    background-color: #dc3545;
    border-color: #dc3545;
    color: white;
}
</style>

