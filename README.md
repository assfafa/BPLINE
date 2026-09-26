# BPLineJS · BPMatrixJS

BPLineJS 是基于 WebGPU 的 TypeScript 二维图形渲染库，支持几何体、样式、贴图、实例化网格和相机控制。BPMatrixJS 提供二维向量、矩阵、几何生成与工具函数。

- [在线文档](https://assfafa.github.io/BPLINE/#/docs/bpline)：BPLineJS 与 BPMatrixJS 的公开 API。
- [交互案例](https://assfafa.github.io/BPLINE/#/example/basic-mesh/rectangle)：网格体、实例化、贴图和控制器案例。
- [网站首页](https://assfafa.github.io/BPLINE/)：文档与案例入口。

| 目录 | npm 包或用途 | 本地端口 |
| --- | --- | --- |
| BPMatrixJS | bpmatrixjs：二维数学与几何 | 12111 |
| BPLineJS | bplinejs：WebGPU 2D 渲染 | 12112 |
| Example | 文档和交互案例网站 | 12113 |

## Docker

在项目根目录创建开发容器；已有 BPLine 容器时无需重复创建：

~~~bash
docker build -t bpline-dev .
docker run -d --name BPLine -p 12111:12111 -p 12112:12112 -p 12113:12113 -v "$PWD:/workspace" bpline-dev
docker exec -it -u pigeon BPLine bash
~~~

## 本地开发与打包

以下命令在容器内执行。每个项目分别安装依赖：

~~~bash
cd /workspace/BPMatrixJS && npm ci
cd /workspace/BPLineJS && npm ci
cd /workspace/Example && npm ci
~~~

启动开发服务时，在各自目录执行 `npm run dev`；三个服务分别占用上表所列端口。

构建文档与案例网站：

~~~bash
cd /workspace/Example
npm run check
npm run build
~~~

网站的静态产物位于 Example/dist，供 GitHub Pages 使用。网站使用 Hash 路由，页面地址以 /#/ 开始。

构建 npm 库并检查包内容时，在 BPMatrixJS 或 BPLineJS 目录执行：

~~~bash
npm run build:lib
npm pack --dry-run
~~~

npm pack --dry-run 只检查打包内容，不发布。外部项目可通过 npm install bplinejs 或 npm install bpmatrixjs 安装。BPLineJS/src/scripts/Examples 是本地验证代码，不进入 Git 或 npm 包。
