<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import Modeler from 'bpmn-js/lib/Modeler'
  // import Viewer from '@miyue-bpmn/viewer'
  import type { PaletteEntriesConfig } from '@miyue-bpmn/modules/palette/PaletteProvider'
  import PaletteProvider from '@miyue-bpmn/modules/palette'
  import emptyXml from './empty-xml'

  const container = ref<HTMLDivElement>()

  const paletteEntries: PaletteEntriesConfig = {
    tools: ['global-connect', 'lasso', 'hand'],
    elements: [
      'none-start-event',
      'separator',
      'user-task',
      'service-task',
      'script-task',
      'separator',
      'exclusive-gateway',
      'complex-gateway',
      'parallel-gateway',
      'none-end-event',
      'separator',
      'expanded-subprocess',
      'collapsed-subprocess',
      'separator',
      'collapsed-pool',
      'expanded-pool'
    ]
  }

  onMounted(async () => {
    const modeler = new Modeler({
      container: container.value!,
      additionalModules: [PaletteProvider],
      paletteEntries
    })

    await modeler.importXML(emptyXml())

    // modeler.autoZoom()

    // modeler.on<{ element: BpmnElement }>('element.click', ({ element }) => {
    //   console.log(element)
    //
    //   modeler.autoElementCenter(element)
    // })
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
