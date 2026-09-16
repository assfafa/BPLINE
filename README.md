# BPLine

两个 TypeScript 项目共用此 Git 仓库：

| 目录 | npm 包 | 用途 | 本地端口 |
| --- | --- | --- | --- |
| `BPMatrixJS` | `bpmatrixjs` | 向量、矩阵、几何生成与工具函数 | 12111 |
| `BPLineJS` | `bplinejs` | 基于 WebGPU 的 2D 渲染，侧重线条与边框；依赖 bpmatrixjs | 12112 |

## Docker

在 Ubuntu 项目根目录创建开发容器；已有 `BPLine` 容器时跳过这一步：

```bash
docker build -t bpline-dev .
docker run -d --name BPLine -p 12111:12111 -p 12112:12112 \
    -v "$PWD:/home/pigeon/projects/BPLine" bpline-dev
```

进入容器：

```bash
docker exec -it -u pigeon BPLine bash
```

## npm

以下命令在容器内执行。两个项目分别安装依赖、分别启动开发服务：

```bash
cd /home/pigeon/projects/BPLine/BPMatrixJS
npm ci
npm run dev
```

另开一个容器终端运行 BPLineJS：

```bash
cd /home/pigeon/projects/BPLine/BPLineJS
npm ci
npm run dev
```

在任一项目目录构建 npm 库并检查打包内容：

```bash
npm run build:lib
npm pack --dry-run
```

库源码位于各项目的 `src/scripts`，构建结果为 `lib`，包含 JavaScript 和 `.d.ts`。`pack --dry-run` 只检查，不发布。

外部项目通过 `npm install bplinejs` 或 `npm install bpmatrixjs` 安装。BPLineJS 的 `src/scripts/Examples` 是本地案例，不进入 Git 和 npm；新克隆仓库运行案例前需自行准备该目录入口。

正式 API 文档和公开案例网站留待稳定版本时在独立文档项目中整理。
