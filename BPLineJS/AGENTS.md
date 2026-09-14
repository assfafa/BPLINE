# BPLineJS Agent Guide

## Project Goal

BPLineJS is a WebGPU-first TypeScript 2D renderer focused on line, border, and editable geometry workflows. Do not turn it into a broad Three.js clone unless the project direction explicitly changes.

## Environment

- Work inside Docker container `BPLine` at `/home/pigeon/projects/BPLine/BPLineJS`.
- Run checks with `npm run check`.
- Build the example app with `npm run build:app`.
- Build publishable ESM and declarations with `npm run build:lib`.
- Inspect package contents with `npm run pack:check`.
- Do not publish npm packages or add Git remotes without an explicit request.

## Source Layout

- `src/scripts/index.ts` is the package root export.
- Each public directory owns an `index.ts` barrel.
- `src/scripts/Examples` is local test code and must not enter the library build.
- `src/scripts/Material/shaders` is internal WGSL source and is bundled by Vite.
- `lib` and `dist` are generated and must not be committed.

When adding a public class, update its local directory `index.ts`, the root `src/scripts/index.ts`, `package.json` exports when a new subpath is needed, and `docs/API.md`.

## TypeScript Style

- Use strict TypeScript, four-space indentation, double quotes, and mandatory semicolons.
- Use arrow functions instead of `function` declarations. Project-level arrow helpers use PascalCase.
- Keep classes and methods in PascalCase/camelCase conventions already used by the project; do not add aliases such as `Vector2` for `Vec2`.
- Public class members need useful JSDoc. Methods document every `@param` and non-obvious `@returns`.
- Prefer private underscore-backed state plus public getters/setters when mutation must trigger version updates.
- Do not expose underscore-prefixed fields through public interfaces.

## State And Cache Rules

- CPU meshMatrix/meshStyle caches are Map<number, ...> keyed by mesh.id. GPU matrixData/styleData remain contiguous Float32Arrays; never confuse lookup containers with GPU buffer layout.
- Material.getPipelineKey caches its final string per geometry type. Clear only when the actual base key changes; do not concatenate full Shader source strings inside every per-Mesh draw.
- Cache group(0) on each matrix buffer entry and group(1) on each style buffer entry. Compare Layout and actual GPUBuffer/TextureView/Sampler identities, not data versions. writeBuffer does not require new BindGroups. Buffer growth replaces entries; explicit resource destruction and trim must release affected bindings.
- Examples/CacheCheck.html verifies 500 ordinary Mesh bindings, stable-frame zero creation, invalidation, cleanup and IMesh growth. Do not add a separate tests folder.

- IMesh extends Mesh and renders managed or frozen records. Styles was removed; Raws.map indexes Raw records by stable ID. raw is a constructor-only choice. Never retain Vec2/Style references when raw=false, and do not automatically update frozen worlds after parent movement.

- GPU resources are scoped to one `Render` because WebGPU resources belong to its `GPUDevice`.
- Scene lists are CPU-side references; Render managers own GPU buffers, textures, samplers, and pipelines.
- Geometry and Material versions notify every Render that cached resources must be refreshed.
- Resource identity uses numeric `id`; reusable pipeline identity uses Material `key`.
- ObjectNode subscribes to Vec2/Mat3 by subscriber AND field. position.x/set/setX and scale mutations increment the node version automatically; never require setDirty. data getters are TS-readonly views; use setters/methods or explicit updateVersion for raw JS array edits.
- Geometry setters call `updateVersion()`. `ensureGeometry()` compares the CPU cache snapshot with that single version and generates arrays only when needed. `updateGeometry()` commits a version visible to every Render.
- Material changes call `updateVersion()` for one shared revision. Do not reintroduce Material/Geometry dirty flags or separate category versions. Each consumer records the revision it has processed; Pipeline keys include Shader source and fixed state.
- Removing scene nodes updates Scene lists. `Render.trim(scene)` performs reference-aware cache collection; explicit destroy methods are available for manual cleanup.

## Rendering Invariants

- Material.depthTest/depthWrite default false independently; IMesh must not modify shared Material defaults. Both fixed states belong in the Pipeline key. transparent never toggles them automatically.
- Preserve sorted Scene.drawList as layer ownership. Submit opaque tested writers in reverse order, then other tested objects forward, then untested overlays forward. No-test objects intentionally overlay depth-tested content, regardless of cross-category order.
- DepthManager assigns prefix-sum slot ranks without rewriting packed worlds/styles. group(0)/binding(5) is a 16-byte uniform [base, count, reverse, padding] of u32. Reverse opaque IMesh storage access in BOTH vertex shaders and pass the resolved index to fragments.
- Use depth32float cleared to 1, less-equal comparison (same-instance parts must overlay), depth = 1 - (rank + 1) / 2^24; at most 16777215 slots per scene. Destroy/trim meshDepth with Mesh caches and recreate the Render-owned depth texture only on physical size changes.
- Discard zero-alpha fragments before writing depth; partial alpha still requires the user to choose transparent=true and usually depthWrite=false. Warn in development about transparent depth writers and writes without testing. Do not promise automatic order-independent transparency or guaranteed early-Z performance.
- DepthManager.prepare(scene) is called by BufferManager; DrawCallManager.prepare(width,height) allocates attachments during warmup without submission. Keep the resolved instance index in a separate local value; do not overwrite a builtin input struct member.

- Keep Y-positive pointing upward.
- Mat3 GPUData pads each 3-value column to four floats. Camera matrices remain Uniform; Mesh matrices are read-only Storage arrays indexed by instance_index.
- WebGPU buffer write sizes and offsets must be multiples of four bytes.
- `warmup(scene, camera)` may prepare CPU/GPU state but must not submit a draw call.
- `render(scene, camera)` calls warmup and then draws.
- Keep development-only validation behind `renderMode === "development"`; production must avoid validation overhead.

## Git

- The default local branch is `main`.
- Never commit generated `lib`, `dist`, `node_modules`, package archives, or environment files.
- Do not rewrite user commits or use destructive reset/checkout commands.

- Rect2d accepts { width, height, radius, style }. Generation switches belong exclusively to style.solid/wireframe/edge/points.enabled, default false and independent. Do not reintroduce legacy Geometry flags or Material.lineRenderMode.
- All triangle data is merged in geometry/normal/uv/index. Do not reintroduce lineGeometry or pointsGeometry. vertexType stores 0 (solid), 0.5 (wide border), 1 (point marker), independently of Geo.type.
- position stores point centers per vertex (zero for other types), miterScale stores border expansion factors (one for other types). Rebuild the complete merged geometry on version changes and preserve uint32 indices.
- Color/Texture -> section -> Style -> Geometry/Material -> Mesh is a synchronous field-aware add/delete subscription chain. Subscribers only mark next-frame work, never generate CPU geometry or create GPU resources in callbacks. StyleSubscriber is structural and must also allow future IMesh. Geometry responds only to generation-affecting fields, Material to all fields; never put GPU resources in Style.
- Every section owns independent Color, opacity and (where applicable) texture/pixelAligned. SDF border settings belong to solid, not edge. Each Color subscription is keyed by subscriber AND field so replacing one binding cannot detach another.
- Assigning style unbinds the previous Style and invalidates the consumer version. CPU dispose() unbinds subscriptions only; Scene removal and Render GPU cache destruction must not dispose shared CPU objects.
- Point selection uses style.points.vertices/midpoints behind points.enabled. Shader visibility and appearance come from material.style, while CPU arrays come from geometry.style. Mesh constructor third argument is Style | boolean = true: true creates a new disabled Style and syncs resources, false preserves resource styles, explicit Style syncs both. Resource replacement/init reuses Mesh.style when present. Shared resource references are not cloned.
- Each instance Style entry is eleven vec4 values (176 bytes), stored in a read-only Storage array. Keep CPU and all WGSL layouts in sync. Wireframe has its own color/opacity, no fake width or zoom switch.
- Bind the per-Mesh style Storage array plus base/edge/point textures and their samplers together. Use explicit texture gradients calculated before vertexType-dependent fragment branches.
- Native linePoints remain line-list. If basic lines and point markers coexist, split the merged index range around the line draw to preserve solid/line/points order; otherwise issue one triangle draw per Mesh.
- Standard rectangle shaders live in Material/shaders/base/rect and use rectVertexShader/rectFragmentShader. Select a pipeline using material.getPipelineKey(geometry.type); do not apply rectangle SDF to other geometry types.
- Poly2D accepts optional Float32Array coordinates (empty by default), optional Style/null and optional { closed: true }. Missing Style creates disabled sections. Empty/incomplete paths generate no drawable buffers; filling and clearing points must restore/remove GPU geometry. Preserve input coordinates; open paths cannot enable solid. Allow self-crossing/touching/reversing contours; simple concave fills use ear clipping, failed remainder uses bounded fan fallback without promising Canvas fill rules. The permissive generator change requires the local BPMatrixJS build until published; beta.13 on npm still has strict validation.
- Style.join owns type=miter/round/bevel and seg=8. Notify Poly geometry versions, not Rect geometry. Bevel is a one-segment round join, not a disconnected corner. Join changes border topology only, not solid outline or line-list. IMesh Raw join does not override its shared geometry template.
- Material/shaders/base/poly uses polyVertexShader/polyFragmentShader with the same packed buffers as rect; no polygon SDF. Warn about solid.borderWidth on Poly and use edge instead. Geo.mergeGeometry is the shared merger for both shapes. Examples/PolyCheck.html validates incremental and crossing paths without replacing the user's Poly.ts click example.
- Mesh.data/material setters synchronize geometry type tags and Scene references. Track pointsTexture alongside baseTexture and edgeTexture during collection and destruction.

- Ordinary Mesh count/capacity are 1. matrixData/styleData are preallocated Float32Arrays (12/44 floats) with independent packed-data versions. IMesh count starts at 0 and capacity at 2, doubling until 100000 then growing in 100000-slot batches. GPU buffers live in meshMatrix/meshStyle; materialUniform has been removed. destroyMesh/trim release both arrays, destroyMaterial releases matching meshStyle entries by materialId.
- Mesh subscribes to Geometry and Material, detaches replacements, and packs Style only when notified. geometryPending/materialPending are consumer work flags, not additional resource versions. Mesh.dispose detaches only CPU subscriptions; removal from Scene and GPU destroy do not call it.
- Keep preparation responsibilities separate: geometryList owns geometry generation/buffers, materialList owns validation and Pipeline/Sampler preparation, drawList owns Mesh instance arrays/buffers, textureList owns GPUTexture uploads. Scene records current material/geometry-type pairs; do not create pipelines from a Material's historical type tags.
- MaterialChange separates style-array updates from resource-reference/key changes. Texture pixels and sampler changes must not reupload instance style buffers. Scene uses notifications, not a per-frame Material version scan, to refresh texture references and trim stale pipeline keys.
- Texture setter notifications are atomic for setSource/clearSource. TexturedStyle binds/unbinds Texture just like Color. Texture has a single version and updateVersion() for in-place pixels, no dirty/clearDirty API.
- ObjectNode/Camera/Scene no longer expose dirty flags or previous renderId. Scene uses one inherited version for list changes and CPU snapshots; every Render records its own SceneResourcesLike.version. Order changes currently rebuild all four lists for consistency, not separate order counters.
- ensureWorldMatrix updates ancestors without traversing siblings, then checks input version and parent matrix identity/version. Internal matrix writes suppress feedback into the input version but still notify Mesh packing. Explicit local matrices persist until transform inputs change.
- Camera uses input/world matrix snapshots; BufferManager compares Camera identity, Mat3 identity/version and zoom/dpr independently for each Render. Never force shared resources to change merely because a different Render uses them.
- IMesh.push returns stable IDs, not indices. updateAt(index, options) replaces a full snapshot. clear retains capacity but releases CPU subscriptions. Raw versions change only for input edits, not uploads or growth. Packed matrices are world-only; no duplicate local-matrix array.
- TextureResource is TextureLike | TextureLayers. Ordinary Style.texture remains one Texture; IMesh owns three deduplicated layer tables. Scene.textureList uploads arrays; DrawCall binds mesh.textures. The final style vec4 stores solid/edge/points layer indices plus padding. All texture views and shader bindings are 2d-array, even fallback/single-image resources.
- Normalize array layers to group maximum width/height, rgba8unorm. Missing/loading layers are white and retain their layer index. Validate device texture/storage limits. Explicit destroyTexture(source) invalidates containing arrays; trim must remove exact unused resources only, not cascade from unused single images into referenced arrays.
- Raw styles override appearance only, not template generation or fixed Material state. Geometry determines edge width/UV repeat and point shape/selection; Material determines shaders/blend/culling/samplers. Native line-list batches fall back to per-record ordered draws, preserving alpha composition. Merged triangles use one instanced draw.
- All examples and browser validation belong in src/scripts/Examples. Do not create a separate tests directory. Select the current example through Examples/index.ts and verify under Vite, including the user's browser when shader backend behavior differs.
