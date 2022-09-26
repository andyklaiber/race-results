<script>
import _ from 'lodash';
import request from "@/lib/ApiClient";
import LoginComponent from '@/admin/components/LoginComponent.vue';
import Manage from './Manage.vue';

export default {
  components: {
    LoginComponent,
    Manage,
  },
  data() {
    return {
      showLogin: false,
    }
  },
  created() {
        this.checkAuth();
  },
  methods: {
    hideLogin(){
      this.showLogin = false;
    },
    checkAuth() {
      console.log(this.$route.path);
      if (this.$route.path == '/login/') {
        this.showLogin = true;
      }
      else {
       return request.post(`/api/auth/login`, {})
          .then((response) => {
            console.log(response);
            this.showLogin = false;
            if (this.$route.path) {
              return;
            } else {
              this.$router.push({ name: 'races' })
            }
          })
          .catch((err) => {
            if (err.response.status === 401) {
              return this.showLogin = true;
            }
            console.error(err);
          });
      }
    }
  }
}
</script>

<template>
  <div v-if="showLogin">
    <div class="container">

      <LoginComponent @login="hideLogin"></LoginComponent>
    </div>
  </div>
  <div v-else>
    <Manage></Manage>

  </div>

</template>

<style>
@import "@/assets/base.css";
</style>
