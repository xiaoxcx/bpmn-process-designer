<script lang="ts" setup>
  import { onMounted, ref, shallowRef } from 'vue'
  // import Modeler from 'bpmn-js/lib/Modeler'
  import Designer from '@miyue-bpmn/designer'
  // import Viewer from '@miyue-bpmn/viewer'
  import type { PaletteEntriesConfig } from '@miyue-bpmn/modules/palette/PaletteProvider'
  import PaletteProvider from '@miyue-bpmn/modules/palette'
  import emptyXml from './empty-xml'
  import ElementRegistry from 'diagram-js/lib/core/ElementRegistry'
  import Selection from 'diagram-js/lib/features/Selection/Selection'
  import { is } from 'bpmn-js/lib/util/ModelUtil'

  const container = ref<HTMLDivElement>()
  const designer = shallowRef<Designer>()
  const elements = shallowRef<BpmnElement[]>()

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

  function updateElements() {
    const registry = designer.value!.get<ElementRegistry>('elementRegistry')
    elements.value = registry.filter((el) => is(el, 'bpmn:FlowElement'))
  }

  async function initModeler() {
    designer.value = new Designer({
      container: container.value!,
      additionalModules: [PaletteProvider],
      paletteEntries
    })

    await designer.value.importXML(emptyXml())

    designer.value.autoZoomAndCenter()

    designer.value.on(
      ['shape.removed', 'shape.added', 'connection.removed', 'connection.added'],
      updateElements
    )

    updateElements()
  }

  function handleSelectElement(item) {
    const selection = designer.value!.get<Selection>('selection')
    selection.select([item])
    designer.value!.autoElementCenter(item)
  }

  function handleAddClass() {
    const [el1, el2, ...els] = elements.value!
    designer.value!.addClass([el1, el2], 'new-class')
  }
  function handleAddStyles(appendToReal: boolean) {
    const [el1, el2, ...els] = [...elements.value!].reverse()
    designer.value!.addStyle(
      [el1, el2],
      {
        'stroke-dasharray': '2, 6, 0, 6',
        'stroke-width': '4px'
      },
      appendToReal
    )
  }

  onMounted(initModeler)
</script>

<template>
  <div class="w-full h-full grid grid-cols-[60vw_1fr_1fr]">
    <div ref="container" class="w-full h-full"></div>
    <div class="flex flex-col gap-row-2 p-2 border-l-blue border-l-solid border-l-[1px]">
      <h3>元素列表 (点击选中和居中）</h3>
      <div
        v-for="item in elements"
        :key="item.id"
        class="cursor-pointer hover:c-blue"
        @click="handleSelectElement(item)"
      >
        <span>{{ item.id }}</span>
        <span>:</span>
        <span>{{ item.businessObject.name }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-row-2 p-2 border-l-blue border-l-solid border-l-[1px]">
      <h3>功能示例</h3>
      <button @click="handleAddClass">添加 class (元素前两个)</button>
      <button @click="handleAddStyles(false)">添加 style (元素最后两个)</button>
      <button @click="handleAddStyles(true)">添加 style (元素最后两个)</button>
    </div>
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

  .djs-element.new-class .djs-visual * {
    stroke: #535bf2 !important;
  }
</style>
