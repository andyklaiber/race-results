<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import { RouterLink } from 'vue-router';
import { ArrowLeft, Save, Download } from 'lucide-vue-next';
import EditSeriesCategoriesComponent from './EditSeriesCategoriesComponent.vue';
import EditCategoryGroupsComponent from './EditCategoryGroupsComponent.vue';

export default {
  components: {
    RouterLink,
    ArrowLeft,
    Save,
    Download,
    EditSeriesCategoriesComponent,
    EditCategoryGroupsComponent
  },
  data() {
    return {
      loading: false,
      saving: false,
      error: null,
      saveError: null,
      saveSuccess: false,
      seriesData: null,
      formData: {
        name: '',
        displayName: '',
        year: new Date().getFullYear(),
        active: true,
        description: '',
        regCategories: [],
        categoryGroups: [],
        defaultPaymentOptions: []
      },
      // Race management
      allRaces: [],
      racesInSeries: [],
      racesNotInSeries: [],
      selectedRacesInSeries: [],
      selectedRacesNotInSeries: [],
      loadingRaces: false,
      racesError: null,
      updatingRaces: false,
      raceSearchFilter: '',
      showAddRacesModal: false,
      // Sticky save button
      showStickySaveButton: false,
      hasUnsavedChanges: false,
      originalFormData: null,
      // Category import
      showImportCategoriesModal: false,
      importRaces: [],
      loadingImportRaces: false,
      selectedImportRaceId: null,
      selectedImportRaceCategories: null
    };
  },
  async created() {
    await this.fetchData();
    this.fetchRaces();
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  watch: {
    '$route.params.seriesId': {
      async handler() {
        await this.fetchData();
        await this.fetchRaces();
      }
    },
    formData: {
      handler() {
        this.checkForChanges();
      },
      deep: true
    }
  },
  methods: {
    async fetchData() {
      this.error = null;
      this.loading = true;
      
      try {
        const response = await request(`/api/series/${this.$route.params.seriesId}`);
        this.seriesData = response.data;
        
        // Populate form data
        this.formData = {
          name: this.seriesData.name || '',
          displayName: this.seriesData.displayName || '',
          year: this.seriesData.year || new Date().getFullYear(),
          active: this.seriesData.active !== undefined ? this.seriesData.active : true,
          description: this.seriesData.description || '',
          regCategories: this.seriesData.regCategories || [],
          categoryGroups: this.seriesData.categoryGroups || [],
          defaultPaymentOptions: this.seriesData.defaultPaymentOptions || []
        };
        
        // Store original data for comparison
        this.originalFormData = JSON.parse(JSON.stringify(this.formData));
        this.hasUnsavedChanges = false;
        
        this.loading = false;
      } catch (err) {
        this.loading = false;
        this.error = err.response?.data?.message || err.message || err.toString();
        console.error(err);
      }
    },
    
    async saveSeries() {
      this.saveError = null;
      this.saveSuccess = false;
      this.saving = true;
      
      try {
        await request.patch(`/api/series/${this.$route.params.seriesId}`, this.formData);
        this.saveSuccess = true;
        this.saving = false;
        
        // Refresh data
        await this.fetchData();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      } catch (error) {
        this.saving = false;
        this.saveError = error.response?.data?.message || error.message || 'Error saving series';
        console.error('Error saving series:', error);
      }
    },
    
    
    async fetchRaces() {
      this.loadingRaces = true;
      this.racesError = null;
      
      try {
        // Fetch races from today onwards (exclude past races)
        const today = new Date().toISOString().split('T')[0];
        const response = await request(`/api/races?startDate=${today}`);
        this.allRaces = response.data;
        
        // Split races into those in this series and those not
        // Use the actual series ID from the loaded series data
        const seriesId = this.seriesData?.seriesId || this.seriesData?.series || this.$route.params.seriesId;
        this.racesInSeries = this.allRaces.filter(race => race.series === seriesId);
        this.racesNotInSeries = this.allRaces.filter(race => race.series !== seriesId);
        
        this.loadingRaces = false;
      } catch (err) {
        this.loadingRaces = false;
        this.racesError = err.response?.data?.message || err.message || 'Error loading races';
        console.error('Error loading races:', err);
      }
    },
    
    toggleRaceSelection(raceId) {
      const index = this.selectedRacesNotInSeries.indexOf(raceId);
      if (index > -1) {
        this.selectedRacesNotInSeries.splice(index, 1);
      } else {
        this.selectedRacesNotInSeries.push(raceId);
      }
    },
    
    async addRacesToSeries() {
      if (this.selectedRacesNotInSeries.length === 0) return;
      
      this.updatingRaces = true;
      try {
        await request.post(`/api/series/${this.$route.params.seriesId}/races`, {
          raceIds: this.selectedRacesNotInSeries,
          action: 'add'
        });
        
        // Refresh race lists
        await this.fetchRaces();
        this.selectedRacesNotInSeries = [];
        this.showAddRacesModal = false;
        this.raceSearchFilter = '';
      } catch (err) {
        this.racesError = err.response?.data?.message || err.message || 'Error adding races';
        console.error('Error adding races:', err);
      } finally {
        this.updatingRaces = false;
      }
    },
    
    async removeRaceFromSeries(raceId) {
      if (!confirm('Remove this race from the series?')) return;
      
      this.updatingRaces = true;
      try {
        await request.post(`/api/series/${this.$route.params.seriesId}/races`, {
          raceIds: [raceId],
          action: 'remove'
        });
        
        // Refresh race lists
        await this.fetchRaces();
      } catch (err) {
        this.racesError = err.response?.data?.message || err.message || 'Error removing race';
        console.error('Error removing race:', err);
      } finally {
        this.updatingRaces = false;
      }
    },
    
    formatRaceDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    
    handleScroll() {
      // Show sticky button when scrolled down more than 300px
      this.showStickySaveButton = window.scrollY > 300;
    },
    
    checkForChanges() {
      if (!this.originalFormData) return;
      
      // Compare current formData with original
      const currentData = JSON.stringify(this.formData);
      const originalData = JSON.stringify(this.originalFormData);
      this.hasUnsavedChanges = currentData !== originalData;
    },
    
    async openImportCategoriesModal() {
      this.showImportCategoriesModal = true;
      this.selectedImportRaceId = null;
      this.selectedImportRaceCategories = null;
      await this.fetchImportRaces();
    },
    
    async fetchImportRaces() {
      this.loadingImportRaces = true;
      try {
        // Fetch all races (past and future) by using a very old startDate
        // This bypasses the default 1-day filter in the API
        const response = await request('/api/races?startDate=2020-01-01');
        // Filter races that have categories defined and sort by date (most recent first)
        this.importRaces = response.data
          .filter(race => race.regCategories && race.regCategories.length > 0)
          .sort((a, b) => {
            const dateA = new Date(a.eventDate || 0);
            const dateB = new Date(b.eventDate || 0);
            return dateB - dateA; // Most recent first
          });
        this.loadingImportRaces = false;
      } catch (err) {
        this.loadingImportRaces = false;
        console.error('Error loading races for import:', err);
      }
    },
    
    async selectImportRace(raceId) {
      this.selectedImportRaceId = raceId;
      // Find the race and get its categories
      const race = this.importRaces.find(r => r.raceid === raceId);
      if (race && race.regCategories) {
        this.selectedImportRaceCategories = race.regCategories;
      }
    },
    
    confirmImportCategories() {
      if (!this.selectedImportRaceCategories) return;
      
      // Deep clone the categories to avoid reference issues
      this.formData.regCategories = JSON.parse(JSON.stringify(this.selectedImportRaceCategories));
      
      // Close modal and reset
      this.showImportCategoriesModal = false;
      this.selectedImportRaceId = null;
      this.selectedImportRaceCategories = null;
    },
    
    closeImportCategoriesModal() {
      this.showImportCategoriesModal = false;
      this.selectedImportRaceId = null;
      this.selectedImportRaceCategories = null;
    },
    
    // Default Payment Options Management
    addDefaultPaymentOption() {
      this.formData.defaultPaymentOptions.push({
        name: '',
        type: '',
        amount: 0
      });
    },
    
    removeDefaultPaymentOption(index) {
      if (confirm('Remove this default payment option?')) {
        this.formData.defaultPaymentOptions.splice(index, 1);
      }
    },
    
    addDefaultSpecialPaymentType(type) {
      // Check if this type already exists
      const exists = this.formData.defaultPaymentOptions.some(pt => pt.type === type);
      if (exists) {
        alert(`A ${type} payment type already exists in default payment options`);
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
      
      this.formData.defaultPaymentOptions.push(newPaytype);
    },
    
    isSpecialPaymentType(type) {
      return type === 'season' || type === 'cash';
    }
  },
  computed: {
    loaded() {
      return !!this.seriesData;
    },
    filteredRacesNotInSeries() {
      if (!this.raceSearchFilter) return this.racesNotInSeries;
      
      const searchLower = this.raceSearchFilter.toLowerCase();
      return this.racesNotInSeries.filter(race => {
        const raceName = race.eventDetails?.name || '';
        return raceName.toLowerCase().includes(searchLower);
      });
    },
    seriesDefaultPaymentTypesMap() {
      // Convert defaultPaymentOptions array to a map for the categories component
      const payTypesMap = {};
      (this.formData.defaultPaymentOptions || []).forEach(opt => {
        payTypesMap[opt.type] = opt.name;
      });
      return payTypesMap;
    }
  }
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else class="edit-series-wrapper" :class="{ 'has-sticky-bar': showStickySaveButton }">
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="loaded">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <RouterLink :to="{ name: 'series' }" class="text-decoration-none me-3">
            <ArrowLeft :size="24" />
          </RouterLink>
          Edit Series: {{ seriesData.displayName || seriesData.name }}
        </h2>
        <div class="d-flex gap-2">
          <RouterLink 
            :to="{ name: 'races', query: { series: seriesData.seriesId || seriesData.series }}" 
            class="btn btn-outline-secondary"
          >
            View Races in Series
          </RouterLink>
          <button 
            class="btn btn-primary" 
            @click="saveSeries"
            :disabled="saving"
          >
            <Save :size="16" class="me-1" />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-if="saveSuccess" class="alert alert-success alert-dismissible fade show" role="alert">
        Series saved successfully!
        <button type="button" class="btn-close" @click="saveSuccess = false"></button>
      </div>

      <div v-if="saveError" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ saveError }}
        <button type="button" class="btn-close" @click="saveError = null"></button>
      </div>

      <div class="row">
        <div class="col-lg-9">
          <!-- Basic Information -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Basic Information</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label for="seriesId" class="form-label">Series ID</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="seriesId" 
                  :value="seriesData.seriesId || seriesData.series"
                  disabled
                >
                <small class="form-text text-muted">Cannot be changed</small>
              </div>

              <div class="mb-3">
                <label for="name" class="form-label">Name *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="name" 
                  v-model="formData.name"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="displayName" class="form-label">Display Name *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="displayName" 
                  v-model="formData.displayName"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="year" class="form-label">Year *</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="year" 
                  v-model.number="formData.year"
                  required
                  min="2020"
                  max="2050"
                >
              </div>

              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea 
                  class="form-control" 
                  id="description" 
                  v-model="formData.description"
                  rows="3"
                ></textarea>
              </div>

              <div class="mb-3 form-check">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  id="active" 
                  v-model="formData.active"
                >
                <label class="form-check-label" for="active">
                  Active (series is currently running)
                </label>
              </div>
            </div>
          </div>

          <!-- Race Management -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Races in Series</h5>
              <button 
                class="btn btn-sm btn-primary"
                @click="showAddRacesModal = true"
                :disabled="loadingRaces"
              >
                + Add Races
              </button>
            </div>
            <div class="card-body">
              <div v-if="loadingRaces" class="text-center py-3">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Loading races...</span>
                </div>
                Loading races...
              </div>
              
              <div v-else-if="racesError" class="alert alert-danger">
                {{ racesError }}
              </div>
              
              <div v-else>
                <!-- Races in series table -->
                <div v-if="racesInSeries.length === 0" class="text-center text-muted py-4">
                  <p>No races in this series yet.</p>
                  <button class="btn btn-sm btn-primary" @click="showAddRacesModal = true">
                    Add Races to Series
                  </button>
                </div>
                
                <div v-else class="table-responsive">
                  <table class="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Race Name</th>
                        <th class="text-center">Race #</th>
                        <th class="text-center">Series Redirect</th>
                        <th class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="race in racesInSeries" :key="race.raceid">
                        <td class="text-nowrap">{{ formatRaceDate(race.eventDate) }}</td>
                        <td>
                          <RouterLink :to="{ name: 'edit-race', params: { raceid: race.raceid } }">
                            {{ race.eventDetails?.name || race.displayName }}
                          </RouterLink>
                        </td>
                        <td class="text-center">
                          <span v-if="race.seriesRaceNumber" class="badge bg-secondary">
                            #{{ race.seriesRaceNumber }}
                          </span>
                          <span v-else class="text-muted small">-</span>
                        </td>
                        <td class="text-center">
                          <span v-if="race.disableSeriesRedirect" class="badge bg-warning text-dark">
                            Disabled
                          </span>
                          <span v-else class="badge bg-success">
                            Enabled
                          </span>
                        </td>
                        <td class="text-center">
                          <button 
                            class="btn btn-sm btn-outline-danger"
                            @click="removeRaceFromSeries(race.raceid)"
                            :disabled="updatingRaces"
                            title="Remove from series"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Race Categories</h5>
              <button 
                class="btn btn-sm btn-outline-primary"
                @click="openImportCategoriesModal"
                title="Import categories from an existing race"
              >
                <Download :size="16" class="me-1" />
                Import from Race
              </button>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">
                Define the default categories for all races in this series. Individual races can override these.
              </p>
              <EditSeriesCategoriesComponent 
                :categories="formData.regCategories"
                :payTypes="seriesDefaultPaymentTypesMap"
                @update:categories="formData.regCategories = $event"
              />
            </div>
          </div>

          <!-- Default Payment Options (Series-wide) -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Default Payment Options</h5>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">
                <strong>Series-wide default payment options</strong> that apply to all series categories. These can be overridden by:
                <br>• Category Group payment options (if a category belongs to a group)
                <br>• Race-specific payment options (if a race defines a matching payment type)
              </p>
              
              <div v-if="formData.defaultPaymentOptions.length === 0" class="text-center text-muted py-3 border rounded mb-3">
                No default payment options defined. Click "Add Payment Option" to create one.
              </div>
              
              <div v-else class="payment-options-list mb-3">
                <div 
                  v-for="(payOpt, index) in formData.defaultPaymentOptions" 
                  :key="index"
                  class="payment-option-card border rounded p-3 mb-2"
                >
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">Payment Option {{ index + 1 }}</h6>
                    <button 
                      class="btn btn-sm btn-outline-danger"
                      @click="removeDefaultPaymentOption(index)"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div class="row g-2">
                    <div class="col-md-5">
                      <label class="form-label small">Name *</label>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        v-model="payOpt.name"
                        placeholder="e.g., Early Bird Registration"
                        required
                      >
                    </div>
                    <div class="col-md-4">
                      <label class="form-label small">Type ID *</label>
                      <input 
                        type="text" 
                        class="form-control form-control-sm" 
                        v-model="payOpt.type"
                        placeholder="e.g., early_bird"
                        :disabled="isSpecialPaymentType(payOpt.type)"
                        required
                      >
                      <small v-if="isSpecialPaymentType(payOpt.type)" class="text-muted">
                        Special type (cannot be changed)
                      </small>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label small">Amount ($) *</label>
                      <input 
                        type="number" 
                        class="form-control form-control-sm" 
                        v-model.number="payOpt.amount"
                        placeholder="0"
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
                  @click="addDefaultPaymentOption"
                  type="button"
                >
                  + Add Custom Payment
                </button>
                <button 
                  class="btn btn-sm btn-info" 
                  @click="addDefaultSpecialPaymentType('season')"
                  type="button"
                >
                  + Season Pass
                </button>
                <button 
                  class="btn btn-sm btn-info" 
                  @click="addDefaultSpecialPaymentType('cash')"
                  type="button"
                >
                  + Cash Payment
                </button>
              </div>
            </div>
          </div>

          <!-- Category Groups with Payment Options -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Category Groups & Payment Options</h5>
            </div>
            <div class="card-body">
              <p class="text-muted small mb-3">
                <strong>Optional:</strong> Group categories together and assign specific payment options to each group. Group payment options override the default payment options above for categories in that group.
              </p>
              <EditCategoryGroupsComponent 
                :categoryGroups="formData.categoryGroups"
                :regCategories="formData.regCategories"
                @update:categoryGroups="formData.categoryGroups = $event"
              />
            </div>
          </div>
          
          <!-- Add Races Modal -->
          <div v-if="showAddRacesModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Add Races to Series</h5>
                  <button type="button" class="btn-close" @click="showAddRacesModal = false"></button>
                </div>
                <div class="modal-body">
                  <!-- Search filter -->
                  <div class="mb-3">
                    <input 
                      type="text" 
                      class="form-control" 
                      v-model="raceSearchFilter"
                      placeholder="🔍 Filter races by name..."
                    >
                  </div>
                  
                  <div v-if="filteredRacesNotInSeries.length === 0" class="text-center text-muted py-3">
                    <p v-if="raceSearchFilter">No races match your search.</p>
                    <p v-else>All upcoming races are already in this series.</p>
                  </div>
                  
                  <div v-else class="race-selection-list">
                    <div 
                      v-for="race in filteredRacesNotInSeries" 
                      :key="race.raceid"
                      class="race-selection-item"
                      :class="{ 'selected': selectedRacesNotInSeries.includes(race.raceid) }"
                      @click="toggleRaceSelection(race.raceid)"
                    >
                      <div class="form-check">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          :checked="selectedRacesNotInSeries.includes(race.raceid)"
                          @click.stop="toggleRaceSelection(race.raceid)"
                        >
                        <label class="form-check-label">
                          <strong>{{ formatRaceDate(race.eventDate) }}</strong> - {{ race.eventDetails?.name || race.displayName }}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="selectedRacesNotInSeries.length > 0" class="mt-3 alert alert-info">
                    {{ selectedRacesNotInSeries.length }} race(s) selected
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="showAddRacesModal = false">Cancel</button>
                  <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="addRacesToSeries"
                    :disabled="selectedRacesNotInSeries.length === 0 || updatingRaces"
                  >
                    {{ updatingRaces ? 'Adding...' : `Add ${selectedRacesNotInSeries.length} Race(s)` }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Import Categories Modal -->
          <div v-if="showImportCategoriesModal" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-xl">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Import Categories from Race</h5>
                  <button type="button" class="btn-close" @click="closeImportCategoriesModal"></button>
                </div>
                <div class="modal-body">
                  <div v-if="loadingImportRaces" class="text-center py-4">
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Loading races...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading races...</p>
                  </div>
                  
                  <div v-else class="row">
                    <!-- Race List -->
                    <div class="col-md-5">
                      <h6 class="mb-3">Select a Race</h6>
                      <div v-if="importRaces.length === 0" class="text-center text-muted py-4">
                        <p>No races with categories found.</p>
                      </div>
                      <div v-else class="import-race-list">
                        <div 
                          v-for="race in importRaces" 
                          :key="race.raceid"
                          class="import-race-item"
                          :class="{ 'selected': selectedImportRaceId === race.raceid }"
                          @click="selectImportRace(race.raceid)"
                        >
                          <div class="d-flex flex-column">
                            <strong>{{ race.eventDetails?.name || race.displayName }}</strong>
                            <small class="text-muted">
                              {{ formatRaceDate(race.eventDate) }}
                              <span v-if="race.regCategories" class="ms-2">
                                ({{ race.regCategories.length }} categories)
                              </span>
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Category Preview -->
                    <div class="col-md-7">
                      <h6 class="mb-3">Category Preview</h6>
                      <div v-if="!selectedImportRaceId" class="text-center text-muted py-5">
                        <p>← Select a race to preview its categories</p>
                      </div>
                      <div v-else-if="selectedImportRaceCategories" class="category-preview">
                        <div class="alert alert-info mb-3">
                          <strong>{{ selectedImportRaceCategories.length }}</strong> categories will be imported
                        </div>
                        <div class="table-responsive">
                          <table class="table table-sm table-bordered">
                            <thead class="table-light">
                              <tr>
                                <th style="width: 40px;">#</th>
                                <th>Category Name</th>
                                <th style="width: 90px;">Start Time</th>
                                <th style="width: 60px;">Laps</th>
                                <th style="width: 100px;">Age Range</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(cat, index) in selectedImportRaceCategories" :key="cat.id || index">
                                <td class="text-center text-muted">{{ index + 1 }}</td>
                                <td>
                                  <strong>{{ cat.catdispname }}</strong>
                                  <span v-if="cat.sponsored" class="badge bg-success ms-2">Sponsored</span>
                                </td>
                                <td class="text-center">
                                  <span v-if="cat.startTime">{{ cat.startTime }}</span>
                                  <span v-else class="text-muted">—</span>
                                </td>
                                <td class="text-center">{{ cat.laps || '—' }}</td>
                                <td class="text-center text-nowrap">
                                  <span v-if="cat.minAge || cat.maxAge">
                                    {{ cat.minAge || '—' }} - {{ cat.maxAge || '—' }}
                                  </span>
                                  <span v-else class="text-muted">—</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeImportCategoriesModal">Cancel</button>
                  <button 
                    type="button" 
                    class="btn btn-primary" 
                    @click="confirmImportCategories"
                    :disabled="!selectedImportRaceId"
                  >
                    <Download :size="16" class="me-1" />
                    Import Categories
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-3">
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0">Quick Info</h6>
            </div>
            <div class="card-body">
              <dl class="mb-0">
                <dt class="small text-muted">Series ID</dt>
                <dd><code>{{ seriesData.seriesId || seriesData.series }}</code></dd>
                
                <dt class="small text-muted">Year</dt>
                <dd>{{ formData.year }}</dd>
                
                <dt class="small text-muted">Status</dt>
                <dd>
                  <span v-if="formData.active" class="badge bg-success">Active</span>
                  <span v-else class="badge bg-secondary">Inactive</span>
                </dd>
                
                <dt class="small text-muted">Categories</dt>
                <dd>
                  <span v-if="formData.regCategories.length > 0" class="badge bg-primary">
                    {{ formData.regCategories.length }} categories
                  </span>
                  <span v-else class="text-muted">None defined</span>
                </dd>
                
                <dt class="small text-muted">Category Groups</dt>
                <dd>
                  <span v-if="formData.categoryGroups.length > 0" class="badge bg-info">
                    {{ formData.categoryGroups.length }} groups
                  </span>
                  <span v-else class="text-muted">None defined</span>
                </dd>
                
                <dt class="small text-muted">Races</dt>
                <dd>
                  <span v-if="!loadingRaces && racesInSeries.length > 0" class="badge bg-success">
                    {{ racesInSeries.length }} races
                  </span>
                  <span v-else-if="loadingRaces" class="text-muted">Loading...</span>
                  <span v-else class="text-muted">No races</span>
                </dd>
              </dl>
            </div>
          </div>

        </div>
      </div>
    </div>
    
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Series not found</h2>
      </div>
    </div>
    
    <!-- Sticky Save Button -->
    <transition name="slide-up">
      <div v-if="loaded && showStickySaveButton" class="sticky-save-bar" :class="{ 'has-changes': hasUnsavedChanges }">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center">
            <div class="text-white">
              <strong>{{ seriesData.displayName || seriesData.name }}</strong>
              <span v-if="hasUnsavedChanges" class="ms-2 text-white-50">- Unsaved changes</span>
              <span v-else class="ms-2 text-white-50">- All changes saved</span>
            </div>
            <button 
              class="btn btn-light btn-lg"
              @click="saveSeries"
              :disabled="saving || !hasUnsavedChanges"
            >
              <Save :size="18" class="me-2" />
              {{ saving ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes' : 'Saved') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Add padding to bottom when sticky bar is visible */
.edit-series-wrapper.has-sticky-bar {
  padding-bottom: 100px;
}

code {
  font-size: 0.9em;
  color: #d63384;
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.gap-2 {
  gap: 0.5rem;
}

.category-list {
  min-height: 150px;
  font-size: 0.875rem;
}

.category-list option {
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.category-list option:hover {
  background-color: #e9ecef;
}

.race-selection-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.race-selection-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.race-selection-item:last-child {
  border-bottom: none;
}

.race-selection-item:hover {
  background-color: #f8f9fa;
}

.race-selection-item.selected {
  background-color: #e7f3ff;
}

.race-selection-item .form-check {
  margin: 0;
}

.race-selection-item .form-check-label {
  cursor: pointer;
  width: 100%;
  margin-left: 0.5rem;
}

/* Sticky Save Bar */
.sticky-save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  padding: 1rem 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border-top: 3px solid rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease;
}

.sticky-save-bar.has-changes {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}

.sticky-save-bar .container {
  max-width: 1200px;
}

.sticky-save-bar .btn-light {
  font-weight: 600;
  padding: 0.75rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.sticky-save-bar .btn-light:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.sticky-save-bar .btn-light:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Slide up transition */
.slide-up-enter-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.slide-up-leave-active {
  transition: transform 0.3s ease-in, opacity 0.3s ease-in;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Import Categories Modal */
.import-race-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.import-race-item {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-race-item:last-child {
  border-bottom: none;
}

.import-race-item:hover {
  background-color: #f8f9fa;
}

.import-race-item.selected {
  background-color: #e7f3ff;
  border-left: 4px solid #0d6efd;
  padding-left: calc(1rem - 4px);
}

.category-preview {
  max-height: 500px;
  overflow-y: auto;
}

.category-preview .table {
  font-size: 0.875rem;
  margin-bottom: 0;
}

.category-preview .table th {
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #495057;
}

.category-preview .table td {
  vertical-align: middle;
}

.payment-option-card {
  background-color: #f8f9fa;
  transition: all 0.2s;
}

.payment-option-card:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.payment-options-list {
  max-height: 500px;
  overflow-y: auto;
}
</style>

