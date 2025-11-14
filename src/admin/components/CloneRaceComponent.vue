<script>

import dayjs from '@/lib/dayjs';

export default {
    components: {
    },
    props: [
        "raceData",
    ],
    emits: ['save','close'],
    data() {
        return {
            formError: [],
            formInputData: {},
        }
    },
    mounted() {
        
    },
    computed: {
        eventDate() {
            return dayjs(this.raceData.eventDate).format('YYYY-MM-DDTHH:mm');
        },
        regOpenDate() {
            return dayjs(this.raceData.regOpenDate).format('YYYY-MM-DDTHH:mm');
        },
        timeToOpen() {
            return dayjs().to(this.formInputData.eventDetails?.regOpenDate)
        },
        timeToClose() {
            return dayjs().to(this.formInputData.eventDetails?.regCloseDate)
        },
    },
    methods: {
        submitHandler() {
            this.formInputData.raceid = this.formatNameToId(this.formInputData.displayName);
            this.$emit('save', this.formInputData);
        },
        formatNameToId(name){   
            return name.replace(/\s+/g, '_').toLowerCase().replace('+', '_plus_').replace('-', '_minus_').replace(/\W/g, '');
        },
        
    }
}
</script>
    
<template>
        <div class="edit-categories-form">

           
                        <FormKit type="form" v-model="formInputData" id="race-clone-form" label="Race Information" validation="required"  :actions="false">
                            <FormKit :value="raceData?.displayName" type="text" name="displayName" label="Event Name" />
                            <FormKit :value="raceData?.contactEmail" type="text" name="contactEmail" label="Contact Email" />
                            <FormKit :value="eventDate" type="datetime-local" name="eventDate" label="Date" />
                            <FormKit type="group" name="eventDetails">
                            <FormKit :value="raceData?.eventDetails?.name" type="text" name="name" label="Header Event Name" />
                            <FormKit :value="raceData?.eventDetails?.formattedDates" type="text" name="formattedDates" label="Header Formatted dates" />
                            <FormKit :value="raceData?.eventDetails?.tagline" type="text" name="tagline"
                            label="Header tagline text" />
                            <FormKit :value="raceData?.eventDetails?.regOpenDate" type="datetime-local" name="regOpenDate" label="Registration Open Date" />
                            <p>Registration Opens {{timeToOpen}}</p>
                            <FormKit :value="raceData?.eventDetails?.regCloseDate" type="datetime-local" name="regCloseDate" label="Registration Close Date" />
                            <p>Registration Closes {{timeToClose}}</p>
                            <FormKit :value="raceData?.eventDetails?.logoUrl" type="text" name="logoUrl" label="Logo URL" />
                            <FormKit :value="raceData?.eventDetails?.headerPhoto" type="text" name="headerPhoto" label="Header Photo URL" />
                            <FormKit :value="raceData?.eventDetails?.homepageUrl" type="text" name="homepageUrl"
                                label="Home Page URL" />
                            <FormKit type="group" name="facebookShare">
                                <FormKit :value="raceData?.eventDetails?.facebookShare?.url" type="text" name="url"
                                label="FB Share URL" />
                            </FormKit>
                            </FormKit>
                        </FormKit>

    

        </div>
        <div class="modal-footer-buttons mt-3">
                <button class="btn btn-sm btn-primary px-5 mx-3"
                  @click="submitHandler">Save</button> 
                <button class="btn btn-sm btn-danger px-3 mx-3"
                  @click="$emit('close')">Cancel</button> 
        </div>
    </template>
<style>
.edit-categories-form{
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 160px);
}
.double {
  display: flex;
  justify-content: space-between;
}
.double > .formkit-outer {
  width: calc(50% - 0.5em);
}
.formkit-inner > .formkit-input {
        padding: 8px;
    }
.cat-group{
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0 5px;
    margin-bottom: 2px;
}
.modal-footer-buttons{
    display: flex;
    justify-content: flex-end;
}
.cat-name{
    cursor: move;
}

</style>