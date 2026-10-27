/*
 * 转移任务 Demo 数据。
 *
 * 数据按行动、指令、辖区责任、人员关系和办理记录分层维护；页面脚本只
 * 读取这些业务结果。
 */
(() => {
  const action = {
    id: 'EA-20260916-001',
    name: '"海霞"防台行动',
    startedAt: '2026-09-16 09:00',
    status: '进行中',
    toString() { return `${this.id}｜${this.name}`; }
  };

  const scopes = [
    { id: 'dp03', name: '东屏03网格', type: 'grid', parentId: 'dp' },
    { id: 'dp', name: '东屏街道', type: 'street', parentId: 'dt' },
    { id: 'bq', name: '北岙街道', type: 'street', parentId: 'dt' },
    { id: 'dt', name: '洞头区', type: 'district', parentId: null },
    { id: 'dp04', name: '东屏04网格', type: 'grid', parentId: 'dp' },
    { id: 'bq01', name: '北岙01网格', type: 'grid', parentId: 'bq' }
  ];

  const executors = {
    zhang: { id: 'u-zhang-haiyan', name: '张海燕', phone: '138****2016' },
    lin: { id: 'u-lin-hai', name: '林海', phone: '139****3140' },
    li: { id: 'u-li-haibo', name: '李海波', phone: '137****9012' }
  };

  const instructions = [
    {
      id: 'ZL-001', name: '危旧房人员转移', actionId: action.id, scopeIds: ['dp03'],
      reasons: ['房屋风险：危旧房'], relatedTags: ['危房', '老旧房', '低洼易涝'],
      requirement: '逐人确认现场结果和实际去向', deadline: '2026-09-16 14:00', needReview: true
    },
    {
      id: 'ZL-002', name: '低洼片区人员转移', actionId: action.id, scopeIds: ['dp03', 'bq01'],
      reasons: ['低洼易涝风险'], relatedTags: ['低洼片区'],
      requirement: '记录转移结果和安置去向', deadline: '2026-09-16 16:00', needReview: true
    }
  ];

  const shelters = [
    { id: 'shelter-001', scopeId: 'dp', name: '东屏避灾安置中心', type: 'center', capacity: 50, occupied: 20, status: '开放中', contact: '王丽', phone: '13800008890', address: '洞头区东屏街道海滨路126号', location: {lng:121.155,lat:27.829} },
    { id: 'shelter-002', scopeId: 'dp', name: '东岙文化礼堂', type: 'center', capacity: 48, occupied: 0, status: '开放中', contact: '陈国平', phone: '13900001180', address: '洞头区东屏街道东岙村文化路18号', location: {lng:121.163,lat:27.836} },
    { id: 'shelter-003', scopeId: 'dp', name: '东屏社区避灾点', type: 'center', capacity: 30, occupied: 30, status: '开放中', contact: '林小燕', phone: '13700002260', address: '洞头区东屏街道社区路8号', location: {lng:121.158,lat:27.832} },
    { id: 'shelter-004', scopeId: 'bq', name: '北岙街道避灾中心', type: 'center', capacity: 100, occupied: 36, status: '开放中', contact: '周建华', phone: '13600003370', address: '洞头区北岙街道霞晖大道98号', location: {lng:121.152,lat:27.837} },
    { id: 'shelter-005', scopeId: 'bq', name: '北岙社区备用安置点', type: 'center', capacity: 40, occupied: 0, status: '未开放', contact: '待配置', phone: '', address: '洞头区北岙街道新城路16号', location: null }
  ].map(item => Object.defineProperty(item, 'capacityLabel', { enumerable: true, get() { return `${this.occupied}/${this.capacity}人`; } }));

  const destination = (type, placeName, detail = '', extra = {}) => ({
    type, placeId: extra.placeId || null, placeName: placeName || '', detail,
    address: extra.address || '', contact: extra.contact || '', phone: extra.phone || '',
    note: extra.note || '', capacityLabel: extra.capacityLabel || '', ...extra
  });
  const event = (at, type, detail, actor = '') => ({ at, type, detail, actor });
  const review = (id, at, result, reviewer, note = '', photos = []) => ({
    id, at, result, reviewerId: reviewer.id, reviewerName: reviewer.name,
    reviewerPhone: reviewer.phone, note, photos, contact: ''
  });
  const assignment = (executor, transferHistory = [], scopeId = 'dp03', scopeName = '东屏街道03网格') => ({
    scopeId, scopeName, defaultExecutor: { ...executor },
    currentExecutor: { ...executor }, transferHistory
  });

  // transferResult: 转移途中 | 已落实安置 | 拒绝转移 | 人员不在家 | 联系不上 | 其他异常
  // placementType: center | relative | hotel | care | other | unknown
  const person = (id, values) => {
    const instruction = instructions.find(item => item.id === values.instructionId) || instructions[0];
    const relation = {
      collectionPersonId: values.collectionPersonId, householdId: values.householdId,
      roomId: values.roomId, name: values.name, phone: values.phone, tags: [...values.personTags]
    };
    const transfer = {
      status: values.status,
      transferResult: values.transferResult || '',
      reason: values.reason || instruction.reasons[0],
      plannedDestination: values.plannedDestination || null,
      actualDestination: values.actualDestination || null,
      reviewRecords: values.reviewRecords || [],
      events: values.timeline || [],
      form: values.form || null
    };
    const exec = values.executor === '林海' ? executors.lin : values.executor === '李海波' ? executors.li : executors.zhang;
    const assignmentRecord = values.assignment || assignment(exec);
    return {
      id, taskId: `task-${id.toLowerCase()}`, actionId: action.id, instructionId: instruction.id,
      action, instruction, assignment: assignmentRecord, person: relation, transfer,
      name: values.name, household: values.household, address: values.address, phone: values.phone,
      tags: values.personTags.join(' · '), tagsList: [...values.personTags], tip: values.tip || '',
      status: values.status, executor: assignmentRecord.currentExecutor.name,
      reviewer: values.reviewer || executors.li.name,
      events: (values.legacyEvents || values.timeline || []).map(item => Array.isArray(item)
        ? item : [String(item.at || '').slice(11) || item.at, item.type, item.detail]),
      placement: values.placement || values.actualDestination?.type || '',
      destination: values.destination || values.actualDestination?.placeName || '',
      restoreOrder: values.restoreOrder || '', abnormal: values.abnormal || '',
      reviewRecords: values.reviewRecords || [], collectionPersonId: values.collectionPersonId,
      householdId: values.householdId, roomId: values.roomId,
      transferResult: values.transferResult || ''
    };
  };

  const people = [
    // === 待转移 (2+) ===
    person('P01', {
      collectionPersonId: 'person-chen', householdId: 'household-chen', roomId: 'room-302',
      name: '陈秀英', household: '陈秀英户', address: '海滨路18号3幢302室', phone: '138****5621',
      personTags: ['72岁', '独居老人', '行动不便', '需陪同'],
      tip: '需确认随身药品并安排陪同；所在片区低洼，需关注出行安全。',
      status: '待转移', reason: '房屋风险：危旧房', executor: '张海燕', reviewer: '李海波',
      transferResult: '',
      timeline: [event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台')]
    }),
    person('P11', {
      collectionPersonId: 'person-wu', householdId: 'household-chen', roomId: 'room-302',
      name: '吴志强', household: '陈秀英户', address: '海滨路18号3幢302室', phone: '137****6612',
      personTags: ['家庭成员', '租客'],
      tip: '上门时人员不在家，已记录计划安置信息，待回来后继续跟进。',
      status: '待转移', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '人员不在家',
      plannedDestination: destination('center', '东屏避灾安置中心', '', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      transferResult: '',
      timeline: [event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台')]
    }),

    // === 转移途中 (2+) ===
    person('P02', {
      collectionPersonId: 'person-chen-guojian', householdId: 'household-chen', roomId: 'room-302',
      name: '陈建国', household: '陈秀英户', address: '海滨路18号3幢302室', phone: '137****2168',
      personTags: ['家庭成员', '可自行转移'],
      status: '转移途中', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '转移途中',
      actualDestination: destination('center', '东屏避灾安置中心', '', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:16', '转移办理', '已离开住所，前往东屏避灾安置中心。', '张海燕')
      ]
    }),
    person('P12', {
      collectionPersonId: 'person-sun', householdId: 'household-zhao', roomId: 'room-301',
      name: '孙秀琴', household: '赵丽户', address: '海滨路18号3幢301室', phone: '138****3328',
      personTags: ['独居', '老人'],
      status: '转移途中', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '转移途中',
      actualDestination: destination('relative', '女儿孙丽住所', '北岙街道复兴路38号', { contact: '孙丽', relationship: '子女', phone: '13700005538', address: '北岙街道复兴路38号' }),
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:22', '转移办理', '已到达女儿住所，待接应安置。', '张海燕')
      ]
    }),

    // === 待复核 (2+) ===
    person('P03', {
      collectionPersonId: 'person-wang', householdId: 'household-wang', roomId: 'room-101',
      name: '王建国', household: '王建国户', address: '海滨路88号1幢101室', phone: '137****8890',
      personTags: ['独居', '需独立复核'],
      status: '待复核', reason: '低洼易涝风险', instructionId: 'ZL-002', executor: '林海',
      transferResult: '已落实安置',
      assignment: Object.assign(assignment(executors.zhang, [{ id: 'handoff-p03-1', at: '2026-09-16 09:12', fromExecutorId: executors.zhang.id, fromExecutorName: executors.zhang.name, toExecutorId: executors.lin.id, toExecutorName: executors.lin.name, reason: '原办理人临时请假' }], 'bq01', '北岙01网格'), { currentExecutor: { ...executors.lin } }),
      placement: 'relative', destination: '女儿王晓梅 · 北岙街道海滨路88号',
      actualDestination: destination('relative', '女儿王晓梅住所', '北岙街道海滨路88号', { contact: '王晓梅', relationship: '子女', phone: '13700008890', address: '北岙街道海滨路88号' }),
      timeline: [
        event('2026-09-16 09:05', '指令下发', '低洼片区人员转移指令已下发。', '后台'),
        event('2026-09-16 09:18', '转移办理', '已落实投亲靠友安置，等待复核。', '林海')
      ]
    }),
    person('P10', {
      collectionPersonId: 'person-chen-xiaomei', householdId: 'household-chen', roomId: 'room-302',
      name: '陈晓梅', household: '陈秀英户', address: '海滨路18号3幢302室', phone: '13900003218',
      personTags: ['家庭成员'],
      status: '待复核', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      actualDestination: destination('relative', '亲友住所', '北岙街道复兴路26号', { contact: '郑明', relationship: '其他亲属', phone: '13800002266', address: '北岙街道复兴路26号' }),
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 10:20', '转移办理', '自行前往亲友住所，待复核确认。', '张海燕')
      ]
    }),
    person('P17', {
      collectionPersonId: 'person-liu', householdId: 'household-liu', roomId: 'room-502',
      name: '刘建国', household: '刘建国户', address: '海滨路18号5幢502室', phone: '137****4412',
      personTags: ['租客'],
      status: '待复核', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      actualDestination: destination('center', '东岙文化礼堂', 'B区002床', { placeId: 'shelter-002', capacityLabel: '0/48人', contact: '陈国平', phone: '13900001180', address: '洞头区东屏街道东岙村文化路18号' }),
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:55', '转移办理', '已落实集中安置于东岙文化礼堂，待复核。', '张海燕')
      ]
    }),

    // === 已复核 (2+) ===
    person('P09', {
      collectionPersonId: 'person-zheng', householdId: 'household-zheng', roomId: 'room-2-101-demo',
      name: '郑秀兰', household: '郑秀兰户', address: '海滨路18号3幢2单元101室', phone: '138****5076',
      personTags: ['老人'],
      status: '已复核', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      plannedDestination: destination('center', '东屏避灾安置中心', '', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      actualDestination: destination('relative', '儿子郑明住所', '北岙街道复兴路26号', { contact: '郑明', relationship: '子女', phone: '13800002266', address: '北岙街道复兴路26号' }),
      reviewRecords: [review('review-p09-1', '2026-09-16 10:16', '通过', executors.li)],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:50', '转移办理', '实际投亲靠友，保留原计划安置点。', '张海燕'),
        event('2026-09-16 10:16', '复核确认', '人员与实际去向已核对。', '李海波')
      ]
    }),
    person('P13', {
      collectionPersonId: 'person-huang', householdId: 'household-huang', roomId: 'room-501',
      name: '黄建国', household: '黄建国户', address: '海滨路18号5幢501室', phone: '136****1812',
      personTags: ['独居老人', '行动不便'],
      status: '已复核', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      actualDestination: destination('center', '东屏避灾安置中心', 'A区012床', { placeId: 'shelter-001', capacityLabel: '20/50人', contact: '王丽', phone: '13800008890', address: '洞头区东屏街道海滨路126号' }),
      reviewRecords: [
        review('review-p13-1', '2026-09-16 10:30', '通过', executors.li, '安置点已确认接收。'),
        review('review-p13-2', '2026-09-16 11:05', '通过', executors.li, '二次复核，药品已补齐。')
      ],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:45', '转移办理', '已落实集中安置，东屏避灾安置中心A区012床。', '张海燕'),
        event('2026-09-16 10:30', '复核确认', '安置点已确认接收。', '李海波'),
        event('2026-09-16 11:05', '复核确认', '二次复核，药品已补齐。', '李海波')
      ]
    }),

    // === 异常跟进 (2+) ===
    person('P04', {
      collectionPersonId: 'person-zhao', householdId: 'household-zhao', roomId: 'room-301',
      name: '赵丽', household: '赵丽户', address: '海滨路18号3幢301室', phone: '138****9011',
      personTags: ['重点关注', '需上门'],
      status: '异常跟进', abnormal: '拒绝转移', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '拒绝转移',
      tip: '已拒绝转移，需记录沟通和镇街协同进展。',
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:30', '异常上报', '对象拒绝转移，已转镇街协同；仍未完成转移。', '张海燕')
      ]
    }),
    person('P05', {
      collectionPersonId: 'person-li-abao', householdId: 'household-li-abao', roomId: 'room-101-demo',
      name: '李阿宝', household: '李阿宝户', address: '海滨路18号3幢101室', phone: '136****2020',
      personTags: ['独居老人', '失联跟进'],
      status: '异常跟进', abnormal: '联系不上', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '联系不上',
      tip: '电话无法接通，继续上门与亲友联系。',
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:42', '异常上报', '电话无法接通，去向未明；仍未完成转移。', '张海燕')
      ]
    }),

    // === 待返家 (2+) ===
    person('P06', {
      collectionPersonId: 'person-zhou', householdId: 'household-zhou', roomId: 'room-201-demo',
      name: '周海燕', household: '周海燕户', address: '海滨路18号3幢201室', phone: '137****2018',
      personTags: ['老人', '集中安置'],
      status: '待返家', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'center', destination: '东屏避灾安置中心 A区006床',
      plannedDestination: destination('center', '东屏避灾安置中心', 'A区006床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      actualDestination: destination('center', '东屏避灾安置中心', 'A区006床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      restoreOrder: 'HF-006｜人员返家任务',
      reviewRecords: [review('review-p06-1', '2026-09-16 10:02', '通过', executors.li, '人员与安置去向已核对。')],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:34', '转移办理', '已到东屏避灾安置中心。', '张海燕'),
        event('2026-09-16 10:02', '复核确认', '李海波核实人员与去向，通过复核。', '李海波'),
        event('2026-09-16 10:40', '返家任务下发', '返家任务已下发，网格员执行现场返家核验。', '后台')
      ]
    }),
    person('P14', {
      collectionPersonId: 'person-xu', householdId: 'household-lin', roomId: 'room-701',
      name: '许小明', household: '林海户', address: '渔港路52号7幢701室', phone: '139****2218',
      personTags: ['租客', '酒店安置'],
      status: '待返家', reason: '低洼易涝风险', instructionId: 'ZL-002', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'hotel', destination: '洞头海逸酒店 208房',
      plannedDestination: destination('hotel', '洞头海逸酒店', '208房', { capacityLabel: '18间可用' }),
      actualDestination: destination('hotel', '洞头海逸酒店', '208房', { capacityLabel: '18间可用', contact: '周经理', phone: '13700009801', address: '洞头区北岙街道复兴路26号' }),
      restoreOrder: 'HF-014｜人员返家任务',
      reviewRecords: [review('review-p14-1', '2026-09-16 10:15', '通过', executors.li, '酒店去向已确认。')],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '低洼片区人员转移指令已下发。', '后台'),
        event('2026-09-16 09:36', '转移办理', '已入住洞头海逸酒店208房。', '张海燕'),
        event('2026-09-16 10:15', '复核确认', '酒店去向已确认。', '李海波'),
        event('2026-09-16 10:50', '返家任务下发', '返家任务已下发。', '后台')
      ]
    }),

    // === 已返家 (2+) ===
    person('P07', {
      collectionPersonId: 'person-lin', householdId: 'household-lin', roomId: 'room-701',
      name: '林海', household: '林海户', address: '渔港路52号7幢701室', phone: '139****1234',
      personTags: ['酒店安置', '已返家'],
      status: '已返家', reason: '低洼易涝风险', instructionId: 'ZL-002', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'hotel', destination: '洞头海逸酒店 208房',
      plannedDestination: destination('hotel', '洞头海逸酒店', '208房', { capacityLabel: '18间可用' }),
      actualDestination: destination('hotel', '洞头海逸酒店', '208房', { capacityLabel: '18间可用' }),
      restoreOrder: 'HF-007｜人员返家任务',
      reviewRecords: [review('review-p07-1', '2026-09-16 10:00', '通过', executors.li, '酒店去向和人员已核对。')],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '低洼片区人员转移指令已下发。', '后台'),
        event('2026-09-16 09:31', '转移办理', '酒店民宿安置，208房。', '张海燕'),
        event('2026-09-16 10:00', '复核确认', '李海波核实去向，通过复核。', '李海波'),
        event('2026-09-16 10:40', '返家任务下发', '返家任务已下发。', '后台'),
        event('2026-09-16 11:24', '返家到位', '现场确认房屋、水电、道路和人员状态，已返家。', '张海燕')
      ]
    }),
    person('P15', {
      collectionPersonId: 'person-zhang-fang', householdId: 'household-zhou', roomId: 'room-201-demo',
      name: '张芳', household: '周海燕户', address: '海滨路18号3幢201室', phone: '137****5528',
      personTags: ['老人', '集中安置', '已返家'],
      status: '已返家', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'center', destination: '东屏避灾安置中心 A区009床',
      plannedDestination: destination('center', '东屏避灾安置中心', 'A区009床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      actualDestination: destination('center', '东屏避灾安置中心', 'A区009床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      restoreOrder: 'HF-015｜人员返家任务',
      reviewRecords: [review('review-p15-1', '2026-09-16 10:10', '通过', executors.li, '人员与安置点已核对。')],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:40', '转移办理', '已到东屏避灾安置中心，A区009床。', '张海燕'),
        event('2026-09-16 10:10', '复核确认', '人员与安置点已核对。', '李海波'),
        event('2026-09-16 10:45', '返家任务下发', '返家任务已下发。', '后台'),
        event('2026-09-16 11:30', '返家到位', '现场确认房屋安全，已返家。', '张海燕')
      ]
    }),

    // === 返家异常 (2+) ===
    person('P08', {
      collectionPersonId: 'person-chen-xiaoan', householdId: 'household-chen', roomId: 'room-302',
      name: '陈小安', household: '陈秀英户', address: '海滨路18号3幢302室', phone: '136****7712',
      personTags: ['儿童', '家庭成员'],
      status: '返家异常', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'center', destination: '东屏避灾安置中心 A区007床',
      plannedDestination: destination('center', '东屏避灾安置中心', 'A区007床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      actualDestination: destination('center', '东屏避灾安置中心', 'A区007床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      restoreOrder: 'HF-008｜人员返家任务',
      reviewRecords: [review('review-p08-1', '2026-09-16 10:08', '通过', executors.li)],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:38', '转移办理', '已到东屏避灾安置中心。', '张海燕'),
        event('2026-09-16 10:08', '复核确认', '人员与去向已核对，通过复核。', '李海波'),
        event('2026-09-16 11:20', '返家异常', '道路积水，暂不具备返家条件。', '张海燕')
      ]
    }),
    person('P16', {
      collectionPersonId: 'person-ma', householdId: 'household-li-abao', roomId: 'room-101-demo',
      name: '马玉兰', household: '李阿宝户', address: '海滨路18号3幢101室', phone: '138****7728',
      personTags: ['独居老人', '需医疗关注'],
      status: '返家异常', reason: '房屋风险：危旧房', executor: '张海燕',
      transferResult: '已落实安置',
      placement: 'center', destination: '东屏避灾安置中心 B区003床',
      plannedDestination: destination('center', '东屏避灾安置中心', 'B区003床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      actualDestination: destination('center', '东屏避灾安置中心', 'B区003床', { placeId: 'shelter-001', capacityLabel: '20/50人' }),
      restoreOrder: 'HF-016｜人员返家任务',
      reviewRecords: [review('review-p16-1', '2026-09-16 10:25', '通过', executors.li, '人员已安置，需医疗跟进。')],
      timeline: [
        event('2026-09-16 09:05', '指令下发', '危旧房人员转移指令已下发。', '后台'),
        event('2026-09-16 09:55', '转移办理', '已到东屏避灾安置中心B区003床，需持续用药。', '张海燕'),
        event('2026-09-16 10:25', '复核确认', '人员已安置，需医疗跟进。', '李海波'),
        event('2026-09-16 11:15', '返家异常', '房屋一楼仍有积水，老人需药物，暂不具备返家条件。', '张海燕')
      ]
    })
  ];

  const householdGroups = [
    { id: 'household-chen', label: '陈秀英户', address: '海滨路18号3幢302室', roomId: 'room-302', personIds: ['P01', 'P02', 'P08', 'P10', 'P11'] },
    { id: 'household-wang', label: '王建国户', address: '海滨路88号1幢101室', roomId: 'room-101', personIds: ['P03'] },
    { id: 'household-zhao', label: '赵丽户', address: '海滨路18号3幢301室', roomId: 'room-301', personIds: ['P04', 'P12'] },
    { id: 'household-li-abao', label: '李阿宝户', address: '海滨路18号3幢101室', roomId: 'room-101-demo', personIds: ['P05', 'P16'] },
    { id: 'household-zhou', label: '周海燕户', address: '海滨路18号3幢201室', roomId: 'room-201-demo', personIds: ['P06', 'P15'] },
    { id: 'household-lin', label: '林海户', address: '渔港路52号7幢701室', roomId: 'room-701', personIds: ['P07', 'P14'] },
    { id: 'household-zheng', label: '郑秀兰户', address: '海滨路18号3幢2单元101室', roomId: 'room-2-101-demo', personIds: ['P09'] },
    { id: 'household-liu', label: '刘建国户', address: '海滨路18号5幢502室', roomId: 'room-502', personIds: ['P17'] },
    { id: 'household-huang', label: '黄建国户', address: '海滨路18号5幢501室', roomId: 'room-501', personIds: ['P13'] }
  ];

  const archiveStore = window.CollectionStore;
  if (archiveStore) {
    people.forEach(task => {
      const relation = task.person;
      let archive = archiveStore.get('person', relation.collectionPersonId);
      if (!archive) throw new Error('转移示例缺少关联人员：'+relation.collectionPersonId);
      relation.phone=task.phone=archive.phone;
      relation.roomId=task.roomId=archive.roomId;
      task.address=archive.standardAddress;
      task.assignment.scopeId=archive.scopeId;
      task.assignment.scopeName=archiveStore.scopes().find(s=>s.id===archive.scopeId)?.name||'';
    });
    householdGroups.forEach(group=>{group.address=people.find(task=>task.person.householdId===group.id)?.address||group.address});
  }

  people.forEach(task => {
    task.transfer.matchedReasons = task.instructionId === 'ZL-001'
      ? [{tagId:'building-danger',label:'危房',sourceType:'building',sourceLabel:'居住房屋'}]
      : [{tagId:'building-low',label:'低洼易涝',sourceType:'building',sourceLabel:'居住片区'}];
  });
  people.find(task=>task.id==='P01').transfer.matchedReasons.push(
    {tagId:'building-old',label:'老旧房',sourceType:'building',sourceLabel:'居住房屋'},
    {tagId:'building-low',label:'低洼易涝',sourceType:'building',sourceLabel:'居住片区'}
  );
  people.find(task=>task.id==='P11').transfer.matchedReasons.push(
    {tagId:'building-old',label:'老旧房',sourceType:'building',sourceLabel:'居住房屋'}
  );
  people.find(task=>task.id==='P13').transfer.matchedReasons.push(
    {tagId:'building-old',label:'老旧房',sourceType:'building',sourceLabel:'居住房屋'}
  );

  const formOptions = {
    transferResult: ['转移途中','已落实安置','拒绝转移','人员不在家','联系不上','其他异常'],
    placementType: ['center','relative','hotel','care','other','unknown'],
    placementLabel: {center:'集中安置',relative:'投亲靠友',hotel:'酒店或民宿',care:'机构安置',other:'其他安置',unknown:'去向未明'},
    relationship:['子女','父母','兄弟姐妹','其他亲属','朋友','邻居','同事','其他'],
    verifyMethod:['上门核验','视频核验','电话核验'],
    careLevel:['一般照护','半失能照护','全失能照护'],
    result:['通过','退回补正','异常确认'],
    house:['安全可入住','需继续观察','不可入住'],road:['正常','受限','中断'],
    utilities:['均已恢复','部分恢复','未恢复'],person:['身体正常','需医疗关注','不宜返家'],
    method:['网格员陪同','家属接回','集中送返','自行返家'],confirmation:['现场确认','家属视频确认','电话回访']
  };
  const addressExamples = [
    {id:'address-relative',name:'亲友住所',address:'洞头区北岙街道海滨路88号1幢101室',lng:121.148,lat:27.837},
    {id:'address-hotel',name:'洞头海逸酒店',address:'洞头区北岙街道复兴路26号',lng:121.151,lat:27.834},
    {id:'address-care',name:'洞头区社会福利院',address:'洞头区东屏街道育才路16号',lng:121.159,lat:27.831}
  ];
  const voiceExamples = [
    {type:'relative',label:'投亲靠友',text:'投亲靠友，亲友姓名王晓梅，关系子女，电话13700008890，地址洞头区北岙街道海滨路88号1幢101室。'},
    {type:'center',label:'集中安置',text:'集中安置，安置点东屏避灾安置中心，床位A区018床，特殊照护协助服药。'},
    {type:'hotel',label:'酒店民宿',text:'酒店安置，酒店名称洞头海逸酒店，电话13700009801，联系人周经理，地址洞头区北岙街道复兴路26号，房间号208，入住人数2人。'},
    {type:'care',label:'机构安置',text:'机构安置，机构名称洞头区社会福利院，地址洞头区东屏街道育才路16号，联系人陈主任，电话13800006612，护理等级半失能照护，特殊照护日常用药提醒。'},
    {type:'other',label:'其他安置',text:'其他安置，安置类型单位临时安置，地点名称东屏街道办公楼，地址海滨路100号，联系人李科长，电话13700007712，交通方式专车接送。'},
    {type:'unknown',label:'去向未明',text:'去向未明，跟进时间明天上午十点，人员电话无法接通。'},
    {type:'note',label:'办理说明',text:'办理说明：对象情绪稳定，已携带随身药品和身份证件，同行家属一人。'},
    {type:'careNeed',label:'特殊照护',text:'特殊照护：半失能照护，需要协助服药和日常起居照料。'},
    {type:'residentCount',label:'入住人数',text:'入住人数：3人，其中老人2名、儿童1名。'}
  ];

  window.TransferDemoData = {
    version: 3, action, actionLabel: String(action), instructions, scopes, executors, shelters,
    householdGroups, people, formOptions, addressExamples, voiceExamples, order: `${instructions[0].id}｜${instructions[0].name}`, currentScopeId: 'dp03'
  };
})();
