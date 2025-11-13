<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import { RouterLink } from 'vue-router';
import { Pencil, Plus } from 'lucide-vue-next';

export default {
  components: {
    RouterLink,
    Pencil,
    Plus,
    ModalComponent
  },
  data() {
    return {
      loading: false,
      seriesData: null,
      showModal: false,
      modalMode: null,
      currentSeries: null,
      error: null,
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.error = null;
      this.loading = true;
      
      try {
        const response = await request('/api/series/');
        this.seriesData = response.data;
        this.loading = false;
      } catch (err) {
        this.loading = false;
        this.error = err.toString();
        console.error(err);
      }
    },
    
    createNewSeries() {
      this.currentSeries = {
        seriesId: '',
        name: '',
        displayName: '',
        year: new Date().getFullYear(),
        active: true,
        description: ''
      };
      this.modalMode = 'create';
      this.showModal = true;
    },
    
    editSeries(series) {
      this.currentSeries = _.cloneDeep(series);
      this.modalMode = 'edit';
      this.showModal = true;
    },
    
    async saveSeries() {
      try {
        if (this.modalMode === 'create') {
          await request.post('/api/series/', this.currentSeries);
        } else {
          await request.patch(`/api/series/${this.currentSeries.seriesId || this.currentSeries.series}`, this.currentSeries);
        }
        
        this.closeModal();
        await this.fetchData();
      } catch (error) {
        console.error('Error saving series:', error);
        alert('Error saving series: ' + (error.response?.data?.message || error.message));
      }
    },
    
    closeModal() {
      this.showModal = false;
      this.modalMode = null;
      this.currentSeries = null;
    },
    
    getRaceCount(seriesId) {
      // This would need to be fetched from the API
      // For now, return a placeholder
      return '—';
    }
  },
  computed: {
    loaded() {
      return !!this.seriesData;
    }
  },
};
</script>

<template>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error alert alert-danger">{{ error }}</div>

    <div v-if="loaded">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Series Management</h2>
        <button class="btn btn-primary" @click="createNewSeries">
          <Plus :size="16" class="me-1" />
          New Series
        </button>
      </div>
      
      <div class="table-responsive">
        <table class="table table-striped table-hover table-sm">
          <thead>
            <tr>
              <th scope="col">Display Name</th>
              <th scope="col">Year</th>
              <th scope="col">Season Pass</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="series in seriesData" :key="series.seriesId || series.series">
              <td>{{ series.displayName || series.name }}</td>
              <td>{{ series.year }}</td>
              <td>
                <span v-if="series.seasonPassPricing" class="badge bg-info">
                  {{ series.seasonPassPricing.categoryGroups?.length || 0 }} groups
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <RouterLink 
                  :to="{ name: 'edit-series', params: { seriesId: series.seriesId || series.series }}" 
                  class="btn btn-sm btn-outline-primary me-2"
                  title="Edit series"
                >
                  <Pencil :size="14" />
                </RouterLink>
                <RouterLink 
                  :to="{ name: 'races', query: { series: series.seriesId || series.series }}" 
                  class="btn btn-sm btn-outline-secondary"
                >
                  View Races
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Error loading series...</h2>
      </div>
    </div>
  </div>

  <!-- Create/Edit Modal -->
  <Teleport to="body">
    <modal-component :show="showModal" @close="closeModal">
      <template #header>
        <h5>{{ modalMode === 'create' ? 'Create New Series' : 'Edit Series' }}</h5>
      </template>
      <template #body>
        <form v-if="currentSeries" @submit.prevent="saveSeries">
          <div class="mb-3">
            <label for="seriesId" class="form-label">Series ID *</label>
            <input 
              type="text" 
              class="form-control" 
              id="seriesId" 
              v-model="currentSeries.seriesId"
              :disabled="modalMode === 'edit'"
              required
              placeholder="e.g., bear_gravity_2026"
            >
            <small class="form-text text-muted">
              Unique identifier (lowercase, underscores only). Cannot be changed after creation.
            </small>
          </div>
          
          <div class="mb-3">
            <label for="name" class="form-label">Name *</label>
            <input 
              type="text" 
              class="form-control" 
              id="name" 
              v-model="currentSeries.name"
              required
              placeholder="e.g., Bear Gravity Series"
            >
          </div>
          
          <div class="mb-3">
            <label for="displayName" class="form-label">Display Name *</label>
            <input 
              type="text" 
              class="form-control" 
              id="displayName" 
              v-model="currentSeries.displayName"
              required
              placeholder="e.g., Bear Gravity Series 2026"
            >
          </div>
          
          <div class="mb-3">
            <label for="year" class="form-label">Year *</label>
            <input 
              type="number" 
              class="form-control" 
              id="year" 
              v-model.number="currentSeries.year"
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
              v-model="currentSeries.description"
              rows="3"
              placeholder="Brief description of the series"
            ></textarea>
          </div>
          
          <div class="mb-3 form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="active" 
              v-model="currentSeries.active"
            >
            <label class="form-check-label" for="active">
              Active (series is currently running)
            </label>
          </div>

          <div v-if="currentSeries.seasonPassPricing" class="alert alert-info">
            <strong>Season Pass Pricing:</strong> 
            {{ currentSeries.seasonPassPricing.categoryGroups?.length || 0 }} category groups configured
            <br>
            <small class="text-muted">
              Advanced pricing configuration coming soon. Use API for now.
            </small>
          </div>
        </form>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button type="button" class="btn btn-primary" @click="saveSeries">
          {{ modalMode === 'create' ? 'Create' : 'Save Changes' }}
        </button>
      </template>
    </modal-component>
  </Teleport>
</template>

<style scoped>
table.table {
  --bs-table-hover-bg: #76c8ff;
}

code {
  font-size: 0.9em;
  color: #d63384;
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
</style>

