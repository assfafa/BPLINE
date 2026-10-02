import{i as e,n as t,r as n}from"./index-YNW6j57L.js";import{t as r}from"./Vec2-NTeaCz1R.js";import{_ as i,f as a,g as o,h as s,n as c,p as l,r as u,t as d,v as f}from"./lil-gui.esm-BEHuxiGy.js";import{t as ee}from"./CameraControl-CFnTGNbV.js";import{t as p}from"./Rect2D-CF_2APia.js";import{t as m}from"./Poly-PgkD2eHm.js";import{t as h}from"./Poly2D-CNFI4lmd.js";import{n as g,t as _}from"./NGon2D-CAS5gElU.js";import{t as v}from"./baseMaterial-B1gmKtPJ.js";var y=1e-7,b=e=>{let t=0;for(let n=0;n<e.length;n+=1){let r=e[n],i=e[(n+1)%e.length];t+=r.x*i.y-r.y*i.x}return t},x=(e,t)=>{for(let n=0;n<e.length;n+=1){let r=e[n],i=e[(n+1)%e.length],a=i.y-r.y,o=r.x-i.x;if(a!==0||o!==0){let n=1/0,r=-1/0,i=1/0,s=-1/0;for(let t of e){let e=t.x*a+t.y*o;n=Math.min(n,e),r=Math.max(r,e)}for(let e of t){let t=e.x*a+e.y*o;i=Math.min(i,t),s=Math.max(s,t)}let c=y*(Math.abs(a)+Math.abs(o));if(r<i-c||s<n-c)return!0}}return!1},S=(e,t)=>{let n=e[0],r=e[1],i=e[2],a=(r.x-n.x)*(t.y-n.y)-(r.y-n.y)*(t.x-n.x),o=(i.x-r.x)*(t.y-r.y)-(i.y-r.y)*(t.x-r.x),s=(n.x-i.x)*(t.y-i.y)-(n.y-i.y)*(t.x-i.x);return!((a<-1e-7||o<-1e-7||s<-1e-7)&&(a>y||o>y||s>y))},C=(e,t,n)=>{let r=n.x-t.x,i=n.y-t.y,a=r*r+i*i,o=0;a>0&&(o=((e.x-t.x)*r+(e.y-t.y)*i)/a,o=Math.max(0,Math.min(1,o)));let s=t.x+o*r,c=t.y+o*i,l=e.x-s,u=e.y-c;return l*l+u*u},w=(e,t,n)=>(t.x-e.x)*(n.y-e.y)-(t.y-e.y)*(n.x-e.x),T=(e,t,n,r)=>{let i=n/(n-r);return{x:e.x+(t.x-e.x)*i,y:e.y+(t.y-e.y)*i}},E=(e,t)=>{let n=[...e],r=Math.sign(b(t));for(let e=0;e<3;e+=1){let i=t[e],a=t[(e+1)%3],o=n;if(n=[],o.length>0)for(let e=0;e<o.length;e+=1){let t=o[e],s=o[(e+1)%o.length],c=w(i,a,t)*r,l=w(i,a,s)*r,u=c>=-1e-7,d=l>=-1e-7;u!==d&&n.push(T(t,s,c,l)),d&&n.push(s)}}return Math.abs(b(n))*.5},D=1e-7,O=(e,t,n)=>{let r=e.data;return{x:r[0]*t+r[3]*n+r[6],y:r[1]*t+r[4]*n+r[7]}},k=(e,t)=>{let n=e.data,r=n[0]*n[4]-n[3]*n[1];if(Number.isFinite(r)&&Math.abs(r)>2**-52){let e=t.x-n[6],i=t.y-n[7];return{x:(n[4]*e-n[3]*i)/r,y:(n[0]*i-n[1]*e)/r}}},A=(e,t,n)=>{let r=t*.5,i=n*.5;return[O(e,r,i),O(e,-r,i),O(e,-r,-i),O(e,r,-i)]},j=e=>{let t=1/0,n=-1/0,r=1/0,i=-1/0;for(let a of e)t=Math.min(t,a.x),n=Math.max(n,a.x),r=Math.min(r,a.y),i=Math.max(i,a.y);return{minX:t,maxX:n,minY:r,maxY:i}},M=e=>{let t=e.data;if(t instanceof p&&Number.isFinite(t.width)&&Number.isFinite(t.height)&&t.width>0&&t.height>0){let n=e.ensureWorldMatrix(),r=n.data,i=r[0]*r[4]-r[3]*r[1];if(r.every(Number.isFinite)&&Number.isFinite(i)&&Math.abs(i)>2**-52){let e=t.radius;e=Number.isFinite(e)?Math.max(0,Math.min(e,t.width*.5,t.height*.5)):0;let r=A(n,t.width,t.height);return{width:t.width,height:t.height,radius:e,worldMatrix:n,corners:r,bounds:j(r)}}return}},N=(e,t)=>{if(t.x<e.bounds.minX-D||t.x>e.bounds.maxX+D||t.y<e.bounds.minY-D||t.y>e.bounds.maxY+D)return!1;{let n=k(e.worldMatrix,t);if(n!==void 0){let t=e.width*.5,r=e.height*.5,i=Math.abs(n.x),a=Math.abs(n.y);if(i<=t+D&&a<=r+D){let n=Math.max(0,i-(t-e.radius)),o=Math.max(0,a-(r-e.radius));return n*n+o*o<=e.radius*e.radius+D}return!1}return!1}},P=(e,t)=>e.bounds.maxX<t.bounds.minX-D||t.bounds.maxX<e.bounds.minX-D||e.bounds.maxY<t.bounds.minY-D||t.bounds.maxY<e.bounds.minY-D?!1:!x(e.corners,t.corners)&&!x(t.corners,e.corners),F=e=>{if(e.outline===void 0){if(e.radius===0)e.outline=e.corners;else{let t=e.width*.5,n=e.height*.5,r=t-e.radius,i=n-e.radius,a=Math.acos(Math.max(-1,1-.2/e.radius)),o=Math.min(64,Math.max(2,Math.ceil(Math.PI*.5/a))),s=[{x:r,y:i},{x:-r,y:i},{x:-r,y:-i},{x:r,y:-i}],c=[];for(let t=0;t<s.length;t+=1){let n=s[t];for(let r=0;r<=o;r+=1){let i=(t+r/o)*Math.PI*.5,a=n.x+Math.cos(i)*e.radius,s=n.y+Math.sin(i)*e.radius;c.push(O(e.worldMatrix,a,s))}}e.outline=c}}return e.outline},I=(e,t)=>{if(P(e,t)){let n=F(t);for(let t of n)if(!N(e,t))return!1;return!0}return!1},L=(e,t)=>{if(P(e,t)){if(e.radius===0&&t.radius===0)return!0;{let n=F(e),r=F(t);return!x(n,r)&&!x(r,n)}}return!1},R=(e,t,n)=>{let r=e.data;return{x:r[0]*t+r[3]*n+r[6],y:r[1]*t+r[4]*n+r[7]}},z=e=>{let t={minX:1/0,maxX:-1/0,minY:1/0,maxY:-1/0};for(let n of e)for(let e of n)t.minX=Math.min(t.minX,e.x),t.maxX=Math.max(t.maxX,e.x),t.minY=Math.min(t.minY,e.y),t.maxY=Math.max(t.maxY,e.y);return t},B=(e,t)=>{let n=[];for(let r=0;r+2<e.index.length;r+=3){let i=e.index[r]*2,a=e.index[r+1]*2,o=e.index[r+2]*2,s=R(t,e.geometry[i],e.geometry[i+1]),c=R(t,e.geometry[a],e.geometry[a+1]),l=R(t,e.geometry[o],e.geometry[o+1]),u=(c.x-s.x)*(l.y-s.y)-(c.y-s.y)*(l.x-s.x);Number.isFinite(u)&&Math.abs(u)>2**-52&&n.push([s,c,l])}return n},V=e=>{let t=M(e);if(t===void 0){let t=e.data,n;if(t instanceof h&&t.closed){let e=[];for(let n=0;n+1<t.points.length;n+=2)e.push({x:t.points[n],y:t.points[n+1]});n=new m(e,{closed:!0,solid:!0}).data}else t instanceof _&&(n=new g({outer:t.outer,inter:t.inner,hole:t.inner>0,sides:t.sides,startAngle:t.startAngle,solid:!0}).data);if(n!==void 0){let t=B(n,e.ensureWorldMatrix());if(t.length>0)return{bounds:z(t),triangles:t}}return}return{bounds:t.bounds,rectangle:t,triangles:[]}},H=e=>{let t=F(e),n=[];for(let e=1;e+1<t.length;e+=1)n.push([t[0],t[e],t[e+1]]);return n},U=(e,t)=>{if(t.length>0){if(e.rectangle!==void 0){for(let n of t)for(let t of n)if(!N(e.rectangle,t))return!1}else for(let n of t){let t=Math.abs(b(n))*.5,r=0;for(let t of e.triangles)r+=E(n,t);let i=Math.max(1e-5,t*1e-6);if(!(r>=t-i))return!1}return!0}return!1},W=(e,t)=>{if(e.rectangle!==void 0){e.outline??=F(e.rectangle);for(let n of t)if(!x(n,e.outline)&&!x(e.outline,n))return!0}else for(let n of t)for(let t of e.triangles)if(!x(n,t)&&!x(t,n))return!0;return!1},G=(e,t)=>{let n=t.canvas.getBoundingClientRect();return n.width>0&&n.height>0&&e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom},K=(e,t,n)=>{let r=e.data;return{x:r[0]*t+r[3]*n+r[6],y:r[1]*t+r[4]*n+r[7]}},q=(e,t,n)=>{let i=t.worldToWindow(new r(e.x,e.y),n);return{x:i.x,y:i.y}},J=e=>{let t=e.data,n=[];if(t!==void 0){t.ensureGeometry();let r=t.geometry,i=t.index,a=t.vertexType,o=e.ensureWorldMatrix();if(r!==void 0&&i!==void 0)for(let e=0;e+2<i.length;e+=3){let t=i[e],s=i[e+1],c=i[e+2];if(a===void 0||a[t]===0&&a[s]===0&&a[c]===0){let e=K(o,r[t*2],r[t*2+1]),i=K(o,r[s*2],r[s*2+1]),a=K(o,r[c*2],r[c*2+1]),l=(i.x-e.x)*(a.y-e.y)-(i.y-e.y)*(a.x-e.x);Number.isFinite(l)&&Math.abs(l)>2**-52&&n.push([e,i,a])}}}return n},Y=e=>{let t=e.data,n=[];if(t instanceof p){let t=M(e);if(t!==void 0){let e=F(t),r=[];for(let t=0;t<e.length;t+=1)r.push({index:t,contourIndex:0,position:e[t]});n.push({vertices:r,closed:!0})}}else if(t instanceof _){let r=e.ensureWorldMatrix(),i=[t.outer];t.inner>0&&i.push(t.inner);for(let e=0;e<i.length;e+=1){let a=[];for(let n=0;n<t.sides;n+=1){let o=t.startAngle+n*Math.PI*2/t.sides,s=Math.cos(o)*i[e],c=Math.sin(o)*i[e];a.push({index:e*t.sides+n,contourIndex:e,position:K(r,s,c)})}n.push({vertices:a,closed:t.sides>2})}}else if(t instanceof h){let r=e.ensureWorldMatrix(),i=[];for(let e=0;e+1<t.points.length;e+=2)i.push({index:e/2,contourIndex:0,position:K(r,t.points[e],t.points[e+1])});n.push({vertices:i,closed:t.closed})}else if(t!==void 0){t.ensureGeometry();let r=t.geometry,i=t.index,a=t.vertexType,o=e.ensureWorldMatrix();if(r!==void 0&&i!==void 0)for(let e=0;e+2<i.length;e+=3){let t=i[e],s=i[e+1],c=i[e+2];if(a===void 0||a[t]===0&&a[s]===0&&a[c]===0){let t=[];for(let n=0;n<3;n+=1){let a=i[e+n];t.push({index:a,contourIndex:0,position:K(o,r[a*2],r[a*2+1])})}n.push({vertices:t,closed:!0})}}}return n},te=e=>{let t=e.data;if(t instanceof p){let n=e.ensureWorldMatrix(),r=t.width*.5,i=t.height*.5,a=[[-r,-i],[r,-i],[r,i],[-r,i]],o=[];for(let e=0;e<a.length;e+=1){let t=a[e];o.push({index:e,contourIndex:0,position:K(n,t[0],t[1])})}return o}{let t=[],n=new Set;for(let r of Y(e))for(let e of r.vertices)n.has(e.index)||(n.add(e.index),t.push(e));return t}},ne=e=>{let t=[],n=[],r=new Map,i=e.data,a=i!==void 0&&!(i instanceof p)&&!(i instanceof _)&&!(i instanceof h);for(let t of Y(e)){let e=t.vertices.length,i=e-1;t.closed&&e>2&&(i=e);for(let a=0;a<i;a+=1){let i=t.vertices[a],o=t.vertices[(a+1)%e];if(i.position.x!==o.position.x||i.position.y!==o.position.y){let e=Math.min(i.index,o.index),t=Math.max(i.index,o.index),a=`${String(e)}:${String(t)}`,s=r.get(a)??0;r.set(a,s+1),s===0&&n.push({key:a,contourIndex:i.contourIndex,start:i.position,end:o.position})}}}for(let e of n)(!a||r.get(e.key)===1)&&t.push({index:t.length,contourIndex:e.contourIndex,start:e.start,end:e.end});return t},X=class{scene;render;camera;geometryType;autoEnableBounding;picker=!0;selector=!0;selectionMode=`all`;constructor(e,t,n,r,i){if(this.scene=e,this.render=t,this.camera=n,this.geometryType=r,this.autoEnableBounding=i,i)for(let t of e.ensureLists())this.accepts(t)&&(t.bounding=!0)}accepts(e){return e instanceof l&&!(e instanceof a)&&e.data?.type===this.geometryType}getBounds(e){return this.autoEnableBounding&&!e.bounding&&(e.bounding=!0),e.boundingBox}SelectPicker(e){let t=[];if(this.picker&&G(e,this.render)){let n=this.camera.windowToWorld(new r(e.clientX,e.clientY),this.render),i=this.scene.ensureLists();for(let e=i.length-1;e>=0;--e){let r=i[e];if(this.accepts(r)){let e=this.getBounds(r);if(e!==null&&this.containsPoint(e,n)){let e=J(r);for(let i of e)if(S(i,n)){t.push(r);break}}}}}return t}containsPoint(e,t){let n=e.world;return t.x>=n.x&&t.x<=n.x+n.width&&t.y>=n.y&&t.y<=n.y+n.height}matchesBounds(e,t){let n=e.world,r=n.x,i=n.y,a=r+n.width,o=i+n.height;return a>=t.minX&&r<=t.maxX&&o>=t.minY&&i<=t.maxY}Selector(e){let t=[],n=V(e);if(this.selector&&n!==void 0){let r=this.selectionMode===`all`||this.selectionMode===`left`,i=this.scene.ensureLists();for(let a=i.length-1;a>=0;--a){let o=i[a];if(this.accepts(o)&&o!==e){let e=this.getBounds(o);if(e!==null&&this.matchesBounds(e,n.bounds)){let e=J(o),i=!1;r&&e.length>0?i=U(n,e):e.length>0&&(i=W(n,e)),i&&t.push(o)}}}}return t}},Z=class extends X{constructor(e,t,n,r=!0){super(e,t,n,`Base2D`,r)}},Q=class{scene;render;camera;_radius;picker=!0;constructor(e,t,n,r=8){this.scene=e,this.render=t,this.camera=n,this._radius=8,this.radius=r}get radius(){return this._radius}set radius(e){if(Number.isFinite(e)&&e>=0)this._radius=e;else throw RangeError(`LineSelectTool radius must be finite and nonnegative.`)}SelectPicker(e){let t=[];if(this.picker&&G(e,this.render)){let n={x:e.clientX,y:e.clientY},r=this._radius*this._radius,i=this.scene.ensureLists();for(let e=i.length-1;e>=0;--e){let o=i[e];if(o instanceof l&&!(o instanceof a)){let e=ne(o);for(let i of e){let e=C(n,q(i.start,this.camera,this.render),q(i.end,this.camera,this.render));e<=r&&t.push({mesh:o,edgeIndex:i.index,contourIndex:i.contourIndex,start:i.start,end:i.end,distance:Math.sqrt(e)})}}}}return t}},$=class extends X{constructor(e,t,n,r=!0){super(e,t,n,`NGon2D`,r)}},re=class{scene;render;camera;_radius;picker=!0;constructor(e,t,n,r=8){this.scene=e,this.render=t,this.camera=n,this._radius=8,this.radius=r}get radius(){return this._radius}set radius(e){if(Number.isFinite(e)&&e>=0)this._radius=e;else throw RangeError(`PointSelectTool radius must be finite and nonnegative.`)}SelectPicker(e){let t=[];if(this.picker&&G(e,this.render)){let n={x:e.clientX,y:e.clientY},r=this._radius*this._radius,i=this.scene.ensureLists();for(let e=i.length-1;e>=0;--e){let o=i[e];if(o instanceof l&&!(o instanceof a)){let e=te(o);for(let i of e){let e=q(i.position,this.camera,this.render),a=n.x-e.x,s=n.y-e.y,c=a*a+s*s;c<=r&&t.push({mesh:o,vertexIndex:i.index,contourIndex:i.contourIndex,position:i.position,distance:Math.sqrt(c)})}}}}return t}},ie=class extends X{constructor(e,t,n,r=!0){super(e,t,n,`Poly2D`,r)}},ae=class{scene;render;camera;picker=!0;selector=!0;selectionMode=`all`;constructor(e,t,n){this.scene=e,this.render=t,this.camera=n}SelectPicker(e){let t=[];if(this.picker){let n=this.render.canvas.getBoundingClientRect();if(n.width>0&&n.height>0&&e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom){let n=new r(e.clientX,e.clientY),i=this.camera.windowToWorld(n,this.render),o=this.scene.ensureLists();for(let e=o.length-1;e>=0;--e){let n=o[e];if(n instanceof l&&!(n instanceof a)){let e=M(n);e!==void 0&&N(e,i)&&t.push(n)}}}}return t}Selector(e){let t=V(e),n=[];if(this.selector&&t!==void 0){let r=this.selectionMode===`all`||this.selectionMode===`left`,i=this.scene.ensureLists();for(let o=i.length-1;o>=0;--o){let s=i[o];if(s instanceof l&&!(s instanceof a)&&s!==e){let e=M(s);if(e!==void 0){let i,a=e.bounds.maxX>=t.bounds.minX&&e.bounds.minX<=t.bounds.maxX&&e.bounds.maxY>=t.bounds.minY&&e.bounds.minY<=t.bounds.maxY;i=a&&t.rectangle!==void 0&&r?I(t.rectangle,e):a&&t.rectangle!==void 0?L(t.rectangle,e):a&&r?U(t,H(e)):a?W(t,H(e)):!1,i&&n.push(s)}}}}return n}},oe=class e{static RectSelectTool=ae;static NGonSelectTool=$;static PolySelectTool=ie;static BaseSelectTool=Z;static LineSelectTool=Q;static PointSelectTool=re;static resultDrawLists=new WeakMap;scene;rectSelectTool;ngonSelectTool;polySelectTool;baseSelectTool;lineSelectTool;pointSelectTool;_rectPicker=!0;_rectSelector=!0;_ngonPicker=!0;_ngonSelector=!0;_polyPicker=!0;_polySelector=!0;_basePicker=!0;_baseSelector=!0;_linePicker=!0;_pointPicker=!0;_selectionMode=`all`;constructor(e,t,n){this.scene=e,this.rectSelectTool=new ae(e,t,n),this.ngonSelectTool=new $(e,t,n,!1),this.polySelectTool=new ie(e,t,n,!1),this.baseSelectTool=new Z(e,t,n,!1),this.lineSelectTool=new Q(e,t,n),this.pointSelectTool=new re(e,t,n),this.enableBounding()}enableBounding(){for(let e of this.scene.ensureLists())if(e instanceof l&&!(e instanceof a)){let t=e.data?.type;(t===`NGon2D`||t===`Poly2D`||t===`Base2D`)&&(e.bounding||=!0)}}SelectPicker(t){this.enableBounding();let n={Rect2D:this.rectSelectTool.SelectPicker(t),NGon:this.ngonSelectTool.SelectPicker(t),Poly2D:this.polySelectTool.SelectPicker(t),Base2D:this.baseSelectTool.SelectPicker(t),Line:this.lineSelectTool.SelectPicker(t),Point:this.pointSelectTool.SelectPicker(t)};return e.resultDrawLists.set(n,this.getOrdinaryDrawList()),n}Selector(t){this.enableBounding();let n={Rect2D:this.rectSelectTool.Selector(t),NGon:this.ngonSelectTool.Selector(t),Poly2D:this.polySelectTool.Selector(t),Base2D:this.baseSelectTool.Selector(t),Line:[],Point:[]};return e.resultDrawLists.set(n,this.getOrdinaryDrawList()),n}getOrdinaryDrawList(){let e=[];for(let t of this.scene.ensureLists())t instanceof l&&!(t instanceof a)&&e.push(t);return e}static Sort(t,n=`desc`){let r=new Set;for(let e of t.Rect2D)r.add(e);for(let e of t.NGon)r.add(e);for(let e of t.Poly2D)r.add(e);for(let e of t.Base2D)r.add(e);for(let e of t.Line)r.add(e.mesh);for(let e of t.Point)r.add(e.mesh);let i=new Map,a=e.resultDrawLists.get(t);if(a!==void 0)for(let e=0;e<a.length;e+=1)i.set(a[e],e);let o=Array.from(r);return o.sort((e,t)=>{let r=-1,a=-1;e.material!==void 0&&(r=+!e.material.depthTest),t.material!==void 0&&(a=+!t.material.depthTest);let o=r-a;if(o===0){let n=i.get(e),r=i.get(t);o=n!==void 0&&r!==void 0?n-r:e.order-t.order}return n===`desc`?-o:o}),o}get rectPicker(){return this._rectPicker}set rectPicker(e){this._rectPicker=e,this.rectSelectTool.picker=e}get rectSelector(){return this._rectSelector}set rectSelector(e){this._rectSelector=e,this.rectSelectTool.selector=e}get ngonPicker(){return this._ngonPicker}set ngonPicker(e){this._ngonPicker=e,this.ngonSelectTool.picker=e}get ngonSelector(){return this._ngonSelector}set ngonSelector(e){this._ngonSelector=e,this.ngonSelectTool.selector=e}get polyPicker(){return this._polyPicker}set polyPicker(e){this._polyPicker=e,this.polySelectTool.picker=e}get polySelector(){return this._polySelector}set polySelector(e){this._polySelector=e,this.polySelectTool.selector=e}get basePicker(){return this._basePicker}set basePicker(e){this._basePicker=e,this.baseSelectTool.picker=e}get baseSelector(){return this._baseSelector}set baseSelector(e){this._baseSelector=e,this.baseSelectTool.selector=e}get linePicker(){return this._linePicker}set linePicker(e){this._linePicker=e,this.lineSelectTool.picker=e}get pointPicker(){return this._pointPicker}set pointPicker(e){this._pointPicker=e,this.pointSelectTool.picker=e}get selectionMode(){return this._selectionMode}set selectionMode(e){this._selectionMode=e,this.rectSelectTool.selectionMode=e,this.ngonSelectTool.selectionMode=e,this.polySelectTool.selectionMode=e,this.baseSelectTool.selectionMode=e}},se=`import { BaseMaterial, Mesh, NGon2D, Poly2D, Rect2D, Scene, Style } from "bplinejs";

/**
 * Populate a small mixed scene for both selection previews.
 * @param scene Scene that will own the generated meshes.
 * @param advanced Include Poly2D meshes in the full API preview.
 * @example
 * createModels(scene, true);
 * @returns No value.
 */
export const createModels = (scene: Scene, advanced: boolean): void => {
    const colors = ["#4fd1c5", "#8b9cff", "#d691ed"];

    // The short preview keeps two shape constructors; the full preview adds concave polygons.
    for (let index = 0; index < 24; index += 1) {
        let kind = index % 2;
        // The advanced result includes a third face group for Poly2D.
        if (advanced) {
            kind = index % 3;
        }
        const size = 23 + Math.random() * 17;
        const style = new Style();
        style.solid.enabled = true;
        style.solid.color.setHex(colors[kind]);
        style.edge.width = 4;
        style.edge.color.setHex("#ffeb57");

        let geometry: Rect2D | NGon2D | Poly2D;
        // Each mesh owns its style so highlighting one result leaves the others unchanged.
        if (kind === 0) {
            geometry = new Rect2D({ width: size * 2, height: size * 1.5, radius: 7, style });
        } else {
            // NGons provide a variable edge count; the last case exercises a concave outline.
            if (kind === 1) {
                geometry = new NGon2D({ outer: size, sides: 3 + Math.floor(Math.random() * 6), style });
            } else {
                geometry = new Poly2D(new Float32Array([-size, -size, size, -size, size * 0.3, size, -size, size]), style);
            }
        }

        const material = new BaseMaterial();
        material.cullMode = "none";
        const mesh = new Mesh(geometry, material);
        mesh.style = style;
        mesh.position.set((Math.random() - 0.5) * 280, (Math.random() - 0.5) * 300);
        mesh.rotation = (Math.random() - 0.5) * 0.6;
        scene.add(mesh);
    }
};
`,ce=`import {
    BaseMaterial,
    Camera,
    CameraControl,
    Mesh,
    NGon2D,
    Poly2D,
    Rect2D,
    Render,
    Scene,
    Select,
} from "bplinejs";
import type { SelectResult } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";
import { createModels } from "./models.ts";

type SelectionShape = "point" | "rect" | "poly" | "ngon";
type Coverage = "cad" | "all" | "any";

/**
 * Mount either the short click example or the full selection API example.
 * @param options Preview host, GUI host, preview mode, and error callback.
 * @example
 * const dispose = mountSelectScene(options);
 * @returns Cleanup for GPU resources, controls, and event listeners.
 */
export const mountSelectScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0.055, g: 0.075, b: 0.13, a: 1 };
    const scene = new Scene();
    createModels(scene, options.advanced);
    const camera = new Camera();
    camera.zoom = 1.08;
    const select = new Select(scene, render, camera);
    let control: CameraControl | undefined;
    // The short example is intentionally limited to click selection.
    if (options.advanced) {
        control = new CameraControl(camera, render);
    }
    const parameters: { shape: SelectionShape; coverage: Coverage } = { shape: "point", coverage: "cad" };
    let gui: GUI | undefined;
    let highlighted: Mesh[] = [];
    const originalOrders = new Map<Mesh, number>();
    let dragStart: Vec2 | undefined;
    let dragPointerId: number | undefined;
    const polyPoints: Vec2[] = [];
    let animationFrame = 0;
    let mounted = true;

    const status = document.createElement("div");
    status.style.cssText = "position:absolute;left:8px;top:8px;z-index:2;pointer-events:none;color:#fff;background:#111a2bcc;padding:5px 8px;border-radius:5px;font:11px/1.4 sans-serif;white-space:pre-line";
    status.textContent = "Click a shape to select";
    options.container.appendChild(status);

    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.style.cssText = "position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible";
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("fill", "#ffeb5726");
    outline.setAttribute("stroke", "#ffeb57");
    outline.setAttribute("stroke-width", "2");
    outline.setAttribute("stroke-dasharray", "5 4");
    overlay.appendChild(outline);
    options.container.appendChild(overlay);

    /**
     * Keep the selection outline aligned with the camera and canvas cell.
     * @param points World-space outline points.
     * @param closed Whether to join the last point back to the first.
     * @example
     * showOutline(points, true);
     * @returns No value.
     */
    const showOutline = (points: readonly Vec2[], closed: boolean): void => {
        const bounds = options.container.getBoundingClientRect();
        const commands: string[] = [];
        // Project every world vertex so camera panning and zoom keep the preview accurate.
        for (let index = 0; index < points.length; index += 1) {
            const projected = camera.worldToWindow(points[index], render);
            let command = "L";
            // The first vertex starts the SVG path; later vertices extend it.
            if (index === 0) {
                command = "M";
            }
            commands.push(\`\${command}\${String(projected.x - bounds.left)} \${String(projected.y - bounds.top)}\`);
        }
        // Three or more vertices can show a filled selection area.
        if (closed && points.length >= 3) {
            commands.push("Z");
        }
        outline.setAttribute("d", commands.join(" "));
    };

    /**
     * Convert a browser pointer position into the world used by selection meshes.
     * @param event Mouse or pointer event in viewport coordinates.
     * @example
     * const world = worldAt(event);
     * @returns World position beneath the pointer.
     */
    const worldAt = (event: MouseEvent): Vec2 => {
        return camera.windowToWorld(new Vec2(event.clientX, event.clientY), render);
    };

    /**
     * Turn a center and radius into the same 100-sided contour used by NGon2D.
     * @param center World-space center.
     * @param radius World-space radius.
     * @example
     * showOutline(circlePoints(center, 40), true);
     * @returns One hundred outline vertices.
     */
    const circlePoints = (center: Vec2, radius: number): Vec2[] => {
        const points: Vec2[] = [];
        // Preview and geometry share the same vertex count and initial angle.
        for (let index = 0; index < 100; index += 1) {
            const angle = index * Math.PI * 2 / 100;
            points.push(new Vec2(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)));
        }
        return points;
    };

    /**
     * Remove the last highlight and restore each mesh's original draw order.
     * @example
     * clearSelection();
     * @returns No value.
     */
    const clearSelection = (): void => {
        // Restore both style and order so successive picks do not accumulate highlights.
        for (const mesh of highlighted) {
            // Some external meshes may lack a Style, but still appear in a result.
            if (mesh.style !== undefined) {
                mesh.style.edge.enabled = false;
            }
            const originalOrder = originalOrders.get(mesh);
            // The simple preview never changes order, so only advanced results have a saved value.
            if (originalOrder !== undefined) {
                mesh.order = originalOrder;
            }
        }
        highlighted = [];
        originalOrders.clear();
    };

    /**
     * Apply a Select result to the preview using the same yellow border in both modes.
     * @param result Grouped face, edge, and vertex hits.
     * @example
     * showSelection(select.SelectPicker(event));
     * @returns No value.
     */
    const showSelection = (result: SelectResult): void => {
        clearSelection();
        // Advanced mode demonstrates Select.Sort; simple mode keeps only grouped face hits.
        if (options.advanced) {
            highlighted = Select.Sort(result);
        } else {
            // The short example only demonstrates grouped face picking, without sorting or layer changes.
            highlighted = [...result.Rect2D, ...result.NGon, ...result.Poly2D, ...result.Base2D];
        }
        // Yellow borders are the visual feedback in both preview modes.
        for (const mesh of highlighted) {
            // A valid style can expose a generated edge for this individual mesh.
            if (mesh.style !== undefined) {
                mesh.style.edge.enabled = true;
            }
            // Only the full API preview changes scene draw order.
            if (options.advanced) {
                originalOrders.set(mesh, mesh.order);
                mesh.order = 1;
            }
        }
        status.textContent = \`\${String(highlighted.length)} selected\`;
    };

    /**
     * Build a temporary selection mesh outside the displayed scene.
     * @param geometry Fill geometry describing the area.
     * @param x World-space X position.
     * @param y World-space Y position.
     * @example
     * selectArea(new Rect2D({ width: 100, height: 80 }), 0, 0);
     * @returns No value.
     */
    const selectArea = (geometry: Rect2D | Poly2D | NGon2D, x: number, y: number): void => {
        const frame = new Mesh(geometry, new BaseMaterial(), false);
        frame.position.set(x, y);
        showSelection(select.Selector(frame));
    };

    /**
     * Refresh the current drag outline in world space.
     * @param pointer Latest browser pointer position.
     * @example
     * previewDrag(event);
     * @returns No value.
     */
    const previewDrag = (pointer: MouseEvent): void => {
        // A pending drag is the only gesture with a temporary drag outline.
        if (dragStart !== undefined) {
            const start = camera.windowToWorld(dragStart, render);
            const end = worldAt(pointer);
            // Rectangles use opposite corners in world coordinates.
            if (parameters.shape === "rect") {
                showOutline([
                    new Vec2(start.x, start.y),
                    new Vec2(end.x, start.y),
                    new Vec2(end.x, end.y),
                    new Vec2(start.x, end.y),
                ], true);
            } else {
                // The circle preview follows the same center and radius as its NGon mesh.
                if (parameters.shape === "ngon") {
                    const radius = Math.hypot(end.x - start.x, end.y - start.y);
                    showOutline(circlePoints(start, radius), true);
                }
            }
        }
    };

    /**
     * Switch between point picking and the three area gestures.
     * @example
     * gui.add(parameters, "shape").onChange(changeShape);
     * @returns No value.
     */
    const changeShape = (): void => {
        dragStart = undefined;
        dragPointerId = undefined;
        polyPoints.length = 0;
        outline.setAttribute("d", "");
        // Camera panning gives the left button to area creation and the polygon's right button to closure.
        if (control !== undefined) {
            control.leftDrag = parameters.shape === "point";
            // Right click closes a polygon, while the other modes retain right-button camera panning.
            control.rightDrag = parameters.shape !== "poly";
        }
        // Keep the in-canvas instruction aligned with the selected gesture.
        if (parameters.shape === "point") {
            status.textContent = "Click to select · drag to pan";
        } else {
            // Polygon closure uses the right button, while drag frames leave it for the camera.
            if (parameters.shape === "poly") {
                status.textContent = "Left click: add vertex · right click: close";
            } else {
                status.textContent = "Left drag: select · right drag: pan";
            }
        }
    };

    /**
     * Pick with the unified Select API when the current gesture is a click.
     * @param event Canvas click event.
     * @example
     * options.container.addEventListener("click", handleClick);
     * @returns No value.
     */
    const handleClick = (event: MouseEvent): void => {
        // CameraControl can retarget a captured click to the container.
        if (parameters.shape === "point" && (event.target === render.canvas || event.target === options.container)) {
            showSelection(select.SelectPicker(event));
        }
    };

    /**
     * Start a rectangle/circle drag or add one polygon vertex.
     * @param event Pointer event on the canvas.
     * @example
     * options.container.addEventListener("pointerdown", handlePointerDown);
     * @returns No value.
     */
    const handlePointerDown = (event: PointerEvent): void => {
        // GUI clicks and touch gestures belong to their own controls.
        if (options.advanced && event.pointerType !== "touch" && event.target === render.canvas) {
            // Polygon vertices are committed one click at a time.
            if (parameters.shape === "poly") {
                // Left adds a node and right ends the contour.
                if (event.button === 0) {
                    polyPoints.push(worldAt(event));
                    showOutline(polyPoints, polyPoints.length >= 3);
                    status.textContent = \`\${String(polyPoints.length)} vertices · right click to close\`;
                    event.preventDefault();
                } else {
                    // Right-click closure does not start camera panning.
                    if (event.button === 2) {
                        finishPolygon();
                        event.preventDefault();
                    }
                }
            } else {
                // Rectangle and circle gestures begin at the pressed world point.
                if (parameters.shape !== "point" && event.button === 0) {
                    dragStart = new Vec2(event.clientX, event.clientY);
                    dragPointerId = event.pointerId;
                    previewDrag(event);
                    options.container.setPointerCapture(event.pointerId);
                    event.preventDefault();
                }
            }
        }
    };

    /**
     * Close the clicked polygon and submit its filled area to Select.
     * @example
     * finishPolygon();
     * @returns No value.
     */
    const finishPolygon = (): void => {
        // Fewer than three nodes cannot define a filled selection region.
        if (polyPoints.length >= 3) {
            const coordinates = new Float32Array(polyPoints.length * 2);
            // Poly2D accepts interleaved world coordinates; its temporary Mesh stays at the origin.
            for (let index = 0; index < polyPoints.length; index += 1) {
                coordinates[index * 2] = polyPoints[index].x;
                coordinates[index * 2 + 1] = polyPoints[index].y;
            }
            // The CAD direction option has no drag direction for a clicked polygon.
            if (parameters.coverage === "any") {
                select.selectionMode = "any";
            } else {
                select.selectionMode = "all";
            }
            selectArea(new Poly2D(coordinates), 0, 0);
        }
        polyPoints.length = 0;
        outline.setAttribute("d", "");
    };

    /**
     * Update the active frame or the next polygon segment.
     * @param event Moving pointer.
     * @example
     * window.addEventListener("pointermove", handlePointerMove);
     * @returns No value.
     */
    const handlePointerMove = (event: PointerEvent): void => {
        // A captured drag takes precedence over a polygon's rubber-band segment.
        if (dragPointerId === event.pointerId && dragStart !== undefined) {
            previewDrag(event);
        } else {
            // Hover previews the next edge without committing another vertex.
            if (parameters.shape === "poly" && polyPoints.length > 0 && event.pointerType !== "touch") {
                showOutline([...polyPoints, worldAt(event)], false);
            }
        }
    };

    /**
     * Turn a completed drag into a rectangle or a 100-sided circular area.
     * @param event Released pointer.
     * @example
     * window.addEventListener("pointerup", handlePointerUp);
     * @returns No value.
     */
    const handlePointerUp = (event: PointerEvent): void => {
        // Ignore pointer releases that do not belong to this area drag.
        if (dragStart !== undefined && dragPointerId === event.pointerId) {
            const startPointer = dragStart;
            dragStart = undefined;
            dragPointerId = undefined;
            outline.setAttribute("d", "");
            // Release the pointer so normal clicks resume after this drag.
            if (options.container.hasPointerCapture(event.pointerId)) {
                options.container.releasePointerCapture(event.pointerId);
            }
            const distance = Math.hypot(event.clientX - startPointer.x, event.clientY - startPointer.y);
            // A very short drag remains a point pick.
            if (distance <= 3) {
                showSelection(select.SelectPicker(event));
            } else {
                const start = camera.windowToWorld(startPointer, render);
                const end = worldAt(event);
                // CAD mode uses horizontal rectangle drag direction; other areas use explicit coverage.
                if (parameters.coverage === "cad" && parameters.shape === "rect") {
                    // The first side of a left-to-right drag must fully contain a candidate.
                    if (event.clientX >= startPointer.x) {
                        select.selectionMode = "left";
                    } else {
                        select.selectionMode = "right";
                    }
                } else {
                    // Any overlap is shared by all three selection shapes.
                    if (parameters.coverage === "any") {
                        select.selectionMode = "any";
                    } else {
                        select.selectionMode = "all";
                    }
                }
                // The release creates exactly one invisible selection Mesh.
                if (parameters.shape === "rect") {
                    const width = Math.abs(end.x - start.x);
                    const height = Math.abs(end.y - start.y);
                    // A zero-area rectangle cannot select a filled mesh.
                    if (width > 0 && height > 0) {
                        selectArea(new Rect2D({ width, height }), (start.x + end.x) / 2, (start.y + end.y) / 2);
                    }
                } else {
                    // A 100-sided NGon approximates a circular area around the pressed point.
                    if (parameters.shape === "ngon") {
                        const radius = Math.hypot(end.x - start.x, end.y - start.y);
                        // Avoid passing a degenerate radius to the selection algorithm.
                        if (radius > 0) {
                            selectArea(new NGon2D({ outer: radius, sides: 100 }), start.x, start.y);
                        }
                    }
                }
            }
        }
    };

    /**
     * Drop an interrupted drag without selecting a partly drawn area.
     * @param event Cancelled pointer.
     * @example
     * window.addEventListener("pointercancel", handlePointerCancel);
     * @returns No value.
     */
    const handlePointerCancel = (event: PointerEvent): void => {
        // An unrelated pointer cannot cancel the active frame.
        if (dragPointerId === event.pointerId) {
            dragStart = undefined;
            dragPointerId = undefined;
            outline.setAttribute("d", "");
        }
    };

    /**
     * Reserve the context-menu gesture for closing a polygon.
     * @param event Browser context-menu event.
     * @example
     * options.container.addEventListener("contextmenu", handleContextMenu);
     * @returns No value.
     */
    const handleContextMenu = (event: MouseEvent): void => {
        // The polygon's right-click closure should not open the browser menu.
        if (parameters.shape === "poly") {
            event.preventDefault();
        }
    };

    /**
     * Resize the canvas and align the camera's physical-pixel viewport.
     * @example
     * resizeObserver.observe(options.container);
     * @returns No value.
     */
    const updateViewport = (): void => {
        render.resize();
        const bounds = options.container.getBoundingClientRect();
        camera.setViewport(Math.max(1, bounds.width * render.dpr), Math.max(1, bounds.height * render.dpr));
        overlay.setAttribute("width", String(bounds.width));
        overlay.setAttribute("height", String(bounds.height));
    };
    const resizeObserver = new ResizeObserver(updateViewport);

    // Only the full API preview exposes selection switches and tolerances.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Select", width: 200 });
        gui.add(parameters, "shape", { Pick: "point", Rectangle: "rect", Polygon: "poly", Circle: "ngon" }).name("Gesture").onChange(changeShape);
        gui.add(parameters, "coverage", { "CAD direction": "cad", "Fully inside": "all", "Any overlap": "any" }).name("Coverage");
        gui.add(select, "rectPicker").name("Rect pick");
        gui.add(select, "ngonPicker").name("NGon pick");
        gui.add(select, "polyPicker").name("Poly pick");
        gui.add(select, "linePicker").name("Edge pick");
        gui.add(select, "pointPicker").name("Vertex pick");
        gui.add(select.lineSelectTool, "radius", 0, 25, 1).name("Edge radius");
        gui.add(select.pointSelectTool, "radius", 0, 25, 1).name("Vertex radius");
    } else {
        select.linePicker = false;
        select.pointPicker = false;
    }

    options.container.addEventListener("click", handleClick);
    options.container.addEventListener("pointerdown", handlePointerDown);
    options.container.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    resizeObserver.observe(options.container);

    /**
     * Draw continuously while the preview remains mounted.
     * @example
     * animationFrame = requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A stale animation callback must not draw after React unmounts its canvas.
        if (mounted) {
            // The short preview has no camera controller.
            if (control !== undefined) {
                control.update();
            }
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start rendering after WebGPU initialization.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // Device creation can resolve after the route has already unmounted.
        if (mounted) {
            updateViewport();
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Report an initialization failure to the preview cell.
     * @param error WebGPU failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // Ignore late failures from an already disposed render instance.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release all browser listeners, controls, and GPU resources for this cell.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        options.container.removeEventListener("click", handleClick);
        options.container.removeEventListener("pointerdown", handlePointerDown);
        options.container.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
        clearSelection();
        // GUI and CameraControl each own browser listeners.
        if (gui !== undefined) {
            gui.destroy();
        }
        // Dispose only the controller created for the advanced preview.
        if (control !== undefined) {
            control.dispose();
        }
        overlay.remove();
        status.remove();
        render.destroy();
    };
    return dispose;
};
`,le=`import { BaseMaterial, Camera, Mesh, NGon2D, Rect2D, Render, Scene, Select, Style } from "bplinejs";

const scene = new Scene();
const colors = ["#4fd1c5", "#8b9cff"];
for (let index = 0; index < 24; index += 1) {
    const size = 23 + Math.random() * 17;
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(colors[index % 2]);
    style.edge.color.setHex("#ffeb57");
    style.edge.width = 4;
    let shape;
    if (index % 2 === 0) {
        shape = new Rect2D({ width: size * 2, height: size * 1.5, radius: 7, style });
    } else {
        shape = new NGon2D({ outer: size, sides: 3 + Math.floor(Math.random() * 6), style });
    }
    const material = new BaseMaterial();
    material.cullMode = "none";
    const mesh = new Mesh(shape, material);
    mesh.style = style;
    mesh.position.set((Math.random() - 0.5) * 280, (Math.random() - 0.5) * 300);
    mesh.rotation = (Math.random() - 0.5) * 0.6;
    scene.add(mesh);
}

const render = new Render(container);
await render.ready;
render.resize();
const bounds = container.getBoundingClientRect();
const camera = new Camera(bounds.width * render.dpr, bounds.height * render.dpr, 1.08);
const select = new Select(scene, render, camera);
select.linePicker = false;
select.pointPicker = false;
render.container.addEventListener("click", (event) => {
    const hits = select.SelectPicker(event);
    for (const mesh of scene.drawList) {
        if (mesh instanceof Mesh && mesh.style) {
            mesh.style.edge.enabled = false;
        }
    }
    for (const mesh of [...hits.Rect2D, ...hits.NGon, ...hits.Poly2D, ...hits.Base2D]) {
        if (mesh.style) {
            mesh.style.edge.enabled = true;
        }
    }
});
const draw = () => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`,ue=`// models.ts\n${se}\n\n// scene.ts\n${ce}`,de=(e,t)=>{let n=[`#4fd1c5`,`#8b9cff`,`#d691ed`];for(let r=0;r<24;r+=1){let i=r%2;t&&(i=r%3);let a=23+Math.random()*17,o=new s;o.solid.enabled=!0,o.solid.color.setHex(n[i]),o.edge.width=4,o.edge.color.setHex(`#ffeb57`);let c;c=i===0?new p({width:a*2,height:a*1.5,radius:7,style:o}):i===1?new _({outer:a,sides:3+Math.floor(Math.random()*6),style:o}):new h(new Float32Array([-a,-a,a,-a,a*.3,a,-a,a]),o);let u=new v;u.cullMode=`none`;let d=new l(c,u);d.style=o,d.position.set((Math.random()-.5)*280,(Math.random()-.5)*300),d.rotation=(Math.random()-.5)*.6,e.add(d)}},fe=e=>{let t=new u(e.container,`production`);t.backgroundColor={r:.055,g:.075,b:.13,a:1};let n=new c;de(n,e.advanced);let i=new o;i.zoom=1.08;let a=new oe(n,t,i),s;e.advanced&&(s=new ee(i,t));let f={shape:`point`,coverage:`cad`},m,g=[],y=new Map,b,x,S=[],C=0,w=!0,T=document.createElement(`div`);T.style.cssText=`position:absolute;left:8px;top:8px;z-index:2;pointer-events:none;color:#fff;background:#111a2bcc;padding:5px 8px;border-radius:5px;font:11px/1.4 sans-serif;white-space:pre-line`,T.textContent=`Click a shape to select`,e.container.appendChild(T);let E=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);E.style.cssText=`position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible`;let D=document.createElementNS(`http://www.w3.org/2000/svg`,`path`);D.setAttribute(`fill`,`#ffeb5726`),D.setAttribute(`stroke`,`#ffeb57`),D.setAttribute(`stroke-width`,`2`),D.setAttribute(`stroke-dasharray`,`5 4`),E.appendChild(D),e.container.appendChild(E);let O=(n,r)=>{let a=e.container.getBoundingClientRect(),o=[];for(let e=0;e<n.length;e+=1){let r=i.worldToWindow(n[e],t),s=`L`;e===0&&(s=`M`),o.push(`${s}${String(r.x-a.left)} ${String(r.y-a.top)}`)}r&&n.length>=3&&o.push(`Z`),D.setAttribute(`d`,o.join(` `))},k=e=>i.windowToWorld(new r(e.clientX,e.clientY),t),A=(e,t)=>{let n=[];for(let i=0;i<100;i+=1){let a=i*Math.PI*2/100;n.push(new r(e.x+t*Math.cos(a),e.y+t*Math.sin(a)))}return n},j=()=>{for(let e of g){e.style!==void 0&&(e.style.edge.enabled=!1);let t=y.get(e);t!==void 0&&(e.order=t)}g=[],y.clear()},M=t=>{j(),g=e.advanced?oe.Sort(t):[...t.Rect2D,...t.NGon,...t.Poly2D,...t.Base2D];for(let t of g)t.style!==void 0&&(t.style.edge.enabled=!0),e.advanced&&(y.set(t,t.order),t.order=1);T.textContent=`${String(g.length)} selected`},N=(e,t,n)=>{let r=new l(e,new v,!1);r.position.set(t,n),M(a.Selector(r))},P=e=>{if(b!==void 0){let n=i.windowToWorld(b,t),a=k(e);if(f.shape===`rect`)O([new r(n.x,n.y),new r(a.x,n.y),new r(a.x,a.y),new r(n.x,a.y)],!0);else if(f.shape===`ngon`){let e=Math.hypot(a.x-n.x,a.y-n.y);O(A(n,e),!0)}}},F=()=>{b=void 0,x=void 0,S.length=0,D.setAttribute(`d`,``),s!==void 0&&(s.leftDrag=f.shape===`point`,s.rightDrag=f.shape!==`poly`),f.shape===`point`?T.textContent=`Click to select · drag to pan`:f.shape===`poly`?T.textContent=`Left click: add vertex · right click: close`:T.textContent=`Left drag: select · right drag: pan`},I=n=>{f.shape===`point`&&(n.target===t.canvas||n.target===e.container)&&M(a.SelectPicker(n))},L=n=>{e.advanced&&n.pointerType!==`touch`&&n.target===t.canvas&&(f.shape===`poly`?n.button===0?(S.push(k(n)),O(S,S.length>=3),T.textContent=`${String(S.length)} vertices · right click to close`,n.preventDefault()):n.button===2&&(R(),n.preventDefault()):f.shape!==`point`&&n.button===0&&(b=new r(n.clientX,n.clientY),x=n.pointerId,P(n),e.container.setPointerCapture(n.pointerId),n.preventDefault()))},R=()=>{if(S.length>=3){let e=new Float32Array(S.length*2);for(let t=0;t<S.length;t+=1)e[t*2]=S[t].x,e[t*2+1]=S[t].y;f.coverage===`any`?a.selectionMode=`any`:a.selectionMode=`all`,N(new h(e),0,0)}S.length=0,D.setAttribute(`d`,``)},z=e=>{x===e.pointerId&&b!==void 0?P(e):f.shape===`poly`&&S.length>0&&e.pointerType!==`touch`&&O([...S,k(e)],!1)},B=n=>{if(b!==void 0&&x===n.pointerId){let r=b;if(b=void 0,x=void 0,D.setAttribute(`d`,``),e.container.hasPointerCapture(n.pointerId)&&e.container.releasePointerCapture(n.pointerId),Math.hypot(n.clientX-r.x,n.clientY-r.y)<=3)M(a.SelectPicker(n));else{let e=i.windowToWorld(r,t),o=k(n);if(f.coverage===`cad`&&f.shape===`rect`?n.clientX>=r.x?a.selectionMode=`left`:a.selectionMode=`right`:f.coverage===`any`?a.selectionMode=`any`:a.selectionMode=`all`,f.shape===`rect`){let t=Math.abs(o.x-e.x),n=Math.abs(o.y-e.y);t>0&&n>0&&N(new p({width:t,height:n}),(e.x+o.x)/2,(e.y+o.y)/2)}else if(f.shape===`ngon`){let t=Math.hypot(o.x-e.x,o.y-e.y);t>0&&N(new _({outer:t,sides:100}),e.x,e.y)}}}},V=e=>{x===e.pointerId&&(b=void 0,x=void 0,D.setAttribute(`d`,``))},H=e=>{f.shape===`poly`&&e.preventDefault()},U=()=>{t.resize();let n=e.container.getBoundingClientRect();i.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr)),E.setAttribute(`width`,String(n.width)),E.setAttribute(`height`,String(n.height))},W=new ResizeObserver(U);e.advanced&&e.guiContainer?(m=new d({autoPlace:!1,container:e.guiContainer,title:`Select`,width:200}),m.add(f,`shape`,{Pick:`point`,Rectangle:`rect`,Polygon:`poly`,Circle:`ngon`}).name(`Gesture`).onChange(F),m.add(f,`coverage`,{"CAD direction":`cad`,"Fully inside":`all`,"Any overlap":`any`}).name(`Coverage`),m.add(a,`rectPicker`).name(`Rect pick`),m.add(a,`ngonPicker`).name(`NGon pick`),m.add(a,`polyPicker`).name(`Poly pick`),m.add(a,`linePicker`).name(`Edge pick`),m.add(a,`pointPicker`).name(`Vertex pick`),m.add(a.lineSelectTool,`radius`,0,25,1).name(`Edge radius`),m.add(a.pointSelectTool,`radius`,0,25,1).name(`Vertex radius`)):(a.linePicker=!1,a.pointPicker=!1),e.container.addEventListener(`click`,I),e.container.addEventListener(`pointerdown`,L),e.container.addEventListener(`contextmenu`,H),window.addEventListener(`pointermove`,z),window.addEventListener(`pointerup`,B),window.addEventListener(`pointercancel`,V),W.observe(e.container);let G=()=>{w&&(s!==void 0&&s.update(),t.render(n,i),C=requestAnimationFrame(G))};return t.ready.then(()=>{w&&(U(),C=requestAnimationFrame(G))},t=>{w&&e.onError(t)}),()=>{w=!1,cancelAnimationFrame(C),W.disconnect(),e.container.removeEventListener(`click`,I),e.container.removeEventListener(`pointerdown`,L),e.container.removeEventListener(`contextmenu`,H),window.removeEventListener(`pointermove`,z),window.removeEventListener(`pointerup`,B),window.removeEventListener(`pointercancel`,V),j(),m!==void 0&&m.destroy(),s!==void 0&&s.dispose(),E.remove(),T.remove(),t.destroy()}},pe=t(),me=({advanced:e})=>(0,pe.jsx)(i,{advanced:e,controlsId:`select-controls`,mountScene:fe}),he=()=>{let{language:t}=e(),r=n.translate(t,`example.selectTitle`);return(0,pe.jsx)(f,{title:r,shortCode:le,fullCode:ue,Preview:me})};export{he as default};