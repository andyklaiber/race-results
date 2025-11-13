<script>
import draggable from 'vuedraggable';
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import { Pencil, Copy, Trash2, Link, Lock, Edit3 } from 'lucide-vue-next';

export default {
    components: {
        draggable,
        ModalComponent,
        Pencil,
        Copy,
        Trash2,
        Link,
        Lock,
        Edit3
    },
    props: [
        "categories",
        "payTypes",
        "seriesId",  // Series ID if this race is part of a series
    ],
    emits: ['save', 'show', 'close'],
    data() {
        return {
            formError: [],
            formInputData: {},
            formCats: [],
            editCatId: null,
            show: false,
            editFormData: {}, // Track the live form data for conditional rendering
            seriesCategories: [],  // Categories from the series
            seriesPaymentGroups: [],  // Payment groups from series
            loadingSeriesData: false,
        }
    },
    async mounted() {
        // Mark existing categories to prevent ID changes
        this.formCats = this.categories.map(cat => Object.assign({}, cat, { isExisting: true }));
        
        // Fetch series data if this race belongs to a series
        if (this.seriesId) {
            await this.fetchSeriesData();
        }
    },
    watch: {
        // Reset form data whenever categories prop changes (e.g., when modal reopens)
        categories: {
            handler(newCategories) {
                this.resetFormData();
            },
            deep: true
        },
        // Watch for series changes
        async seriesId(newSeriesId) {
            if (newSeriesId) {
                await this.fetchSeriesData();
            } else {
                this.seriesCategories = [];
                this.seriesPaymentGroups = [];
            }
        }
    },
    computed: {
        payTypeOptions() {
            // Filter out season and cash payment types - these shouldn't be forced for categories
            const filteredPayTypes = {};
            for (const [key, value] of Object.entries(this.payTypes)) {
                // Exclude season and cash types
                if (key !== 'season' && key !== 'cash') {
                    filteredPayTypes[key] = value;
                }
            }
            return {
                null: 'Not required',
                ...filteredPayTypes
            }
        },
        // Group categories by their source (series vs race-specific vs race-override)
        categoriesBySource() {
            const seriesCatIds = new Set(this.seriesCategories.map(cat => cat.id));
            return {
                series: this.formCats.filter(cat => seriesCatIds.has(cat.id) && !cat.isRaceOverride),
                raceOverrides: this.formCats.filter(cat => cat.isRaceOverride),
                raceSpecific: this.formCats.filter(cat => !seriesCatIds.has(cat.id) && !cat.isRaceOverride)
            };
        }
    },
    methods: {
        async fetchSeriesData() {
            if (!this.seriesId) return;
            
            this.loadingSeriesData = true;
            try {
                const response = await request(`/api/series/${this.seriesId}`);
                if (response.data) {
                    this.seriesCategories = response.data.regCategories || [];
                    this.seriesPaymentGroups = response.data.categoryGroups || [];
                    
                    // Mark which categories in formCats are from the series
                    const seriesCatIds = new Set(this.seriesCategories.map(cat => cat.id));
                    this.formCats = this.formCats.map(cat => ({
                        ...cat,
                        isFromSeries: seriesCatIds.has(cat.id) && !cat._isRaceOverride,
                        isRaceOverride: cat._isRaceOverride === true
                    }));
                }
            } catch (error) {
                console.error('Error fetching series data:', error);
            } finally {
                this.loadingSeriesData = false;
            }
        },
        resetFormData() {
            // Reset formCats to original categories with isExisting flag
            this.formCats = this.categories.map(cat => {
                const isFromSeries = this.seriesCategories.some(sCat => sCat.id === cat.id) && !cat._isRaceOverride;
                return Object.assign({}, cat, { 
                    isExisting: true,
                    isFromSeries,
                    isRaceOverride: cat._isRaceOverride === true
                });
            });
            // Clear any active edit state
            this.editCatId = null;
        },
        getCategoryPaymentInfo(category) {
            // Check if this category has a forced paytype
            if (category.paytype) {
                return {
                    type: 'forced',
                    label: this.payTypeOptions[category.paytype] || category.paytype
                };
            }
            
            // Check if this category is part of a series payment group
            if (category.isFromSeries && this.seriesPaymentGroups.length > 0) {
                for (const group of this.seriesPaymentGroups) {
                    if (group.categories && group.categories.includes(category.id)) {
                        const paymentTypes = group.paymentOptions?.map(opt => opt.name).join(', ') || 'No payments';
                        return {
                            type: 'series-group',
                            label: group.name,
                            payments: paymentTypes
                        };
                    }
                }
            }
            
            return {
                type: 'any',
                label: 'Any payment type'
            };
        },
        async submitHandler() {
            // Only save categories that should be stored in the race database
            // Filter out pure series categories (they come from the series)
            // Keep race overrides and race-specific categories
            let formData = this.formCats
                .filter(cat => !cat.isFromSeries) // Exclude pure series categories
                .map((cat, idx) => {
                    let newCat = Object.assign({}, cat);
                    if(newCat.paytype == "null"){
                        delete newCat.paytype;
                    }
                    newCat.disporder = idx + 1;
                    
                    // Clean up UI-only flags before saving
                    delete newCat.isExisting;
                    delete newCat.isFromSeries;
                    delete newCat.isRaceOverride;

                    return newCat;
                });
            
            console.log('Saving categories to database:', formData);
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
            // Only generate new ID if this is a NEW category (not existing in database)
            // This prevents breaking registrations for existing categories
            if (!existingCatData.isExisting && existingCatData.catdispname !== formData.catdispname) {
                existingCatData.id = this.formatNameToId(formData.catdispname);
            } else if (!existingCatData.id) {
                // Generate ID for brand new categories that don't have one
                existingCatData.id = this.formatNameToId(formData.catdispname);
            }
            Object.assign(existingCatData, formData)
            // Clean up fields based on sponsored status
            if (existingCatData.paytype === null) {
                delete existingCatData.paytype;
            }
            if (!existingCatData.sponsored) {
                // Remove sponsor name if not sponsored
                delete existingCatData.sponsorName;
            } else {
                // Remove paytype if sponsored
                delete existingCatData.paytype;
            }
            console.log("update: ", existingCatData)
            this.formCats.splice(this.editCatId, 1, existingCatData);
            this.editCatId = null;
            this.editFormData = {};
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
                this.editCatId = index;
                // Initialize form data with current category values
                this.editFormData = { ...this.formCats[index] };
            }
        },
        cancelEdit(event) {
            event.stopPropagation();
            this.editCatId = null;
            this.editFormData = {};
        },
        addRaceSpecificCategory() {
            const newCat = {
                id: 'race_category_' + Date.now(),
                catdispname: 'New Race Category',
                laps: 1,
                isExisting: false,
                isFromSeries: false
            };
            this.formCats.push(newCat);
            // Automatically open it for editing
            this.editCatId = this.formCats.length - 1;
            this.editFormData = { ...newCat };
        },
        removeAllRaceSpecificCategories() {
            const raceSpecificCount = this.categoriesBySource.raceSpecific.length;
            
            const confirmMsg = `Remove all ${raceSpecificCount} race-specific ${raceSpecificCount === 1 ? 'category' : 'categories'}?\n\n` +
                `This will keep only the ${this.categoriesBySource.series.length} series-inherited ${this.categoriesBySource.series.length === 1 ? 'category' : 'categories'}.\n\n` +
                `This action cannot be undone.`;
            
            if (confirm(confirmMsg)) {
                // Keep only series categories
                this.formCats = this.formCats.filter(cat => cat.isFromSeries);
                this.emitUpdate();
                alert(`Removed ${raceSpecificCount} race-specific ${raceSpecificCount === 1 ? 'category' : 'categories'}.`);
            }
        },
        overrideAllSeriesCategories() {
            const seriesCatCount = this.categoriesBySource.series.length;
            
            if (seriesCatCount === 0) {
                alert('No series categories to override.');
                return;
            }
            
            const confirmMsg = `Override all ${seriesCatCount} series ${seriesCatCount === 1 ? 'category' : 'categories'}?\n\n` +
                `This will create race-specific copies that you can customize (laps, age restrictions, payment types, etc.).\n\n` +
                `The categories will no longer automatically sync with series changes.`;
            
            if (confirm(confirmMsg)) {
                // Convert all series categories to race-specific overrides
                this.formCats = this.formCats.map(cat => {
                    if (cat.isFromSeries) {
                        return {
                            ...cat,
                            isFromSeries: false,
                            isRaceOverride: true,
                            isExisting: false
                        };
                    }
                    return cat;
                });
                alert(`Overridden ${seriesCatCount} series ${seriesCatCount === 1 ? 'category' : 'categories'}.\n\nYou can now customize them for this race.`);
            }
        },
        copyCategory(event, index) {
            event.stopPropagation();
            const cat = this.formCats[index];
            
            // If it's a series category, create a race-specific override (keep same ID)
            if (cat.isFromSeries) {
                const overrideCat = { ...cat };
                overrideCat.catdispname = overrideCat.catdispname + ' (override)';
                // Keep the same ID so it overrides the series category
                // Mark as race-specific override
                overrideCat.isFromSeries = false;
                overrideCat.isRaceOverride = true;
                overrideCat.isExisting = false;
                this.formCats.splice(index, 1, overrideCat);
            } else {
                // Regular copy for race-specific categories
                const newCat = { ...cat };
                newCat.catdispname = newCat.catdispname + ' (copy)';
                newCat.id = this.formatNameToId(newCat.catdispname);
                newCat.isExisting = false;
                newCat.isFromSeries = false;
                newCat.isRaceOverride = false;
                this.formCats.splice(index + 1, 0, newCat);
            }
        },
        deleteCategory(event, index) {
            event.stopPropagation();
            const cat = this.formCats[index];
            
            // Prevent deletion of series categories (but allow deletion of race overrides)
            if (cat.isFromSeries) {
                alert('Cannot delete series categories. They are inherited from the series and will reappear on reload.\n\nTo customize a series category for this race, use the "Override" button instead.');
                return;
            }
            
            // Allow deletion of race overrides with confirmation
            if (cat.isRaceOverride) {
                if (!confirm(`Delete this race override?\n\nThis will remove the race-specific customization for "${cat.catdispname}".\nThe original series category will be restored immediately.`)) {
                    return;
                }
                
                // Find the original series category and restore it
                const seriesCat = this.seriesCategories.find(sc => sc.id === cat.id);
                if (seriesCat) {
                    // Replace the override with the series category
                    const restoredCat = {
                        ...seriesCat,
                        disporder: cat.disporder, // Keep the same position
                        isFromSeries: true,
                        isRaceOverride: false,
                        isExisting: true
                    };
                    this.formCats.splice(index, 1, restoredCat);
                    return;
                }
            }
            
            // For race-specific categories, just delete them
            this.formCats.splice(index, 1);
        },
        cancelModal() {
            // Reset all changes when user cancels
            this.resetFormData();
            this.$emit('close');
        },
        checkMove: function (evt) {
            return this.editCatId === null;
        }
    }
}
</script>
    
<template>
    
            <!-- use the modal component, pass in the prop -->
            <modal-component :show="show" @close="cancelModal">
              <template #header>
                <h5>
                  Edit Race Categories
                </h5>
                Click to Edit, Drag to reorder categories
              </template>
              <template #body>
    <div class="edit-categories-form">
        <!-- Series Information Banner -->
        <div v-if="seriesId && seriesCategories.length > 0" class="series-info-banner mb-3">
            <Link :size="20" class="series-icon" />
            <div class="series-info-text flex-grow-1">
                <strong>Series Integration:</strong> 
                {{ categoriesBySource.series.length }} {{ categoriesBySource.series.length === 1 ? 'category is' : 'categories are' }} inherited from the series.
                <span v-if="categoriesBySource.raceOverrides.length > 0">
                    {{ categoriesBySource.raceOverrides.length }} race {{ categoriesBySource.raceOverrides.length === 1 ? 'override' : 'overrides' }}.
                </span>
                <span v-if="categoriesBySource.raceSpecific.length > 0">
                    {{ categoriesBySource.raceSpecific.length }} race-specific {{ categoriesBySource.raceSpecific.length === 1 ? 'category' : 'categories' }}.
                </span>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary" @click="addRaceSpecificCategory" type="button">
                    + Add Race Category
                </button>
                <button 
                    class="btn btn-sm btn-outline-warning" 
                    @click="overrideAllSeriesCategories" 
                    type="button"
                    :disabled="categoriesBySource.series.length === 0"
                    :title="categoriesBySource.series.length === 0 ? 'No series categories to override' : 'Override all series categories for race-specific customization'">
                    Override All Series Categories
                </button>
                <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="removeAllRaceSpecificCategories" 
                    type="button"
                    :disabled="categoriesBySource.raceSpecific.length === 0"
                    :title="categoriesBySource.raceSpecific.length === 0 ? 'No race-specific categories to remove' : 'Remove Non-Series categories'">
                    Remove Non-Series Categories
                </button>
            </div>
        </div>

        <!-- <FormKit type="form" id="edit-categories" v-model="formInputData" 
        :errors="formError" submit-label="Save" @submit="submitHandler"> -->
        <draggable v-model="formCats" @end="onDragEnd" @start="onDragStart" item-key="id" :move="checkMove">
            <template #item="{ element, index }">
                <div class="cat-group" @click="editCategoryData(index)">

                    <FormKit v-if="editCatId === index" type="form" id="editingCategoryForm" label="Category Name"
                        validation="required" @submit="saveCategory" :actions="false" v-model="editFormData">
                        <div v-if="editFormData.isFromSeries" class="alert alert-info d-flex align-items-start gap-2 py-2 px-3 mb-3">
                            <Link :size="18" class="mt-1 flex-shrink-0" />
                            <div>
                                <div class="d-flex align-items-center gap-1">
                                    <strong>Series Category</strong>
                                </div>
                                <small class="d-block mt-1">
                                    <Lock :size="14" class="me-1" style="display: inline-block; vertical-align: middle;" />
                                    <strong>Locked:</strong> Category name & payment type (edit in series)<br>
                                    <Edit3 :size="14" class="me-1" style="display: inline-block; vertical-align: middle;" />
                                    <strong>Editable:</strong> Laps, start time, and age restrictions (race-specific overrides)
                                </small>
                            </div>
                        </div>
                        <div v-else-if="editFormData.isRaceOverride" class="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mb-3">
                            <Edit3 :size="18" class="mt-1 flex-shrink-0" />
                            <div>
                                <div class="d-flex align-items-center gap-1">
                                    <strong>Race Override</strong>
                                </div>
                                <small class="d-block mt-1">
                                    This category overrides the series category with the same ID. All fields are editable for this race only.
                                </small>
                            </div>
                        </div>
                        
                        <div class="double">
                            <div class="formkit-outer" style="width: calc(50% - 0.5em);">
                                <label class="form-label small fw-bold d-flex align-items-center">
                                    Category Name
                                    <span v-if="editFormData.isFromSeries" class="text-muted ms-2 d-flex align-items-center">
                                        <Lock :size="14" class="me-1" /> Locked
                                    </span>
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control form-control-sm" 
                                    v-model="editFormData.catdispname"
                                    :disabled="editFormData.isFromSeries"
                                    :class="{ 'bg-light': editFormData.isFromSeries }"
                                    required
                                >
                                <small v-if="editFormData.isFromSeries" class="text-muted">
                                    Edit in series settings
                                </small>
                                <small v-else-if="editFormData.isRaceOverride" class="text-muted">
                                    Race-specific override
                                </small>
                                <small v-else class="text-muted">
                                    Display name for this category
                                </small>
                            </div>
                            
                            <div class="formkit-outer" style="width: calc(50% - 0.5em);">
                                <label class="form-label small fw-bold d-flex align-items-center">
                                    Laps
                                    <span v-if="editFormData.isFromSeries" class="text-success ms-2 d-flex align-items-center">
                                        <Edit3 :size="14" class="me-1" /> Race Override
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.laps"
                                    min="0"
                                >
                                <small v-if="editFormData.isFromSeries" class="text-muted">
                                    Customize for this race
                                </small>
                                <small v-else class="text-muted">
                                    Number of laps
                                </small>
                            </div>
                        </div>

                        <div class="double">
                            <div class="formkit-outer" style="width: calc(50% - 0.5em);">
                                <label class="form-label small fw-bold d-flex align-items-center">
                                    Minimum Age
                                    <span v-if="editFormData.isFromSeries" class="text-success ms-2 d-flex align-items-center">
                                        <Edit3 :size="14" class="me-1" /> Race Override
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.minAge"
                                    min="0"
                                    placeholder="No minimum"
                                >
                                <small class="text-muted">
                                    {{ editFormData.isFromSeries ? 'Override series age restriction' : 'Enforces age restrictions' }}
                                </small>
                            </div>
                            
                            <div class="formkit-outer" style="width: calc(50% - 0.5em);">
                                <label class="form-label small fw-bold d-flex align-items-center">
                                    Maximum Age
                                    <span v-if="editFormData.isFromSeries" class="text-success ms-2 d-flex align-items-center">
                                        <Edit3 :size="14" class="me-1" /> Race Override
                                    </span>
                                </label>
                                <input 
                                    type="number" 
                                    class="form-control form-control-sm" 
                                    v-model.number="editFormData.maxAge"
                                    min="0"
                                    placeholder="No maximum"
                                >
                                <small class="text-muted">
                                    {{ editFormData.isFromSeries ? 'Override series age restriction' : 'Category hidden if outside range' }}
                                </small>
                            </div>
                        </div>
                        
                        <div class="double">
                            <FormKit type="checkbox" name="sponsored" label="Sponsored"
                                :disabled="editFormData.isFromSeries"
                                :help="editFormData.isFromSeries ? 'Managed at series level' : 'If checked, no entry fee will be charged'" />
                            <FormKit v-if="!editFormData.sponsored && (!editFormData.isFromSeries || editFormData.isRaceOverride)" type="select" name="paytype" label="Category Payment Type"
                                :help="editFormData.isRaceOverride ? 'Race-specific payment type override' : 'Force payment type when this category is selected'"
                                :options="payTypeOptions" />
                            <div v-else-if="editFormData.isFromSeries && !editFormData.sponsored && !editFormData.isRaceOverride" class="formkit-outer" style="width: calc(50% - 0.5em);">
                                <label class="form-label small fw-bold d-flex align-items-center">
                                    Payment Type
                                    <span class="text-muted ms-2 d-flex align-items-center">
                                        <Lock :size="14" class="me-1" /> From Series
                                    </span>
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control form-control-sm bg-light" 
                                    :value="getCategoryPaymentInfo(editFormData).label"
                                    disabled
                                >
                                <small class="text-muted">
                                    Payment options defined in series category groups
                                </small>
                            </div>
                            <FormKit v-else-if="editFormData.sponsored" type="text" name="sponsorName" label="Sponsor Name"
                                validation="required" />
                        </div>
                        <button class="btn btn-primary my-3 mx-2" type="button" @click="submitForm">Save</button>
                        <button class="btn btn-danger my-3 mx-2" type="button" @click="cancelEdit">Cancel</button>
                    </FormKit>
                    <div v-else class="cat-row" :class="{ 'from-series': element.isFromSeries, 'race-override': element.isRaceOverride }">
                        <div class="cat-name">
                            <Link v-if="element.isFromSeries" :size="16" class="series-icon me-1" title="Inherited from series" />
                            <Edit3 v-else-if="element.isRaceOverride" :size="16" class="override-icon me-1" title="Race override of series category" />
                            {{ element.catdispname }}
                        </div>
                        <div class="cat-badges">
                            <strong v-if="element.sponsored" class="sponsored-badge">Sponsored</strong>
                            <span v-else-if="element.isFromSeries && getCategoryPaymentInfo(element).type === 'series-group'" 
                                  class="series-group-badge"
                                  :title="getCategoryPaymentInfo(element).payments">
                                {{ getCategoryPaymentInfo(element).label }}
                            </span>
                            <span v-else-if="element.paytype && !element.sponsored" class="paytype-badge">
                                {{ payTypeOptions[element.paytype] }}
                            </span>
                        </div>
                        <div class="cat-actions">
                            <label class="cat-position">{{ index + 1 }} of {{ formCats.length }}</label>
                            <Copy 
                                v-if="!element.isFromSeries"
                                class="action-icon" 
                                color="black" 
                                @click="copyCategory($event, index)"
                                title="Duplicate this category"></Copy>
                            <Edit3 
                                v-else
                                class="action-icon override-icon" 
                                color="#1565c0" 
                                @click="copyCategory($event, index)"
                                title="Override series category - customize for this race"></Edit3>
                            <Trash2 
                                class="action-icon" 
                                :class="{ 'disabled-icon': element.isFromSeries }"
                                :color="element.isFromSeries ? '#ccc' : 'black'" 
                                @click="deleteCategory($event, index)"
                                :title="element.isFromSeries ? 'Cannot delete series categories' : 'Delete this category'"></Trash2>
                        </div>
                    </div>
                </div>
            </template>
        </draggable>
        <!-- </FormKit> -->


    </div>
    <div class="modal-footer-buttons mt-3">
        <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save</button>
        <button class="btn btn-sm btn-danger px-3 mx-3" @click="cancelModal">Cancel</button>
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

.series-info-banner {
    background-color: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.series-info-banner .series-icon {
    color: #1976d2;
    flex-shrink: 0;
}

.series-info-text {
    font-size: 0.9em;
    color: #1565c0;
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

.cat-group.from-series {
    background-color: #f5f9ff;
    border-left: 3px solid #1976d2;
}

.cat-group.race-override {
    background-color: #fff8e1;
    border-left: 3px solid #f57c00;
}

.cat-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr auto;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
}

.cat-row.from-series {
    background-color: #f5f9ff;
}

.cat-row.race-override {
    background-color: #fff8e1;
}

.cat-name {
    cursor: move;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
}

.series-icon {
    color: #1976d2;
    flex-shrink: 0;
}

.override-icon {
    color: #f57c00;
    flex-shrink: 0;
}

.cat-badges {
    display: flex;
    gap: 8px;
    align-items: center;
}

.sponsored-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #fff3e0;
    color: #f57c00;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 600;
}

.paytype-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #e3f2fd;
    color: #1976d2;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 500;
    white-space: nowrap;
}

.series-group-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #e8f5e9;
    color: #2e7d32;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 500;
    white-space: nowrap;
    cursor: help;
}

.cat-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;
}

.cat-position {
    margin: 0;
    font-size: 0.9em;
    color: #666;
    white-space: nowrap;
}

.action-icon {
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s;
}

.action-icon:hover:not(.disabled-icon) {
    transform: scale(1.1);
}

.action-icon.override-icon {
    filter: drop-shadow(0 0 2px rgba(21, 101, 192, 0.5));
}

.action-icon.disabled-icon {
    cursor: not-allowed;
    opacity: 0.5;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
}</style>