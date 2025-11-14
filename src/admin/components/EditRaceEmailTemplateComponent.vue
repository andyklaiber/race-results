<script>
import request from "@/lib/ApiClient";
import ModalComponent from './ModalComponent.vue';
import RichTextEditor from './RichTextEditor.vue';

export default {
    components: {
        ModalComponent,
        RichTextEditor
    },
    props: {
        emailTemplate: {
            type: [Object, String],
            default: null
        },
        show: {
            type: Boolean,
            default: false
        },
        raceData: {
            type: Object,
            required: true
        }
    },
    emits: ['save', 'close'],
    data() {
        return {
            formError: [],
            templateData: {
                subject: '',
                body: ''
            },
            showPreview: false,
            previewHtml: '',
            previewSubject: '',
            isEditing: false
        }
    },
    computed: {
        defaultTemplate() {
            return {
                subject: '{{eventName}} Registration',
                body: `<html><head></head><body>
<h1>Thank you for registering for {{eventName}}</h1>
<p>
Name: {{name}}<br>
Team/Sponsor: {{sponsor}}<br>
Race Category: {{category}}<br>
<p><a href="{{rosterLink}}">Go Here</a> to see who else is signed up<p>
<p>For information about the event, check out <a href="{{eventHomePageUrl}}">{{eventHomePageUrl}}</a></p>
<p>For issues with your registration information, <a href="mailto:{{eventContactEmail}}">email us!</a></p>
</body></html>`
            };
        },
        availableVariables() {
            return [
                { 
                    name: '{{name}}', 
                    description: 'Registrant full name',
                    example: 'John Doe'
                },
                { 
                    name: '{{sponsor}}', 
                    description: 'Team/Sponsor name',
                    example: 'Sample Racing Team'
                },
                { 
                    name: '{{eventName}}', 
                    description: 'Event name',
                    example: this.raceData?.eventDetails?.name || 'Sample Race Event'
                },
                { 
                    name: '{{category}}', 
                    description: 'Race category',
                    example: this.raceData?.regCategories?.[0]?.catdispname || 'Men\'s Cat 1'
                },
                { 
                    name: '{{rosterLink}}', 
                    description: 'Link to race roster',
                    example: `${window.location.origin}/#/roster/${this.raceData?.raceid || 'raceid'}`
                },
                { 
                    name: '{{eventHomePageUrl}}', 
                    description: 'Event homepage URL',
                    example: this.raceData?.eventDetails?.homepageUrl || 'https://example.com'
                },
                { 
                    name: '{{eventContactEmail}}', 
                    description: 'Event contact email',
                    example: this.raceData?.contactEmail || 'support@signup.bike'
                }
            ];
        },
        sampleData() {
            return {
                name: 'John Doe',
                sponsor: 'Sample Racing Team',
                eventName: this.raceData?.eventDetails?.name || 'Sample Race Event',
                category: this.raceData?.regCategories?.[0]?.catdispname || 'Men\'s Cat 1',
                rosterLink: `${window.location.origin}/#/roster/${this.raceData?.raceid || 'raceid'}`,
                eventHomePageUrl: this.raceData?.eventDetails?.homepageUrl || 'https://example.com',
                eventContactEmail: this.raceData?.contactEmail || 'support@signup.bike'
            };
        }
    },
    mounted() {
        this.loadTemplate();
    },
    watch: {
        emailTemplate: {
            handler(newVal, oldVal) {
                // Only reload if the prop actually changed from outside
                // Don't reload if we're just editing locally
                if (newVal !== oldVal && !this.isEditing) {
                    this.loadTemplate();
                }
            },
            deep: true
        },
        show(newVal) {
            // Reset editing flag when modal opens
            if (newVal) {
                this.isEditing = false;
                this.loadTemplate();
            }
        },
        'templateData.subject'() {
            this.isEditing = true;
        },
        'templateData.body'() {
            this.isEditing = true;
        }
    },
    methods: {
        normalizeTemplate(template) {
            // Handle backwards compatibility
            if (!template) {
                return { ...this.defaultTemplate };
            }
            
            // If it's already an object
            if (typeof template === 'object') {
                // Start with existing properties to preserve any unknown fields
                return {
                    ...template,
                    // Ensure subject and body are present
                    subject: template.subject || this.defaultTemplate.subject,
                    body: template.body || this.defaultTemplate.body
                };
            }
            
            // If it's a string (old format), convert to new format
            if (typeof template === 'string') {
                return {
                    subject: this.defaultTemplate.subject,
                    body: template
                };
            }
            
            return { ...this.defaultTemplate };
        },
        loadTemplate() {
            this.templateData = this.normalizeTemplate(this.emailTemplate);
        },
        resetToDefault() {
            if (confirm('Are you sure you want to reset to the default template? This will discard your current changes.')) {
                this.templateData = { ...this.defaultTemplate };
            }
        },
        copyVariable(variable) {
            // Copy to clipboard
            navigator.clipboard.writeText(variable).then(() => {
                // Could show a toast notification here
                console.log('Copied:', variable);
            });
        },
        renderPreview() {
            // Simple template replacement for preview (client-side)
            let previewSubject = this.templateData.subject;
            let previewBody = this.templateData.body;
            
            Object.keys(this.sampleData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                previewSubject = previewSubject.replace(regex, this.sampleData[key]);
                previewBody = previewBody.replace(regex, this.sampleData[key]);
            });
            
            this.previewSubject = previewSubject;
            this.previewHtml = previewBody;
            this.showPreview = true;
        },
        async submitHandler() {
            console.log("Saving email template:", this.templateData);
            
            try {
                await request.patch(
                    `/api/races/${this.$route.params.raceid}`,
                    { emailTemplate: this.templateData }
                );
                
                this.$emit('save', this.templateData);
            } catch (error) {
                this.formError = ["Error saving email template"];
                console.error(error);
            }
        }
    }
}
</script>
    
<template>
    <modal-component :show="show" @close="$emit('close')" size="xl">
        <template #header>
            <h5 class="mb-0">Edit Registration Confirmation Email</h5>
        </template>
        <template #body>
            <div class="edit-email-form">
                <div class="alert alert-info py-2 mb-3">
                    <small>
                        <strong>Tip:</strong> This email is automatically sent when someone registers for your event. 
                        Use the template variables below to personalize the message with race and registrant information.
                    </small>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-8">
                        <!-- Subject Line -->
                        <div class="mb-3">
                            <label class="form-label">Email Subject Line</label>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="templateData.subject"
                                placeholder="Enter email subject..."
                            />
                            <small class="text-muted">You can use template variables in the subject line too!</small>
                        </div>
                        
                        <!-- Email Body -->
                        <RichTextEditor
                            v-model="templateData.body"
                            label="Email Body"
                            placeholder="Enter your email message here..."
                            :show-preview="false"
                            min-height="400px"
                        />
                        
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" @click="renderPreview">
                                Preview with Sample Data
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" @click="resetToDefault">
                                Reset to Default Template
                            </button>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <!-- Available Variables -->
                        <div class="template-variables p-3 bg-light border rounded">
                            <h6 class="mb-3">Available Variables</h6>
                            <small class="text-muted mb-2 d-block">
                                Click to copy, then paste into your template:
                            </small>
                            
                            <div class="variable-list">
                                <div 
                                    v-for="variable in availableVariables" 
                                    :key="variable.name"
                                    class="variable-item mb-2 p-2 bg-white border rounded"
                                    @click="copyVariable(variable.name)"
                                    role="button"
                                    tabindex="0"
                                >
                                    <code class="variable-code">{{ variable.name }}</code>
                                    <div class="variable-description text-muted small mt-1">
                                        {{ variable.description }}
                                    </div>
                                    <div class="variable-example text-success small">
                                        Example: {{ variable.example }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Preview Modal -->
                <div v-if="showPreview" class="preview-section mt-4 p-3 border rounded bg-light">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Preview with Sample Data</h6>
                        <button class="btn btn-sm btn-outline-secondary" @click="showPreview = false">
                            Close Preview
                        </button>
                    </div>
                    
                    <div class="preview-content bg-white p-3 border rounded">
                        <div class="mb-3 pb-2 border-bottom">
                            <strong>Subject:</strong> {{ previewSubject }}
                        </div>
                        <div v-html="previewHtml"></div>
                    </div>
                    
                    <small class="text-muted mt-2 d-block">
                        This preview uses sample data. Actual emails will use real registrant information.
                    </small>
                </div>
            </div>
            
            <div v-if="formError.length > 0" class="alert alert-danger mt-3">
                <div v-for="(error, idx) in formError" :key="idx">{{ error }}</div>
            </div>
            
            <div class="modal-footer-buttons mt-4">
                <button class="btn btn-primary px-5 mx-2" @click="submitHandler">
                    Save Email Template
                </button>
                <button class="btn btn-secondary px-3 mx-2" @click="$emit('close')">
                    Cancel
                </button>
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
    position: sticky;
    top: 0;
}

.variable-list {
    max-height: 400px;
    overflow-y: auto;
}

.variable-item {
    cursor: pointer;
    transition: all 0.2s;
}

.variable-item:hover {
    background-color: #f0f8ff !important;
    border-color: #0d6efd !important;
    transform: translateX(2px);
}

.variable-code {
    background-color: #e9ecef;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    color: #d63384;
    font-weight: 600;
}

.variable-description {
    margin-top: 4px;
}

.variable-example {
    margin-top: 2px;
    font-style: italic;
}

.default-preview {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.preview-section {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.preview-content {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
}

.modal-footer-buttons {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #dee2e6;
    padding-top: 12px;
}

/* Scrollbar styling for variable list */
.variable-list::-webkit-scrollbar {
    width: 6px;
}

.variable-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.variable-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.variable-list::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>

