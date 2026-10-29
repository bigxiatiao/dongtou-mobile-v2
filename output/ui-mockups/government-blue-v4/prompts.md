# 政务蓝视觉重设计 v4

内置 imagegen 模式。基于用户三张原型的业务结构，重设计蓝色主视觉、头部、指标面板、列表层级和地图。以 375 CSS px 逻辑宽度为设计目标，文件为高分辨率生成图。未修改项目代码。

## 首页

```text
Use case: ui-mockup
Asset type: materially redesigned government mobile dashboard, single 375 CSS px logical width full page
The attached image is ONLY the information architecture/content reference. The user rejected a prior output because it looked almost identical. Create a visibly NEW and sophisticated visual design while retaining exact modules, content and order. Do not merely enhance the reference.
Art direction: contemporary Chinese government digital service, confident BLUE monochromatic brand, elegant editorial hierarchy, precise grid and crisp outline icons. A fresh distinctive layout treatment: WHITE compact masthead with blue 防 square and small navy product title, minimal role toggle; separate pale blue scope/user strip. Instead of the old dark teal tall header and sea of rounded outlined cards, use a STRONG ROYAL BLUE action panel with white headline, low-contrast tonal contour/wave geometry as subtle brand texture, no illustrative hero. Clean white/light-blue page, deep navy text, royal blue #1763E8 primary. Flat surfaces with 6–10px corners, restrained elevation, generous section separation but dense usable 375px typography; 12px labels, 14px text, 18px section headings, large tabular numbers. No cyan/teal primary, no glassmorphism, no giant pill cards, no orange focus rings.
375 CSS pixel narrow layout; export large high resolution full-length portrait, about 375:890 proportion. No phone frame or added system status bar.
Preserve these modules TOP TO BOTTOM:
1 WHITE masthead: blue 防 mark, 洞头网格+应急工作端; small 基层/部门 switch with 基层 selected. Scope/user strip: 洞头区 / 东屏街道 / 东屏03网格; 网格员 · 张海燕.
2 NEW royal blue current action panel: small 当前行动 and white outlined 进行中 badge; large "海霞"防台行动 white title; compact flat orange 台风橙色预警 and yellow 暴雨黄色预警 symbols, smaller than headline; integrated white/light-blue notice row below with 最新通知 unread2 and clipped 09:20 镇街指挥室：海滨路低洼段因积水暂时无… .
3 我的任务 with subtitle 任务、风险与基础数据 and small inline red 18 待处理 at right. Three columns in ONE shared WHITE METRICS SURFACE divided by fine vertical lines, not three puffy cards: 转移任务 16 (red number), 风险排查 8 (navy), 数据采集 5 (blue); short status labels below respectively 待转移2·待复核2·异常2 / 待排查5·处理中3 / 待核查3·已核查2. Line-wrap compactly within each column.
4 辖区动态 section: heading outside clean white map surface, understated blue underline control 任务/采集 with 任务 active. Map is a beautifully styled ABSTRACT SCHEMATIC PLAN: thin gray street grid, pale blue water, very pale neutral land, subtle outlined coverage boundary; NOT a geographic or photorealistic map. One orange aggregate marker3, two red user-outline markers, one amber user-outline marker. Small 示意地图 label. Clean horizontal legend 异常跟进、待转移、待复核 beneath.
5 快捷搜索: two compact equally weighted white tiles with LARGE BLUE outline home-search / home-shield icons, titles 找人找房 / 安置点查询 and chevrons.
Do not invent any content, metrics, modules, navigation or workflow. No bottom tab bar, no ornamental photography, no watermark. The resulting design must be substantially different from the prototype and more professional and visually intentional.
```

## 转移任务

```text
Use case: ui-mockup
Image1 is ONLY the exact CONTENT / WORKFLOW / STRUCTURE reference. Image2 is the new BLUE visual system reference to match closely. User rejected previous design as almost unchanged. Create a materially redesigned professional Chinese government service mobile screen, not a reskin of the old teal header. Logical 375 CSS px width, high-resolution full-page portrait screenshot. No device frame, system status bar or bottom nav.
Art direction: clean WHITE compact masthead with royal blue 防 square, dark navy product title 洞头网格+应急工作端, small blue 基层/部门 toggle (基层 active). Pale blue strip below with 洞头区 / 东屏街道 / 东屏03网格 and 网格员 · 张海燕. Match image2. Primary color royal blue #1763E8, very pale blue-gray background, deep navy text, clear typographic hierarchy, white surfaces, refined 6–10px corners, minimal hairline borders, flat Tabler-style outline icons. No dark teal masthead, cyan theme, giant rounded box soup, orange focus rings or visible scrollbars. 12/14/18px logical font grid, 14px page gutters, practical touch sizes.
Asset type: redesigned transfer task hierarchy page, full long screen aspect about 375:1148.
Below shared header: compact back button, strong 转移任务 title, outlined blue 批量办理 button. A refined pale blue action context strip with "海霞"防台行动 · 2处门址 · 16人. Thin progress bar.
Replace oversized outlined status pills with a precise horizontally scrolling STATUS TAB STRIP: 全部16 selected blue underline / 待转移2 / 转移途中2 / 待复核2 / trailing clipped extra status. Small counts in compact badges.
Core content MUST preserve 4-level expanded tree ADDRESS > BUILDING > ROOM > PERSON with exact names and counts. Create a sophisticated WHITE hierarchical list with blue address section headers, gray-blue building rows, room panels with modest indents, fine connector guides, clear chevrons. Avoid excessive separate borders around each level. Add a slim BLUE left hierarchy guide connecting each address to its building group. People use simple airy list rows with right chevrons; compact tinted status tags beside names.
Expanded 海滨路18号 14人 > expanded 3幢 12人 > expanded 1单元302室 5人 > five people rows 陈秀英 待转移 / 吴志强 待转移 / 陈建国 转移途中 / 陈晓梅 待复核 / 陈小安 返家异常. Every person subtitle 房屋风险：危旧房. Pending tags amber, in transit blue, review violet, exception red.
Then collapsed room rows inside same 3幢: 1单元301室2人 / 2单元101室1人 / 1单元101室2人 / 1单元201室2人. Collapsed building 5幢2人 inside first address.
Second address 渔港路52号2人 > collapsed 7幢2人.
Keep original exact tree, counts, person data and expanded state. No flattening into person cards. Full long image shows all rows without clipping. Visibly redesigned typography, status tabs and hierarchy, consistent with image2. No invented modules or data, no watermark.
```

## 采集地图

```text
Use case: ui-mockup
Image1 is ONLY the exact CONTENT / WORKFLOW / STRUCTURE reference. Image2 is the new BLUE visual system reference to match closely. User rejected previous design as almost unchanged. Create a materially redesigned professional Chinese government service mobile screen, not a reskin of the old teal header. Logical 375 CSS px width, high-resolution full-page portrait screenshot. No device frame, system status bar or bottom nav.
Art direction: clean WHITE compact masthead with royal blue 防 square, dark navy product title 洞头网格+应急工作端, small blue 基层/部门 toggle (基层 active). Pale blue strip below with 洞头区 / 东屏街道 / 东屏03网格 and 网格员 · 张海燕. Match image2. Primary color royal blue #1763E8, very pale blue-gray background, deep navy text, clear typographic hierarchy, white surfaces, refined 6–10px corners, minimal hairline borders, flat Tabler-style outline icons. No dark teal masthead, cyan theme, giant rounded box soup, orange focus rings or visible scrollbars. 12/14/18px logical font grid, 14px page gutters, practical touch sizes.
Asset type: redesigned map data collection screen, portrait aspect about 375:812.
Below shared header, clear page toolbar: outlined back chevron button, strong 数据采集 title; small summary 地图 · 5点（待3 / 已2）at right.
A redesigned compact WHITE control row: blue underline view tabs 列表 / 地图 with 地图 active, subtle separator; squared outlined search icon button right. Preserve these controls, do not add search text or filters.
Main map is the major region with an elegant thin BLUE border, small 8px corners, high-quality SCHEMATIC CARTOGRAPHY: thin pale-gray block grid, wide white roads with fine cool-gray edges, a delicate pale-blue water region on right, minimal neutral city blocks. This is abstract schematic geometry, not an actual geographic basemap. Sophisticated light blue-white-gray map color styling, consistent with image2 homepage, clearly much more intentionally designed than prototype's flat green rectangle.
Exactly FIVE markers: one slate-indigo door pin and two slate-indigo square building markers in one upper-left-middle cluster; one bright blue door pin and one bright blue square building marker in lower-right-middle cluster, verified uses BLUE not green to reinforce primary palette. White marker rims, readable thin doorway / building outline symbols, carefully separated so none are obscured. No extra points or Chinese characters replacing pictograms.
At map bottom inset a slim white legend of four compact keys: 待核查·门址 / 待核查·楼址 / 已核查·门址 / 已核查·楼址. Indigo pending, royal-blue verified, circle vs square differentiate types. Map remains roughly 420 logical px high, working viewport not giant empty blank.
Below map a compact WHITE action area with two 40px equal buttons: +新增门址 outlined blue / +新增楼址 solid royal blue. This is an action row, not tab navigation.
Preserve five points, original map control placement and both add entry points. No data list, extra dashboards, filters or categories. No bottom tab bar, no photos, no invented labels, no watermark.
```

