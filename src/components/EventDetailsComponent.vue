<script>
import { RouterLink } from "vue-router";
import FbShareComponent from './FbShareComponent.vue';
import dayjs from '@/lib/dayjs';

export default {
  components: { FbShareComponent },
  props: ["details", "raceid", "compactMode", "series", "seriesData", "seriesRaceCount"],
  data() {
    return {
    };
  },
  computed: {
    seriesDisplayText() {
      if (!this.seriesData) {
        return "Part of a Series";
      }
      const name = this.seriesData.displayName || this.seriesData.name || "Series";
      const year = this.seriesData.year ? ` ${this.seriesData.year}` : "";
      return `${name}${year}`;
    },
    isRosterPage() {
      return this.$route.path.includes('/roster/')
    },
    isRegPage() {
      return this.$route.name === 'register'
    },
    regDisabled() {
      return dayjs().isBefore(this.details.regOpenDate)
    },
    regEnded() {
      return dayjs().isAfter(this.details.regCloseDate)
    },
    regTimeToOpen() {
      return dayjs().to(this.details.regOpenDate)
    },
    regTimeToClose() {
      return dayjs().to(this.details.regCloseDate)
    },
    imgWidth() {
      if (this.compactMode) {
        return 150;
      }
      return 225
    }
  },
};
</script>

<template>
  <div class="container mb-4">
    <img v-if="isRegPage" class="img-fluid" :src="details.headerPhoto" alt="">
    <div class="row p-1 px-3 pb-0 pe-lg-0 pt-lg-3 align-items-center rounded-3 border shadow">
      <div v-if="details.logoUrl" class="col-md-3 px-3">
        <div class="d-flex justify-content-center">
        <a :href="details.homepageUrl">
          <img class="pb-1" :src="details.logoUrl" alt="" :width="imgWidth">
        </a>
      </div>
      </div>
      <div class="col-md-7 p-3 p-lg-3 pt-lg-3">
        <div class="row">
          <div class="col col-md-auto">
            <h3 class="display-7 fw-bold lh-3">{{ details.name }}</h3>
            <p v-if="!compactMode" class="lead mb-0 fw-bold">{{ details.tagline }}</p>
          </div>
        </div>
        <p class="display-9">{{ details.formattedDates }}</p>
        <div v-if="series && seriesRaceCount > 1" class="mb-2">
          <RouterLink :to="{ name: 'racesBySeries', params: { seriesid: series } }" class="badge bg-primary text-decoration-none">
            <i class="bi bi-collection"></i> {{ seriesDisplayText }}
          </RouterLink>
        </div>
        <div v-if="details.homepageUrl && !compactMode" class="d-grid gap-2 d-md-flex justify-content-md mb-4 mb-lg-3">
          <div class="col-md-auto">
            <a class="btn btn-sm btn-success" :href="details.homepageUrl">Event Homepage</a>
          </div>
          <div class="col col-lg-2">
            <div v-if="details.facebookShare">
              <FbShareComponent :url="details.homepageUrl" />
            </div>
          </div>
        </div>

        <div v-if="regDisabled" class="fw-bold">
          Registration will open {{ regTimeToOpen }}
        </div>
        <div v-else class="row">
          <div v-if="details?.regCloseDate" class="fw-bold">
            <div v-if="regEnded" class="fw-bold">
              Registration is closed
            </div>
            <div v-else class="fw-bold">
              Registration will close {{ regTimeToClose }}
            </div>
          </div>
          <div class="col col-md-auto" v-if="!isRegPage && !regEnded">
            <RouterLink class="btn btn-success" :to="{ name: 'register', params: { raceid } }">Register</RouterLink>
          </div>
          <div class="col" v-if="!isRosterPage">
            <RouterLink class="btn btn-secondary" :to="{ name: 'roster', params: { raceid } }">See who is signed up
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>