<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import Modeler from 'bpmn-js/lib/Modeler'
  import additionalModules from '@miyue-bpmn/modules'
  import { PaletteEntriesConfig } from '@miyue-bpmn/modules/palette/PaletteProvider'

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

  onMounted(() => {
    const modeler = new Modeler({
      container: container.value!,
      additionalModules,
      paletteEntries
    })

    modeler.createDiagram()
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
