<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  // import Modeler from 'bpmn-js/lib/Modeler'
  import Viewer from '@miyue-bpmn/viewer'
  import { PaletteEntriesConfig } from '@miyue-bpmn/modules/palette/PaletteProvider'
  import emptyXml from './empty-xml'

  const container = ref<HTMLDivElement>()

  const paletteEntries: PaletteEntriesConfig = {
    tools: ['global-connect', 'separator', 'lasso'],
    elements: [
      'none-start-event',
      'user-task',
      'exclusive-gateway',
      'none-end-event',
      'separator',
      'expanded-subprocess',
      'separator',
      'collapsed-pool'
    ]
  }

  onMounted(async () => {
    const modeler = new Viewer({
      container: container.value!,
      paletteEntries
    })

    await modeler.importXML(emptyXml())

    modeler.autoZoom()

    modeler.on<{ element: BpmnElement }>('element.click', ({ element }) => {
      console.log(element)

      modeler.autoElementCenter(element)
    })
  })
</script>

<template>
  <div ref="container" class="container"></div>
</template>

<style>
  html,
  body {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  .container {
    width: 100%;
    height: 100%;
  }
</style>
