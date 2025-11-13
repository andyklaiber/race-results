<script>
/**
 * EXAMPLE: How to use RichTextEditor for Email Templates
 * 
 * This is a sample component showing how to reuse the RichTextEditor
 * for different use cases like email templates.
 */

import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import RichTextEditor from './RichTextEditor.vue';

export default {
    components: {
        ModalComponent,
        RichTextEditor
    },
    props: [
        "emailTemplate",
        "show"
    ],
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            templateData: {
                subject: '',
                body: '',
                type: 'confirmation' // or 'reminder', 'cancellation', etc.
            }
        }
    },
    mounted() {
        this.loadTemplate();
    },
    watch: {
        emailTemplate: {
            handler() {
                this.loadTemplate();
            },
            immediate: true
        }
    },
    methods: {
        loadTemplate() {
            if (!this.emailTemplate) {
                this.templateData = {
                    subject: '',
                    body: '',
                    type: 'confirmation'
                };
                return;
            }
            
            this.templateData = {
                subject: this.emailTemplate.subject || '',
                body: this.emailTemplate.body || '',
                type: this.emailTemplate.type || 'confirmation'
            };
        },
        async submitHandler() {
            console.log("Saving email template:", this.templateData);
            
            // Example API call
            await request.patch(
                `/api/races/${this.$route.params.raceid}/email-templates`,
                { emailTemplate: this.templateData }
            ).then((response) => {
                if (response.data) {
                    this.$emit('save', this.templateData);
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
            <h5 class="mb-0">Edit Email Template</h5>
        </template>
        <template #body>
            <div class="edit-email-form">
                <div class="alert alert-info py-2 mb-3">
                    <small>
                        <strong>Tip:</strong> This email will be sent to users automatically. 
                        You can use rich formatting, colors, and links.
                    </small>
                </div>
                
                <FormKit 
                    type="select" 
                    v-model="templateData.type" 
                    label="Email Type" 
                    :options="{
                        confirmation: 'Registration Confirmation',
                        reminder: 'Race Reminder',
                        cancellation: 'Cancellation Notice',
                        update: 'Race Update'
                    }"
                />
                
                <FormKit 
                    type="text" 
                    v-model="templateData.subject" 
                    label="Email Subject" 
                    help="Subject line for the email"
                    validation="required"
                />
                
                <!-- Here's where we use the reusable RichTextEditor! -->
                <RichTextEditor
                    v-model="templateData.body"
                    label="Email Body"
                    placeholder="Enter your email message here..."
                    :show-preview="true"
                    min-height="350px"
                />
                
                <div class="template-variables mt-3 p-3 bg-light border rounded">
                    <h6 class="mb-2">Available Template Variables:</h6>
                    <small class="text-muted">
                        You can use these placeholders in your email (future feature):<br>
                        <code>{{'{{'}}firstName{{'}}'}}</code>, 
                        <code>{{'{{'}}lastName{{'}}'}}</code>, 
                        <code>{{'{{'}}raceName{{'}}'}}</code>, 
                        <code>{{'{{'}}raceDate{{'}}'}}</code>, 
                        <code>{{'{{'}}bibNumber{{'}}'}}</code>
                    </small>
                </div>
            </div>
            
            <div class="modal-footer-buttons mt-4">
                <button class="btn btn-sm btn-primary px-5 mx-3" @click="submitHandler">Save Template</button>
                <button class="btn btn-sm btn-secondary px-3 mx-3" @click="$emit('close')">Cancel</button>
            </div>
        </template>
        <template #footer>
            <div></div>
        </template>
    </modal-component>
</template>

<style scoped>
.edit-email-form {
    padding: 0 5px;
    overflow: auto;
    max-height: calc(100vh - 200px);
}

.template-variables {
    font-size: 0.875rem;
}

.template-variables code {
    background-color: #e9ecef;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.85em;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}
</style>

