import{n as e}from"./index-BFfsRdpP.js";import t from"./reference-BFU17BbS.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`Shadow`,intro:{cn:`读取 style.shadow 为对象添加内阴影、外阴影。颜色、扩散、偏移等参数属于 Style，Shadow 通道只控制整体启用。`,en:`Apply inner and outer shadows from style.shadow. Color, spread and offsets belong to Style; the Shadow pass controls overall enablement.`},detail:{cn:`相同参数对象按值合批，联合轮廓共用遮罩和模糊。外阴影位于场景对象后、背景前；内阴影限定在本组轮廓内。blur、spread、offsetX/Y 使用屏幕 CSS px，内部按 render.dpr 换算，不随相机 zoom 放大。`,en:`Objects with equal settings share masks and blur based on their combined silhouette. Outer shadows sit behind scene objects and above the background; inner shadows stay inside the group silhouette. blur, spread and offsets use screen CSS pixels, converted using render.dpr, independent of camera zoom.`},code:`import { Shadow, Style } from "bplinejs";

const style = new Style();
style.shadow.enabled = true;
style.shadow.color.setHex("#000000");
style.shadow.opacity = 0.6;
style.shadow.blur = 18;
style.shadow.spread = 2;
style.shadow.offsetX = 12;
style.shadow.offsetY = -12;
style.shadow.inner = false;
style.shadow.outer = true;
const shadow = new Shadow();
// Assign style to the mesh, then: post.add("shadow", shadow);`,properties:[n(`enabled: boolean = true`,`整个 Shadow 通道开关，另需启用对象的 style.shadow.enabled。`,`Pass-wide switch; also enable style.shadow.enabled on the objects.`),n(`style.shadow: ShadowStyle`,`参数与默认值见 ShadowStyle；inner、outer 同时关闭时不生成阴影。`,`See ShadowStyle for parameters and defaults. No shadow is generated when both inner and outer are disabled.`)],methods:[n(`new Shadow()`,`创建从场景 Style 读取设置的预置通道。`,`Create a preset pass that reads settings from scene Styles.`)],links:[{label:`ShadowStyle`,to:`/docs/bpline/style/shadow-style`},{label:`PostProcess`,to:`/docs/bpline/post-process`},{label:`Shadow example`,to:`/example/post-process/shadow`}]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};