<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import dayjs from '@/lib/dayjs';
import ModalComponent from './ModalComponent.vue';
import EditRaceCategoriesComponent from './EditRaceCategoriesComponent.vue';
import EditRaceCouponsComponent from './EditRaceCouponsComponent.vue';
import EditRacePaymentsComponent from './EditRacePaymentsComponent.vue';
import EditRaceOptionalPurchasesComponent from './EditRaceOptionalPurchasesComponent.vue';
import EditRaceWaiverComponent from './EditRaceWaiverComponent.vue';
import EditRaceEventDetailsComponent from './EditRaceEventDetailsComponent.vue';
import EditRaceEmailTemplateComponent from './EditRaceEmailTemplateComponent.vue';
import RichTextEditor from './RichTextEditor.vue';
import { Link, Edit3 } from 'lucide-vue-next';

export default {
  components: {
    ModalComponent,
    EditRaceCategoriesComponent,
    EditRaceCouponsComponent,
    EditRacePaymentsComponent,
    EditRaceOptionalPurchasesComponent,
    EditRaceWaiverComponent,
    EditRaceEventDetailsComponent,
    EditRaceEmailTemplateComponent,
    RichTextEditor,
    Link,
    Edit3
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      editedCategories: [],
      editedCoupons: {},
      editedPaymentOptions: [],
      editedOptionalPurchases: [],
      editedWaiver: null,
      editedEmailTemplate: null,
      editedHeaderContent: '',
      editedEventDetails: {},
      raceData: {},
      showModal: false,
      modalMode: null,
      seriesData: null,
      activeTab: 'settings',
      showHeaderContentEditor: false,
    };
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  methods: {
    dollas(amt) {
      if (typeof amt === 'string') {
        amt = parseInt(amt);
      }
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    async fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.raceid) {
        try {
          const response = await request(`/api/races/${this.$route.params.raceid}`);
          this.raceData = response.data;
          
          // Initialize edited header content
          this.editedHeaderContent = this.raceData.headerContent || '';
          
          // Show editor if content already exists
          this.showHeaderContentEditor = !!this.raceData.headerContent;
          
          // Fetch series data if race belongs to a series
          if (this.raceData.series) {
            await this.fetchSeriesData();
          } else {
            this.seriesData = null;
          }
          
          this.loading = false;
        } catch (err) {
          this.loading = false;
          this.error = err.toString();
          console.error(err);
        }
      }
    },
    async fetchSeriesData() {
      if (!this.raceData.series) return;
      
      try {
        const response = await request(`/api/series/${this.raceData.series}`);
        this.seriesData = response.data;
      } catch (error) {
        console.error('Error fetching series data:', error);
        this.seriesData = null;
      }
    },
    isSeriesCategory(categoryId) {
      if (!this.seriesData || !this.seriesData.regCategories) return false;
      return this.seriesData.regCategories.some(cat => cat.id === categoryId);
    },
    isRaceOverride(category) {
      // Check if this category is a race-level override of a series category
      return category._isRaceOverride === true;
    },
    isPureSeriesCategory(category) {
      // Check if this is a pure series category (not overridden at race level)
      return category._isSeriesCategory === true;
    },
    getCategoryPaymentInfo(category) {
      const isSeriesCat = this.isSeriesCategory(category.id);
      const result = {
        forcedPayment: null,
        group: null,
        fallback: null
      };
      
      // Check if payment options are actually race-specific or inherited from series
      const hasRaceSpecificPayments = this.raceData.paymentOptions && 
                                       this.raceData.paymentOptions.length > 0 && 
                                       !this.raceData._paymentOptionsFromSeries;
      
      // Check if this category is part of a series payment group
      if (isSeriesCat && this.seriesData?.categoryGroups) {
        for (const group of this.seriesData.categoryGroups) {
          if (group.categories && group.categories.includes(category.id)) {
            const paymentNames = group.paymentOptions?.map(opt => opt.name).join(', ') || 'No payments';
            result.group = {
              type: 'series-group',
              label: group.name,
              payments: paymentNames,
              source: 'series-group'
            };
            break;
          }
        }
      }
      
      // Check if this category has a forced paytype (race-specific or race override)
      if (category.paytype) {
        // Determine the source of the forced paytype
        let paytypeSource = 'race';
        let paytypeLabel = this.paymentOptions[category.paytype] || category.paytype;
        let foundInSeries = false;
        
        // First check if this payment type exists in race payment options
        const existsInRacePayments = hasRaceSpecificPayments && this.paymentOptions[category.paytype];
        
        // If it exists in race payments, use that (blue badge)
        if (existsInRacePayments) {
          paytypeSource = 'race';
          paytypeLabel = this.paymentOptions[category.paytype];
        } else {
          // Otherwise check if it's from a series group
          if (result.group) {
            const group = this.seriesData.categoryGroups.find(g => 
              g.categories && g.categories.includes(category.id)
            );
            if (group) {
              const groupPayment = group.paymentOptions?.find(opt => opt.type === category.paytype);
              if (groupPayment) {
                paytypeSource = 'series-group';
                paytypeLabel = groupPayment.name;
                foundInSeries = true;
              }
            }
          }
          
          // If not from group, check if it's from series defaults
          if (!foundInSeries && isSeriesCat && this.seriesData?.defaultPaymentOptions) {
            const seriesDefault = this.seriesData.defaultPaymentOptions.find(opt => opt.type === category.paytype);
            if (seriesDefault) {
              paytypeSource = 'series-default';
              paytypeLabel = seriesDefault.name;
              foundInSeries = true;
            }
          }
        }
        
        result.forcedPayment = {
          type: 'forced',
          label: paytypeLabel,
          source: paytypeSource,
          paytype: category.paytype
        };
      }
      
      // For pure series categories without forced paytype, show their available payment options
      // Categories in a group can ALSO use series default payments + race payments (user can choose from any)
      if (!result.forcedPayment && isSeriesCat) {
        if (this.seriesData?.defaultPaymentOptions && this.seriesData.defaultPaymentOptions.length > 0) {
          const paymentNames = this.seriesData.defaultPaymentOptions.map(opt => opt.name).join(', ');
          result.fallback = {
            type: 'series-default',
            label: 'Series Defaults',
            payments: paymentNames,
            source: 'series-default'
          };
        }
      }
      
      // Default fallback for race-only categories
      if (!result.forcedPayment && !result.group && !result.fallback) {
        result.fallback = {
          type: 'any',
          label: 'Any payment type',
          source: 'race'
        };
      }
      
      return result;
    },
    editProperty(mode, raceProp, data) {
      this.showModal = true;
      this.modalMode = mode
      this[raceProp] = data;
    },
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    editOptionalPurchases() {
      this.showModal = true;
      this.modalMode = 'optionalpurchases'
    },
    closeModal() {
      this.showModal = false;
    },
    async saveProperty(formData) {
      console.log("Saved property data")
      this.showModal = false;
      this.modalMode = null;
      console.log(formData);
      await this.fetchData();
    },
    async saveRaceData(formData) {
      // Merge nested objects to preserve existing properties
      const dataToSend = { ...this.formInputData };
      
      // Merge eventDetails to preserve existing properties (used in Settings tab)
      if (dataToSend.eventDetails && this.raceData.eventDetails) {
        dataToSend.eventDetails = {
          ...this.raceData.eventDetails,
          ...dataToSend.eventDetails
        };
      }
      
      // Merge stripeMeta to preserve existing properties (used in Advanced tab)
      if (dataToSend.stripeMeta && this.raceData.stripeMeta) {
        dataToSend.stripeMeta = {
          ...this.raceData.stripeMeta,
          ...dataToSend.stripeMeta
        };
      }
      
      await request.patch(
        `/api/races/${this.$route.params.raceid}`,
        dataToSend
      ).then((response) => {
        if (response.data) {

          console.log(response.data);
          return this.fetchData()
        }
      })
        .catch((error) => {
          this.formError = ["Error submitting request"];
          console.log(error);
        });
    },
    async saveHeaderContent() {
      try {
        await request.patch(
          `/api/races/${this.$route.params.raceid}`,
          { headerContent: this.editedHeaderContent }
        );
        await this.fetchData();
      } catch (error) {
        console.error('Error saving header content:', error);
        alert('Error saving header content');
      }
    }
  },
  computed: {
    defaultEmailSubject() {
      return '{{eventName}} Registration';
    },
    emailPreviewData() {
      // Sample data for template preview
      return {
        name: 'John Doe',
        sponsor: 'Sample Racing Team',
        eventName: this.raceData?.eventDetails?.name || this.raceData?.displayName || 'Sample Race Event',
        category: this.raceData?.regCategories?.[0]?.catdispname || 'Men\'s Cat 1',
        rosterLink: `${window.location.origin}/#/roster/${this.raceData?.raceid || 'raceid'}`,
        eventHomePageUrl: this.raceData?.eventDetails?.homepageUrl || 'https://example.com',
        eventContactEmail: this.raceData?.contactEmail || 'support@signup.bike'
      };
    },
    renderedEmailPreview() {
      // Get the template
      let subject = this.defaultEmailSubject;
      let body = `<html><head></head><body>
<h1>Thank you for registering for {{eventName}}</h1>
<p>
Name: {{name}}<br>
Team/Sponsor: {{sponsor}}<br>
Race Category: {{category}}<br>
<p><a href="{{rosterLink}}">Go Here</a> to see who else is signed up<p>
<p>For information about the event, check out <a href="{{eventHomePageUrl}}">{{eventHomePageUrl}}</a></p>
<p>For issues with your registration information, <a href="mailto:{{eventContactEmail}}">email us!</a></p>
</body></html>`;

      if (this.raceData.emailTemplate) {
        if (typeof this.raceData.emailTemplate === 'object') {
          subject = this.raceData.emailTemplate.subject || subject;
          body = this.raceData.emailTemplate.body || body;
        } else {
          body = this.raceData.emailTemplate;
        }
      }

      // Simple template replacement
      const data = this.emailPreviewData;
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, data[key]);
        body = body.replace(regex, data[key]);
      });

      return {
        subject,
        body: body.substring(0, 500) + (body.length > 500 ? '...' : '')
      };
    },
    sortedCats() {

      return _.orderBy(this.raceData.regCategories, "disporder")
    },
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    eventDate() {
      return dayjs(this.raceData.eventDate).format('YYYY-MM-DDTHH:mm');
    },
    regOpenDate() {
      return dayjs(this.raceData.regOpenDate).format('YYYY-MM-DDTHH:mm');
    },
    timeToOpen() {
      return dayjs().to(this.raceData.eventDetails?.regOpenDate)
    },
    timeToClose() {
      return dayjs().to(this.raceData.eventDetails?.regCloseDate)
    },
    paymentOptions() {
      let options = {};
      _.forEach(this.raceData.paymentOptions, (element) => {
        options[element.type] = element.name;
      });
      return options;
    },
    // Get all payment options including series defaults and category groups (Hybrid Model)
    allPaymentOptionsWithSource() {
      const paymentOptionsList = [];
      const seenTypes = new Set(); // Track payment types to show overrides
      
      // Check if payment options are actually race-specific or inherited from series
      const hasRaceSpecificPayments = this.raceData.paymentOptions && 
                                       this.raceData.paymentOptions.length > 0 && 
                                       !this.raceData._paymentOptionsFromSeries;
      
      // Add race-specific payment options (only if they're truly race-specific)
      if (hasRaceSpecificPayments) {
        (this.raceData.paymentOptions || []).forEach(opt => {
          paymentOptionsList.push({
            ...opt,
            source: 'race',
            sourceLabel: 'Race-specific',
            usedBy: 'Race Categories',
            key: `race-${opt.type}`,
            priority: 1
          });
          seenTypes.add(opt.type);
        });
      }
      
      // Add series default payment options (hybrid model)
      if (this.seriesData?.defaultPaymentOptions) {
        this.seriesData.defaultPaymentOptions.forEach(opt => {
          const isOverridden = seenTypes.has(opt.type);
          paymentOptionsList.push({
            ...opt,
            source: 'series-default',
            sourceLabel: 'Series Default',
            usedBy: 'Series Categories (not in groups)',
            key: `series-default-${opt.type}`,
            priority: 3,
            isOverridden: isOverridden,
            overriddenBy: isOverridden ? 'race' : null
          });
        });
      }
      
      // Add series category group payment options
      if (this.seriesData?.categoryGroups) {
        this.seriesData.categoryGroups.forEach(group => {
          (group.paymentOptions || []).forEach(opt => {
            const isOverridden = seenTypes.has(opt.type);
            paymentOptionsList.push({
              ...opt,
              source: 'series-group',
              sourceLabel: `Series Group: ${group.name}`,
              seriesGroup: group.name,
              groupName: group.name,
              usedBy: `Series Categories in "${group.name}"`,
              key: `series-group-${group.name}-${opt.type}`,
              priority: 2,
              isOverridden: isOverridden,
              overriddenBy: isOverridden ? 'race' : null
            });
          });
        });
      }
      
      // Sort by priority (race first, then groups, then defaults)
      return paymentOptionsList.sort((a, b) => a.priority - b.priority);
    },
  },
};
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>

      <!-- "eventDetails": {
      "logoUrl": "/Folsom-Rodeocross-Logo-300x300.jpg",
      "name": "RodeoCross 2022",
      "tagline": "Cyclocross's gateway drug. Sept 28th, Oct 5th, 12th, 19th, and 26th",
      "homepageUrl": -->


      <div v-if="true">
        <div v-if="raceData.series && seriesData" class="series-banner alert alert-info d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center">
            <Link :size="20" class="me-2" />
            <div>
              <strong>Part of Series:</strong> {{ seriesData.name }}
              <span v-if="raceData.seriesRaceNumber" class="ms-2 text-muted">
                (Race #{{ raceData.seriesRaceNumber }})
              </span>
            </div>
          </div>
          <RouterLink :to="{ name: 'edit-series', params: { seriesId: raceData.series } }" class="btn btn-sm btn-outline-primary">
            Edit Series
          </RouterLink>
        </div>
        
        <div class="d-flex flex-row">
          <div class="my-3 mx-5">
            <a :href="`/#/register/test/${raceData.raceid}`">View Reg Form</a>
          </div>
          <div class="my-3">
            <a :href="`/#/roster/${raceData.raceid}`">View Roster</a>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <!-- Tab Navigation -->
            <ul class="nav nav-tabs mb-3" role="tablist">
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'settings' }"
                  @click="setActiveTab('settings')"
                  type="button"
                >
                  Settings
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'registration' }"
                  @click="setActiveTab('registration')"
                  type="button"
                >
                  Registration
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'content' }"
                  @click="setActiveTab('content')"
                  type="button"
                >
                  Content
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button 
                  class="nav-link" 
                  :class="{ active: activeTab === 'advanced' }"
                  @click="setActiveTab('advanced')"
                  type="button"
                >
                  Advanced
                </button>
              </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Settings Tab -->
              <div v-show="activeTab === 'settings'" class="tab-pane" :class="{ active: activeTab === 'settings', show: activeTab === 'settings' }">
                <FormKit type="form" :errors="formError" id="race-settings" @submit="saveRaceData" submit-label="Save Settings"
                  v-model="formInputData">
                  <FormKit :value="raceData?.displayName" type="text" name="displayName" label="Event Name" />
                  <FormKit :value="raceData?.contactEmail" type="text" name="contactEmail" label="Contact Email" />
                  <FormKit :value="eventDate" type="datetime-local" name="eventDate" label="Date" />
                  <FormKit :value="raceData?.seriesRaceNumber" type="number" name="seriesRaceNumber"
                    label="Series Race Number" />
                  
                  <h6 class="mt-3 mb-2">Registration Dates</h6>
                  <FormKit type="group" name="eventDetails">
                    <FormKit :value="raceData?.eventDetails?.regOpenDate" type="datetime-local" name="regOpenDate"
                      label="Registration Open Date" />
                    <p class="small text-muted">Registration Opens {{ timeToOpen }}</p>
                    <FormKit :value="raceData?.eventDetails?.regCloseDate" type="datetime-local" name="regCloseDate"
                      label="Registration Close Date" />
                    <p class="small text-muted">Registration Closes {{ timeToClose }}</p>
                  </FormKit>
                  
                  <div v-if="raceData.series && !raceData.disableSeriesRedirect" class="alert alert-warning mt-3 mb-0">
                    <small>
                      <strong>⚠️ Landing Page Visibility:</strong> This race is part of a series and may be hidden on the main landing page. 
                      Only the first upcoming race in the series will be shown (unless "Disable Series Redirect" is enabled in Advanced settings).
                      The race will still be visible when viewing the specific series page.
                    </small>
                  </div>
                  
                  <h6 class="mt-3 mb-2">Registration Limits</h6>
                  <FormKit :value="raceData?.entryCountMax" type="number" label="Maximum Number of registrations"
                    name="entryCountMax" />
                  <p class="small text-muted">
                    <strong>Current Reg Count: {{ raceData.entryCount }}</strong>
                  </p>
                  
                </FormKit>
              </div>

              <!-- Registration Tab -->
              <div v-show="activeTab === 'registration'" class="tab-pane" :class="{ active: activeTab === 'registration', show: activeTab === 'registration' }">
                <div class="registration-section">
                  <!-- First Row: Categories and Race Payment -->
                  <div class="row">
                    <div class="col-lg-6">
                      <!-- Categories Section -->
                      <div class="content-card mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <h5 class="mb-0">Categories</h5>
                          <button 
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="editProperty('categories', 'editedCategories', [...sortedCats])"
                          >
                            Edit Categories
                          </button>
                        </div>
                        
                        <div v-if="raceData.series && seriesData" class="series-preview-info mb-2">
                          <small class="text-muted">
                            <Link :size="14" class="me-1" style="display: inline-block; vertical-align: middle;" />
                            Link icon = inherited from series
                            <span class="ms-2" style="color: #f57c00;">
                              <Edit3 :size="14" class="me-1" style="display: inline-block; vertical-align: middle;" />
                              Edit icon = race override
                            </span>
                          </small>
                        </div>
                        
                        <div class="category-preview">
                          <div v-for="cat in sortedCats" :key="cat.id" class="cat-preview-row" 
                               :class="{ 
                                 'from-series': isPureSeriesCategory(cat),
                                 'race-override': isRaceOverride(cat)
                               }">
                            <div class="cat-preview-name">
                              <Link v-if="isPureSeriesCategory(cat)" :size="16" class="series-icon me-1" title="Inherited from series" />
                              <Edit3 v-else-if="isRaceOverride(cat)" :size="16" class="override-icon me-1" title="Race override of series category" />
                              {{ cat.catdispname }}
                            </div>
                            <div class="cat-preview-badges">
                              <strong v-if="cat.sponsored" class="sponsored-badge">Sponsored</strong>
                              <template v-else>
                                <!-- Show forced payment badge if present -->
                                <span v-if="getCategoryPaymentInfo(cat).forcedPayment" 
                                      class="paytype-badge"
                                      :class="{
                                        'badge-race': getCategoryPaymentInfo(cat).forcedPayment.source === 'race',
                                        'badge-series-default': getCategoryPaymentInfo(cat).forcedPayment.source === 'series-default',
                                        'badge-series-group': getCategoryPaymentInfo(cat).forcedPayment.source === 'series-group',
                                        'badge-race-override': getCategoryPaymentInfo(cat).forcedPayment.source === 'race-override'
                                      }"
                                      :title="`Forced to: ${getCategoryPaymentInfo(cat).forcedPayment.paytype}`">
                                  {{ getCategoryPaymentInfo(cat).forcedPayment.label }}
                                </span>
                                
                                <!-- Show group badge if present (can show alongside forced payment) -->
                                <span v-if="getCategoryPaymentInfo(cat).group" 
                                      class="paytype-badge badge-series-group"
                                      :title="getCategoryPaymentInfo(cat).group.payments">
                                  {{ getCategoryPaymentInfo(cat).group.label }}
                                </span>
                                
                                <!-- Show fallback badge if no forced payment or group -->
                                <span v-if="getCategoryPaymentInfo(cat).fallback" 
                                      class="paytype-badge"
                                      :class="{
                                        'badge-series-default': getCategoryPaymentInfo(cat).fallback.source === 'series-default'
                                      }"
                                      :title="getCategoryPaymentInfo(cat).fallback.payments">
                                  {{ getCategoryPaymentInfo(cat).fallback.label }}
                                </span>
                                
                                <!-- Default fallback text -->
                                <span v-if="!getCategoryPaymentInfo(cat).forcedPayment && !getCategoryPaymentInfo(cat).group && !getCategoryPaymentInfo(cat).fallback" 
                                      class="text-muted small">
                                  Any payment
                                </span>
                              </template>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="col-lg-6">
                      <!-- Race Payment Section -->
                      <div class="content-card mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <h5 class="mb-0">Race Payment Options</h5>
                          <button 
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="editProperty('paymentOptions', 'editedPaymentOptions', [...raceData.paymentOptions])"
                          >
                            Edit Race Payments
                          </button>
                        </div>
                        
                        <div v-if="seriesData && (seriesData.defaultPaymentOptions?.length > 0 || seriesData.categoryGroups?.length > 0)" class="alert alert-info py-2 mb-3">
                          <small>
                            <strong>Hybrid Payment Model - Priority Order:</strong><br>
                            1. <strong>Race Payment Options</strong> override series defaults/groups when payment type matches<br>
                            2. <strong>Series Category Groups</strong> define payment options for categories in that group<br>
                            3. <strong>Series Default Options</strong> apply to series categories not in any group<br>
                            4. <strong>Race-only Categories</strong> use race payment options<br>
                            <br>
                            💡 <em>Tip: Define a race payment option with the same "type" to override series amounts/names</em>
                          </small>
                        </div>
                        
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th scope="col">Payment Option</th>
                              <th scope="col">Price</th>
                              <th scope="col">Used By</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="payOpt in allPaymentOptionsWithSource" :key="payOpt.key" 
                                :class="{ 
                                  'from-series': payOpt.source !== 'race',
                                  'is-overridden': payOpt.isOverridden
                                }">
                              <td>
                                <Link v-if="payOpt.source !== 'race'" :size="16" class="series-icon me-1" :title="`From ${payOpt.sourceLabel}`" />
                                <strong :class="{ 'text-decoration-line-through text-muted': payOpt.isOverridden }">
                                  {{ payOpt.name }}
                                </strong>
                                <div v-if="payOpt.seriesGroup" class="text-muted small">
                                  Group: {{ payOpt.seriesGroup }}
                                </div>
                                <div v-if="payOpt.isOverridden" class="text-warning small">
                                  ⚠️ Overridden by race payment option
                                </div>
                              </td>
                              <td :class="{ 'text-decoration-line-through text-muted': payOpt.isOverridden }">
                                {{ dollas(payOpt.amount) }}
                              </td>
                              <td>
                                <span v-if="payOpt.source === 'race'" class="badge bg-primary" title="Race-specific payment option">
                                  Race
                                </span>
                                <span v-else-if="payOpt.source === 'series-group'" class="badge bg-info" :title="payOpt.usedBy">
                                  Series Group
                                </span>
                                <span v-else-if="payOpt.source === 'series-default'" class="badge bg-success" :title="payOpt.usedBy">
                                  Series Default
                                </span>
                                <div class="text-muted small mt-1">
                                  {{ payOpt.usedBy }}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                        <div v-if="allPaymentOptionsWithSource.length === 0" class="text-muted text-center py-3">
                          No payment options configured
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Second Row: Coupons and Optional Purchases -->
                  <div class="row">
                    <div class="col-lg-6">
                      <!-- Coupons Section -->
                      <div class="content-card mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <h5 class="mb-0">Coupons</h5>
                          <button 
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="editProperty('coupons', 'editedCoupons', { ...raceData.couponCodes })"
                          >
                            Edit Coupons
                          </button>
                        </div>
                        
                        <div v-if="raceData.couponCodes && Object.keys(raceData.couponCodes).length > 0">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th scope="col">Coupon Code</th>
                                <th scope="col">Discount</th>
                                <th scope="col">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(couponData, couponCode) in raceData.couponCodes" :key="couponCode">
                                <td><strong>{{ couponCode }}</strong></td>
                                <td>{{ ((couponData.fractionDiscount || 0) * 100).toFixed(1) }}% off</td>
                                <td>
                                  <span v-if="couponData.singleUse" class="badge bg-warning text-dark">
                                    Single Use
                                  </span>
                                  <span v-else class="badge bg-success">
                                    Multi-Use
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div v-else class="text-muted text-center py-3">
                          No coupons configured
                        </div>
                      </div>
                      
                      <!-- Optional Purchases Section -->
                      <div class="content-card mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <h5 class="mb-0">Optional Purchases</h5>
                          <button 
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="editProperty('optionalpurchases', 'editedOptionalPurchases', raceData.optionalPurchases ? [...raceData.optionalPurchases] : [])"
                          >
                            Edit Optional Purchases
                          </button>
                        </div>
                        
                        <div v-if="raceData.optionalPurchases && raceData.optionalPurchases.length > 0">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th scope="col">Label</th>
                                <th scope="col">Description</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Options</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(purchase, idx) in raceData.optionalPurchases" :key="idx">
                                <td><strong>{{ purchase.label }}</strong></td>
                                <td>
                                  <div v-if="purchase.description" v-html="purchase.description" class="small text-muted"></div>
                                  <span v-else class="text-muted">—</span>
                                </td>
                                <td>{{ dollas(parseFloat(purchase.amount)) }}</td>
                                <td>
                                  <span v-if="purchase.options && purchase.options.length > 0" class="badge bg-info">
                                    {{ purchase.optionsLabel || 'Options' }}: {{ purchase.options.join(', ') }}
                                  </span>
                                  <span v-else class="text-muted">—</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div v-else class="text-muted text-center py-3">
                          No optional purchases configured
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Content Tab -->
              <div v-show="activeTab === 'content'" class="tab-pane" :class="{ active: activeTab === 'content', show: activeTab === 'content' }">
                <div class="content-section">
                  <!-- Registration Form Header Section -->
                  <div class="content-card mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h5 class="mb-0">Registration Form Header</h5>
                      <button 
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="editProperty('eventDetails', 'editedEventDetails', raceData.eventDetails ? { ...raceData.eventDetails } : {})"
                      >
                        Edit Header
                      </button>
                    </div>
                    
                    <div v-if="raceData.eventDetails && Object.keys(raceData.eventDetails).length > 0" class="preview-box">
                      <div class="event-header-preview">
                        <div class="row align-items-center">
                          <div v-if="raceData.eventDetails.logoUrl" class="col-md-3 text-center">
                            <img :src="raceData.eventDetails.logoUrl" alt="Event Logo" style="max-width: 150px; max-height: 150px;">
                          </div>
                          <div class="col">
                            <h4 class="fw-bold mb-2">{{ raceData.eventDetails.name || 'No name set' }}</h4>
                            <p v-if="raceData.eventDetails.tagline" class="lead mb-2">{{ raceData.eventDetails.tagline }}</p>
                            <p v-if="raceData.eventDetails.formattedDates" class="mb-2">{{ raceData.eventDetails.formattedDates }}</p>
                            <div v-if="raceData.eventDetails.homepageUrl" class="mb-2">
                              <a :href="raceData.eventDetails.homepageUrl" target="_blank" class="btn btn-sm btn-success">
                                Event Homepage
                              </a>
                            </div>
                          </div>
                        </div>
                        <div v-if="raceData.eventDetails.headerPhoto" class="mt-3">
                          <div class="text-muted small mb-1">Header Photo:</div>
                          <img :src="raceData.eventDetails.headerPhoto" alt="Header Photo" style="max-width: 100%; max-height: 200px;">
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="alert alert-warning mb-0">
                      <small>⚠️ No header details configured. Click "Edit Header" to add them.</small>
                    </div>
                  </div>
                  
                  <!-- Header Content Section -->
                  <div class="content-card mb-4">
                    <!-- Show button to add content when editor is hidden -->
                    <div v-if="!showHeaderContentEditor">
                      <h5 class="mb-3">Extra Content Below Header</h5>
                      <button 
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="showHeaderContentEditor = true"
                      >
                        <Edit3 :size="16" class="me-1" />
                        Add Header Content
                      </button>
                    </div>
                    
                    <!-- Show editor when enabled -->
                    <div v-else>
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="mb-0">Extra Content Below Header</h5>
                        <button 
                          type="button"
                          class="btn btn-sm btn-success"
                          @click="saveHeaderContent"
                        >
                          Save Header Content
                        </button>
                      </div>
                      
                      <RichTextEditor 
                        v-model="editedHeaderContent"
                        label="Header Content"
                        placeholder="Enter additional content to display below the registration form header..."
                        :min-height="'200px'"
                      />
                      
                      <div v-if="raceData.headerContent" class="mt-3">
                        <div class="preview-box">
                          <div class="preview-label">Current Content Preview:</div>
                          <div v-html="raceData.headerContent"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Waiver Section -->
                  <div class="content-card mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h5 class="mb-0">Waiver / Liability Release</h5>
                      <button 
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="editProperty('waiver', 'editedWaiver', raceData.waiver ? { ...raceData.waiver } : null)"
                      >
                        Edit Waiver
                      </button>
                    </div>
                    
                    <div v-if="raceData.waiver && raceData.waiver.text">
                      <div class="mb-2">
                        <span class="badge bg-info">
                          {{ raceData.waiver.format === 'html' ? 'HTML (Rich Text)' : 'Plain Text' }}
                        </span>
                        <span v-if="raceData.waiver.format !== 'html' && raceData.waiver.header" class="ms-2 text-muted small">
                          Header: {{ raceData.waiver.header }}
                        </span>
                      </div>
                      <div class="preview-box">
                        <div class="preview-label">Preview:</div>
                        <div v-if="raceData.waiver.format === 'html'" v-html="raceData.waiver.text.substring(0, 300) + (raceData.waiver.text.length > 300 ? '...' : '')"></div>
                        <div v-else>{{ raceData.waiver.text.substring(0, 300) + (raceData.waiver.text.length > 300 ? '...' : '') }}</div>
                      </div>
                    </div>
                    <div v-else>
                      <div class="alert alert-warning mb-0">
                        <small>⚠️ No waiver configured. Click "Edit Waiver" to add one.</small>
                      </div>
                    </div>
                  </div>

                  <!-- Registration Confirmation Email Section -->
                  <div class="content-card">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h5 class="mb-0">Registration Confirmation Email</h5>
                      <button 
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="editProperty('emailTemplate', 'editedEmailTemplate', raceData.emailTemplate || null)"
                      >
                        Edit Email Template
                      </button>
                    </div>
                    
                    <div v-if="raceData.emailTemplate" class="mb-2">
                      <span class="badge bg-success">Custom Template Active</span>
                      <span class="ms-2 text-muted small">
                        A custom email template is configured for this race.
                      </span>
                    </div>
                    <div v-else class="mb-2">
                      <span class="badge bg-secondary">Using Default Template</span>
                      <span class="ms-2 text-muted small">
                        Using the standard registration confirmation email.
                      </span>
                    </div>
                    
                    <div class="preview-label">Preview with Sample Data:</div>
                    <div class="preview-box">
                      <div class="email-preview">
                        <div class="mb-2 pb-2 border-bottom">
                          <strong>Subject:</strong> {{ renderedEmailPreview.subject }}
                        </div>
                        <div v-html="renderedEmailPreview.body" style="font-size: 0.875rem;"></div>
                      </div>
                    </div>
                    
                    <div class="mt-2">
                      <small class="text-muted">
                        Preview uses actual race data with sample registrant information (John Doe, Sample Racing Team).
                      </small>
                    </div>
                    
                    <div class="alert alert-info mt-3 mb-0">
                      <small>
                        <strong>Tip:</strong> This email is automatically sent to registrants after they complete their registration. 
                        You can customize the subject line and body, and use template variables to personalize the message.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Advanced Tab -->
              <div v-show="activeTab === 'advanced'" class="tab-pane" :class="{ active: activeTab === 'advanced', show: activeTab === 'advanced' }">
                <FormKit type="form" :errors="formError" id="race-advanced" @submit="saveRaceData" submit-label="Save Advanced Settings"
                  v-model="formInputData">
                  <h6 class="mb-3">Display Options</h6>
                  <FormKit :value="raceData?.showPaytypeOnRoster" type="checkbox"
                    label="Show Payment Type as stages on roster" name="showPaytypeOnRoster" />
                  <FormKit :value="raceData?.hideRosterButton" type="checkbox"
                    label="Hide Roster Button on Registration Page and race list" name="hideRosterButton" />
                  
                  <h6 class="mt-4 mb-3">Feature Toggles</h6>
                  <FormKit :value="raceData.couponsEnabled" type="checkbox" label="Enable Coupons" name="couponsEnabled" />
                  <FormKit :value="raceData?.cashPaymentsEnabled" type="checkbox" label="Enable Cash payments on race day"
                    name="cashPaymentsEnabled" />
                  <FormKit :value="raceData.disableAge" type="checkbox" label="Disable Birthdate requirement" name="disableAge" />
                  
                  <div v-if="raceData.series" class="mb-3">
                    <FormKit :value="raceData.disableSeriesRedirect" type="checkbox" label="Disable Series Redirect" name="disableSeriesRedirect" />
                    <div class="alert alert-info mt-2 mb-0">
                      <small>
                        <strong>Series Redirect Behavior:</strong><br>
                        When <strong>disabled</strong> (checked):
                        <ul class="mb-1 mt-1">
                          <li>This race will appear on the main landing page</li>
                          <li>Users can register directly for this specific race</li>
                          <li>No automatic redirects occur</li>
                        </ul>
                        When <strong>enabled</strong> (unchecked - default):
                        <ul class="mb-1 mt-1">
                          <li>Only the first/next upcoming race in the series appears on the main landing page</li>
                          <li>Users visiting this race's registration page will be automatically redirected to the next upcoming race in the series</li>
                          <li>Helps prevent users from accidentally registering for the wrong race in a series</li>
                        </ul>
                        <em>💡 Tip: Enable this option if you want each race in the series to be independently accessible (e.g., for special events or makeup races).</em>
                      </small>
                    </div>
                  </div>
                  <FormKit v-else :value="raceData.disableSeriesRedirect" type="checkbox" label="Disable Series Redirect" name="disableSeriesRedirect" />
                  
                  <h6 class="mt-4 mb-3">Payment Integration</h6>
                  <FormKit :value="raceData.isTestData" type="checkbox" label="Use Test payment integrations"
                    name="isTestData" />
                  <FormKit type="group" name="stripeMeta">
                    <FormKit :value="raceData?.stripeMeta?.accountId" type="text" name="accountId"
                      label="Stripe Integration Account ID" />
                  </FormKit>
                  
                  <h6 class="mt-4 mb-3">Race Status</h6>
                  <FormKit :value="raceData.archived" type="checkbox"
                    label="Archive Race (will not be visible in admin race list)" name="archived" />
                </FormKit>
              </div>
            </div>
          </div>
        </div>
        <!-- <pre>{{raceData}}
      </pre> -->
        <Teleport to="body">
          <EditRaceCategoriesComponent v-if="modalMode == 'categories'" :show="showModal" :categories="editedCategories"
            :payTypes="paymentOptions" :seriesId="raceData.series" @close="closeModal" @save="saveProperty">
          </EditRaceCategoriesComponent>


          <EditRacePaymentsComponent :paymentOptions="editedPaymentOptions" v-if="modalMode == 'paymentOptions'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRacePaymentsComponent>
          <EditRaceCouponsComponent :coupons="editedCoupons" v-if="modalMode == 'coupons'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceCouponsComponent>
          <EditRaceOptionalPurchasesComponent :optionalPurchases="editedOptionalPurchases" v-if="modalMode == 'optionalpurchases'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceOptionalPurchasesComponent>
          <EditRaceWaiverComponent :waiver="editedWaiver" v-if="modalMode == 'waiver'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceWaiverComponent>
          <EditRaceEventDetailsComponent :eventDetails="editedEventDetails" v-if="modalMode == 'eventDetails'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceEventDetailsComponent>
          <EditRaceEmailTemplateComponent :emailTemplate="editedEmailTemplate" :raceData="raceData" v-if="modalMode == 'emailTemplate'" :show="showModal"
            @close="closeModal" @save="saveProperty">
          </EditRaceEmailTemplateComponent>

        </Teleport>
      </div>
      <div v-else>
        <div class="text-center">
          <h2 class="mt-5">Race not available for registration...</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
table.table {
  --bs-table-hover-bg: #76c8ff;
}

.series-banner {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.series-preview-info {
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 12px;
}

.category-preview {
  margin-top: 12px;
}

.cat-preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cat-preview-row:last-child {
  border-bottom: none;
}

.cat-preview-row.from-series {
  background-color: #f5f9ff;
  border-left: 3px solid #1976d2;
}

.cat-preview-row.race-override {
  background-color: #fff8e1;
  border-left: 3px solid #f57c00;
}

.cat-preview-name {
  font-weight: 500;
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

.cat-preview-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
  cursor: help;
}

/* Match Bootstrap badge colors from payment options section exactly */
/* Bootstrap bg-primary (blue) */
.badge-race {
  background-color: #0d6efd;
  color: #fff;
}

/* Bootstrap bg-info (cyan) */
.badge-series-group {
  background-color: #0dcaf0;
  color: #fff;
}

/* Bootstrap bg-success (green) */
.badge-series-default {
  background-color: #198754;
  color: #fff;
}

/* Bootstrap bg-warning (orange/yellow) for race overrides */
.badge-race-override {
  background-color: #ffc107;
  color: #fff;
}

.series-payment-info {
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

table.table tr.from-series {
  background-color: #f5f9ff;
  border-left: 3px solid #1976d2;
}

table.table td {
  vertical-align: middle;
}

table.table .series-icon {
  vertical-align: middle;
}

table.table tr.is-overridden {
  opacity: 0.7;
  background-color: #fff8e1;
}

table.table tr.is-overridden:hover {
  opacity: 0.85;
}

/* Tab Layout Styles */
.nav-tabs {
  border-bottom: 2px solid #dee2e6;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background-color: transparent;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background-color: transparent;
}

.tab-content {
  padding-top: 1rem;
}

.tab-pane {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Content Tab Styles */
.content-section {
  padding: 0.5rem 0;
}

/* Registration Tab Styles */
.registration-section {
  padding: 0.5rem 0;
}

.registration-section .row {
  margin-left: -0.5rem;
  margin-right: -0.5rem;
}

.registration-section .col-lg-6 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

/* Ensure equal height cards in registration section */
@media (min-width: 992px) {
  .registration-section .row {
    display: flex;
  }
  
  .registration-section .col-lg-6 {
    display: flex;
    flex-direction: column;
  }
}

.content-card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.preview-box {
  padding: 1rem;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
}

.event-header-preview {
  padding: 0.5rem;
}

.event-header-preview img {
  border-radius: 4px;
  object-fit: contain;
}

.event-header-preview h4 {
  color: #212529;
}

.event-header-preview .lead {
  color: #495057;
  font-size: 1rem;
}

.email-preview {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
}

.email-preview h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.email-preview p {
  margin-bottom: 0.5rem;
}
</style>
