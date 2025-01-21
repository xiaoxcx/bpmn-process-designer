<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import Modeler from 'bpmn-js/lib/Modeler'
  import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel'
  import emptyXml from './empty-xml'

  import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'

  const container = ref<HTMLDivElement>()
  const panel = ref<HTMLDivElement>()

  onMounted(async () => {
    const designer = new Modeler({
      container: container.value!,
      propertiesPanel: {
        parent: panel.value!
      },
      additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule]
    })

    await designer.importXML(emptyXml())
  })
</script>

<template>
  <div class="designer-wrapper">
    <div ref="container" class="container"></div>
    <div ref="panel" class="panel"></div>
  </div>
</template>

<style>
  html,
  body {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  .designer-wrapper {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 3fr 1fr;
  }
  .container {
    width: 100%;
    height: 100%;
  }
</style>
