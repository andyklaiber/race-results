<script>
    export default {
      props: {
        show: Boolean
      }
    }
    </script>
    
    <template>
      <Transition name="modal">
        <div v-if="show" class="modal-mask">
          <div class="modal-wrapper">
            <div class="modal-container" @keydown.esc="$emit('close')" tabIndex="0">
              <div class="modal-body">
                <slot name="body">default body</slot>
              </div>
    
              <div class="modal-footer">
                <slot name="footer">
                  <button class="btn btn-sm btn-danger modal-default-button"
                    @click="$emit('close')"
                  >Cancel</button>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </template>
    
    <style>
    .modal-mask {
      position: fixed;
      z-index: 9998;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: table;
      transition: opacity 0.3s ease;
    }
    
    .modal-wrapper {
      display: table-cell;
      vertical-align: middle;
    }
    
    .modal-container {
      width: 800px;
      margin: 0px auto;
      padding: 10px 20px;
      background-color: #fff;
      border-radius: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
      transition: all 0.3s ease;
    }
    
    .modal-header h3 {
      margin-top: 0;
      color: #42b983;
    }
    
    .modal-body {
      margin: 0px 0;
      max-height: calc(100vh - 110px);
      overflow-y: auto;
    }
    
    .modal-default-button {
      float: right;
    }
    
    /*
     * The following styles are auto-applied to elements with
     * transition="modal" when their visibility is toggled
     * by Vue.js.
     *
     * You can easily play with the modal transition by editing
     * these styles.
     */
    
    .modal-enter-from {
      opacity: 0;
    }
    
    .modal-leave-to {
      opacity: 0;
    }
    
    .modal-enter-from .modal-container,
    .modal-leave-to .modal-container {
      -webkit-transform: scale(1.1);
      transform: scale(1.1);
    }
    </style>