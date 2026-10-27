/* 首页展示数据。行动始终读取转移任务的唯一来源，预警目录与生效记录分离。 */
(() => {
  const kinds = { typhoon: { code: '01', name: '台风' }, rainstorm: { code: '02', name: '暴雨' }, gale: { code: '05', name: '大风' } };
  const levels = { blue: { code: '01', name: '蓝色' }, yellow: { code: '02', name: '黄色' }, orange: { code: '03', name: '橙色' }, red: { code: '04', name: '红色' } };
  const warningIcons = Object.fromEntries(Object.entries(kinds).flatMap(([kind, type]) =>
    Object.entries(levels).filter(([level]) => kind !== 'gale' || level !== 'blue').map(([level, value]) => [
      `${kind}-${level}`, { kind, level, label: `${type.name}${value.name}预警`, src: `assets/weather/${type.code}${value.code}.gif` }
    ])
  ));
  const warnings = [
    { id: 'warning-typhoon', kind: 'typhoon', level: 'orange', status: 'active' },
    { id: 'warning-rainstorm', kind: 'rainstorm', level: 'yellow', status: 'active' }
  ];
  window.GridHomeData = {
    warningIcons, warnings,
    getCurrentAction() {
      const action = window.TransferDemoData?.action;
      return action?.status === '进行中' ? action : null;
    },
    getActiveWarnings() {
      // Demo 的 status 表示当前有效性；过期/解除记录不参加展示。同灾种只取最后一条有效记录。
      const current = new Map();
      warnings.forEach(record => {
        const icon = warningIcons[`${record.kind}-${record.level}`];
        if (record.status === 'active' && icon) current.set(record.kind, { ...record, ...icon });
      });
      return [...current.values()];
    }
  };
})();
