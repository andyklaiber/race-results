<script>
import _ from "lodash";
import request from "@/lib/ApiClient";
import EventDetailsComponent from "@/components/EventDetailsComponent.vue";
import EventCategoryScheduleComponent from "@/components/EventCategoryScheduleComponent.vue"
import dayjs from '@/lib/dayjs';
import MainNav from "@/components/MainNav.vue";

let saveForm =  _.debounce((data, raceid)=>{
  window.localStorage.setItem(`race-reg-form-data-${raceid}`, JSON.stringify(data))
}, 3500);
let getForm = (raceid)=>{
  let data = window.localStorage.getItem(`race-reg-form-data-${raceid}`);
  if(data){
    let parsed = {};
    try{
      parsed = JSON.parse(data);
    }catch(err){
      // ignore invalid json
    }
    return parsed;
  }
  return null;
}
let clearFormStorage = (raceid)=>{
  window.localStorage.removeItem(`race-reg-form-data-${raceid}`);
}

function getFees(priceInDollars){
    if(priceInDollars === 0){
      return 0
    }
    let cents = priceInDollars * 100;
    let onlineFee = cents * .04;
    if(onlineFee > 600){
        onlineFee = 600
    }

    let ccFee = Math.round((cents + onlineFee + 30)/( 1 - .029 ));

    return ccFee - cents;
    // return { stripeFee: ccFee - onlineFee - cents, regFee: onlineFee };
}

export default {
  components: {
    MainNav,
    EventDetailsComponent,
    EventCategoryScheduleComponent,
  },
  data() {
    return {
      categories: {},
      loading: false,
      error: null,
      formError: [],
      formInputData: {},
      raceData: null,
      seriesData: null,
      payment: "",
      birthdate: "",//"1990-03-05",
      submitted: false,
      waiverAccepted: false,
      couponError: [],
      prevBibError: [],
      seriesRaces:{},
      seriesRaceIdx:0,
      previousReg: false,
      prevAge: null,
    };
  },
  created() {
    this.$watch(
      () => this.$route.params.raceid,
      () => {
        this.fetchData();
      },
      // fetch the data when the view is created and the data is
      // already being observed
      { immediate: true }
    );
  },
  watch: {
    formInputData: {
      handler(newValue, oldValue) {
        if(this.previousReg == false){
          saveForm(newValue, this.$route.params.raceid);
        }
        // Note: `newValue` will be equal to `oldValue` here
        // on nested mutations as long as the object itself
        // hasn't been replaced.
      },
      deep: true
    },
  },
  methods: {
    dollas(amt) {
      return amt.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
    fetchData() {
      this.error = null;
      this.loading = true;
      if (this.$route.params.raceid) {
        request(`/api/races/${this.$route.params.raceid}`)
          .then(async (response) => {
            this.raceData = response.data;
            console.log('=== Race Data Loaded ===');
            console.log('seriesData:', this.raceData.seriesData);
            console.log('categoryGroups:', this.raceData.seriesData?.categoryGroups);
            console.log('regCategories:', this.raceData.regCategories);
            console.log('paymentOptions:', this.raceData.paymentOptions);
            let prevFormData = getForm(this.$route.params.raceid);
            if(prevFormData){
              let category = _.find(this.raceData?.regCategories, { "id": prevFormData.category });
              if(!category){
                delete prevFormData.category;
              }
              prevFormData.waiverAccepted = false;
              this.formInputData = prevFormData;
            }
            if(!this.raceData.disableSeriesRedirect &&this.raceData.series && this.raceData.toString().length > 1 && this.$route.name !== 'register-test'){
              await request(`/api/series/${this.raceData.series}/registration`)
                .then(({data})=>{
                  this.seriesRaces = data;
                  let now = dayjs();
                  this.seriesRaceIdx = 0;
                  _.some(data, ({eventDate,raceid}, idx)=>{
                    if(dayjs(eventDate).isBefore(now)){
                      return false;
                    }
                    else{
                      this.seriesRaceIdx = idx;
                      if(this.$route.params.raceid !== raceid){
                        this.$router.push(`/register/${raceid}`)
                      }
                      return true;
                    }
                    })
                })
            }
            this.loading = false;
            if (this.raceData.paymentOptions && this.raceData.paymentOptions.length > 0) {
              this.payment = this.raceData.paymentOptions[0].type;
            }
          })
          .catch((err) => {
            this.raceData = null;
            this.loading = false;
            this.error = err.toString();
            if(err.code == 'ERR_BAD_REQUEST'){
              console.warn('tried to load raceid: '+this.$route.params.raceid);
              return console.warn(err.message);
            }
            console.error(err);
          });
      }
    },
    findPrevBib(bibNumber) {
      request.post(`/api/racers/bib`, {
        series: `${this.raceData.series}`,
        bibNumber
      })
        .then(({ data }) => {
          console.log('prevbib')
          if(data.paytype === 'season'){
            this.prevBibError = ['You are already registered for the whole season. You do not need to register every week.']
            return;
          }
          data.prevPaymentId = data.paymentId;
          delete data.optionalPurchases;
          delete data.paymentId;
          this.formInputData = data;
          this.prevAge = data.racerAge
        })
        .catch(({response})=>{
          console.dir(response)
          if(response.status== 404){
            this.prevBibError=[response.data.message]
          }
        })

    },
    onPrevBibChange(data){
      if (data) {
        this.findPrevBib(data);
      } else {
        this.prevBibError = [];
        this.prevAge = null;
      }
    },
    getCouponPricing(couponCode) {
      request.post(`/api/payments/pricing`, {
        raceid: `${this.$route.params.raceid}`,
        couponCode
      })
        .then(({ data }) => {
          this.raceData.paymentOptions = data.paymentOptions;
          

          if (!data.validCoupon) {
            if(data.reason){
              return this.couponError = [data.reason];
            }
            this.couponError = ["Invalid Coupon Code"];
          } else {
            this.couponError = [];
          }
        })

    },
    onCouponChange(data) {
      if (data) {
        this.getCouponPricing(data);
      } else {
        this.couponError = [];
      }
    },
    submitForm(clickEvent) {
      clickEvent.preventDefault();
      this.$formkit.submit("race-registration");
    },
    async submit(data) {
      console.log(data);
      data.birthdate = undefined;
      data.racerAge = this.racerAge;
      data.paytype = this.payment;
      data.timestamp = dayjs().format();
      await request
        .post(
          `/api/payments/start-registration?race=${this.raceData.raceid}`,
          data
        )
        .then((response) => {
          if (response.data) {
            console.log("response data");
            console.log(response.data);
            if(response.data.redirect){
              this.submitted = true;
              clearFormStorage(this.$route.params.raceid);
              return new Promise((resolve) =>
              setTimeout(() => {
                window.location.href = response.data.redirect;
                resolve();
              }, 2000)
              );
            }else{
              if(response.data.message){
                this.formError = [response.data.message];
              }
            }
          }
        })
        .catch((error) => {
          if(error.response?.data?.message){
            return this.formError = [error.response.data.message];
          }
          this.formError = ["Error submitting request"];
        });
    },
    getEventTimeObj(startTime) {
      return dayjs(`${dayjs(this.raceData.eventDate).format("YYYY-MM-DD")} ${startTime}`)
    },
    // Hybrid category model helpers
    isSeriesCategory(categoryId) {
      if (!this.raceData?.seriesData?.regCategories) return false;
      return this.raceData.seriesData.regCategories.some(cat => cat.id === categoryId);
    },
    isRaceOverride(category) {
      // Check if this category is a race-level override of a series category
      return category._isRaceOverride === true;
    },
    isPureSeriesCategory(category) {
      // Check if this is a pure series category (not overridden at race level)
      return category._isSeriesCategory === true;
    },
    getSeriesPaymentGroup(categoryId) {
      if (!this.raceData?.seriesData?.categoryGroups) return null;
      return this.raceData.seriesData.categoryGroups.find(group => 
        group.categories && group.categories.includes(categoryId)
      );
    },
    getAvailablePaymentOptionsForCategory(category) {
      if (!category) return [];
      
      console.log('=== getAvailablePaymentOptionsForCategory (Hybrid Model) ===');
      console.log('Category:', category.catdispname, category.id);
      console.log('seriesData:', this.raceData?.seriesData);
      
      // Build a map of payment types for override logic
      const racePaymentsByType = new Map();
      (this.raceData.paymentOptions || []).forEach(opt => {
        racePaymentsByType.set(opt.type, opt);
      });
      
      // Check category type
      const isSeriesCat = this.isSeriesCategory(category.id);
      const isRaceOverride = this.isRaceOverride(category);
      const isPureSeriesCat = this.isPureSeriesCategory(category);
      
      console.log(`Category ${category.catdispname}:`, {
        isSeriesCategory: isSeriesCat,
        isRaceOverride: isRaceOverride,
        isPureSeriesCategory: isPureSeriesCat,
        hasPaytype: !!category.paytype
      });
      
      // PRIORITY 1: Race override with forced paytype
      // Show the matching race payment option + series group options (if applicable)
      if (isRaceOverride && category.paytype) {
        const results = [];
        const addedTypes = new Set();
        
        // Add the matching race payment option for the paytype
        const matchingRaceOption = this.raceData.paymentOptions?.find(opt => opt.type === category.paytype);
        if (matchingRaceOption) {
          results.push({ ...matchingRaceOption, source: 'race-override-paytype' });
          addedTypes.add(matchingRaceOption.type);
          console.log(`Race override ${category.catdispname} with paytype ${category.paytype}, added matching race option:`, matchingRaceOption);
        }
        
        // Also add series group payment options for this category (but skip ones with same type as race option)
        const group = this.getSeriesPaymentGroup(category.id);
        if (group && group.paymentOptions && group.paymentOptions.length > 0) {
          console.log(`Race override ${category.catdispname} also has series group ${group.name}, checking group options:`, group.paymentOptions);
          group.paymentOptions.forEach(groupOpt => {
            // Skip if we already added a race payment option with this type
            if (!addedTypes.has(groupOpt.type)) {
              results.push({ ...groupOpt, source: 'series-group' });
              addedTypes.add(groupOpt.type);
              console.log(`  Added series group option: ${groupOpt.name} (${groupOpt.type})`);
            } else {
              console.log(`  Skipped series group option ${groupOpt.name} (${groupOpt.type}) - race override takes precedence`);
            }
          });
        }
        
        console.log(`Race override ${category.catdispname} final options with paytype:`, results);
        return results;
      }
      
      // PRIORITY 2: Race-specific category with forced paytype
      // Show ONLY the matching race payment option
      if (category._isRaceSpecific && category.paytype) {
        const matchingRaceOption = this.raceData.paymentOptions?.find(opt => opt.type === category.paytype);
        if (matchingRaceOption) {
          console.log(`Race-specific category ${category.catdispname} with paytype ${category.paytype}:`, matchingRaceOption);
          return [{ ...matchingRaceOption, source: 'race-paytype' }];
        }
        console.warn(`Race-specific category ${category.catdispname} has paytype ${category.paytype} but no matching race payment option found`);
        return [];
      }
      
      // PRIORITY 3: Race override without paytype - use all race payment options
      if (isRaceOverride && !category.paytype) {
        console.log(`Race override ${category.catdispname} without paytype, using all race payment options`);
        return (this.raceData.paymentOptions || []).map(opt => ({ ...opt, source: 'race-override' }));
      }
      
      // PRIORITY 4: Pure series category in a group - use group payment options + race payment options
      if (isPureSeriesCat) {
        const group = this.getSeriesPaymentGroup(category.id);
        console.log('Found payment group:', group);
        
        // PRIORITY 4a: Series category with forced paytype
        if (category.paytype) {
          const results = [];
          const addedTypes = new Set();
          
          // First, look for the forced paytype in race payment options (highest priority)
          const matchingRaceOption = this.raceData.paymentOptions?.find(opt => opt.type === category.paytype);
          if (matchingRaceOption) {
            console.log(`Series category ${category.catdispname} with paytype ${category.paytype}, adding race option:`, matchingRaceOption);
            results.push({ ...matchingRaceOption, source: 'race-paytype' });
            addedTypes.add(category.paytype);
          } else {
            // If not in race, try series default payment options
            if (this.raceData.seriesData?.defaultPaymentOptions) {
              const matchingDefaultOption = this.raceData.seriesData.defaultPaymentOptions.find(opt => opt.type === category.paytype);
              if (matchingDefaultOption) {
                console.log(`Series category ${category.catdispname} with paytype ${category.paytype}, adding series default:`, matchingDefaultOption);
                results.push({ ...matchingDefaultOption, source: 'series-default-paytype' });
                addedTypes.add(category.paytype);
              }
            }
          }
          
          // Also add all series group payment options (if category is in a group)
          if (group && group.paymentOptions && group.paymentOptions.length > 0) {
            console.log(`Series category ${category.catdispname} with paytype also has group ${group.name}, adding group options`);
            group.paymentOptions.forEach(groupOpt => {
              // Skip if we already added this type (the forced paytype)
              if (!addedTypes.has(groupOpt.type)) {
                // Check if race overrides this group payment type
                if (racePaymentsByType.has(groupOpt.type)) {
                  const raceOpt = racePaymentsByType.get(groupOpt.type);
                  console.log(`  Race overrides group ${groupOpt.type}: ${groupOpt.name} -> ${raceOpt.name}`);
                  results.push({
                    ...groupOpt,
                    name: raceOpt.name,
                    amount: raceOpt.amount,
                    source: 'race-override-group'
                  });
                } else {
                  results.push({ ...groupOpt, source: 'series-group' });
                }
                addedTypes.add(groupOpt.type);
              }
            });
          }
          
          if (results.length > 0) {
            console.log(`Series category ${category.catdispname} final options with paytype:`, results);
            return results;
          }
          
          console.warn(`Series category ${category.catdispname} has paytype ${category.paytype} but no matching payment option found`);
          return [];
        }
        
        if (group && group.paymentOptions && group.paymentOptions.length > 0) {
          console.log(`Category ${category.catdispname} is in series group ${group.name}`);
          
          // Start with group payment options, applying race overrides where types match
          const mergedOptions = group.paymentOptions.map(groupOpt => {
            // If race has a matching payment type, use race's amount and name (override)
            if (racePaymentsByType.has(groupOpt.type)) {
              const raceOpt = racePaymentsByType.get(groupOpt.type);
              console.log(`Race overrides ${groupOpt.type}: ${groupOpt.name} ($${groupOpt.amount}) -> ${raceOpt.name} ($${raceOpt.amount})`);
              return {
                ...groupOpt,
                name: raceOpt.name,
                amount: raceOpt.amount,
                source: 'race-override-group'
              };
            }
            return { ...groupOpt, source: 'series-group' };
          });
          
          // Add race payment options that DON'T match any group payment types
          const groupPaymentTypes = new Set(group.paymentOptions.map(opt => opt.type));
          const additionalRaceOptions = (this.raceData.paymentOptions || [])
            .filter(raceOpt => !groupPaymentTypes.has(raceOpt.type))
            .map(opt => ({ ...opt, source: 'race-additional' }));
          
          if (additionalRaceOptions.length > 0) {
            console.log('Adding race-specific payment options not in group:', additionalRaceOptions);
            mergedOptions.push(...additionalRaceOptions);
          }
          
          console.log('Final merged payment options (group + race):', mergedOptions);
          return mergedOptions;
        }
        
        // PRIORITY 5: Series category NOT in a group - use series default payment options + race payment options
        if (this.raceData.seriesData?.defaultPaymentOptions && this.raceData.seriesData.defaultPaymentOptions.length > 0) {
          console.log(`Category ${category.catdispname} uses series default payment options`);
          
          // Start with default payment options, applying race overrides where types match
          const mergedOptions = this.raceData.seriesData.defaultPaymentOptions.map(defaultOpt => {
            // If race has a matching payment type, use race's amount and name (override)
            if (racePaymentsByType.has(defaultOpt.type)) {
              const raceOpt = racePaymentsByType.get(defaultOpt.type);
              console.log(`Race overrides ${defaultOpt.type}: ${defaultOpt.name} ($${defaultOpt.amount}) -> ${raceOpt.name} ($${raceOpt.amount})`);
              return {
                ...defaultOpt,
                name: raceOpt.name,
                amount: raceOpt.amount,
                source: 'race-override-default'
              };
            }
            return { ...defaultOpt, source: 'series-default' };
          });
          
          // Add race payment options that DON'T match any default payment types
          const defaultPaymentTypes = new Set(this.raceData.seriesData.defaultPaymentOptions.map(opt => opt.type));
          const additionalRaceOptions = (this.raceData.paymentOptions || [])
            .filter(raceOpt => !defaultPaymentTypes.has(raceOpt.type))
            .map(opt => ({ ...opt, source: 'race-additional' }));
          
          if (additionalRaceOptions.length > 0) {
            console.log('Adding race-specific payment options not in defaults:', additionalRaceOptions);
            mergedOptions.push(...additionalRaceOptions);
          }
          
          console.log('Final merged payment options (defaults + race):', mergedOptions);
          return mergedOptions;
        }
      }
      
      // PRIORITY 6: Fallback to all race payment options (for race-specific categories without paytype)
      console.log(`Category ${category.catdispname} uses race payment options:`, this.raceData.paymentOptions);
      return (this.raceData.paymentOptions || []).map(opt => ({ ...opt, source: 'race' }));
    }
  },
  computed: {
    startTimes() {
      if (this.hasStartTimes) {
        return _.map(_.uniqBy(this.raceData.regCategories, 'startTime'), 'startTime');
      }
      return null;
    },
    hasStartTimes() {
      return !!_.some(this.raceData.regCategories, 'startTime')
    },
    currentTime() {
      return dayjs().local().format();
    },
    firstRaceTime() {
      if (this.hasStartTimes) {
        return dayjs.min(_.map(this.startTimes, (time) => dayjs(`${this.eventDateFormatted} ${time}`)));
      }
      return null;
    },
    lastRaceTime() {
      if (this.hasStartTimes) {
        return dayjs.max(_.map(this.startTimes, (time) => dayjs(`${this.eventDateFormatted} ${time}`)));
      }
      return null;
    },
    sortedCats() {
      const filtered = _.filter(this.raceData.regCategories, (cat) => {
        // if (cat.startTime && dayjs().isAfter(this.getEventTimeObj(cat.startTime).subtract(20, 'minute'))) {
        //   return false;
        // }

        // if (cat.minAge && this.racerAge < cat.minAge) {
        //   return false
        // }
        // if (cat.maxAge && this.racerAge > cat.maxAge) {
        //   return false
        // }
        return true;
      })
      let cats = {};
      _.forEach(
        _.orderBy(filtered, "disporder"),
        (element) => {
          cats[element.id] = element.catdispname;
        }
      );
      return cats;
    },
    loaded() {
      if (!this.raceData) {
        return false;
      }
      return true;
    },
    submitLabel() {
      if (this.payment == 'cash' || this.sponsoredCategorySelected) {
        return "Sign Up!"
      }
      return "Go to Payment"
    },
    cashEnabled() {
      if(!this.raceData.cashPaymentsEnabled){
        return false;
      }
      return true;
    },
    eventDateFormatted() {
      return dayjs(this.raceData.eventDate).format('YYYY-MM-DD');
    },
    regDisabled() {
      if(this.$route.name == 'register-test'){
        return false;
      }
      if(this.eventFull){
        return true;
      }
      if(dayjs().isBefore(this.raceData.eventDetails.regOpenDate)){
        return true;
      }
      if(this.raceData.eventDetails.regCloseDate && dayjs().isAfter(this.raceData.eventDetails.regCloseDate)){
        return true;
      }
      if(!this.lastRaceTime){
        return false;
      }
      return dayjs().isAfter(this.lastRaceTime.subtract(5, 'minute'))
    },
    eventFull(){
      if(this.raceData.entryCountMax && this.raceData.entryCountMax > 1){
        if(this.raceData.entryCount >= this.raceData.entryCountMax){
          return true;
        }
      }
      return false;
    },
    paymentOptions() {
      let options = {};
      
      if (!this.selectedCategory) {
        console.log('No category selected, showing no payment options');
        return options;
      }
      
      console.log('=== Building paymentOptions (Hybrid Model) ===');
      console.log('Selected category:', this.selectedCategory.catdispname, this.selectedCategory.id);
      
      // Get available payment options for the selected category
      const availableOptions = this.getAvailablePaymentOptionsForCategory(this.selectedCategory);
      
      console.log('Available payment options for category:', availableOptions);
      
      // Sort payment options by amount (ascending - cheapest first)
      const sortedOptions = _.sortBy(availableOptions, (opt) => parseFloat(opt.amount || 0));
      
      // Build options object
      _.forEach(sortedOptions, (element) => {
        console.log('Processing payment option:', element.type, element.name, element);
        // Handle legacy season pass with category-based pricing (backward compatibility)
        if (element.type === 'season' && element.categoryGroups && this.formInputData.category) {
          const categoryGroup = element.categoryGroups.find(group =>
            group.categories.includes(this.formInputData.category)
          );
          
          if (categoryGroup) {
            options[element.type] = categoryGroup.name;
          } else if (element.defaultName) {
            options[element.type] = element.defaultName;
          } else {
            options[element.type] = element.name;
          }
        } else {
          options[element.type] = element.name;
        }
      });
      
      // Add cash option if enabled and not a sponsored category
      if (this.cashEnabled && !this.selectedCategory.sponsored) {
        options['cash'] = 'Cash Payment (This Race Only)';
      }
      
      console.log('Final payment options object:', options);
      console.log('Final payment options count:', Object.keys(options).length);
      return options;
    },
    paymentCostDets() {
      if(!this.selectedCategory){
        return {}
      }
      if (this.paymenttypeRequiredCategorySelected) {
        this.payment = this.selectedCategory?.paytype;
      }
      if (this.sponsoredCategorySelected) {
        this.payment = "season";
        return {
          cost: this.dollas(0),
          regFee: this.dollas(0),
          tot: this.dollas(0)
        }
      }
      
      let altPaytype;
      if (this.payment === 'cash') {
        altPaytype = 'single';
      } else {
        altPaytype = this.payment;
      }
      
      // Get available payment options for the selected category
      const availableOptions = this.getAvailablePaymentOptionsForCategory(this.selectedCategory);
      
      // Find the selected payment option from available options
      let payOpt = availableOptions.find(el => el.type === altPaytype);
      
      if (!payOpt){
        // couldn't find selected paytype, try to select first available
        console.log('Selected payment type not found, selecting first available');
        if (availableOptions.length > 0) {
          payOpt = availableOptions[0];
          this.payment = payOpt.type;
        } else {
          // Fallback to race payment options
          payOpt = this.raceData?.paymentOptions?.[0];
          if (payOpt) {
            this.payment = payOpt.type;
          }
        }
      }
      
      if (!payOpt) {
        console.error('No payment option found');
        return {};
      }
      
      // LEGACY: Apply category-specific pricing if available (backward compatibility)
      if (payOpt.categoryGroups && this.formInputData.category) {
        const categoryGroup = payOpt.categoryGroups.find(group =>
          group.categories.includes(this.formInputData.category)
        );
        
        if (categoryGroup) {
          payOpt = {
            ...payOpt,
            amount: categoryGroup.amount,
            name: categoryGroup.name
          };
        } else if (payOpt.defaultAmount !== undefined) {
          payOpt = {
            ...payOpt,
            amount: payOpt.defaultAmount,
            name: payOpt.defaultName || payOpt.name
          };
        }
      }
      
      const amt = parseFloat(payOpt.amount);
      let fees = 0;
      if (amt > 0 && this.payment !== 'cash') {
        fees = (payOpt.regFee + payOpt.stripeFee) / 100;
      }
      const dets = {}
      _.assign(dets, payOpt, {
        name: payOpt.name,
        cost: this.dollas(amt),
        regFee: this.dollas(fees),
        tot: this.dollas(
          parseFloat(payOpt.amount) + parseFloat(fees)
        ),

      });
      if (this.raceData?.optionalPurchases && this.formInputData.optionalPurchases) {
        let newTot = amt;
        this.raceData.optionalPurchases.forEach(({ id, label, description, amount }) => {
          if (this.formInputData.optionalPurchases[id]) {
            if (!dets.options) {
              dets.options = [];
            }
            dets.options.push({ description,label, id, amount:this.dollas(parseFloat(amount)) })
            newTot += parseFloat(amount);
          }
        })
        fees = getFees(newTot)/100
        dets.regFee = this.dollas(fees);
        dets.tot = this.dollas(newTot + fees)

      }
      return dets;
    },
    showPaymentOption() {
      console.log('=== showPaymentOption ===');
      console.log('paymenttypeRequiredCategorySelected:', this.paymenttypeRequiredCategorySelected);
      console.log('sponsoredCategorySelected:', this.sponsoredCategorySelected);
      console.log('cashEnabled:', this.cashEnabled);
      
      // Get the available payment options for the selected category
      const availableOptions = this.selectedCategory 
        ? this.getAvailablePaymentOptionsForCategory(this.selectedCategory)
        : [];
      
      console.log('Available payment options count:', availableOptions.length);
      
      if (this.paymenttypeRequiredCategorySelected) {
        console.log('Hiding because paymenttypeRequiredCategorySelected');
        return false;
      }
      if (this.sponsoredCategorySelected) {
        console.log('Hiding because sponsoredCategorySelected');
        return false;
      }
      if(this.cashEnabled){
        console.log('Showing because cashEnabled');
        return true;
      }
      if (availableOptions.length < 2) {
        console.log('Hiding because only 1 payment option available for this category');
        return false;
      }
      console.log('Showing payment options');
      return true;
    },
    paymenttypeRequiredCategorySelected(){
      console.log('=== paymenttypeRequiredCategorySelected (Hybrid Model) ===');
      console.log('selectedCategory:', this.selectedCategory);
      
      // If no category selected, don't show payment options yet
      if (!this.selectedCategory) {
        console.log('Returning true (no category selected)');
        return true;
      }
      
      // Get available payment options for this category
      const availableOptions = this.getAvailablePaymentOptionsForCategory(this.selectedCategory);
      
      console.log('Available payment options:', availableOptions.length);
      
      // If only one payment option available, it's required (hide selector)
      if (availableOptions.length <= 1 && !this.cashEnabled) {
        console.log('Returning true (only one payment option)');
        return true;
      }
      
      console.log('Returning false (multiple payment options available)');
      return false;
    },
    sponsoredCategorySelected() {
      if (this.selectedCategory?.sponsored) {
        return true;
      }
      return false;
    },
    selectedCategory() {
      if (this.formInputData && this.formInputData.category) {
        return _.find(this.raceData?.regCategories, { "id": this.formInputData?.category });
      }
      return null;
    },
    racerAge() {
      if(this.prevAge){
        return this.prevAge;
      }
      if (this.birthdate) {
        //calculate racer age on dec 31
        const dec31 = dayjs();
        const bday = dayjs(this.birthdate);

        return dec31.year() - bday.year();

      }
    },
  },
};
</script>

<template>
   <MainNav></MainNav>
  <div v-if="loading" class="loading">Loading...</div>
  <div v-else>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="loaded">
      <EventDetailsComponent :details="raceData.eventDetails" :raceid="raceData.raceid" />
      <div v-if="eventFull" class="h5">This event has reached the registration entry max of {{ raceData.entryCountMax }}</div>
      <div v-if="regDisabled">
        <h3>Registration is closed.</h3>
      </div>
      <div v-else class="mb-5">
        <div class="mb-3" v-if="raceData?.headerContent" v-html="raceData.headerContent"></div>
        <div v-if="raceData?.seriesRaceNumber > 1">
          
          <FormKit label-class="text-danger fw-bold fs-5" type="checkbox" name="prevBibLookup" label="I have a bib number!" help="Look up your information from a previous race in this series" v-model="previousReg" />
          <FormKit v-if="previousReg" 
                  type="number" name="bibNumber" 
                  label="Bib Number:" 
                  help="Enter your Bib Number from your previous race to pre-fill your info" 
                  :delay="1500" 
                  @input="onPrevBibChange"
                  :errors="prevBibError"
                  validation="required" />  
        </div>
        <FormKit type="form" id="race-registration" v-model="formInputData" :form-class="submitted ? 'hide' : 'show'"
          :errors="formError" :actions="false" @submit="submit">
          <div class="row">
            <div class="col-md-6 order-md-1 mb-3">
              <h4 class="d-flex justify-content-between align-items-center mb-3">
                <h5>Registration Info</h5>
                <span class="badge badge-secondary badge-pill">3</span>
              </h4>
              
                <FormKit type="text" name="first_name" label="First name" help="What is your first name"
                  validation="required" />
                <FormKit type="text" name="last_name" label="Last name" help="What is your last name"
                  validation="required" />
              <div class="form-group pt-3">
                <FormKit v-if="!previousReg" type="email" name="email" label="Your email" help="Enter an email address"
                  validation="required|email" />
              </div>
              <FormKit type="text" name="sponsor" label="Your Team or Sponsor"
                help="Enter an optional Team or Sponsor name" maxlength="25"/>
              <FormKit v-if="!raceData?.disableAge && !previousReg" type="date" name="birthdate" label="Birthday" v-model="birthdate"
                help="Tap on the year at the top of the popup to change it" validation="required|before:2020-01-01"
                validation-visibility="live" />
              <p v-if="!raceData?.disableAge" class="fw-bolder">Racing Age (as of Dec 31): {{racerAge}}</p>
              <div class="form-group pt-3">
                <FormKit type="select" id="category" label="Category:" placeholder="Select a category"
                  name="category" :options="sortedCats" validation="required" validation-visibility="dirty"
                  :validation-messages="{
                    is: 'You must select a category',
                  }" />
              </div>
              <FormKit v-if="!previousReg" type="text" name="contactNumber" label="Phone Number" help="If there is an issue on race day, we will try to contact you via this number" />
              <FormKit v-if="!previousReg" type="text" name="emergencyNumber" label="Emergency Contact Name and Number" help="In case of an emergency, we will contact this person" />
            </div>
            <div class="col-md-5 order-md-2 mb-4" v-if="paymentCostDets">
              <h4 class="d-flex justify-content-between align-items-center mb-3">
                <h5>Payment Detail</h5>
              </h4>
              <fieldset class="list-group mb-3">
                <div>
                  <FormKit type="text" name="coupon" label="Coupon Code" help="" :delay="1000" @input="onCouponChange"
                    v-if="raceData.couponsEnabled" :errors="couponError" />
                </div>
              </fieldset>
              <fieldset class="list-group mb-3">
                <div>
                  <FormKit type="radio" name="paytype" label="Payment option" :options="paymentOptions"
                    validation="required" v-model="payment" v-if="showPaymentOption" />
                </div>
              </fieldset>
              <div v-if="raceData.optionalPurchases && (showPaymentOption || paymentCostDets.name)">
                <FormKit type="group" name="optionalPurchases">
                <div v-for="(item, idx) in raceData.optionalPurchases" class="list-group mb-3">
                  <h6 v-html="item.description"></h6>
                  <FormKit type="checkbox" :label="`${item.label} - ${dollas(parseFloat(item.amount))}`" :name="item.id" />
                  <FormKit v-if="item.options && formInputData.optionalPurchases[item.id]" type="select" :options="item.options" :label="item.optionsLabel" :name="`${item.id}-option`"></FormKit>
                </div>
                </FormKit>
              </div>
              <ul class="list-group mb-3 formkit-fieldset">
                <li class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">Event Entry:</h6>
                    <small class="text-muted">{{ paymentCostDets.name }}</small>
                  </div>
                  <div>
                    <span v-if="paymentCostDets.discounted" class="mx-3 text-decoration-line-through text-danger">{{
                    dollas(paymentCostDets.orig) }}</span>
                    <span :class="{'text-success':paymentCostDets.discounted}">{{ paymentCostDets.cost }}</span>
                  </div>
                </li>
                <li  v-if="paymentCostDets.options" v-for="(item, id) in paymentCostDets.options" class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">{{item.label}}</h6>
                    <small v-if="item.option" class="text-muted">{{ item.option }}</small>
                  </div>             
                  <div>
                    <span>{{ item.amount }}</span>      
                  </div>
                </li>
                <li class="
                  list-group-item
                  d-flex
                  justify-content-between
                  lh-condensed
                ">
                  <div>
                    <h6 class="my-0">Online Processing Fee:</h6>
                    <small class="text-muted">Credit Card Processing and Online Registration</small>
                  </div>
                  <span class="text-muted">{{ paymentCostDets.regFee }}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Total (USD)</span>
                  <strong>{{ paymentCostDets.tot }}</strong>
                </li>
              </ul>
            </div>
          </div>
          <div v-if="sponsoredCategorySelected">
            <p class="mb-5">
              <h5>Your {{selectedCategory.catdispname}} race entry is sponsored by {{selectedCategory.sponsorName}}</h5>
            </p>
          </div>
          <div v-if="payment ==='cash'">
            <h2 class="text-danger">Your registration will not be active until payment is received at the event</h2>
          </div>
          <div v-if="raceData.waiver">
            <div v-if="raceData.waiver.format =='html'" v-html="raceData.waiver.text"></div>
            <div v-else>
              <h5>{{raceData.waiver.header}}</h5>
              <p>{{ raceData.waiver.text }}</p>
            </div> 
          <FormKit  
          type="checkbox"
          v-model="waiverAccepted"
          label="I HAVE READ AND UNDERSTAND THIS WAIVER"
          help="I acknowledge that I have read, understand, and accepted the above release of liability."
          name="waiverAccepted" 
          validation="accepted"
          :validation-messages="{
            accepted: 'You must agree to the terms of the liability release above'
          }"
          validation-visibility="live"
          />
          </div>
          <FormKit type="submit" :label="submitLabel" @click="submitForm" />
        </FormKit>
        <div v-if="submitted">
          <h2>Submission successful, redirecting</h2>
        </div>
      </div>
      <EventCategoryScheduleComponent :categories="raceData.regCategories" :raceDate="raceData.eventDate" />
    </div>
    <div v-else>
      <div class="text-center">
        <h2 class="mt-5">Race not found...</h2>
      </div>
    </div>
  </div>
</template>

<style>
.prev-lookup.formkit-label{
  color: #c10111
}
table.table {
  --bs-table-hover-bg: #76c8ff;
}
body {
  min-height: 75rem;
  padding-top: 4.5rem;
}
</style>
