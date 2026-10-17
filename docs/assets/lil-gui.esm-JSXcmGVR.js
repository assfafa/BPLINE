const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./__vite-browser-external-2W3EstLn.js","./rolldown-runtime-hePW80VL.js"])))=>i.map(i=>d[i]);
import{r as e}from"./rolldown-runtime-hePW80VL.js";import{c as t,i as n,n as r,o as i,r as a,t as o}from"./index-BNzTzP-6.js";import{t as s}from"./CodeBlock-Dfruq_mX.js";import{t as c}from"./Vec2-CPTFB0d0.js";import{t as l}from"./Mat3-CfrbxqK5.js";var u=r(),d=({title:e,shortCode:t,fullCode:r,Preview:i})=>{let{language:o}=n();return(0,u.jsxs)(`article`,{"aria-label":e,className:`grid min-h-full grid-cols-1 grid-rows-[repeat(4,18rem)] lg:h-full lg:min-h-0 lg:grid-cols-2 lg:grid-rows-2`,children:[(0,u.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-r`,children:[(0,u.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:a.translate(o,`example.fullCode`)}),(0,u.jsx)(s,{code:r})]}),(0,u.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border`,children:[(0,u.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:a.translate(o,`example.advancedPreview`)}),(0,u.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,u.jsx)(i,{advanced:!0})})]}),(0,u.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r`,children:[(0,u.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:a.translate(o,`example.simpleCode`)}),(0,u.jsx)(s,{code:t})]}),(0,u.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden`,children:[(0,u.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:a.translate(o,`example.simplePreview`)}),(0,u.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,u.jsx)(i,{advanced:!1})})]})]})},f=e(t(),1),p=({advanced:e,controlsId:t,mountScene:r})=>{let{language:i}=n(),{theme:s}=o(),c=(0,f.useRef)(s);(0,f.useEffect)(()=>{c.current=s},[s]);let l=(0,f.useRef)(null),d=(0,f.useRef)(null),[p,m]=(0,f.useState)(null),[h,g]=(0,f.useState)(!1),_=null,v=`absolute inset-0`,y=a.translate(i,`example.showControls`),b=`hidden`;return h&&(y=a.translate(i,`example.hideControls`),b=`block`),(0,f.useEffect)(()=>{let t=l.current,n;return t&&(n=r({getTheme:()=>c.current,container:t,guiContainer:d.current,advanced:e,onError:e=>{e instanceof Error?m(e.message):m(String(e))}})),n},[e,r]),e&&(v=`absolute inset-0 lg:right-[230px]`),e&&(_=(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`button`,{type:`button`,"aria-controls":t,"aria-expanded":h,onClick:()=>{g(!h)},className:`absolute right-2 top-2 z-20 rounded-md border border-border bg-background px-3 py-1.5 text-xs shadow lg:hidden`,children:y}),(0,u.jsx)(`div`,{id:t,ref:d,className:`${b} absolute right-2 top-12 z-10 max-h-[calc(100%-3.5rem)] w-[220px] max-w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-background/95 p-2 shadow-xl lg:top-2 lg:block lg:max-h-[calc(100%-1rem)]`})]})),(0,u.jsxs)(`div`,{className:`relative h-full min-h-0 overflow-hidden bg-muted/40`,children:[(0,u.jsx)(`div`,{ref:l,className:v}),_,p&&(0,u.jsxs)(`div`,{role:`alert`,className:`absolute inset-x-4 bottom-4 rounded-md border border-destructive/30 bg-background/90 p-3 text-sm text-destructive`,children:[a.translate(i,`example.gpuError`),p]})]})},m=0,h=()=>{let e=m;return m+=1,e},g=class{id=h();type=`ObjectNode`;_version=0;_parent=null;_position;_rotation=0;_scale=new c(1,1);_matrix=new l;_worldMatrix=new l;_order=0;_localSnapshot=-1;_worldSnapshot=-1;_parentSnapshot=null;_parentVersion=-1;_writingMatrices=!1;_nodeDisposed=!1;constructor(e,t){this._position=new c(e,t),this._position.add(this,`position`),this._scale.add(this,`scale`),this._matrix.add(this,`matrix`),this._worldMatrix.add(this,`worldMatrix`)}get version(){return this._version}updateVersion(){this._version++}get parent(){return this._parent}set parent(e){if(this._parent!==e)this._parent=e,this.updateVersion();else return}get position(){return this._position}set position(e){if(this._position!==e)this._position.delete(this,`position`),this._position=e,e.add(this,`position`),this.updateVersion();else return}get rotation(){return this._rotation}set rotation(e){if(this._rotation!==e)this._rotation=e,this.updateVersion();else return}get scale(){return this._scale}set scale(e){if(this._scale!==e)this._scale.delete(this,`scale`),this._scale=e,e.add(this,`scale`),this.updateVersion();else return}get matrix(){return this._matrix}set matrix(e){if(this._matrix!==e)this._matrix.delete(this,`matrix`),this._matrix=e,e.add(this,`matrix`),this.onMathChange(e,`matrix`);else return}get worldMatrix(){return this._worldMatrix}set worldMatrix(e){if(this._worldMatrix!==e)this._worldMatrix.delete(this,`worldMatrix`),this._worldMatrix=e,e.add(this,`worldMatrix`),this.onMathChange(e,`worldMatrix`);else return}onMathChange(e,t){if(!this._nodeDisposed&&!this._writingMatrices)t===`position`&&e===this._position||t===`scale`&&e===this._scale?this.updateVersion():(t===`matrix`&&e===this._matrix||t===`worldMatrix`&&e===this._worldMatrix)&&(this.updateVersion(),this._localSnapshot=this.version,t===`worldMatrix`&&(this._worldSnapshot=this.version,this._parentSnapshot=this.parent?.worldMatrix??null,this._parentVersion=this._parentSnapshot?.version??-1));else return}ensureMatrix(){if(this._nodeDisposed)throw Error(`Disposed node cannot be updated.`);return this._localSnapshot!==this.version&&this.updateMatrix(),this._matrix}updateMatrix(){let e=Math.cos(this.rotation),t=Math.sin(this.rotation);this._writingMatrices=!0;try{this._matrix.set([e*this.scale.x,t*this.scale.x,0,-t*this.scale.y,e*this.scale.y,0,this.position.x,this.position.y,1]),this._localSnapshot=this.version,this._worldSnapshot=-1}finally{this._writingMatrices=!1}return this._matrix}ensureWorldMatrix(){this.parent?.ensureWorldMatrix(),this.ensureMatrix();let e=this.parent?.worldMatrix??null,t=e?.version??-1;if(this._worldSnapshot!==this.version||this._parentSnapshot!==e||this._parentVersion!==t){this._writingMatrices=!0;try{e===null?this._worldMatrix.copy(this._matrix):this._worldMatrix.mul(e,this._matrix),this._worldSnapshot=this.version,this._parentSnapshot=e,this._parentVersion=t}finally{this._writingMatrices=!1}}return this._worldMatrix}updateWorldMatrix(){return this._worldSnapshot=-1,this.ensureWorldMatrix()}get order(){return this._order}set order(e){if(this._order!==e){this._order=e;let t=this.parent;for(;t!==null;){if(t.type===`Scene`){t.updateVersion();break}t=t.parent}}else return}dispose(){this._position.delete(this,`position`),this._scale.delete(this,`scale`),this._matrix.delete(this,`matrix`),this._worldMatrix.delete(this,`worldMatrix`),this._nodeDisposed=!0}},_=()=>typeof window>`u`?1:window.devicePixelRatio||1,v=()=>{if(typeof window>`u`)return Object.freeze({width:0,height:0,dpr:1});{let e=_();return Object.freeze({width:Math.round(window.innerWidth*e),height:Math.round(window.innerHeight*e),dpr:e})}},y=1e-7,b=e=>{let t=0;for(let n=0;n<e.length;n+=1){let r=e[n],i=e[(n+1)%e.length];t+=r.x*i.y-r.y*i.x}return t},x=(e,t)=>{for(let n=0;n<e.length;n+=1){let r=e[n],i=e[(n+1)%e.length],a=i.y-r.y,o=r.x-i.x;if(a!==0||o!==0){let n=1/0,r=-1/0,i=1/0,s=-1/0;for(let t of e){let e=t.x*a+t.y*o;n=Math.min(n,e),r=Math.max(r,e)}for(let e of t){let t=e.x*a+e.y*o;i=Math.min(i,t),s=Math.max(s,t)}let c=y*(Math.abs(a)+Math.abs(o));if(r<i-c||s<n-c)return!0}}return!1},S=(e,t)=>{let n=e[0],r=e[1],i=e[2],a=(r.x-n.x)*(t.y-n.y)-(r.y-n.y)*(t.x-n.x),o=(i.x-r.x)*(t.y-r.y)-(i.y-r.y)*(t.x-r.x),s=(n.x-i.x)*(t.y-i.y)-(n.y-i.y)*(t.x-i.x);return!((a<-1e-7||o<-1e-7||s<-1e-7)&&(a>y||o>y||s>y))},ee=(e,t,n)=>{let r=n.x-t.x,i=n.y-t.y,a=r*r+i*i,o=0;a>0&&(o=((e.x-t.x)*r+(e.y-t.y)*i)/a,o=Math.max(0,Math.min(1,o)));let s=t.x+o*r,c=t.y+o*i,l=e.x-s,u=e.y-c;return l*l+u*u},te=(e,t,n)=>(t.x-e.x)*(n.y-e.y)-(t.y-e.y)*(n.x-e.x),ne=(e,t,n,r)=>{let i=n/(n-r);return{x:e.x+(t.x-e.x)*i,y:e.y+(t.y-e.y)*i}},re=(e,t)=>{let n=[...e],r=Math.sign(b(t));for(let e=0;e<3;e+=1){let i=t[e],a=t[(e+1)%3],o=n;if(n=[],o.length>0)for(let e=0;e<o.length;e+=1){let t=o[e],s=o[(e+1)%o.length],c=te(i,a,t)*r,l=te(i,a,s)*r,u=c>=-1e-7,d=l>=-1e-7;u!==d&&n.push(ne(t,s,c,l)),d&&n.push(s)}}return Math.abs(b(n))*.5},C=e=>{if(Number.isInteger(e)&&e>=1&&e<=4095)return e;throw RangeError(`precision must be an integer in [1, 4095].`)},ie=(e,t,n)=>Math.min(Math.max(e,t),n),ae=class extends g{type=`Camera`;_width;_height;_zoom;_zoomVersion=0;_orthogonalMatrix=new l;_viewMatrix=new l;_projectionSnapshot=-1;_viewWorldMatrix;_viewWorldVersion=-1;_writingCamera=!1;buffers={};constructor(e=100,t=100,n=1){super(0,0),this._width=e,this._height=t,this._zoom=n,this._orthogonalMatrix.add(this,`orthogonalMatrix`),this._viewMatrix.add(this,`viewMatrix`),this.updateCameraMatrix()}get width(){return this._width}set width(e){if(this._width!==e)this._width=e,this.updateVersion();else return}get height(){return this._height}set height(e){if(this._height!==e)this._height=e,this.updateVersion();else return}get zoomVersion(){return this._zoomVersion}get zoom(){return this._zoom}set zoom(e){if(this._zoom!==e)this._zoom=e,this._zoomVersion++,this.updateVersion();else return}get top(){return this.height*.5/this.zoom}get bottom(){return-this.height*.5/this.zoom}get left(){return-this.width*.5/this.zoom}get right(){return this.width*.5/this.zoom}get orthogonalMatrix(){return this._orthogonalMatrix}set orthogonalMatrix(e){if(this._orthogonalMatrix!==e)this._orthogonalMatrix.delete(this,`orthogonalMatrix`),this._orthogonalMatrix=e,e.add(this,`orthogonalMatrix`),this.onMathChange(e,`orthogonalMatrix`);else return}get viewMatrix(){return this._viewMatrix}set viewMatrix(e){if(this._viewMatrix!==e)this._viewMatrix.delete(this,`viewMatrix`),this._viewMatrix=e,e.add(this,`viewMatrix`),this.onMathChange(e,`viewMatrix`);else return}onMathChange(e,t){if(!this._nodeDisposed){if(t===`orthogonalMatrix`&&e===this._orthogonalMatrix||t===`viewMatrix`&&e===this._viewMatrix){if(!this._writingCamera)this.updateVersion(),t===`orthogonalMatrix`?this._projectionSnapshot=this.version:(this._viewWorldMatrix=this.worldMatrix,this._viewWorldVersion=this.worldMatrix.version);else return}else super.onMathChange(e,t)}}setViewport(e=100,t=100){if(this._width!==e||this._height!==t)this._width=e,this._height=t,this.updateVersion();else return}add(){throw Error(`Camera does not support add().`)}ensureCameraMatrix(){this.ensureWorldMatrix(),this._projectionSnapshot!==this.version&&this.updateOrthogonalMatrix(),(this._viewWorldMatrix!==this.worldMatrix||this._viewWorldVersion!==this.worldMatrix.version)&&this.updateViewMatrix()}updateOrthogonalMatrix(){this._writingCamera=!0;try{this._orthogonalMatrix.set([2*this.zoom/this.width,0,0,0,2*this.zoom/this.height,0,0,0,1]),this._projectionSnapshot=this.version}finally{this._writingCamera=!1}return this._orthogonalMatrix}updateViewMatrix(){this.ensureWorldMatrix(),this._writingCamera=!0;try{this._viewMatrix.copy(this.worldMatrix).invert(),this._viewWorldMatrix=this.worldMatrix,this._viewWorldVersion=this.worldMatrix.version}finally{this._writingCamera=!1}return this._viewMatrix}updateCameraMatrix(){this.updateOrthogonalMatrix(),this.updateViewMatrix()}dispose(){this._orthogonalMatrix.delete(this,`orthogonalMatrix`),this._viewMatrix.delete(this,`viewMatrix`),super.dispose()}worldToNdc(e){return this.ensureCameraMatrix(),e.clone().apply(this._viewMatrix).apply(this._orthogonalMatrix)}ndcToScreen(e,t){let n=v().dpr,r=t?.canvas.getBoundingClientRect(),i=r?.width??this.width/n,a=r?.height??this.height/n;return new c((e.x+1)*.5*i,(1-e.y)*.5*a)}worldToScreen(e,t){let n=this.worldToNdc(e);return this.ndcToScreen(n,t)}screenToNdc(e,t){let n=v().dpr,r=t?.canvas.getBoundingClientRect(),i=r?.width??this.width/n,a=r?.height??this.height/n;if(i<=0||a<=0)throw RangeError(`Cannot convert coordinates on a zero-size canvas.`);let o=e.x/i*2-1,s=1-e.y/a*2;return new c(o,s)}ndcToWorld(e){return this.ensureCameraMatrix(),e.clone().apply(this._orthogonalMatrix.clone().invert()).apply(this._viewMatrix.clone().invert())}screenToWorld(e,t){let n=this.screenToNdc(e,t);return this.ndcToWorld(n)}worldToWindow(e,t){let n=this.worldToScreen(e,t),r=t.canvas.getBoundingClientRect();return n.x+=r.left,n.y+=r.top,n}windowToWorld(e,t){let n=e.clone(),r=t.canvas.getBoundingClientRect();return n.x-=r.left,n.y-=r.top,this.screenToWorld(n,t)}},oe=class e{_data=[1,1,1,1];_subscribers=new Map;constructor(e=`#ffffff`){this.setHex(e)}get r(){return this._data[0]}set r(e){let t=[...this._data];t[0]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get g(){return this._data[1]}set g(e){let t=[...this._data];t[1]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get b(){return this._data[2]}set b(e){let t=[...this._data];t[2]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get a(){return this._data[3]}set a(e){let t=[...this._data];t[3]=e,this.setRGBA(t[0],t[1],t[2],t[3])}setRGB(e,t,n){return this.setRGBA(e,t,n,this.a)}setRGBA(e,t,n,r=1){let i=[e,t,n,r];if(!i.every(Number.isFinite))throw RangeError(`Color components must be finite.`);let a=i.map(e=>Math.min(1,Math.max(0,e)));if(a.every((e,t)=>e===this._data[t])===!1){this._data.splice(0,4,...a);for(let[e,t]of[...this._subscribers])for(let n of[...t])e.onColorChange(this,n)}return this}setHex(e){if(typeof e==`number`&&(!Number.isInteger(e)||e<0||e>16777215))throw RangeError(`Numeric hex colors must be between 0x000000 and 0xffffff.`);let t;if(t=typeof e==`number`?e.toString(16).padStart(6,`0`):e.replace(/^#/,``),!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t))throw TypeError(`Invalid hex color.`);return t.length<=4&&(t=t.replace(/./g,e=>e+e)),t.length===6&&(t+=`ff`),this.setRGBA(...[0,2,4,6].map(e=>parseInt(t.slice(e,e+2),16)/255))}toHex(e=!1){let t=3;return e&&(t=4),`#`+this._data.slice(0,t).map(e=>Math.round(e*255).toString(16).padStart(2,`0`)).join(``)}writeTo(e,t=0){return e.set(this._data,t),e}copy(e){return this.setRGBA(e.r,e.g,e.b,e.a)}clone(){return new e().copy(this)}add(e,t=`color`){let n=this._subscribers.get(e)??new Set;n.add(t),this._subscribers.set(e,n)}delete(e,t){if(t===void 0){this._subscribers.delete(e);return}{let n=this._subscribers.get(e);n?.delete(t),n?.size===0&&this._subscribers.delete(e)}}},se=class e{area;_subscribers=new Set;_enabled=!1;_color=new oe;_opacity=1;constructor(e){this.area=e,this._color.add(this,`color`)}get enabled(){return this._enabled}set enabled(e){if(this._enabled!==e)this._enabled=e,this.notify(`enabled`);else return}get color(){return this._color}set color(e){if(this._color!==e)this._color.delete(this,`color`),this._color=e,e.add(this,`color`),this.notify(`color`);else return}get opacity(){return this._opacity}set opacity(e){if(e=w(e),e=Math.min(1,e),this._opacity!==e)this._opacity=e,this.notify(`opacity`);else return}copy(e){return this.enabled=e.enabled,this.color.copy(e.color),this.opacity=e.opacity,this}clone(){return new e(this.area).copy(this)}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._color.delete(this,`color`),this._subscribers.clear()}onColorChange(e,t){if(t!==`color`||e===this._color)this.notify(t);else return}notify(e){for(let t of[...this._subscribers])t.onPartChange(this.area,e)}},w=e=>{if(!Number.isFinite(e))throw RangeError(`Style values must be finite.`);return Math.max(0,e)},T=class e extends se{_texture;_addressModeU=`repeat`;_addressModeV=`repeat`;get texture(){return this._texture}set texture(e){if(this._texture!==e)this._texture?.delete(this),this._texture=e,e?.add(this),this.notify(`texture`);else return}copy(e){return super.copy(e),this.texture=e.texture,this.addressModeU=e.addressModeU,this.addressModeV=e.addressModeV,this}clone(){return new e(this.area).copy(this)}onTextureChange(e){e===this._texture&&this.notify(`textureData`)}dispose(){this._texture?.delete(this),super.dispose()}get addressModeU(){return this._addressModeU}set addressModeU(e){if(![`repeat`,`mirror-repeat`,`clamp-to-edge`].includes(e))throw TypeError(`Invalid address mode.`);if(this._addressModeU!==e)this._addressModeU=e,this.notify(`addressModeU`);else return}get addressModeV(){return this._addressModeV}set addressModeV(e){if(![`repeat`,`mirror-repeat`,`clamp-to-edge`].includes(e))throw TypeError(`Invalid address mode.`);if(this._addressModeV!==e)this._addressModeV=e,this.notify(`addressModeV`);else return}},ce=class e extends T{_addressModeV=`clamp-to-edge`;_width=1;_borderAlign=`normal`;_pixelAligned=`px`;_uvRepeat=1;constructor(){super(`edge`)}copy(e){return super.copy(e),this.width=e.width,this.borderAlign=e.borderAlign,this.pixelAligned=e.pixelAligned,this.uvRepeat=e.uvRepeat,this}clone(){return new e().copy(this)}get width(){return this._width}set width(e){if(e=w(e),this._width!==e)this._width=e,this.notify(`width`);else return}get borderAlign(){return this._borderAlign}set borderAlign(e){if(![`inset`,`normal`,`outset`].includes(e))throw TypeError(`Invalid border alignment.`);if(this._borderAlign!==e)this._borderAlign=e,this.notify(`borderAlign`);else return}get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}get uvRepeat(){return this._uvRepeat}set uvRepeat(e){if(e=w(e),this._uvRepeat!==e)this._uvRepeat=e,this.notify(`uvRepeat`);else return}},E=class e{_type=`miter`;_seg=8;_subscribers=new Set;copy(e){return this.type=e.type,this.seg=e.seg,this}clone(){return new e().copy(this)}get type(){return this._type}set type(e){if(![`miter`,`round`,`bevel`].includes(e))throw TypeError(`Invalid join type.`);if(this._type!==e)this._type=e,this.notify(`type`);else return}get seg(){return this._seg}set seg(e){if(!Number.isInteger(e)||e<1||e>4096)throw RangeError(`Join seg must be an integer in [1, 4096].`);if(this._seg!==e)this._seg=e,this.notify(`seg`);else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._subscribers.clear()}notify(e){for(let t of[...this._subscribers])t.onPartChange(`join`,e)}},le=class e extends T{_addressModeU=`clamp-to-edge`;_addressModeV=`clamp-to-edge`;_pixelAligned=`px`;_vertices=!0;_midpoints=!1;_radius=2;_segments=4;_minPointsLength=6;_minEdgePointsLength=4;constructor(){super(`points`)}copy(e){return super.copy(e),this.pixelAligned=e.pixelAligned,this.vertices=e.vertices,this.midpoints=e.midpoints,this.radius=e.radius,this.segments=e.segments,this.minPointsLength=e.minPointsLength,this.minEdgePointsLength=e.minEdgePointsLength,this}clone(){return new e().copy(this)}get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}get vertices(){return this._vertices}set vertices(e){if(this._vertices!==e)this._vertices=e,this.notify(`vertices`);else return}get midpoints(){return this._midpoints}set midpoints(e){if(this._midpoints!==e)this._midpoints=e,this.notify(`midpoints`);else return}get radius(){return this._radius}set radius(e){if(e=w(e),this._radius!==e)this._radius=e,this.notify(`radius`);else return}get segments(){return this._segments}set segments(e){if(!Number.isSafeInteger(e)||e<3)throw RangeError(`Point segments must be an integer >= 3.`);if(this._segments!==e)this._segments=e,this.notify(`segments`);else return}get minPointsLength(){return this._minPointsLength}set minPointsLength(e){if(e=w(e),this._minPointsLength!==e)this._minPointsLength=e,this.notify(`minPointsLength`);else return}get minEdgePointsLength(){return this._minEdgePointsLength}set minEdgePointsLength(e){if(e=w(e),this._minEdgePointsLength!==e)this._minEdgePointsLength=e,this.notify(`minEdgePointsLength`);else return}},ue=class e extends T{_borderColor=new oe(`#000000`);_borderWidth=0;_borderAlign=`normal`;_pixelAligned=`px`;constructor(){super(`solid`),this._borderColor.add(this,`borderColor`)}copy(e){return super.copy(e),this.borderColor.copy(e.borderColor),this.borderWidth=e.borderWidth,this.borderAlign=e.borderAlign,this.pixelAligned=e.pixelAligned,this}clone(){return new e().copy(this)}get borderColor(){return this._borderColor}set borderColor(e){if(this._borderColor!==e)this._borderColor.delete(this,`borderColor`),this._borderColor=e,e.add(this,`borderColor`),this.notify(`borderColor`);else return}dispose(){this._borderColor.delete(this,`borderColor`),super.dispose()}onColorChange(e,t){if(t!==`borderColor`||e===this._borderColor)super.onColorChange(e,t);else return}get borderWidth(){return this._borderWidth}set borderWidth(e){if(e=w(e),this._borderWidth!==e)this._borderWidth=e,this.notify(`borderWidth`);else return}get borderAlign(){return this._borderAlign}set borderAlign(e){if(![`inset`,`normal`,`outset`].includes(e))throw TypeError(`Invalid border alignment.`);if(this._borderAlign!==e)this._borderAlign=e,this.notify(`borderAlign`);else return}get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}},de=class e extends se{constructor(){super(`wireframe`)}copy(e){return super.copy(e),this}clone(){return new e().copy(this)}},fe=(e,t,n=0,r=!1)=>{if(!Number.isSafeInteger(n)||n<0||n+44>t.length)throw RangeError(`Style data offset exceeds the target capacity.`);t.fill(0,n+40,n+44);let{solid:i,wireframe:a,edge:o,points:s}=e;i.color.writeTo(t,n),i.borderColor.writeTo(t,n+4),o.color.writeTo(t,n+8),s.color.writeTo(t,n+12),a.color.writeTo(t,n+16),t.set([i.opacity,i.borderWidth,pe(i.borderAlign),Number(i.pixelAligned===`zoom`)],n+20),t.set([o.opacity,o.width,pe(o.borderAlign),Number(o.pixelAligned===`zoom`)],n+24),t.set([s.opacity,Number(s.pixelAligned===`zoom`),Number(r),0],n+28),t.set([a.opacity,0,0,0],n+32),t.set([Number(i.enabled),Number(a.enabled),Number(o.enabled),Number(s.enabled)],n+36)},pe=e=>e===`inset`?0:e===`normal`?.5:1,D=class e{type=`Style`;_solid=new ue;_wireframe=new de;_edge=new ce;_points=new le;_join=new E;_subscribers=new Set;_version=0;_key=`wireframe:0`;constructor(){this._solid.add(this),this._wireframe.add(this),this._edge.add(this),this._points.add(this),this._join.add(this)}copy(e){return this._solid.copy(e.solid),this._wireframe.copy(e.wireframe),this._edge.copy(e.edge),this._points.copy(e.points),this._join.copy(e.join),this}clone(){return new e().copy(this)}static copy(t){return new e().copy(t)}get solid(){return this._solid}get wireframe(){return this._wireframe}get edge(){return this._edge}get points(){return this._points}get join(){return this._join}get version(){return this._version}get key(){return this._key}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._solid.dispose(),this._wireframe.dispose(),this._edge.dispose(),this._points.dispose(),this._join.dispose(),this._subscribers.clear()}onPartChange(e,t){this._version++,e===`wireframe`&&t===`enabled`&&(this._key=this._wireframe.enabled?`wireframe:1`:`wireframe:0`);let n=Object.freeze({source:this,area:e,field:t});for(let e of[...this._subscribers])e.onStyleChange(n)}},O=class e{id=h();type=`Geo`;_version=0;_generatedVersion=-1;_precision=8;_originPrecision=8;_style;_disposed=!1;_subscribers=new Set;_geometry;normal;uv;index;linePoints;vertexType;position;miterScale;uniformData=new Float32Array(4);constructor(e=new D){this._style=e,e.add(this)}get precision(){return this._precision}set precision(e){let t=C(e),n=this._originPrecision!==t;this._originPrecision=t,this._precision===t?n&&this.updateVersion():this.setRenderPrecision(t)}get originPrecision(){return this._originPrecision}setRenderPrecision(e){let t=C(e);this._precision!==t&&(this._precision=t,this.updateVersion())}copyPrecision(e){this.precision=e.originPrecision,this.setRenderPrecision(e.precision)}copy(e){this.copyPrecision(e),this.style=e.style.clone(),this._geometry=e.geometry?.slice(),this.normal=e.normal?.slice(),this.uv=e.uv?.slice(),this.index=e.index?.slice();let t=e.linePoints;return this.linePoints=t===void 0?void 0:{geometry:t.geometry.slice(),normal:t.normal.slice(),uv:t.uv.slice(),index:t.index.slice(),position:t.position?.slice(),vertexType:t.vertexType?.slice(),miterScale:t.miterScale?.slice()},this.vertexType=e.vertexType?.slice(),this.position=e.position?.slice(),this.miterScale=e.miterScale?.slice(),this.uniformData.set(e.uniformData),this.updateVersion(),this}clone(){return new e().copy(this)}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed geometry cannot be reused.`);if(this._style!==e)this._style.delete(this),this._style=e,e.add(this),this.updateVersion();else return}onStyleChange(e){if(!this._disposed&&e.source===this._style)this.type===`Poly2D`&&e.area===`join`&&e.field===`seg`&&(this.precision=Math.min(4095,this.style.join.seg)),(e.field===`enabled`||e.area===`join`&&this.type===`Poly2D`&&e.field!==`seg`||e.area===`edge`&&[`width`,`borderAlign`,`uvRepeat`].includes(e.field)||e.area===`points`&&[`vertices`,`midpoints`,`radius`,`segments`,`minPointsLength`,`minEdgePointsLength`].includes(e.field))&&this.updateVersion();else return}dispose(){this._style.delete(this),this._subscribers.clear(),this._disposed=!0}add(e){if(this._disposed)throw Error(`Disposed geometry cannot be reused.`);this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}get geometry(){return this._geometry}set geometry(e){if(this._geometry!==e){let t=this._generatedVersion,n=this._version;this._geometry=e,this.updateVersion(),t===n&&(this._generatedVersion=this._version)}else return}mergeGeometry(e){let t=e.reduce((e,t)=>e+t.data.geometry.length/2,0),n=e.reduce((e,t)=>e+t.data.index.length,0);if(n===0){this._geometry=void 0,this.normal=void 0,this.uv=void 0,this.index=void 0,this.vertexType=void 0,this.position=void 0,this.miterScale=void 0;return}{this._geometry=new Float32Array(t*2),this.normal=new Float32Array(t*2),this.uv=new Float32Array(t*2),this.position=new Float32Array(t*2),this.vertexType=new Float32Array(t),this.miterScale=new Float32Array(t).fill(1),this.index=t>65536?new Uint32Array(n):new Uint16Array(n);let r=0,i=0;for(let t of e){let e=t.data,n=e.geometry.length/2;this._geometry.set(e.geometry,r*2),this.normal.set(e.normal,r*2),this.uv.set(e.uv,r*2),this.vertexType.fill(t.vertexType,r,r+n),e.position!==void 0&&this.position.set(e.position,r*2),e.miterScale!==void 0&&this.miterScale.set(e.miterScale,r);for(let t of e.index)this.index[i]=t+r,i+=1;r+=n}}}get version(){return this._version}updateVersion(){this._version++;for(let e of[...this._subscribers])e.onGeometryChange(this)}ensureGeometry(){if(this._disposed)throw Error(`Disposed geometry cannot be rendered.`);return this._generatedVersion!==this._version&&this.updateGeometry(),this}updateGeometry(){return this.updateVersion(),this._generatedVersion=this._version,this}},me=e=>{let t=e.vertices,n=e.index,r=(n?.length??t.length/2)/3,i=new Map,a=new Map,o=e=>{let n=t[e*2],r=t[e*2+1],i=String(n)+`,`+String(r),o=a.get(i);return o===void 0&&(o={key:i,x:n,y:r},a.set(i,o)),o};for(let t=0;t<r;t++){let r=n?.[t*3]??t*3,a=n?.[t*3+1]??t*3+1,s=n?.[t*3+2]??t*3+2;if(e.vertexType===void 0||e.vertexType[r]===0&&e.vertexType[a]===0&&e.vertexType[s]===0){let e=[o(r),o(a),o(s)];for(let t=0;t<3;t++)he(i,e[t],e[(t+1)%3])}}let s=ge(i),c=new Map;for(let e of s.values())e.count===1&&(c.set(e.start.key,[...c.get(e.start.key)??[],e.end]),c.set(e.end.key,[...c.get(e.end.key)??[],e.start]));let l=[],u=new Set;for(let e of c.keys()){let t=a.get(e);if(t!==void 0&&u.has(e)===!1){let n=[],r=t,i=null,a=!1;for(let t=0;t<=c.size;t++){let t=c.get(r.key);if(t?.length===2){u.add(r.key),n.push(r.x,r.y);let o=t[0];if(o.key===i&&(o=t[1]),o.key===e){a=!0;break}if(u.has(o.key))break;i=r.key,r=o}else break}a&&n.length>=6&&l.push(new Float32Array(n))}}return l.sort((e,t)=>Math.abs(ve(t))-Math.abs(ve(e))),l},he=(e,t,n)=>{if(t.key!==n.key){let r=[t.key,n.key].sort().join(`|`),i=e.get(r);i===void 0?e.set(r,{start:t,end:n,count:1}):i.count++}},ge=e=>{let t=[],n=new Map;for(let r of e.values())r.count===1&&(t.push(r),n.set(r.start.key,r.start),n.set(r.end.key,r.end));let r=(e,t)=>e.x-t.x,i=(e,t)=>e.y-t.y,a=[...n.values()].sort(r),o=[...n.values()].sort(i),s=new Map;for(let e of t){let t=e.end.x-e.start.x,n=e.end.y-e.start.y,r=t*t+n*n,i=Math.max(Math.abs(e.start.x),Math.abs(e.start.y),Math.abs(e.end.x),Math.abs(e.end.y))*2**-23,c=Math.min(e.start.x,e.end.x)-i,l=Math.max(e.start.x,e.end.x)+i,u=Math.min(e.start.y,e.end.y)-i,d=Math.max(e.start.y,e.end.y)+i,f=_e(a,`x`,c),p=_e(a,`x`,l,!0),m=_e(o,`y`,u),h=_e(o,`y`,d,!0),g=a,_=f,v=p;h-m<p-f&&(g=o,_=m,v=h);let y=[{point:e.start,ratio:0},{point:e.end,ratio:1}],b=i*Math.sqrt(r);for(let i=_;i<v;i++){let a=g[i];if(a.x>=c&&a.x<=l&&a.y>=u&&a.y<=d&&a.key!==e.start.key&&a.key!==e.end.key){let i=a.x-e.start.x,o=a.y-e.start.y,s=(i*t+o*n)/r,c=t*o-n*i;s>0&&s<1&&Math.abs(c)<=b&&y.push({point:a,ratio:s})}}y.sort((e,t)=>e.ratio-t.ratio);for(let e=0;e+1<y.length;e++)he(s,y[e].point,y[e+1].point)}return s},_e=(e,t,n,r=!1)=>{let i=0,a=e.length;for(;i<a;){let o=Math.floor((i+a)/2),s=e[o][t];s<n||r&&s===n?i=o+1:a=o}return i},ve=e=>{let t=0;for(let n=0;n<e.length;n+=2){let r=(n+2)%e.length;t+=e[n]*e[r+1]-e[r]*e[n+1]}return t/2},k=(e,t,n)=>(t.x-e.x)*(n.y-e.y)-(t.y-e.y)*(n.x-e.x),A=(e,t)=>{if(!Number.isFinite(e)||e<0)throw RangeError(t+` must be finite and nonnegative.`);return e},j=(e,t)=>{if(!Number.isInteger(e)||e<t||e>4096)throw RangeError(`Segments must be an integer in [`+String(t)+`, 4096].`);return e},M=(e,t={})=>{let n=t.closed??!0,r=t.solid??!0;if(r&&!n)throw Error(`Solid Poly must be closed; use solid:false for an open path.`);let i=[];for(let t of e){let e;if(e=`x`in t?t:{x:t[0],y:t[1]},!Number.isFinite(Math.fround(e.x))||!Number.isFinite(Math.fround(e.y)))throw RangeError(`Poly coordinates must fit finite Float32 values.`);let n=i.at(-1);if(n?.x!==e.x||n.y!==e.y)i.push(Object.freeze({x:e.x,y:e.y,round:e.round??!1,segments:j(e.segments??8,1)}));else continue}n&&i.length>1&&i[0].x===i.at(-1)?.x&&i[0].y===i.at(-1)?.y&&i.pop();let a=1/0,o=1/0,s=-1/0,c=-1/0;for(let e of i)a=Math.min(a,e.x),o=Math.min(o,e.y),s=Math.max(s,e.x),c=Math.max(c,e.y);i.length===0&&(a=0,o=0,s=0,c=0);let l=Math.max(s-a,c-o),u=Math.max(l*1e-10,2**-52)*l,d,f=2;if(n&&(f=3),d=i.length<f?0:n?i.length:i.length-1,n){let e=0;for(let t=1;t<i.length-1;t++)e+=k(i[0],i[t],i[t+1]);e<0&&i.reverse()}let p=[],m=[],h=[0],g=0;for(let e=0;e<d;e++){let t=i[e],n=i[(e+1)%i.length],r=n.x-t.x,a=n.y-t.y,o=Math.hypot(r,a);p.push([a/o,-r/o]),m.push(o),g+=o,h.push(g)}return{points:Object.freeze(i),closed:n,solid:r,normals:p,lengths:m,distances:h,length:g,minX:a,minY:o,width:s-a,height:c-o,epsilon:u}},ye=(e,t)=>{let n=e.normals.length-1,r=t-1;t===0&&(r=e.closed?n:0);let i=Math.min(t,n),a=e.normals[r],o=e.normals[i],s=a[0]+o[0],c=a[1]+o[1],l=Math.hypot(s,c);if(l<1e-6)return[o[0],o[1],1];{let e=s/l,t=c/l;return[e,t,1/Math.max(e*o[0]+t*o[1],1e-6)]}},be=e=>{let t=e.points,n=t.map((e,t)=>t),r=[];if(n.length<3)return r;{let i=(n,i,a)=>{let o=k(t[n],t[i],t[a]);if(!(Math.abs(o)<=e.epsilon))o>0?r.push(n,a,i):r.push(n,i,a);else return},a=!0;for(;a&&n.length>3;){a=!1;for(let r=0;r<n.length;r++)if(Math.abs(k(t[n[(r+n.length-1)%n.length]],t[n[r]],t[n[(r+1)%n.length]]))<=e.epsilon){n.splice(r,1),a=!0;break}}for(;n.length>3;){let a=!1;for(let i=0;i<n.length;i++){let o=n[(i+n.length-1)%n.length],s=n[i],c=n[(i+1)%n.length];if(!(k(t[o],t[s],t[c])<=e.epsilon)&&n.some(n=>n!==o&&n!==s&&n!==c&&k(t[o],t[s],t[n])>=-e.epsilon&&k(t[s],t[c],t[n])>=-e.epsilon&&k(t[c],t[o],t[n])>=-e.epsilon)===!1){r.push(o,c,s),n.splice(i,1),a=!0;break}}if(!a){for(let e=1;e<n.length-1;e++)i(n[0],n[e],n[e+1]);return r}}return i(n[0],n[1],n[2]),r}},xe=(e,t,n,r,i)=>{let a=t.x-e.x,o=t.y-e.y,s=r.x-n.x,c=r.y-n.y,l=n.x-e.x,u=n.y-e.y,d=a*c-o*s,f=Math.max(Math.hypot(a,o)*Math.hypot(s,c),1),p=Math.max(f*1e-12,2**-52);if(Math.abs(d)<=p){let s=l*o-u*a;if(Math.abs(s)<=p){let a=Math.max(Math.min(e.x,t.x),Math.min(n.x,r.x)),o=Math.min(Math.max(e.x,t.x),Math.max(n.x,r.x));if(a<=o+i){let s=Math.min(e.y,t.y),c=Math.max(e.y,t.y),l=Math.min(n.y,r.y);if(s<=Math.max(n.y,r.y)+i&&l<=c+i)return[a,o]}}return[]}let m=(l*c-u*s)/d,h=(l*o-u*a)/d;return m>=-1e-10&&m<=1.0000000001&&h>=-1e-10&&h<=1.0000000001?[e.x+m*a]:[]},N=(e,t)=>{let n=(t-e.start.x)/(e.end.x-e.start.x);return e.start.y+n*(e.end.y-e.start.y)},Se=(e,t,n,r,i)=>{let a=(n.x-t.x)*(r.y-t.y)-(n.y-t.y)*(r.x-t.x);if(Math.abs(a)>i){let i=e.points.length;e.points.push(t,n,r),a>0?e.indices.push(i,i+2,i+1):e.indices.push(i,i+1,i+2)}},Ce=e=>{let t=e.points,n=[],r=Math.max(e.width,e.height),i=Math.max(r*1e-10,2**-52),a=!1;for(let e=0;e<t.length;e++){let r=t[e],o=t[(e+1)%t.length];n.push(r.x);let s=Math.min(r.x,o.x),c=Math.max(r.x,o.x),l=Math.min(r.y,o.y),u=Math.max(r.y,o.y),d=t.length;e===0&&(d=t.length-1);for(let f=e+2;f<d;f++){let e=t[f],d=t[(f+1)%t.length],p=Math.min(e.x,d.x),m=Math.max(e.x,d.x),h=Math.min(e.y,d.y),g=Math.max(e.y,d.y);if(s<=m+i&&p<=c+i&&l<=g+i&&h<=u+i){let t=xe(r,o,e,d,i);t.length>0&&(a=!0,n.push(...t))}}}if(a===!1)return;n.sort((e,t)=>e-t);let o=[];for(let e of n){let t=o.at(-1);(t===void 0||e-t>i)&&o.push(e)}let s={points:[],indices:[]};for(let n=0;n<o.length-1;n++){let r=o[n],a=o[n+1],c=r+(a-r)/2,l=[];for(let e=0;e<t.length;e++){let n=t[e],r=t[(e+1)%t.length],i=Math.min(n.x,r.x),a=Math.max(n.x,r.x);if(c>i&&c<a){let e=-1;r.x>n.x&&(e=1);let t={start:n,end:r,y:0,winding:e};t.y=N(t,c),l.push(t)}}l.sort((e,t)=>e.y-t.y);let u=0,d,f=0;for(;f<l.length;){let t=f,n=l[t].y,o=0;for(;f<l.length&&Math.abs(l[f].y-n)<=i;)o+=l[f].winding,f++;let c=u+o;if(u===0&&c!==0)d=l[t];else if(u!==0&&c===0&&d!==void 0){let n=l[t],i={x:r,y:N(d,r)},o={x:a,y:N(d,a)},c={x:a,y:N(n,a)},u={x:r,y:N(n,r)};Se(s,i,o,c,e.epsilon),Se(s,i,c,u,e.epsilon),d=void 0}u=c}}return s},P=class{_path;_data;_borderData;_lineData;_pointData;constructor(e=[],t={}){this._path=M(e,t),this._data=we(this._path)}get points(){return this._path.points}get width(){return this._path.width}get height(){return this._path.height}get closed(){return this._path.closed}get solid(){return this._path.solid}get data(){return this._data}get borderData(){return this._borderData}get lineData(){return this._lineData}get pointData(){return this._pointData}set(e,t={}){let n=M(e,{closed:t.closed??this.closed,solid:t.solid??this.solid}),r=we(n);return this._path=n,this._data=r,this._borderData=void 0,this._lineData=void 0,this._pointData=void 0,this}getPerimeter(){return this._path.length}createBorderGeometry(e,t=1,n=`normal`){return this._borderData=Ee(this._path,e,t,n),this._borderData}createLineGeometry(e=1){return this._lineData=Te(this._path,e),this._lineData}createPointGeometry(e=2,t=4,n=!0,r=!1,i=0,a=0){return this._pointData=De(this._path,e,t,n,r,i,a),this._pointData}},F=(e,t=[],n=[],r=[],i=[])=>{let a;return a=t.length/2>65536?new Uint32Array(i):new Uint16Array(i),{geometry:new Float32Array(t),normal:new Float32Array(n),uv:new Float32Array(r),index:a,width:e.width,height:e.height,minX:e.minX,minY:e.minY,closed:e.closed}},we=e=>{if(e.solid&&e.normals.length!==0){let t=Ce(e),n=e.points,r;t===void 0?r=be(e):(n=t.points,r=t.indices);let i=[],a=[],o=[];for(let r=0;r<n.length;r++){let s=n[r];if(i.push(s.x,s.y),t!==void 0)a.push(0,0);else{let t=ye(e,r);a.push(t[0],t[1])}let c=.5,l=.5;e.width!==0&&(c=(s.x-e.minX)/e.width),e.height!==0&&(l=(s.y-e.minY)/e.height),o.push(c,l)}return F(e,i,a,o,r)}return F(e)},Te=(e,t)=>{A(t,`uvRepeat`);let n=[],r=[],i=[],a=[];if(e.normals.length===0)return{...F(e),uvRepeat:t};{let o;o=e.closed?e.points.length+1:e.points.length;for(let s=0;s<o;s++){let o=s%e.points.length,c=e.points[o],l=ye(e,o);n.push(c.x,c.y),r.push(l[0],l[1]),i.push(e.distances[s]/e.length*t,.5),s>0&&a.push(s-1,s)}return{...F(e,n,r,i,a),uvRepeat:t}}},Ee=(e,t,n,r)=>{if(A(t,`lineWidth`),A(n,`uvRepeat`),![`inset`,`normal`,`outset`].includes(r))throw Error(`Unknown Poly border align.`);let i=[],a=[],o=[],s=[],c=[];if(e.normals.length===0)return{...F(e),miterScale:new Float32Array,lineWidth:t,uvRepeat:n,align:r};{let l=[],u=e.points.map((t,n)=>{if(e.closed||n!==0&&n!==e.points.length-1){let t=e.normals[(n+e.normals.length-1)%e.normals.length],r=e.normals[n];return Math.atan2(t[0]*r[1]-t[1]*r[0],t[0]*r[0]+t[1]*r[1])}return 0}),d=e.points.map((t,n)=>ye(e,n)),f=(t,n,r,s,u)=>{let d=e.points[t],f=i.length/2;i.push(d.x,d.y),a.push(n[0],n[1]),c.push(r),o.push(s,u);let p=.5;u===0&&(p=-.5);let m=p*r;return l.push({x:d.x+n[0]*m,y:d.y+n[1]*m}),f},p=(e,t,n)=>{let r=k(l[e],l[t],l[n]);if(!(Math.abs(r)<=2**-52))r>0?s.push(e,n,t):s.push(e,t,n);else return},m=(t,n,r,i)=>{let a=e.points[t].round&&Math.abs(u[t])>1e-8,o;o=+(u[t]>0);let s;s=a&&r===o?e.normals[n]:d[t];let c=1;return s.length===3&&(c=s[2]),f(t,s,c,i,r)};if(t>0){for(let t=0;t<e.normals.length;t++){let r=(t+1)%e.points.length,i=e.distances[t]/e.length*n,a=e.distances[t+1]/e.length*n,o=m(t,t,0,i),s=m(t,t,1,i),c=m(r,t,0,a),l=m(r,t,1,a);p(o,s,c),p(s,l,c)}for(let t=0;t<e.points.length;t++){let r=u[t];if(e.points[t].round&&!(Math.abs(r)<=1e-8)){let i;i=+(r>0);let a=e.distances[t]/e.length*n,o=f(t,d[t],d[t][2],a,1-i),s=e.normals[(t+e.normals.length-1)%e.normals.length],c=Math.atan2(s[1],s[0]),l=e.points[t].segments??8,u=f(t,s,1,a,i);for(let e=1;e<=l;e++){let n=c+r*e/l,s=f(t,[Math.cos(n),Math.sin(n)],1,a,i);p(o,u,s),u=s}}else continue}}return{...F(e,i,a,o,s),miterScale:new Float32Array(c),lineWidth:t,uvRepeat:n,align:r}}},De=(e,t,n,r,i,a,o)=>{if(A(t,`pointRadius`),j(n,3),A(a,`vertexThreshold`),A(o,`midpointThreshold`),!r&&!i)throw Error(`Enable vertexPoints or midpointPoints.`);if(e.normals.length===0)return{...F(e),position:new Float32Array,pointRadius:t,sides:n,pointCount:0};{let s=[];if(r)for(let t=0;t<e.points.length;t++){let n;n=t===0?e.closed?e.lengths.at(-1)??0:0:e.lengths[t-1];let r=e.lengths[t]??0;n+r>a&&s.push(e.points[t])}if(i)for(let t=0;t<e.lengths.length;t++)if(e.lengths[t]<=o)continue;else{let n=e.points[t],r=e.points[(t+1)%e.points.length];s.push({x:(n.x+r.x)/2,y:(n.y+r.y)/2})}let c=[],l=[],u=[],d=[],f=[];if(t>0)for(let e of s){let r=c.length/2;c.push(e.x,e.y),l.push(0,0),u.push(.5,.5),f.push(e.x,e.y);for(let i=0;i<n;i++){let a=0;n===4&&(a=Math.PI/4);let o=a-Math.PI*2*i/n,s=Math.cos(o),p=Math.sin(o),m;m=n===4?Math.SQRT2:1;let h=s*m,g=p*m;c.push(e.x+h*t,e.y+g*t),l.push(s,p),f.push(e.x,e.y),u.push(h/2+.5,g/2+.5),d.push(r,r+i+1,r+(i+1)%n+1)}}let p=0;return t>0&&(p=s.length),{...F(e,c,l,u,d),position:new Float32Array(f),pointRadius:t,sides:n,pointCount:p}}},Oe=(e,t=1,n=1,r=`normal`,i={})=>Ee(M(e,{...i,solid:i.solid??!1}),t,n,r),ke=(e,t=2,n=4,r=!0,i=!1,a=0,o=0,s={})=>De(M(e,{...s,solid:s.solid??!1}),t,n,r,i,a,o),Ae=class e extends O{type=`Base2D`;_input;constructor(e){super(e.style),this._input=L(e),this.updateGeometry()}get contours(){return(this._input.contours??[]).map(Ne)}getData(){return L(this._input)}setContourPoint(e,t,n,r){let i=this._input.contours?.[e];if(i!==void 0&&Number.isFinite(n)&&Number.isFinite(r)&&Number.isInteger(t)&&t>=0&&t*2+1<i.length){let e=t*2,a=i[e],o=i[e+1],s=n-a,c=r-o,l=this._input.vertices.slice(),u=this._input.position?.slice();for(let e=0;e<l.length;e+=2)l[e]===a&&l[e+1]===o?(l[e]=n,l[e+1]=r):u!==void 0&&this._input.vertexType?.[e/2]===1&&u[e]===a&&u[e+1]===o&&(l[e]+=s,l[e+1]+=c),u?.[e]===a&&u[e+1]===o&&(u[e]=n,u[e+1]=r);let d=this._input.contours?.map(Ne)??[];for(let e of d)for(let t=0;t<e.length;t+=2)e[t]===a&&e[t+1]===o&&(e[t]=n,e[t+1]=r);let f=this._input.linePoints,p=f;if(f!==void 0){let e=f.geometry.slice();for(let t=0;t<e.length;t+=2)e[t]===a&&e[t+1]===o&&(e[t]=n,e[t+1]=r);p={...f,geometry:e}}return this.setData({...this._input,vertices:l,position:u,linePoints:p,contours:d,style:this.style}),!0}return!1}insertContourPoint(e,t,n){let r=this._input.contours?.[e];if(r!==void 0&&r.length>=6&&Number.isInteger(t)&&t>=0&&t<r.length/2&&Number.isFinite(n)&&n>0&&n<1){let i=(t+1)%(r.length/2),a=r[t*2],o=r[t*2+1],s=r[i*2],c=r[i*2+1],l=Math.fround(a+(s-a)*n),u=Math.fround(o+(c-o)*n),d=this._input,f=d.index,p=(f?.length??d.vertices.length/2)/3,m={vertices:[]};d.uv!==void 0&&(m.uv=[]),d.normal!==void 0&&(m.normal=[]),d.position!==void 0&&(m.position=[]),d.miterScale!==void 0&&(m.miterScale=[]);let h=0;for(let e=0;e<p;e++){let t=[f?.[e*3]??e*3,f?.[e*3+1]??e*3+1,f?.[e*3+2]??e*3+2],r=!0;for(let e of t)d.vertexType!==void 0&&d.vertexType[e]!==0&&(r=!1);if(r){let e=-1;for(let n=0;n<3;n++){let r=t[n],i=t[(n+1)%3],l=d.vertices[r*2],u=d.vertices[r*2+1],f=d.vertices[i*2],p=d.vertices[i*2+1];(l===a&&u===o&&f===s&&p===c||l===s&&u===c&&f===a&&p===o)&&(e=n)}if(e>=0){let r=t[e],i=t[(e+1)%3],a=t[(e+2)%3],o=n;d.vertices[r*2]===s&&d.vertices[r*2+1]===c&&(o=1-n),I(m,d,r),Me(m,d,r,i,o,l,u),I(m,d,a),Me(m,d,r,i,o,l,u),I(m,d,i),I(m,d,a),h+=1}else for(let e of t)I(m,d,e)}}if(h>0&&(l!==a||u!==o)&&(l!==s||u!==c)){let n=d.contours?.map(Ne)??[],i=Array.from(r.slice(0,(t+1)*2)),a=Array.from(r.slice((t+1)*2));return n[e]=new Float32Array([...i,l,u,...a]),this.setData({vertices:new Float32Array(m.vertices),uv:je(m.uv),normal:je(m.normal),position:je(m.position),miterScale:je(m.miterScale),contours:n,style:this.style}),!0}return!1}return!1}copy(e){return this.copyPrecision(e),this.setData({...e._input,style:e.style.clone()}),this}clone(){return new e({...this._input,style:this.style.clone()})}setData(e){this._input=L(e),e.style!==void 0&&e.style!==this.style&&(this.style=e.style),this.updateGeometry()}updateGeometry(){let e=this._input,t=e.vertices,n=t.length/2;if(this._geometry=t,this.normal=e.normal??new Float32Array(t.length),this.uv=e.uv??new Float32Array(t.length),this.position=e.position??new Float32Array(t.length),this.vertexType=e.vertexType??new Float32Array(n),this.miterScale=e.miterScale??new Float32Array(n).fill(1),this.linePoints=e.linePoints,e.index===void 0){let e;e=n>65536?new Uint32Array(n):new Uint16Array(n);for(let t=0;t<n;t+=1)e[t]=t;this.index=e}else this.index=e.index;let r=e.vertexType?.some(e=>e===1)??!1,i=e.vertexType?.some(e=>e===.5)??!1;(!i&&this.style.edge.enabled||!r&&this.style.points.enabled)&&this.appendContourDecorations(i,r);let a=1/0,o=-1/0,s=1/0,c=-1/0;for(let e=0;e<t.length;e+=2)a=Math.min(a,t[e]),o=Math.max(o,t[e]),s=Math.min(s,t[e+1]),c=Math.max(c,t[e+1]);let l=0,u=0;return n>0&&(l=o-a,u=c-s),this.uniformData.set([l,u,0,this.style.edge.width]),super.updateGeometry(),this}appendContourDecorations(e,t){let n=this.style.points,r=this.style.edge,i=this._input.contours??[],a=[];for(let t of i){let n=[];for(let e=0;e<t.length;e+=2)n.push({x:t[e],y:t[e+1]});n.length>=3&&r.enabled&&r.width>0&&!e&&a.push({data:Oe(n,r.width,r.uvRepeat,r.borderAlign,{closed:!0,solid:!1}),type:.5})}for(let e of i){let r=[];for(let t=0;t<e.length;t+=2)r.push({x:e[t],y:e[t+1]});r.length>=2&&n.enabled&&!t&&(n.vertices||n.midpoints)&&a.push({data:ke(r,n.radius,n.segments,n.vertices,n.midpoints,n.minPointsLength,n.minEdgePointsLength,{closed:!0,solid:!1}),type:1})}let o=this._geometry??new Float32Array,s=o.length/2,c=0,l=0;for(let e of a)c+=e.data.geometry.length/2,l+=e.data.index.length;if(l>0){let e=s+c,t=new Float32Array(e*2),n=new Float32Array(e*2),r=new Float32Array(e*2),i=new Float32Array(e*2),u=new Float32Array(e),d=new Float32Array(e).fill(1),f;f=e>65536?new Uint32Array((this.index?.length??0)+l):new Uint16Array((this.index?.length??0)+l),t.set(o),n.set(this.normal??new Float32Array(o.length)),r.set(this.uv??new Float32Array(o.length)),i.set(this.position??new Float32Array(o.length)),u.set(this.vertexType??new Float32Array(s)),d.set(this.miterScale??new Float32Array(s).fill(1)),f.set(this.index??new Uint16Array);let p=s,m=this.index?.length??0;for(let e of a){let a=e.data,o=a.geometry.length/2;t.set(a.geometry,p*2),n.set(a.normal,p*2),r.set(a.uv,p*2),i.set(a.position??new Float32Array(a.geometry.length),p*2),d.set(a.miterScale??new Float32Array(o).fill(1),p),u.fill(e.type,p,p+o);for(let e of a.index)f[m]=e+p,m+=1;p+=o}this._geometry=t,this.normal=n,this.uv=r,this.position=i,this.vertexType=u,this.miterScale=d,this.index=f}}},je=e=>{let t;return e!==void 0&&(t=new Float32Array(e)),t},I=(e,t,n,r=n,i=0)=>{let a=e=>[e[n*2]+(e[r*2]-e[n*2])*i,e[n*2+1]+(e[r*2+1]-e[n*2+1])*i];if(e.vertices.push(...a(t.vertices)),t.uv!==void 0&&e.uv!==void 0&&e.uv.push(...a(t.uv)),t.normal!==void 0&&e.normal!==void 0&&e.normal.push(...a(t.normal)),t.position!==void 0&&e.position!==void 0&&e.position.push(...a(t.position)),t.miterScale!==void 0&&e.miterScale!==void 0){let a=t.miterScale[n]+(t.miterScale[r]-t.miterScale[n])*i;e.miterScale.push(a)}},Me=(e,t,n,r,i,a,o)=>{I(e,t,n,r,i);let s=e.vertices.length-2;e.vertices[s]=a,e.vertices[s+1]=o},L=e=>{let t=e.vertices;if(!(t instanceof Float32Array)||t.length%2!=0)throw TypeError(`Base2D vertices must be complete Float32Array x/y pairs.`);let n=t.length/2,r=[];for(let t of e.contours??[]){if(!(t instanceof Float32Array)||t.length<4||t.length%2!=0)throw TypeError(`Base2D contours must contain complete Float32Array x/y pairs.`);for(let e of t)if(!Number.isFinite(e))throw RangeError(`Base2D contour coordinates must be finite.`);r.push(t.slice())}if(e.contours===void 0&&r.push(...me(e)),e.index===void 0&&n%3!=0)throw RangeError(`Base2D sequential vertices must form complete triangles.`);let i=[e.uv,e.normal,e.position];for(let e of i)if(e!==void 0&&(!(e instanceof Float32Array)||e.length!==t.length))throw RangeError(`Base2D vec2 attributes must match vertices length.`);if(e.vertexType!==void 0&&e.vertexType.length!==n)throw RangeError(`Base2D vertexType length must match vertex count.`);if(e.miterScale!==void 0&&e.miterScale.length!==n)throw RangeError(`Base2D miterScale length must match vertex count.`);let a=e.index;if(a!==void 0){if(!(a instanceof Uint16Array)&&!(a instanceof Uint32Array))throw TypeError(`Base2D index must be Uint16Array or Uint32Array.`);if(a.length%3!=0)throw RangeError(`Base2D indices must form complete triangles.`);for(let e of a)if(e>=n)throw RangeError(`Base2D index exceeds vertex count.`)}let o,s,c,l,u,d,f;return e.uv!==void 0&&(o=new Float32Array(e.uv)),e.normal!==void 0&&(s=new Float32Array(e.normal)),a instanceof Uint32Array&&(c=new Uint32Array(a)),a instanceof Uint16Array&&(c=new Uint16Array(a)),e.vertexType!==void 0&&(l=new Float32Array(e.vertexType)),e.position!==void 0&&(u=new Float32Array(e.position)),e.miterScale!==void 0&&(d=new Float32Array(e.miterScale)),e.linePoints!==void 0&&(f={geometry:e.linePoints.geometry.slice(),normal:e.linePoints.normal.slice(),uv:e.linePoints.uv.slice(),index:e.linePoints.index.slice(),position:e.linePoints.position?.slice(),vertexType:e.linePoints.vertexType?.slice(),miterScale:e.linePoints.miterScale?.slice()}),{vertices:new Float32Array(t),contours:r,uv:o,normal:s,index:c,vertexType:l,position:u,miterScale:d,linePoints:f,style:e.style}},Ne=e=>e.slice(),R=e=>{if(!Number.isInteger(e.sides)||e.sides<2||e.sides>65536)throw RangeError(`NGon sides must be an integer in [2, 65536].`);if(!new Set([`bounding`,`polar`]).has(e.nvMode))throw TypeError(`Invalid NGon nvMode.`);if(typeof e.hole!=`boolean`||typeof e.solid!=`boolean`)throw TypeError(`NGon switches must be boolean.`);for(let t of[e.outer,e.inter])if(t<0||!Number.isFinite(Math.fround(t*2)))throw RangeError(`NGon radii must be finite, nonnegative Float32 sizes.`);if(!Number.isFinite(e.startAngle))throw RangeError(`NGon startAngle must be finite.`);return Object.freeze({...e,startAngle:e.startAngle%(Math.PI*2),inter:Math.min(e.inter,e.outer)})},Pe=(e,t)=>t===0?[]:Array.from({length:e.sides},(n,r)=>{let i=e.startAngle+r*Math.PI*2/e.sides;return{x:Math.cos(i)*t,y:Math.sin(i)*t}}),Fe=e=>{if(e.length===0)return{width:0,height:0,minX:0,minY:0};{let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let a of e)t=Math.min(t,a.x),n=Math.min(n,a.y),r=Math.max(r,a.x),i=Math.max(i,a.y);return{minX:t,minY:n,width:r-t,height:i-n}}},Ie=e=>({...e,closed:!0,geometry:new Float32Array,normal:new Float32Array,uv:new Float32Array,index:new Uint16Array}),Le=(e,t,n)=>{let r;if(r=e.hole?e.inter:0,e.solid&&e.sides!==2&&e.outer!==0&&r!==e.outer){let i=[],a=[],o=[],s=[],c=(t,r,s,c)=>{let l=i.length/2,u=Math.hypot(t.x,t.y);i.push(t.x,t.y);let d=0,f=0;return u!==0&&(d=c*t.x/u,f=c*t.y/u),a.push(d,f),e.nvMode===`polar`?o.push(r,s):o.push((t.x-n.minX)/n.width,(t.y-n.minY)/n.height),l};for(let n=0;n<=e.sides;n++){let i=t[n%e.sides],a=n/e.sides;r>0&&c({x:i.x*r/e.outer,y:i.y*r/e.outer},a,0,-1),c(i,a,1,1)}let l;l=r===0&&e.nvMode===`bounding`?c({x:0,y:0},.5,0,0):-1;for(let t=0;t<e.sides;t++)if(r>0){let e=t*2;s.push(e,e+3,e+1,e,e+2,e+3)}else{let n;n=l>=0?l:c({x:0,y:0},(t+.5)/e.sides,0,0),s.push(n,t+1,t)}let u;return u=i.length/2>65536?new Uint32Array(s):new Uint16Array(s),{...n,closed:!0,geometry:new Float32Array(i),normal:new Float32Array(a),uv:new Float32Array(o),index:u}}return Ie(n)},Re=(e,t)=>{let n=e.reduce((e,t)=>e+t.geometry.length/2,0),r=e.reduce((e,t)=>e+t.index.length,0),i;i=n>65536?new Uint32Array(r):new Uint16Array(r);let a={...Ie(t),geometry:new Float32Array(n*2),normal:new Float32Array(n*2),uv:new Float32Array(n*2),index:i,miterScale:new Float32Array(n).fill(1),position:new Float32Array(n*2)},o=0,s=0;for(let t of e){a.geometry.set(t.geometry,o*2),a.normal.set(t.normal,o*2),a.uv.set(t.uv,o*2),t.miterScale!==void 0&&a.miterScale.set(t.miterScale,o),t.position!==void 0&&a.position.set(t.position,o*2);for(let e of t.index)a.index[s++]=e+o;o+=t.geometry.length/2}return a},ze=class{_settings;_nodes;_data;_borderData;_lineData;_pointData;constructor(e={}){this._settings=R({sides:e.sides??32,hole:e.hole??!1,nvMode:e.nvMode??`bounding`,outer:e.outer??1,inter:e.inter??.5,startAngle:e.startAngle??0,solid:e.solid??!0}),this._nodes=Pe(this._settings,this._settings.outer),this._data=Le(this._settings,this._nodes,Fe(this._nodes))}get sides(){return this._settings.sides}set sides(e){this.set({sides:e})}get hole(){return this._settings.hole}set hole(e){this.set({hole:e})}get nvMode(){return this._settings.nvMode}set nvMode(e){this.set({nvMode:e})}get outer(){return this._settings.outer}set outer(e){this.set({outer:e})}get inter(){return this._settings.inter}set inter(e){this.set({inter:e})}get startAngle(){return this._settings.startAngle}set startAngle(e){this.set({startAngle:e})}get solid(){return this._settings.solid}set solid(e){this.set({solid:e})}get width(){return this._data.width}get height(){return this._data.height}get data(){return this._data}get borderData(){return this._borderData}get lineData(){return this._lineData}get pointData(){return this._pointData}set(e){let t=R({...this._settings,...e}),n=Pe(t,t.outer),r=Le(t,n,Fe(n));return this._settings=t,this._nodes=n,this._data=r,this._borderData=void 0,this._lineData=void 0,this._pointData=void 0,this}getPerimeter(){let e=this.outer;return this.hole&&this.inter>0&&this.inter<this.outer&&(e+=this.inter),this.sides===2?e*2:2*this.sides*e*Math.sin(Math.PI/this.sides)}contours(){if(this.outer===0)return[];{let e=[{poly:new P(this._nodes,{closed:this.sides>2,solid:!1}),inner:!1}];return this.hole&&this.inter>0&&this.inter<this.outer&&e.push({poly:new P(Pe(this._settings,this.inter),{closed:this.sides>2,solid:!1}),inner:!0}),e}}createBorderGeometry(e,t=1,n=`normal`){new P([],{solid:!1}).createBorderGeometry(e,t,n);let r;r=this.outer>0?[this.outer]:[],this.hole&&this.inter>0&&this.inter<this.outer&&r.push(this.inter);let i;i=r.length>0?new P(Pe(this._settings,10),{closed:this.sides>2,solid:!1}).createBorderGeometry(e,t,n):void 0;let a=r.map((e,t)=>{if(i===void 0)throw Error(`Missing NGon border template.`);let n=t=>t*e/10,r={...i,geometry:i.geometry.map(n),normal:i.normal.slice(),index:i.index.slice()};if(t>0){for(let e=0;e<r.normal.length;e++)r.normal[e]*=-1;for(let e=0;e<r.index.length;e+=3)[r.index[e+1],r.index[e+2]]=[r.index[e+2],r.index[e+1]]}return r});return this._borderData={...Re(a,this._data),lineWidth:e,uvRepeat:t,align:n},this._borderData}createLineGeometry(e=1){new P([],{solid:!1}).createLineGeometry(e);let t=this.contours().map(t=>{let{poly:n,inner:r}=t,i=n.createLineGeometry(e);if(r)for(let e=0;e<i.normal.length;e++)i.normal[e]*=-1;return i});return this._lineData={...Re(t,this._data),uvRepeat:e},this._lineData}createPointGeometry(e=2,t=4,n=!0,r=!1,i=0,a=0){new P([],{solid:!1}).createPointGeometry(e,t,n,r,i,a);let o=this.contours().map(o=>o.poly.createPointGeometry(e,t,n,r,i,a)),s=(e,t)=>e+t.pointCount;return this._pointData={...Re(o,this._data),pointRadius:e,sides:t,pointCount:o.reduce(s,0)},this._pointData}},Be=class e extends O{type=`NGon2D`;_outer;_inner;_sides;_uvMode;_startAngle;_width=0;_height=0;_perimeter=0;constructor(e={}){let t=new ze({outer:e.outer??1,inter:e.inner??0,sides:e.sides??32,nvMode:e.uvMode??`bounding`,startAngle:e.startAngle??0,solid:!1});super(e.style??void 0),this._outer=t.outer,this._inner=t.inter,this._sides=t.sides,this._uvMode=t.nvMode,this._startAngle=t.startAngle;try{this.updateGeometry()}catch(e){throw this.dispose(),e}}copy(e){return this.copyPrecision(e),this.style=e.style.clone(),this._outer=e.outer,this._inner=e.inner,this._sides=e.sides,this._uvMode=e.uvMode,this._startAngle=e.startAngle,this.updateGeometry(),this}clone(){return new e().copy(this)}get outer(){return this._outer}set outer(e){if(Ve(e),this._outer!==e)this._outer=e,this._inner=Math.min(this._inner,e),this.updateVersion();else return}get inner(){return this._inner}set inner(e){if(e=Math.min(Ve(e),this._outer),this._inner!==e)this._inner=e,this.updateVersion();else return}get sides(){return this._sides}set sides(e){if(!Number.isInteger(e)||e<2||e>65536)throw RangeError(`NGon2D sides must be an integer in [2, 65536].`);if(this._sides!==e)this._sides=e,this.updateVersion();else return}get uvMode(){return this._uvMode}set uvMode(e){if(![`bounding`,`polar`].includes(e))throw TypeError(`Invalid NGon2D uvMode.`);if(this._uvMode!==e)this._uvMode=e,this.updateVersion();else return}get startAngle(){return this._startAngle}set startAngle(e){if(!Number.isFinite(e))throw RangeError(`NGon2D startAngle must be finite.`);if(e%=Math.PI*2,this._startAngle!==e)this._startAngle=e,this.updateVersion();else return}get width(){return this.ensureGeometry(),this._width}get height(){return this.ensureGeometry(),this._height}get perimeter(){return this.ensureGeometry(),this._perimeter}updateGeometry(){let e=new ze({outer:this._outer,inter:this._inner,hole:this._inner>0,sides:this._sides,nvMode:this._uvMode,startAngle:this._startAngle,solid:this.style.solid.enabled}),t=[];this.style.solid.enabled&&t.push({data:e.data,vertexType:0});let n=this.style.edge;n.enabled&&n.width>0&&t.push({data:e.createBorderGeometry(n.width,n.uvRepeat,n.borderAlign),vertexType:.5});let r=this.style.points;r.enabled&&(r.vertices||r.midpoints)&&t.push({data:e.createPointGeometry(r.radius,r.segments,r.vertices,r.midpoints,r.minPointsLength,r.minEdgePointsLength),vertexType:1});let i;return i=this.style.wireframe.enabled?e.createLineGeometry():void 0,this.mergeGeometry(t),this.linePoints=i,this._width=e.width,this._height=e.height,this._perimeter=e.getPerimeter(),this.uniformData.set([this._outer,this._inner,this._sides,n.width]),super.updateGeometry(),this}},Ve=e=>{if(e<0||!Number.isFinite(Math.fround(e*2)))throw RangeError(`NGon2D radii must be finite, nonnegative Float32 sizes.`);return e},He=class e extends O{type=`Poly2D`;_points;_closed;_width=0;_height=0;_perimeter=0;constructor(e=new Float32Array,t,n={}){let r=Ue(e);super(t??void 0),this._points=r,this._closed=n.closed??!0,this.precision=n.precision??Math.min(4095,this.style.join.seg);try{this.updateGeometry()}catch(e){throw this.dispose(),e}}copy(e){return this.style=e.style.clone(),this.copyPrecision(e),this._points=new Float32Array(e.points),this._closed=e.closed,this.updateGeometry(),this}clone(){return new e(this.points,this.style.clone(),{closed:this.closed}).copy(this)}get points(){return this._points}set points(e){let t=Ue(e);this._points=t,this.updateVersion()}get closed(){return this._closed}set closed(e){if(this._closed!==e){if(!e&&this.style.solid.enabled)throw Error(`Disable solid before opening Poly2D.`);this._closed=e,this.updateVersion()}else return}get width(){return this.ensureGeometry(),this._width}get height(){return this.ensureGeometry(),this._height}get perimeter(){return this.ensureGeometry(),this._perimeter}updateGeometry(){let e=this.style.join,t=[];for(let n=0;n<this._points.length;n+=2){let r=this.precision;e.type===`bevel`&&(r=1),t.push({x:this._points[n],y:this._points[n+1],round:e.type!==`miter`,segments:r})}let n=new P(t,{closed:this._closed,solid:this.style.solid.enabled}),r;r=this.style.solid.enabled?n.data:void 0;let i;i=this.style.wireframe.enabled?n.createLineGeometry():void 0;let a=this.style.edge,o;o=a.enabled&&a.width>0?n.createBorderGeometry(a.width,a.uvRepeat,a.borderAlign):void 0;let s=this.style.points,c;c=s.enabled&&(s.vertices||s.midpoints)?n.createPointGeometry(s.radius,s.segments,s.vertices,s.midpoints,s.minPointsLength,s.minEdgePointsLength):void 0;let l=[];return r!==void 0&&l.push({data:r,vertexType:0}),o!==void 0&&l.push({data:o,vertexType:.5}),c!==void 0&&l.push({data:c,vertexType:1}),this.mergeGeometry(l),this.linePoints=i,this._width=n.width,this._height=n.height,this._perimeter=n.getPerimeter(),this.uniformData.set([n.width,n.height,0,a.width]),super.updateGeometry(),this}},Ue=e=>{if(!(e instanceof Float32Array))throw TypeError(`Poly2D points must be a Float32Array.`);if(e.length%2!=0)throw RangeError(`Poly2D needs complete x/y pairs.`);for(let t of e)if(!Number.isFinite(t))throw RangeError(`Poly2D coordinates must be finite.`);return new Float32Array(e)},We=(e,t,n,r)=>{let i=B(e,t,n,r,!0),a=Xe(i,z(e,t,n,r,!0));return{points:i,normal:a.normal,miterScale:a.miterScale}},Ge=(e,t)=>{if(e!==0&&t!==0){let n=Math.SQRT1_2,r=Math.SQRT2;return{points:[[e,t],[e,t],[e,t],[e,-t],[e,-t],[e,-t],[-e,-t],[-e,-t],[-e,-t],[-e,t],[-e,t],[-e,t]],normal:[[0,1],[n,n],[1,0],[1,0],[n,-n],[0,-1],[0,-1],[-n,-n],[-1,0],[-1,0],[-n,n],[0,1]],miterScale:[1,r,1,1,r,1,1,r,1,1,r,1]}}return{points:[],normal:[],miterScale:[]}},z=(e,t,n,r,i)=>{let a=0;return n>0&&(a=n+1),B(e+1,t+1,a,r,i)},Ke=(e,t,n,r,i)=>{let a=new Map,o=[],s=Math.max(e.width,e.height)*2**-52*16||Number.MIN_VALUE,c=(e,t)=>{let n=String(Math.round(e[0]/s))+`,`+String(Math.round(e[1]/s)),r=a.get(n);r===void 0?a.set(n,{point:e,adjacentLength:t}):r.adjacentLength+=t};for(let r=0;r<e.index.length;r+=2){let a=e.index[r]*2,l=e.index[r+1]*2,u=[e.geometry[a],e.geometry[a+1]],d=[e.geometry[l],e.geometry[l+1]],f=tt(u,d);if(!(f<=s))t&&(c(u,f),c(d,f)),n&&f>i&&o.push([(u[0]+d[0])*.5,(u[1]+d[1])*.5]);else continue}let l=[];for(let e of a.values())e.adjacentLength>r&&l.push(e.point);return l.concat(o)},B=(e,t,n,r=nt(n),i=!1)=>{if(e!==0&&t!==0){if(n!==0||i){let i=[];return V(i,e-n,t-n,n,Math.PI*.5,0,r),V(i,e-n,-t+n,n,0,-Math.PI*.5,r),V(i,-e+n,-t+n,n,-Math.PI*.5,-Math.PI,r),V(i,-e+n,t-n,n,Math.PI,Math.PI*.5,r),i}return[[e,t],[e,-t],[-e,-t],[-e,t]]}return[]},V=(e,t,n,r,i,a,o)=>{for(let s=0;s<=o;s+=1){let c=s/o,l=i+(a-i)*c;e.push([t+Math.cos(l)*r,n+Math.sin(l)*r])}},H=e=>{if(e.length===0)return new Float32Array;{let t=[0,0];for(let n of e)t.push(n[0],n[1]);return new Float32Array(t)}},qe=e=>{if(e.length===0)return new Float32Array;{let t=[0,0];for(let n of e)t.push(n[0],n[1]);return new Float32Array(t)}},Je=(e,t,n)=>{if(e.length!==0&&t!==0&&n!==0){let r=[.5,.5],i=t*.5,a=n*.5;for(let o of e)r.push((o[0]+i)/t,(o[1]+a)/n);return new Float32Array(r)}return new Float32Array},Ye=e=>{if(e.length>=3){let t=[];for(let n=0;n<e.length;n+=1){let r=n+1,i;i=n+1===e.length?1:n+2,t.push(0,r,i)}return new Uint16Array(t)}return new Uint16Array},Xe=(e,t)=>{if(e.length===t.length){let n=[],r=[];for(let i=0;i<e.length;i+=1){let a=e[i],o=t[i],s=o[0]-a[0],c=o[1]-a[1],l=Math.hypot(s,c);if(l===0){n.push([0,0]),r.push(0);continue}n.push([s/l,c/l]),r.push(l)}return{normal:n,miterScale:r}}return{normal:[],miterScale:[]}},Ze=(e,t,n,r)=>{let i=e.length;if(i>=2&&t.length===i&&n.length===i){let a=$e(e),o=[],s=[],c=[],l=[],u=[];for(let u=0;u<=i;u+=1){let d=u%i,f;f=u===i?r:a[d]*r;let p=e[d],m=t[d],h=n[d];o.push(p[0],p[1],p[0],p[1]),s.push(m[0],m[1],m[0],m[1]),c.push(h,h),l.push(f,0,f,1)}for(let e=0;e<i;e+=1){let t=e*2,n=t+1,r=t+2,i=t+3;u.push(t,n,i,t,i,r)}return{geometry:new Float32Array(o),normal:new Float32Array(s),miterScale:new Float32Array(c),uv:new Float32Array(l),index:new Uint16Array(u)}}return it()},Qe=(e,t,n)=>{let r=e.length;if(r>=2&&t.length===r){let i=$e(e),a=[],o=[],s=[],c=[];for(let l=0;l<=r;l+=1){let u=l%r,d=e[u],f=t[u],p;p=l===r?n:i[u]*n,a.push(d[0],d[1]),o.push(f[0],f[1]),s.push(p,0),l<r&&c.push(l,l+1)}return{geometry:new Float32Array(a),normal:new Float32Array(o),uv:new Float32Array(s),index:new Uint16Array(c)}}return rt()},$e=e=>{if(e.length>=2){let t=[0],n=0;for(let r=1;r<e.length;r+=1)n+=tt(e[r-1],e[r]),t.push(n);return n+=tt(e[e.length-1],e[0]),n===0?t.map(()=>0):t.map(e=>e/n)}return e.map(()=>0)},et=e=>{if(e.length>=2){let t=0;for(let n=0;n<e.length;n+=1){let r;r=n+1===e.length?0:n+1,t+=tt(e[n],e[r])}return t}return 0},tt=(e,t)=>Math.hypot(t[0]-e[0],t[1]-e[1]),nt=e=>Math.min(4095,Math.max(2,Math.ceil(e/8))),U=(e,t,n,r=0,i=`normal`)=>{let a=G(e,t,n).radius;if(a>0){let e=K(r);i===`outset`?a+=e:i!==`inset`&&(a+=e/2)}return nt(a)},W=e=>e!==`inset`&&e!==`outset`?`normal`:e,G=(e,t,n)=>{let r=K(e),i=K(t),a=r*.5,o=i*.5;return{width:r,height:i,halfWidth:a,halfHeight:o,radius:ie(K(n),0,Math.min(a,o))}},K=e=>Number.isFinite(e)?Math.max(0,e):0,rt=()=>({geometry:new Float32Array,normal:new Float32Array,uv:new Float32Array,index:new Uint16Array}),it=()=>({...rt(),miterScale:new Float32Array}),at=(e,t,n=0,r=U(e,t,n))=>{let i=G(e,t,n);return et(B(i.halfWidth,i.halfHeight,i.radius,C(r)))},ot=(e,t,n=0,r=U(e,t,n))=>{let i=G(e,t,n),a=C(r),o=i.radius>0,s=B(i.halfWidth,i.halfHeight,i.radius,a,o),c=Xe(s,z(i.halfWidth,i.halfHeight,i.radius,a,o));return{geometry:H(s),normal:qe(c.normal),uv:Je(s,i.width,i.height),index:Ye(s),width:i.width,height:i.height,radius:i.radius,precision:C(r)}},st=(e,t,n=0,r=1,i=1,a=`normal`,o=U(e,t,n,r,a))=>{let s=G(e,t,n),c=K(r),l=K(i),u=W(a),d=C(o),f;f=s.radius===0?Ge(s.halfWidth,s.halfHeight):We(s.halfWidth,s.halfHeight,s.radius,d);let p=Ze(f.points,f.normal,f.miterScale,l);return{geometry:p.geometry,normal:p.normal,uv:p.uv,index:p.index,miterScale:p.miterScale,width:s.width,height:s.height,radius:s.radius,precision:C(o),lineWidth:c,uvRepeat:l,align:u}},ct=(e,t,n=0,r=1,i=U(e,t,n))=>{let a=G(e,t,n),o=K(r),s=C(i),c=a.radius>0,l=B(a.halfWidth,a.halfHeight,a.radius,s,c),u=Qe(l,Xe(l,z(a.halfWidth,a.halfHeight,a.radius,s,c)).normal,o);return{geometry:u.geometry,normal:u.normal,uv:u.uv,index:u.index,width:a.width,height:a.height,radius:a.radius,precision:C(i),uvRepeat:o}},lt=(e,t,n=0,r=2,i=4,a=!0,o=!1,s=0,c=0,l=U(e,t,n))=>{if(!a&&!o)throw RangeError(`vertexPoints and midpointPoints cannot both be false.`);if(!Number.isSafeInteger(i)||i<3)throw RangeError(`sides must be an integer greater than or equal to 3.`);if(Number.isNaN(s)||Number.isNaN(c))throw RangeError(`Point thresholds cannot be NaN.`);let u=ct(e,t,n,1,l),d=K(r),f;f=d===0?[]:Ke(u,a,o,Math.max(0,s),Math.max(0,c));let p=f.length*(i+1),m=new Float32Array(p*2),h=new Float32Array(p*2),g=new Float32Array(p*2),_=new Float32Array(p*2),v;v=p>65536?new Uint32Array(f.length*i*3):new Uint16Array(f.length*i*3);let y=[[1,1],[1,-1],[-1,-1],[-1,1]];for(let e=0;e<f.length;e+=1){let t=f[e],n=e*(i+1);m.set(t,n*2),h.set(t,n*2),_.set([.5,.5],n*2);for(let r=0;r<i;r+=1){let a=Math.PI*.5-r*Math.PI*2/i,o;o=i===4?y[r][0]:Math.cos(a);let s;s=i===4?y[r][1]:Math.sin(a);let c=(n+r+1)*2,l=Math.hypot(o,s);m.set([t[0]+o*d,t[1]+s*d],c),h.set(t,c),g.set([o/l,s/l],c),_.set([o*.5+.5,s*.5+.5],c),v.set([n,n+r+1,n+(r+1)%i+1],(e*i+r)*3)}}return{geometry:m,position:h,normal:g,uv:_,index:v,width:u.width,height:u.height,radius:u.radius,precision:u.precision,pointRadius:d,sides:i,pointCount:f.length}},ut=class e extends O{type=`Rect2D`;_width;_height;_radius;constructor(e={}){super(e.style),this._width=e.width??1,this._height=e.height??1,this._radius=e.radius??1,this.precision=e.precision??8,this.updateGeometry()}copy(e){return this.copyPrecision(e),this.style=e.style.clone(),this._width=e.width,this._height=e.height,this._radius=e.radius,this.updateGeometry(),this}clone(){return new e().copy(this)}updateGeometry(){this._width=Number.isFinite(this._width)?Math.max(0,this._width):0,this._height=Number.isFinite(this._height)?Math.max(0,this._height):0,this._radius=Number.isFinite(this._radius)?Math.max(0,this._radius):0;let e=Math.min(this._radius,this._width*.5,this._height*.5),t;t=this.style.solid.enabled?ot(this._width,this._height,e,this.precision):void 0,this.linePoints=this.style.wireframe.enabled?ct(this._width,this._height,e,1,this.precision):void 0;let n;n=this.style.edge.enabled&&this.style.edge.width>0?st(this._width,this._height,e,this.style.edge.width,this.style.edge.uvRepeat,this.style.edge.borderAlign,this.precision):void 0;let r;r=this.style.points.enabled&&(this.style.points.vertices||this.style.points.midpoints)?lt(this._width,this._height,e,this.style.points.radius,this.style.points.segments,this.style.points.vertices,this.style.points.midpoints,this.style.points.minPointsLength,this.style.points.minEdgePointsLength,this.precision):void 0;let i=[];return t!==void 0&&i.push({data:t,vertexType:0}),n!==void 0&&i.push({data:n,vertexType:.5}),r!==void 0&&i.push({data:r,vertexType:1}),this.mergeGeometry(i),this.uniformData.set([this._width,this._height,e,this.style.edge.width]),super.updateGeometry(),this}set width(e){if(this._width!==e)this._width=e,this.updateVersion();else return}get width(){return this._width}set height(e){if(this._height!==e)this._height=e,this.updateVersion();else return}get height(){return this._height}set radius(e){if(this._radius!==e)this._radius=e,this.updateVersion();else return}get radius(){return this._radius}get perimeter(){return at(this._width,this._height,Math.min(this._radius,this._width*.5,this._height*.5),this.precision)}},q=class extends g{type=`Group`;children=[];constructor(e,t){super(e,t)}add(e){if(e===this)throw Error(`Cannot add a group to itself or one of its descendants.`);let t=this.parent;for(;t!==null;){if(t===e)throw Error(`Cannot add a group to itself or one of its descendants.`);t=t.parent}if(e.parent!==this||!this.children.includes(e)){e.parent!==null&&`removeChild`in e.parent&&e.parent.removeChild(e),e.parent=this,this.children.push(e);let t=this.getScene(e);t!==void 0&&(t.addToLists(e),t.updateVersion())}else return}removeSelf(){let e=this.parent;return e!==null&&`removeChild`in e&&e.removeChild(this)}removeChild(e){let t=this.children.indexOf(e);if(t===-1)return!1;{let n=this.getScene(this);return this.children.splice(t,1),e.parent=null,n!==void 0&&n.removeFromLists(e),!0}}removeAll(){if(this.children.length!==0){let e=this.getScene(this);for(let t of this.children)e?.removeFromLists(t),t.parent=null;this.children.length=0}else return}updateWorldMatrix(){super.updateWorldMatrix();for(let e of this.children)e.updateWorldMatrix();return this.worldMatrix}getScene(e){let t=e;for(;t!==null;)if(t.type===`Scene`)return t;else t=t.parent}},dt=class{id=h();_version=0;_key=``;_pipelineKeys=new Map;_style;_disposed=!1;_subscribers=new Set;_transparent=!1;_depthTest=!1;_depthWrite=!1;_cullMode=`back`;_geometryTypes=new Set;_shaders={};_values;_customShaderKey=``;constructor(e=new D){this._style=e,e.add(this)}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed material cannot be reused.`);if(this._style!==e)this._style.delete(this),this._style=e,e.add(this),this.updateVersion();else return}onStyleChange(e){if(!this._disposed&&e.source===this._style){let t;t=e.field===`texture`?`texture`:e.field===`textureData`?`textureData`:e.field===`addressModeU`||e.field===`addressModeV`?`sampler`:`style`,this.updateVersion(t)}else return}dispose(){this._style.delete(this),this._subscribers.clear(),this._disposed=!0}add(e){if(this._disposed)throw Error(`Disposed material cannot be reused.`);this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}get version(){return this._version}get key(){return this._key}get values(){return this._values}setCustomShaderKey(e){this._customShaderKey!==e&&(this._customShaderKey=e,this.updateVersion(`pipeline`))}getShaderSource(e){return e===`Rect2D`?{vertex:this.rectVertexShader,fragment:this.rectFragmentShader}:e===`NGon2D`?{vertex:this.ngonVertexShader,fragment:this.ngonFragmentShader}:e===`Poly2D`||e===`Text`||e===`Base2D`?{vertex:this.polyVertexShader,fragment:this.polyFragmentShader}:{vertex:void 0,fragment:void 0}}updateVersion(e=`all`){let t=this._key;this._version++,this.updateKey();let n=Object.freeze({source:this,style:e===`all`||e===`style`,resources:e===`all`||e===`texture`||t!==this._key});for(let e of[...this._subscribers])e.onMaterialChange(n)}get transparent(){return this._transparent}set transparent(e){if(this._transparent!==e)this._transparent=e,this.updateVersion(`pipeline`);else return}get depthTest(){return this._depthTest}set depthTest(e){if(this._depthTest!==e)this._depthTest=e,this.updateVersion(`pipeline`);else return}get depthWrite(){return this._depthWrite}set depthWrite(e){if(this._depthWrite!==e)this._depthWrite=e,this.updateVersion(`pipeline`);else return}get cullMode(){return this._cullMode}set cullMode(e){if(this._cullMode!==e)this._cullMode=e,this.updateVersion(`pipeline`);else return}addGeometryType(e){let t;if(t=e===`Rect2D`?`rect`:e===`Poly2D`||e===`Text`?`poly`:e===`NGon2D`?`ngon`:e,!this._geometryTypes.has(t))this._geometryTypes.add(t),this.updateVersion(`pipeline`);else return}getPipelineKey(e){let t=this._pipelineKeys.get(e);if(t===void 0){let n=e;e===`Rect2D`?n=`rect`:e===`Poly2D`||e===`Text`||e===`Base2D`?n=`poly`:e===`NGon2D`&&(n=`ngon`),t=this.key+`_`+n,this._pipelineKeys.set(e,t)}return t}set rectVertexShader(e){if(this._shaders.rectVertexShader!==e)this._shaders.rectVertexShader=e,this.updateVersion(`pipeline`);else return}get rectVertexShader(){return this._shaders.rectVertexShader}set rectFragmentShader(e){if(this._shaders.rectFragmentShader!==e)this._shaders.rectFragmentShader=e,this.updateVersion(`pipeline`);else return}get rectFragmentShader(){return this._shaders.rectFragmentShader}get polyVertexShader(){return this._shaders.polyVertexShader}set polyVertexShader(e){if(this._shaders.polyVertexShader!==e)this._shaders.polyVertexShader=e,this.updateVersion(`pipeline`);else return}get polyFragmentShader(){return this._shaders.polyFragmentShader}set polyFragmentShader(e){if(this._shaders.polyFragmentShader!==e)this._shaders.polyFragmentShader=e,this.updateVersion(`pipeline`);else return}get ngonVertexShader(){return this._shaders.ngonVertexShader}set ngonVertexShader(e){if(this._shaders.ngonVertexShader!==e)this._shaders.ngonVertexShader=e,this.updateVersion(`pipeline`);else return}get ngonFragmentShader(){return this._shaders.ngonFragmentShader}set ngonFragmentShader(e){if(this._shaders.ngonFragmentShader!==e)this._shaders.ngonFragmentShader=e,this.updateVersion(`pipeline`);else return}updateKey(){let e=JSON.stringify([this.type,this._transparent,this._cullMode,this._depthTest,this._depthWrite,this._style.key,this._values?.schemaKey,this._customShaderKey,this._shaders.rectVertexShader,this._shaders.rectFragmentShader,this._shaders.polyVertexShader,this._shaders.polyFragmentShader,this._shaders.ngonVertexShader,this._shaders.ngonFragmentShader]);e!==this._key&&(this._key=e,this._pipelineKeys.clear())}},J=class{id=h();type=`TextureLayers`;_version=0;_layers=[];get version(){return this._version}get layers(){return this._layers}set(e){if(e.length!==this._layers.length||!e.every((e,t)=>e===this._layers[t])){for(let e of this._layers)e?.delete(this);this._layers=Object.freeze([...e]);for(let e of this._layers)e?.add(this);this._version++}else return}onTextureChange(e){this._layers.includes(e)&&this._version++}dispose(){this.set([])}},Y=class{id=h();type=`Texture`;_version=0;_subscribers=new Set;_url=null;_source=null;_loaded=!1;_width=0;_height=0;_videoChange;constructor(){this._videoChange=this.syncVideoState.bind(this)}get version(){return this._version}get url(){return this._url}set url(e){if(this._url!==e)this._url=e,this.updateVersion();else return}get source(){return this._source}set source(e){this._source!==e&&(e===null?this.clearSource():this.setSource(e,this._url))}get loaded(){return this._loaded}set loaded(e){if(this._loaded!==e)this._loaded=e,this.updateVersion();else return}get width(){return this._width}set width(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture width must be a non-negative integer.`);if(this._width!==e)this._width=e,this.updateVersion();else return}get height(){return this._height}set height(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture height must be a non-negative integer.`);if(this._height!==e)this._height=e,this.updateVersion();else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}updateVersion(){this._version++;for(let e of[...this._subscribers])e.onTextureChange(this)}setSource(e,t=null){return this.unbindVideoSource(),this._url=t,this._source=e,this._width=ht(e),this._height=gt(e),_t(e)?(this._loaded=vt(e),e.addEventListener(`loadedmetadata`,this._videoChange),e.addEventListener(`loadeddata`,this._videoChange),e.addEventListener(`resize`,this._videoChange),e.addEventListener(`emptied`,this._videoChange)):this._loaded=!0,this.updateVersion(),this}clearSource(){return this.unbindVideoSource(),this._url=null,this._source=null,this._loaded=!1,this._width=0,this._height=0,this.updateVersion(),this}unbindVideoSource(){let e=this._source;e!==null&&_t(e)&&(e.removeEventListener(`loadedmetadata`,this._videoChange),e.removeEventListener(`loadeddata`,this._videoChange),e.removeEventListener(`resize`,this._videoChange),e.removeEventListener(`emptied`,this._videoChange))}syncVideoState(){let e=this._source;if(e!==null&&_t(e)){let t=vt(e),n=e.videoWidth,r=e.videoHeight;(this._loaded!==t||this._width!==n||this._height!==r)&&(this._loaded=t,this._width=n,this._height=r,this.updateVersion())}}async load(e,t=`auto`){let n=t===`video`;if(t===`auto`&&(n=ft(e)),n){let t=await pt(e);return this.setSource(t,e)}{let t=await mt(e);return this.setSource(t,e)}}},ft=e=>{let t=/^data:video\//i.test(e),n=/\.(?:mp4|webm|ogg|ogv|mov|m4v|m3u8)(?:[?#]|$)/i.test(e);return t||n},pt=e=>new Promise((t,n)=>{let r=document.createElement(`video`);r.preload=`auto`,r.crossOrigin=`anonymous`;let i=()=>{r.removeEventListener(`loadeddata`,a),r.removeEventListener(`error`,o)},a=()=>{i(),t(r)},o=()=>{i(),n(Error(`Texture video load failed: ${e}`))};r.addEventListener(`loadeddata`,a),r.addEventListener(`error`,o),r.src=e}),mt=e=>new Promise((t,n)=>{let r=new Image;r.onload=()=>{t(r)},r.onerror=()=>{n(Error(`Texture load failed: ${e}`))},r.src=e}),ht=e=>`videoWidth`in e?e.videoWidth:`naturalWidth`in e?e.naturalWidth:e.width,gt=e=>`videoHeight`in e?e.videoHeight:`naturalHeight`in e?e.naturalHeight:e.height,_t=e=>`videoWidth`in e,vt=e=>e.readyState>=2&&e.videoWidth>0&&e.videoHeight>0,yt=class{_record={};_proxy=new Proxy(this._record,{set:this.setProxyValue.bind(this),deleteProperty:this.deleteProxyValue.bind(this)});_onChange;_version=0;_schemaKey=`[]`;constructor(e){this._onChange=e}setProxyValue(e,t,n){return typeof t==`string`&&(this.set(t,n),!0)}deleteProxyValue(e,t){return typeof t==`string`&&(this.delete(t),!0)}get value(){return this._proxy}set value(e){let t=this._schemaKey,n=this.textures,r=Object.entries(e);for(let[e,t]of r)this.validate(e,t);for(let e of Object.keys(this._record))Reflect.deleteProperty(this._record,e);for(let[e,t]of r)this._record[e]=t;this.commit(t,n)}get version(){return this._version}get schemaKey(){return this._schemaKey}get entries(){let e=0,t=[];for(let n of Object.keys(this._record).sort()){let r=this._record[n],i=this.getKind(r);t.push({name:n,value:r,kind:i,binding:e}),e+=i===`texture`?2:1}return t}get textures(){let e=[];for(let t of Object.values(this._record))t instanceof Y&&e.push(t);return e}get declarations(){let e=[];for(let t of this.entries){let n=`value_`+t.name,r=String(t.binding);t.kind===`texture`?(e.push(`@group(2) @binding(${r}) var ${n}: texture_2d_array<f32>;`),e.push(`@group(2) @binding(${String(t.binding+1)}) var valueSampler_${t.name}: sampler;`)):t.kind===`array<f32>`?e.push(`@group(2) @binding(${r}) var<storage, read> ${n}: array<f32>;`):e.push(`@group(2) @binding(${r}) var<uniform> ${n}: ${t.kind};`)}return e.join(`
`)}set(e,t){if(this.validate(e,t),this._record[e]!==t){let n=this._schemaKey,r=this.textures;this._record[e]=t,this.commit(n,r)}}delete(e){if(Object.hasOwn(this._record,e)){let t=this._schemaKey,n=this.textures;Reflect.deleteProperty(this._record,e),this.commit(t,n)}}touch(e){if(Object.hasOwn(this._record,e))this._version++;else throw RangeError(`Unknown shader value: `+e)}getBufferData(e){if(typeof e.value==`number`)return new Float32Array([e.value]);if(e.value instanceof c)return new Float32Array([e.value.x,e.value.y]);if(e.value instanceof l)return e.value.GPUData;if(e.value instanceof Float32Array)return new Float32Array(e.value);throw TypeError(`Texture values do not have numeric GPUBuffer data.`)}getKind(e){return typeof e==`number`?`f32`:e instanceof c?`vec2f`:e instanceof l?`mat3x3f`:e instanceof Float32Array?`array<f32>`:`texture`}validate(e,t){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(e))throw TypeError(`Shader value names must be WGSL-safe identifiers.`);if(typeof t==`number`){if(!Number.isFinite(t))throw RangeError(`Shader numbers must be finite.`)}else if(t instanceof Float32Array&&t.length===0)throw RangeError(`Shader arrays must contain at least one float.`);if(!(t instanceof c)&&!(t instanceof l)&&!(t instanceof Y)&&typeof t!=`number`&&!(t instanceof Float32Array))throw TypeError(`Shader values support number, Vec2, Mat3, Float32Array, and Texture.`)}commit(e,t){let n=e=>[e.name,e.kind];this._schemaKey=JSON.stringify(this.entries.map(n)),this._version++;let r=this.textures,i=t.length!==r.length||t.some((e,t)=>e!==r[t]);this._onChange(e!==this._schemaKey,i)}},bt=`// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    // WebGPU 自动提供实例编号；普通 Mesh 只绘制一次，因此为 0。
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
    // 当前为二维轮廓外法线，先接入顶点管线供后续边框与特效使用。
    @location(2) normal: vec2f,
    @location(3) miterScale: f32,
    // 关键点所属中心，其他类型填零。
    @location(4) center: vec2f,
    @location(5) vertexType: f32,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct GeometryUniform {
    outer: f32,
    inner: f32,
    sides: f32,
    borderWidth: f32,
};

// 每个 Mesh 的世界矩阵。
// 前两列的 w 存局部锚点；其余布局仍与 48 字节 Mat3 一致。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x4<f32>>;
// 当前相机的视图矩阵。
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
// 当前相机的正交投影矩阵。
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;
// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 NGon 的外半径、内半径、边数和实体边框宽度。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// BaseMaterial 实例样式，边框和点型可独立显示。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    // 原样传给片段阶段，禁止在三角面内插值。
    @location(3) @interpolate(flat) instanceIndex: u32,
};

// 正多边形/圆环已生成真实三角面；内孔没有顶点面覆盖，不用矩形 SDF 或片段 discard 挖孔。
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>, localAnchor: vec2f) -> VertexOutput {
    let localPosition = vec3f(input.position - localAnchor, 1.0);
    let clipPosition = orthogonalMatrix * viewMatrix * modelMatrix * localPosition;
    var output: VertexOutput;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.instanceIndex = resolvedIndex;
    output.vertexType = 0.0;
    output.uv = input.uv;
    output.localPosition = input.position;
    return output;
}

// 宽边框使用逆转置变换法线，避免非等比缩放影响屏幕宽度。
fn getViewNormal(localNormal: vec2f, modelViewMatrix: mat3x3<f32>) -> vec2f {
    let a = modelViewMatrix[0].x;
    let b = modelViewMatrix[0].y;
    let c = modelViewMatrix[1].x;
    let d = modelViewMatrix[1].y;
    let determinant = a * d - b * c;
    let determinantSign = select(-1.0, 1.0, determinant >= 0.0);
    let transformedNormal = vec2f(
        d * localNormal.x - b * localNormal.y,
        -c * localNormal.x + a * localNormal.y,
    ) * determinantSign;
    let normalLength = length(transformedNormal);
    let safeNormalLength = max(normalLength, 1e-30);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let packedModel = modelMatrices[resolvedIndex];
    let modelMatrix = mat3x3f(packedModel[0].xyz, packedModel[1].xyz, packedModel[2].xyz);
    let localAnchor = vec2f(packedModel[0].w, packedModel[1].w);
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix, localAnchor);
    }

    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    output.vertexType = input.vertexType;
    output.uv = input.uv;
    // 同一个三角面的三个顶点类型一致，关闭某类时让整面退化到裁剪区外。
    if ((input.vertexType == 0.0 && materialUniform.enabled.x == 0.0)
        || (input.vertexType == 0.5 && materialUniform.enabled.z == 0.0)
        || (input.vertexType == 1.0 && materialUniform.enabled.w == 0.0)) {
        output.position = vec4f(2.0, 2.0, 0.0, 1.0);
        return output;
    }

    let modelViewMatrix = viewMatrix * modelMatrix;
    let safeZoom = max(abs(renderCameraUniform.zoom), 1e-30);
    let ignoreZoom = materialUniform.points.z != 0.0;
    let sectionAlignment = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    // 固定尺寸 Mesh 的关键点和宽边框也必须保持像素尺寸。
    let pixelAligned = select(sectionAlignment, 0.0, ignoreZoom);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position - localAnchor, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        let textureZoom = select(safeZoom, 1.0, ignoreZoom);
        output.uv.x *= mix(textureZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center - localAnchor, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,xt=`// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    // WebGPU 自动提供实例编号；普通 Mesh 只绘制一次，因此为 0。
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
    // 当前为二维轮廓外法线，先接入顶点管线供后续边框与特效使用。
    @location(2) normal: vec2f,
    @location(3) miterScale: f32,
    // 关键点所属中心，其他类型填零。
    @location(4) center: vec2f,
    @location(5) vertexType: f32,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    borderWidth: f32,
};

// 每个 Mesh 的世界矩阵。
// 前两列的 w 存局部锚点；其余布局仍与 48 字节 Mat3 一致。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x4<f32>>;
// 当前相机的视图矩阵。
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
// 当前相机的正交投影矩阵。
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;
// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的包围盒宽高、保留项与边框宽度。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// BaseMaterial 实例样式，边框和点型可独立显示。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    // 原样传给片段阶段，禁止在三角面内插值。
    @location(3) @interpolate(flat) instanceIndex: u32,
};

// 多边形实体已完成三角剖分，直接变换顶点，不按矩形宽高做 SDF 外扩。
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>, localAnchor: vec2f) -> VertexOutput {
    let localPosition = vec3f(input.position - localAnchor, 1.0);
    let clipPosition = orthogonalMatrix * viewMatrix * modelMatrix * localPosition;
    var output: VertexOutput;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.instanceIndex = resolvedIndex;
    output.vertexType = 0.0;
    output.uv = input.uv;
    output.localPosition = input.position;
    return output;
}

// 宽边框使用逆转置变换法线，避免非等比缩放影响屏幕宽度。
fn getViewNormal(localNormal: vec2f, modelViewMatrix: mat3x3<f32>) -> vec2f {
    let a = modelViewMatrix[0].x;
    let b = modelViewMatrix[0].y;
    let c = modelViewMatrix[1].x;
    let d = modelViewMatrix[1].y;
    let determinant = a * d - b * c;
    let determinantSign = select(-1.0, 1.0, determinant >= 0.0);
    let transformedNormal = vec2f(
        d * localNormal.x - b * localNormal.y,
        -c * localNormal.x + a * localNormal.y,
    ) * determinantSign;
    let normalLength = length(transformedNormal);
    let safeNormalLength = max(normalLength, 1e-30);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let packedModel = modelMatrices[resolvedIndex];
    let modelMatrix = mat3x3f(packedModel[0].xyz, packedModel[1].xyz, packedModel[2].xyz);
    let localAnchor = vec2f(packedModel[0].w, packedModel[1].w);
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix, localAnchor);
    }

    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    output.vertexType = input.vertexType;
    output.uv = input.uv;
    // 同一个三角面的三个顶点类型一致，关闭某类时让整面退化到裁剪区外。
    if ((input.vertexType == 0.0 && materialUniform.enabled.x == 0.0)
        || (input.vertexType == 0.5 && materialUniform.enabled.z == 0.0)
        || (input.vertexType == 1.0 && materialUniform.enabled.w == 0.0)) {
        output.position = vec4f(2.0, 2.0, 0.0, 1.0);
        return output;
    }

    let modelViewMatrix = viewMatrix * modelMatrix;
    let safeZoom = max(abs(renderCameraUniform.zoom), 1e-30);
    let ignoreZoom = materialUniform.points.z != 0.0;
    let sectionAlignment = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    // 固定尺寸 Mesh 的关键点和宽边框也必须保持像素尺寸。
    let pixelAligned = select(sectionAlignment, 0.0, ignoreZoom);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position - localAnchor, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        let textureZoom = select(safeZoom, 1.0, ignoreZoom);
        output.uv.x *= mix(textureZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center - localAnchor, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,St=`
// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    // WebGPU 自动提供实例编号；普通 Mesh 只绘制一次，因此为 0。
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
    // 当前为二维轮廓外法线，先接入顶点管线供后续边框与特效使用。
    @location(2) normal: vec2f,
    @location(3) miterScale: f32,
    // 关键点所属中心，其他类型填零。
    @location(4) center: vec2f,
    @location(5) vertexType: f32,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    borderWidth: f32,
};

// 每个 Mesh 的世界矩阵。
// 前两列的 w 存局部锚点；其余布局仍与 48 字节 Mat3 一致。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x4<f32>>;
// 当前相机的视图矩阵。
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
// 当前相机的正交投影矩阵。
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;
// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的宽度、高度与圆角参数。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// BaseMaterial 参数，顶点阶段后续使用边框宽度和对齐方式扩大承载顶点。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    // 原样传给片段阶段，禁止在三角面内插值。
    @location(3) @interpolate(flat) instanceIndex: u32,
};

// 实体面保留原有矩形 SDF 承载区域扩展逻辑。
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>, localAnchor: vec2f, materialUniform: MaterialUniform) -> VertexOutput {
    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    // Camera 视口已使用乘过 DPR 的画布尺寸，borderWidth 直接按画布像素处理。
    // 除以 Zoom 后，边框在相机缩放时仍保持固定的屏幕像素宽度。
    // 固定尺寸矩形已抵消模型缩放，SDF 在其局部尺寸中直接使用边框宽度。
    let cameraZoom = max(abs(renderCameraUniform.zoom), 1e-30);
    let safeZoom = select(cameraZoom, 1.0, materialUniform.points.z != 0.0);
    let borderZoomScale = mix(1.0 / safeZoom, 1.0, materialUniform.solid.w);
    let outward = materialUniform.solid.y
        * materialUniform.solid.z
        * borderZoomScale;
    let safeWidth = max(abs(geometryUniform.width), 0.000001);
    let safeHeight = max(abs(geometryUniform.height), 0.000001);
    let hasRectSize = geometryUniform.width > 0.0 && geometryUniform.height > 0.0;
    let scaleX = select(1.0, 1.0 + outward * 2.0 / safeWidth, hasRectSize);
    let scaleY = select(1.0, 1.0 + outward * 2.0 / safeHeight, hasRectSize);
    let borderScaleMatrix = mat3x3f(
        scaleX, 0.0, 0.0,
        0.0, scaleY, 0.0,
        0.0, 0.0, 1.0,
    );
    let localPosition = borderScaleMatrix * vec3f(input.position, 1.0);
    let worldPosition = modelMatrix * vec3f(localPosition.xy - localAnchor, 1.0);
    let viewPosition = viewMatrix * worldPosition;
    let clipPosition = orthogonalMatrix * viewPosition;

    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.uv = input.uv;
    // 片元阶段使用放大后的局部坐标计算原矩形内外边界。
    output.localPosition = localPosition.xy;

    return output;
}

// 宽边框使用逆转置变换法线，避免非等比缩放影响屏幕宽度。
fn getViewNormal(localNormal: vec2f, modelViewMatrix: mat3x3<f32>) -> vec2f {
    let a = modelViewMatrix[0].x;
    let b = modelViewMatrix[0].y;
    let c = modelViewMatrix[1].x;
    let d = modelViewMatrix[1].y;
    let determinant = a * d - b * c;
    let determinantSign = select(-1.0, 1.0, determinant >= 0.0);
    let transformedNormal = vec2f(
        d * localNormal.x - b * localNormal.y,
        -c * localNormal.x + a * localNormal.y,
    ) * determinantSign;
    let normalLength = length(transformedNormal);
    let safeNormalLength = max(normalLength, 1e-30);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let packedModel = modelMatrices[resolvedIndex];
    let modelMatrix = mat3x3f(packedModel[0].xyz, packedModel[1].xyz, packedModel[2].xyz);
    let localAnchor = vec2f(packedModel[0].w, packedModel[1].w);
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix, localAnchor, materialUniform);
    }

    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    output.vertexType = input.vertexType;
    output.uv = input.uv;
    // 同一个三角面的三个顶点类型一致，关闭某类时让整面退化到裁剪区外。
    if ((input.vertexType == 0.0 && materialUniform.enabled.x == 0.0)
        || (input.vertexType == 0.5 && materialUniform.enabled.z == 0.0)
        || (input.vertexType == 1.0 && materialUniform.enabled.w == 0.0)) {
        output.position = vec4f(2.0, 2.0, 0.0, 1.0);
        return output;
    }

    let modelViewMatrix = viewMatrix * modelMatrix;
    let safeZoom = max(abs(renderCameraUniform.zoom), 1e-30);
    let ignoreZoom = materialUniform.points.z != 0.0;
    let sectionAlignment = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    // 固定尺寸 Mesh 的关键点和宽边框也必须保持像素尺寸。
    let pixelAligned = select(sectionAlignment, 0.0, ignoreZoom);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position - localAnchor, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        let textureZoom = select(safeZoom, 1.0, ignoreZoom);
        output.uv.x *= mix(textureZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center - localAnchor, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,Ct=class extends dt{type=`WGSLMaterial`;raw;constructor(e){super(e);let t=(e,t)=>{e&&this.updateVersion(`pipeline`),t&&!e&&this.updateVersion(`texture`)},n=()=>{let e=JSON.stringify([this.raw.vertexShader,this.raw.fragmentShader]);this.setCustomShaderKey(e)};this._values=new yt(t),this.raw=new wt(this._values,n),this.rectVertexShader=St,this.polyVertexShader=xt,this.ngonVertexShader=bt,this.setCustomShaderKey(JSON.stringify([``,``]))}getShaderSource(e){let t=super.getShaderSource(e),n=this._values?.declarations??``,r=t.vertex;this.raw.vertexShader!==``&&(r=n+`
`+this.raw.vertexShader);let i=Tt;return this.raw.fragmentShader!==``&&(i=this.raw.fragmentShader),{vertex:r,fragment:n+`
`+i}}},wt=class{_vertexShader=``;_fragmentShader=``;_values;_onShaderChange;constructor(e,t){this._values=e,this._onShaderChange=t}get vertexShader(){return this._vertexShader}set vertexShader(e){this._vertexShader!==e&&(this._vertexShader=e,this._onShaderChange())}get fragmentShader(){return this._fragmentShader}set fragmentShader(e){this._fragmentShader!==e&&(this._fragmentShader=e,this._onShaderChange())}get value(){return this._values.value}set value(e){this._values.value=e}touchValue(e){this._values.touch(e)}},Tt=`@fragment fn main() -> @location(0) vec4f { return vec4f(1.0); }`,Et=new WeakMap,Dt=(e,t)=>e>65536?new Uint32Array(t):new Uint16Array(t),Ot=(e,t,n,r,i,a)=>{let o=0,s=0;return t.textAlign===`left`?o=e.minX:t.textAlign===`right`&&(o=e.minX+e.width),t.baseline===`top`?s=e.minY+e.height:t.baseline===`bottom`&&(s=e.minY),{geometry:new Float32Array(n),normal:new Float32Array(r),uv:new Float32Array(i),index:Dt(n.length/2,a),width:e.width,height:e.height,minX:e.minX,minY:e.minY,advanceWidth:e.advanceWidth,anchorX:o,anchorY:s,...t}},kt=(e,t)=>{let n=.5,r=.5;return t.width>0&&(n=(e[0]-t.minX)/t.width),t.height>0&&(r=(e[1]-t.minY)/t.height),[n,r]},At=(e,t)=>{let n=[],r=[],i=[],a=[],o=new Map,s=new Map;for(let t of e.contours)for(let e=0;e<t.length;e+=1){let n=t[e],r=Mt(t,e),i=String(n[0])+`,`+String(n[1]);s.set(i,[r[0],r[1]])}let c=t=>{let a=String(t[0])+`,`+String(t[1]),c=o.get(a);if(c===void 0){let c=n.length/2,l=kt(t,e),u=s.get(a)??[0,0];return n.push(t[0],t[1]),r.push(u[0],u[1]),i.push(l[0],l[1]),o.set(a,c),c}return c};for(let t=0;t+2<e.triangles.length;t+=3){let n=e.triangles[t],r=e.triangles[t+1],i=e.triangles[t+2],o=(r[0]-n[0])*(i[1]-n[1])-(r[1]-n[1])*(i[0]-n[0]);if(Math.abs(o)>1e-12){let e=c(n),t=c(r),s=c(i);o>0?a.push(e,s,t):a.push(e,t,s)}}return Ot(e,t,n,r,i,a)},jt=(e,t)=>{let n=Et.get(e);n===void 0&&(n=At(e,t),n.geometry.byteLength+n.normal.byteLength+n.uv.byteLength+n.index.byteLength<=8388608&&Et.set(e,n));let r=0;return t.baseline===`top`?r=e.minY+e.height:t.baseline===`bottom`&&(r=e.minY),{...n,...t,anchorY:r,geometry:n.geometry.slice(),normal:n.normal.slice(),uv:n.uv.slice(),index:n.index.slice()}},Mt=(e,t)=>{let n=e[(t+e.length-1)%e.length],r=e[t],i=e[(t+1)%e.length],a=r[0]-n[0],o=r[1]-n[1],s=i[0]-r[0],c=i[1]-r[1],l=Math.hypot(a,o),u=Math.hypot(s,c);if(l===0||u===0)return[0,0,0];{let e=o/l,t=-a/l,n=c/u,r=-s/u,i=e+n,d=t+r,f=Math.hypot(i,d);if(f<=1e-6)return[n,r,1];{let e=i/f,t=d/f,a=e*n+t*r;return[e,t,Math.min(8,1/Math.max(a,1e-6))]}}},Nt=e=>{let t=[0],n=0;for(let r=0;r<e.length;r+=1){let i=e[r],a=e[(r+1)%e.length];n+=Math.hypot(a[0]-i[0],a[1]-i[1]),t.push(n)}return{distances:t,length:n}},Pt=(e,t,n)=>{let r=[],i=[],a=[],o=[];for(let t of e.contours){let e=r.length/2,s=Nt(t);for(let c=0;c<=t.length;c+=1){let l=c%t.length,u=t[l],d=Mt(t,l);r.push(u[0],u[1]),i.push(d[0],d[1]);let f=0;s.length>0&&(f=s.distances[c]/s.length*n),a.push(f,.5),c<t.length&&o.push(e+c,e+c+1)}}return{...Ot(e,t,r,i,a,o),uvRepeat:n}},Ft=(e,t,n,r,i)=>{let a=[],o=[],s=[],c=[],l=[];for(let t of e.contours){let e=a.length/2,n=Nt(t);for(let i=0;i<=t.length;i+=1){let u=i%t.length,d=t[u],f=Mt(t,u),p=0;if(n.length>0&&(p=n.distances[i]/n.length*r),a.push(d[0],d[1],d[0],d[1]),o.push(f[0],f[1],f[0],f[1]),s.push(f[2],f[2]),c.push(p,0,p,1),i<t.length){let t=e+i*2,n=t+1,r=t+2,a=t+3;l.push(t,a,n,t,r,a)}}}return{...Ot(e,t,a,o,c,l),miterScale:new Float32Array(s),lineWidth:n,uvRepeat:r,align:i}},It=(e,t,n,r,i)=>{let a=[];for(let o of e.contours)for(let e=0;e<o.length;e+=1){let s=o[(e+o.length-1)%o.length],c=o[e],l=o[(e+1)%o.length],u=Math.hypot(c[0]-s[0],c[1]-s[1]),d=Math.hypot(l[0]-c[0],l[1]-c[1]);t&&u+d>r&&a.push(c),n&&d>i&&a.push([(c[0]+l[0])*.5,(c[1]+l[1])*.5])}return a},Lt=(e,t,n,r,i,a,o,s)=>{let c=It(e,i,a,o,s),l=[],u=[],d=[],f=[],p=[];for(let e of c){let t=l.length/2;l.push(e[0],e[1]),u.push(e[0],e[1]),d.push(0,0),f.push(.5,.5);for(let i=0;i<r;i+=1){let a=Math.PI*.5-i*Math.PI*2/r,o=Math.cos(a),s=Math.sin(a);if(r===4){let e=[[1,1],[1,-1],[-1,-1],[-1,1]];o=e[i][0],s=e[i][1]}let c=Math.hypot(o,s);l.push(e[0]+o*n,e[1]+s*n),u.push(e[0],e[1]),d.push(o/c,s/c),f.push(o*.5+.5,s*.5+.5),p.push(t,t+i+1,t+(i+1)%r+1)}}return{...Ot(e,t,l,d,f,p),position:new Float32Array(u),pointRadius:n,sides:r,pointCount:c.length}},Rt=class{_entries=new Map;_bytes=0;hits=0;misses=0;get(e){let t=this._entries.get(e);if(t)return this.hits+=1,this._entries.delete(e),this._entries.set(e,t),t.value;this.misses+=1}set(e,t,n){let r=this._entries.get(e);if(r!==void 0&&(this._entries.delete(e),this._bytes-=r.bytes),n<=16777216){for(;this._entries.size>=64||this._bytes+n>16777216;){let e=this._entries.entries().next().value;e!==void 0&&(this._entries.delete(e[0]),this._bytes-=e[1].bytes)}this._entries.set(e,{value:t,bytes:n}),this._bytes+=n}}clear(){this._entries.clear(),this._bytes=0,this.hits=0,this.misses=0}get bytes(){return this._bytes}},zt=(()=>{var e=import.meta.url;return(function(t={}){var n,r=t,i,a,o=new Promise((e,t)=>{i=e,a=t}),s=typeof window==`object`,c=typeof importScripts==`function`;typeof process==`object`&&typeof process.versions==`object`&&typeof process.versions.node==`string`&&process.type;var l=Object.assign({},r),u=`./this.program`,d=``;function f(e){return r.locateFile?r.locateFile(e,d):d+e}var p,m;(s||c)&&(c?d=self.location.href:typeof document<`u`&&document.currentScript&&(d=document.currentScript.src),e&&(d=e),d=d.startsWith(`blob:`)?``:d.substr(0,d.replace(/[?#].*/,``).lastIndexOf(`/`)+1),c&&(m=e=>{var t=new XMLHttpRequest;return t.open(`GET`,e,!1),t.responseType=`arraybuffer`,t.send(null),new Uint8Array(t.response)}),p=e=>fetch(e,{credentials:`same-origin`}).then(e=>e.ok?e.arrayBuffer():Promise.reject(Error(e.status+` : `+e.url))));var h=r.print||console.log.bind(console),g=r.printErr||console.error.bind(console);Object.assign(r,l),l=null,r.arguments&&r.arguments,r.thisProgram&&(u=r.thisProgram);var _=r.wasmBinary,v,y=!1,b,x,S;function ee(){var e=v.buffer;r.HEAP8=b=new Int8Array(e),r.HEAP16=new Int16Array(e),r.HEAPU8=x=new Uint8Array(e),r.HEAPU16=new Uint16Array(e),r.HEAP32=new Int32Array(e),r.HEAPU32=S=new Uint32Array(e),r.HEAPF32=new Float32Array(e),r.HEAPF64=new Float64Array(e)}var te=[],ne=[],re=[];function C(){var e=r.preRun;e&&(typeof e==`function`&&(e=[e]),e.forEach(oe)),A(te)}function ie(){A(ne)}function ae(){var e=r.postRun;e&&(typeof e==`function`&&(e=[e]),e.forEach(w)),A(re)}function oe(e){te.unshift(e)}function se(e){ne.unshift(e)}function w(e){re.unshift(e)}var T=0,ce=null,E=null;function le(e){T++,r.monitorRunDependencies?.(T)}function ue(e){if(T--,r.monitorRunDependencies?.(T),T==0&&(ce!==null&&(clearInterval(ce),ce=null),E)){var t=E;E=null,t()}}function de(e){r.onAbort?.(e),e=`Aborted(`+e+`)`,g(e),y=!0,e+=`. Build with -sASSERTIONS for more info.`;var t=new WebAssembly.RuntimeError(e);throw a(t),t}var fe=`data:application/octet-stream;base64,`,pe=e=>e.startsWith(fe);function D(){if(r.locateFile){var e=`TextWasm.wasm`;return pe(e)?e:f(e)}return new URL(new URL(`TextWasm-CzLEc6sI.wasm`,import.meta.url).href,``+import.meta.url).href}var O;function me(e){if(e==O&&_)return new Uint8Array(_);if(m)return m(e);throw`both async and sync fetching of the wasm failed`}function he(e){return _?Promise.resolve().then(()=>me(e)):p(e).then(e=>new Uint8Array(e),()=>me(e))}function ge(e,t,n){return he(e).then(e=>WebAssembly.instantiate(e,t)).then(n,e=>{g(`failed to asynchronously prepare wasm: ${e}`),de(e)})}function _e(e,t,n,r){return!e&&typeof WebAssembly.instantiateStreaming==`function`&&!pe(t)&&typeof fetch==`function`?fetch(t,{credentials:`same-origin`}).then(e=>WebAssembly.instantiateStreaming(e,n).then(r,function(e){return g(`wasm streaming compile failed: ${e}`),g(`falling back to ArrayBuffer instantiation`),ge(t,n,r)})):ge(t,n,r)}function ve(){return{env:V,wasi_snapshot_preview1:V}}function k(){var e=ve();function t(e,t){return H=e.exports,v=H.memory,ee(),Ke=H.__indirect_function_table,se(H.__wasm_call_ctors),ue(`wasm-instantiate`),H}le(`wasm-instantiate`);function n(e){t(e.instance)}if(r.instantiateWasm)try{return r.instantiateWasm(e,t)}catch(e){g(`Module.instantiateWasm callback failed with error: ${e}`),a(e)}return O??=D(),_e(_,O,e,n).catch(a),{}}var A=e=>{e.forEach(e=>e(r))};r.noExitRuntime;var j=e=>K(e),M=()=>rt(),ye=[],be=0,xe=e=>{var t=new Ce(e);return t.get_caught()||(t.set_caught(!0),be--),t.set_rethrown(!1),ye.push(t),it(e),st(e)},N=0,Se=()=>{W(0,0);var e=ye.pop();at(e.excPtr),N=0};class Ce{constructor(e){this.excPtr=e,this.ptr=e-24}set_type(e){S[this.ptr+4>>2]=e}get_type(){return S[this.ptr+4>>2]}set_destructor(e){S[this.ptr+8>>2]=e}get_destructor(){return S[this.ptr+8>>2]}set_caught(e){e=+!!e,b[this.ptr+12]=e}get_caught(){return b[this.ptr+12]!=0}set_rethrown(e){e=+!!e,b[this.ptr+13]=e}get_rethrown(){return b[this.ptr+13]!=0}init(e,t){this.set_adjusted_ptr(0),this.set_type(e),this.set_destructor(t)}set_adjusted_ptr(e){S[this.ptr+16>>2]=e}get_adjusted_ptr(){return S[this.ptr+16>>2]}}var P=e=>{throw N||=e,N},F=e=>G(e),we=e=>{var t=N;if(!t)return F(0),0;var n=new Ce(t);n.set_adjusted_ptr(t);var r=n.get_type();if(!r)return F(0),t;for(var i of e){if(i===0||i===r)break;var a=n.ptr+16;if(ot(i,r,a))return F(i),t}return F(r),t},Te=()=>we([]),Ee=e=>we([e]),De=(e,t,n)=>{throw new Ce(e).init(t,n),N=e,be++,N},Oe=()=>{de(``)},ke=(e,t,n)=>x.copyWithin(e,t,t+n),Ae=()=>536870912,je=(e,t)=>Math.ceil(e/t)*t,I=e=>{var t=(e-v.buffer.byteLength+65535)/65536|0;try{return v.grow(t),ee(),1}catch{}},Me=e=>{var t=x.length;e>>>=0;var n=Ae();if(e>n)return!1;for(var r=1;r<=4;r*=2){var i=t*(1+.2/r);if(i=Math.min(i,e+100663296),I(Math.min(n,je(Math.max(e,i),65536))))return!0}return!1},L={},Ne=()=>u||`./this.program`,R=()=>{if(!R.strings){var e={USER:`web_user`,LOGNAME:`web_user`,PATH:`/`,PWD:`/`,HOME:`/home/web_user`,LANG:(typeof navigator==`object`&&navigator.languages&&navigator.languages[0]||`C`).replace(`-`,`_`)+`.UTF-8`,_:Ne()};for(var t in L)L[t]===void 0?delete e[t]:e[t]=L[t];var n=[];for(var t in e)n.push(`${t}=${e[t]}`);R.strings=n}return R.strings},Pe=(e,t)=>{for(var n=0;n<e.length;++n)b[t++]=e.charCodeAt(n);b[t]=0},Fe=(e,t)=>{var n=0;return R().forEach((r,i)=>{var a=t+n;S[e+i*4>>2]=a,Pe(r,a),n+=r.length+1}),0},Ie=(e,t)=>{var n=R();S[e>>2]=n.length;var r=0;return n.forEach(e=>r+=e.length+1),S[t>>2]=r,0},Le=e=>52,Re=(e,t)=>t+2097152>>>0<4194305-!!e?(e>>>0)+t*4294967296:NaN;function ze(e,t,n,r,i){return Re(t,n),70}var Be=[null,[],[]],Ve=typeof TextDecoder<`u`?new TextDecoder:void 0,He=(e,t=0,n=NaN)=>{for(var r=t+n,i=t;e[i]&&!(i>=r);)++i;if(i-t>16&&e.buffer&&Ve)return Ve.decode(e.subarray(t,i));for(var a=``;t<i;){var o=e[t++];if(!(o&128)){a+=String.fromCharCode(o);continue}var s=e[t++]&63;if((o&224)==192){a+=String.fromCharCode((o&31)<<6|s);continue}var c=e[t++]&63;if(o=(o&240)==224?(o&15)<<12|s<<6|c:(o&7)<<18|s<<12|c<<6|e[t++]&63,o<65536)a+=String.fromCharCode(o);else{var l=o-65536;a+=String.fromCharCode(55296|l>>10,56320|l&1023)}}return a},Ue=(e,t)=>{var n=Be[e];t===0||t===10?((e===1?h:g)(He(n)),n.length=0):n.push(t)},We=(e,t,n,r)=>{for(var i=0,a=0;a<n;a++){var o=S[t>>2],s=S[t+4>>2];t+=8;for(var c=0;c<s;c++)Ue(e,x[o+c]);i+=s}return S[r>>2]=i,0},Ge=e=>e,z=[],Ke,B=e=>{var t=z[e];return t||(e>=z.length&&(z.length=e+1),z[e]=t=Ke.get(e)),t},V={__cxa_begin_catch:xe,__cxa_end_catch:Se,__cxa_find_matching_catch_2:Te,__cxa_find_matching_catch_3:Ee,__cxa_throw:De,__resumeException:P,_abort_js:Oe,_emscripten_memcpy_js:ke,emscripten_resize_heap:Me,environ_get:Fe,environ_sizes_get:Ie,fd_close:Le,fd_seek:ze,fd_write:We,invoke_fiiiiii:Mt,invoke_i:_t,invoke_ii:q,invoke_iii:Y,invoke_iiid:bt,invoke_iiif:kt,invoke_iiii:ft,invoke_iiiii:mt,invoke_iiiiii:gt,invoke_iiiiiii:Ct,invoke_iiiiiiii:Tt,invoke_iiiiiiiii:Et,invoke_iiiiiiiiii:Nt,invoke_iiiiiiiiiiiiiiiii:Pt,invoke_v:dt,invoke_vi:J,invoke_vii:vt,invoke_viid:St,invoke_viiddd:xt,invoke_viiffffffi:At,invoke_viiffffi:Ft,invoke_viii:ht,invoke_viiiffi:Dt,invoke_viiii:pt,invoke_viiiii:yt,invoke_viiiiiii:wt,invoke_viiiiiiii:Ot,invoke_viiiiiiiiiii:jt,llvm_eh_typeid_for:Ge},H=k(),qe=r._text_register=(e,t)=>(qe=r._text_register=H.text_register)(e,t),Je=r._text_unregister=e=>(Je=r._text_unregister=H.text_unregister)(e),Ye=r._text_shape=(e,t,n)=>(Ye=r._text_shape=H.text_shape)(e,t,n),Xe=r._text_mesh=(e,t,n,i,a,o,s,c)=>(Xe=r._text_mesh=H.text_mesh)(e,t,n,i,a,o,s,c),Ze=r._text_stats=e=>(Ze=r._text_stats=H.text_stats)(e),Qe=r._text_clear=e=>(Qe=r._text_clear=H.text_clear)(e),$e=r._text_result_data=()=>($e=r._text_result_data=H.text_result_data)(),et=r._text_result_size=()=>(et=r._text_result_size=H.text_result_size)(),tt=r._text_error=()=>(tt=r._text_error=H.text_error)(),nt=r._free=e=>(nt=r._free=H.free)(e),U=r._malloc=e=>(U=r._malloc=H.malloc)(e),W=(e,t)=>(W=H.setThrew)(e,t),G=e=>(G=H._emscripten_tempret_set)(e),K=e=>(K=H._emscripten_stack_restore)(e),rt=()=>(rt=H.emscripten_stack_get_current)(),it=e=>(it=H.__cxa_increment_exception_refcount)(e),at=e=>(at=H.__cxa_decrement_exception_refcount)(e),ot=(e,t,n)=>(ot=H.__cxa_can_catch)(e,t,n),st=e=>(st=H.__cxa_get_exception_ptr)(e),ct=r.dynCall_iiiji=(e,t,n,i,a,o)=>(ct=r.dynCall_iiiji=H.dynCall_iiiji)(e,t,n,i,a,o),lt=r.dynCall_jiii=(e,t,n,i)=>(lt=r.dynCall_jiii=H.dynCall_jiii)(e,t,n,i),ut=r.dynCall_jiji=(e,t,n,i,a)=>(ut=r.dynCall_jiji=H.dynCall_jiji)(e,t,n,i,a);function q(e,t){var n=M();try{return B(e)(t)}catch(e){if(j(n),e!==e+0)throw e;W(1,0)}}function dt(e){var t=M();try{B(e)()}catch(e){if(j(t),e!==e+0)throw e;W(1,0)}}function J(e,t){var n=M();try{B(e)(t)}catch(e){if(j(n),e!==e+0)throw e;W(1,0)}}function Y(e,t,n){var r=M();try{return B(e)(t,n)}catch(e){if(j(r),e!==e+0)throw e;W(1,0)}}function ft(e,t,n,r){var i=M();try{return B(e)(t,n,r)}catch(e){if(j(i),e!==e+0)throw e;W(1,0)}}function pt(e,t,n,r,i){var a=M();try{B(e)(t,n,r,i)}catch(e){if(j(a),e!==e+0)throw e;W(1,0)}}function mt(e,t,n,r,i){var a=M();try{return B(e)(t,n,r,i)}catch(e){if(j(a),e!==e+0)throw e;W(1,0)}}function ht(e,t,n,r){var i=M();try{B(e)(t,n,r)}catch(e){if(j(i),e!==e+0)throw e;W(1,0)}}function gt(e,t,n,r,i,a){var o=M();try{return B(e)(t,n,r,i,a)}catch(e){if(j(o),e!==e+0)throw e;W(1,0)}}function _t(e){var t=M();try{return B(e)()}catch(e){if(j(t),e!==e+0)throw e;W(1,0)}}function vt(e,t,n){var r=M();try{B(e)(t,n)}catch(e){if(j(r),e!==e+0)throw e;W(1,0)}}function yt(e,t,n,r,i,a){var o=M();try{B(e)(t,n,r,i,a)}catch(e){if(j(o),e!==e+0)throw e;W(1,0)}}function bt(e,t,n,r){var i=M();try{return B(e)(t,n,r)}catch(e){if(j(i),e!==e+0)throw e;W(1,0)}}function xt(e,t,n,r,i,a){var o=M();try{B(e)(t,n,r,i,a)}catch(e){if(j(o),e!==e+0)throw e;W(1,0)}}function St(e,t,n,r){var i=M();try{B(e)(t,n,r)}catch(e){if(j(i),e!==e+0)throw e;W(1,0)}}function Ct(e,t,n,r,i,a,o){var s=M();try{return B(e)(t,n,r,i,a,o)}catch(e){if(j(s),e!==e+0)throw e;W(1,0)}}function wt(e,t,n,r,i,a,o,s){var c=M();try{B(e)(t,n,r,i,a,o,s)}catch(e){if(j(c),e!==e+0)throw e;W(1,0)}}function Tt(e,t,n,r,i,a,o,s){var c=M();try{return B(e)(t,n,r,i,a,o,s)}catch(e){if(j(c),e!==e+0)throw e;W(1,0)}}function Et(e,t,n,r,i,a,o,s,c){var l=M();try{return B(e)(t,n,r,i,a,o,s,c)}catch(e){if(j(l),e!==e+0)throw e;W(1,0)}}function Dt(e,t,n,r,i,a,o){var s=M();try{B(e)(t,n,r,i,a,o)}catch(e){if(j(s),e!==e+0)throw e;W(1,0)}}function Ot(e,t,n,r,i,a,o,s,c){var l=M();try{B(e)(t,n,r,i,a,o,s,c)}catch(e){if(j(l),e!==e+0)throw e;W(1,0)}}function kt(e,t,n,r){var i=M();try{return B(e)(t,n,r)}catch(e){if(j(i),e!==e+0)throw e;W(1,0)}}function At(e,t,n,r,i,a,o,s,c,l){var u=M();try{B(e)(t,n,r,i,a,o,s,c,l)}catch(e){if(j(u),e!==e+0)throw e;W(1,0)}}function jt(e,t,n,r,i,a,o,s,c,l,u,d){var f=M();try{B(e)(t,n,r,i,a,o,s,c,l,u,d)}catch(e){if(j(f),e!==e+0)throw e;W(1,0)}}function Mt(e,t,n,r,i,a,o){var s=M();try{return B(e)(t,n,r,i,a,o)}catch(e){if(j(s),e!==e+0)throw e;W(1,0)}}function Nt(e,t,n,r,i,a,o,s,c,l){var u=M();try{return B(e)(t,n,r,i,a,o,s,c,l)}catch(e){if(j(u),e!==e+0)throw e;W(1,0)}}function Pt(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g){var _=M();try{return B(e)(t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g)}catch(e){if(j(_),e!==e+0)throw e;W(1,0)}}function Ft(e,t,n,r,i,a,o,s){var c=M();try{B(e)(t,n,r,i,a,o,s)}catch(e){if(j(c),e!==e+0)throw e;W(1,0)}}var It,Lt;E=function e(){It||Rt(),It||(E=e)};function Rt(){if(T>0||!Lt&&(Lt=1,C(),T>0))return;function e(){It||(It=1,r.calledRun=1,!y&&(ie(),i(r),r.onRuntimeInitialized?.(),ae()))}r.setStatus?(r.setStatus(`Running...`),setTimeout(()=>{setTimeout(()=>r.setStatus(``),1),e()},1)):e()}if(r.preInit)for(typeof r.preInit==`function`&&(r.preInit=[r.preInit]);r.preInit.length>0;)r.preInit.pop()();return Rt(),n=o,n})})(),Bt=class t{static _pending;static ready(){return t._pending??=t.load().catch(t.reset.bind(t)),t._pending}static async load(){let t=new URL(new URL(`TextWasm-CzLEc6sI.wasm`,import.meta.url).href,``+import.meta.url),n;if(t.protocol===`file:`)n=await(await i(()=>import(`./__vite-browser-external-2W3EstLn.js`).then(t=>e(t.default,1)),__vite__mapDeps([0,1]),import.meta.url)).readFile(t);else{let e=await fetch(t);if(e.ok)n=new Uint8Array(await e.arrayBuffer());else throw Error(`Text WASM download failed (${String(e.status)}): ${t.href}`)}return zt({wasmBinary:n})}static reset(e){throw t._pending=void 0,e}},Vt=(e,t)=>{if(t===1){let t=e._text_result_data()/8;return e.HEAPF64.slice(t,t+e._text_result_size())}{let t=e._text_error(),n=t;for(;n<e.HEAPU8.length&&e.HEAPU8[n]!==0;)n+=1;throw Error(new TextDecoder().decode(e.HEAPU8.subarray(t,n)))}},Ht=(e,t,n)=>{if(t.length<=65536){let r=e._malloc(Math.max(2,t.length*2));if(r>0)try{for(let n=0;n<t.length;n+=1)e.HEAPU16[r/2+n]=t.charCodeAt(n);return n(r,t.length)}finally{e._free(r)}else throw Error(`Could not allocate Text WASM input.`)}else throw RangeError(`Text exceeds the 65536 UTF-16 code-unit limit.`)},Ut=class{version;unitsPerEm;ascent;descent;lineGap;_module;_disposed=!1;_shapes=new Rt;_outlines=new Rt;constructor(e,t){this._module=e,this.version=t[0],this.unitsPerEm=t[1],this.ascent=t[2],this.descent=t[3],this.lineGap=t[4]}shape(e){this.requireActive();let t=this._shapes.get(e);if(t)return t;{let t=Ht(this._module,e,(e,t)=>Vt(this._module,this._module._text_shape(this.version,e,t))),n=[],r=[];for(let e=0;e<t[1];e+=1){let i=2+e*10;n.push(Object.freeze({id:t[i],cluster:t[i+1],bbox:Object.freeze({minX:t[i+6],minY:t[i+7],maxX:t[i+8],maxY:t[i+9]})})),r.push(Object.freeze({xAdvance:t[i+2],yAdvance:t[i+3],xOffset:t[i+4],yOffset:t[i+5]}))}let i=Object.freeze({advanceWidth:t[0],glyphs:Object.freeze(n),positions:Object.freeze(r)});return this._shapes.set(e,i,e.length*2+n.length*256),i}}outline(e,t){this.requireActive();let n=this._outlines.get(e);if(n)return n;{let n=t(),r=n.triangles.length;for(let e of n.contours)r+=e.length;return this._outlines.set(e,n,e.length*2+r*80+n.contours.length*64),n}}mesh(e,t,n,r,i,a){return this.requireActive(),Ht(this._module,e,(e,o)=>Vt(this._module,this._module._text_mesh(this.version,e,o,t,n,r,i,a)))}get cacheStats(){this.requireActive();let e=Vt(this._module,this._module._text_stats(this.version));return{glyphHits:e[0],glyphBuilds:e[1],glyphBytes:e[2],shapeHits:this._shapes.hits,shapeBuilds:this._shapes.misses,textHits:this._outlines.hits,textBuilds:this._outlines.misses,textBytes:this._outlines.bytes,shapeBytes:this._shapes.bytes}}clearCache(){this.requireActive(),Vt(this._module,this._module._text_clear(this.version)),this._shapes.clear(),this._outlines.clear()}dispose(){this._disposed===!1&&(this._module._text_unregister(this.version),this._shapes.clear(),this._outlines.clear(),this._disposed=!0)}requireActive(){if(this._disposed)throw Error(`Text font has been unregistered or replaced.`)}},Wt=new Map,Gt=new Map,Kt=async(e,t)=>{if(e.trim().length>0&&t.byteLength>0&&t.byteLength<=67108864){let n=new Uint8Array(new Uint8Array(t)),r=Symbol(e);Gt.set(e,r);try{let t=await Bt.ready();if(Gt.get(e)===r){let r=t._malloc(n.length);if(r>0){try{t.HEAPU8.set(n,r);let i=new Ut(t,Vt(t,t._text_register(r,n.length)));Wt.get(e)?.dispose(),Wt.set(e,i)}finally{t._free(r)}return e}throw Error(`Could not allocate font bytes in WASM.`)}throw Error(`Text font registration was superseded: `+e)}finally{Gt.get(e)===r&&Gt.delete(e)}}else throw RangeError(`fontFamily must not be empty; font data must contain 1–67108864 bytes.`)},qt=e=>Wt.has(e),Jt=e=>{let t=Wt.get(e);if(t)return t;throw Error(`Text font is not registered: `+e)},Yt=(e,t,n,r=0,i=0,a=`center`,o=.5)=>{if(Number.isFinite(Math.fround(t))&&t>=0&&Number.isFinite(Math.fround(r))&&r>=0&&Number.isFinite(Math.fround(i))&&Number.isFinite(o)&&o>0){let s=[`left`,`center`,`right`].indexOf(a);if(s>=0){let a=Jt(n),c=JSON.stringify([e,t,r,i,s,o]);return a.outline(c,()=>{let n=a.mesh(e,t,r,i,s,o),c=8,l=e=>{let t=[];for(let r=0;r<e;r+=1)t.push(Object.freeze([n[c],n[c+1]])),c+=2;return Object.freeze(t)},u=l(n[6]),d=[];for(let e=0;e<n[7];e+=1){let e=n[c];c+=1,d.push(l(e))}return Object.freeze({width:n[0],height:n[1],minX:n[2],minY:n[3],advanceWidth:n[4],perimeter:n[5],triangles:u,contours:Object.freeze(d)})})}throw RangeError(`textAlign must be left, center or right.`)}throw RangeError(`Text size and line spacing must be finite and nonnegative; spacing finite; tolerance positive.`)},X=class{_metadata;_originPrecision;_outline;_data;_borderData;_lineData;_pointData;constructor(e,t,n,r={}){let i=Xt(r);this._originPrecision=i.precision,this._metadata={text:e,fontSize:t,fontFamily:n,...i},this._outline=Yt(e,t,n,i.lineSpacing,i.letterSpacing,i.textAlign,4/i.precision),this._data=jt(this._outline,this._metadata)}set(e,t=this.fontSize,n=this.fontFamily,r={}){let i=Xt({precision:r.precision??this.precision,lineSpacing:r.lineSpacing??this.lineSpacing,letterSpacing:r.letterSpacing??this.letterSpacing,textAlign:r.textAlign??this.textAlign,baseline:r.baseline??this.baseline}),a={text:e,fontSize:t,fontFamily:n,...i},o=Yt(e,t,n,i.lineSpacing,i.letterSpacing,i.textAlign,4/i.precision),s=jt(o,a);return this._metadata=a,this._originPrecision=i.precision,this._outline=o,this._data=s,this._borderData=void 0,this._lineData=void 0,this._pointData=void 0,this}getPerimeter(){return this._outline.perimeter}createBorderGeometry(e=1,t=1,n=`normal`){let r=Z(e,`lineWidth`),i=Z(t,`uvRepeat`);if(![`inset`,`normal`,`outset`].includes(n))throw RangeError(`align must be inset, normal or outset.`);return this._borderData=Ft(this._outline,this._metadata,r,i,n),this._borderData}createLineGeometry(e=1){return this._lineData=Pt(this._outline,this._metadata,Z(e,`uvRepeat`)),this._lineData}createPointGeometry(e=2,t=4,n=!0,r=!1,i=0,a=0){if(!n&&!r)throw RangeError(`vertexPoints and midpointPoints cannot both be false.`);if(!Number.isSafeInteger(t)||t<3)throw RangeError(`sides must be an integer greater than or equal to 3.`);let o=Z(e,`pointRadius`),s=Z(i,`vertexThreshold`),c=Z(a,`midpointThreshold`);return this._pointData=Lt(o===0?{...this._outline,contours:[]}:this._outline,this._metadata,o,t,n,r,s,c),this._pointData}get precision(){return this._metadata.precision}set precision(e){this.set(this.text,this.fontSize,this.fontFamily,{precision:C(e)})}get originPrecision(){return this._originPrecision}get text(){return this._metadata.text}get fontSize(){return this._metadata.fontSize}get fontFamily(){return this._metadata.fontFamily}get width(){return this._data.width}get height(){return this._data.height}get advanceWidth(){return this._data.advanceWidth}get lineSpacing(){return this._metadata.lineSpacing}get letterSpacing(){return this._metadata.letterSpacing}get textAlign(){return this._metadata.textAlign}get baseline(){return this._metadata.baseline}get data(){return this._data}get contours(){let e=[];for(let t of this._outline.contours){let n=new Float32Array(t.length*2);for(let e=0;e<t.length;e+=1)n[e*2]=t[e][0],n[e*2+1]=t[e][1];e.push(n)}return e}get borderData(){return this._borderData}get lineData(){return this._lineData}get pointData(){return this._pointData}static CreateGeometry(e,t,n,r={}){return Zt(e,t,n,r)}static CreateBorderGeometry(e,t,n,r=1,i=1,a=`normal`,o={}){return Qt(e,t,n,r,i,a,o)}static CreateLineGeometry(e,t,n,r=1,i={}){return $t(e,t,n,r,i)}static CreatePointGeometry(e,t,n,r=2,i=4,a=!0,o=!1,s=0,c=0,l={}){return en(e,t,n,r,i,a,o,s,c,l)}static GetPerimeter(e,t,n,r={}){return tn(e,t,n,r)}},Z=(e,t)=>{if(Number.isFinite(e)&&e>=0)return e;throw RangeError(t+` must be finite and nonnegative.`)},Xt=e=>{let t=Z(e.lineSpacing??0,`lineSpacing`),n=e.letterSpacing??0,r=e.textAlign??`center`,i=e.baseline??`middle`;if(!Number.isFinite(n))throw RangeError(`letterSpacing must be finite.`);if(![`left`,`center`,`right`].includes(r))throw RangeError(`textAlign must be left, center or right.`);if(![`top`,`middle`,`bottom`].includes(i))throw RangeError(`baseline must be top, middle or bottom.`);return{lineSpacing:t,letterSpacing:n,textAlign:r,baseline:i,precision:C(e.precision??8)}},Zt=(e,t,n,r={})=>new X(e,t,n,r).data,Qt=(e,t,n,r=1,i=1,a=`normal`,o={})=>new X(e,t,n,o).createBorderGeometry(r,i,a),$t=(e,t,n,r=1,i={})=>new X(e,t,n,i).createLineGeometry(r),en=(e,t,n,r=2,i=4,a=!0,o=!1,s=0,c=0,l={})=>new X(e,t,n,l).createPointGeometry(r,i,a,o,s,c),tn=(e,t,n,r={})=>new X(e,t,n,r).getPerimeter(),nn=class e{static _urls=new Map;static _factories=new Map;static _pending=new Map;static _browserFaces=new Map;static get map(){return e._factories}static register(t,n){if(t.trim().length===0||n.trim().length===0)throw RangeError(`Font family and URL must not be empty.`);let r=e._urls.get(t);if(r!==void 0&&qt(t)){if(r===n)return Promise.resolve(e.get(t));throw Error(`Font family is already registered from another URL: ${t}`)}let i=e._pending.get(t);if(i!==void 0){if(i.url===n)return i.promise;throw Error(`Font family is already loading from another URL: ${t}`)}let a=e.load(t,n).finally(()=>{e._pending.delete(t)});return e._pending.set(t,{url:n,promise:a}),a}static get(t){let n=e._factories.get(t);if(n!==void 0&&qt(t))return n;throw Error(`Font is not registered: ${t}`)}static has(t){return e._factories.has(t)&&qt(t)}static browserFace(t){e.get(t);let n=e._browserFaces.get(t),r;if(n!==void 0)r=n;else{let n=e._urls.get(t),i=new FontFace(t,`url(${JSON.stringify(n)})`).load().then(e=>(document.fonts.add(e),e));e._browserFaces.set(t,i),r=i}return r}static async load(t,n){let r=await fetch(n);if(r.ok){await Kt(t,await r.arrayBuffer());let i=(e,n=16,r={})=>Zt(e,n,t,r);return e._urls.set(t,n),e._factories.set(t,i),i}throw Error(`Font download failed (${String(r.status)}): ${n}`)}},rn=class e extends O{type=`Text`;_text=``;_layoutText=``;_fontSize=16;_fontFamily=``;_lineSpacing=0;_letterSpacing=0;_textAlign=`center`;_baseline=`middle`;_writingMode=`horizontal-tb`;_width=0;_height=0;_advanceWidth=0;_anchorX=0;_anchorY=0;_perimeter=0;_contours=[];constructor(e,t=16,n=an(),r=null){super();let i=r??{};try{this.precision=i.precision??8,this.fontSize=t,this.fontFamily=n,this.lineSpacing=i.lineSpacing??0,this.letterSpacing=i.letterSpacing??0,this.textAlign=i.textAlign??`center`,this.baseline=i.baseline??`middle`,this.writingMode=i.writingMode??`horizontal-tb`,this.text=e,this.updateGeometry()}catch(e){throw this.dispose(),e}}copy(e){return this.copyPrecision(e),this.style=e.style.clone(),this.fontSize=e.fontSize,this.fontFamily=e.fontFamily,this.lineSpacing=e.lineSpacing,this.letterSpacing=e.letterSpacing,this.textAlign=e.textAlign,this.baseline=e.baseline,this.writingMode=e.writingMode,this.text=e.text,this.updateGeometry(),this}clone(){return new e(this.text,this.fontSize,this.fontFamily,{precision:this.originPrecision,lineSpacing:this.lineSpacing,letterSpacing:this.letterSpacing,textAlign:this.textAlign,baseline:this.baseline,writingMode:this.writingMode}).copy(this)}get text(){return this._text}set text(e){let t=on(e,this._writingMode);(this._text!==e||this._layoutText!==t)&&(this._text=e,this._layoutText=t,this.updateVersion())}get layoutText(){return this._layoutText}get fontSize(){return this._fontSize}set fontSize(e){if(!Number.isFinite(Math.fround(e))||e<0)throw RangeError(`Text fontSize must be finite and nonnegative.`);this._fontSize!==e&&(this._fontSize=e,this.updateVersion())}get fontFamily(){return this._fontFamily}set fontFamily(e){nn.get(e),this._fontFamily!==e&&(this._fontFamily=e,this.updateVersion())}get lineSpacing(){return this._lineSpacing}set lineSpacing(e){if(!Number.isFinite(Math.fround(e))||e<0)throw RangeError(`Text lineSpacing must be finite and nonnegative.`);this._lineSpacing!==e&&(this._lineSpacing=e,this.updateVersion())}get letterSpacing(){return this._letterSpacing}set letterSpacing(e){if(!Number.isFinite(Math.fround(e)))throw RangeError(`Text letterSpacing must be finite.`);this._letterSpacing!==e&&(this._letterSpacing=e,this.updateVersion())}get textAlign(){return this._textAlign}set textAlign(e){if(![`left`,`center`,`right`].includes(e))throw RangeError(`Text textAlign must be left, center or right.`);this._textAlign!==e&&(this._textAlign=e,this.updateVersion())}get baseline(){return this._baseline}set baseline(e){if(![`top`,`middle`,`bottom`].includes(e))throw RangeError(`Text baseline must be top, middle or bottom.`);this._baseline!==e&&(this._baseline=e,this.updateVersion())}get writingMode(){return this._writingMode}set writingMode(e){if(![`horizontal-tb`,`vertical-rl`].includes(e))throw RangeError(`Text writingMode must be horizontal-tb or vertical-rl.`);this._writingMode!==e&&(this._writingMode=e,this._layoutText=on(this._text,e),this.updateVersion())}get width(){return this.ensureGeometry(),this._width}get height(){return this.ensureGeometry(),this._height}get advanceWidth(){return this.ensureGeometry(),this._advanceWidth}get anchorX(){return this.ensureGeometry(),this._anchorX}get anchorY(){return this.ensureGeometry(),this._anchorY}get perimeter(){return this.ensureGeometry(),this._perimeter}get contours(){return this.ensureGeometry(),this._contours.map(e=>e.slice())}updateGeometry(){nn.get(this._fontFamily);let e=new X(this._layoutText,this._fontSize,this._fontFamily,{precision:this.precision,lineSpacing:this._lineSpacing,letterSpacing:this._letterSpacing,textAlign:this._textAlign,baseline:this._baseline}),t=[];this.style.solid.enabled&&t.push({data:e.data,vertexType:0});let n=this.style.edge;n.enabled&&n.width>0&&t.push({data:e.createBorderGeometry(n.width,n.uvRepeat,n.borderAlign),vertexType:.5});let r=this.style.points;return r.enabled&&(r.vertices||r.midpoints)&&t.push({data:e.createPointGeometry(r.radius,r.segments,r.vertices,r.midpoints,r.minPointsLength,r.minEdgePointsLength),vertexType:1}),this.mergeGeometry(t),this.linePoints=this.style.wireframe.enabled?e.createLineGeometry():void 0,this._width=e.width,this._height=e.height,this._advanceWidth=e.advanceWidth,this._anchorX=e.data.anchorX,this._anchorY=e.data.anchorY,this._perimeter=e.getPerimeter(),this._contours=e.contours,this.uniformData.set([this._width,this._height,0,n.width]),super.updateGeometry(),this}},an=()=>{let e=nn.map.keys().next();if(e.done)throw Error(`Register a font with Font.register before creating Text.`);return e.value},on=(e,t)=>{if(t===`horizontal-tb`)return e;{let t=e.replaceAll(`\r
`,`
`).replaceAll(`\r`,`
`).split(`
`),n=new Intl.Segmenter(void 0,{granularity:`grapheme`}),r=[],i=0;for(let e of t){let t=[];for(let r of n.segment(e))t.push(r.segment);r.push(t),i=Math.max(i,t.length)}let a=[];for(let e=0;e<i;e+=1){let t=[];for(let n=r.length-1;n>=0;--n)t.push(r[n][e]??`　`);a.push(t.join(``))}return a.join(`
`)}},sn=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct GeometryUniform {
    outer: f32,
    inner: f32,
    sides: f32,
    borderWidth: f32,
};

// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 NGon 的外半径、内半径、边数和实体边框宽度。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// 材质背景颜色，同时作为贴图颜色乘数。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;
// 材质当前使用的二维贴图。
@group(1) @binding(1) var textureMap: texture_2d_array<f32>;
// 控制贴图过滤和寻址方式。
@group(1) @binding(2) var textureSampler: sampler;
// 三种几何各自的贴图和 Sampler 同时绑定，不能在一次 DrawCall 中途切换绑定。
@group(1) @binding(3) var edgeTexture: texture_2d_array<f32>;
@group(1) @binding(4) var edgeSampler: sampler;
@group(1) @binding(5) var pointsTexture: texture_2d_array<f32>;
@group(1) @binding(6) var pointsSampler: sampler;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    @location(3) @interpolate(flat) instanceIndex: u32,
};

fn SolidShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn EdgeShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn PointShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

// 内孔由 CPU 索引连接保证，不在片段中裁掉整块圆盘；边框走 vertexType=0.5。
fn ShadeNGon(textureColor: vec4f, materialUniform: MaterialUniform) -> vec4f {
    var color = textureColor * materialUniform.solidColor;
    color.a *= materialUniform.solid.x;
    if (color.a <= 0.0) { discard; }
    return color;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialUniform = materialStyles[input.instanceIndex];
    // 原样使用 bounding/polar UV；不要对 polar 的 U 提前 fract，否则会破坏接缝导数。
    let fillUv = input.uv;
    // vertexType 在三角面内不插值，但不同图元仍可能进入不同分支。
    // 导数在分支前统一求值，再使用 textureSampleGrad，避免非一致控制流中的隐式导数报错。
    let fillDx = dpdx(fillUv);
    let fillDy = dpdy(fillUv);
    let uvDx = dpdx(input.uv);
    let uvDy = dpdy(input.uv);
    if (input.vertexType == 0.0) {
        if (materialUniform.enabled.x == 0.0) { discard; }
        return ShadeNGon(textureSampleGrad(textureMap, textureSampler, fillUv, i32(materialUniform.textureLayers.x), fillDx, fillDy) * SolidShader(input, materialUniform), materialUniform);
    }
    var color: vec4f;
    var opacity: f32;
    if (input.vertexType == 0.5) {
        if (materialUniform.enabled.z == 0.0) { discard; }
        color = textureSampleGrad(edgeTexture, edgeSampler, input.uv, i32(materialUniform.textureLayers.y), uvDx, uvDy) * EdgeShader(input, materialUniform) * materialUniform.edgeColor;
        opacity = materialUniform.edge.x;
    } else {
        if (materialUniform.enabled.w == 0.0) { discard; }
        color = textureSampleGrad(pointsTexture, pointsSampler, input.uv, i32(materialUniform.textureLayers.z), uvDx, uvDy) * PointShader(input, materialUniform) * materialUniform.pointsColor;
        opacity = materialUniform.points.x;
    }
    let alpha = color.a * opacity;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
`,cn=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    _padding0: f32,
};

// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的包围盒宽高、保留项与边框宽度，供后续 SDF 计算使用。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// 材质背景颜色，同时作为贴图颜色乘数。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;
// 材质当前使用的二维贴图。
@group(1) @binding(1) var textureMap: texture_2d_array<f32>;
// 控制贴图过滤和寻址方式。
@group(1) @binding(2) var textureSampler: sampler;
// 三种几何各自的贴图和 Sampler 同时绑定，不能在一次 DrawCall 中途切换绑定。
@group(1) @binding(3) var edgeTexture: texture_2d_array<f32>;
@group(1) @binding(4) var edgeSampler: sampler;
@group(1) @binding(5) var pointsTexture: texture_2d_array<f32>;
@group(1) @binding(6) var pointsSampler: sampler;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    @location(3) @interpolate(flat) instanceIndex: u32,
};

fn SolidShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn EdgeShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn PointShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

// 填充轮廓已由几何三角面决定。多边形边框走 vertexType=0.5，不使用矩形 SDF。
fn ShadePoly(textureColor: vec4f, materialUniform: MaterialUniform) -> vec4f {
    var color = textureColor * materialUniform.solidColor;
    color.a *= materialUniform.solid.x;
    if (color.a <= 0.0) { discard; }
    return color;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialUniform = materialStyles[input.instanceIndex];
    // 使用几何提供的 UV，允许非中心原点和自定义纹理坐标。
    let fillUv = input.uv;
    // vertexType 在三角面内不插值，但不同图元仍可能进入不同分支。
    // 导数在分支前统一求值，再使用 textureSampleGrad，避免非一致控制流中的隐式导数报错。
    let fillDx = dpdx(fillUv);
    let fillDy = dpdy(fillUv);
    let uvDx = dpdx(input.uv);
    let uvDy = dpdy(input.uv);
    if (input.vertexType == 0.0) {
        if (materialUniform.enabled.x == 0.0) { discard; }
        return ShadePoly(textureSampleGrad(textureMap, textureSampler, fillUv, i32(materialUniform.textureLayers.x), fillDx, fillDy) * SolidShader(input, materialUniform), materialUniform);
    }
    var color: vec4f;
    var opacity: f32;
    if (input.vertexType == 0.5) {
        if (materialUniform.enabled.z == 0.0) { discard; }
        color = textureSampleGrad(edgeTexture, edgeSampler, input.uv, i32(materialUniform.textureLayers.y), uvDx, uvDy) * EdgeShader(input, materialUniform) * materialUniform.edgeColor;
        opacity = materialUniform.edge.x;
    } else {
        if (materialUniform.enabled.w == 0.0) { discard; }
        color = textureSampleGrad(pointsTexture, pointsSampler, input.uv, i32(materialUniform.textureLayers.z), uvDx, uvDy) * PointShader(input, materialUniform) * materialUniform.pointsColor;
        opacity = materialUniform.points.x;
    }
    let alpha = color.a * opacity;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
`,ln=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    _padding0: f32,
};

// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的宽度、高度与圆角参数，供后续 SDF 计算使用。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// 材质背景颜色，同时作为贴图颜色乘数。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;
// 材质当前使用的二维贴图。
@group(1) @binding(1) var textureMap: texture_2d_array<f32>;
// 控制贴图过滤和寻址方式。
@group(1) @binding(2) var textureSampler: sampler;
// 三种几何各自的贴图和 Sampler 同时绑定，不能在一次 DrawCall 中途切换绑定。
@group(1) @binding(3) var edgeTexture: texture_2d_array<f32>;
@group(1) @binding(4) var edgeSampler: sampler;
@group(1) @binding(5) var pointsTexture: texture_2d_array<f32>;
@group(1) @binding(6) var pointsSampler: sampler;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    @location(3) @interpolate(flat) instanceIndex: u32,
};

fn SolidShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn EdgeShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

fn PointShader(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {
    return vec4f(1.0);
}

// 计算点到圆角矩形边界的有符号距离：内部为负，边界为 0，外部为正。
fn RoundedRectDistance(position: vec2f, halfSize: vec2f, radius: f32) -> f32 {
    let safeRadius = clamp(radius, 0.0, min(halfSize.x, halfSize.y));
    let cornerOffset = abs(position) - (halfSize - vec2f(safeRadius));

    return length(max(cornerOffset, vec2f(0.0)))
        + min(max(cornerOffset.x, cornerOffset.y), 0.0)
        - safeRadius;
}

fn ShadeRect(input: FragmentInput, textureColor: vec4f, materialUniform: MaterialUniform) -> vec4f {
    let geometrySize = vec2f(geometryUniform.width, geometryUniform.height);
    let halfSize = geometrySize * 0.5;
    var outputColor = textureColor * materialUniform.solidColor;

    let cameraZoom = max(abs(renderCameraUniform.zoom), 1e-30);
    let safeZoom = select(cameraZoom, 1.0, materialUniform.points.z != 0.0);
    let borderZoomScale = mix(1.0 / safeZoom, 1.0, materialUniform.solid.w);
    let borderWidth = materialUniform.solid.y * borderZoomScale;
    let outward = borderWidth * materialUniform.solid.z;
    let inward = borderWidth * (1.0 - materialUniform.solid.z);
    let originalRadius = clamp(geometryUniform.radius, 0.0, min(halfSize.x, halfSize.y));
    let outerHalfSize = halfSize + vec2f(outward);
    let innerHalfSize = max(halfSize - vec2f(inward), vec2f(0.0));
    // 原始直角保持直角；只有原矩形存在圆角时，内外半径才跟随边框偏移。
    let outerRadius = select(0.0, originalRadius + outward, originalRadius > 0.0);
    let innerRadius = select(0.0, max(originalRadius - inward, 0.0), originalRadius > 0.0);
    let outerDistance = RoundedRectDistance(input.localPosition, outerHalfSize, outerRadius);
    let innerDistance = RoundedRectDistance(input.localPosition, innerHalfSize, innerRadius);
    let hasInner = innerHalfSize.x > 0.0 && innerHalfSize.y > 0.0;

    if (outerDistance > 0.0) {
        discard;
    }

    if (materialUniform.solid.y > 0.0 && (!hasInner || innerDistance >= 0.0)) {
        outputColor = materialUniform.sdfBorderColor;
    }

    // opacity 作用于包含贴图在内的最终输出，而不是修改背景颜色本身。
    outputColor.a *= materialUniform.solid.x;
    // 透明空洞不写颜色或深度；半透明仍由材质混合与深度开关决定。
    if (outputColor.a <= 0.0) { discard; }
    return outputColor;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialUniform = materialStyles[input.instanceIndex];
    let geometrySize = max(vec2f(geometryUniform.width, geometryUniform.height), vec2f(0.000001));
    let fillUv = input.localPosition / geometrySize + vec2f(0.5);
    // vertexType 在三角面内不插值，但不同图元仍可能进入不同分支。
    // 导数在分支前统一求值，再使用 textureSampleGrad，避免非一致控制流中的隐式导数报错。
    let fillDx = dpdx(fillUv);
    let fillDy = dpdy(fillUv);
    let uvDx = dpdx(input.uv);
    let uvDy = dpdy(input.uv);
    if (input.vertexType == 0.0) {
        if (materialUniform.enabled.x == 0.0) { discard; }
        return ShadeRect(input, textureSampleGrad(textureMap, textureSampler, fillUv, i32(materialUniform.textureLayers.x), fillDx, fillDy) * SolidShader(input, materialUniform), materialUniform);
    }
    var color: vec4f;
    var opacity: f32;
    if (input.vertexType == 0.5) {
        if (materialUniform.enabled.z == 0.0) { discard; }
        color = textureSampleGrad(edgeTexture, edgeSampler, input.uv, i32(materialUniform.textureLayers.y), uvDx, uvDy) * EdgeShader(input, materialUniform) * materialUniform.edgeColor;
        opacity = materialUniform.edge.x;
    } else {
        if (materialUniform.enabled.w == 0.0) { discard; }
        color = textureSampleGrad(pointsTexture, pointsSampler, input.uv, i32(materialUniform.textureLayers.z), uvDx, uvDy) * PointShader(input, materialUniform) * materialUniform.pointsColor;
        opacity = materialUniform.points.x;
    }
    let alpha = color.a * opacity;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
`,un=class extends dt{type=`BaseMaterial`;constructor(e){super(e),this.rectVertexShader=St,this.rectFragmentShader=ln,this.polyVertexShader=xt,this.polyFragmentShader=cn,this.ngonVertexShader=bt,this.ngonFragmentShader=sn,this.updateKey()}},dn=class extends dt{type=`CompositeMaterial`;raw;constructor(e){super(e);let t=(e,t)=>{e&&this.refreshShaders(),t&&!e&&this.updateVersion(`texture`)},n=()=>{this.refreshShaders()};this._values=new yt(t),this.raw=new fn(this._values,n),this.rectVertexShader=St,this.polyVertexShader=xt,this.ngonVertexShader=bt,this.refreshShaders()}refreshShaders(){let e=this._values?.declarations??``;this.rectFragmentShader=pn(ln,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader),this.polyFragmentShader=pn(cn,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader),this.ngonFragmentShader=pn(sn,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader)}},fn=class{_solidShader=``;_edgeShader=``;_pointShader=``;_values;_onShaderChange;constructor(e,t){this._values=e,this._onShaderChange=t}get solidShader(){return this._solidShader}set solidShader(e){this.setShader(`solid`,e)}get edgeShader(){return this._edgeShader}set edgeShader(e){this.setShader(`edge`,e)}get pointShader(){return this._pointShader}set pointShader(e){this.setShader(`point`,e)}get value(){return this._values.value}set value(e){this._values.value=e}touchValue(e){this._values.touch(e)}setShader(e,t){e===`solid`&&this._solidShader!==t&&(this._solidShader=t,this._onShaderChange()),e===`edge`&&this._edgeShader!==t&&(this._edgeShader=t,this._onShaderChange()),e===`point`&&this._pointShader!==t&&(this._pointShader=t,this._onShaderChange())}},pn=(e,t,n,r,i)=>{let a=e,o=[[`SolidShader`,n],[`EdgeShader`,r],[`PointShader`,i]];for(let[e,t]of o){let n=`fn ${e}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n    return vec4f(1.0);\n}`,r=`fn ${e}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n${t||`    return vec4f(1.0);`}\n}`;if(!a.includes(n))throw Error(`Composite shader template is missing `+e+`.`);a=a.replace(n,r)}return t+`
`+a},mn=e=>{if(e instanceof Ae||e instanceof ut||e instanceof He||e instanceof Be||e instanceof rn)return e.clone();throw TypeError(`Unsupported geometry type: ${e.type}`)},hn=e=>{let t={};for(let[n,r]of Object.entries(e))t[n]=r instanceof c||r instanceof l?r.clone():r instanceof Float32Array?new Float32Array(r):(r instanceof Y,r);return t},gn=(e,t)=>{let n;if(e instanceof dn){let r=new dn(t);r.raw.solidShader=e.raw.solidShader,r.raw.edgeShader=e.raw.edgeShader,r.raw.pointShader=e.raw.pointShader,r.raw.value=hn(e.raw.value),n=r}else if(e instanceof Ct){let r=new Ct(t);r.raw.vertexShader=e.raw.vertexShader,r.raw.fragmentShader=e.raw.fragmentShader,r.raw.value=hn(e.raw.value),n=r}else n=new un(t);return n.transparent=e.transparent,n.depthTest=e.depthTest,n.depthWrite=e.depthWrite,n.cullMode=e.cullMode,n.rectVertexShader=e.rectVertexShader,n.rectFragmentShader=e.rectFragmentShader,n.polyVertexShader=e.polyVertexShader,n.polyFragmentShader=e.polyFragmentShader,n.ngonVertexShader=e.ngonVertexShader,n.ngonFragmentShader=e.ngonFragmentShader,n},_n=class e extends q{type=`Mesh`;noSelect=!1;_ignoreZoom=!1;_culling=!0;_autoPrecision=!1;_precisionMax=100;_precisionGeometry;_renderMatrix=null;_renderMatrixSource=null;_renderMatrixSourceVersion=-1;_renderMatrixZoom=NaN;_renderBounds=null;_renderBoundsGeometry;_renderBoundsGeometryVersion=-1;_renderBoundsMatrix;_renderBoundsMatrixVersion=-1;_data;_material;_style;_bounding=!1;_boundingBox=null;_boundingGeometry;_boundingGeometryVersion=-1;_boundingWorldMatrix;_boundingWorldMatrixVersion=-1;_matrixVersion=0;_styleVersion=0;_stylePending=!0;_geometryPending=!0;_materialPending=!0;_disposed=!1;_matrixPending=!0;_count=1;_capacity=1;_matrixData=new Float32Array(12);_styleData=new Float32Array(44);constructor(e,t,n=!0){super(0,0),this._style=n===!0?new D:n===!1?void 0:n,this.init(e,t)}get culling(){return this._culling}set culling(e){this._culling!==e&&(this._culling=e,this.updateVersion())}get autoPrecision(){return this._autoPrecision}set autoPrecision(e){this._autoPrecision!==e&&(this._autoPrecision=e,e===!1&&this._data!==void 0&&this._data.setRenderPrecision(this._data.originPrecision),this.updateVersion())}get precisionMax(){return this._precisionMax}set precisionMax(e){if(Number.isInteger(e)&&e>=3&&e<=4095)this._precisionMax!==e&&(this._precisionMax=e,this.updateVersion());else throw RangeError(`precisionMax must be an integer in [3, 4095].`)}get precision(){return this._data?.precision??8}set precision(e){let t=this._data;if(t!==void 0){if(this._autoPrecision){let t=this.preparePrecisionGeometry();t!==void 0&&(t.precision=e)}else t.precision=e}}get originPrecision(){return this._data?.originPrecision??8}preparePrecisionGeometry(){let e=this._data;if(this._autoPrecision&&e!==void 0&&this._precisionGeometry!==e){let t=mn(e);t.style=e.style,this.data=t,this._precisionGeometry=t}return this._data}get count(){return this._count}get ignoreZoom(){return this._ignoreZoom}set ignoreZoom(e){if(this._ignoreZoom!==e){this._ignoreZoom=e;for(let t=0;t<this._count;t++)this._styleData[t*44+30]=Number(e);this._matrixVersion++,this._styleVersion++}}getRenderMatrix(e){let t=this.ensureWorldMatrix();if(this._ignoreZoom&&Number.isFinite(e.zoom)&&e.zoom>0){if(this._renderMatrix??=new l,this._renderMatrixSource!==t||this._renderMatrixSourceVersion!==t.version||this._renderMatrixZoom!==e.zoom){let n=t.data,r=1/e.zoom;this._renderMatrix.set([n[0]*r,n[1]*r,n[2]*r,n[3]*r,n[4]*r,n[5]*r,n[6],n[7],n[8]]),this._renderMatrixSource=t,this._renderMatrixSourceVersion=t.version,this._renderMatrixZoom=e.zoom}return this._renderMatrix}return t}getRenderBoundingBox(e){let t=this.boundingBox,n=this._data;if(t!==null&&n!==void 0&&this._ignoreZoom){let t=this.getRenderMatrix(e);return(this._renderBoundsGeometry!==n||this._renderBoundsGeometryVersion!==n.version||this._renderBoundsMatrix!==t||this._renderBoundsMatrixVersion!==t.version)&&(this._renderBounds=this.createBoundingBox(n,t),this._renderBoundsGeometry=n,this._renderBoundsGeometryVersion=n.version,this._renderBoundsMatrix=t,this._renderBoundsMatrixVersion=t.version),this._renderBounds}return t}get capacity(){return this._capacity}get matrixData(){return this._matrixData}get styleData(){return this._styleData}get textures(){let e=this.material?.style;return[e?.solid.texture,e?.edge.texture,e?.points.texture]}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._style!==e||e!==void 0&&(this._data!==void 0&&this._data.style!==e||this._material!==void 0&&this._material.style!==e))this._style=e,this.syncStyle(),this.updateResources();else return}get bounding(){return this._bounding}set bounding(e){if(this._bounding!==e)this._bounding=e,this._boundingBox=null,this._boundingGeometry=void 0,this._boundingWorldMatrix=void 0,this.updateVersion();else return}get boundingBox(){if(this._bounding){let e=this._data;if(e!==void 0){e.ensureGeometry();let t=this.ensureWorldMatrix();(this._boundingGeometry!==e||this._boundingGeometryVersion!==e.version||this._boundingWorldMatrix!==t||this._boundingWorldMatrixVersion!==t.version)&&(this._boundingBox=this.createBoundingBox(e,t),this._boundingGeometry=e,this._boundingGeometryVersion=e.version,this._boundingWorldMatrix=t,this._boundingWorldMatrixVersion=t.version)}else this._boundingBox=null,this._boundingGeometry=void 0}return this._boundingBox}createBoundingBox(e,t){let n=t.data;if(n.every(Number.isFinite)){let t=1/0,r=1/0,i=-1/0,a=-1/0,o=1/0,s=1/0,c=-1/0,l=-1/0,u=[e.geometry,e.linePoints?.geometry];for(let e of u)if(e!==void 0)for(let u=0;u+1<e.length;u+=2){let d=e[u],f=e[u+1],p=n[0]*d+n[3]*f+n[6],m=n[1]*d+n[4]*f+n[7];Number.isFinite(d)&&Number.isFinite(f)&&Number.isFinite(p)&&Number.isFinite(m)&&(t=Math.min(t,d),r=Math.min(r,f),i=Math.max(i,d),a=Math.max(a,f),o=Math.min(o,p),s=Math.min(s,m),c=Math.max(c,p),l=Math.max(l,m))}return Number.isFinite(t)?{local:{x:t,y:r,width:i-t,height:a-r},world:{x:o,y:s,width:c-o,height:l-s}}:null}return null}get matrixVersion(){return this._matrixVersion}get styleVersion(){return this._styleVersion}get geometryPending(){return this._geometryPending}get materialPending(){return this._materialPending}onGeometryChange(e){!this._disposed&&e===this._data&&(this._geometryPending=!0)}onMaterialChange(e){if(!this._disposed&&e.source===this._material)this._materialPending=!0,this._stylePending||=e.style,e.resources&&this.getScene(this)?.updateVersion();else return}dispose(){super.dispose(),this._data?.delete(this),this._material?.delete(this),this._disposed=!0}syncStyle(){if(this._style!==void 0)this._data!==void 0&&(this._data.style=this._style),this._material!==void 0&&(this._material.style=this._style);else return}updateInstanceData(){if(this._disposed)throw Error(`Disposed mesh cannot be rendered.`);this._geometryPending&&this._data!==void 0&&this._material?.addGeometryType(this._data.type);let e=this.worldMatrix.GPUData;if(this._matrixPending&&=(this.matrixData.set(e,0),this._matrixVersion++,!1),this._stylePending){let e=this._material?.style;e===void 0?this.styleData.fill(0):fe(e,this.styleData,0,this.ignoreZoom),this._styleVersion++,this._stylePending=!1}this._geometryPending=!1,this._materialPending=!1}onMathChange(e,t){super.onMathChange(e,t),!this._nodeDisposed&&t===`worldMatrix`&&e===this.worldMatrix&&(this._matrixPending=!0)}get data(){return this._data}set data(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._data!==e)e?.add(this),this._data?.delete(this),this._data=e,this._geometryPending=!0,this.syncStyle(),this.updateResources();else return}get material(){return this._material}set material(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._material!==e)e?.add(this),this._material?.delete(this),this._material=e,this._materialPending=!0,this._stylePending=!0,this.syncStyle(),this.updateResources();else return}updateResources(){this._data!==void 0&&this._material?.addGeometryType(this._data.type);let e=this.getScene(this);e!==void 0&&(e.updateLists(),e.updateVersion())}copy(e){let t=e.data,n=e.material;if(t!==void 0&&n!==void 0){let r=mn(t),i=e.style?.clone(),a=n.style.clone();i!==void 0&&(r.style=i,a=i);let o=gn(n,a);return this.init(r,o),this.style=i,this.copyTransform(e),this}throw Error(`Cannot copy a Mesh without geometry and material.`)}clone(){let t=this.data,n=this.material;if(t!==void 0&&n!==void 0){let r=mn(t),i=this.style?.clone(),a=n.style.clone();i!==void 0&&(r.style=i,a=i);let o=gn(n,a),s=new e(r,o,i??!1);return s.copyTransform(this),s}throw Error(`Cannot clone a Mesh without geometry and material.`)}copyTransform(e){this.position.copy(e.position),this.rotation=e.rotation,this.scale.copy(e.scale),this.matrix.set(e.ensureMatrix().data),this.order=e.order,this.noSelect=e.noSelect,this.ignoreZoom=e.ignoreZoom,this.bounding=e.bounding,this.culling=e.culling,this._autoPrecision=e.autoPrecision,this._precisionMax=e.precisionMax,this._precisionGeometry=this._data}init(e,t){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);return e!==this._data&&(e.add(this),this._data?.delete(this)),t!==this._material&&(t.add(this),this._material?.delete(this)),this._data=e,this._material=t,this._geometryPending=!0,this._materialPending=!0,this._stylePending=!0,this.updateResources(),this}},vn=class{_map=new Map;get map(){return this._map}get size(){return this._map.size}add(e){this._map.set(e.id,e)}clear(){for(let e of this._map.values())e.dispose();this._map.clear()}},yn=class{id=h();index;_position;_rotation;_scale;_style;_enabled;_version=0;_subscribers=new Set;_disposed=!1;constructor(e,t={}){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`Invalid raw index.`);if(this.index=e,this._position=t.position??new c,this._rotation=t.rotation??0,this._scale=t.scale??new c(1,1),this._style=t.style??new D,this._enabled=t.enabled??!0,!Number.isFinite(this._rotation))throw RangeError(`Rotation must be finite.`);this._position.add(this,`position`),this._scale.add(this,`scale`),this._style.add(this)}get version(){return this._version}get position(){return this._position}set position(e){if(e!==this._position)this.assertActive(),this._position.delete(this,`position`),this._position=e,e.add(this,`position`),this.notify(`matrix`);else return}get rotation(){return this._rotation}set rotation(e){if(!Number.isFinite(e))throw RangeError(`Rotation must be finite.`);if(e!==this._rotation)this.assertActive(),this._rotation=e,this.notify(`matrix`);else return}get scale(){return this._scale}set scale(e){if(e!==this._scale)this.assertActive(),this._scale.delete(this,`scale`),this._scale=e,e.add(this,`scale`),this.notify(`matrix`);else return}get style(){return this._style}set style(e){if(e!==this._style)this.assertActive(),this._style.delete(this),this._style=e,e.add(this),this.notify(`texture`);else return}get enabled(){return this._enabled}set enabled(e){if(e!==this._enabled)this.assertActive(),this._enabled=e,this.notify(`style`);else return}add(e){this.assertActive(),this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}onMathChange(e,t){(t===`position`&&e===this._position||t===`scale`&&e===this._scale)&&this.notify(`matrix`)}onStyleChange(e){if(e.source===this._style){let t=e.field;t===`texture`?this.notify(`texture`):t===`textureData`?this.notify(`textureData`):t===`addressModeU`||t===`addressModeV`?this.notify(`sampler`):this.notify(`style`)}else return}dispose(){this._position.delete(this,`position`),this._scale.delete(this,`scale`),this._style.delete(this),this._subscribers.clear(),this._disposed=!0}assertActive(){if(this._disposed)throw Error(`Disposed Raw cannot be reused.`)}notify(e){if(!this._disposed){this._version++;for(let t of this._subscribers)t.onRawChange(this,e)}}},bn=class extends _n{type=`IMesh`;_count=0;_capacity=0;_raw;_raws=new vn;_growthFactor=2;_ids=[];_pendingMatrices=new Set;_pendingStyles=new Set;_local=new l;_world=new l;_sources=[];_textures=[new J,new J,new J];_layerIndices=[new Map,new Map,new Map];_layersPending=!1;_instanceBounds=null;_boundsGeometry;_boundsGeometryVersion=-1;_boundsMatrixVersion=-1;_boundsZoom=NaN;constructor(e,t,n={}){xn(n),super(e,t,!1),this._raw=n.raw??!0,this.growthFactor=n.growthFactor??2;try{this.capacity=n.capacity??2}catch(e){throw super.dispose(),e}}get boundingBox(){return this.aggregateBounds(1)}getRenderBoundingBox(e){let t=1;return this.ignoreZoom&&e.zoom>0&&Number.isFinite(e.zoom)&&(t=e.zoom),this.aggregateBounds(t)}aggregateBounds(e){let t=super.boundingBox,n=this.data;if(t!==null&&n!==void 0&&this.count>0){if(this.updateInstanceData(),this._boundsGeometry!==n||this._boundsGeometryVersion!==n.version||this._boundsMatrixVersion!==this.matrixVersion||this._boundsZoom!==e){let r=t.local,i=1/0,a=1/0,o=-1/0,s=-1/0;for(let t=0;t<this.count;t++){let n=t*12;for(let t of[r.x,r.x+r.width])for(let c of[r.y,r.y+r.height]){let r=(this.matrixData[n]*t+this.matrixData[n+4]*c)/e+this.matrixData[n+8],l=(this.matrixData[n+1]*t+this.matrixData[n+5]*c)/e+this.matrixData[n+9];i=Math.min(i,r),a=Math.min(a,l),o=Math.max(o,r),s=Math.max(s,l)}}this._instanceBounds={local:r,world:{x:i,y:a,width:o-i,height:s-a}},this._boundsGeometry=n,this._boundsGeometryVersion=n.version,this._boundsMatrixVersion=this.matrixVersion,this._boundsZoom=e}return this._instanceBounds}return this._instanceBounds=null,null}get raw(){return this._raw}get raws(){return this._raws}get growthFactor(){return this._growthFactor}set growthFactor(e){if(!Number.isSafeInteger(e)||e<2)throw RangeError(`growthFactor must be an integer >= 2.`);this._growthFactor=e}get capacity(){return this._capacity}set capacity(e){if(this.assertActive(),!Number.isSafeInteger(e)||e<1||e<this._count)throw RangeError(`Invalid capacity.`);if(!(e<=this._capacity)){if(e>24403223)throw RangeError(`CPU array capacity exceeds 4 GiB.`);let t=new Float32Array(e*12),n=new Float32Array(e*44);t.set(this._matrixData.subarray(0,this._count*12)),n.set(this._styleData.subarray(0,this._count*44)),this._matrixData=t,this._styleData=n,this._capacity=e,this._matrixVersion++,this._styleVersion++,this.updateVersion()}}get textures(){return this.updateTextureLayers(),this._textures}push(e={}){this.assertActive();let t=this.resolve(e);this.ensureCapacity(this._count+1),this.ensureWorldMatrix();let n=this._count,r;r=this._raw?new yn(n,t):void 0;let i=r?.id??h();return this._count++,this._ids.push(i),r!==void 0&&(this._raws.add(r),r.add(this)),this.writeMatrix(n,t),this.writeStyle(n,t.style,t.enabled),this.setSources(n,t.style),this._matrixVersion++,this._styleVersion++,this.updateVersion(),i}updateAt(e,t){if(this.assertActive(),!Number.isSafeInteger(e)||e<0||e>=this._count)throw RangeError(`Invalid slot index.`);let n=this.resolve(t),r=this._raws.map.get(this._ids[e]);r!==void 0&&(r.position=n.position,r.rotation=n.rotation,r.scale=n.scale,r.style=n.style,r.enabled=n.enabled),this.ensureWorldMatrix(),this.writeMatrix(e,n),this.writeStyle(e,n.style,n.enabled),this.setSources(e,n.style),this._pendingMatrices.delete(e),this._pendingStyles.delete(e),this._matrixVersion++,this._styleVersion++,this.updateVersion()}onRawChange(e,t){if(!this._disposed&&this._raws.map.get(e.id)===e)t===`matrix`?this._pendingMatrices.add(e.index):t!==`textureData`&&t!==`sampler`&&this._pendingStyles.add(e.index),t===`texture`&&this.setSources(e.index,e.style),this._materialPending=!0;else return}onMathChange(e,t){super.onMathChange(e,t),!this._raw&&t===`worldMatrix`&&(this._matrixPending=!1)}updateInstanceData(){this.assertActive(),this.ensureWorldMatrix(),this._geometryPending&&this.data!==void 0&&this.material?.addGeometryType(this.data.type);let e=!1,t=!1;if(this._raw&&this._matrixPending){for(let e of this._raws.map.values())this.writeMatrix(e.index,e);e=this._count>0}else for(let t of this._pendingMatrices){let n=this._raws.map.get(this._ids[t]);n!==void 0&&(this.writeMatrix(t,n),e=!0)}this.updateTextureLayers();for(let e of this._pendingStyles){let n=this._raws.map.get(this._ids[e]);n!==void 0&&(this.writeStyle(e,n.style,n.enabled),t=!0)}e&&this._matrixVersion++,t&&this._styleVersion++,this._pendingMatrices.clear(),this._pendingStyles.clear(),this._matrixPending=!1,this._stylePending=!1,this._geometryPending=!1,this._materialPending=!1}clear(){this.assertActive(),this._raws.clear(),this._count=0,this._ids.length=0,this._sources.length=0,this._pendingMatrices.clear(),this._pendingStyles.clear();for(let e of this._textures)e.set([]);for(let e of this._layerIndices)e.clear();this._layersPending=!1,this._matrixVersion++,this._styleVersion++,this.updateVersion(),this.getScene(this)?.updateVersion()}dispose(){if(!this._disposed){this.clear();for(let e of this._textures)e.dispose();super.dispose()}}ensureCapacity(e){let t=this._capacity;for(;t<e;)t=t<1e5?Math.min(t*this._growthFactor,1e5):Math.ceil(e/1e5)*1e5;t!==this._capacity&&(this.capacity=t)}resolve(e){let t={position:e.position??new c,rotation:e.rotation??0,scale:e.scale??new c(1,1),style:e.style??this.material?.style??new D,enabled:e.enabled??!0};if(![t.position.x,t.position.y,t.scale.x,t.scale.y,t.rotation].every(Number.isFinite))throw RangeError(`Transform components must be finite.`);return t}writeMatrix(e,t){let n=Math.cos(t.rotation),r=Math.sin(t.rotation);this._local.set([n*t.scale.x,r*t.scale.x,0,-r*t.scale.y,n*t.scale.y,0,t.position.x,t.position.y,1]),this._world.mul(this.worldMatrix,this._local),this._matrixData.set(this._world.GPUData,e*12)}writeStyle(e,t,n){let r=e*44;fe(t,this._styleData,r,this.ignoreZoom),n||this._styleData.fill(0,r+36,r+40),this.writeLayers(e)}setSources(e,t){let n=this._sources.at(e),r=[t.solid.texture,t.edge.texture,t.points.texture];if(n===void 0||!r.every((e,t)=>e===n?.[t]))this._sources[e]=r,this._layersPending=!0,this.getScene(this)?.updateVersion();else return}updateTextureLayers(){if(this._layersPending){for(let e=0;e<3;e++){let t=this._layerIndices[e],n=[];t.clear();for(let r of this._sources){let i=r[e];t.has(i)||(t.set(i,n.length),n.push(i))}this._textures[e].set(n)}for(let e=0;e<this._count;e++)this.writeLayers(e);this._styleVersion++,this._layersPending=!1}else return}writeLayers(e){for(let t=0;t<3;t++)this._styleData[e*44+40+t]=this._layerIndices[t].get(this._sources[e]?.[t])??0}assertActive(){if(this._disposed)throw Error(`Disposed IMesh cannot be reused.`)}},xn=e=>{let t=e.capacity??2,n=e.growthFactor??2;if(!Number.isSafeInteger(t)||t<1||t>24403223)throw RangeError(`Invalid initial capacity.`);if(!Number.isSafeInteger(n)||n<2)throw RangeError(`growthFactor must be an integer >= 2.`)},Sn=class e{bounds;depth;_items=[];_children=new Map;constructor(e,t){this.bounds=e,this.depth=t}insert(t){let n=this.bounds,r=n.width/2,i=n.height/2,a=n.x+r,o=n.y+i,s=-1,c=-1;if(t.bounds.x+t.bounds.width<=a?s=0:t.bounds.x>=a&&(s=1),t.bounds.y+t.bounds.height<=o?c=0:t.bounds.y>=o&&(c=1),this.depth>0&&s>=0&&c>=0&&r>0&&i>0){let a=c*2+s,o=this._children.get(a);o===void 0&&(o=new e({x:n.x+s*r,y:n.y+c*i,width:r,height:i},this.depth-1),this._children.set(a,o)),o.insert(t)}else this._items.push(t)}query(e,t){if(Cn(this.bounds,e)){for(let n of this._items)Cn(n.bounds,e)&&t.add(n.mesh);for(let n of this._children.values())n.query(e,t)}}},Cn=(e,t)=>e.x<=t.x+t.width&&t.x<=e.x+e.width&&e.y<=t.y+t.height&&t.y<=e.y+e.height,wn=class{_entries=new Map;_tree=null;_depth=-1;_queryStamp=``;_queryOrder=[];_queryVersions=new Map;get tree(){return this._tree}update(e,t,n,r,i){let a=new Set,o=r||i&&this._depth!==n;t.ensureCameraMatrix();let s=[t.id,t.version,t.viewMatrix.version,t.orthogonalMatrix.version,t.zoomVersion].join(`/`),c=r||this._queryStamp!==s||this._queryOrder.length!==e.length,l=0;for(let n of e){if(n.culling){n.bounding=!0;let e=n.getRenderBoundingBox(t)?.world;if(e!==void 0&&Tn(e)){a.add(n);let t=this._entries.get(n);(t===void 0||!En(t.bounds,e))&&(this._entries.set(n,{mesh:n,bounds:e}),o=!0)}}n.updateInstanceData();let e=[n.version,n.matrixVersion,n.styleVersion,n.data?.version,n.material?.version,n.count,n.culling,n.ignoreZoom].join(`/`);(this._queryVersions.get(n)!==e||this._queryOrder[l]!==n)&&(c=!0,this._queryVersions.set(n,e)),l++}for(let e of this._entries.keys())a.has(e)||(this._entries.delete(e),o=!0);if(i){if(o){let e=[...this._entries.values()],t=Dn(e);if(this._tree=null,t!==null){this._tree=new Sn(t,n);for(let t of e)this._tree.insert(t)}this._depth=n}}else this._tree=null,this._depth=-1;return(c||o)&&(this._queryOrder=[...e],this._queryStamp=s),c||o}boxList(e,t){let n=[];for(let r of e){let e=this._entries.get(r);(e===void 0||An(e.bounds,t,jn(r,t)))&&n.push(r)}return n}quadList(e,t){let n=On(t);if(Tn(n)){let r=0;for(let n of e)r=Math.max(r,jn(n,t));let i=new Set;this._tree?.query(kn(n,r),i);let a=[];for(let t of e)(!this._entries.has(t)||i.has(t))&&a.push(t);return a}return[...e]}remove(e){for(let t of this._entries.keys())e.has(t.id)&&this._entries.delete(t);for(let t of this._queryVersions.keys())e.has(t.id)&&this._queryVersions.delete(t);let t=[];for(let n of this._queryOrder)e.has(n.id)||t.push(n);this._queryOrder=t,this._tree=null,this._depth=-1}},Tn=e=>[e.x,e.y,e.width,e.height,e.x+e.width,e.y+e.height].every(Number.isFinite)&&e.width>=0&&e.height>=0,En=(e,t)=>e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height,Dn=e=>{let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let a of e){let e=a.bounds;t=Math.min(t,e.x),n=Math.min(n,e.y),r=Math.max(r,e.x+e.width),i=Math.max(i,e.y+e.height)}return Number.isFinite(t)?{x:t,y:n,width:r-t,height:i-n}:null},On=e=>{let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let a of[-1,1])for(let o of[-1,1]){let s=e.ndcToWorld(new c(a,o));t=Math.min(t,s.x),n=Math.min(n,s.y),r=Math.max(r,s.x),i=Math.max(i,s.y)}return{x:t,y:n,width:r-t,height:i-n}},kn=(e,t)=>({x:e.x-t,y:e.y-t,width:e.width+t*2,height:e.height+t*2}),An=(e,t,n)=>{let r=kn(e,n),i=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}],a=[];for(let e of i){let n=t.worldToNdc(new c(e.x,e.y));a.push({x:n.x,y:n.y})}let o=[{x:-1,y:-1},{x:1,y:-1},{x:1,y:1},{x:-1,y:1}];return!x(a,o)&&!x(o,a)},jn=(e,t)=>{e.updateInstanceData();let n=Nn(e),r=t.viewMatrix.clone().invert().data,i=Math.max(Math.abs(r[0])+Math.abs(r[3]),Math.abs(r[1])+Math.abs(r[4])),a=Math.max(Math.abs(t.zoom),1e-30);return(n.viewMargin+n.pixelMargin/a)*i},Mn=new WeakMap,Nn=e=>{let t=e.data,n=Mn.get(e);if(n!==void 0&&n.geometry===t&&n.geometryVersion===t?.version&&n.styleVersion===e.styleVersion&&n.count===e.count&&n.ignoreZoom===e.ignoreZoom)return n;{let n=1,r=0,i=1,a=0;if(t!==void 0){let e=Fn(t);i=e.miter,a=e.pointRadius}for(let a=0;a<e.count;a++){let o=a*44,s=e.styleData,c=Math.abs(t?.uniformData[3]??0)*i;s[o+38]===0&&(c=0),e.ignoreZoom||s[o+27]===0?n=Math.max(n,c):r=Math.max(r,c)}n=Math.max(n,a),r=Math.max(r,a);let o={geometry:t,geometryVersion:t?.version,styleVersion:e.styleVersion,count:e.count,ignoreZoom:e.ignoreZoom,pixelMargin:n,viewMargin:r};return Mn.set(e,o),o}},Pn=new WeakMap,Fn=e=>{let t=Pn.get(e);if(t?.version!==e.version){t={version:e.version,miter:1,pointRadius:0};for(let n of e.miterScale??[])t.miter=Math.max(t.miter,Math.abs(n));let n=e.position,r=e.geometry;if(n!==void 0&&r!==void 0)for(let i=0;i+1<n.length;i+=2)e.vertexType?.[i/2]===1&&(t.pointRadius=Math.max(t.pointRadius,Math.hypot(r[i]-n[i],r[i+1]-n[i+1])));Pn.set(e,t)}return t},In=class extends q{type=`Scene`;_listsSnapshot=-1;_box=null;_quad=null;_quadTreeDepth=2;_spatial=new wn;_spatialMode=null;boxDrawList=[];quadDrawList=[];_textureSnapshot=-1;_materialGeometryTypes=new Map;drawList=[];geometryList=[];materialList=[];textureList=[];constructor(){super(0,0)}get box(){return this._box}set box(e){(this._box!==e||e!==null&&this._quad!==null)&&(this._box=e,e!==null&&(this._quad=null),this.boxDrawList=[],this.quadDrawList=[],this._spatialMode=null,this.updateVersion())}get quad(){return this._quad}set quad(e){(this._quad!==e||e!==null&&this._box!==null)&&(this._quad=e,e!==null&&(this._box=null),this.boxDrawList=[],this.quadDrawList=[],this._spatialMode=null,this.updateVersion())}get quadTreeDepth(){return this._quadTreeDepth}set quadTreeDepth(e){if(Number.isInteger(e)&&e>=0&&e<=16)this._quadTreeDepth!==e&&(this._quadTreeDepth=e,this.updateVersion());else throw RangeError(`quadTreeDepth must be an integer in [0, 16].`)}get quadTree(){let e=null;return this._quad!==null&&(e=this._spatial.tree),e}quadTreeUpdate(){this.updateSpatialLists(!0)}updateSpatialLists(e=!1){let t=this._box??this._quad;if(t!==null){let n=this.ensureLists(),r=this._spatial.update(n,t,this._quadTreeDepth,e,this._quad!==null);this._box===null?((r||this._spatialMode!==`quad`)&&(this.quadDrawList=this._spatial.quadList(n,t)),this.boxDrawList=[],this._spatialMode=`quad`):((r||this._spatialMode!==`box`)&&(this.boxDrawList=this._spatial.boxList(n,t)),this.quadDrawList=[],this._spatialMode=`box`)}else this.boxDrawList=[],this.quadDrawList=[]}getRenderDrawList(){let e=this.drawList;return this._box===null?this._quad!==null&&(e=this.quadDrawList):e=this.boxDrawList,e}ensureLists(){return this._listsSnapshot!==this.version&&this.updateLists(),this.drawList}addToLists(e){let t=e=>{if(e instanceof _n&&e.data!==void 0&&e.material!==void 0){this.drawList.some(t=>t.id===e.id)||this.drawList.push(e),this.geometryList.some(t=>t.id===e.data?.id)||this.geometryList.push(e.data),this.materialList.some(t=>t.id===e.material?.id)||this.materialList.push(e.material),this.addMaterialGeometryType(e.material.id,e.data.type);for(let t of Ln(e))this.textureList.some(e=>e.id===t.id)||this.textureList.push(t)}if(e instanceof q)for(let n of e.children)t(n)};t(e),this.updateDrawOrder()}removeFromLists(e){let t=new Set,n=e=>{if(e instanceof _n&&t.add(e.id),e instanceof q)for(let t of e.children)n(t)};if(n(e),t.size!==0){let e=e=>!t.has(e.id);this.drawList=this.drawList.filter(e),this.boxDrawList=this.boxDrawList.filter(e),this.quadDrawList=this.quadDrawList.filter(e),this._spatial.remove(t),this.updateVersion()}else return}updateLists(){this.updateVersion();let e=[],t=n=>{if(n instanceof _n&&n.data!==void 0&&n.material!==void 0&&e.push(n),n instanceof q)for(let e of n.children)t(e)};for(let e of this.children)t(e);return this.drawList=e,this.updateResourceLists(),this.updateDrawOrder(),this._listsSnapshot=this.version,this.drawList}updateResourceLists(){this._materialGeometryTypes.clear();let e=[],t=[],n=[],r=new Set,i=new Set,a=new Set;for(let o of this.drawList){let s=o.data,c=o.material;if(s!==void 0&&!r.has(s.id)&&(r.add(s.id),e.push(s)),c!==void 0){i.has(c.id)||(i.add(c.id),t.push(c));for(let e of Ln(o))a.has(e.id)||(a.add(e.id),n.push(e));s!==void 0&&this.addMaterialGeometryType(c.id,s.type)}else continue}this.geometryList=e,this.materialList=t,this.textureList=n,this._textureSnapshot=this.version}updateDrawList(){return this.updateLists()}updateTextureList(){if(this._textureSnapshot===this.version)return this.textureList;{let e=this.textureList,t=[],n=new Set;for(let e of this.drawList)for(let r of Ln(e))n.has(r.id)||(n.add(r.id),t.push(r));return this.textureList=t,Rn(e,t)||this.updateVersion(),this._textureSnapshot=this.version,this.textureList}}getMaterialGeometryTypes(e){return this._materialGeometryTypes.get(e)??new Set}addMaterialGeometryType(e,t){let n=this._materialGeometryTypes.get(e);n===void 0&&(n=new Set,this._materialGeometryTypes.set(e,n)),n.add(t)}updateDrawOrder(){this.drawList.sort((e,t)=>e.order-t.order)}},Ln=e=>{let t=e.textures.filter(e=>e!==void 0),n=e.material?.values?.textures??[];return[...t,...n]},Rn=(e,t)=>{if(e.length===t.length){let n=new Set(t.map(e=>e.id));return e.every(e=>n.has(e.id))}return!1},zn=class{pipeline;constructor(e){this.pipeline=e}prepare(e){let t=this.pipeline.device;if(t!==void 0){let n=0;for(let t of e.drawList)n+=t.count;if(!Number.isSafeInteger(n)||n>=Bn)throw RangeError(`Scene exceeds 16777215 distinct depth levels.`);let r=0;for(let n of e.drawList){let e=n.material,i=n.count;if(i>0&&e!==void 0){let a=Number(e.depthTest&&e.depthWrite&&!e.transparent),o=this.pipeline.buffers.meshDepth.get(n.id);if(o===void 0){let e=new Uint32Array([r,i,a,0]),s=t.createBuffer({label:`Mesh `+String(n.id)+` Depth Parameters`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(s,0,e),o={meshId:n.id,buffer:s,data:e},this.pipeline.buffers.meshDepth.set(n.id,o)}else(o.data[0]!==r||o.data[1]!==i||o.data[2]!==a)&&(o.data.set([r,i,a,0]),t.queue.writeBuffer(o.buffer,0,o.data))}r+=i}}else return}ensureTexture(e,t){let n=this.pipeline.device;if(n!==void 0){let r=this.pipeline.depthTexture;if(r?.width!==e||r.height!==t){let i=n.createTexture({label:`Render Depth Texture`,size:{width:e,height:t},format:`depth32float`,usage:GPUTextureUsage.RENDER_ATTACHMENT}),a={texture:i,view:i.createView(),width:e,height:t};return r?.texture.destroy(),this.pipeline.depthTexture=a,a}return r}}},Bn=16777216,Vn=1e-13,Hn=999999999999,Un=class{reported=new Set;validateCamera(e){(!Number.isFinite(e.width)||e.width<=0)&&this.error(`CAMERA_WIDTH`,e.id,`Camera width 必须是大于 0 的有限数。`,e),(!Number.isFinite(e.height)||e.height<=0)&&this.error(`CAMERA_HEIGHT`,e.id,`Camera height 必须是大于 0 的有限数。`,e),!Number.isFinite(e.zoom)||e.zoom<=0?this.error(`CAMERA_ZOOM`,e.id,`Camera zoom 必须是大于 0 的有限数。`,e):(e.zoom<1e-13||e.zoom>999999999999)&&this.warn(`CAMERA_ZOOM_RANGE`,e.id,`Camera zoom 超出默认范围 [`+String(Vn)+`, `+String(Hn)+`]。`,e)}validateMaterial(e){e.transparent&&e.depthWrite&&this.warn(`TRANSPARENT_DEPTH_WRITE`,e.id,`透明混合同时写入深度可能挡住后方透明片元；通常使用 depthTest=true、depthWrite=false。`,e),!e.depthTest&&e.depthWrite&&this.warn(`DEPTH_WRITE_WITHOUT_TEST`,e.id,`已关闭深度测试但仍写深度；它不会检查场景遮挡，通常 UI 两项都关闭。`,e);let{solid:t,wireframe:n,edge:r,points:i}=e.style;for(let a of[t,n,r,i])(!Number.isFinite(a.opacity)||a.opacity<0||a.opacity>1)&&this.error(`STYLE_OPACITY_`+a.area,e.id,`分区透明度必须位于 0 到 1。`,e);for(let n of[t,r,i])n.texture!==void 0&&!n.enabled&&this.warn(`UNUSED_TEXTURE_`+n.area,e.id,`分区已设置贴图，但 enabled 尚未开启。`,e);i.enabled&&!i.vertices&&!i.midpoints&&this.warn(`EMPTY_POINT_SELECTION`,e.id,`关键点已开启，但未选择顶点或边中点；不会生成点型。`,e)}validateGeometry(e){if(e.geometry!==void 0){if(e.normal===void 0||e.uv===void 0||e.index===void 0||e.vertexType===void 0||e.position===void 0||e.miterScale===void 0)this.error(`GEOMETRY_MISSING`,e.id,`合并三角面缺少 normal、uv、index、vertexType、position 或 miterScale。`,e);else{let t=e.geometry.length/2;this.validatePart(e.id,`geometry`,{geometry:e.geometry,normal:e.normal,uv:e.uv,index:e.index,miterScale:e.miterScale},3,!0,e),(e.vertexType.length!==t||e.vertexType.some(e=>e!==0&&e!==.5&&e!==1))&&this.error(`VERTEX_TYPE`,e.id,`vertexType 必须逐顶点对应，且只能为 0、0.5、1。`,e),(e.position.length!==e.geometry.length||Q(e.position)!==-1)&&this.error(`GEOMETRY_POSITION`,e.id,`position 必须与 geometry 等长且全部为有限数。`,e);for(let t=0;t<e.index.length;t+=3){let n=e.vertexType[e.index[t]];if(e.vertexType[e.index[t+1]]!==n||e.vertexType[e.index[t+2]]!==n){this.error(`TRIANGLE_VERTEX_TYPE`,e.id,`一个三角面的三个顶点必须属于同一 vertexType。`,e);break}}}}e.linePoints!==void 0&&this.validatePart(e.id,`linePoints`,e.linePoints,2,!1,e),e.style.wireframe.enabled&&e.linePoints===void 0&&this.error(`WIREFRAME_DATA`,e.id,`Geometry wireframe 已开启，但没有生成 linePoints。`,e),e.style.edge.uvRepeat!==1&&!e.style.wireframe.enabled&&!e.style.edge.enabled&&this.warn(`UNUSED_UV_REPEAT`,e.id,`uvRepeat 只作用于边框，当前值不会被使用。`,e),(e.uniformData.length!==4||Q(e.uniformData)!==-1)&&this.error(`GEOMETRY_UNIFORM`,e.id,`Geometry uniformData 必须包含 4 个有限数。`,e)}validateMesh(e){let t=e.data,n=e.material;if(t!==void 0&&n!==void 0){if(t.style.solid.enabled&&![`Rect2D`,`Poly2D`,`NGon2D`,`Text`,`Base2D`].includes(t.type)&&this.error(`UNSUPPORTED_SOLID_TYPE`,e.id,`未提供该类型的实体面 Shader。`,e),e instanceof bn){t.style.wireframe.enabled&&e.count>1&&this.warn(`IMESH_NATIVE_LINES`,e.id,`原生 line-list 使用逐实例顺序回退；只用三角面时才合并为一次绘制。`,e);for(let r of e.raws.map.values()){[`Poly2D`,`NGon2D`,`Text`].includes(t.type)&&r.style.solid.borderWidth>0&&this.warn(`UNSUPPORTED_SDF_BORDER`,e.id,`Poly2D/NGon2D/Text 不使用矩形 SDF 边框，请启用 edge 分区。`,e),t.type===`Poly2D`&&(r.style.join.type!==t.style.join.type||r.style.join.seg!==t.style.join.seg)&&this.warn(`IMESH_JOIN_TEMPLATE`,e.id,`连接类型和精度由 Geometry.style.join 决定，Raw 不生成独立拓扑。`,e);for(let n of[`solid`,`wireframe`,`edge`,`points`])r.style[n].enabled&&!t.style[n].enabled&&this.warn(`IMESH_MISSING_`+n,e.id,`实例启用了模板未生成的 `+n+` 分区；请先配置 Geometry.style。`,e);for(let t of[`solid`,`edge`,`points`])(r.style[t].addressModeU!==n.style[t].addressModeU||r.style[t].addressModeV!==n.style[t].addressModeV)&&this.warn(`IMESH_SAMPLER_`+t,e.id,`一次绘制共用 Material.style 的采样器，Raw.style 的寻址方式不单独生效。`,e);r.style.edge.enabled&&(r.style.edge.width!==t.style.edge.width||r.style.edge.uvRepeat!==t.style.edge.uvRepeat)&&this.warn(`IMESH_EDGE_TEMPLATE`,e.id,`实例实体边框宽度和 UV Repeat 由共用 Geometry.style 生成，Raw 不重建独立几何。`,e),r.style.points.enabled&&(r.style.points.radius!==t.style.points.radius||r.style.points.segments!==t.style.points.segments||r.style.points.vertices!==t.style.points.vertices||r.style.points.midpoints!==t.style.points.midpoints||r.style.points.minPointsLength!==t.style.points.minPointsLength||r.style.points.minEdgePointsLength!==t.style.points.minEdgePointsLength)&&this.warn(`IMESH_POINTS_TEMPLATE`,e.id,`关键点半径、段数、选择规则由共用 Geometry.style 决定。`,e)}return}[`Poly2D`,`NGon2D`,`Text`].includes(t.type)&&n.style.solid.borderWidth>0&&this.warn(`UNSUPPORTED_SDF_BORDER`,e.id,`Poly2D/NGon2D/Text 不使用矩形 SDF 边框，请启用 edge 分区。`,e),t.type===`Poly2D`&&(t.style.join.type!==n.style.join.type||t.style.join.seg!==n.style.join.seg)&&this.warn(`POLY_JOIN_STYLE`,e.id,`连接拓扑由 Geometry.style.join 生成，建议几何与材质共享 Style。`,e);for(let r of[`solid`,`wireframe`,`edge`,`points`])t.style[r].enabled!==n.style[r].enabled&&this.warn(`STYLE_ENABLED_`+r,e.id,`几何与材质的分区开关不同；建议引用同一个 Style。`,e);t.style!==n.style&&t.style.edge.enabled&&(t.style.edge.width!==n.style.edge.width||t.style.edge.borderAlign!==n.style.edge.borderAlign)&&this.warn(`STYLE_EDGE_PARAMETERS`,e.id,`几何与材质的实体边框参数不同；几何宽度参与生成，建议共享 Style。`,e)}else{this.error(`MESH_RESOURCE`,e.id,`Mesh 缺少 Geometry 或 Material。`,e);return}}validatePart(e,t,n,r,i,a){let o=n.geometry.length/2;n.geometry.length%2!=0&&this.error(`GEOMETRY_VERTEX_`+t,e,t+` 顶点数组长度必须是 2 的倍数。`,a),n.normal.length!==n.geometry.length&&this.error(`GEOMETRY_NORMAL_`+t,e,t+` 法线数量必须与顶点数量一致。`,a),n.uv.length!==n.geometry.length&&this.error(`GEOMETRY_UV_`+t,e,t+` UV 数量必须与顶点数量一致。`,a),n.index.length%r!==0&&this.error(`GEOMETRY_INDEX_COUNT_`+t,e,t+` 索引数量与图元类型不匹配。`,a),(n.geometry.length===0||n.index.length===0)&&this.warn(`EMPTY_GEOMETRY_`+t,e,t+` 不包含可绘制图元。`,a),(Q(n.geometry)!==-1||Q(n.normal)!==-1||Q(n.uv)!==-1)&&this.error(`GEOMETRY_NUMBER_`+t,e,t+` 包含 NaN 或 Infinity。`,a);for(let r of n.index)if(r>=o){this.error(`GEOMETRY_INDEX_RANGE_`+t,e,t+` 存在越界索引 `+String(r)+`。`,a);break}i&&n.miterScale===void 0?this.error(`GEOMETRY_MITER_MISSING_`+t,e,t+` 缺少 miterScale。`,a):n.miterScale!==void 0&&(n.miterScale.length!==o&&this.error(`GEOMETRY_MITER_COUNT_`+t,e,t+` miterScale 数量必须与顶点数量一致。`,a),Q(n.miterScale)!==-1&&this.error(`GEOMETRY_MITER_NUMBER_`+t,e,t+` miterScale 包含 NaN 或 Infinity。`,a))}warn(e,t,n,r){let i=`warn_`+e+`_`+String(t);if(!this.reported.has(i))this.reported.add(i),console.warn(`[BPLineJS:`+e+`] `+n,r);else return}error(e,t,n,r){let i=`error_`+e+`_`+String(t);if(!this.reported.has(i))this.reported.add(i),console.error(`[BPLineJS:`+e+`] `+n,r);else return}},Q=e=>{for(let t=0;t<e.length;t+=1)if(Number.isFinite(e[t])===!1)return t;return-1},Wn=class{pipeline;depthManager;developmentValidator=new Un;_cameraSnapshot;_validatedMaterials=new WeakMap;constructor(e){this.pipeline=e,this.depthManager=new zn(e)}draw(e,t,n,r){let i=this.pipeline.device;if(i!==void 0)r===`development`&&this.developmentValidator.validateCamera(t),this.drawCameraBuffers(i,t,n),this.drawGeometryBuffers(i,e,r),this.prepareMaterials(e,r),this.drawCustomValueBuffers(i,e),this.drawMeshBuffers(i,e,t,r),this.depthManager.prepare(e);else return}prepareMaterials(e,t){if(t===`development`)for(let t of e.materialList)if(this._validatedMaterials.get(t)!==t.version)this.developmentValidator.validateMaterial(t),this._validatedMaterials.set(t,t.version);else continue;else return}drawCustomValueBuffers(e,t){for(let n of t.materialList){let t=n.values;if(t===void 0)continue;let r=this.pipeline.customValues.get(n.id);r===void 0&&(r={buffers:new Map},this.pipeline.customValues.set(n.id,r));let i=new Set;for(let a of t.entries){if(a.kind===`texture`)continue;i.add(a.name);let o=r.buffers.get(a.name),s=0;(a.value instanceof c||a.value instanceof l)&&(s=a.value.version);let u=4;if(a.value instanceof c&&(u=8),a.value instanceof l&&(u=48),a.value instanceof Float32Array&&(u=a.value.byteLength),o===void 0||o.byteLength!==u){o?.buffer.destroy();let i=GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST;a.kind===`array<f32>`&&(i=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);let c=t.getBufferData(a),l=this.createBuffer(e,`Material `+String(n.id)+` Value `+a.name,c,i);r.buffers.set(a.name,{buffer:l,byteLength:u,value:a.value,valueVersion:s,storeVersion:t.version}),r.bindGroup=void 0}else if(o.value!==a.value||o.valueVersion!==s||o.storeVersion!==t.version){let n=t.getBufferData(a);e.queue.writeBuffer(o.buffer,0,n),o.value=a.value,o.valueVersion=s,o.storeVersion=t.version}}for(let[e,t]of r.buffers)i.has(e)||(t.buffer.destroy(),r.buffers.delete(e),r.bindGroup=void 0)}}createBuffer(e,t,n,r){let i=e.createBuffer({label:t,size:n.byteLength,usage:r});return e.queue.writeBuffer(i,0,n),i}drawCameraBuffers(e,t,n){t.ensureCameraMatrix();let r=this.useCameraRelativeMatrices(t),i=t.viewMatrix.GPUData;r&&(i=new Float32Array(i),i[8]=0,i[9]=0);let a=this.pipeline.buffers.cameraUniform,o=this._cameraSnapshot,s=o?.camera!==t,c=s||o?.view!==t.viewMatrix||o.viewVersion!==t.viewMatrix.version||o.relative!==r,l=s||o?.projection!==t.orthogonalMatrix||o.projectionVersion!==t.orthogonalMatrix.version,u=s||o?.zoom!==t.zoom||o.dpr!==n,d=a.length===0;d?a.push(this.createBuffer(e,`Camera View Matrix Buffer`,i,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),this.createBuffer(e,`Camera Orthogonal Matrix Buffer`,t.orthogonalMatrix.GPUData,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),this.createBuffer(e,`Render Camera Parameters Buffer`,new Float32Array([t.zoom,n,0,0]),GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST)):(c&&e.queue.writeBuffer(a[0],0,i),l&&e.queue.writeBuffer(a[1],0,t.orthogonalMatrix.GPUData),u&&e.queue.writeBuffer(a[2],0,new Float32Array([t.zoom,n,0,0]))),(d||c||l||u)&&(this._cameraSnapshot={camera:t,view:t.viewMatrix,viewVersion:t.viewMatrix.version,projection:t.orthogonalMatrix,projectionVersion:t.orthogonalMatrix.version,zoom:t.zoom,dpr:n,relative:r})}drawMeshBuffers(e,t,n,r){let i=this.useCameraRelativeMatrices(n),a=n.ensureWorldMatrix().data,o=a[6],s=a[7];for(let a of t.drawList){r===`development`&&(a.geometryPending||a.materialPending||!this.pipeline.buffers.meshStyle.has(a.id))&&this.developmentValidator.validateMesh(a);let t=a.material;if(t!==void 0){a.updateInstanceData();let r=1;if(a.ignoreZoom&&Number.isFinite(n.zoom)&&n.zoom>0&&(r=1/n.zoom),a.count!==0){let c=Math.min(e.limits.maxBufferSize,e.limits.maxStorageBufferBindingSize);if(a.matrixData.byteLength>c||a.styleData.byteLength>c)throw RangeError(`Mesh `+String(a.id)+` capacity exceeds this GPUDevice storage buffer limit: `+String(c)+` bytes.`);let l=this.pipeline.buffers.meshMatrix,u=l.get(a.id);if(u!==void 0&&u.capacity!==a.capacity&&(u.buffer.destroy(),l.delete(a.id),u=void 0),u===void 0){let t=a.matrixData;(i||r!==1)&&(t=this.renderMatrices(a,n,i,o,s,r)),u={meshId:a.id,capacity:a.capacity,version:a.matrixVersion,relative:i,originX:o,originY:s,zoomScale:r,buffer:this.createBuffer(e,`Mesh `+String(a.id)+` Instance Matrices`,t,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)},l.set(a.id,u)}else if(u.version!==a.matrixVersion||u.zoomScale!==r||u.relative!==i||i&&(u.originX!==o||u.originY!==s)){let t=a.matrixData;(i||r!==1)&&(t=this.renderMatrices(a,n,i,o,s,r)),e.queue.writeBuffer(u.buffer,0,t,0,a.count*12),u.version=a.matrixVersion,u.relative=i,u.originX=o,u.originY=s,u.zoomScale=r}let d=this.pipeline.buffers.meshStyle.get(a.id);d!==void 0&&d.capacity!==a.capacity&&(d.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(a.id),d=void 0),d===void 0?this.pipeline.buffers.meshStyle.set(a.id,{meshId:a.id,materialId:t.id,capacity:a.capacity,version:a.styleVersion,buffer:this.createBuffer(e,`Mesh `+String(a.id)+` Instance Styles`,a.styleData,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)}):(d.materialId=t.id,d.version!==a.styleVersion&&(e.queue.writeBuffer(d.buffer,0,a.styleData,0,a.count*44),d.version=a.styleVersion))}else continue}else continue}}useCameraRelativeMatrices(e){let t=e.ensureWorldMatrix().data,n=Math.max(Math.abs(t[6]),Math.abs(t[7]))*e.zoom*2**-23;return e.zoom>=4096||n>=.1}renderMatrices(e,t,n,r,i,a){let o=new Float32Array(e.matrixData),s=e.getRenderMatrix(t).data,c=this.usesBuiltInVertex(e),l=r-s[6],u=i-s[7],d=s[0]*s[4]-s[1]*s[3];for(let t=0;t<e.count;t++){let f=t*12;if(o[f+3]=0,o[f+7]=0,e instanceof bn)for(let e=0;e<2;e++)for(let t=0;t<3;t++){let n=f+e*4+t;o[n]*=a}else for(let e=0;e<2;e++)for(let t=0;t<3;t++)o[f+e*4+t]=s[e*3+t];if(n&&e instanceof bn)o[f+8]=e.matrixData[f+8]-Math.fround(r),o[f+9]=e.matrixData[f+9]-Math.fround(i);else if(n&&c&&Number.isFinite(d)&&d!==0){let e=Math.fround((s[4]*l-s[3]*u)/d),t=Math.fround((s[0]*u-s[1]*l)/d);Number.isFinite(e)&&Number.isFinite(t)?(o[f+3]=e,o[f+7]=t,o[f+8]=s[0]*e+s[3]*t-l,o[f+9]=s[1]*e+s[4]*t-u):(o[f+8]=-l,o[f+9]=-u)}else n&&(o[f+8]=-l,o[f+9]=-u)}return o}usesBuiltInVertex(e){let t=e.data,n=e.material;if(t!==void 0&&n!==void 0){let e=n.getShaderSource(t.type).vertex;return t.type===`Rect2D`?e===St:t.type===`NGon2D`?e===bt:e===xt}return!1}drawGeometryBuffers(e,t,n){for(let r of t.geometryList){r.ensureGeometry();let t=this.pipeline.buffers.geometry.get(r.id);if(t?.version!==r.version){if(n===`development`&&this.developmentValidator.validateGeometry(r),r.type===`Base2D`&&t!==void 0&&this.updateBase2DBuffers(e,r,t))continue;t!==void 0&&(this.destroyGeometryBuffer(t),this.pipeline.buffers.geometry.delete(r.id));let i=r.geometry,a=r.normal,o=r.uv,s=r.index,c=r.vertexType,l=r.position,u=r.miterScale,d;d=i!==void 0&&a!==void 0&&o!==void 0&&s!==void 0&&c!==void 0&&l!==void 0&&u!==void 0&&s.length>0?this.createGeometryBufferPart(e,`Geometry `+String(r.id)+` Merged`,{geometry:i,normal:a,uv:o,index:s,vertexType:c,position:l,miterScale:u}):void 0;let f;if(f=r.linePoints!==void 0&&r.linePoints.index.length>0?this.createGeometryBufferPart(e,`Geometry `+String(r.id)+` Line Points`,r.linePoints):void 0,d!==void 0||f!==void 0){let t=this.createBuffer(e,`Geometry `+String(r.id)+` Parameters Buffer`,r.uniformData,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);this.pipeline.buffers.geometry.set(r.id,{geometryId:r.id,version:r.version,uniform:t,geometry:d,linePoints:f})}else continue}else continue}}updateBase2DBuffers(e,t,n){let r=n.geometry,i=t.geometry,a=t.normal,o=t.uv,s=t.index,c=t.vertexType,l=t.position,u=t.miterScale;if(r===void 0||t.linePoints!==void 0||n.linePoints!==void 0||i===void 0||a===void 0||o===void 0||s===void 0||c===void 0||l===void 0||u===void 0||r.vertexType===void 0||r.position===void 0||r.miterScale===void 0)return!1;let d=`uint16`;s instanceof Uint32Array&&(d=`uint32`);let f=Math.ceil(s.byteLength/4)*4;if(r.vertex.size!==i.byteLength||r.normal.size!==a.byteLength||r.uv.size!==o.byteLength||r.index.size!==f||r.vertexType.size!==c.byteLength||r.position.size!==l.byteLength||r.miterScale.size!==u.byteLength||r.indexFormat!==d)return!1;let p=new Uint8Array(f);return p.set(new Uint8Array(s.buffer,s.byteOffset,s.byteLength)),e.queue.writeBuffer(r.vertex,0,new Float32Array(i)),e.queue.writeBuffer(r.normal,0,new Float32Array(a)),e.queue.writeBuffer(r.uv,0,new Float32Array(o)),e.queue.writeBuffer(r.index,0,p),e.queue.writeBuffer(r.vertexType,0,new Float32Array(c)),e.queue.writeBuffer(r.position,0,new Float32Array(l)),e.queue.writeBuffer(r.miterScale,0,new Float32Array(u)),e.queue.writeBuffer(n.uniform,0,new Float32Array(t.uniformData)),r.pointsFirstIndex=this.getPointsFirstIndex({geometry:i,normal:a,uv:o,index:s,vertexType:c,position:l,miterScale:u}),n.version=t.version,!0}createGeometryBufferPart(e,t,n){let r=new Float32Array(n.geometry),i=new Float32Array(n.normal),a=new Float32Array(n.uv),o;o=n.index instanceof Uint32Array?new Uint32Array(n.index):new Uint16Array(n.index);let s;s=n.position===void 0?void 0:new Float32Array(n.position);let c;c=n.miterScale===void 0?void 0:new Float32Array(n.miterScale);let l=Math.ceil(o.byteLength/4)*4,u=new Uint8Array(l);u.set(new Uint8Array(o.buffer));let d;n.vertexType!==void 0&&(d=this.createBuffer(e,t+` Vertex Type Buffer`,new Float32Array(n.vertexType),GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST));let f=`uint16`;n.index instanceof Uint32Array&&(f=`uint32`);let p;s!==void 0&&(p=this.createBuffer(e,t+` Point Centers Buffer`,s,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST));let m;return c!==void 0&&(m=this.createBuffer(e,t+` Miter Scale Buffer`,c,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST)),{vertex:this.createBuffer(e,t+` Vertex Buffer`,r,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),normal:this.createBuffer(e,t+` Normal Buffer`,i,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),uv:this.createBuffer(e,t+` UV Buffer`,a,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),index:this.createBuffer(e,t+` Index Buffer`,u,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST),vertexType:d,pointsFirstIndex:this.getPointsFirstIndex(n),indexFormat:f,position:p,miterScale:m}}getPointsFirstIndex(e){if(e.vertexType!==void 0){for(let t=0;t<e.index.length;t+=1)if(e.vertexType[e.index[t]]===1)return t}return e.index.length}destroyGeometryBuffer(e){for(let t of this.pipeline.buffers.meshMatrix.values())t.bindGroup?.geometry===e.uniform&&(t.bindGroup=void 0);let t=e=>{e?.vertex.destroy(),e?.normal.destroy(),e?.uv.destroy(),e?.index.destroy(),e?.miterScale?.destroy(),e?.position?.destroy(),e?.vertexType?.destroy()};t(e.geometry),t(e.linePoints),e.uniform.destroy()}},Gn=class{pipeline;constructor(e){this.pipeline=e}destroyMesh(e){let t;t=typeof e==`number`?e:e.id;let n=this.pipeline.buffers.meshMatrix.get(t),r=!1;n!==void 0&&(n.buffer.destroy(),this.pipeline.buffers.meshMatrix.delete(t),r=!0);let i=this.pipeline.buffers.meshDepth.get(t);i!==void 0&&(i.buffer.destroy(),this.pipeline.buffers.meshDepth.delete(t),r=!0);let a=this.pipeline.buffers.meshStyle.get(t);if(a!==void 0&&(a.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(t),r=!0),typeof e!=`number`){for(let t of e.textures)t!==void 0&&(r=this.destroyTexture(t)||r);e.data!==void 0&&(r=this.destroyGeometry(e.data)||r),e.material!==void 0&&(r=this.destroyMaterial(e.material)||r)}return r}destroyTexture(e){let t;t=typeof e==`number`?e:e.id;let n=!1;for(let[e,r]of this.pipeline.textures)if(e===t||r.sourceIds?.has(t))this.releaseTextureBindings(r.view),r.texture.destroy(),this.pipeline.textures.delete(e),n=!0;else continue;return n}destroyMaterial(e){let t;t=typeof e==`number`?e:e.id;let n=!1;for(let[e,r]of this.pipeline.buffers.meshStyle)if(r.materialId===t)r.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(e),n=!0;else continue;let r=this.pipeline.customValues.get(t);if(r!==void 0){for(let e of r.buffers.values())e.buffer.destroy();this.pipeline.customValues.delete(t),n=!0}if(typeof e!=`number`){let t=new Set;e.style.solid.texture!==void 0&&(t.add(e.style.solid.texture.id),n=this.destroyTexture(e.style.solid.texture)||n),e.style.edge.texture!==void 0&&!t.has(e.style.edge.texture.id)&&(t.add(e.style.edge.texture.id),n=this.destroyTexture(e.style.edge.texture)||n),e.style.points.texture!==void 0&&!t.has(e.style.points.texture.id)&&(t.add(e.style.points.texture.id),n=this.destroyTexture(e.style.points.texture)||n);for(let r of e.values?.textures??[])t.has(r.id)||(t.add(r.id),n=this.destroyTexture(r)||n)}return n}destroyGeometry(e){let t;t=typeof e==`number`?e:e.id;let n=this.pipeline.buffers.geometry.get(t);return n!==void 0&&(this.destroyGeometryBuffer(n),this.pipeline.buffers.geometry.delete(t),!0)}trim(e){e.ensureLists();let t={version:e.version,meshIds:new Set,geometryIds:new Set,materialIds:new Set,textureIds:new Set,pipelineKeys:new Set};for(let n of e.drawList)t.meshIds.add(n.id);for(let n of e.geometryList)t.geometryIds.add(n.id);for(let n of e.materialList)t.materialIds.add(n.id);for(let n of e.drawList)n.data!==void 0&&n.material!==void 0&&t.pipelineKeys.add(n.material.getPipelineKey(n.data.type));for(let n of e.textureList)t.textureIds.add(n.id);this.pipeline.sceneResources.set(e.id,t);let n={version:0,meshIds:new Set,geometryIds:new Set,materialIds:new Set,textureIds:new Set,pipelineKeys:new Set};for(let e of this.pipeline.sceneResources.values()){for(let t of e.meshIds)n.meshIds.add(t);for(let t of e.geometryIds)n.geometryIds.add(t);for(let t of e.materialIds)n.materialIds.add(t);for(let t of e.textureIds)n.textureIds.add(t);for(let t of e.pipelineKeys)n.pipelineKeys.add(t)}for(let e of this.pipeline.buffers.meshMatrix.values())n.meshIds.has(e.meshId)||this.destroyMesh(e.meshId);for(let e of this.pipeline.buffers.meshDepth.keys())n.meshIds.has(e)||this.destroyMesh(e);for(let e of this.pipeline.buffers.geometry.keys())n.geometryIds.has(e)||this.destroyGeometry(e);for(let e of this.pipeline.buffers.meshStyle.keys())n.meshIds.has(e)||this.destroyMesh(e);for(let e of this.pipeline.customValues.keys())n.materialIds.has(e)||this.destroyMaterial(e);for(let[e,t]of this.pipeline.textures)n.textureIds.has(e)||(this.releaseTextureBindings(t.view),t.texture.destroy(),this.pipeline.textures.delete(e));for(let e of this.pipeline.pipelineTemplates.keys())n.pipelineKeys.has(e)||this.pipeline.pipelineTemplates.delete(e)}destroyAll(){let e=this.pipeline.device;this.pipeline.context?.unconfigure();for(let e of this.pipeline.buffers.meshMatrix.values())e.buffer.destroy();this.pipeline.buffers.meshMatrix.clear();for(let e of this.pipeline.buffers.meshDepth.values())e.buffer.destroy();this.pipeline.depthTexture?.texture.destroy(),this.pipeline.depthTexture=void 0,this.pipeline.buffers.meshDepth.clear();for(let e of this.pipeline.buffers.geometry.values())this.destroyGeometryBuffer(e);for(let e of this.pipeline.buffers.meshStyle.values())e.buffer.destroy();for(let e of this.pipeline.customValues.values())for(let t of e.buffers.values())t.buffer.destroy();for(let e of this.pipeline.buffers.cameraUniform)e.destroy();for(let e of this.pipeline.textures.values())e.texture.destroy();this.pipeline.fallbackTexture?.texture.destroy(),this.pipeline.buffers.geometry.clear(),this.pipeline.buffers.meshStyle.clear(),this.pipeline.customValues.clear(),this.pipeline.buffers.cameraUniform.length=0,this.pipeline.textures.clear(),this.pipeline.samplers.clear(),this.pipeline.pipelineTemplates.clear(),this.pipeline.sceneResources.clear(),this.pipeline.adapter=void 0,this.pipeline.device=void 0,this.pipeline.context=void 0,this.pipeline.format=void 0,this.pipeline.defaultBindGroupLayout=void 0,this.pipeline.baseMaterialBindGroupLayout=void 0,this.pipeline.fallbackTexture=void 0,e?.destroy()}destroyGeometryBuffer(e){for(let t of this.pipeline.buffers.meshMatrix.values())t.bindGroup?.geometry===e.uniform&&(t.bindGroup=void 0);let t=e=>{e?.vertex.destroy(),e?.normal.destroy(),e?.uv.destroy(),e?.index.destroy(),e?.miterScale?.destroy(),e?.position?.destroy(),e?.vertexType?.destroy()};t(e.geometry),t(e.linePoints),e.uniform.destroy()}releaseTextureBindings(e){for(let t of this.pipeline.buffers.meshStyle.values()){let n=t.bindGroup;(n?.baseView===e||n?.edgeView===e||n?.pointsView===e)&&(t.bindGroup=void 0)}for(let t of this.pipeline.customValues.values())t.resources?.includes(e)&&(t.bindGroup=void 0)}},Kn=class{pipeline;constructor(e){this.pipeline=e}get(e,t){let n=this.pipeline.device;if(n!==void 0){let r=e+`_`+t,i=this.pipeline.samplers.get(r);if(i===void 0){let i=n.createSampler({label:`Texture Sampler `+r,addressModeU:e,addressModeV:t,magFilter:`linear`,minFilter:`linear`});return this.pipeline.samplers.set(r,i),i}return i}}},qn=class{pipeline;samplerManager;depthManager;constructor(e,t){this.pipeline=e,this.depthManager=new zn(e),this.samplerManager=t}prepare(e,t){this.depthManager.ensureTexture(e,t)}draw(e,t,n){let r=this.pipeline.device,i=this.pipeline.context;if(r!==void 0&&i!==void 0){let a=r.createCommandEncoder(),o=i.getCurrentTexture(),s=this.depthManager.ensureTexture(o.width,o.height);if(s!==void 0){let i=o.createView(),c;c=n===`premultiplied`?{r:t.r*t.a,g:t.g*t.a,b:t.b*t.a,a:t.a}:t;let l=a.beginRenderPass({colorAttachments:[{view:i,clearValue:c,loadOp:`clear`,storeOp:`store`}],depthStencilAttachment:{view:s.view,depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`discard`}}),u=this.pipeline.buffers.cameraUniform[0],d=this.pipeline.buffers.cameraUniform[1],f=this.pipeline.buffers.cameraUniform[2],p=e.getRenderDrawList();for(let e=p.length-1;e>=0;e--){let t=p[e],n=t.material;n?.depthTest&&n.depthWrite&&!n.transparent&&this.drawMesh(r,l,t,u,d,f)}for(let e of p){let t=e.material;t?.depthTest&&(!t.depthWrite||t.transparent)&&this.drawMesh(r,l,e,u,d,f)}for(let e of p)e.material!==void 0&&!e.material.depthTest&&this.drawMesh(r,l,e,u,d,f);l.end(),r.queue.submit([a.finish()])}else return}else return}drawMesh(e,t,n,r,i,a){let o=n.data,s=this.pipeline.buffers.meshDepth.get(n.id),c=n.material,l=this.pipeline.buffers.meshMatrix.get(n.id),u;if(u=o===void 0?void 0:this.pipeline.buffers.geometry.get(o.id),s!==void 0&&n.count!==0&&l!==void 0&&u!==void 0&&o!==void 0&&(o.style.solid.enabled||o.style.edge.enabled||o.style.wireframe.enabled||o.style.points.enabled)&&c!==void 0){let d=this.pipeline.pipelineTemplates.get(c.getPipelineKey(o.type)),f=u.geometry;if(d!==void 0){let p=this.createMaterialBindGroup(e,n,c,d);if(p!==void 0){let m=d.defaultBindGroupLayout,h=l.bindGroup;if((h?.layout!==m||h.view!==r||h.projection!==i||h.parameters!==a||h.geometry!==u.uniform||h.depth!==s.buffer)&&(h={layout:m,view:r,projection:i,parameters:a,geometry:u.uniform,depth:s.buffer,group:e.createBindGroup({layout:m,entries:[{binding:0,resource:{buffer:l.buffer}},{binding:1,resource:{buffer:r}},{binding:2,resource:{buffer:i}},{binding:3,resource:{buffer:a}},{binding:4,resource:{buffer:u.uniform}},{binding:5,resource:{buffer:s.buffer}}]})},l.bindGroup=h),t.setBindGroup(0,h.group),t.setBindGroup(1,p),d.customBindGroupLayout!==void 0){let n=this.createCustomBindGroup(e,c,d);if(n===void 0)return;t.setBindGroup(2,n)}let g=n instanceof bn,_=o.style.wireframe.enabled&&(g||c.style.wireframe.enabled)&&d.lineRenderPipeline!==void 0&&u.linePoints!==void 0&&o.linePoints!==void 0,v=o.style.solid.enabled&&(g||c.style.solid.enabled)||o.style.edge.enabled&&(g||c.style.edge.enabled)||o.style.points.enabled&&(g||c.style.points.enabled),y=(e,n,r,i)=>{if(v&&n!==0&&f?.vertexType!==void 0&&f.position!==void 0&&f.miterScale!==void 0&&d.renderPipeline!==void 0)t.setPipeline(d.renderPipeline),t.setVertexBuffer(0,f.vertex),t.setVertexBuffer(1,f.uv),t.setVertexBuffer(2,f.normal),t.setVertexBuffer(3,f.miterScale),t.setVertexBuffer(4,f.position),t.setVertexBuffer(5,f.vertexType),t.setIndexBuffer(f.index,f.indexFormat),t.drawIndexed(n,i,e,0,r);else return},b;b=_?1:n.count;for(let e=0;e<n.count;e+=b){let n=o.index?.length??0,r=_&&(g||c.style.points.enabled)&&f!==void 0&&f.pointsFirstIndex<n,i;i=r?f?.pointsFirstIndex??0:n,y(0,i,e,b),_&&d.lineRenderPipeline!==void 0&&u.linePoints!==void 0&&o.linePoints!==void 0&&(t.setPipeline(d.lineRenderPipeline),t.setVertexBuffer(0,u.linePoints.vertex),t.setVertexBuffer(1,u.linePoints.normal),t.setIndexBuffer(u.linePoints.index,u.linePoints.indexFormat),t.drawIndexed(o.linePoints.index.length,b,0,0,e)),r&&y(i,n-i,e,b)}}else return}else return}else return}createCustomBindGroup(e,t,n){let r=n.customBindGroupLayout,i=t.values,a=this.pipeline.customValues.get(t.id);if(r===void 0||i===void 0||a===void 0)return;let o=[],s=[r];for(let e of i.entries)if(e.kind===`texture`&&e.value instanceof Y){let t=this.pipeline.textures.get(e.value.id)?.view??this.pipeline.fallbackTexture?.view,n=this.samplerManager.get(`clamp-to-edge`,`clamp-to-edge`);if(t===void 0||n===void 0)return;o.push({binding:e.binding,resource:t}),o.push({binding:e.binding+1,resource:n}),s.push(t,n)}else{let t=a.buffers.get(e.name)?.buffer;if(t===void 0)return;o.push({binding:e.binding,resource:{buffer:t}}),s.push(t)}let c=a.bindGroup===void 0||a.layout!==r;if(!c&&a.resources!==void 0){if(a.resources.length!==s.length)c=!0;else for(let e=0;e<s.length;e+=1)if(a.resources[e]!==s[e]){c=!0;break}}return c&&(a.bindGroup=e.createBindGroup({layout:r,entries:o}),a.layout=r,a.resources=s),a.bindGroup}createMaterialBindGroup(e,t,n,r){let i=this.pipeline.fallbackTexture,a=this.samplerManager.get(n.style.solid.addressModeU,n.style.solid.addressModeV),o=this.samplerManager.get(n.style.edge.addressModeU,n.style.edge.addressModeV),s=this.samplerManager.get(n.style.points.addressModeU,n.style.points.addressModeV),c=this.pipeline.buffers.meshStyle.get(t.id);if(i!==void 0&&a!==void 0&&o!==void 0&&s!==void 0&&c!==void 0){let n=e=>e===void 0?i.view:this.pipeline.textures.get(e.id)?.view??i.view,l=t.textures,u=n(l[0]),d=n(l[1]),f=n(l[2]),p=r.materialBindGroupLayout,m=c.bindGroup;return(m?.layout!==p||m.baseView!==u||m.edgeView!==d||m.pointsView!==f||m.baseSampler!==a||m.edgeSampler!==o||m.pointsSampler!==s)&&(m={layout:p,baseView:u,edgeView:d,pointsView:f,baseSampler:a,edgeSampler:o,pointsSampler:s,group:e.createBindGroup({layout:p,entries:[{binding:0,resource:{buffer:c.buffer}},{binding:1,resource:u},{binding:2,resource:a},{binding:3,resource:d},{binding:4,resource:o},{binding:5,resource:f},{binding:6,resource:s}]})},c.bindGroup=m),m.group}}},Jn=class{pipeline;constructor(e){this.pipeline=e}draw(e){let t=this.pipeline.device;if(t!==void 0)for(let n of e.textureList){let e=this.pipeline.textures.get(n.id);if(e?.version!==n.version){let r;if(r=n instanceof J?n.layers:[n],r.length!==0&&(n instanceof J||Yn(n))){let i=this.createTexture(t,n.id,n.version,r);this.releaseTexture(e),this.pipeline.textures.set(n.id,i)}else{this.releaseTexture(e),this.pipeline.textures.delete(n.id);continue}}else this.uploadVideoFrames(t,e,n)}}createFallbackTexture(e){return this.createTexture(e,-1,0,[void 0])}releaseTexture(e){if(e!==void 0){for(let t of this.pipeline.buffers.meshStyle.values()){let n=t.bindGroup;(n?.baseView===e.view||n?.edgeView===e.view||n?.pointsView===e.view)&&(t.bindGroup=void 0)}for(let t of this.pipeline.customValues.values())t.resources?.includes(e.view)&&(t.bindGroup=void 0);e.texture.destroy()}else return}uploadVideoFrames(e,t,n){let r;r=n instanceof J?n.layers:[n];for(let n=0;n<r.length;n++){let i=r[n];if(Yn(i)){let r=i.source;if(r!==null&&`videoWidth`in r){let a=t.texture.width,o=t.texture.height,s=r;if(i.width!==a||i.height!==o){let e=t.videoCanvas??new OffscreenCanvas(a,o);t.videoCanvas=e;let n=e.getContext(`2d`);if(n===null)throw Error(`Cannot create video texture normalization canvas.`);n.clearRect(0,0,a,o),n.drawImage(r,0,0,a,o),s=e}e.queue.copyExternalImageToTexture({source:s,flipY:!0},{texture:t.texture,origin:{x:0,y:0,z:n}},{width:a,height:o,depthOrArrayLayers:1})}}}}createTexture(e,t,n,r){let i=1,a=1,o=new Set;for(let e of r)e!==void 0&&o.add(e.id),Yn(e)&&(i=Math.max(i,e.width),a=Math.max(a,e.height));if(r.length>e.limits.maxTextureArrayLayers)throw RangeError(`Texture layers exceed maxTextureArrayLayers.`);if(i>e.limits.maxTextureDimension2D||a>e.limits.maxTextureDimension2D)throw RangeError(`Texture dimensions exceed maxTextureDimension2D.`);let s=`Texture `+String(t);t===-1&&(s=`Fallback White Texture`);let c=e.createTexture({label:s,size:{width:i,height:a,depthOrArrayLayers:r.length},format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});try{let s;for(let t=0;t<r.length;t++){let n=r[t],o;o=Yn(n)?n.source:null;let l={texture:c,origin:{x:0,y:0,z:t}},u={width:i,height:a,depthOrArrayLayers:1};if(o!==null||i!==1||a!==1){let t=typeof ImageData<`u`&&o instanceof ImageData;if(o===null||t||n?.width!==i||n.height!==a){s??=new OffscreenCanvas(i,a);let n=s.getContext(`2d`);if(n===null)throw Error(`Cannot create texture normalization canvas.`);if(n.clearRect(0,0,i,a),o===null)n.fillStyle=`#ffffff`,n.fillRect(0,0,i,a);else if(t){let e=o,t=new OffscreenCanvas(e.width,e.height),r=t.getContext(`2d`);if(r===null)throw Error(`Cannot upload ImageData.`);r.putImageData(e,0,0),n.drawImage(t,0,0,i,a)}else n.drawImage(o,0,0,i,a);e.queue.copyExternalImageToTexture({source:s,flipY:!0},l,u)}else{e.queue.copyExternalImageToTexture({source:o,flipY:!0},l,u);continue}}else{e.queue.writeTexture(l,new Uint8Array([255,255,255,255]),{bytesPerRow:4,rowsPerImage:1},u);continue}}return{textureId:t,version:n,sourceIds:o,texture:c,view:c.createView({dimension:`2d-array`})}}catch(e){throw c.destroy(),e}}},Yn=e=>{if(e!==void 0&&e.loaded&&e.source!==null&&Number.isInteger(e.width)&&Number.isInteger(e.height)&&e.width>0&&e.height>0){let t=e.source;return`videoWidth`in t?t.readyState>=2:!0}return!1},Xn=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、Mesh.ignoreZoom、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

@fragment
fn main(@location(0) @interpolate(flat) instanceIndex: u32) -> @location(0) vec4f {
    let materialUniform = materialStyles[instanceIndex];
    if (materialUniform.enabled.y == 0.0) { discard; }
    let color = materialUniform.wireframeColor;
    let alpha = color.a * materialUniform.wireframe.x;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
`,Zn=`
// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    @location(0) position: vec2f,
    @builtin(instance_index) instanceIndex: u32,
    // 当前 basic line 暂不使用法线，保留给后续线条效果。
    @location(2) normal: vec2f,
};

// linePoints 与标准三角面共用 Mesh 和 Camera 矩阵缓冲。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x4<f32>>;
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) @interpolate(flat) instanceIndex: u32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let packedModel = modelMatrices[resolvedIndex];
    let modelMatrix = mat3x3f(packedModel[0].xyz, packedModel[1].xyz, packedModel[2].xyz);
    let localAnchor = vec2f(packedModel[0].w, packedModel[1].w);
    let worldPosition = modelMatrix * vec3f(input.position - localAnchor, 1.0);
    let viewPosition = viewMatrix * worldPosition;
    let clipPosition = orthogonalMatrix * viewPosition;

    var output: VertexOutput;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.instanceIndex = resolvedIndex;
    return output;
}
`,Qn=class{pipeline;textureManager;samplerManager;constructor(e,t,n){this.pipeline=e,this.textureManager=t,this.samplerManager=n}initResources(e){this.pipeline.defaultBindGroupLayout=e.createBindGroupLayout({label:`Default Matrix Bind Group Layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}},{binding:3,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:4,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}}]}),this.pipeline.baseMaterialBindGroupLayout=e.createBindGroupLayout({label:`BaseMaterial Bind Group Layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:5,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:6,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}}]}),this.pipeline.fallbackTexture=this.textureManager.createFallbackTexture(e)}draw(e){for(let t of e.materialList){this.samplerManager.get(t.style.solid.addressModeU,t.style.solid.addressModeV),this.samplerManager.get(t.style.edge.addressModeU,t.style.edge.addressModeV),this.samplerManager.get(t.style.points.addressModeU,t.style.points.addressModeV);for(let n of e.getMaterialGeometryTypes(t.id)){let e=t.getPipelineKey(n);if(!this.pipeline.pipelineTemplates.has(e)){let r=this.createPipelineTemplate(t,n);r!==void 0&&this.pipeline.pipelineTemplates.set(e,r)}}}}createPipelineTemplate(e,t){let n=this.pipeline.device,r=this.pipeline.format,i=this.pipeline.defaultBindGroupLayout,a=this.pipeline.baseMaterialBindGroupLayout;if(n!==void 0&&r!==void 0&&i!==void 0&&a!==void 0){let o=[];for(let t of e.values?.entries??[])if(t.kind===`texture`)o.push({binding:t.binding,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}}),o.push({binding:t.binding+1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}});else{let e=t.kind===`array<f32>`,n=`uniform`;e&&(n=`read-only-storage`),o.push({binding:t.binding,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:n}})}let s,c=[i,a];o.length>0&&(s=n.createBindGroupLayout({entries:o}),c.push(s));let l=n.createPipelineLayout({bindGroupLayouts:c}),u;u=e.transparent?{color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}}:void 0;let d=(t,i,a,o,s)=>{if(i!==void 0&&a!==void 0){let c=`always`;e.depthTest&&(c=`less-equal`);let d=e.cullMode;return o===`line-list`&&(d=`none`),n.createRenderPipeline({label:t,layout:l,vertex:{module:n.createShaderModule({code:i}),entryPoint:`main`,buffers:s},fragment:{module:n.createShaderModule({code:a}),entryPoint:`main`,targets:[{format:r,blend:u}]},depthStencil:{format:`depth32float`,depthWriteEnabled:e.depthWrite,depthCompare:c},primitive:{topology:o,frontFace:`cw`,cullMode:d}})}},f=[0,1,2].map(e=>({arrayStride:8,attributes:[{shaderLocation:e,offset:0,format:`float32x2`}]})),p=e.getShaderSource(t),m=d(`BaseMaterial `+t+` Pipeline`,p.vertex,p.fragment,`triangle-list`,[...f,{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:`float32`}]},{arrayStride:8,attributes:[{shaderLocation:4,offset:0,format:`float32x2`}]},{arrayStride:4,attributes:[{shaderLocation:5,offset:0,format:`float32`}]}]),h=d(`Line Pipeline`,Zn,Xn,`line-list`,[f[0],f[2]]);return{key:e.getPipelineKey(t),renderPipeline:m,lineRenderPipeline:h,defaultBindGroupLayout:i,materialBindGroupLayout:a,customBindGroupLayout:s}}}},$n=e=>{e.ensureWorldMatrix();for(let t of e.drawList)t.ensureWorldMatrix()},er=e=>{e.ensureLists()},tr=e=>{e.ensureCameraMatrix()},nr=class{_states=new Map;update(e,t,n){let r=e.box,i=this._states.get(e);if(r===null)this.cancel(i),this._states.delete(e),e.updateSpatialLists();else{r.ensureCameraMatrix();let a=[r.version,r.zoomVersion,r.viewMatrix.version,r.orthogonalMatrix.version].join(`/`);if(i?.camera!==r)this.cancel(i),this._states.set(e,{camera:r,stamp:a,delay:t,timer:null}),e.updateSpatialLists(!0);else{let o=i.stamp!==a,s=i.delay!==t;i.stamp=a,i.delay=t,t===0?(this.cancel(i),e.updateSpatialLists()):o||s&&i.timer!==null?(this.cancel(i),i.timer=window.setTimeout(()=>{i.timer=null,e.box===r&&(e.updateSpatialLists(!0),n(e))},t),e.boxDrawList=e.ensureLists()):i.timer===null?e.updateSpatialLists():e.boxDrawList=e.ensureLists()}}}cancel(e){e!==void 0&&e.timer!==null&&(window.clearTimeout(e.timer),e.timer=null)}destroy(){for(let e of this._states.values())this.cancel(e);this._states.clear()}},rr=class{_states=new Map;update(e,t,n,r){let i=this._states.get(e);i===void 0&&(i={stamp:``,entries:new Map,timer:null},this._states.set(e,i));let a=ar(t),o=ir(e);(i.stamp!==a||!or(i.entries,o)||n===0&&i.timer!==null)&&(i.timer!==null&&(window.clearTimeout(i.timer),i.timer=null),i.stamp=a,i.entries=o,o.size>0&&(n===0?this.apply(e,t,i):i.timer=window.setTimeout(()=>{i.timer=null,this.apply(e,t,i),r(e,t)},n)))}apply(e,t,n){let r=ir(e);for(let[e]of r){let n=e.preparePrecisionGeometry();if(n!==void 0){let r=1;!e.ignoreZoom&&t.zoom>0&&Number.isFinite(t.zoom)&&(r=t.zoom);let i=Math.min(e.precisionMax,Math.max(3,Math.ceil(n.originPrecision*r)));n.setRenderPrecision(i)}}n.entries=ir(e),n.stamp=ar(t)}destroy(){for(let e of this._states.values())e.timer!==null&&window.clearTimeout(e.timer);this._states.clear()}},ir=e=>{let t=new Map;for(let n of e.ensureLists()){let e=n.data;n.autoPrecision&&e!==void 0&&[`Rect2D`,`Poly2D`,`Text`].includes(e.type)&&t.set(n,{geometry:e,origin:e.originPrecision,ignoreZoom:n.ignoreZoom,maximum:n.precisionMax})}return t},ar=e=>(e.ensureCameraMatrix(),[e.id,e.version,e.zoomVersion,e.viewMatrix.version,e.orthogonalMatrix.version].join(`/`)),or=(e,t)=>{let n=e.size===t.size;if(n)for(let[r,i]of t){let t=e.get(r);(t?.geometry!==i.geometry||t.origin!==i.origin||t.ignoreZoom!==i.ignoreZoom||t.maximum!==i.maximum)&&(n=!1)}return n},sr=class{id=h();type=`Render`;container;canvas=document.createElement(`canvas`);backgroundColor={r:0,g:0,b:0,a:0};pipeline={pipelineTemplates:new Map,textures:new Map,samplers:new Map,sceneResources:new Map,customValues:new Map,buffers:{meshMatrix:new Map,meshDepth:new Map,geometry:new Map,meshStyle:new Map,cameraUniform:[]}};ready;_alphaMode=`premultiplied`;_resizeTimer=null;_destroyed=!1;_dpr=v().dpr;_renderMode;_precisionDebounce=100;_boxDebounce=100;boxManager=new nr;precisionManager=new rr;_renderScene=null;_renderCamera=null;bufferManager=new Wn(this.pipeline);destroyManager=new Gn(this.pipeline);textureManager=new Jn(this.pipeline);samplerManager=new Kn(this.pipeline);drawCallManager=new qn(this.pipeline,this.samplerManager);pipelineManager=new Qn(this.pipeline,this.textureManager,this.samplerManager);constructor(e,t=`development`){if(typeof e==`string`){let t=document.getElementById(e);if(t===null)throw Error(`Render container "${e}" was not found.`);this.container=t}else this.container=e;this.canvas.style.display=`block`,this.canvas.style.width=`100%`,this.canvas.style.height=`100%`;let n=this._dpr;this.canvas.width=Math.max(1,Math.round(this.container.clientWidth*n)),this.canvas.height=Math.max(1,Math.round(this.container.clientHeight*n)),this.container.appendChild(this.canvas),this._renderMode=t,this.ready=this.initWebGPU()}get boxDebounce(){return this._boxDebounce}set boxDebounce(e){if(Number.isFinite(e)&&e>=0)this._boxDebounce=e;else throw RangeError(`boxDebounce must be finite and nonnegative.`)}get precisionDebounce(){return this._precisionDebounce}set precisionDebounce(e){if(Number.isFinite(e)&&e>=0)this._precisionDebounce=e;else throw RangeError(`precisionDebounce must be finite and nonnegative.`)}async initWebGPU(){let e=navigator.gpu;if(e===void 0)throw Error(`WebGPU is not supported by this browser.`);let t=await e.requestAdapter();if(t===null)throw Error(`No compatible WebGPU adapter was found.`);if(!this.isDestroyed()){let n=await t.requestDevice();if(this.isDestroyed()){n.destroy();return}{let r=this.canvas.getContext(`webgpu`);if(r===null)throw Error(`WebGPU canvas context could not be created.`);let i=e.getPreferredCanvasFormat();r.configure({device:n,format:i,alphaMode:this._alphaMode}),this.pipeline.adapter=t,this.pipeline.device=n,this.pipeline.context=r,this.pipeline.format=i,this.pipelineManager.initResources(n)}}}set alphaMode(e){if(this._alphaMode!==e){this._alphaMode=e;let t=this.pipeline.device,n=this.pipeline.context,r=this.pipeline.format;t!==void 0&&n!==void 0&&r!==void 0&&n.configure({device:t,format:r,alphaMode:e})}else return}get alphaMode(){return this._alphaMode}get dpr(){return this._dpr}set renderMode(e){this._renderMode=e}get renderMode(){return this._renderMode}warmup(e,t){this.prepare(e,t,!1)}prepare(e,t,n){if(!this._destroyed&&this.pipeline.device!==void 0)this.initScene(e),this.matrixUpdate(e),this.initCamera(t),this.precisionManager.update(e,t,this._precisionDebounce,(e,t)=>{n&&this._renderScene===e&&this._renderCamera===t?this.render(e,t):this.warmup(e,t)}),this.initScene(e),this.boxManager.update(e,this._boxDebounce,e=>{n&&this._renderScene===e&&this._renderCamera===t&&this.render(e,t)}),this.pipeline.sceneResources.get(e.id)?.version!==e.version&&this.trim(e),this.drawBuffers(e,t),this.drawTextures(e),this.drawPipelines(e),this.drawCallManager.prepare(this.canvas.width,this.canvas.height);else return}render(e,t){if(!this._destroyed&&this.pipeline.device!==void 0)this._renderScene=e,this._renderCamera=t,this.prepare(e,t,!0),this.drawCall(e);else return}drawBuffers(e,t){this.bufferManager.draw(e,t,this._dpr,this._renderMode)}drawTextures(e){this.textureManager.draw(e)}drawPipelines(e){this.pipelineManager.draw(e)}drawCall(e){this.drawCallManager.draw(e,this.backgroundColor,this._alphaMode)}destroyMesh(e){return this.destroyManager.destroyMesh(e)}destroyTexture(e){return this.destroyManager.destroyTexture(e)}destroyMaterial(e){return this.destroyManager.destroyMaterial(e)}destroyGeometry(e){return this.destroyManager.destroyGeometry(e)}trim(e){this.destroyManager.trim(e)}matrixUpdate(e){$n(e)}initScene(e){er(e)}initCamera(e){tr(e)}destroy(){if(!this._destroyed)this._destroyed=!0,this.precisionManager.destroy(),this.boxManager.destroy(),this._resizeTimer!==null&&(window.clearTimeout(this._resizeTimer),this._resizeTimer=null),this.destroyManager.destroyAll(),this.canvas.remove();else return}resize(){if(!this._destroyed){this._resizeTimer!==null&&window.clearTimeout(this._resizeTimer);let e=()=>{let e=v().dpr,t=this.pipeline.device?.limits.maxTextureDimension2D??8192,n=Math.min(t,Math.max(1,Math.round(this.canvas.clientWidth*e))),r=Math.min(t,Math.max(1,Math.round(this.canvas.clientHeight*e)));this.canvas.width!==n&&(this.canvas.width=n),this.canvas.height!==r&&(this.canvas.height=r),this._dpr=e,this._resizeTimer=null};this._resizeTimer=window.setTimeout(e,100)}}isDestroyed(){return this._destroyed}},$=class e{constructor(t,n,r,i,a=`div`){this.parent=t,this.object=n,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(a),this.domElement.classList.add(`lil-controller`),this.domElement.classList.add(i),this.$name=document.createElement(`div`),this.$name.classList.add(`lil-name`),e.nextNameID=e.nextNameID||0,this.$name.id=`lil-gui-name-${++e.nextNameID}`,this.$widget=document.createElement(`div`),this.$widget.classList.add(`lil-widget`),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener(`keydown`,e=>e.stopPropagation()),this.domElement.addEventListener(`keyup`,e=>e.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle(`lil-disabled`,e),this.$disable.toggleAttribute(`disabled`,e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}options(e){let t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);let e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}},cr=class extends ${constructor(e,t,n){super(e,t,n,`lil-boolean`,`label`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`checkbox`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener(`change`,()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}};function lr(e){let t,n;return(t=e.match(/(#|0x)?([a-f0-9]{6})/i))?n=t[2]:(t=e.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?n=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=e.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(n=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),n?`#`+n:!1}var ur={isPrimitive:!0,match:e=>typeof e==`string`,fromHexString:lr,toHexString:lr},dr={isPrimitive:!0,match:e=>typeof e==`number`,fromHexString:e=>parseInt(e.substring(1),16),toHexString:e=>`#`+e.toString(16).padStart(6,0)},fr=[ur,dr,{isPrimitive:!1,match:e=>Array.isArray(e)||ArrayBuffer.isView(e),fromHexString(e,t,n=1){let r=dr.fromHexString(e);t[0]=(r>>16&255)/255*n,t[1]=(r>>8&255)/255*n,t[2]=(r&255)/255*n},toHexString([e,t,n],r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return dr.toHexString(i)}},{isPrimitive:!1,match:e=>Object(e)===e,fromHexString(e,t,n=1){let r=dr.fromHexString(e);t.r=(r>>16&255)/255*n,t.g=(r>>8&255)/255*n,t.b=(r&255)/255*n},toHexString({r:e,g:t,b:n},r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return dr.toHexString(i)}}];function pr(e){return fr.find(t=>t.match(e))}var mr=class extends ${constructor(e,t,n,r){super(e,t,n,`lil-color`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`color`),this.$input.setAttribute(`tabindex`,-1),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$text=document.createElement(`input`),this.$text.setAttribute(`type`,`text`),this.$text.setAttribute(`spellcheck`,`false`),this.$text.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=pr(this.initialValue),this._rgbScale=r,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener(`input`,()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$text.addEventListener(`input`,()=>{let e=lr(this.$text.value);e&&this._setValueFromHexString(e)}),this.$text.addEventListener(`focus`,()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener(`blur`,()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){let t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}},hr=class extends ${constructor(e,t,n){super(e,t,n,`lil-function`),this.$button=document.createElement(`button`),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener(`click`,e=>{e.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$disable=this.$button}},gr=class extends ${constructor(e,t,n,r,i,a){super(e,t,n,`lil-number`),this._initInput(),this.min(r),this.max(i);let o=a!==void 0;this.step(o?a:this._getImplicitStep(),o),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){let e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+`%`}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),window.matchMedia(`(pointer: coarse)`).matches&&(this.$input.setAttribute(`type`,`number`),this.$input.setAttribute(`step`,`any`)),this.$widget.appendChild(this.$input),this.$disable=this.$input;let e=()=>{let e=parseFloat(this.$input.value);isNaN(e)||(this._stepExplicit&&(e=this._snap(e)),this.setValue(this._clamp(e)))},t=e=>{let t=parseFloat(this.$input.value);isNaN(t)||(this._snapClampSetValue(t+e),this.$input.value=this.getValue())},n=e=>{e.key===`Enter`&&this.$input.blur(),e.code===`ArrowUp`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e))),e.code===`ArrowDown`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e)*-1))},r=e=>{this._inputFocused&&(e.preventDefault(),t(this._step*this._normalizeMouseWheel(e)))},i=!1,a,o,s,c,l,u=e=>{a=e.clientX,o=s=e.clientY,i=!0,c=this.getValue(),l=0,window.addEventListener(`mousemove`,d),window.addEventListener(`mouseup`,f)},d=e=>{if(i){let t=e.clientX-a,n=e.clientY-o;Math.abs(n)>5?(e.preventDefault(),this.$input.blur(),i=!1,this._setDraggingStyle(!0,`vertical`)):Math.abs(t)>5&&f()}if(!i){let t=e.clientY-s;l-=t*this._step*this._arrowKeyMultiplier(e),c+l>this._max?l=this._max-c:c+l<this._min&&(l=this._min-c),this._snapClampSetValue(c+l)}s=e.clientY},f=()=>{this._setDraggingStyle(!1,`vertical`),this._callOnFinishChange(),window.removeEventListener(`mousemove`,d),window.removeEventListener(`mouseup`,f)};this.$input.addEventListener(`input`,e),this.$input.addEventListener(`keydown`,n),this.$input.addEventListener(`wheel`,r,{passive:!1}),this.$input.addEventListener(`mousedown`,u),this.$input.addEventListener(`focus`,()=>{this._inputFocused=!0}),this.$input.addEventListener(`blur`,()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement(`div`),this.$slider.classList.add(`lil-slider`),this.$fill=document.createElement(`div`),this.$fill.classList.add(`lil-fill`),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add(`lil-has-slider`);let e=(e,t,n,r,i)=>(e-t)/(n-t)*(i-r)+r,t=t=>{let n=this.$slider.getBoundingClientRect(),r=e(t,n.left,n.right,this._min,this._max);this._snapClampSetValue(r)},n=e=>{this._setDraggingStyle(!0),t(e.clientX),window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)},r=e=>{t(e.clientX)},i=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)},a=!1,o,s,c=e=>{e.preventDefault(),this._setDraggingStyle(!0),t(e.touches[0].clientX),a=!1},l=e=>{e.touches.length>1||(this._hasScrollBar?(o=e.touches[0].clientX,s=e.touches[0].clientY,a=!0):c(e),window.addEventListener(`touchmove`,u,{passive:!1}),window.addEventListener(`touchend`,d))},u=e=>{if(a){let t=e.touches[0].clientX-o,n=e.touches[0].clientY-s;Math.abs(t)>Math.abs(n)?c(e):(window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d))}else e.preventDefault(),t(e.touches[0].clientX)},d=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d)},f=this._callOnFinishChange.bind(this),p;this.$slider.addEventListener(`mousedown`,n),this.$slider.addEventListener(`touchstart`,l,{passive:!1}),this.$slider.addEventListener(`wheel`,e=>{if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&this._hasScrollBar)return;e.preventDefault();let t=this._normalizeMouseWheel(e)*this._step;this._snapClampSetValue(this.getValue()+t),this.$input.value=this.getValue(),clearTimeout(p),p=setTimeout(f,400)},{passive:!1})}_setDraggingStyle(e,t=`horizontal`){this.$slider&&this.$slider.classList.toggle(`lil-active`,e),document.body.classList.toggle(`lil-dragging`,e),document.body.classList.toggle(`lil-${t}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:n}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,n=-e.wheelDelta/120,n*=this._stepExplicit?1:10),t+-n}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){let t=0;return this._hasMin?t=this._min:this._hasMax&&(t=this._max),e-=t,e=Math.round(e/this._step)*this._step,e+=t,e=parseFloat(e.toPrecision(15)),e}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){let e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}},_r=class extends ${constructor(e,t,n,r){super(e,t,n,`lil-option`),this.$select=document.createElement(`select`),this.$select.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$select.addEventListener(`change`,()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener(`focus`,()=>{this.$display.classList.add(`lil-focus`)}),this.$select.addEventListener(`blur`,()=>{this.$display.classList.remove(`lil-focus`)}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(r)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(e=>{let t=document.createElement(`option`);t.textContent=e,this.$select.appendChild(t)}),this.updateDisplay(),this}updateDisplay(){let e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.textContent=t===-1?e:this._names[t],this}},vr=class extends ${constructor(e,t,n){super(e,t,n,`lil-string`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`spellcheck`,`false`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$input.addEventListener(`input`,()=>{this.setValue(this.$input.value)}),this.$input.addEventListener(`keydown`,e=>{e.code===`Enter`&&this.$input.blur()}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}},yr=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function br(e){let t=document.createElement(`style`);t.innerHTML=e;let n=document.querySelector(`head link[rel=stylesheet], head style`);n?document.head.insertBefore(t,n):document.head.appendChild(t)}var xr=!1,Sr=class e{constructor({parent:e,autoPlace:t=e===void 0,container:n,width:r,title:i=`Controls`,closeFolders:a=!1,injectStyles:o=!0,touchStyles:s=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement(`div`),this.domElement.classList.add(`lil-gui`),this.$title=document.createElement(`button`),this.$title.classList.add(`lil-title`),this.$title.setAttribute(`aria-expanded`,!0),this.$title.addEventListener(`click`,()=>this.openAnimated(this._closed)),this.$title.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$children=document.createElement(`div`),this.$children.classList.add(`lil-children`),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add(`lil-root`),s&&this.domElement.classList.add(`lil-allow-touch-styles`),!xr&&o&&(br(yr),xr=!0),n?n.appendChild(this.domElement):t&&(this.domElement.classList.add(`lil-auto-place`,`autoPlace`),document.body.appendChild(this.domElement)),r&&this.domElement.style.setProperty(`--width`,r+`px`),this._closeFolders=a}add(e,t,n,r,i){if(Object(n)===n)return new _r(this,e,t,n);let a=e[t];switch(typeof a){case`number`:return new gr(this,e,t,n,r,i);case`boolean`:return new cr(this,e,t);case`string`:return new vr(this,e,t);case`function`:return new hr(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,a)}addColor(e,t,n=1){return new mr(this,e,t,n)}addFolder(t){let n=new e({parent:this,title:t});return this.root._closeFolders&&n.close(),n}load(e,t=!0){return e.controllers&&this.controllers.forEach(t=>{t instanceof hr||t._name in e.controllers&&t.load(e.controllers[t._name])}),t&&e.folders&&this.folders.forEach(t=>{t._title in e.folders&&t.load(e.folders[t._title])}),this}save(e=!0){let t={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof hr)){if(e._name in t.controllers)throw Error(`Cannot save GUI with duplicate property "${e._name}"`);t.controllers[e._name]=e.save()}}),e&&this.folders.forEach(e=>{if(e._title in t.folders)throw Error(`Cannot save GUI with duplicate folder "${e._title}"`);t.folders[e._title]=e.save()}),t}open(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),this.domElement.classList.toggle(`lil-closed`,this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),requestAnimationFrame(()=>{let t=this.$children.clientHeight;this.$children.style.height=t+`px`,this.domElement.classList.add(`lil-transition`);let n=e=>{e.target===this.$children&&(this.$children.style.height=``,this.domElement.classList.remove(`lil-transition`),this.$children.removeEventListener(`transitionend`,n))};this.$children.addEventListener(`transitionend`,n);let r=e?this.$children.scrollHeight:0;this.domElement.classList.toggle(`lil-closed`,!e),requestAnimationFrame(()=>{this.$children.style.height=r+`px`})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}};export{ee as A,Ae as C,ae as D,oe as E,re as M,p as N,S as O,d as P,ze as S,D as T,q as _,In as a,He as b,gn as c,un as d,rn as f,Y as g,Ct as h,Vn as i,b as j,x as k,mn as l,Jt as m,sr as n,bn as o,nn as p,Hn as r,_n as s,Sr as t,dn as u,ut as v,P as w,Be as x,ct as y};