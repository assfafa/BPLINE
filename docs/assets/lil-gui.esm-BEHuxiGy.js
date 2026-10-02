import{c as e,d as t,i as n,n as r,r as i}from"./index-YNW6j57L.js";import{t as a}from"./CodeBlock-CyqGzVsB.js";import{t as o}from"./Vec2-NTeaCz1R.js";import{t as s}from"./Mat3-DaAa6MZ7.js";var c=r(),l=({title:e,shortCode:t,fullCode:r,Preview:o})=>{let{language:s}=n();return(0,c.jsxs)(`article`,{"aria-label":e,className:`grid min-h-full grid-cols-1 grid-rows-[repeat(4,18rem)] lg:h-full lg:min-h-0 lg:grid-cols-2 lg:grid-rows-2`,children:[(0,c.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-r`,children:[(0,c.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:i.translate(s,`example.fullCode`)}),(0,c.jsx)(a,{code:r})]}),(0,c.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border`,children:[(0,c.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:i.translate(s,`example.advancedPreview`)}),(0,c.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,c.jsx)(o,{advanced:!0})})]}),(0,c.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r`,children:[(0,c.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:i.translate(s,`example.simpleCode`)}),(0,c.jsx)(a,{code:t})]}),(0,c.jsxs)(`section`,{className:`flex min-h-0 min-w-0 flex-col overflow-hidden`,children:[(0,c.jsx)(`h2`,{className:`shrink-0 border-b border-border px-4 py-2 text-sm font-semibold`,children:i.translate(s,`example.simplePreview`)}),(0,c.jsx)(`div`,{className:`min-h-0 flex-1`,children:(0,c.jsx)(o,{advanced:!1})})]})]})},u=t(e(),1),d=({advanced:e,controlsId:t,mountScene:r})=>{let{language:a}=n(),o=(0,u.useRef)(null),s=(0,u.useRef)(null),[l,d]=(0,u.useState)(null),[f,p]=(0,u.useState)(!1),m=null,h=`absolute inset-0`,g=i.translate(a,`example.showControls`),_=`hidden`;return f&&(g=i.translate(a,`example.hideControls`),_=`block`),(0,u.useEffect)(()=>{let t=o.current,n;return t&&(n=r({container:t,guiContainer:s.current,advanced:e,onError:e=>{e instanceof Error?d(e.message):d(String(e))}})),n},[e,r]),e&&(h=`absolute inset-0 lg:right-[205px]`),e&&(m=(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(`button`,{type:`button`,"aria-controls":t,"aria-expanded":f,onClick:()=>{p(!f)},className:`absolute right-2 top-2 z-20 rounded-md border border-border bg-background px-3 py-1.5 text-xs shadow lg:hidden`,children:g}),(0,c.jsx)(`div`,{id:t,ref:s,className:`${_} absolute right-2 top-12 z-10 max-h-[calc(100%-3.5rem)] w-[220px] max-w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-background/95 p-2 shadow-xl lg:top-2 lg:block lg:max-h-[calc(100%-1rem)]`})]})),(0,c.jsxs)(`div`,{className:`relative h-full min-h-0 overflow-hidden bg-muted/40`,children:[(0,c.jsx)(`div`,{ref:o,className:h}),m,l&&(0,c.jsxs)(`div`,{role:`alert`,className:`absolute inset-x-4 bottom-4 rounded-md border border-destructive/30 bg-background/90 p-3 text-sm text-destructive`,children:[i.translate(a,`example.gpuError`),l]})]})},f=0,p=()=>{let e=f;return f+=1,e},m=class{id=p();type=`ObjectNode`;_version=0;_parent=null;_position;_rotation=0;_scale;_matrix=new s;_worldMatrix=new s;_order=0;_localSnapshot=-1;_worldSnapshot=-1;_parentSnapshot=null;_parentVersion=-1;_writingMatrices=!1;_nodeDisposed=!1;constructor(e,t){this._position=new o(e,t),this._scale=new o(1,1),this._position.add(this,`position`),this._scale.add(this,`scale`),this._matrix.add(this,`matrix`),this._worldMatrix.add(this,`worldMatrix`)}get version(){return this._version}updateVersion(){this._version++}get parent(){return this._parent}set parent(e){if(this._parent!==e)this._parent=e,this.updateVersion();else return}get position(){return this._position}set position(e){if(this._position!==e)this._position.delete(this,`position`),this._position=e,e.add(this,`position`),this.updateVersion();else return}get rotation(){return this._rotation}set rotation(e){if(this._rotation!==e)this._rotation=e,this.updateVersion();else return}get scale(){return this._scale}set scale(e){if(this._scale!==e)this._scale.delete(this,`scale`),this._scale=e,e.add(this,`scale`),this.updateVersion();else return}get matrix(){return this._matrix}set matrix(e){if(this._matrix!==e)this._matrix.delete(this,`matrix`),this._matrix=e,e.add(this,`matrix`),this.onMathChange(e,`matrix`);else return}get worldMatrix(){return this._worldMatrix}set worldMatrix(e){if(this._worldMatrix!==e)this._worldMatrix.delete(this,`worldMatrix`),this._worldMatrix=e,e.add(this,`worldMatrix`),this.onMathChange(e,`worldMatrix`);else return}onMathChange(e,t){if(!this._nodeDisposed&&!this._writingMatrices)t===`position`&&e===this._position||t===`scale`&&e===this._scale?this.updateVersion():(t===`matrix`&&e===this._matrix||t===`worldMatrix`&&e===this._worldMatrix)&&(this.updateVersion(),this._localSnapshot=this.version,t===`worldMatrix`&&(this._worldSnapshot=this.version,this._parentSnapshot=this.parent?.worldMatrix??null,this._parentVersion=this._parentSnapshot?.version??-1));else return}ensureMatrix(){if(this._nodeDisposed)throw Error(`Disposed node cannot be updated.`);return this._localSnapshot!==this.version&&this.updateMatrix(),this._matrix}updateMatrix(){let e=Math.cos(this.rotation),t=Math.sin(this.rotation);this._writingMatrices=!0;try{this._matrix.set([e*this.scale.x,t*this.scale.x,0,-t*this.scale.y,e*this.scale.y,0,this.position.x,this.position.y,1]),this._localSnapshot=this.version,this._worldSnapshot=-1}finally{this._writingMatrices=!1}return this._matrix}ensureWorldMatrix(){this.parent?.ensureWorldMatrix(),this.ensureMatrix();let e=this.parent?.worldMatrix??null,t=e?.version??-1;if(this._worldSnapshot!==this.version||this._parentSnapshot!==e||this._parentVersion!==t){this._writingMatrices=!0;try{e===null?this._worldMatrix.copy(this._matrix):this._worldMatrix.mul(e,this._matrix),this._worldSnapshot=this.version,this._parentSnapshot=e,this._parentVersion=t}finally{this._writingMatrices=!1}}return this._worldMatrix}updateWorldMatrix(){return this._worldSnapshot=-1,this.ensureWorldMatrix()}get order(){return this._order}set order(e){if(this._order!==e){this._order=e;let t=this.parent;for(;t!==null;){if(t.type===`Scene`){t.updateVersion();break}t=t.parent}}else return}dispose(){this._position.delete(this,`position`),this._scale.delete(this,`scale`),this._matrix.delete(this,`matrix`),this._worldMatrix.delete(this,`worldMatrix`),this._nodeDisposed=!0}},h=()=>typeof window>`u`?1:window.devicePixelRatio||1,g=()=>{if(typeof window>`u`)return Object.freeze({width:0,height:0,dpr:1});{let e=h();return Object.freeze({width:Math.round(window.innerWidth*e),height:Math.round(window.innerHeight*e),dpr:e})}},_=class extends m{type=`Camera`;_width;_height;_zoom;_orthogonalMatrix=new s;_viewMatrix=new s;_projectionSnapshot=-1;_viewWorldMatrix;_viewWorldVersion=-1;_writingCamera=!1;buffers={};constructor(e=100,t=100,n=1){super(0,0),this._width=e,this._height=t,this._zoom=n,this._orthogonalMatrix.add(this,`orthogonalMatrix`),this._viewMatrix.add(this,`viewMatrix`),this.updateCameraMatrix()}get width(){return this._width}set width(e){if(this._width!==e)this._width=e,this.updateVersion();else return}get height(){return this._height}set height(e){if(this._height!==e)this._height=e,this.updateVersion();else return}get zoom(){return this._zoom}set zoom(e){if(this._zoom!==e)this._zoom=e,this.updateVersion();else return}get top(){return this.height*.5/this.zoom}get bottom(){return-this.height*.5/this.zoom}get left(){return-this.width*.5/this.zoom}get right(){return this.width*.5/this.zoom}get orthogonalMatrix(){return this._orthogonalMatrix}set orthogonalMatrix(e){if(this._orthogonalMatrix!==e)this._orthogonalMatrix.delete(this,`orthogonalMatrix`),this._orthogonalMatrix=e,e.add(this,`orthogonalMatrix`),this.onMathChange(e,`orthogonalMatrix`);else return}get viewMatrix(){return this._viewMatrix}set viewMatrix(e){if(this._viewMatrix!==e)this._viewMatrix.delete(this,`viewMatrix`),this._viewMatrix=e,e.add(this,`viewMatrix`),this.onMathChange(e,`viewMatrix`);else return}onMathChange(e,t){if(!this._nodeDisposed){if(t===`orthogonalMatrix`&&e===this._orthogonalMatrix||t===`viewMatrix`&&e===this._viewMatrix){if(!this._writingCamera)this.updateVersion(),t===`orthogonalMatrix`?this._projectionSnapshot=this.version:(this._viewWorldMatrix=this.worldMatrix,this._viewWorldVersion=this.worldMatrix.version);else return}else super.onMathChange(e,t)}}setViewport(e=100,t=100){if(this._width!==e||this._height!==t)this._width=e,this._height=t,this.updateVersion();else return}add(){throw Error(`Camera does not support add().`)}ensureCameraMatrix(){this.ensureWorldMatrix(),this._projectionSnapshot!==this.version&&this.updateOrthogonalMatrix(),(this._viewWorldMatrix!==this.worldMatrix||this._viewWorldVersion!==this.worldMatrix.version)&&this.updateViewMatrix()}updateOrthogonalMatrix(){this._writingCamera=!0;try{this._orthogonalMatrix.set([2*this.zoom/this.width,0,0,0,2*this.zoom/this.height,0,0,0,1]),this._projectionSnapshot=this.version}finally{this._writingCamera=!1}return this._orthogonalMatrix}updateViewMatrix(){this.ensureWorldMatrix(),this._writingCamera=!0;try{this._viewMatrix.copy(this.worldMatrix).invert(),this._viewWorldMatrix=this.worldMatrix,this._viewWorldVersion=this.worldMatrix.version}finally{this._writingCamera=!1}return this._viewMatrix}updateCameraMatrix(){this.updateOrthogonalMatrix(),this.updateViewMatrix()}dispose(){this._orthogonalMatrix.delete(this,`orthogonalMatrix`),this._viewMatrix.delete(this,`viewMatrix`),super.dispose()}worldToNdc(e){return this.ensureCameraMatrix(),e.clone().apply(this._viewMatrix).apply(this._orthogonalMatrix)}ndcToScreen(e,t){let n=g().dpr,r=t?.canvas.getBoundingClientRect(),i=r?.width??this.width/n,a=r?.height??this.height/n;return new o((e.x+1)*.5*i,(1-e.y)*.5*a)}worldToScreen(e,t){let n=this.worldToNdc(e);return this.ndcToScreen(n,t)}screenToNdc(e,t){let n=g().dpr,r=t?.canvas.getBoundingClientRect(),i=r?.width??this.width/n,a=r?.height??this.height/n;if(i<=0||a<=0)throw RangeError(`Cannot convert coordinates on a zero-size canvas.`);let s=e.x/i*2-1,c=1-e.y/a*2;return new o(s,c)}ndcToWorld(e){return this.ensureCameraMatrix(),e.clone().apply(this._orthogonalMatrix.clone().invert()).apply(this._viewMatrix.clone().invert())}screenToWorld(e,t){let n=this.screenToNdc(e,t);return this.ndcToWorld(n)}worldToWindow(e,t){let n=this.worldToScreen(e,t),r=t.canvas.getBoundingClientRect();return n.x+=r.left,n.y+=r.top,n}windowToWorld(e,t){let n=e.clone(),r=t.canvas.getBoundingClientRect();return n.x-=r.left,n.y-=r.top,this.screenToWorld(n,t)}},v=class e{_data=[1,1,1,1];_subscribers=new Map;constructor(e=`#ffffff`){this.setHex(e)}get r(){return this._data[0]}set r(e){let t=[...this._data];t[0]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get g(){return this._data[1]}set g(e){let t=[...this._data];t[1]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get b(){return this._data[2]}set b(e){let t=[...this._data];t[2]=e,this.setRGBA(t[0],t[1],t[2],t[3])}get a(){return this._data[3]}set a(e){let t=[...this._data];t[3]=e,this.setRGBA(t[0],t[1],t[2],t[3])}setRGB(e,t,n){return this.setRGBA(e,t,n,this.a)}setRGBA(e,t,n,r=1){let i=[e,t,n,r];if(!i.every(Number.isFinite))throw RangeError(`Color components must be finite.`);let a=i.map(e=>Math.min(1,Math.max(0,e)));if(a.every((e,t)=>e===this._data[t])===!1){this._data.splice(0,4,...a);for(let[e,t]of[...this._subscribers])for(let n of[...t])e.onColorChange(this,n)}return this}setHex(e){if(typeof e==`number`&&(!Number.isInteger(e)||e<0||e>16777215))throw RangeError(`Numeric hex colors must be between 0x000000 and 0xffffff.`);let t;if(t=typeof e==`number`?e.toString(16).padStart(6,`0`):e.replace(/^#/,``),!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t))throw TypeError(`Invalid hex color.`);return t.length<=4&&(t=t.replace(/./g,e=>e+e)),t.length===6&&(t+=`ff`),this.setRGBA(...[0,2,4,6].map(e=>parseInt(t.slice(e,e+2),16)/255))}toHex(e=!1){let t=3;return e&&(t=4),`#`+this._data.slice(0,t).map(e=>Math.round(e*255).toString(16).padStart(2,`0`)).join(``)}writeTo(e,t=0){return e.set(this._data,t),e}copy(e){return this.setRGBA(e.r,e.g,e.b,e.a)}clone(){return new e().copy(this)}add(e,t=`color`){let n=this._subscribers.get(e)??new Set;n.add(t),this._subscribers.set(e,n)}delete(e,t){if(t===void 0){this._subscribers.delete(e);return}{let n=this._subscribers.get(e);n?.delete(t),n?.size===0&&this._subscribers.delete(e)}}},y=class{area;_subscribers=new Set;_enabled=!1;_color=new v;_opacity=1;constructor(e){this.area=e,this._color.add(this,`color`)}get enabled(){return this._enabled}set enabled(e){if(this._enabled!==e)this._enabled=e,this.notify(`enabled`);else return}get color(){return this._color}set color(e){if(this._color!==e)this._color.delete(this,`color`),this._color=e,e.add(this,`color`),this.notify(`color`);else return}get opacity(){return this._opacity}set opacity(e){if(e=b(e),e=Math.min(1,e),this._opacity!==e)this._opacity=e,this.notify(`opacity`);else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._color.delete(this,`color`),this._subscribers.clear()}onColorChange(e,t){if(t!==`color`||e===this._color)this.notify(t);else return}notify(e){for(let t of[...this._subscribers])t.onPartChange(this.area,e)}},b=e=>{if(!Number.isFinite(e))throw RangeError(`Style values must be finite.`);return Math.max(0,e)},x=class extends y{_texture;_addressModeU=`repeat`;_addressModeV=`repeat`;get texture(){return this._texture}set texture(e){if(this._texture!==e)this._texture?.delete(this),this._texture=e,e?.add(this),this.notify(`texture`);else return}onTextureChange(e){e===this._texture&&this.notify(`textureData`)}dispose(){this._texture?.delete(this),super.dispose()}get addressModeU(){return this._addressModeU}set addressModeU(e){if(![`repeat`,`mirror-repeat`,`clamp-to-edge`].includes(e))throw TypeError(`Invalid address mode.`);if(this._addressModeU!==e)this._addressModeU=e,this.notify(`addressModeU`);else return}get addressModeV(){return this._addressModeV}set addressModeV(e){if(![`repeat`,`mirror-repeat`,`clamp-to-edge`].includes(e))throw TypeError(`Invalid address mode.`);if(this._addressModeV!==e)this._addressModeV=e,this.notify(`addressModeV`);else return}},ee=class extends x{_borderColor=new v(`#000000`);constructor(){super(`solid`),this._borderColor.add(this,`borderColor`)}get borderColor(){return this._borderColor}set borderColor(e){if(this._borderColor!==e)this._borderColor.delete(this,`borderColor`),this._borderColor=e,e.add(this,`borderColor`),this.notify(`borderColor`);else return}dispose(){this._borderColor.delete(this,`borderColor`),super.dispose()}onColorChange(e,t){if(t!==`borderColor`||e===this._borderColor)super.onColorChange(e,t);else return}_borderWidth=0;get borderWidth(){return this._borderWidth}set borderWidth(e){if(e=b(e),this._borderWidth!==e)this._borderWidth=e,this.notify(`borderWidth`);else return}_borderAlign=`normal`;get borderAlign(){return this._borderAlign}set borderAlign(e){if(![`inset`,`normal`,`outset`].includes(e))throw TypeError(`Invalid border alignment.`);if(this._borderAlign!==e)this._borderAlign=e,this.notify(`borderAlign`);else return}_pixelAligned=`px`;get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}},te=class extends y{constructor(){super(`wireframe`)}},S=class extends x{constructor(){super(`edge`),this.addressModeV=`clamp-to-edge`}_width=1;get width(){return this._width}set width(e){if(e=b(e),this._width!==e)this._width=e,this.notify(`width`);else return}_borderAlign=`normal`;get borderAlign(){return this._borderAlign}set borderAlign(e){if(![`inset`,`normal`,`outset`].includes(e))throw TypeError(`Invalid border alignment.`);if(this._borderAlign!==e)this._borderAlign=e,this.notify(`borderAlign`);else return}_pixelAligned=`px`;get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}_uvRepeat=1;get uvRepeat(){return this._uvRepeat}set uvRepeat(e){if(e=b(e),this._uvRepeat!==e)this._uvRepeat=e,this.notify(`uvRepeat`);else return}},C=class extends x{constructor(){super(`points`),this.addressModeU=`clamp-to-edge`,this.addressModeV=`clamp-to-edge`}_pixelAligned=`px`;get pixelAligned(){return this._pixelAligned}set pixelAligned(e){if(![`px`,`zoom`].includes(e))throw TypeError(`Invalid pixel alignment.`);if(this._pixelAligned!==e)this._pixelAligned=e,this.notify(`pixelAligned`);else return}_vertices=!0;get vertices(){return this._vertices}set vertices(e){if(this._vertices!==e)this._vertices=e,this.notify(`vertices`);else return}_midpoints=!1;get midpoints(){return this._midpoints}set midpoints(e){if(this._midpoints!==e)this._midpoints=e,this.notify(`midpoints`);else return}_radius=2;get radius(){return this._radius}set radius(e){if(e=b(e),this._radius!==e)this._radius=e,this.notify(`radius`);else return}_segments=4;get segments(){return this._segments}set segments(e){if(!Number.isSafeInteger(e)||e<3)throw RangeError(`Point segments must be an integer >= 3.`);if(this._segments!==e)this._segments=e,this.notify(`segments`);else return}_minPointsLength=6;get minPointsLength(){return this._minPointsLength}set minPointsLength(e){if(e=b(e),this._minPointsLength!==e)this._minPointsLength=e,this.notify(`minPointsLength`);else return}_minEdgePointsLength=4;get minEdgePointsLength(){return this._minEdgePointsLength}set minEdgePointsLength(e){if(e=b(e),this._minEdgePointsLength!==e)this._minEdgePointsLength=e,this.notify(`minEdgePointsLength`);else return}},ne=class{_type=`miter`;_seg=8;_subscribers=new Set;get type(){return this._type}set type(e){if(![`miter`,`round`,`bevel`].includes(e))throw TypeError(`Invalid join type.`);if(this._type!==e)this._type=e,this.notify(`type`);else return}get seg(){return this._seg}set seg(e){if(!Number.isInteger(e)||e<1||e>4096)throw RangeError(`Join seg must be an integer in [1, 4096].`);if(this._seg!==e)this._seg=e,this.notify(`seg`);else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._subscribers.clear()}notify(e){for(let t of[...this._subscribers])t.onPartChange(`join`,e)}},w=(e,t,n=0)=>{if(!Number.isSafeInteger(n)||n<0||n+44>t.length)throw RangeError(`Style data offset exceeds the target capacity.`);t.fill(0,n+40,n+44);let{solid:r,wireframe:i,edge:a,points:o}=e;r.color.writeTo(t,n),r.borderColor.writeTo(t,n+4),a.color.writeTo(t,n+8),o.color.writeTo(t,n+12),i.color.writeTo(t,n+16),t.set([r.opacity,r.borderWidth,T(r.borderAlign),Number(r.pixelAligned===`zoom`)],n+20),t.set([a.opacity,a.width,T(a.borderAlign),Number(a.pixelAligned===`zoom`)],n+24),t.set([o.opacity,Number(o.pixelAligned===`zoom`),0,0],n+28),t.set([i.opacity,0,0,0],n+32),t.set([Number(r.enabled),Number(i.enabled),Number(a.enabled),Number(o.enabled)],n+36)},T=e=>e===`inset`?0:e===`normal`?.5:1,E=class{type=`Style`;_solid;_wireframe;_edge;_points;_join;_subscribers=new Set;_version=0;_key=`wireframe:0`;constructor(){this._solid=new ee,this._wireframe=new te,this._edge=new S,this._points=new C,this._join=new ne,this._solid.add(this),this._wireframe.add(this),this._edge.add(this),this._points.add(this),this._join.add(this)}get solid(){return this._solid}get wireframe(){return this._wireframe}get edge(){return this._edge}get points(){return this._points}get join(){return this._join}get version(){return this._version}get key(){return this._key}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}dispose(){this._solid.dispose(),this._wireframe.dispose(),this._edge.dispose(),this._points.dispose(),this._join.dispose(),this._subscribers.clear()}onPartChange(e,t){this._version++,e===`wireframe`&&t===`enabled`&&(this._key=this._wireframe.enabled?`wireframe:1`:`wireframe:0`);let n=Object.freeze({source:this,area:e,field:t});for(let e of[...this._subscribers])e.onStyleChange(n)}},D=class{id=p();type=`Geo`;_version=0;_generatedVersion=-1;_style;_disposed=!1;_subscribers=new Set;_geometry;normal;uv;index;linePoints;vertexType;position;miterScale;uniformData=new Float32Array(4);constructor(e=new E){this._style=e,e.add(this)}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed geometry cannot be reused.`);if(this._style!==e)this._style.delete(this),this._style=e,e.add(this),this.updateVersion();else return}onStyleChange(e){if(!this._disposed&&e.source===this._style)(e.field===`enabled`||e.area===`join`&&this.type===`Poly2D`||e.area===`edge`&&[`width`,`borderAlign`,`uvRepeat`].includes(e.field)||e.area===`points`&&[`vertices`,`midpoints`,`radius`,`segments`,`minPointsLength`,`minEdgePointsLength`].includes(e.field))&&this.updateVersion();else return}dispose(){this._style.delete(this),this._subscribers.clear(),this._disposed=!0}add(e){if(this._disposed)throw Error(`Disposed geometry cannot be reused.`);this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}get geometry(){return this._geometry}set geometry(e){if(this._geometry!==e){let t=this._generatedVersion,n=this._version;this._geometry=e,this.updateVersion(),t===n&&(this._generatedVersion=this._version)}else return}mergeGeometry(e){let t=e.reduce((e,t)=>e+t.data.geometry.length/2,0),n=e.reduce((e,t)=>e+t.data.index.length,0);if(n===0){this._geometry=void 0,this.normal=void 0,this.uv=void 0,this.index=void 0,this.vertexType=void 0,this.position=void 0,this.miterScale=void 0;return}{this._geometry=new Float32Array(t*2),this.normal=new Float32Array(t*2),this.uv=new Float32Array(t*2),this.position=new Float32Array(t*2),this.vertexType=new Float32Array(t),this.miterScale=new Float32Array(t).fill(1),this.index=t>65536?new Uint32Array(n):new Uint16Array(n);let r=0,i=0;for(let t of e){let e=t.data,n=e.geometry.length/2;this._geometry.set(e.geometry,r*2),this.normal.set(e.normal,r*2),this.uv.set(e.uv,r*2),this.vertexType.fill(t.vertexType,r,r+n),e.position!==void 0&&this.position.set(e.position,r*2),e.miterScale!==void 0&&this.miterScale.set(e.miterScale,r);for(let t of e.index)this.index[i]=t+r,i+=1;r+=n}}}get version(){return this._version}updateVersion(){this._version++;for(let e of[...this._subscribers])e.onGeometryChange(this)}ensureGeometry(){if(this._disposed)throw Error(`Disposed geometry cannot be rendered.`);return this._generatedVersion!==this._version&&this.updateGeometry(),this}updateGeometry(){return this.updateVersion(),this._generatedVersion=this._version,this}},O=class extends m{type=`Group`;children=[];constructor(e,t){super(e,t)}add(e){if(e===this)throw Error(`Cannot add a group to itself or one of its descendants.`);let t=this.parent;for(;t!==null;){if(t===e)throw Error(`Cannot add a group to itself or one of its descendants.`);t=t.parent}if(e.parent!==this||!this.children.includes(e)){e.parent!==null&&`removeChild`in e.parent&&e.parent.removeChild(e),e.parent=this,this.children.push(e);let t=this.getScene(e);t!==void 0&&(t.addToLists(e),t.updateVersion())}else return}removeSelf(){let e=this.parent;return e!==null&&`removeChild`in e&&e.removeChild(this)}removeChild(e){let t=this.children.indexOf(e);if(t===-1)return!1;{let n=this.getScene(this);return this.children.splice(t,1),e.parent=null,n!==void 0&&n.removeFromLists(e),!0}}removeAll(){if(this.children.length!==0){let e=this.getScene(this);for(let t of this.children)e?.removeFromLists(t),t.parent=null;this.children.length=0}else return}updateWorldMatrix(){super.updateWorldMatrix();for(let e of this.children)e.updateWorldMatrix();return this.worldMatrix}getScene(e){let t=e;for(;t!==null;)if(t.type===`Scene`)return t;else t=t.parent}},k=class extends O{type=`Mesh`;_data;_material;_style;_bounding=!1;_boundingBox=null;_boundingGeometry;_boundingGeometryVersion=-1;_boundingWorldMatrix;_boundingWorldMatrixVersion=-1;_matrixVersion=0;_styleVersion=0;_stylePending=!0;_geometryPending=!0;_materialPending=!0;_disposed=!1;_matrixPending=!0;_count=1;get count(){return this._count}_capacity=1;get capacity(){return this._capacity}_matrixData=new Float32Array(12);get matrixData(){return this._matrixData}_styleData=new Float32Array(44);get styleData(){return this._styleData}get textures(){let e=this.material?.style;return[e?.solid.texture,e?.edge.texture,e?.points.texture]}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._style!==e||e!==void 0&&(this._data!==void 0&&this._data.style!==e||this._material!==void 0&&this._material.style!==e))this._style=e,this.syncStyle(),this.updateResources();else return}get bounding(){return this._bounding}set bounding(e){if(this._bounding!==e)this._bounding=e,this._boundingBox=null,this._boundingGeometry=void 0,this._boundingWorldMatrix=void 0,this.updateVersion();else return}get boundingBox(){if(this._bounding){let e=this._data;if(e!==void 0){e.ensureGeometry();let t=this.ensureWorldMatrix();(this._boundingGeometry!==e||this._boundingGeometryVersion!==e.version||this._boundingWorldMatrix!==t||this._boundingWorldMatrixVersion!==t.version)&&(this._boundingBox=this.createBoundingBox(e,t),this._boundingGeometry=e,this._boundingGeometryVersion=e.version,this._boundingWorldMatrix=t,this._boundingWorldMatrixVersion=t.version)}else this._boundingBox=null,this._boundingGeometry=void 0}return this._boundingBox}createBoundingBox(e,t){let n=t.data;if(n.every(Number.isFinite)){let t=1/0,r=1/0,i=-1/0,a=-1/0,o=1/0,s=1/0,c=-1/0,l=-1/0,u=[e.geometry,e.linePoints?.geometry];for(let e of u)if(e!==void 0)for(let u=0;u+1<e.length;u+=2){let d=e[u],f=e[u+1],p=n[0]*d+n[3]*f+n[6],m=n[1]*d+n[4]*f+n[7];Number.isFinite(d)&&Number.isFinite(f)&&Number.isFinite(p)&&Number.isFinite(m)&&(t=Math.min(t,d),r=Math.min(r,f),i=Math.max(i,d),a=Math.max(a,f),o=Math.min(o,p),s=Math.min(s,m),c=Math.max(c,p),l=Math.max(l,m))}return Number.isFinite(t)?{local:{x:t,y:r,width:i-t,height:a-r},world:{x:o,y:s,width:c-o,height:l-s}}:null}return null}get matrixVersion(){return this._matrixVersion}get styleVersion(){return this._styleVersion}get geometryPending(){return this._geometryPending}get materialPending(){return this._materialPending}onGeometryChange(e){!this._disposed&&e===this._data&&(this._geometryPending=!0)}onMaterialChange(e){if(!this._disposed&&e.source===this._material)this._materialPending=!0,this._stylePending||=e.style,e.resources&&this.getScene(this)?.updateVersion();else return}dispose(){super.dispose(),this._data?.delete(this),this._material?.delete(this),this._disposed=!0}syncStyle(){if(this._style!==void 0)this._data!==void 0&&(this._data.style=this._style),this._material!==void 0&&(this._material.style=this._style);else return}updateInstanceData(){if(this._disposed)throw Error(`Disposed mesh cannot be rendered.`);this._geometryPending&&this._data!==void 0&&this._material?.addGeometryType(this._data.type);let e=this.worldMatrix.GPUData;if(this._matrixPending&&=(this.matrixData.set(e,0),this._matrixVersion++,!1),this._stylePending){let e=this._material?.style;e===void 0?this.styleData.fill(0):w(e,this.styleData,0),this._styleVersion++,this._stylePending=!1}this._geometryPending=!1,this._materialPending=!1}onMathChange(e,t){super.onMathChange(e,t),!this._nodeDisposed&&t===`worldMatrix`&&e===this.worldMatrix&&(this._matrixPending=!0)}get data(){return this._data}set data(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._data!==e)e?.add(this),this._data?.delete(this),this._data=e,this._geometryPending=!0,this.syncStyle(),this.updateResources();else return}get material(){return this._material}set material(e){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);if(this._material!==e)e?.add(this),this._material?.delete(this),this._material=e,this._materialPending=!0,this._stylePending=!0,this.syncStyle(),this.updateResources();else return}updateResources(){this._data!==void 0&&this._material?.addGeometryType(this._data.type);let e=this.getScene(this);e!==void 0&&(e.updateLists(),e.updateVersion())}constructor(e,t,n=!0){super(0,0),this._style=n===!0?new E:n===!1?void 0:n,this.init(e,t)}init(e,t){if(this._disposed)throw Error(`Disposed mesh cannot be reused.`);return e!==this._data&&(e.add(this),this._data?.delete(this)),t!==this._material&&(t.add(this),this._material?.delete(this)),this._data=e,this._material=t,this._geometryPending=!0,this._materialPending=!0,this._stylePending=!0,this.updateResources(),this}},re=class{id=p();index;_position;_rotation;_scale;_style;_enabled;_version=0;_subscribers=new Set;_disposed=!1;constructor(e,t={}){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`Invalid raw index.`);if(this.index=e,this._position=t.position??new o,this._rotation=t.rotation??0,this._scale=t.scale??new o(1,1),this._style=t.style??new E,this._enabled=t.enabled??!0,!Number.isFinite(this._rotation))throw RangeError(`Rotation must be finite.`);this._position.add(this,`position`),this._scale.add(this,`scale`),this._style.add(this)}get version(){return this._version}get position(){return this._position}set position(e){if(e!==this._position)this.assertActive(),this._position.delete(this,`position`),this._position=e,e.add(this,`position`),this.notify(`matrix`);else return}get rotation(){return this._rotation}set rotation(e){if(!Number.isFinite(e))throw RangeError(`Rotation must be finite.`);if(e!==this._rotation)this.assertActive(),this._rotation=e,this.notify(`matrix`);else return}get scale(){return this._scale}set scale(e){if(e!==this._scale)this.assertActive(),this._scale.delete(this,`scale`),this._scale=e,e.add(this,`scale`),this.notify(`matrix`);else return}get style(){return this._style}set style(e){if(e!==this._style)this.assertActive(),this._style.delete(this),this._style=e,e.add(this),this.notify(`texture`);else return}get enabled(){return this._enabled}set enabled(e){if(e!==this._enabled)this.assertActive(),this._enabled=e,this.notify(`style`);else return}add(e){this.assertActive(),this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}onMathChange(e,t){(t===`position`&&e===this._position||t===`scale`&&e===this._scale)&&this.notify(`matrix`)}onStyleChange(e){if(e.source===this._style){let t=e.field;t===`texture`?this.notify(`texture`):t===`textureData`?this.notify(`textureData`):t===`addressModeU`||t===`addressModeV`?this.notify(`sampler`):this.notify(`style`)}else return}dispose(){this._position.delete(this,`position`),this._scale.delete(this,`scale`),this._style.delete(this),this._subscribers.clear(),this._disposed=!0}assertActive(){if(this._disposed)throw Error(`Disposed Raw cannot be reused.`)}notify(e){if(!this._disposed){this._version++;for(let t of this._subscribers)t.onRawChange(this,e)}}},ie=class{_map=new Map;get map(){return this._map}get size(){return this._map.size}add(e){this._map.set(e.id,e)}clear(){for(let e of this._map.values())e.dispose();this._map.clear()}},A=class{id=p();type=`TextureLayers`;_version=0;_layers=[];get version(){return this._version}get layers(){return this._layers}set(e){if(e.length!==this._layers.length||!e.every((e,t)=>e===this._layers[t])){for(let e of this._layers)e?.delete(this);this._layers=Object.freeze([...e]);for(let e of this._layers)e?.add(this);this._version++}else return}onTextureChange(e){this._layers.includes(e)&&this._version++}dispose(){this.set([])}},j=class extends k{type=`IMesh`;_raw;_raws=new ie;_growthFactor=2;_ids=[];_pendingMatrices=new Set;_pendingStyles=new Set;_local=new s;_world=new s;_sources=[];_textures=[new A,new A,new A];_layerIndices=[new Map,new Map,new Map];_layersPending=!1;constructor(e,t,n={}){ae(n),super(e,t,!1),this._raw=n.raw??!0,this._count=0,this._capacity=0,this.growthFactor=n.growthFactor??2;try{this.capacity=n.capacity??2}catch(e){throw super.dispose(),e}}get raw(){return this._raw}get raws(){return this._raws}get growthFactor(){return this._growthFactor}set growthFactor(e){if(!Number.isSafeInteger(e)||e<2)throw RangeError(`growthFactor must be an integer >= 2.`);this._growthFactor=e}get capacity(){return this._capacity}set capacity(e){if(this.assertActive(),!Number.isSafeInteger(e)||e<1||e<this._count)throw RangeError(`Invalid capacity.`);if(!(e<=this._capacity)){if(e>24403223)throw RangeError(`CPU array capacity exceeds 4 GiB.`);let t=new Float32Array(e*12),n=new Float32Array(e*44);t.set(this._matrixData.subarray(0,this._count*12)),n.set(this._styleData.subarray(0,this._count*44)),this._matrixData=t,this._styleData=n,this._capacity=e,this._matrixVersion++,this._styleVersion++,this.updateVersion()}}get textures(){return this.updateTextureLayers(),this._textures}push(e={}){this.assertActive();let t=this.resolve(e);this.ensureCapacity(this._count+1),this.ensureWorldMatrix();let n=this._count,r;r=this._raw?new re(n,t):void 0;let i=r?.id??p();return this._count++,this._ids.push(i),r!==void 0&&(this._raws.add(r),r.add(this)),this.writeMatrix(n,t),this.writeStyle(n,t.style,t.enabled),this.setSources(n,t.style),this._matrixVersion++,this._styleVersion++,this.updateVersion(),i}updateAt(e,t){if(this.assertActive(),!Number.isSafeInteger(e)||e<0||e>=this._count)throw RangeError(`Invalid slot index.`);let n=this.resolve(t),r=this._raws.map.get(this._ids[e]);r!==void 0&&(r.position=n.position,r.rotation=n.rotation,r.scale=n.scale,r.style=n.style,r.enabled=n.enabled),this.ensureWorldMatrix(),this.writeMatrix(e,n),this.writeStyle(e,n.style,n.enabled),this.setSources(e,n.style),this._pendingMatrices.delete(e),this._pendingStyles.delete(e),this._matrixVersion++,this._styleVersion++,this.updateVersion()}onRawChange(e,t){if(!this._disposed&&this._raws.map.get(e.id)===e)t===`matrix`?this._pendingMatrices.add(e.index):t!==`textureData`&&t!==`sampler`&&this._pendingStyles.add(e.index),t===`texture`&&this.setSources(e.index,e.style),this._materialPending=!0;else return}onMathChange(e,t){super.onMathChange(e,t),!this._raw&&t===`worldMatrix`&&(this._matrixPending=!1)}updateInstanceData(){this.assertActive(),this.ensureWorldMatrix(),this._geometryPending&&this.data!==void 0&&this.material?.addGeometryType(this.data.type);let e=!1,t=!1;if(this._raw&&this._matrixPending){for(let e of this._raws.map.values())this.writeMatrix(e.index,e);e=this._count>0}else for(let t of this._pendingMatrices){let n=this._raws.map.get(this._ids[t]);n!==void 0&&(this.writeMatrix(t,n),e=!0)}this.updateTextureLayers();for(let e of this._pendingStyles){let n=this._raws.map.get(this._ids[e]);n!==void 0&&(this.writeStyle(e,n.style,n.enabled),t=!0)}e&&this._matrixVersion++,t&&this._styleVersion++,this._pendingMatrices.clear(),this._pendingStyles.clear(),this._matrixPending=!1,this._stylePending=!1,this._geometryPending=!1,this._materialPending=!1}clear(){this.assertActive(),this._raws.clear(),this._count=0,this._ids.length=0,this._sources.length=0,this._pendingMatrices.clear(),this._pendingStyles.clear();for(let e of this._textures)e.set([]);for(let e of this._layerIndices)e.clear();this._layersPending=!1,this._matrixVersion++,this._styleVersion++,this.updateVersion(),this.getScene(this)?.updateVersion()}dispose(){if(!this._disposed){this.clear();for(let e of this._textures)e.dispose();super.dispose()}}ensureCapacity(e){let t=this._capacity;for(;t<e;)t=t<1e5?Math.min(t*this._growthFactor,1e5):Math.ceil(e/1e5)*1e5;t!==this._capacity&&(this.capacity=t)}resolve(e){let t={position:e.position??new o,rotation:e.rotation??0,scale:e.scale??new o(1,1),style:e.style??this.material?.style??new E,enabled:e.enabled??!0};if(![t.position.x,t.position.y,t.scale.x,t.scale.y,t.rotation].every(Number.isFinite))throw RangeError(`Transform components must be finite.`);return t}writeMatrix(e,t){let n=Math.cos(t.rotation),r=Math.sin(t.rotation);this._local.set([n*t.scale.x,r*t.scale.x,0,-r*t.scale.y,n*t.scale.y,0,t.position.x,t.position.y,1]),this._world.mul(this.worldMatrix,this._local),this._matrixData.set(this._world.GPUData,e*12)}writeStyle(e,t,n){let r=e*44;w(t,this._styleData,r),n||this._styleData.fill(0,r+36,r+40),this.writeLayers(e)}setSources(e,t){let n=this._sources.at(e),r=[t.solid.texture,t.edge.texture,t.points.texture];if(n===void 0||!r.every((e,t)=>e===n?.[t]))this._sources[e]=r,this._layersPending=!0,this.getScene(this)?.updateVersion();else return}updateTextureLayers(){if(this._layersPending){for(let e=0;e<3;e++){let t=this._layerIndices[e],n=[];t.clear();for(let r of this._sources){let i=r[e];t.has(i)||(t.set(i,n.length),n.push(i))}this._textures[e].set(n)}for(let e=0;e<this._count;e++)this.writeLayers(e);this._styleVersion++,this._layersPending=!1}else return}writeLayers(e){for(let t=0;t<3;t++)this._styleData[e*44+40+t]=this._layerIndices[t].get(this._sources[e]?.[t])??0}assertActive(){if(this._disposed)throw Error(`Disposed IMesh cannot be reused.`)}},ae=e=>{let t=e.capacity??2,n=e.growthFactor??2;if(!Number.isSafeInteger(t)||t<1||t>24403223)throw RangeError(`Invalid initial capacity.`);if(!Number.isSafeInteger(n)||n<2)throw RangeError(`growthFactor must be an integer >= 2.`)},oe=class{id=p();_version=0;_key=``;_pipelineKeys=new Map;_style;_disposed=!1;_subscribers=new Set;_transparent=!1;_depthTest=!1;_depthWrite=!1;_cullMode=`back`;_geometryTypes=new Set;_shaders={};_values;_customShaderKey=``;constructor(e=new E){this._style=e,e.add(this)}get style(){return this._style}set style(e){if(this._disposed)throw Error(`Disposed material cannot be reused.`);if(this._style!==e)this._style.delete(this),this._style=e,e.add(this),this.updateVersion();else return}onStyleChange(e){if(!this._disposed&&e.source===this._style){let t;t=e.field===`texture`?`texture`:e.field===`textureData`?`textureData`:e.field===`addressModeU`||e.field===`addressModeV`?`sampler`:`style`,this.updateVersion(t)}else return}dispose(){this._style.delete(this),this._subscribers.clear(),this._disposed=!0}add(e){if(this._disposed)throw Error(`Disposed material cannot be reused.`);this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}get version(){return this._version}get key(){return this._key}get values(){return this._values}setCustomShaderKey(e){this._customShaderKey!==e&&(this._customShaderKey=e,this.updateVersion(`pipeline`))}getShaderSource(e){return e===`Rect2D`?{vertex:this.rectVertexShader,fragment:this.rectFragmentShader}:e===`NGon2D`?{vertex:this.ngonVertexShader,fragment:this.ngonFragmentShader}:e===`Poly2D`||e===`Text`||e===`Base2D`?{vertex:this.polyVertexShader,fragment:this.polyFragmentShader}:{vertex:void 0,fragment:void 0}}updateVersion(e=`all`){let t=this._key;this._version++,this.updateKey();let n=Object.freeze({source:this,style:e===`all`||e===`style`,resources:e===`all`||e===`texture`||t!==this._key});for(let e of[...this._subscribers])e.onMaterialChange(n)}get transparent(){return this._transparent}set transparent(e){if(this._transparent!==e)this._transparent=e,this.updateVersion(`pipeline`);else return}get depthTest(){return this._depthTest}set depthTest(e){if(this._depthTest!==e)this._depthTest=e,this.updateVersion(`pipeline`);else return}get depthWrite(){return this._depthWrite}set depthWrite(e){if(this._depthWrite!==e)this._depthWrite=e,this.updateVersion(`pipeline`);else return}get cullMode(){return this._cullMode}set cullMode(e){if(this._cullMode!==e)this._cullMode=e,this.updateVersion(`pipeline`);else return}addGeometryType(e){let t;if(t=e===`Rect2D`?`rect`:e===`Poly2D`||e===`Text`?`poly`:e===`NGon2D`?`ngon`:e,!this._geometryTypes.has(t))this._geometryTypes.add(t),this.updateVersion(`pipeline`);else return}getPipelineKey(e){let t=this._pipelineKeys.get(e);if(t===void 0){let n=e;e===`Rect2D`?n=`rect`:e===`Poly2D`||e===`Text`||e===`Base2D`?n=`poly`:e===`NGon2D`&&(n=`ngon`),t=this.key+`_`+n,this._pipelineKeys.set(e,t)}return t}set rectVertexShader(e){if(this._shaders.rectVertexShader!==e)this._shaders.rectVertexShader=e,this.updateVersion(`pipeline`);else return}get rectVertexShader(){return this._shaders.rectVertexShader}set rectFragmentShader(e){if(this._shaders.rectFragmentShader!==e)this._shaders.rectFragmentShader=e,this.updateVersion(`pipeline`);else return}get rectFragmentShader(){return this._shaders.rectFragmentShader}get polyVertexShader(){return this._shaders.polyVertexShader}set polyVertexShader(e){if(this._shaders.polyVertexShader!==e)this._shaders.polyVertexShader=e,this.updateVersion(`pipeline`);else return}get polyFragmentShader(){return this._shaders.polyFragmentShader}set polyFragmentShader(e){if(this._shaders.polyFragmentShader!==e)this._shaders.polyFragmentShader=e,this.updateVersion(`pipeline`);else return}get ngonVertexShader(){return this._shaders.ngonVertexShader}set ngonVertexShader(e){if(this._shaders.ngonVertexShader!==e)this._shaders.ngonVertexShader=e,this.updateVersion(`pipeline`);else return}get ngonFragmentShader(){return this._shaders.ngonFragmentShader}set ngonFragmentShader(e){if(this._shaders.ngonFragmentShader!==e)this._shaders.ngonFragmentShader=e,this.updateVersion(`pipeline`);else return}updateKey(){let e=JSON.stringify([this.type,this._transparent,this._cullMode,this._depthTest,this._depthWrite,this._style.key,this._values?.schemaKey,this._customShaderKey,this._shaders.rectVertexShader,this._shaders.rectFragmentShader,this._shaders.polyVertexShader,this._shaders.polyFragmentShader,this._shaders.ngonVertexShader,this._shaders.ngonFragmentShader]);e!==this._key&&(this._key=e,this._pipelineKeys.clear())}},se=`
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
    // opacity、pixelAligned、补位、补位。
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
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
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
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>, materialUniform: MaterialUniform) -> VertexOutput {
    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    // Camera 视口已使用乘过 DPR 的画布尺寸，borderWidth 直接按画布像素处理。
    // 除以 Zoom 后，边框在相机缩放时仍保持固定的屏幕像素宽度。
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
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
    let worldPosition = modelMatrix * localPosition;
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
    let safeNormalLength = max(normalLength, 0.000001);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let modelMatrix = modelMatrices[resolvedIndex];
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix, materialUniform);
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
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let pixelAligned = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        output.uv.x *= mix(safeZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,ce=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
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

    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
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
`,M=`// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
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
    // opacity、pixelAligned、补位、补位。
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
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
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
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>) -> VertexOutput {
    let localPosition = vec3f(input.position, 1.0);
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
    let safeNormalLength = max(normalLength, 0.000001);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let modelMatrix = modelMatrices[resolvedIndex];
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix);
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
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let pixelAligned = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        output.uv.x *= mix(safeZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,N=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
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
`,P=`// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
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
    // opacity、pixelAligned、补位、补位。
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
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
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
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>) -> VertexOutput {
    let localPosition = vec3f(input.position, 1.0);
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
    let safeNormalLength = max(normalLength, 0.000001);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let modelMatrix = modelMatrices[resolvedIndex];
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix);
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
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let pixelAligned = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        output.uv.x *= mix(safeZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
`,F=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
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
`,I=class{id;type=`Texture`;_version=0;_subscribers=new Set;_url=null;_source=null;_loaded=!1;_width=0;_height=0;constructor(){this.id=p()}get version(){return this._version}get url(){return this._url}set url(e){if(this._url!==e)this._url=e,this.updateVersion();else return}get source(){return this._source}set source(e){this._source!==e&&(e===null?this.clearSource():this.setSource(e,this._url))}get loaded(){return this._loaded}set loaded(e){if(this._loaded!==e)this._loaded=e,this.updateVersion();else return}get width(){return this._width}set width(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture width must be a non-negative integer.`);if(this._width!==e)this._width=e,this.updateVersion();else return}get height(){return this._height}set height(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture height must be a non-negative integer.`);if(this._height!==e)this._height=e,this.updateVersion();else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}updateVersion(){this._version++;for(let e of[...this._subscribers])e.onTextureChange(this)}setSource(e,t=null){return this._url=t,this._source=e,this._loaded=!0,this._width=R(e),this._height=z(e),this.updateVersion(),this}clearSource(){return this._url=null,this._source=null,this._loaded=!1,this._width=0,this._height=0,this.updateVersion(),this}async load(e){let t=await L(e);return this.setSource(t,e)}},L=e=>new Promise((t,n)=>{let r=new Image;r.onload=()=>{t(r)},r.onerror=()=>{n(Error(`Texture load failed: ${e}`))},r.src=e}),R=e=>`naturalWidth`in e?e.naturalWidth:e.width,z=e=>`naturalHeight`in e?e.naturalHeight:e.height,B=16777216,V=class{pipeline;constructor(e){this.pipeline=e}prepare(e){let t=this.pipeline.device;if(t!==void 0){let n=0;for(let t of e.drawList)n+=t.count;if(!Number.isSafeInteger(n)||n>=B)throw RangeError(`Scene exceeds 16777215 distinct depth levels.`);let r=0;for(let n of e.drawList){let e=n.material,i=n.count;if(i>0&&e!==void 0){let a=Number(e.depthTest&&e.depthWrite&&!e.transparent),o=this.pipeline.buffers.meshDepth.get(n.id);if(o===void 0){let e=new Uint32Array([r,i,a,0]),s=t.createBuffer({label:`Mesh `+String(n.id)+` Depth Parameters`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(s,0,e),o={meshId:n.id,buffer:s,data:e},this.pipeline.buffers.meshDepth.set(n.id,o)}else(o.data[0]!==r||o.data[1]!==i||o.data[2]!==a)&&(o.data.set([r,i,a,0]),t.queue.writeBuffer(o.buffer,0,o.data))}r+=i}}else return}ensureTexture(e,t){let n=this.pipeline.device;if(n!==void 0){let r=this.pipeline.depthTexture;if(r?.width!==e||r.height!==t){let i=n.createTexture({label:`Render Depth Texture`,size:{width:e,height:t},format:`depth32float`,usage:GPUTextureUsage.RENDER_ATTACHMENT}),a={texture:i,view:i.createView(),width:e,height:t};return r?.texture.destroy(),this.pipeline.depthTexture=a,a}return r}}},H=class{reported=new Set;validateCamera(e){(!Number.isFinite(e.width)||e.width<=0)&&this.error(`CAMERA_WIDTH`,e.id,`Camera width 必须是大于 0 的有限数。`,e),(!Number.isFinite(e.height)||e.height<=0)&&this.error(`CAMERA_HEIGHT`,e.id,`Camera height 必须是大于 0 的有限数。`,e),(!Number.isFinite(e.zoom)||e.zoom<=0)&&this.error(`CAMERA_ZOOM`,e.id,`Camera zoom 必须是大于 0 的有限数。`,e)}validateMaterial(e){e.transparent&&e.depthWrite&&this.warn(`TRANSPARENT_DEPTH_WRITE`,e.id,`透明混合同时写入深度可能挡住后方透明片元；通常使用 depthTest=true、depthWrite=false。`,e),!e.depthTest&&e.depthWrite&&this.warn(`DEPTH_WRITE_WITHOUT_TEST`,e.id,`已关闭深度测试但仍写深度；它不会检查场景遮挡，通常 UI 两项都关闭。`,e);let{solid:t,wireframe:n,edge:r,points:i}=e.style;for(let a of[t,n,r,i])(!Number.isFinite(a.opacity)||a.opacity<0||a.opacity>1)&&this.error(`STYLE_OPACITY_`+a.area,e.id,`分区透明度必须位于 0 到 1。`,e);for(let n of[t,r,i])n.texture!==void 0&&!n.enabled&&this.warn(`UNUSED_TEXTURE_`+n.area,e.id,`分区已设置贴图，但 enabled 尚未开启。`,e);i.enabled&&!i.vertices&&!i.midpoints&&this.warn(`EMPTY_POINT_SELECTION`,e.id,`关键点已开启，但未选择顶点或边中点；不会生成点型。`,e)}validateGeometry(e){if(e.geometry!==void 0){if(e.normal===void 0||e.uv===void 0||e.index===void 0||e.vertexType===void 0||e.position===void 0||e.miterScale===void 0)this.error(`GEOMETRY_MISSING`,e.id,`合并三角面缺少 normal、uv、index、vertexType、position 或 miterScale。`,e);else{let t=e.geometry.length/2;this.validatePart(e.id,`geometry`,{geometry:e.geometry,normal:e.normal,uv:e.uv,index:e.index,miterScale:e.miterScale},3,!0,e),(e.vertexType.length!==t||e.vertexType.some(e=>e!==0&&e!==.5&&e!==1))&&this.error(`VERTEX_TYPE`,e.id,`vertexType 必须逐顶点对应，且只能为 0、0.5、1。`,e),(e.position.length!==e.geometry.length||U(e.position)!==-1)&&this.error(`GEOMETRY_POSITION`,e.id,`position 必须与 geometry 等长且全部为有限数。`,e);for(let t=0;t<e.index.length;t+=3){let n=e.vertexType[e.index[t]];if(e.vertexType[e.index[t+1]]!==n||e.vertexType[e.index[t+2]]!==n){this.error(`TRIANGLE_VERTEX_TYPE`,e.id,`一个三角面的三个顶点必须属于同一 vertexType。`,e);break}}}}e.linePoints!==void 0&&this.validatePart(e.id,`linePoints`,e.linePoints,2,!1,e),e.style.wireframe.enabled&&e.linePoints===void 0&&this.error(`WIREFRAME_DATA`,e.id,`Geometry wireframe 已开启，但没有生成 linePoints。`,e),e.style.edge.uvRepeat!==1&&!e.style.wireframe.enabled&&!e.style.edge.enabled&&this.warn(`UNUSED_UV_REPEAT`,e.id,`uvRepeat 只作用于边框，当前值不会被使用。`,e),(e.uniformData.length!==4||U(e.uniformData)!==-1)&&this.error(`GEOMETRY_UNIFORM`,e.id,`Geometry uniformData 必须包含 4 个有限数。`,e)}validateMesh(e){let t=e.data,n=e.material;if(t!==void 0&&n!==void 0){if(t.style.solid.enabled&&![`Rect2D`,`Poly2D`,`NGon2D`,`Text`,`Base2D`].includes(t.type)&&this.error(`UNSUPPORTED_SOLID_TYPE`,e.id,`未提供该类型的实体面 Shader。`,e),e instanceof j){t.style.wireframe.enabled&&e.count>1&&this.warn(`IMESH_NATIVE_LINES`,e.id,`原生 line-list 使用逐实例顺序回退；只用三角面时才合并为一次绘制。`,e);for(let r of e.raws.map.values()){[`Poly2D`,`NGon2D`,`Text`].includes(t.type)&&r.style.solid.borderWidth>0&&this.warn(`UNSUPPORTED_SDF_BORDER`,e.id,`Poly2D/NGon2D/Text 不使用矩形 SDF 边框，请启用 edge 分区。`,e),t.type===`Poly2D`&&(r.style.join.type!==t.style.join.type||r.style.join.seg!==t.style.join.seg)&&this.warn(`IMESH_JOIN_TEMPLATE`,e.id,`连接类型和精度由 Geometry.style.join 决定，Raw 不生成独立拓扑。`,e);for(let n of[`solid`,`wireframe`,`edge`,`points`])r.style[n].enabled&&!t.style[n].enabled&&this.warn(`IMESH_MISSING_`+n,e.id,`实例启用了模板未生成的 `+n+` 分区；请先配置 Geometry.style。`,e);for(let t of[`solid`,`edge`,`points`])(r.style[t].addressModeU!==n.style[t].addressModeU||r.style[t].addressModeV!==n.style[t].addressModeV)&&this.warn(`IMESH_SAMPLER_`+t,e.id,`一次绘制共用 Material.style 的采样器，Raw.style 的寻址方式不单独生效。`,e);r.style.edge.enabled&&(r.style.edge.width!==t.style.edge.width||r.style.edge.uvRepeat!==t.style.edge.uvRepeat)&&this.warn(`IMESH_EDGE_TEMPLATE`,e.id,`实例实体边框宽度和 UV Repeat 由共用 Geometry.style 生成，Raw 不重建独立几何。`,e),r.style.points.enabled&&(r.style.points.radius!==t.style.points.radius||r.style.points.segments!==t.style.points.segments||r.style.points.vertices!==t.style.points.vertices||r.style.points.midpoints!==t.style.points.midpoints||r.style.points.minPointsLength!==t.style.points.minPointsLength||r.style.points.minEdgePointsLength!==t.style.points.minEdgePointsLength)&&this.warn(`IMESH_POINTS_TEMPLATE`,e.id,`关键点半径、段数、选择规则由共用 Geometry.style 决定。`,e)}return}[`Poly2D`,`NGon2D`,`Text`].includes(t.type)&&n.style.solid.borderWidth>0&&this.warn(`UNSUPPORTED_SDF_BORDER`,e.id,`Poly2D/NGon2D/Text 不使用矩形 SDF 边框，请启用 edge 分区。`,e),t.type===`Poly2D`&&(t.style.join.type!==n.style.join.type||t.style.join.seg!==n.style.join.seg)&&this.warn(`POLY_JOIN_STYLE`,e.id,`连接拓扑由 Geometry.style.join 生成，建议几何与材质共享 Style。`,e);for(let r of[`solid`,`wireframe`,`edge`,`points`])t.style[r].enabled!==n.style[r].enabled&&this.warn(`STYLE_ENABLED_`+r,e.id,`几何与材质的分区开关不同；建议引用同一个 Style。`,e);t.style!==n.style&&t.style.edge.enabled&&(t.style.edge.width!==n.style.edge.width||t.style.edge.borderAlign!==n.style.edge.borderAlign)&&this.warn(`STYLE_EDGE_PARAMETERS`,e.id,`几何与材质的实体边框参数不同；几何宽度参与生成，建议共享 Style。`,e)}else{this.error(`MESH_RESOURCE`,e.id,`Mesh 缺少 Geometry 或 Material。`,e);return}}validatePart(e,t,n,r,i,a){let o=n.geometry.length/2;n.geometry.length%2!=0&&this.error(`GEOMETRY_VERTEX_`+t,e,t+` 顶点数组长度必须是 2 的倍数。`,a),n.normal.length!==n.geometry.length&&this.error(`GEOMETRY_NORMAL_`+t,e,t+` 法线数量必须与顶点数量一致。`,a),n.uv.length!==n.geometry.length&&this.error(`GEOMETRY_UV_`+t,e,t+` UV 数量必须与顶点数量一致。`,a),n.index.length%r!==0&&this.error(`GEOMETRY_INDEX_COUNT_`+t,e,t+` 索引数量与图元类型不匹配。`,a),(n.geometry.length===0||n.index.length===0)&&this.warn(`EMPTY_GEOMETRY_`+t,e,t+` 不包含可绘制图元。`,a),(U(n.geometry)!==-1||U(n.normal)!==-1||U(n.uv)!==-1)&&this.error(`GEOMETRY_NUMBER_`+t,e,t+` 包含 NaN 或 Infinity。`,a);for(let r of n.index)if(r>=o){this.error(`GEOMETRY_INDEX_RANGE_`+t,e,t+` 存在越界索引 `+String(r)+`。`,a);break}i&&n.miterScale===void 0?this.error(`GEOMETRY_MITER_MISSING_`+t,e,t+` 缺少 miterScale。`,a):n.miterScale!==void 0&&(n.miterScale.length!==o&&this.error(`GEOMETRY_MITER_COUNT_`+t,e,t+` miterScale 数量必须与顶点数量一致。`,a),U(n.miterScale)!==-1&&this.error(`GEOMETRY_MITER_NUMBER_`+t,e,t+` miterScale 包含 NaN 或 Infinity。`,a))}warn(e,t,n,r){let i=`warn_`+e+`_`+String(t);if(!this.reported.has(i))this.reported.add(i),console.warn(`[BPLineJS:`+e+`] `+n,r);else return}error(e,t,n,r){let i=`error_`+e+`_`+String(t);if(!this.reported.has(i))this.reported.add(i),console.error(`[BPLineJS:`+e+`] `+n,r);else return}},U=e=>{for(let t=0;t<e.length;t+=1)if(Number.isFinite(e[t])===!1)return t;return-1},W=class{pipeline;depthManager;developmentValidator;_cameraSnapshot;_validatedMaterials=new WeakMap;constructor(e){this.pipeline=e,this.depthManager=new V(e),this.developmentValidator=new H}draw(e,t,n,r){let i=this.pipeline.device;if(i!==void 0)r===`development`&&this.developmentValidator.validateCamera(t),this.drawCameraBuffers(i,t,n),this.drawGeometryBuffers(i,e,r),this.prepareMaterials(e,r),this.drawCustomValueBuffers(i,e),this.drawMeshBuffers(i,e,r),this.depthManager.prepare(e);else return}prepareMaterials(e,t){if(t===`development`)for(let t of e.materialList)if(this._validatedMaterials.get(t)!==t.version)this.developmentValidator.validateMaterial(t),this._validatedMaterials.set(t,t.version);else continue;else return}drawCustomValueBuffers(e,t){for(let n of t.materialList){let t=n.values;if(t===void 0)continue;let r=this.pipeline.customValues.get(n.id);r===void 0&&(r={buffers:new Map},this.pipeline.customValues.set(n.id,r));let i=new Set;for(let a of t.entries){if(a.kind===`texture`)continue;i.add(a.name);let c=r.buffers.get(a.name),l=0;(a.value instanceof o||a.value instanceof s)&&(l=a.value.version);let u=4;if(a.value instanceof o&&(u=8),a.value instanceof s&&(u=48),a.value instanceof Float32Array&&(u=a.value.byteLength),c===void 0||c.byteLength!==u){c?.buffer.destroy();let i=GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST;a.kind===`array<f32>`&&(i=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);let o=t.getBufferData(a),s=this.createBuffer(e,`Material `+String(n.id)+` Value `+a.name,o,i);r.buffers.set(a.name,{buffer:s,byteLength:u,value:a.value,valueVersion:l,storeVersion:t.version}),r.bindGroup=void 0}else if(c.value!==a.value||c.valueVersion!==l||c.storeVersion!==t.version){let n=t.getBufferData(a);e.queue.writeBuffer(c.buffer,0,n),c.value=a.value,c.valueVersion=l,c.storeVersion=t.version}}for(let[e,t]of r.buffers)i.has(e)||(t.buffer.destroy(),r.buffers.delete(e),r.bindGroup=void 0)}}createBuffer(e,t,n,r){let i=e.createBuffer({label:t,size:n.byteLength,usage:r});return e.queue.writeBuffer(i,0,n),i}drawCameraBuffers(e,t,n){t.ensureCameraMatrix();let r=this.pipeline.buffers.cameraUniform,i=this._cameraSnapshot,a=i?.camera!==t,o=a||i?.view!==t.viewMatrix||i.viewVersion!==t.viewMatrix.version,s=a||i?.projection!==t.orthogonalMatrix||i.projectionVersion!==t.orthogonalMatrix.version,c=a||i?.zoom!==t.zoom||i.dpr!==n,l=r.length===0;l?r.push(this.createBuffer(e,`Camera View Matrix Buffer`,t.viewMatrix.GPUData,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),this.createBuffer(e,`Camera Orthogonal Matrix Buffer`,t.orthogonalMatrix.GPUData,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),this.createBuffer(e,`Render Camera Parameters Buffer`,new Float32Array([t.zoom,n,0,0]),GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST)):(o&&e.queue.writeBuffer(r[0],0,t.viewMatrix.GPUData),s&&e.queue.writeBuffer(r[1],0,t.orthogonalMatrix.GPUData),c&&e.queue.writeBuffer(r[2],0,new Float32Array([t.zoom,n,0,0]))),(l||o||s||c)&&(this._cameraSnapshot={camera:t,view:t.viewMatrix,viewVersion:t.viewMatrix.version,projection:t.orthogonalMatrix,projectionVersion:t.orthogonalMatrix.version,zoom:t.zoom,dpr:n})}drawMeshBuffers(e,t,n){for(let r of t.drawList){n===`development`&&(r.geometryPending||r.materialPending||!this.pipeline.buffers.meshStyle.has(r.id))&&this.developmentValidator.validateMesh(r);let t=r.material;if(t!==void 0){if(r.updateInstanceData(),r.count!==0){let n=Math.min(e.limits.maxBufferSize,e.limits.maxStorageBufferBindingSize);if(r.matrixData.byteLength>n||r.styleData.byteLength>n)throw RangeError(`Mesh `+String(r.id)+` capacity exceeds this GPUDevice storage buffer limit: `+String(n)+` bytes.`);let i=this.pipeline.buffers.meshMatrix,a=i.get(r.id);a!==void 0&&a.capacity!==r.capacity&&(a.buffer.destroy(),i.delete(r.id),a=void 0),a===void 0?(a={meshId:r.id,capacity:r.capacity,version:r.matrixVersion,buffer:this.createBuffer(e,`Mesh `+String(r.id)+` Instance Matrices`,r.matrixData,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)},i.set(r.id,a)):a.version!==r.matrixVersion&&(e.queue.writeBuffer(a.buffer,0,r.matrixData,0,r.count*12),a.version=r.matrixVersion);let o=this.pipeline.buffers.meshStyle.get(r.id);o!==void 0&&o.capacity!==r.capacity&&(o.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(r.id),o=void 0),o===void 0?this.pipeline.buffers.meshStyle.set(r.id,{meshId:r.id,materialId:t.id,capacity:r.capacity,version:r.styleVersion,buffer:this.createBuffer(e,`Mesh `+String(r.id)+` Instance Styles`,r.styleData,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST)}):(o.materialId=t.id,o.version!==r.styleVersion&&(e.queue.writeBuffer(o.buffer,0,r.styleData,0,r.count*44),o.version=r.styleVersion))}else continue}else continue}}drawGeometryBuffers(e,t,n){for(let r of t.geometryList){r.ensureGeometry();let t=this.pipeline.buffers.geometry.get(r.id);if(t?.version!==r.version){if(n===`development`&&this.developmentValidator.validateGeometry(r),r.type===`Base2D`&&t!==void 0&&this.updateBase2DBuffers(e,r,t))continue;t!==void 0&&(this.destroyGeometryBuffer(t),this.pipeline.buffers.geometry.delete(r.id));let i=r.geometry,a=r.normal,o=r.uv,s=r.index,c=r.vertexType,l=r.position,u=r.miterScale,d;d=i!==void 0&&a!==void 0&&o!==void 0&&s!==void 0&&c!==void 0&&l!==void 0&&u!==void 0&&s.length>0?this.createGeometryBufferPart(e,`Geometry `+String(r.id)+` Merged`,{geometry:i,normal:a,uv:o,index:s,vertexType:c,position:l,miterScale:u}):void 0;let f;if(f=r.linePoints!==void 0&&r.linePoints.index.length>0?this.createGeometryBufferPart(e,`Geometry `+String(r.id)+` Line Points`,r.linePoints):void 0,d!==void 0||f!==void 0){let t=this.createBuffer(e,`Geometry `+String(r.id)+` Parameters Buffer`,r.uniformData,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);this.pipeline.buffers.geometry.set(r.id,{geometryId:r.id,version:r.version,uniform:t,geometry:d,linePoints:f})}else continue}else continue}}updateBase2DBuffers(e,t,n){let r=n.geometry,i=t.geometry,a=t.normal,o=t.uv,s=t.index,c=t.vertexType,l=t.position,u=t.miterScale;if(r===void 0||t.linePoints!==void 0||n.linePoints!==void 0||i===void 0||a===void 0||o===void 0||s===void 0||c===void 0||l===void 0||u===void 0||r.vertexType===void 0||r.position===void 0||r.miterScale===void 0)return!1;let d=`uint16`;s instanceof Uint32Array&&(d=`uint32`);let f=Math.ceil(s.byteLength/4)*4;if(r.vertex.size!==i.byteLength||r.normal.size!==a.byteLength||r.uv.size!==o.byteLength||r.index.size!==f||r.vertexType.size!==c.byteLength||r.position.size!==l.byteLength||r.miterScale.size!==u.byteLength||r.indexFormat!==d)return!1;let p=new Uint8Array(f);return p.set(new Uint8Array(s.buffer,s.byteOffset,s.byteLength)),e.queue.writeBuffer(r.vertex,0,new Float32Array(i)),e.queue.writeBuffer(r.normal,0,new Float32Array(a)),e.queue.writeBuffer(r.uv,0,new Float32Array(o)),e.queue.writeBuffer(r.index,0,p),e.queue.writeBuffer(r.vertexType,0,new Float32Array(c)),e.queue.writeBuffer(r.position,0,new Float32Array(l)),e.queue.writeBuffer(r.miterScale,0,new Float32Array(u)),e.queue.writeBuffer(n.uniform,0,new Float32Array(t.uniformData)),r.pointsFirstIndex=this.getPointsFirstIndex({geometry:i,normal:a,uv:o,index:s,vertexType:c,position:l,miterScale:u}),n.version=t.version,!0}createGeometryBufferPart(e,t,n){let r=new Float32Array(n.geometry),i=new Float32Array(n.normal),a=new Float32Array(n.uv),o;o=n.index instanceof Uint32Array?new Uint32Array(n.index):new Uint16Array(n.index);let s;s=n.position===void 0?void 0:new Float32Array(n.position);let c;c=n.miterScale===void 0?void 0:new Float32Array(n.miterScale);let l=Math.ceil(o.byteLength/4)*4,u=new Uint8Array(l);u.set(new Uint8Array(o.buffer));let d;n.vertexType!==void 0&&(d=this.createBuffer(e,t+` Vertex Type Buffer`,new Float32Array(n.vertexType),GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST));let f=`uint16`;n.index instanceof Uint32Array&&(f=`uint32`);let p;s!==void 0&&(p=this.createBuffer(e,t+` Point Centers Buffer`,s,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST));let m;return c!==void 0&&(m=this.createBuffer(e,t+` Miter Scale Buffer`,c,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST)),{vertex:this.createBuffer(e,t+` Vertex Buffer`,r,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),normal:this.createBuffer(e,t+` Normal Buffer`,i,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),uv:this.createBuffer(e,t+` UV Buffer`,a,GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST),index:this.createBuffer(e,t+` Index Buffer`,u,GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST),vertexType:d,pointsFirstIndex:this.getPointsFirstIndex(n),indexFormat:f,position:p,miterScale:m}}getPointsFirstIndex(e){if(e.vertexType!==void 0){for(let t=0;t<e.index.length;t+=1)if(e.vertexType[e.index[t]]===1)return t}return e.index.length}destroyGeometryBuffer(e){for(let t of this.pipeline.buffers.meshMatrix.values())t.bindGroup?.geometry===e.uniform&&(t.bindGroup=void 0);let t=e=>{e?.vertex.destroy(),e?.normal.destroy(),e?.uv.destroy(),e?.index.destroy(),e?.miterScale?.destroy(),e?.position?.destroy(),e?.vertexType?.destroy()};t(e.geometry),t(e.linePoints),e.uniform.destroy()}},G=class{pipeline;constructor(e){this.pipeline=e}destroyMesh(e){let t;t=typeof e==`number`?e:e.id;let n=this.pipeline.buffers.meshMatrix.get(t),r=!1;n!==void 0&&(n.buffer.destroy(),this.pipeline.buffers.meshMatrix.delete(t),r=!0);let i=this.pipeline.buffers.meshDepth.get(t);i!==void 0&&(i.buffer.destroy(),this.pipeline.buffers.meshDepth.delete(t),r=!0);let a=this.pipeline.buffers.meshStyle.get(t);if(a!==void 0&&(a.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(t),r=!0),typeof e!=`number`){for(let t of e.textures)t!==void 0&&(r=this.destroyTexture(t)||r);e.data!==void 0&&(r=this.destroyGeometry(e.data)||r),e.material!==void 0&&(r=this.destroyMaterial(e.material)||r)}return r}destroyTexture(e){let t;t=typeof e==`number`?e:e.id;let n=!1;for(let[e,r]of this.pipeline.textures)if(e===t||r.sourceIds?.has(t))this.releaseTextureBindings(r.view),r.texture.destroy(),this.pipeline.textures.delete(e),n=!0;else continue;return n}destroyMaterial(e){let t;t=typeof e==`number`?e:e.id;let n=!1;for(let[e,r]of this.pipeline.buffers.meshStyle)if(r.materialId===t)r.buffer.destroy(),this.pipeline.buffers.meshStyle.delete(e),n=!0;else continue;let r=this.pipeline.customValues.get(t);if(r!==void 0){for(let e of r.buffers.values())e.buffer.destroy();this.pipeline.customValues.delete(t),n=!0}if(typeof e!=`number`){let t=new Set;e.style.solid.texture!==void 0&&(t.add(e.style.solid.texture.id),n=this.destroyTexture(e.style.solid.texture)||n),e.style.edge.texture!==void 0&&!t.has(e.style.edge.texture.id)&&(t.add(e.style.edge.texture.id),n=this.destroyTexture(e.style.edge.texture)||n),e.style.points.texture!==void 0&&!t.has(e.style.points.texture.id)&&(t.add(e.style.points.texture.id),n=this.destroyTexture(e.style.points.texture)||n);for(let r of e.values?.textures??[])t.has(r.id)||(t.add(r.id),n=this.destroyTexture(r)||n)}return n}destroyGeometry(e){let t;t=typeof e==`number`?e:e.id;let n=this.pipeline.buffers.geometry.get(t);return n!==void 0&&(this.destroyGeometryBuffer(n),this.pipeline.buffers.geometry.delete(t),!0)}trim(e){e.ensureLists();let t={version:e.version,meshIds:new Set,geometryIds:new Set,materialIds:new Set,textureIds:new Set,pipelineKeys:new Set};for(let n of e.drawList)t.meshIds.add(n.id);for(let n of e.geometryList)t.geometryIds.add(n.id);for(let n of e.materialList)t.materialIds.add(n.id);for(let n of e.drawList)n.data!==void 0&&n.material!==void 0&&t.pipelineKeys.add(n.material.getPipelineKey(n.data.type));for(let n of e.textureList)t.textureIds.add(n.id);this.pipeline.sceneResources.set(e.id,t);let n={version:0,meshIds:new Set,geometryIds:new Set,materialIds:new Set,textureIds:new Set,pipelineKeys:new Set};for(let e of this.pipeline.sceneResources.values()){for(let t of e.meshIds)n.meshIds.add(t);for(let t of e.geometryIds)n.geometryIds.add(t);for(let t of e.materialIds)n.materialIds.add(t);for(let t of e.textureIds)n.textureIds.add(t);for(let t of e.pipelineKeys)n.pipelineKeys.add(t)}for(let e of this.pipeline.buffers.meshMatrix.values())n.meshIds.has(e.meshId)||this.destroyMesh(e.meshId);for(let e of this.pipeline.buffers.meshDepth.keys())n.meshIds.has(e)||this.destroyMesh(e);for(let e of this.pipeline.buffers.geometry.keys())n.geometryIds.has(e)||this.destroyGeometry(e);for(let e of this.pipeline.buffers.meshStyle.keys())n.meshIds.has(e)||this.destroyMesh(e);for(let e of this.pipeline.customValues.keys())n.materialIds.has(e)||this.destroyMaterial(e);for(let[e,t]of this.pipeline.textures)n.textureIds.has(e)||(this.releaseTextureBindings(t.view),t.texture.destroy(),this.pipeline.textures.delete(e));for(let e of this.pipeline.pipelineTemplates.keys())n.pipelineKeys.has(e)||this.pipeline.pipelineTemplates.delete(e)}destroyAll(){let e=this.pipeline.device;this.pipeline.context?.unconfigure();for(let e of this.pipeline.buffers.meshMatrix.values())e.buffer.destroy();this.pipeline.buffers.meshMatrix.clear();for(let e of this.pipeline.buffers.meshDepth.values())e.buffer.destroy();this.pipeline.depthTexture?.texture.destroy(),this.pipeline.depthTexture=void 0,this.pipeline.buffers.meshDepth.clear();for(let e of this.pipeline.buffers.geometry.values())this.destroyGeometryBuffer(e);for(let e of this.pipeline.buffers.meshStyle.values())e.buffer.destroy();for(let e of this.pipeline.customValues.values())for(let t of e.buffers.values())t.buffer.destroy();for(let e of this.pipeline.buffers.cameraUniform)e.destroy();for(let e of this.pipeline.textures.values())e.texture.destroy();this.pipeline.fallbackTexture?.texture.destroy(),this.pipeline.buffers.geometry.clear(),this.pipeline.buffers.meshStyle.clear(),this.pipeline.customValues.clear(),this.pipeline.buffers.cameraUniform.length=0,this.pipeline.textures.clear(),this.pipeline.samplers.clear(),this.pipeline.pipelineTemplates.clear(),this.pipeline.sceneResources.clear(),this.pipeline.adapter=void 0,this.pipeline.device=void 0,this.pipeline.context=void 0,this.pipeline.format=void 0,this.pipeline.defaultBindGroupLayout=void 0,this.pipeline.baseMaterialBindGroupLayout=void 0,this.pipeline.fallbackTexture=void 0,e?.destroy()}destroyGeometryBuffer(e){for(let t of this.pipeline.buffers.meshMatrix.values())t.bindGroup?.geometry===e.uniform&&(t.bindGroup=void 0);let t=e=>{e?.vertex.destroy(),e?.normal.destroy(),e?.uv.destroy(),e?.index.destroy(),e?.miterScale?.destroy(),e?.position?.destroy(),e?.vertexType?.destroy()};t(e.geometry),t(e.linePoints),e.uniform.destroy()}releaseTextureBindings(e){for(let t of this.pipeline.buffers.meshStyle.values()){let n=t.bindGroup;(n?.baseView===e||n?.edgeView===e||n?.pointsView===e)&&(t.bindGroup=void 0)}for(let t of this.pipeline.customValues.values())t.resources?.includes(e)&&(t.bindGroup=void 0)}},le=class{pipeline;constructor(e){this.pipeline=e}get(e,t){let n=this.pipeline.device;if(n!==void 0){let r=e+`_`+t,i=this.pipeline.samplers.get(r);if(i===void 0){let i=n.createSampler({label:`Texture Sampler `+r,addressModeU:e,addressModeV:t,magFilter:`linear`,minFilter:`linear`});return this.pipeline.samplers.set(r,i),i}return i}}},ue=class{pipeline;samplerManager;depthManager;constructor(e,t){this.pipeline=e,this.depthManager=new V(e),this.samplerManager=t}prepare(e,t){this.depthManager.ensureTexture(e,t)}draw(e,t,n){let r=this.pipeline.device,i=this.pipeline.context;if(r!==void 0&&i!==void 0){let a=r.createCommandEncoder(),o=i.getCurrentTexture(),s=this.depthManager.ensureTexture(o.width,o.height);if(s!==void 0){let i=o.createView(),c;c=n===`premultiplied`?{r:t.r*t.a,g:t.g*t.a,b:t.b*t.a,a:t.a}:t;let l=a.beginRenderPass({colorAttachments:[{view:i,clearValue:c,loadOp:`clear`,storeOp:`store`}],depthStencilAttachment:{view:s.view,depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`discard`}}),u=this.pipeline.buffers.cameraUniform[0],d=this.pipeline.buffers.cameraUniform[1],f=this.pipeline.buffers.cameraUniform[2];for(let t=e.drawList.length-1;t>=0;t--){let n=e.drawList[t],i=n.material;i?.depthTest&&i.depthWrite&&!i.transparent&&this.drawMesh(r,l,n,u,d,f)}for(let t of e.drawList){let e=t.material;e?.depthTest&&(!e.depthWrite||e.transparent)&&this.drawMesh(r,l,t,u,d,f)}for(let t of e.drawList)t.material!==void 0&&!t.material.depthTest&&this.drawMesh(r,l,t,u,d,f);l.end(),r.queue.submit([a.finish()])}else return}else return}drawMesh(e,t,n,r,i,a){let o=n.data,s=this.pipeline.buffers.meshDepth.get(n.id),c=n.material,l=this.pipeline.buffers.meshMatrix.get(n.id),u;if(u=o===void 0?void 0:this.pipeline.buffers.geometry.get(o.id),s!==void 0&&n.count!==0&&l!==void 0&&u!==void 0&&o!==void 0&&(o.style.solid.enabled||o.style.edge.enabled||o.style.wireframe.enabled||o.style.points.enabled)&&c!==void 0){let d=this.pipeline.pipelineTemplates.get(c.getPipelineKey(o.type)),f=u.geometry;if(d!==void 0){let p=this.createMaterialBindGroup(e,n,c,d);if(p!==void 0){let m=d.defaultBindGroupLayout,h=l.bindGroup;if((h?.layout!==m||h.view!==r||h.projection!==i||h.parameters!==a||h.geometry!==u.uniform||h.depth!==s.buffer)&&(h={layout:m,view:r,projection:i,parameters:a,geometry:u.uniform,depth:s.buffer,group:e.createBindGroup({layout:m,entries:[{binding:0,resource:{buffer:l.buffer}},{binding:1,resource:{buffer:r}},{binding:2,resource:{buffer:i}},{binding:3,resource:{buffer:a}},{binding:4,resource:{buffer:u.uniform}},{binding:5,resource:{buffer:s.buffer}}]})},l.bindGroup=h),t.setBindGroup(0,h.group),t.setBindGroup(1,p),d.customBindGroupLayout!==void 0){let n=this.createCustomBindGroup(e,c,d);if(n===void 0)return;t.setBindGroup(2,n)}let g=n instanceof j,_=o.style.wireframe.enabled&&(g||c.style.wireframe.enabled)&&d.lineRenderPipeline!==void 0&&u.linePoints!==void 0&&o.linePoints!==void 0,v=o.style.solid.enabled&&(g||c.style.solid.enabled)||o.style.edge.enabled&&(g||c.style.edge.enabled)||o.style.points.enabled&&(g||c.style.points.enabled),y=(e,n,r,i)=>{if(v&&n!==0&&f?.vertexType!==void 0&&f.position!==void 0&&f.miterScale!==void 0&&d.renderPipeline!==void 0)t.setPipeline(d.renderPipeline),t.setVertexBuffer(0,f.vertex),t.setVertexBuffer(1,f.uv),t.setVertexBuffer(2,f.normal),t.setVertexBuffer(3,f.miterScale),t.setVertexBuffer(4,f.position),t.setVertexBuffer(5,f.vertexType),t.setIndexBuffer(f.index,f.indexFormat),t.drawIndexed(n,i,e,0,r);else return},b;b=_?1:n.count;for(let e=0;e<n.count;e+=b){let n=o.index?.length??0,r=_&&(g||c.style.points.enabled)&&f!==void 0&&f.pointsFirstIndex<n,i;i=r?f?.pointsFirstIndex??0:n,y(0,i,e,b),_&&d.lineRenderPipeline!==void 0&&u.linePoints!==void 0&&o.linePoints!==void 0&&(t.setPipeline(d.lineRenderPipeline),t.setVertexBuffer(0,u.linePoints.vertex),t.setVertexBuffer(1,u.linePoints.normal),t.setIndexBuffer(u.linePoints.index,u.linePoints.indexFormat),t.drawIndexed(o.linePoints.index.length,b,0,0,e)),r&&y(i,n-i,e,b)}}else return}else return}else return}createCustomBindGroup(e,t,n){let r=n.customBindGroupLayout,i=t.values,a=this.pipeline.customValues.get(t.id);if(r===void 0||i===void 0||a===void 0)return;let o=[],s=[r];for(let e of i.entries)if(e.kind===`texture`&&e.value instanceof I){let t=this.pipeline.textures.get(e.value.id)?.view??this.pipeline.fallbackTexture?.view,n=this.samplerManager.get(`clamp-to-edge`,`clamp-to-edge`);if(t===void 0||n===void 0)return;o.push({binding:e.binding,resource:t}),o.push({binding:e.binding+1,resource:n}),s.push(t,n)}else{let t=a.buffers.get(e.name)?.buffer;if(t===void 0)return;o.push({binding:e.binding,resource:{buffer:t}}),s.push(t)}let c=a.bindGroup===void 0||a.layout!==r;if(!c&&a.resources!==void 0){if(a.resources.length!==s.length)c=!0;else for(let e=0;e<s.length;e+=1)if(a.resources[e]!==s[e]){c=!0;break}}return c&&(a.bindGroup=e.createBindGroup({layout:r,entries:o}),a.layout=r,a.resources=s),a.bindGroup}createMaterialBindGroup(e,t,n,r){let i=this.pipeline.fallbackTexture,a=this.samplerManager.get(n.style.solid.addressModeU,n.style.solid.addressModeV),o=this.samplerManager.get(n.style.edge.addressModeU,n.style.edge.addressModeV),s=this.samplerManager.get(n.style.points.addressModeU,n.style.points.addressModeV),c=this.pipeline.buffers.meshStyle.get(t.id);if(i!==void 0&&a!==void 0&&o!==void 0&&s!==void 0&&c!==void 0){let n=e=>e===void 0?i.view:this.pipeline.textures.get(e.id)?.view??i.view,l=t.textures,u=n(l[0]),d=n(l[1]),f=n(l[2]),p=r.materialBindGroupLayout,m=c.bindGroup;return(m?.layout!==p||m.baseView!==u||m.edgeView!==d||m.pointsView!==f||m.baseSampler!==a||m.edgeSampler!==o||m.pointsSampler!==s)&&(m={layout:p,baseView:u,edgeView:d,pointsView:f,baseSampler:a,edgeSampler:o,pointsSampler:s,group:e.createBindGroup({layout:p,entries:[{binding:0,resource:{buffer:c.buffer}},{binding:1,resource:u},{binding:2,resource:a},{binding:3,resource:d},{binding:4,resource:o},{binding:5,resource:f},{binding:6,resource:s}]})},c.bindGroup=m),m.group}}},de=class{pipeline;constructor(e){this.pipeline=e}draw(e){let t=this.pipeline.device;if(t!==void 0)for(let n of e.textureList){let e=this.pipeline.textures.get(n.id);if(e?.version!==n.version){let r;if(r=n instanceof A?n.layers:[n],r.length!==0&&(n instanceof A||K(n))){let i=this.createTexture(t,n.id,n.version,r);this.releaseTexture(e),this.pipeline.textures.set(n.id,i)}else{this.releaseTexture(e),this.pipeline.textures.delete(n.id);continue}}else continue}}createFallbackTexture(e){return this.createTexture(e,-1,0,[void 0])}releaseTexture(e){if(e!==void 0){for(let t of this.pipeline.buffers.meshStyle.values()){let n=t.bindGroup;(n?.baseView===e.view||n?.edgeView===e.view||n?.pointsView===e.view)&&(t.bindGroup=void 0)}for(let t of this.pipeline.customValues.values())t.resources?.includes(e.view)&&(t.bindGroup=void 0);e.texture.destroy()}else return}createTexture(e,t,n,r){let i=1,a=1,o=new Set;for(let e of r)e!==void 0&&o.add(e.id),K(e)&&(i=Math.max(i,e.width),a=Math.max(a,e.height));if(r.length>e.limits.maxTextureArrayLayers)throw RangeError(`Texture layers exceed maxTextureArrayLayers.`);if(i>e.limits.maxTextureDimension2D||a>e.limits.maxTextureDimension2D)throw RangeError(`Texture dimensions exceed maxTextureDimension2D.`);let s=`Texture `+String(t);t===-1&&(s=`Fallback White Texture`);let c=e.createTexture({label:s,size:{width:i,height:a,depthOrArrayLayers:r.length},format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});try{let s;for(let t=0;t<r.length;t++){let n=r[t],o;o=K(n)?n.source:null;let l={texture:c,origin:{x:0,y:0,z:t}},u={width:i,height:a,depthOrArrayLayers:1};if(o!==null||i!==1||a!==1){let t=typeof ImageData<`u`&&o instanceof ImageData;if(o===null||t||n?.width!==i||n.height!==a){s??=new OffscreenCanvas(i,a);let n=s.getContext(`2d`);if(n===null)throw Error(`Cannot create texture normalization canvas.`);if(n.clearRect(0,0,i,a),o===null)n.fillStyle=`#ffffff`,n.fillRect(0,0,i,a);else if(t){let e=o,t=new OffscreenCanvas(e.width,e.height),r=t.getContext(`2d`);if(r===null)throw Error(`Cannot upload ImageData.`);r.putImageData(e,0,0),n.drawImage(t,0,0,i,a)}else n.drawImage(o,0,0,i,a);e.queue.copyExternalImageToTexture({source:s,flipY:!0},l,u)}else{e.queue.copyExternalImageToTexture({source:o,flipY:!0},l,u);continue}}else{e.queue.writeTexture(l,new Uint8Array([255,255,255,255]),{bytesPerRow:4,rowsPerImage:1},u);continue}}return{textureId:t,version:n,sourceIds:o,texture:c,view:c.createView({dimension:`2d-array`})}}catch(e){throw c.destroy(),e}}},K=e=>e!==void 0&&e.loaded&&e.source!==null&&Number.isInteger(e.width)&&Number.isInteger(e.height)&&e.width>0&&e.height>0,fe=`struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
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
`,pe=`
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
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
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
    let modelMatrix = modelMatrices[resolvedIndex];
    let worldPosition = modelMatrix * vec3f(input.position, 1.0);
    let viewPosition = viewMatrix * worldPosition;
    let clipPosition = orthogonalMatrix * viewPosition;

    var output: VertexOutput;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.instanceIndex = resolvedIndex;
    return output;
}
`,me=class{pipeline;textureManager;samplerManager;constructor(e,t,n){this.pipeline=e,this.textureManager=t,this.samplerManager=n}initResources(e){this.pipeline.defaultBindGroupLayout=e.createBindGroupLayout({label:`Default Matrix Bind Group Layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}},{binding:2,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}},{binding:3,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:4,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`uniform`}},{binding:5,visibility:GPUShaderStage.VERTEX,buffer:{type:`uniform`}}]}),this.pipeline.baseMaterialBindGroupLayout=e.createBindGroupLayout({label:`BaseMaterial Bind Group Layout`,entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}},{binding:5,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}},{binding:6,visibility:GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}}]}),this.pipeline.fallbackTexture=this.textureManager.createFallbackTexture(e)}draw(e){for(let t of e.materialList){this.samplerManager.get(t.style.solid.addressModeU,t.style.solid.addressModeV),this.samplerManager.get(t.style.edge.addressModeU,t.style.edge.addressModeV),this.samplerManager.get(t.style.points.addressModeU,t.style.points.addressModeV);for(let n of e.getMaterialGeometryTypes(t.id)){let e=t.getPipelineKey(n);if(!this.pipeline.pipelineTemplates.has(e)){let r=this.createPipelineTemplate(t,n);r!==void 0&&this.pipeline.pipelineTemplates.set(e,r)}}}}createPipelineTemplate(e,t){let n=this.pipeline.device,r=this.pipeline.format,i=this.pipeline.defaultBindGroupLayout,a=this.pipeline.baseMaterialBindGroupLayout;if(n!==void 0&&r!==void 0&&i!==void 0&&a!==void 0){let o=[];for(let t of e.values?.entries??[])if(t.kind===`texture`)o.push({binding:t.binding,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{sampleType:`float`,viewDimension:`2d-array`}}),o.push({binding:t.binding+1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,sampler:{type:`filtering`}});else{let e=t.kind===`array<f32>`,n=`uniform`;e&&(n=`read-only-storage`),o.push({binding:t.binding,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:n}})}let s,c=[i,a];o.length>0&&(s=n.createBindGroupLayout({entries:o}),c.push(s));let l=n.createPipelineLayout({bindGroupLayouts:c}),u;u=e.transparent?{color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}}:void 0;let d=(t,i,a,o,s)=>{if(i!==void 0&&a!==void 0){let c=`always`;e.depthTest&&(c=`less-equal`);let d=e.cullMode;return o===`line-list`&&(d=`none`),n.createRenderPipeline({label:t,layout:l,vertex:{module:n.createShaderModule({code:i}),entryPoint:`main`,buffers:s},fragment:{module:n.createShaderModule({code:a}),entryPoint:`main`,targets:[{format:r,blend:u}]},depthStencil:{format:`depth32float`,depthWriteEnabled:e.depthWrite,depthCompare:c},primitive:{topology:o,frontFace:`cw`,cullMode:d}})}},f=[0,1,2].map(e=>({arrayStride:8,attributes:[{shaderLocation:e,offset:0,format:`float32x2`}]})),p=e.getShaderSource(t),m=d(`BaseMaterial `+t+` Pipeline`,p.vertex,p.fragment,`triangle-list`,[...f,{arrayStride:4,attributes:[{shaderLocation:3,offset:0,format:`float32`}]},{arrayStride:8,attributes:[{shaderLocation:4,offset:0,format:`float32x2`}]},{arrayStride:4,attributes:[{shaderLocation:5,offset:0,format:`float32`}]}]),h=d(`Line Pipeline`,pe,fe,`line-list`,[f[0],f[2]]);return{key:e.getPipelineKey(t),renderPipeline:m,lineRenderPipeline:h,defaultBindGroupLayout:i,materialBindGroupLayout:a,customBindGroupLayout:s}}}},he=e=>{e.ensureWorldMatrix();for(let t of e.drawList)t.ensureWorldMatrix()},ge=e=>{e.ensureLists()},_e=e=>{e.ensureCameraMatrix()},ve=class{id;type=`Render`;container;canvas;backgroundColor={r:0,g:0,b:0,a:0};pipeline;ready;_alphaMode;_resizeTimer;_destroyed;_dpr;_renderMode;bufferManager;destroyManager;drawCallManager;pipelineManager;textureManager;constructor(e,t=`development`){if(this.id=p(),typeof e==`string`){let t=document.getElementById(e);if(t===null)throw Error(`Render container "${e}" was not found.`);this.container=t}else this.container=e;this.canvas=document.createElement(`canvas`),this.canvas.style.display=`block`,this.canvas.style.width=`100%`,this.canvas.style.height=`100%`,this.container.appendChild(this.canvas),this._alphaMode=`premultiplied`,this._resizeTimer=null,this._destroyed=!1,this._dpr=g().dpr,this._renderMode=t,this.pipeline={pipelineTemplates:new Map,textures:new Map,samplers:new Map,sceneResources:new Map,customValues:new Map,buffers:{meshMatrix:new Map,meshDepth:new Map,geometry:new Map,meshStyle:new Map,cameraUniform:[]}},this.destroyManager=new G(this.pipeline),this.textureManager=new de(this.pipeline);let n=new le(this.pipeline);this.pipelineManager=new me(this.pipeline,this.textureManager,n),this.bufferManager=new W(this.pipeline),this.drawCallManager=new ue(this.pipeline,n),this.ready=this.initWebGPU()}async initWebGPU(){let e=navigator.gpu;if(e===void 0)throw Error(`WebGPU is not supported by this browser.`);let t=await e.requestAdapter();if(t===null)throw Error(`No compatible WebGPU adapter was found.`);if(!this.isDestroyed()){let n=await t.requestDevice();if(this.isDestroyed()){n.destroy();return}{let r=this.canvas.getContext(`webgpu`);if(r===null)throw Error(`WebGPU canvas context could not be created.`);let i=e.getPreferredCanvasFormat();r.configure({device:n,format:i,alphaMode:this._alphaMode}),this.pipeline.adapter=t,this.pipeline.device=n,this.pipeline.context=r,this.pipeline.format=i,this.pipelineManager.initResources(n)}}}set alphaMode(e){if(this._alphaMode!==e){this._alphaMode=e;let t=this.pipeline.device,n=this.pipeline.context,r=this.pipeline.format;t!==void 0&&n!==void 0&&r!==void 0&&n.configure({device:t,format:r,alphaMode:e})}else return}get alphaMode(){return this._alphaMode}get dpr(){return this._dpr}set renderMode(e){this._renderMode=e}get renderMode(){return this._renderMode}warmup(e,t){if(!this._destroyed&&this.pipeline.device!==void 0)this.initScene(e),this.pipeline.sceneResources.get(e.id)?.version!==e.version&&this.trim(e),this.matrixUpdate(e),this.initCamera(t),this.drawBuffers(e,t),this.drawTextures(e),this.drawPipelines(e),this.drawCallManager.prepare(this.canvas.width,this.canvas.height);else return}render(e,t){if(!this._destroyed&&this.pipeline.device!==void 0)this.warmup(e,t),this.drawCall(e);else return}drawBuffers(e,t){this.bufferManager.draw(e,t,this._dpr,this._renderMode)}drawTextures(e){this.textureManager.draw(e)}drawPipelines(e){this.pipelineManager.draw(e)}drawCall(e){this.drawCallManager.draw(e,this.backgroundColor,this._alphaMode)}destroyMesh(e){return this.destroyManager.destroyMesh(e)}destroyTexture(e){return this.destroyManager.destroyTexture(e)}destroyMaterial(e){return this.destroyManager.destroyMaterial(e)}destroyGeometry(e){return this.destroyManager.destroyGeometry(e)}trim(e){this.destroyManager.trim(e)}matrixUpdate(e){he(e)}initScene(e){ge(e)}initCamera(e){_e(e)}destroy(){if(!this._destroyed)this._destroyed=!0,this._resizeTimer!==null&&(window.clearTimeout(this._resizeTimer),this._resizeTimer=null),this.destroyManager.destroyAll(),this.canvas.remove();else return}resize(){if(!this._destroyed){this._resizeTimer!==null&&window.clearTimeout(this._resizeTimer);let e=()=>{let e=g().dpr,t=this.pipeline.device?.limits.maxTextureDimension2D??8192,n=Math.min(t,Math.max(1,Math.round(this.canvas.clientWidth*e))),r=Math.min(t,Math.max(1,Math.round(this.canvas.clientHeight*e)));this.canvas.width!==n&&(this.canvas.width=n),this.canvas.height!==r&&(this.canvas.height=r),this._dpr=e,this._resizeTimer=null};this._resizeTimer=window.setTimeout(e,100)}}isDestroyed(){return this._destroyed}},ye=class extends O{type=`Scene`;_listsSnapshot=-1;_textureSnapshot=-1;_materialGeometryTypes=new Map;drawList=[];geometryList=[];materialList=[];textureList=[];constructor(){super(0,0)}ensureLists(){return this._listsSnapshot!==this.version&&this.updateLists(),this.drawList}addToLists(e){let t=e=>{if(e instanceof k&&e.data!==void 0&&e.material!==void 0){this.drawList.some(t=>t.id===e.id)||this.drawList.push(e),this.geometryList.some(t=>t.id===e.data?.id)||this.geometryList.push(e.data),this.materialList.some(t=>t.id===e.material?.id)||this.materialList.push(e.material),this.addMaterialGeometryType(e.material.id,e.data.type);for(let t of q(e))this.textureList.some(e=>e.id===t.id)||this.textureList.push(t)}if(e instanceof O)for(let n of e.children)t(n)};t(e),this.updateDrawOrder()}removeFromLists(e){let t=new Set,n=e=>{if(e instanceof k&&t.add(e.id),e instanceof O)for(let t of e.children)n(t)};if(n(e),t.size!==0){let e=e=>!t.has(e.id);this.drawList=this.drawList.filter(e),this.updateVersion()}else return}updateLists(){this.updateVersion();let e=[],t=n=>{if(n instanceof k&&n.data!==void 0&&n.material!==void 0&&e.push(n),n instanceof O)for(let e of n.children)t(e)};for(let e of this.children)t(e);return this.drawList=e,this.updateResourceLists(),this.updateDrawOrder(),this._listsSnapshot=this.version,this.drawList}updateResourceLists(){this._materialGeometryTypes.clear();let e=[],t=[],n=[],r=new Set,i=new Set,a=new Set;for(let o of this.drawList){let s=o.data,c=o.material;if(s!==void 0&&!r.has(s.id)&&(r.add(s.id),e.push(s)),c!==void 0){i.has(c.id)||(i.add(c.id),t.push(c));for(let e of q(o))a.has(e.id)||(a.add(e.id),n.push(e));s!==void 0&&this.addMaterialGeometryType(c.id,s.type)}else continue}this.geometryList=e,this.materialList=t,this.textureList=n,this._textureSnapshot=this.version}updateDrawList(){return this.updateLists()}updateTextureList(){if(this._textureSnapshot===this.version)return this.textureList;{let e=this.textureList,t=[],n=new Set;for(let e of this.drawList)for(let r of q(e))n.has(r.id)||(n.add(r.id),t.push(r));return this.textureList=t,be(e,t)||this.updateVersion(),this._textureSnapshot=this.version,this.textureList}}getMaterialGeometryTypes(e){return this._materialGeometryTypes.get(e)??new Set}addMaterialGeometryType(e,t){let n=this._materialGeometryTypes.get(e);n===void 0&&(n=new Set,this._materialGeometryTypes.set(e,n)),n.add(t)}updateDrawOrder(){this.drawList.sort((e,t)=>e.order-t.order)}},q=e=>{let t=e.textures.filter(e=>e!==void 0),n=e.material?.values?.textures??[];return[...t,...n]},be=(e,t)=>{if(e.length===t.length){let n=new Set(t.map(e=>e.id));return e.every(e=>n.has(e.id))}return!1},J=class e{constructor(t,n,r,i,a=`div`){this.parent=t,this.object=n,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(a),this.domElement.classList.add(`lil-controller`),this.domElement.classList.add(i),this.$name=document.createElement(`div`),this.$name.classList.add(`lil-name`),e.nextNameID=e.nextNameID||0,this.$name.id=`lil-gui-name-${++e.nextNameID}`,this.$widget=document.createElement(`div`),this.$widget.classList.add(`lil-widget`),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener(`keydown`,e=>e.stopPropagation()),this.domElement.addEventListener(`keyup`,e=>e.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle(`lil-disabled`,e),this.$disable.toggleAttribute(`disabled`,e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}options(e){let t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);let e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}},xe=class extends J{constructor(e,t,n){super(e,t,n,`lil-boolean`,`label`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`checkbox`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener(`change`,()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}};function Y(e){let t,n;return(t=e.match(/(#|0x)?([a-f0-9]{6})/i))?n=t[2]:(t=e.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?n=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=e.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(n=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),n?`#`+n:!1}var Se={isPrimitive:!0,match:e=>typeof e==`string`,fromHexString:Y,toHexString:Y},X={isPrimitive:!0,match:e=>typeof e==`number`,fromHexString:e=>parseInt(e.substring(1),16),toHexString:e=>`#`+e.toString(16).padStart(6,0)},Z=[Se,X,{isPrimitive:!1,match:e=>Array.isArray(e)||ArrayBuffer.isView(e),fromHexString(e,t,n=1){let r=X.fromHexString(e);t[0]=(r>>16&255)/255*n,t[1]=(r>>8&255)/255*n,t[2]=(r&255)/255*n},toHexString([e,t,n],r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return X.toHexString(i)}},{isPrimitive:!1,match:e=>Object(e)===e,fromHexString(e,t,n=1){let r=X.fromHexString(e);t.r=(r>>16&255)/255*n,t.g=(r>>8&255)/255*n,t.b=(r&255)/255*n},toHexString({r:e,g:t,b:n},r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return X.toHexString(i)}}];function Ce(e){return Z.find(t=>t.match(e))}var we=class extends J{constructor(e,t,n,r){super(e,t,n,`lil-color`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`color`),this.$input.setAttribute(`tabindex`,-1),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$text=document.createElement(`input`),this.$text.setAttribute(`type`,`text`),this.$text.setAttribute(`spellcheck`,`false`),this.$text.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=Ce(this.initialValue),this._rgbScale=r,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener(`input`,()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$text.addEventListener(`input`,()=>{let e=Y(this.$text.value);e&&this._setValueFromHexString(e)}),this.$text.addEventListener(`focus`,()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener(`blur`,()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){let t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}},Q=class extends J{constructor(e,t,n){super(e,t,n,`lil-function`),this.$button=document.createElement(`button`),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener(`click`,e=>{e.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$disable=this.$button}},Te=class extends J{constructor(e,t,n,r,i,a){super(e,t,n,`lil-number`),this._initInput(),this.min(r),this.max(i);let o=a!==void 0;this.step(o?a:this._getImplicitStep(),o),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){let e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+`%`}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),window.matchMedia(`(pointer: coarse)`).matches&&(this.$input.setAttribute(`type`,`number`),this.$input.setAttribute(`step`,`any`)),this.$widget.appendChild(this.$input),this.$disable=this.$input;let e=()=>{let e=parseFloat(this.$input.value);isNaN(e)||(this._stepExplicit&&(e=this._snap(e)),this.setValue(this._clamp(e)))},t=e=>{let t=parseFloat(this.$input.value);isNaN(t)||(this._snapClampSetValue(t+e),this.$input.value=this.getValue())},n=e=>{e.key===`Enter`&&this.$input.blur(),e.code===`ArrowUp`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e))),e.code===`ArrowDown`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e)*-1))},r=e=>{this._inputFocused&&(e.preventDefault(),t(this._step*this._normalizeMouseWheel(e)))},i=!1,a,o,s,c,l,u=e=>{a=e.clientX,o=s=e.clientY,i=!0,c=this.getValue(),l=0,window.addEventListener(`mousemove`,d),window.addEventListener(`mouseup`,f)},d=e=>{if(i){let t=e.clientX-a,n=e.clientY-o;Math.abs(n)>5?(e.preventDefault(),this.$input.blur(),i=!1,this._setDraggingStyle(!0,`vertical`)):Math.abs(t)>5&&f()}if(!i){let t=e.clientY-s;l-=t*this._step*this._arrowKeyMultiplier(e),c+l>this._max?l=this._max-c:c+l<this._min&&(l=this._min-c),this._snapClampSetValue(c+l)}s=e.clientY},f=()=>{this._setDraggingStyle(!1,`vertical`),this._callOnFinishChange(),window.removeEventListener(`mousemove`,d),window.removeEventListener(`mouseup`,f)};this.$input.addEventListener(`input`,e),this.$input.addEventListener(`keydown`,n),this.$input.addEventListener(`wheel`,r,{passive:!1}),this.$input.addEventListener(`mousedown`,u),this.$input.addEventListener(`focus`,()=>{this._inputFocused=!0}),this.$input.addEventListener(`blur`,()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement(`div`),this.$slider.classList.add(`lil-slider`),this.$fill=document.createElement(`div`),this.$fill.classList.add(`lil-fill`),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add(`lil-has-slider`);let e=(e,t,n,r,i)=>(e-t)/(n-t)*(i-r)+r,t=t=>{let n=this.$slider.getBoundingClientRect(),r=e(t,n.left,n.right,this._min,this._max);this._snapClampSetValue(r)},n=e=>{this._setDraggingStyle(!0),t(e.clientX),window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)},r=e=>{t(e.clientX)},i=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)},a=!1,o,s,c=e=>{e.preventDefault(),this._setDraggingStyle(!0),t(e.touches[0].clientX),a=!1},l=e=>{e.touches.length>1||(this._hasScrollBar?(o=e.touches[0].clientX,s=e.touches[0].clientY,a=!0):c(e),window.addEventListener(`touchmove`,u,{passive:!1}),window.addEventListener(`touchend`,d))},u=e=>{if(a){let t=e.touches[0].clientX-o,n=e.touches[0].clientY-s;Math.abs(t)>Math.abs(n)?c(e):(window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d))}else e.preventDefault(),t(e.touches[0].clientX)},d=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d)},f=this._callOnFinishChange.bind(this),p;this.$slider.addEventListener(`mousedown`,n),this.$slider.addEventListener(`touchstart`,l,{passive:!1}),this.$slider.addEventListener(`wheel`,e=>{if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&this._hasScrollBar)return;e.preventDefault();let t=this._normalizeMouseWheel(e)*this._step;this._snapClampSetValue(this.getValue()+t),this.$input.value=this.getValue(),clearTimeout(p),p=setTimeout(f,400)},{passive:!1})}_setDraggingStyle(e,t=`horizontal`){this.$slider&&this.$slider.classList.toggle(`lil-active`,e),document.body.classList.toggle(`lil-dragging`,e),document.body.classList.toggle(`lil-${t}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:n}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,n=-e.wheelDelta/120,n*=this._stepExplicit?1:10),t+-n}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){let t=0;return this._hasMin?t=this._min:this._hasMax&&(t=this._max),e-=t,e=Math.round(e/this._step)*this._step,e+=t,e=parseFloat(e.toPrecision(15)),e}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){let e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}},Ee=class extends J{constructor(e,t,n,r){super(e,t,n,`lil-option`),this.$select=document.createElement(`select`),this.$select.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$select.addEventListener(`change`,()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener(`focus`,()=>{this.$display.classList.add(`lil-focus`)}),this.$select.addEventListener(`blur`,()=>{this.$display.classList.remove(`lil-focus`)}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(r)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(e=>{let t=document.createElement(`option`);t.textContent=e,this.$select.appendChild(t)}),this.updateDisplay(),this}updateDisplay(){let e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.textContent=t===-1?e:this._names[t],this}},De=class extends J{constructor(e,t,n){super(e,t,n,`lil-string`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`spellcheck`,`false`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$input.addEventListener(`input`,()=>{this.setValue(this.$input.value)}),this.$input.addEventListener(`keydown`,e=>{e.code===`Enter`&&this.$input.blur()}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}},Oe=`.lil-gui {
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
}`;function ke(e){let t=document.createElement(`style`);t.innerHTML=e;let n=document.querySelector(`head link[rel=stylesheet], head style`);n?document.head.insertBefore(t,n):document.head.appendChild(t)}var $=!1,Ae=class e{constructor({parent:e,autoPlace:t=e===void 0,container:n,width:r,title:i=`Controls`,closeFolders:a=!1,injectStyles:o=!0,touchStyles:s=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement(`div`),this.domElement.classList.add(`lil-gui`),this.$title=document.createElement(`button`),this.$title.classList.add(`lil-title`),this.$title.setAttribute(`aria-expanded`,!0),this.$title.addEventListener(`click`,()=>this.openAnimated(this._closed)),this.$title.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$children=document.createElement(`div`),this.$children.classList.add(`lil-children`),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add(`lil-root`),s&&this.domElement.classList.add(`lil-allow-touch-styles`),!$&&o&&(ke(Oe),$=!0),n?n.appendChild(this.domElement):t&&(this.domElement.classList.add(`lil-auto-place`,`autoPlace`),document.body.appendChild(this.domElement)),r&&this.domElement.style.setProperty(`--width`,r+`px`),this._closeFolders=a}add(e,t,n,r,i){if(Object(n)===n)return new Ee(this,e,t,n);let a=e[t];switch(typeof a){case`number`:return new Te(this,e,t,n,r,i);case`boolean`:return new xe(this,e,t);case`string`:return new De(this,e,t);case`function`:return new Q(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,a)}addColor(e,t,n=1){return new we(this,e,t,n)}addFolder(t){let n=new e({parent:this,title:t});return this.root._closeFolders&&n.close(),n}load(e,t=!0){return e.controllers&&this.controllers.forEach(t=>{t instanceof Q||t._name in e.controllers&&t.load(e.controllers[t._name])}),t&&e.folders&&this.folders.forEach(t=>{t._title in e.folders&&t.load(e.folders[t._title])}),this}save(e=!0){let t={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof Q)){if(e._name in t.controllers)throw Error(`Cannot save GUI with duplicate property "${e._name}"`);t.controllers[e._name]=e.save()}}),e&&this.folders.forEach(e=>{if(e._title in t.folders)throw Error(`Cannot save GUI with duplicate folder "${e._title}"`);t.folders[e._title]=e.save()}),t}open(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),this.domElement.classList.toggle(`lil-closed`,this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),requestAnimationFrame(()=>{let t=this.$children.clientHeight;this.$children.style.height=t+`px`,this.domElement.classList.add(`lil-transition`);let n=e=>{e.target===this.$children&&(this.$children.style.height=``,this.domElement.classList.remove(`lil-transition`),this.$children.removeEventListener(`transitionend`,n))};this.$children.addEventListener(`transitionend`,n);let r=e?this.$children.scrollHeight:0;this.domElement.classList.toggle(`lil-closed`,!e),requestAnimationFrame(()=>{this.$children.style.height=r+`px`})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}};export{d as _,F as a,M as c,oe as d,j as f,_ as g,E as h,I as i,ce as l,D as m,ye as n,P as o,k as p,ve as r,N as s,Ae as t,se as u,l as v};