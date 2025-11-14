<script>
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';

export default {
    components: {
        ModalComponent
    },
    props: [
        "eventDetails",
        "show"
    ],
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            eventDetailsData: {
                name: '',
                formattedDates: '',
                tagline: '',
                logoUrl: '',
                headerPhoto: '',
                homepageUrl: '',
                regOpenDate: '',
                regCloseDate: '',
                facebookShare: {
                    url: ''
                }
            }
        }
    },
    mounted() {
        this.loadEventDetails();
    },
    watch: {
        eventDetails: {
            handler() {
                this.loadEventDetails();
            },
            immediate: true
        }
    },
    methods: {
        loadEventDetails() {
            console.log("Loading event details:", this.eventDetails);
            
            if (!this.eventDetails) {
                this.eventDetailsData = {
                    name: '',
                    formattedDates: '',
                    tagline: '',
                    logoUrl: '',
                    headerPhoto: '',
                    homepageUrl: '',
                    regOpenDate: '',
                    regCloseDate: '',
                    facebookShare: {
                        url: ''
                    }
                };
                return;
            }
            
            // Start with all existing properties to preserve any unknown fields
            this.eventDetailsData = {
                ...this.eventDetails,
                // Then override with known fields (ensuring proper defaults)
                name: this.eventDetails.name || '',
                formattedDates: this.eventDetails.formattedDates || '',
                tagline: this.eventDetails.tagline || '',
                logoUrl: this.eventDetails.logoUrl || '',
                headerPhoto: this.eventDetails.headerPhoto || '',
                homepageUrl: this.eventDetails.homepageUrl || '',
                regOpenDate: this.eventDetails.regOpenDate || '',
                regCloseDate: this.eventDetails.regCloseDate || '',
                facebookShare: {
                    ...(this.eventDetails.facebookShare || {}),
                    url: this.eventDetails.facebookShare?.url || ''
                }
            };
            
            console.log("Loaded eventDetailsData:", this.eventDetailsData);
        },
        async submitHandler() {
            console.log("Saving event details:", this.eventDetailsData);
            
            await request.patch(
                `/api/races/${this.$route.params.raceid}`,
                { eventDetails: this.eventDetailsData }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', this.eventDetailsData);
                    console.log(response.data);
                }
            })
            .catch((error) => {
                this.formError = ["Error submitting request"];
                console.log(error);
            });
        }
    }
}
</script>
    
<template>
    <modal-component :show="show" @close="$emit('close')">
        <template #header>
            <h5 class="mb-0">Edit Registration Form Header</h5>
        </template>
        <template #body>
            <div class="edit-event-details-form">
                <div class="alert alert-info py-2 mb-3">
                    <small>
                        <strong>Tip:</strong> These details appear in the header of your registration form. 
                        Make sure to use clear, engaging text and high-quality images.
                    </small>
                </div>
                
                <h6 class="mb-3">Event Information</h6>
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.name" 
                    label="Header Event Name" 
                    help="The main event name displayed in the registration header"
                />
                
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.formattedDates" 
                    label="Formatted Dates" 
                    help="e.g., 'Sept 28th, Oct 5th, 12th, 19th, and 26th'"
                />
                
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.tagline" 
                    label="Tagline" 
                    help="A catchy tagline or subtitle for your event"
                />
                
                <h6 class="mt-4 mb-3">Visual Assets</h6>
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.logoUrl" 
                    label="Logo URL" 
                    help="URL to your event logo image"
                />
                
                <div v-if="eventDetailsData.logoUrl" class="mb-3">
                    <div class="image-preview">
                        <img :src="eventDetailsData.logoUrl" alt="Logo Preview" style="max-width: 150px; max-height: 150px;">
                    </div>
                </div>
                
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.headerPhoto" 
                    label="Header Photo URL" 
                    help="URL to a banner/header photo displayed at the top"
                />
                
                <div v-if="eventDetailsData.headerPhoto" class="mb-3">
                    <div class="image-preview">
                        <img :src="eventDetailsData.headerPhoto" alt="Header Photo Preview" style="max-width: 100%; max-height: 200px;">
                    </div>
                </div>
                
                <h6 class="mt-4 mb-3">Links</h6>
                <FormKit 
                    type="text" 
                    v-model="eventDetailsData.homepageUrl" 
                    label="Event Homepage URL" 
                    help="Link to your event's main website"
                />
            </div>
            
            <div class="modal-footer-buttons mt-4">
                <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save Header Details</button>
                <button class="btn btn-sm btn-secondary px-3 mx-3" @click="$emit('close')">Cancel</button>
            </div>
        </template>
        <template #footer>
            <div></div>
        </template>
    </modal-component>
</template>

<style scoped>
.edit-event-details-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 200px);
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}

.image-preview {
    padding: 10px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    text-align: center;
}

.image-preview img {
    border-radius: 4px;
    object-fit: contain;
}
</style>

