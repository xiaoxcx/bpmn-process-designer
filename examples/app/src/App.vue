<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import Modeler from 'bpmn-js/lib/Modeler'
  import additionalModules from '@miyue-bpmn/modules'

  const container = ref<HTMLDivElement>()

  onMounted(() => {
    const modeler = new Modeler({
      container: container.value!,
      additionalModules
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
