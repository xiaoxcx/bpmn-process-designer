import { createApp } from 'vue'
import App from './App.vue'

import 'virtual:uno.css'

import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css' // 节点基础图标
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css' // 节点完整图标
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css' // 节点完整图标

const app = createApp(App)
app.mount('#app')
