# 项目图标规范

本项目所有页面、组件及后续功能统一使用 Tabler Icons。

- React 使用已安装的 `@tabler/icons-react`，复用 `src/components/AppIcon.jsx` 的 `AppIcon` 及显式导入注册表，避免重复封装和全量动态导入。
- 使用 Outline；图标大小不固定为 20px，根据同排文字或内容的实际高度调整并光学居中，同角色保持一致；描边 1.25px、颜色继承 `currentColor`。视觉尺寸与至少 44×44px 的操作热区分离；统一样式位于 `src/icon-system.css`。
- 根据功能和交互语义选图标；添加前确认组件在已安装包中真实导出，再补充注册表。
- React 使用 `<AppIcon name="search" />`。现有 HTML 业务模板使用 `<i data-tabler=search></i>`，由 `TemplateView` 渲染为同一个组件。
- 禁止用 Emoji、Unicode 字符、手绘 SVG 或 CSS 绘制符号替代已有 Tabler 图标。数字、个人姓名首字、业务文字、地图几何与现场凭证示例属于内容，不当作图标替换。
- 纯图标操作需在按钮上提供 `aria-label`；装饰图标保持 `aria-hidden`。
- Tabler 确实没有合适图标时，先向用户说明，再考虑其他方案。

官方目录：https://tabler.io/icons
源码：https://github.com/tabler/tabler-icons

前端开发设计规范唯一来源为根目录 `design.md`（2026-10-29），基础组件库使用 TDesign Mobile React。业务字段与演示边界见 `v2/FIELD-MATRIX.md`；资源来源和第三方许可证保留在对应资源目录。规范更新不代表运行时代码或 Figma 自动同步，须分别核验。
