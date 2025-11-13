<script>
import { Eye, Code } from 'lucide-vue-next';

export default {
    components: {
        Eye,
        Code
    },
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Enter text...'
        },
        showPreview: {
            type: Boolean,
            default: false
        },
        minHeight: {
            type: String,
            default: '300px'
        },
        label: {
            type: String,
            default: 'Content'
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            content: '',
            showHtmlSource: false,
            showPreviewPanel: false,
            editorKey: 0,
            colors: [
                { name: 'Black', value: '#000000' },
                { name: 'Dark Gray', value: '#666666' },
                { name: 'Red', value: '#e74c3c' },
                { name: 'Orange', value: '#e67e22' },
                { name: 'Yellow', value: '#f39c12' },
                { name: 'Green', value: '#27ae60' },
                { name: 'Blue', value: '#3498db' },
                { name: 'Purple', value: '#9b59b6' },
                { name: 'Pink', value: '#e91e63' },
                { name: 'Teal', value: '#1abc9c' }
            ],
            showColorPicker: false,
            colorPickerType: null // 'text' or 'background'
        }
    },
    mounted() {
        this.content = this.modelValue || '';
        this.editorKey++;
    },
    watch: {
        modelValue(newVal) {
            if (newVal !== this.content) {
                this.content = newVal || '';
                this.editorKey++;
            }
        }
    },
    methods: {
        execCommand(command, value = null) {
            document.execCommand(command, false, value);
            this.$refs.editor?.focus();
        },
        insertLink() {
            const url = prompt('Enter URL:', 'https://');
            if (url) {
                this.execCommand('createLink', url);
                // Set target="_blank" on the created link
                setTimeout(() => {
                    const selection = window.getSelection();
                    if (selection.anchorNode) {
                        let node = selection.anchorNode.parentElement;
                        if (node.tagName === 'A') {
                            node.setAttribute('target', '_blank');
                        }
                    }
                }, 10);
            }
        },
        insertHeading(level) {
            this.execCommand('formatBlock', `h${level}`);
        },
        insertList(type) {
            if (type === 'ul') {
                this.execCommand('insertUnorderedList');
            } else {
                this.execCommand('insertOrderedList');
            }
        },
        applyColor(color, type) {
            if (type === 'text') {
                this.execCommand('foreColor', color);
            } else {
                this.execCommand('backColor', color);
            }
            this.showColorPicker = false;
            this.colorPickerType = null;
        },
        toggleColorPicker(type) {
            if (this.colorPickerType === type && this.showColorPicker) {
                this.showColorPicker = false;
                this.colorPickerType = null;
            } else {
                this.showColorPicker = true;
                this.colorPickerType = type;
            }
        },
        onInput(event) {
            this.content = event.target.innerHTML;
            this.$emit('update:modelValue', this.content);
        },
        updateFromSource() {
            // When editing HTML source, update the contenteditable
            this.$emit('update:modelValue', this.content);
            this.editorKey++;
        },
        toggleHtmlSource() {
            this.showHtmlSource = !this.showHtmlSource;
            if (!this.showHtmlSource) {
                this.editorKey++;
            }
        },
        togglePreview() {
            this.showPreviewPanel = !this.showPreviewPanel;
        }
    }
}
</script>
    
<template>
    <div class="rich-text-editor">
        <div class="editor-header">
            <label v-if="label" class="form-label mb-0">{{ label }}</label>
            <div class="header-buttons">
                <button 
                    v-if="showPreview"
                    type="button"
                    class="btn btn-sm"
                    :class="showPreviewPanel ? 'btn-primary' : 'btn-outline-primary'"
                    @click="togglePreview"
                >
                    <Eye :size="16" class="me-1" />
                    {{ showPreviewPanel ? 'Hide' : 'Show' }} Preview
                </button>
                <button 
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :class="{ 'ms-2': showPreview }"
                    @click="toggleHtmlSource"
                >
                    <Code :size="16" class="me-1" />
                    {{ showHtmlSource ? 'Visual Editor' : 'HTML Source' }}
                </button>
            </div>
        </div>
        
        <div v-if="!showHtmlSource" class="editor-section">
            <div class="toolbar">
                <div class="toolbar-group">
                    <button type="button" @click="execCommand('bold')" class="toolbar-btn" title="Bold">
                        <strong>B</strong>
                    </button>
                    <button type="button" @click="execCommand('italic')" class="toolbar-btn" title="Italic">
                        <em>I</em>
                    </button>
                    <button type="button" @click="execCommand('underline')" class="toolbar-btn" title="Underline">
                        <u>U</u>
                    </button>
                    <button type="button" @click="execCommand('strikeThrough')" class="toolbar-btn" title="Strikethrough">
                        <s>S</s>
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button type="button" @click="insertHeading(1)" class="toolbar-btn" title="Heading 1">
                        H1
                    </button>
                    <button type="button" @click="insertHeading(2)" class="toolbar-btn" title="Heading 2">
                        H2
                    </button>
                    <button type="button" @click="insertHeading(3)" class="toolbar-btn" title="Heading 3">
                        H3
                    </button>
                    <button type="button" @click="execCommand('formatBlock', 'p')" class="toolbar-btn" title="Paragraph">
                        P
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <div class="color-picker-wrapper">
                        <button 
                            type="button" 
                            @click="toggleColorPicker('text')" 
                            class="toolbar-btn"
                            :class="{ 'active': showColorPicker && colorPickerType === 'text' }"
                            title="Text Color"
                        >
                            <span style="position: relative;">
                                A
                                <span style="position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: currentColor;"></span>
                            </span>
                        </button>
                        <div v-if="showColorPicker && colorPickerType === 'text'" class="color-picker-panel">
                            <div class="color-grid">
                                <button
                                    v-for="color in colors"
                                    :key="color.value"
                                    type="button"
                                    class="color-swatch"
                                    :style="{ backgroundColor: color.value }"
                                    :title="color.name"
                                    @click="applyColor(color.value, 'text')"
                                ></button>
                            </div>
                        </div>
                    </div>
                    <div class="color-picker-wrapper">
                        <button 
                            type="button" 
                            @click="toggleColorPicker('background')" 
                            class="toolbar-btn"
                            :class="{ 'active': showColorPicker && colorPickerType === 'background' }"
                            title="Background Color"
                        >
                            <span style="position: relative; padding: 2px 4px; background: #ffeb3b; color: #000;">
                                A
                            </span>
                        </button>
                        <div v-if="showColorPicker && colorPickerType === 'background'" class="color-picker-panel">
                            <div class="color-grid">
                                <button
                                    v-for="color in colors"
                                    :key="color.value"
                                    type="button"
                                    class="color-swatch"
                                    :style="{ backgroundColor: color.value }"
                                    :title="color.name"
                                    @click="applyColor(color.value, 'background')"
                                ></button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="toolbar-group">
                    <button type="button" @click="insertList('ul')" class="toolbar-btn" title="Bullet List">
                        • List
                    </button>
                    <button type="button" @click="insertList('ol')" class="toolbar-btn" title="Numbered List">
                        1. List
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button type="button" @click="execCommand('justifyLeft')" class="toolbar-btn" title="Align Left">
                        ⬅
                    </button>
                    <button type="button" @click="execCommand('justifyCenter')" class="toolbar-btn" title="Align Center">
                        ↔
                    </button>
                    <button type="button" @click="execCommand('justifyRight')" class="toolbar-btn" title="Align Right">
                        ➡
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button type="button" @click="insertLink()" class="toolbar-btn" title="Insert Link">
                        🔗 Link
                    </button>
                </div>
                
                <div class="toolbar-group">
                    <button type="button" @click="execCommand('removeFormat')" class="toolbar-btn" title="Clear Formatting">
                        Clear
                    </button>
                </div>
            </div>
            
            <div 
                :key="editorKey"
                ref="editor"
                class="rich-editor"
                :style="{ minHeight: minHeight }"
                contenteditable="true"
                @input="onInput"
                v-html="content"
                :data-placeholder="placeholder"
            ></div>
        </div>
        
        <div v-else class="html-source-section">
            <textarea 
                v-model="content" 
                class="form-control font-monospace"
                rows="15"
                :style="{ minHeight: minHeight }"
                @input="updateFromSource"
            ></textarea>
            <small class="text-muted">
                Edit the raw HTML. Switch back to Visual Editor to see the formatted result.
            </small>
        </div>
        
        <div v-if="showPreviewPanel && showPreview" class="preview-section mt-3">
            <div class="preview-header">
                <Eye :size="18" class="me-2" />
                <strong>Preview</strong>
            </div>
            <div class="preview-content" v-html="content"></div>
        </div>
    </div>
</template>

<style scoped>
.rich-text-editor {
    width: 100%;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.header-buttons {
    display: flex;
    align-items: center;
}

.editor-section {
    position: relative;
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    position: relative;
}

.toolbar-group {
    display: flex;
    gap: 4px;
    padding-right: 8px;
    border-right: 1px solid #dee2e6;
    position: relative;
}

.toolbar-group:last-child {
    border-right: none;
}

.toolbar-btn {
    padding: 4px 8px;
    border: 1px solid #dee2e6;
    background-color: white;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
    position: relative;
}

.toolbar-btn:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
}

.toolbar-btn:active,
.toolbar-btn.active {
    background-color: #dee2e6;
}

.color-picker-wrapper {
    position: relative;
}

.color-picker-panel {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
}

.color-swatch {
    width: 28px;
    height: 28px;
    border: 2px solid #dee2e6;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s;
}

.color-swatch:hover {
    border-color: #0d6efd;
    transform: scale(1.1);
}

.rich-editor {
    padding: 12px;
    border: 1px solid #dee2e6;
    border-radius: 0 0 4px 4px;
    background-color: white;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    overflow-y: auto;
}

.rich-editor:focus {
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.rich-editor:empty:before {
    content: attr(data-placeholder);
    color: #6c757d;
    font-style: italic;
}

.rich-editor h1 {
    font-size: 2rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

.rich-editor h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

.rich-editor h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
}

.rich-editor p {
    margin-bottom: 0.75rem;
}

.rich-editor ul, .rich-editor ol {
    margin-bottom: 0.75rem;
    padding-left: 2rem;
}

.rich-editor a {
    color: #0d6efd;
    text-decoration: underline;
}

.html-source-section {
    position: relative;
}

.html-source-section textarea {
    font-size: 0.875rem;
    border-radius: 4px;
}

.preview-section {
    border: 2px solid #0d6efd;
    border-radius: 6px;
    padding: 16px;
    background-color: #f8f9fa;
}

.preview-header {
    display: flex;
    align-items: center;
    font-size: 1rem;
    color: #0d6efd;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #0d6efd;
}

.preview-content {
    background-color: white;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #dee2e6;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
    .toolbar {
        gap: 4px;
    }
    
    .toolbar-group {
        padding-right: 4px;
    }
    
    .toolbar-btn {
        padding: 3px 6px;
        font-size: 0.75rem;
    }
    
    .header-buttons {
        flex-direction: column;
        gap: 4px;
    }
    
    .header-buttons .btn {
        width: 100%;
    }
    
    .color-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
</style>

