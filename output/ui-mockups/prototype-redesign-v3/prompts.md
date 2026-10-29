# 原型视觉重设计 v3

使用内置 imagegen，输入为用户提供的三张页面截图。目标为 375 CSS px 逻辑宽度，高分辨率 PNG 导出，未修改业务代码。

## 1. 首页

```text
Use case: ui-mockup
Asset type: redesigned mobile UI screenshot, homepage
Input image 1 is the structural and content prototype to redesign. Keep its exact information architecture, page sections, order and business data. This is a visual refinement of the supplied screen, not a new app.
Design for a narrow 375 CSS pixel mobile canvas, export a high resolution full-length portrait screenshot of that narrow page (roughly 375:890 aspect). No phone frame, no external board, no added status bar.
Art direction: sophisticated, practical Chinese municipal field-work tool; deep navy to muted teal header, very pale cool-gray page background, white surfaces, clear dark navy text, restrained teal-blue active controls, 8–10px corners, delicate borders, minimal shadows. Chinese system sans typography at logical 12/14/18px with tabular numerals. Compact spacing appropriate to 375px, 14px page margins. Prefer elegant simple outline Tabler-style icons, not filled 3D pictograms. Improve visual consistency and hierarchy visibly while preserving structure.
Header: retain 防 mark, 洞头网格+应急工作端, 基层/部门 role switch with 基层 selected, scope 洞头区 / 东屏街道 / 东屏03网格, 网格员 · 张海燕. Make the title and header compact enough for 375px without overflow.
Content in this exact order:
1. Current action white card: 当前行动, green 进行中 badge, "海霞"防台行动; two small orange 台风 and yellow 暴雨 warning symbols at right. Lower notice strip 最新通知, red unread badge 2, and single-line clipped text “09:20 镇街指挥室：海滨路低洼段因积水暂时无…” with chevron.
2. 我的任务, subtitle 任务、风险与基础数据; right compact 18 待处理 badge.
3. Exactly three cards on one row: 转移任务 16, small red substatus 待转移2 · 待复核2 · 异常2; 风险排查 8, amber substatus 待排查5 · 处理中3; 数据采集 5, blue substatus 待核查3 · 已核查2. Allow compact wrapped substatus so it fits 375px.
4. 辖区动态 card, header 任务/采集 toggle with 任务 selected. Preserve the original schematic map with muted land, simple crossing roads, water corner and circular red/orange/yellow task markers; no geographic map or satellite texture. Small 示意地图 label. Legend below: 异常跟进、待转移、待复核.
5. 快捷搜索 card with two equal buttons 找人找房 and 安置点查询 using outline icons and chevrons.
Preserve all content and numerical data. No extra modules, charts, banners, bottom tabs or bottom navigation. Do not put orange focus rings around selected controls. Keep full page visible including both search buttons. No watermark.
```

## 2. 转移任务

```text
Use case: ui-mockup
Asset type: redesigned 375 CSS px wide mobile transfer task page, full-length screenshot
Input image 1 is the exact content and architecture prototype. Input image 2 is the approved visual direction reference for a consistent companion page, not content to copy.
Redesign input 1 with a polished compact municipal mobile interface. Preserve the crucial FOUR-LEVEL TREE: address > building > apartment room > person. NEVER flatten it into individual person cards. Preserve visible expanded/collapsed states and names/counts. Exact 375 CSS px logical width, high-resolution full-length portrait export, long screenshot approximately 375:1148 proportions. No phone frame or added status bar.
Visual style: match input 2 navy/teal compact header, pale cool slate background, crisp white cards, dark navy type, teal blue active controls, hairline borders, restrained 8px corners. Reduce box-within-box heaviness by using clean row dividers, subtle inset surfaces and clearly stepped 12px indenting while preserving hierarchy. Tabler-style thin outline address/building/door/chevron icons. Logical type 12/14/18px, minimum row touch height 44px.
Preserve header 防 / 洞头网格+应急工作端 / 基层 selected, 部门 / 洞头区 / 东屏街道 / 东屏03网格 / 网格员 · 张海燕. Then back control and 转移任务, compact 批量办理 button. Subtitle "海霞"防台行动 · 2处门址 · 16人. Thin understated progress line.
Horizontal scrolling status filters: 全部16 (selected teal), 待转移2, 转移途中2, 待复核2, trailing clipped further status. No orange focus ring or visible scrollbar.
Expanded address 海滨路18号 14人; expanded building 3幢 12人; expanded room 1单元302室 5人. Inside room 5 person rows: 陈秀英 待转移; 吴志强 待转移; 陈建国 转移途中; 陈晓梅 待复核; 陈小安 返家异常 (red). Every person has secondary text 房屋风险：危旧房 and trailing chevron.
Under same expanded building, four collapsed room rows: 1单元301室 2人; 2单元101室 1人; 1单元101室 2人; 1单元201室 2人. Then collapsed building 5幢 2人 still within first address.
Second expanded address 渔港路52号 2人 with collapsed building 7幢 2人.
No new content or numbers; show all rows and tree relations without clipping bottom. No bottom navigation or tabs. No illustrations or unrelated modules. The redesign should look cleaner and more readable than input1 while unmistakably retaining its hierarchical workflow.
```

## 3. 数据采集地图

```text
Use case: ui-mockup
Asset type: redesigned mobile data collection map screen, 375 CSS px logical width
Input image 1 is the exact content and architecture prototype for this screen. Input image 2 supplies the consistent redesigned visual language, not its content.
Create a refined companion to image 2, preserving all of input1's controls, spatial hierarchy and map-centered composition. Single portrait screen at logical 375 x 812 proportions, high resolution export. No phone frame, added status bar or bottom navigation.
Style: municipal field-work app, compact deep navy to muted teal gradient header, pale cool slate background, white surface controls, dark navy text, teal-blue primary color. Clean 12/14/18px Chinese system font, delicate borders, 8–10px corners, 14px page margins, flat outline Tabler-like icons. Improve map marker overlap and toolbar alignment visibly.
Header same as reference2: small 防 mark, 洞头网格+应急工作端, 基层/部门 with 基层 selected; 洞头区 / 东屏街道 / 东屏03网格; 网格员 · 张海燕.
Below header, back button then title 数据采集 on left and compact muted summary 地图 · 5点（待3 / 已2）on right.
Next toolbar: small segmented 列表 / 地图 on left, 地图 selected with blue text on white, no orange focus ring; compact outlined search-icon button on right.
Large bordered schematic map fills main working area, as in input1. Pale mint-gray background, simple diagonal white streets and one muted teal line. Use precisely five map markers: three pending in slate indigo (one door pin and two building square pins) as a clustered group in upper-left-middle, two verified in green (one door pin and one building square pin) in lower-right-middle. Small offsets so all five markers remain individually recognizable, fine white rims, subtle shadows. Use appropriate doorway/building outline pictograms inside pins, not the Chinese words 门 or 楼.
White inset legend at bottom within map showing four compact keys 待核查·门址 / 待核查·楼址 / 已核查·门址 / 已核查·楼址. Circle/pin vs square markers distinguish types as in original.
Immediately below map: one two-button action tray with +新增门址 (white outline) and +新增楼址 (solid blue), equal widths and 40px logical height. Retain page's quiet empty lower margin.
Constraints: Keep 5点 data and all text accurately. Do not substitute a data list or category tabs. No extra statistics, no cards from homepage, no bottom tab bar, no geographic imagery, no extra modules, no watermark.
```

