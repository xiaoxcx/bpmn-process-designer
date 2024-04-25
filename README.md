<p align="center">
  <a href="https://github.com/miyuesc/bpmn-process-designer">
   <img alt="logo" src="./public/icon-process.png" />
  </a>
</p>

<h1 align="center">Bpmn Process Designer</h1>

<p align="center">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/miyuesc/bpmn-process-designer?style=flat&logo=github" />
<img alt="GitHub forks" src="https://img.shields.io/github/forks/miyuesc/bpmn-process-designer?style=flat&logo=github" />
<img src='https://gitee.com/miyuesc/bpmn-process-designer/badge/star.svg?theme=dark' alt='star' />
<img src='https://gitee.com/miyuesc/bpmn-process-designer/badge/fork.svg?theme=dark' alt='fork' />
</p>

<p align="center">
<img src="https://img.shields.io/badge/Vue-2.x-brightgreen" alt="" />
<img src="https://img.shields.io/badge/ElementUI-%5E2.13-brightgreen" alt="" />
<img src="https://img.shields.io/badge/Bpmn.js-%5E8.8.3-brightgreen" alt="" />
</p>

## 作者简介

MiyueFE（白小米），也可以叫我小白或者小米，常驻 [掘金社区](https://juejin.cn/)，也可以通过一下方式联系我：

- 邮箱：[QQ mail](mailto:913784771@qq.com)
- 掘金：[MiyueFE](https://juejin.cn/user/747323639208391)
- 公众号：MiyueFE 的前端圈

## 项目说明

vue 2 + JavaScript + bpmn-js@8+ + element-ui 在本仓库 `main` 分支，是外面多数项目依赖的原始代码，问题较多。

vue 2 + JavaScript + bpmn-js@9+ + element-ui 在本仓库 `v2` 分支，修改了少数样式，调整了数据交互逻辑。

vue 3 + TypeScript + bpmn-js@13 + naive-ui 在 [moon-studio/vite-vue-bpmn-process](https://github.com/moon-studio/vite-vue-bpmn-process) 仓库，是 `v2` 的前身。

vue 3 + TypeScript + bpmn-js@17 + naive-ui 闭源项目 [vue-bpmn-process-designer](https://bpmn.miyuefe.cn) 完善了 TypeScript 类型声明部分，解决了撤销回退操作栈异常的问题，增加了垂直泳道、垂直布局、动态渲染等功能。


> 当前 `next` 分支作为 pnpm workplace 测试分支，与上述所有内容存在较大差异，加上工作问题，更新时间不定。

## 相关项目

| 🎁 Projects <div style="width:100px">                                                         | ⭐ Description                                                                                                                                                                                   | ☄ Downloads                                                  | ✨ License                                                    |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [diagram-js-grid-bg](https://github.com/miyuesc/diagram-js-grid-bg)                           | A visual grid backgroud for diagram-js, base on diagram-js-grid. <br/> 基于 diagram-js-grid 的 SVG 网格背景，可用于diagram-js的相关项目，例如 bpmn-js、dmn-js 等。                                                    | ![NPM Downloads](https://img.shields.io/npm/dw/diagram-js-grid-bg) | ![NPM License](https://img.shields.io/npm/l/diagram-js-grid-bg) |
| [diagram-js-context-pad](https://github.com/miyuesc/diagram-js-context-pad)                   | An element context menu component for diagram-js/bpmn-js use, base on diagram-js/lib/features/context-pad.<br/> 一个提供给 diagram-js/bpmn-js 使用的元素上下文菜单组件，基于 `diagram-js/lib/features/context-pad`。 | ![NPM Downloads](https://img.shields.io/npm/dw/diagram-js-context-pad) | ![NPM License](https://img.shields.io/npm/l/diagram-js-context-pad) |
| [diagram-js-accordion-palette](https://github.com/miyuesc/diagram-js-accordion-palette)       | A palette that supports folding and unfolding, provided for diagram-js use。Base on diagram-js/palette <br/> 一个支持折叠展开的调色板，提供给 diagram-js 使用。基于 diagram-js 本身的 Palette。                           | ![NPM Downloads](https://img.shields.io/npm/dw/diagram-js-accordion-palette) | ![NPM License](https://img.shields.io/npm/l/diagram-js-accordion-palette) |
| [bpmn-js-i18n-zh](https://github.com/miyuesc/bpmn-js-i18n-zh)                                 | Chinese internationalization resources for bpmn-js. <br/> 关于 bpmn-js-properties-panel 的中文支持。                                                                                                    | ![NPM Downloads](https://img.shields.io/npm/dw/bpmn-js-i18n-zh) | ![NPM License](https://img.shields.io/npm/l/bpmn-js-i18n-zh) |
| [bpmn-js-external-label-modeling](https://github.com/miyuesc/bpmn-js-external-label-modeling) | A bpmn-js plugin used to render Label tags outside of nodes. <br/> 一个用来将Label标签渲染在节点外部的bpmn-js插件。                                                                                               | ![NPM Downloads](https://img.shields.io/npm/dw/bpmn-js-external-label-modeling) | ![NPM License](https://img.shields.io/npm/l/bpmn-js-external-label-modeling) |

## 开源许可

[Apache License](https://github.com/miyuesc/bpmn-process-designer/blob/next/LICENSE) © 2023 [miyuesc](https://github.com/miyuesc)

