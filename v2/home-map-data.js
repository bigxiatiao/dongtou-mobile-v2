/* 首页示意点位投影。业务状态、对象与辖区始终来自现有业务数据。 */
(() => {
  const locations = {
    'door-18': { x: 19, y: 58 },
    'building-18-3': { x: 32, y: 30 },
    'building-18-5': { x: 53, y: 59 },
    'door-52': { x: 74, y: 29 },
    'building-52-7': { x: 77, y: 66 },
    'door-88': { x: 46, y: 25 },
    'building-88-1': { x: 72, y: 57 },
    'room-302': { x: 26, y: 29 },
    'room-301': { x: 49, y: 28 },
    'room-101-demo': { x: 25, y: 65 },
    'room-502': { x: 74, y: 64 }
  };
  const taskStates = { '异常跟进': 'red', '待转移': 'orange', '待复核': 'yellow' };
  const rank = { red: 0, orange: 1, yellow: 2, green: 3 };
  const legends = {
    task: [{ label: '异常跟进', color: 'red' }, { label: '待转移', color: 'orange' }, { label: '待复核', color: 'yellow' }],
    collection: [{ label: '待核查', color: 'red' }, { label: '已核查', color: 'green' }]
  };
  function pointFor(object) {
    if (locations[object.id]) return locations[object.id];
    const hash = [...object.id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
    return { x: 18 + hash % 64, y: 24 + Math.floor(hash / 64) % 48 };
  }
  function items(mode) {
    const collection = window.CollectionStore;
    if (!collection) return [];
    if (mode === 'collection') return collection.addresses().map(object => ({
      id: object.id, type: object.type, name: object.address,
      address: object.standardAddress || object.address,
      status: object.status === 'verified' ? '已核查' : '待核查',
      color: object.status === 'verified' ? 'green' : 'red',
      point: pointFor(object)
    }));
    const action = window.TransferDemoData?.action;
    if (!action || action.status !== '进行中') return [];
    return (window.TransferStore?.scoped() || []).filter(person => person.actionId === action.id && taskStates[person.transfer.status]).map(person => {
      const archive = collection.get('person', person.person.collectionPersonId);
      const related = archive ? collection.related(archive) : {};
      const place = related.room || related.building || related.door || { id: person.taskId };
      return { id: person.id, type: 'task', name: person.name,
        address: person.address || archive?.standardAddress || '地址未配置',
        status: person.transfer.status, color: taskStates[person.transfer.status], point: pointFor(place) };
    });
  }
  function groups(mode = 'task') {
    const groups = [];
    items(mode).forEach(item => {
      // 同位置、近邻位置合并为一个可选择清单，避免手机上点位互相遮挡。
      let group = groups.find(group => Math.abs(group.x - item.point.x) < 12 && Math.abs(group.y - item.point.y) < 15);
      if (!group) { group = { id: item.id, x: item.point.x, y: item.point.y, color: item.color, items: [] }; groups.push(group); }
      group.items.push(item);
      if (rank[item.color] < rank[group.color]) group.color = item.color;
    });
    return groups;
  }
  window.HomeMapData = { groups, legends };
})();
