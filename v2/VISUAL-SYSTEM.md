# v2 移动端视觉调整

> 2026-10-28：本文件保留现有实现与历史验证记录。最新设计规则以 [前端开发设计规范](../design.md) 为准；下面的旧色阶、12/14/18px 字号、8px 卡片圆角及固定20px/1.5描边图标尚未按新版同步。此次仅修订文档，不代表代码或 Figma 已应用新版规则。

输入：A / Prototype Redesign；输出：React + Ant Design 移动端预览。

## 入口与运行

项目已迁移为 React 19 + Ant Design 6 + Vite。在项目根目录执行：

```sh
npm ci
npm run dev -- --port 4176
```

访问 http://127.0.0.1:4176/v2/ ，或默认入口 http://127.0.0.1:4176/ 。源码需要 Vite 编译 JSX，不再使用 Python 静态服务。

## 现有实现记录（待对齐新版规范）

- `radix-tokens.css`：本地 Radix Colors 3.0.0 sRGB 色阶，MIT 许可见 `RADIX-LICENSE.txt`。
- `visual-system.css`：共享组件规范及原有样式的统一覆盖。
- Slate 用于背景、正文、辅助文字、分隔；Blue 用于主操作与选中；Red / Orange / Amber / Green / Violet 等用于原有业务状态。白色采用官方文档允许的浅色表面。
- 色阶用途：1–2 背景、3–5 控件状态、6–8 边界与焦点、9–10 实色操作、11–12 文本。地图区域保留原示意几何；原气象预警图标作为内容资源保留。
- 字号仅 12 / 14 / 18px；系统中文字体栈，使用字重、留白、文本颜色区分层级。
- 线条与边框统一声明 `0.5px`。焦点轮廓使用 2px，保证键盘可见性；浏览器可能按设备像素对细边框取整。
- 普通卡片 8px，控件 4px，小型状态标签 3px，底部弹层 16px；嵌套控件按容器内边距减小圆角。地图点位、勾选与时间轴保留功能形状。
- 普通卡片无阴影；分段控件轨道无阴影，选中项仅保留轻微投影；浮层保留轻量投影。没有新增卡片左侧彩条。
- 对齐统一页面边距、标题基线、表单内容与操作区域，数字采用等宽数字；常规操作按钮为 40px，语音和筛选按钮为 32–36px，列表行、关闭和复选操作保留较大的触控区域。

## 内容、组件和行为边界

组件样式参考 Ant Design 6 的 Button / Input / Card / Segmented / Tag / Drawer tokens。React 使用真实 Ant Button / Input / Tabs / Segmented / Select / Upload / Popover / Menu 和单一 ConfigProvider；结构性组件保留原语义。沿用本地 Radix 颜色，不新增运行时远程依赖。

原 v2 页面骨架完整提取至 `src/templates/app-shell.html`，解析为 React 组件。转移、复核、采集、风险排查、通知、范围选择、角色切换、安置点及部门业务保留原配置和控制器。模板与文本更新交由 React state / Portal 处理；业务数据、字段、文案和状态规则不变。既有演示数据与模拟提交继续保留原边界。

采用渐进式迁移，业务模板和事件委托仍位于原控制器中，尚未逐页改写为纯 JSX Hooks。
## 实际验证

- 已运行 v2 的 `home-map-behavior.test.js`、`grid-shelters.test.js`、`transfer-behavior.test.js`、`department-behavior.test.js`、`field-audit.test.js`，全部通过。
- 全部 CSS 经 Lightning CSS 语法解析通过；样式颜色和字号使用共享变量，边框声明统一使用 hairline。
- 浏览器在 375 / 390 / 428px 检查基层首页、转移列表、转移办理表单、采集门址详情、部门首页、部门任务、安置点及搜索：未发现整页水平溢出，检查范围内文字仅 12 / 14 / 18px。横向状态筛选保留原滚动方式。
- 实际点击验证角色切换、地图任务/采集切换、采集地图进入详情、转移四层展开和人员表单、安置点搜索；业务测试覆盖状态提交、校验和存储关系。
- 未进行真机 Safari、软键盘、硬件安全区及所有数据组合的全量人工验证。

Radix 使用规范：https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

## 图标

全项目统一使用 `@tabler/icons-react`。现有代码为 Outline / 20px / stroke 1.5 / currentColor；新版目标为大小随同排内容高度调整、描边1.25px，尚未修改运行时实现。React 通过 `src/components/AppIcon.jsx` 的显式注册表。模板使用 `data-tabler` 标记，由渲染层输出官方组件。气象预警使用 Tabler 灾种图标并保留完整预警名称与等级颜色；现场凭证示例图仍属于业务内容。后续页面遵循根目录 `AGENTS.md` 和新版设计规范，不得使用字符或手绘图标替代。
