# 移动工作端 v2 字段对照矩阵

依据：`项目对象关系梳理/洞头社会治理一张图-前后端代码/rydzcjd-master.zip` 内 `src/views/page/Home/data/option.ts`、`seleteCol.ts`，以及 `NewDoorSite/index.vue`、`NewFloorSite/index.vue`、`NewHomeSite_detail/index.vue`、`Personnel_detail/index.vue`。`NewHomeSite/index.vue` 和 `Personnel/index.vue` 是列表/关系页，具体字段表单位于对应 `_detail` 页面。

表中源 key 是原版 `option.ts` 的 `key`，箭头右侧是 Demo 内存对象属性。`增/详/编` 表示三种模式是否显示；`✓` 为显示，`条` 为按条件显示。所有 `✓` 字段在详情均只读。原版 `Option` 数组以 `v-for` 整体渲染，不因 `disabled` 而隐藏字段；编辑态从详情进入后才允许操作。Demo 新增页的父级及自动生成字段保持可见但只读。原版 `required` 和控件类型列与 v2 的 schema 逐项核对；选项名称见表后说明。运行 `node demo/移动工作端/v2/field-audit.test.js` 可从原版 zip 重验字段顺序、三态表单输出、条件可见性、类型、必填、禁用、选项、key 映射和四类新增内存流程；脚本不执行浏览器布局或文件上传。

## 门址 `men_option`

| 原版 key → Demo key | 字段 | 增/详/编 | 原版控件和状态 | 必填 | 选项或备注 |
|---|---|---|---|---|---|
| gridCode | 网格代码 | ✓/✓/✓ | number，禁用 | 是 | 父级/登录上下文 |
| town | 所在区划 | ✓/✓/✓ | text，禁用 | 否 | 父级/登录上下文 |
| exclusivezone | 类行政区域名 | ✓/✓/✓ | text | 否 |  |
| `lat,lon` → location | 点位置 | ✓/✓/✓ | text，只读，地图选择 | 是 | 原版值顺序为经度、纬度；Demo 坐标输入近似 |
| community | 行政区/村社 | ✓/✓/✓ | text | 否 |  |
| village | 组/自然村 | ✓/✓/✓ | text | 否 |  |
| street | 街路巷弄名 | ✓/✓/✓ | text | 否 |  |
| door → doorNumber | 门牌号 | ✓/✓/✓ | text | 否 |  |
| yardName | 院落名 | ✓/✓/✓ | text | 否 |  |
| yardAlias | 院落别名 | ✓/✓/✓ | text，可重复 | 否 |  |
| poi | 兴趣点名 | ✓/✓/✓ | text，可重复 | 否 |  |
| legalStatus | 法定状态 | ✓/✓/✓ | text，只读选择器 | 否 | 法定地址、临时地址 |
| remark | 详情描述 | ✓/✓/✓ | textarea | 否 |  |
| standardAddress | 标准地址 | ✓/✓/✓ | textarea，自动生成只读 | 是 | 由地址字段拼接 |
| collectAddress | 采集地址 | 条/条/条 | textarea | 否 | 新增不显示；采集数据 `dataType=1` 不显示；七普数据仅此字段可编辑 |
| photo | 照片 | ✓/✓/✓ | 上传器 | 否 | Demo 只保存本地文件名 |

## 楼栋 `lou_option`

| 原版 key → Demo key | 字段 | 增/详/编 | 原版控件和状态 | 必填 | 选项或备注 |
|---|---|---|---|---|---|
| gridCode | 网格代码 | ✓/✓/✓ | number，禁用 | 是 | 父级/登录上下文 |
| town | 所在区划 | ✓/✓/✓ | text，禁用 | 否 | 父级/登录上下文 |
| exclusivezone | 类行政区域名 | ✓/✓/✓ | text | 否 |  |
| `lat,lon` → location | 点位置 | ✓/✓/✓ | text，只读，地图选择 | 是 | 原版值顺序为经度、纬度；Demo 坐标输入近似 |
| affiliatedDoorAddressName → doorId | 所属院落小区门牌 | ✓/✓/✓ | textarea，只读选择器 | 否 | Demo 多选已有门址；源记录另有 `affiliatedDoorAddressUuids` |
| community | 行政区/村社 | ✓/✓/✓ | text | 否 |  |
| village | 组/自然村 | ✓/✓/✓ | text | 否 |  |
| street | 街路巷弄名 | ✓/✓/✓ | text | 否 |  |
| door → doorNumber | 门牌号 | ✓/✓/✓ | text，可重复 | 否 |  |
| yardName | 院落名 | ✓/✓/✓ | text | 否 |  |
| yardAlias | 院落别名 | ✓/✓/✓ | text，可重复 | 否 |  |
| subareaName | 子区名 | ✓/✓/✓ | text | 否 |  |
| internalRoad | 院落内部街路巷弄名 | ✓/✓/✓ | text | 否 |  |
| internalDoor | 院内门牌号 | ✓/✓/✓ | text | 否 |  |
| buildingNum → buildingNumber | 楼牌号 | ✓/✓/✓ | text，号楼/幢/座单位 | 否 | Demo 文本输入，单位保留在值内 |
| buildingName | 建筑物名称 | ✓/✓/✓ | text | 否 |  |
| buildingAlias | 建筑物别名 | ✓/✓/✓ | text，可重复 | 否 |  |
| poi | 兴趣点名 | ✓/✓/✓ | text，可重复 | 否 |  |
| wdmjzddxjz → underground | 有无地面建筑的地下建筑 | ✓/✓/✓ | text，只读选择器 | 否 | 有、无 |
| legalStatus | 法定状态 | ✓/✓/✓ | text，只读选择器 | 否 | 法定地址、临时地址 |
| remark | 详情描述 | ✓/✓/✓ | textarea | 否 |  |
| standardAddress | 标准地址 | ✓/✓/✓ | textarea，自动生成只读 | 是 | 由地址字段拼接 |
| collectAddress | 采集地址 | 条/条/条 | textarea | 否 | 条件同门址 |
| photo | 照片 | ✓/✓/✓ | 上传器 | 否 | Demo 只保存本地文件名 |

## 户室 `hs_option`

| 原版 key → Demo key | 字段 | 增/详/编 | 原版控件和状态 | 必填 | 选项或备注 |
|---|---|---|---|---|---|
| homeAddress → address | 具体地址 | ✓/✓/✓ | textarea，自动生成只读 | 是 | 父楼栋 + 单元/楼层/户室号 |
| unit | 单元名 | ✓/✓/✓ | text，禁用 | 否 | 父级上下文 |
| floorNum | 楼层数 | ✓/✓/✓ | number，禁用 | 是 | 父级上下文 |
| floor | 楼层名 | ✓/✓/✓ | text，禁用 | 否 | 父级上下文 |
| homeNum | 户室号 | ✓/✓/✓ | text | 是 |  |
| state | 使用状态 | ✓/✓/✓ | text，只读选择器 | 否 | 有效、无效 |
| legalStatus | 法定状态 | ✓/✓/✓ | text，只读选择器 | 否 | 法定地址、临时地址 |
| photo | 照片 | ✓/✓/✓ | 上传器 | 否 | Demo 只保存本地文件名 |

## 人员 `persop_option`

| 原版 key → Demo key | 字段 | 增/详/编 | 原版控件和状态 | 必填 | 选项或备注 |
|---|---|---|---|---|---|
| zhName → name | 姓名 | ✓/✓/✓ | text | 是 |  |
| sfhm → idNo | 身份证 | ✓/✓/✓ | text | 是 | Demo 详情掩码 |
| gender | 性别 | ✓/✓/✓ | text，只读选择器 | 是 | 男、女 |
| zhrylx → personType | 人员类型 | ✓/✓/✓ | text，只读选择器 | 是 | `columns_zhrylx` |
| birthdate | 出生年月 | ✓/✓/✓ | text，日期选择器 | 是 | 原版可由身份证推导 |
| sjch → phone | 联系电话 | ✓/✓/✓ | text | 是 | Demo 详情掩码 |
| zhzt → residentStatus | 住户状态 | ✓/✓/✓ | text，只读选择器 | 否 | `columns_zhzt`；原版选“常住”会验证是否已有常住户室 |
| zhsf → residentIdentity | 住户身份 | ✓/✓/✓ | text，只读选择器 | 否 | `columns_zhsf` |
| relationship | 与户主关系 | ✓/✓/✓ | text，只读选择器 | 否 | `columns_relationship` |
| ldqk → flowStatus | 流动情况 | ✓/✓/✓ | text | 否 |  |
| jzrs → residentCount | 居住人数 | ✓/✓/✓ | number | 否 |  |
| town | 所属村社 | ✓/✓/✓ | text | 否 |  |
| mz → nation | 民族 | ✓/✓/✓ | text，只读选择器 | 是 | `columns_mz` |
| sjycd → education | 受教育程度 | ✓/✓/✓ | text，只读选择器 | 否 | `columns_sjycd` |
| hyzt → maritalStatus | 婚姻状态 | ✓/✓/✓ | text，只读选择器 | 否 | `columns_hyzt` |
| gridNumber | 网格编号 | ✓/✓/✓ | text，接口选择器 | 是 | `getGridByCode` 动态返回；Demo 使用样例数据 |
| microGridNumber | 微网格编号 | ✓/✓/✓ | text，接口选择器 | 是 | `getMicroGridByCode` 动态返回；Demo 使用样例数据 |
| microGridLong → gridLeader | 网格长 | ✓/✓/✓ | text，禁用 | 否 | 选择微网格后由接口带出 |
| bzAddress → standardAddress | 标准地址 | ✓/✓/✓ | textarea，继承只读 | 是 | 从户室地址带入 |
| tsqk → specialSituation | 特殊情况 | ✓/✓/✓ | textarea，只读选择器 | 否 | `columns_tsqk` |

## 条件与差异

- **原版外授权扩展：楼栋房屋标签、人员标签。** 它们不属于原版 `option.ts` 的 68 项字段，分别在楼栋、人员原版字段之后作为独立区块显示；新增和编辑只能从 `collection-data.js` 模拟后台配置目录中多选，详情显示已选标签。目录每项含稳定 id、名称、适用对象、启用状态和排序，结果以 `tagIds` 保存在内存对象中。门址、户室没有标签。后续做原版字段对齐时须保留这两项已授权业务扩展，不得因原版缺少该字段而删除。
- 门址、楼栋的 `collectAddress`：原版新增时从 `Option` 移除；普通采集数据 `dataType=1` 的详情和编辑也移除；七普数据则保留，其他字段禁用，仅 `collectAddress` 可编辑。v2 按该条件渲染。
- 楼栋的所属门址使用原版已有对象弹层；户室的所属楼栋及人员的关联门址/楼栋/户室是 Demo 为保持父级关系而额外显示的只读上下文，不算 `option.ts` 的业务字段。
- 原版照片是真实上传，点位置是地图选点，楼牌号有单位按钮；v2 当前分别是文件名、坐标文本和带单位的文本值。原版人员“常住”校验及网格、微网格接口联动需要后端数据，静态 Demo 未复现，不能据此推定生产选项。
- 原版门址提交时法定状态保留选项文本；楼栋和户室提交时转换为数值（临时地址/无效为 0）。原版楼栋提交代码把“临时状态”作为比较文本，与选项“临时地址”不一致；矩阵和 Demo 按选项的业务含义处理，不沿用该比较错误。
- 原版人员网格长随微网格接口选择带出；静态 Demo 仅有样例值。原版照片上传后的文件路径结构、地图真实经纬度及楼牌号单位控件仍待后端与地图集成确认。
