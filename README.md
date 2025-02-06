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

---

> bpmn-js 等相关内容，遇到问题可以在 [bpmn-js-questions: bpmn工具库说明及常见问题解答](https://github.com/miyuesc/bpmn-js-questions) 中查询或者提问。由于最近被骂的太狠了，这个项目可能不会经常更新，请关注下述产品。

---

✨✨✨**目前成都的"小学生"大佬和作者一起开发了 Flowable/Activiti 流程引擎组件（包含前端设计器与后端流程引擎）。**

**该组件与Flowable 流程引擎深度融合，结合实际业务场景和使用方式，对属性编辑面板进行了重新设计，优化了用户体验。 增加了符合业务场景的流程校验与进度预览、引入了富文本编辑器与代码编辑器。 结合后端引擎，可直接嵌入系统中使用。**

详情请访问：[产品介绍](https://www.bpmport.com/products)

设计器预览( Flowable )：

- [bpmn designer](https://designer.bpmport.com/designer/)
- [bpmn viewer and mocker](https://designer.bpmport.com/viewer/)
- [dmn designer](https://designer.bpmport.com/dmn/)
- [dmn viewer and mocker](https://designer.bpmport.com/dmnviewer/)

设计器预览( Activiti )：
- [bpmn designer](https://designer.bpmport.com/activiti/)
- [bpmn viewer and mocker](https://designer.bpmport.com/activiti/viewer/#/)

交流群：

![qq](./docs/qq-group.png)

---

## 作者简介

MiyueFE（白小米），也可以叫我小白或者小米，常驻 [稀土掘金](https://juejin.cn/)，也可以通过以下方式联系我：

- 邮箱：[QQ mail](mailto:913784771@qq.com)
- 掘金：[MiyueFE](https://juejin.cn/user/747323639208391)
- 公众号：MiyueFE 的前端圈

bpmn-js 相关文档，参见：

- [bpmn-js 交流群附属资料(文档及开源库)](https://juejin.cn/post/7304831120710434868)
- [bpmn.js 进阶指南](https://juejin.cn/column/6964382482007490590)

## 项目说明

1. `vue 2 + JavaScript + bpmn-js@8+ + element-ui` 在本仓库 `main` 分支，是外面多数项目依赖的原始代码，问题较多。

2. `vue 2 + JavaScript + bpmn-js@9+ + element-ui` 在本仓库 `v2` 分支，修改了少数样式，调整了数据交互逻辑。

3. `vue 3 + TypeScript + bpmn-js@13 + naive-ui` 在 [moon-studio/vite-vue-bpmn-process](https://github.com/moon-studio/vite-vue-bpmn-process) 仓库，是 `v2` 的前身。

4. ~~`vue 3 + TypeScript + bpmn-js@17 + naive-ui` **闭源** 项目 [vue-bpmn-process-designer](https://bpmn.miyuefe.cn) 完善了 TypeScript 类型声明部分，解决了撤销回退操作栈异常的问题，增加了垂直泳道、垂直布局、动态渲染等功能~~


> 当前 `next` 分支作为 pnpm workplace 测试分支，与上述所有内容存在较大差异（暂时不能直接使用），加上工作问题，更新时间不定。
> 
> 另外，上述 1、2、3 三个分支作为很早之前的版本，虽然用户量比较多，但是依然存在很多问题，建议在理解代码之后进行重新开发。
> next 分支提供了基础的 bpmn-js 工具方法，基于官方 camunda 属性面板，并进行了多次测试，基本上可以满足大部分需求。

## 开源许可

[Apache License](https://github.com/miyuesc/bpmn-process-designer/blob/next/LICENSE) © 2023 [miyuesc](https://github.com/miyuesc)

**本项目遵守 Apache License 2.0 开源协议，详情请参阅 [LICENSE](https://github.com/miyuesc/bpmn-process-designer/blob/next/LICENSE) 文件**。

基于此项目进行开发时，请保留作者的版权信息。

## 赞助

[<img src="https://api.gitsponsors.com/api/badge/img?id=318393347" height="60">](https://api.gitsponsors.com/api/badge/link?p=J+hXKkHNzEZhBfJHv8gFbYp0dII7ODITbchEqwXlyxhiZAozzqdyvfIp3tnv9GPj)

## 书籍推荐

#### 《深入Activiti流程引擎：核心原理与高阶实战》

推荐指数：⭐⭐⭐⭐⭐

购买地址：[京东](https://item.jd.com/13928958.html)、[异步社区电子书](https://www.epubit.com/bookDetails?id=UBd189db7e65bd)

#### 《深入Flowable流程引擎：核心原理与高阶实战》

推荐指数：⭐⭐⭐⭐⭐

购买地址：[京东](https://item.jd.com/14804836.html)

这本书得到了 Flowable 创始人 Tijs Rademakers 亲笔作序推荐，对系统学习和深入掌握 Flowable 的用法非常有帮助。

![深入Flowable流程引擎](https://img14.360buyimg.com/n0/jfs/t1/108850/37/53916/154540/66f612a3Fdb62296b/2d4c3001da6dd921.jpg)
