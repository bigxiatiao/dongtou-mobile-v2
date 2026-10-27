# 项目图标规范

本项目所有页面、组件及后续功能统一使用 Tabler Icons。

- React 使用已安装的 `@tabler/icons-react`，复用 `src/components/AppIcon.jsx` 的 `AppIcon` 及显式导入注册表，避免重复封装和全量动态导入。
- 默认使用 Outline，尺寸 20px、描边 1.5、颜色继承 `currentColor`；统一样式位于 `src/icon-system.css`。
- 根据功能和交互语义选图标；添加前确认组件在已安装包中真实导出，再补充注册表。
- React 使用 `<AppIcon name="search" />`。现有 HTML 业务模板使用 `<i data-tabler=search></i>`，由 `TemplateView` 渲染为同一个组件。
- 禁止用 Emoji、Unicode 字符、手绘 SVG 或 CSS 绘制符号替代已有 Tabler 图标。数字、个人姓名首字、业务文字、地图几何与现场凭证示例属于内容，不当作图标替换。
- 纯图标操作需在按钮上提供 `aria-label`；装饰图标保持 `aria-hidden`。
- Tabler 确实没有合适图标时，先向用户说明，再考虑其他方案。

官方目录：https://tabler.io/icons
源码：https://github.com/tabler/tabler-icons
