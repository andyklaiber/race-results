<script>
import _ from 'lodash';
import request from "@/lib/ApiClient";

export default {
    props:['message'],
    data() {
        return {
            errorMsg: [''],
        }
    },

    methods: {
        login(event) {
            const { email, password } = event;
            //console.log(event);
            return request.post(`/api/auth/login`, { email, password })
                .then((response) => {
                    console.log(response);
                    this.$emit('login');
                    this.$router.push({ name: 'races' })

                })
                .catch((err) => {
                    if (err.response.status === 401) {
                        this.errorMsg = ['Invalid credentials, please try again']
                    }
                    console.error(err);
                });
        }
    }
}
</script>
    
<template>
    <main class="form-signin w-100 m-auto">
        <h3 v-if="message">{{message}}</h3>
        <h1 class="h3 mb-3 fw-normal">Sign in:</h1>
        <FormKit type="form" @submit="login" :errors="errorMsg">
            <FormKit type="email" name="email" label="Email address" validation="" validation-visibility="live" />
            <FormKit type="password" name="password" label="Password" validation="required" />
        </FormKit>
    </main>

</template>
    
<style>
.form-signin {
    max-width: 330px;
    padding: 15px;
}

.form-signin .form-floating:focus-within {
    z-index: 2;
}

.form-signin input[type="email"] {
    margin-bottom: -1px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
}

.form-signin input[type="password"] {
    margin-bottom: 10px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}
</style>
    