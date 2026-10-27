# 洞头基层智治系统移动端 V2

独立的 React 19 + Ant Design 6 + Vite 移动端演示项目，包含基层与部门两套工作页面，统一使用 Tabler Icons。使用本地演示数据，未连接真实业务后端。

## 安装与运行

需要 Node.js 22.12+。

```sh
npm ci
npm run dev -- --port 4176
```

访问 http://127.0.0.1:4176/；兼容入口为 http://127.0.0.1:4176/v2/。源码需要 Vite 编译，不能直接双击 HTML 运行。

## 测试与构建

```sh
npm test
npm run build
npm run preview -- --port 4177
```

构建结果位于 `dist/`，可部署到静态托管服务。照片支持本地选择、缩略图和删除，未接入服务端上传；演示业务状态刷新后恢复初始值。

## 结构

- `src/`：React 入口、主题、模板渲染、标准组件和 Tabler 图标注册表。
- `src/legacy/bootstrap.js`：现有业务控制器的加载与角色切换桥接。
- `v2/`：业务控制器、数据、状态机、样式、回归测试及字段对照资料。
- `v2/FIELD-MATRIX.md`：字段及演示边界。
- `AGENTS.md`：项目图标约定。

保留 `/v2/` 目录结构以维持现有导入路径；本仓库不依赖原项目目录，也不包含旧版 Ionic 入口。

## 来源

从 [dongtou-mobile-demo](https://github.com/bigxiatiao/dongtou-mobile-demo) 的 `303aa53957bf04b18ad15423e948648b4796dcad` 提取 V2 所需源码，独立维护。
