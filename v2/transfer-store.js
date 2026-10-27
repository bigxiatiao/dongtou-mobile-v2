/* 转移任务状态适配器：页面和行为测试共同使用，刷新恢复 transfer-data.js 示例。 */
(() => {
  const data = window.TransferDemoData;
  if (!data) return;
  const statuses = ['待转移','转移途中','待复核','已复核','异常跟进','待返家','已返家','返家异常'];
  const copy = value => JSON.parse(JSON.stringify(value));
  const task = id => data.people.find(person => person.id === id);

  let minute = 25;
  const timestamp = () => `2026-09-16 ${String(11 + Math.floor(minute / 60)).padStart(2,'0')}:${String(minute++ % 60).padStart(2,'0')}`;

  function sync(person) {
    person.status = person.transfer.status;
    person.reason = person.transfer.reason;
    person.executor = person.assignment.currentExecutor.name;
    person.destination = person.transfer.actualDestination?.placeName || '';
    person.placement = person.transfer.actualDestination?.type || '';
    person.transferResult = person.transfer.transferResult || '';
    person.events = person.transfer.events.map(event => [event.at, event.type, event.detail]);
    const archive = window.CollectionStore?.get('person', person.person.collectionPersonId);
    if (archive) {
      person.name = person.person.name = archive.name;
      person.phone = person.person.phone = archive.phone;
      person.address = archive.standardAddress;
      person.roomId = person.person.roomId = archive.roomId;
    }
    return person;
  }

  const addEvent = (person, type, detail, actor = person.assignment.currentExecutor.name) => {
    person.transfer.events.push({ at: timestamp(), type, detail, actor });
    sync(person);
  };

  function inScope(person) {
    const id = window.CollectionStore?.scope().id || data.currentScopeId;
    let scope = data.scopes.find(item => item.id === person.assignment.scopeId);
    while (scope) { if (scope.id === id) return true; scope = data.scopes.find(item => item.id === scope.parentId); }
    return false;
  }

  const scoped = () => data.people.filter(inScope).map(sync);
  const eligible = person => person && ['待转移','转移途中','异常跟进'].includes(person.transfer.status);
  const counts = () => Object.fromEntries(statuses.map(status => [status, scoped().filter(person => person.transfer.status === status).length]));

  // transferResult → task status mapping per latest spec
  // 人员不在家 → 待转移 (not 异常跟进); 已到达待安置 removed
  function resultToStatus(transferResult) {
    switch (transferResult) {
      case '转移途中': return '转移途中';
      case '已落实安置': return '待复核';
      case '人员不在家': return '待转移';
      case '拒绝转移': case '联系不上': case '其他异常': return '异常跟进';
      default: return '';
    }
  }

  function abnormalResult(result) {
    return ['拒绝转移','联系不上','其他异常'].includes(result);
  }

  // Keep the timeline readable: a status value by itself is ambiguous when it
  // is shown next to a destination. Use explicit field labels in every newly
  // recorded transfer event, and distinguish planned placement for a person
  // who was not at home from an actual placement.
  function transferEventDetail(result, destination, note = '') {
    const labels = data.formOptions.placementLabel || {};
    const resultDescriptions = {
      '转移途中': '已出发，尚未到达',
      '已落实安置': '已落实安置，等待复核',
      '人员不在家': '上门时未找到人员',
      '拒绝转移': '人员明确拒绝本次转移',
      '联系不上': '暂未联系到人员',
      '其他异常': '出现其他异常情况'
    };
    const resultText = resultDescriptions[result] ? `${result}（${resultDescriptions[result]}）` : result;
    const parts = [`办理结果：${resultText}`];
    if (destination?.type) {
      const prefix = result === '人员不在家' ? '计划安置方式' : '安置方式';
      parts.push(`${prefix}：${labels[destination.type] || destination.type}`);
    }
    if (destination?.placeName) {
      const prefix = result === '人员不在家' ? '计划安置点' : '安置地点';
      parts.push(`${prefix}：${destination.placeName}`);
    }
    if (note) parts.push(`办理说明：${note}`);
    return parts.join('；');
  }

  // Fixed 4-layer hierarchy: door → building → room → person
  function hierarchy(status = 'all') {
    const collection = window.CollectionStore;
    const filtered = scoped().filter(p => status === 'all' || p.status === status);
    const taskIds = new Set(filtered.map(p => p.id));

    const doors = new Map();
    filtered.forEach(person => {
      const archive = collection?.get('person', person.person.collectionPersonId);
      const rel = archive && collection.related(archive);
      const door = rel?.door;
      const building = rel?.building;
      const room = rel?.room;
      const doorId = door?.id || 'unknown-door';
      const buildingId = building?.id || 'unknown-building';
      const roomId = room?.id || person.person.roomId || 'unknown-room';

      if (!doors.has(doorId)) {
        doors.set(doorId, {
          id: doorId,
          label: door?.address || '未知门址',
          address: door?.standardAddress || door?.address || '',
          buildings: new Map()
        });
      }
      const doorNode = doors.get(doorId);

      if (!doorNode.buildings.has(buildingId)) {
        doorNode.buildings.set(buildingId, {
          id: buildingId,
          label: building?.buildingNumber || building?.address || '未知楼址',
          address: building?.standardAddress || building?.address || '',
          rooms: new Map()
        });
      }
      const buildingNode = doorNode.buildings.get(buildingId);

      if (!buildingNode.rooms.has(roomId)) {
        buildingNode.rooms.set(roomId, {
          id: roomId,
          label: room ? `${room.unit || ''} ${room.name || ''}`.trim() : '未关联户室',
          address: room?.address || person.address,
          members: []
        });
      }
      buildingNode.rooms.get(roomId).members.push(person);
    });

    // Count members at each level
    function countMembers(roomMap) {
      let count = 0;
      roomMap.forEach(room => { count += room.members.length; });
      return count;
    }
    function countBuildingMembers(buildingMap) {
      let count = 0;
      buildingMap.forEach(b => { b.memberCount = countMembers(b.rooms); count += b.memberCount; });
      return count;
    }

    const result = [];
    doors.forEach(door => {
      door.memberCount = countBuildingMembers(door.buildings);
      door.buildings.forEach(b => {
        b.rooms.forEach(r => { r.memberCount = r.members.length; });
      });
      result.push({
        id: door.id,
        label: door.label,
        address: door.address,
        memberCount: door.memberCount,
        buildings: [...door.buildings.values()].map(b => ({
          id: b.id,
          label: b.label,
          address: b.address,
          memberCount: b.memberCount,
          rooms: [...b.rooms.values()].map(r => ({
            id: r.id,
            label: r.label,
            address: r.address,
            memberCount: r.memberCount,
            members: r.members
          }))
        }))
      });
    });
    return result;
  }

  // Collect all task IDs under a hierarchy node
  function collectTaskIds(node, level) {
    const ids = [];
    if (level === 'door') {
      node.buildings.forEach(b => b.rooms.forEach(r => r.members.forEach(p => ids.push(p.id))));
    } else if (level === 'building') {
      node.rooms.forEach(r => r.members.forEach(p => ids.push(p.id)));
    } else if (level === 'room') {
      node.members.forEach(p => ids.push(p.id));
    } else if (level === 'person') {
      ids.push(node.id);
    }
    return ids;
  }

  // Legacy groups() for backward compat — returns flat room groups
  function groups(status = 'all') {
    const collection = window.CollectionStore;
    const grouped = new Map();
    scoped().filter(p => status === 'all' || p.status === status).forEach(person => {
      const archive = collection?.get('person', person.person.collectionPersonId);
      const rel = archive && collection.related(archive);
      const room = rel?.room;
      const id = room?.id || person.person.roomId || person.id;
      const label = room ? `${rel?.building?.address || ''} ${room.unit || ''} ${room.name || ''}`.trim() : '未关联户室';
      if (!grouped.has(id)) grouped.set(id, { id, label: label.trim(), address: room?.address || person.address, members: [] });
      grouped.get(id).members.push(person);
    });
    return [...grouped.values()];
  }

  function normalizeDestination(value) {
    if (!value) return value;
    const dest = copy(value);
    if (dest.type === 'center') {
      const shelter = data.shelters.find(item => item.id === dest.placeId);
      if (shelter) Object.assign(dest, { placeName: shelter.name, address: shelter.address, contact: shelter.contact, phone: shelter.phone, location: copy(shelter.location), capacityLabel: shelter.capacityLabel });
    }
    if (dest.type === 'relative') dest.placeName = dest.contact || dest.placeName || '';
    return dest;
  }

  // C02: only transferResult required; placementType and all details optional
  // C09/N06: validate optional fields when filled - strict checks
  function validateOptionalFields(values = {}) {
    const errors = [];
    // Phone format validation (11 digits starting with 1)
    const phoneVal = values.destination?.phone || values.phone;
    if (phoneVal && !/^1[3-9]\d{9}$/.test(phoneVal)) {
      errors.push({ key: 'phone', label: '电话号码格式不正确，需11位手机号' });
    }
    // Positive integer validation for residentCount
    const countVal = values.destination?.residentCount || values.residentCount;
    if (countVal !== undefined && countVal !== '') {
      const num = Number(countVal);
      if (!Number.isInteger(num) || num <= 0) {
        errors.push({ key: 'residentCount', label: '入住人数需为正整数' });
      }
    }
    // Valid option matching for careLevel - use data.formOptions
    const validCareLevels = data.formOptions.careLevel || ['一般照护', '半失能照护', '全失能照护'];
    const careLevelVal = values.destination?.careLevel || values.careLevel;
    if (careLevelVal && !validCareLevels.includes(careLevelVal)) {
      errors.push({ key: 'careLevel', label: '护理等级选项无效，请从预设选项中选择' });
    }
    // Valid option matching for relationship - use data.formOptions for consistency
    const validRelationships = data.formOptions.relationship || ['子女','父母','兄弟姐妹','其他亲属','朋友','邻居','同事','其他'];
    const relVal = values.destination?.relationship || values.relationship;
    if (relVal && !validRelationships.includes(relVal)) {
      errors.push({ key: 'relationship', label: '亲友关系选项无效，请从预设选项中选择' });
    }
    return errors;
  }

  function missingFields(values = {}, node = 'receipt') {
    const missing = [];
    if (node === 'review') return data.formOptions.result.includes(values.result) ? [] : [{ key: 'result', label: '复核结果' }];
    // C13: only confirmation required for restore; house/road/person all optional
    if (node === 'restore') {
      return (values.abnormal ? [] : ['confirmation']).filter(key => !values.conditions?.[key]).map(key => ({ key, label: { confirmation: '到家确认' }[key] }));
    }
    // C02: only transferResult required
    if (!values.transferResult) missing.push({ key: 'transferResult', label: '转移办理结果' });
    // 已落实安置 + 去向未明 = conflict (active choice conflict, not empty fields)
    if (values.transferResult === '已落实安置' && values.placementType === 'unknown') {
      missing.push({ key: 'placementType', label: '已落实安置不能选择去向未明，请改选安置方式或办理结果' });
    }
    // C09: validate optional fields when filled
    const validationErrors = validateOptionalFields(values);
    return missing.concat(validationErrors);
  }

  // C10/N07: voice parsing covers all editable fields, doesn't lose content or add residue
  function parseVoice(text) {
    const source = String(text || '').trim();
    const result = {};
    const consumed = [];
    const names = {
      contact: '亲友姓名|联系人',
      relationship: '亲友关系|关系',
      address: '详细地址|地址|住在',
      phone: '电话|手机号|手机',
      placeName: '酒店名称|机构名称|地点名称|安置点',
      detail: '房间号|床位',
      careNeed: '照护需求|特殊照护需求|特殊照护',
      customType: '安置类型',
      transport: '交通方式',
      followupAt: '跟进时间',
      note: '办理说明',
      residentCount: '入住人数',
      careLevel: '护理等级',
      medicalNeed: '医疗需求|用药需求'
    };
    // Track only text actually assigned to a field; everything else becomes note.
    const aliases = Object.entries(names).flatMap(([key, words]) => words.split('|').map(word => ({ key, word })));
    aliases.sort((a, b) => b.word.length - a.word.length);
    const markers = [...source.matchAll(new RegExp(aliases.map(item => item.word).join('|'), 'g'))];
    markers.forEach((marker, index) => {
      const key = aliases.find(item => item.word === marker[0]).key;
      const start = marker.index + marker[0].length;
      const end = markers[index + 1]?.index ?? source.length;
      if (key === 'note') {
        consumed.push([marker.index, start]);
        return; // Keep the full note, including punctuation and additional sentences.
      }
      const raw = source.slice(start, end);
      const prefix = raw.match(/^[：:\s]*/)[0].length;
      const candidate = raw.slice(prefix).split(/[，,。；;\n]/)[0].trim();
      let value = candidate;
      let valueLength = candidate.length;
      if (key === 'phone') {
        value = candidate.match(/^1[3-9]\d{9}(?!\d)/)?.[0] || '';
        valueLength = value.length;
      }
      if (key === 'residentCount') {
        const count = candidate.match(/^([1-9]\d*)(人)?(?=$|\s)/);
        value = count?.[1] || '';
        valueLength = count?.[0].length || 0;
      }
      if (key === 'relationship' && !data.formOptions.relationship.includes(value)) value = '';
      if (key === 'careLevel' && !data.formOptions.careLevel.includes(value)) value = '';
      if (key === 'careNeed') value = value.replace(/^需求/, '').trim();
      if (value && !result[key]) {
        result[key] = value;
        consumed.push([marker.index, start + prefix + valueLength]);
      }
    });

    // Phone extraction (11 digits starting with 1)
    const phone = source.match(/1[3-9]\d{9}/);
    if (phone) {
      result.phone = phone[0];
      consumed.push([phone.index, phone.index + phone[0].length]);
    }

    // Placement type detection
    const labels = { center: /集中安置/, relative: /投亲靠友/, hotel: /酒店安置|酒店或民宿|酒店民宿|民宿安置/, care: /机构安置/, other: /其他安置/, unknown: /去向未明/ };
    result.type = Object.keys(labels).find(key => labels[key].test(source));
    if (result.type) {
      const match = source.match(labels[result.type]);
      consumed.push([match.index, match.index + match[0].length]);
    }

    // Shelter matching (read-only, auto-fill)
    const shelter = data.shelters.find(item => source.includes(item.name));
    if (shelter) {
      result.type = 'center'; result.placeId = shelter.id;
      const index = source.indexOf(shelter.name);
      consumed.push([index, index + shelter.name.length]);
    }

    const remaining = source.split('');
    consumed.forEach(([start, end]) => remaining.fill(' ', start, end));
    const note = remaining.join('').split(/[，,；;\n]+/).map(part => part.trim()).filter(Boolean).join('，')
      .replace(/^[。\s]+|[。\s]+$/g, '');
    if (note) result.note = note;

    return Object.fromEntries(Object.entries(result).filter(([, v]) => v));
  }

  function save(id, values = {}, draft = false) {
    const person = task(id);
    if (!eligible(person) || !inScope(person)) return { ok: false, error: '当前人员不可办理' };
    const missing = draft ? [] : missingFields(values);
    if (missing.length) return { ok: false, error: '请填写' + missing.map(f => f.label).join('、'), missing };

    person.transfer.form = copy(values);
    person.transfer.transferResult = values.transferResult || '';

    if (draft) { addEvent(person, '现场暂存', values.note || '现场办理资料已暂存'); return { ok: true }; }

    const dest = values.destination ? normalizeDestination(values.destination) : null;
    if (dest) {
      // A person who is not at home has only a planned destination. Do not
      // make an unconfirmed plan look like an actual placement.
      if (values.transferResult === '人员不在家') person.transfer.plannedDestination = copy(dest);
      else person.transfer.actualDestination = copy(dest);
    }

    const newStatus = resultToStatus(values.transferResult);
    if (!newStatus) return { ok: false, error: '未知的办理结果' };
    person.transfer.status = newStatus;
    person.abnormal = abnormalResult(values.transferResult) ? values.transferResult : '';

    const detail = transferEventDetail(values.transferResult, dest, values.note);
    addEvent(person, abnormalResult(values.transferResult) ? '异常上报' : '转移办理', detail);
    return { ok: true };
  }

  // C01: review status determined by confirmation count, not pass/fail result
  // 0 reviews = 待复核, 1+ reviews = 已复核; exception/退回 doesn't reset status
  function review(id, values = {}) {
    const person = task(id);
    if (!person || !inScope(person) || ['待返家','已返家','返家异常'].includes(person.transfer.status)) return { ok: false, error: '当前阶段不可复核' };
    if (!['待复核','已复核'].includes(person.transfer.status)) return { ok: false, error: '请先提交转移回执' };
    const result = values.result || '通过';
    const missing = missingFields({ result }, 'review');
    if (missing.length) return { ok: false, error: '请选择复核结果', missing };
    if (values.destination) person.transfer.actualDestination = normalizeDestination(values.destination);
    const record = {
      id: `review-${id}-${person.transfer.reviewRecords.length + 1}`, at: timestamp(), result,
      reviewerId: data.executors.li.id, reviewerName: person.reviewer || data.executors.li.name,
      note: values.note || '', contact: values.contact || '', photos: copy(values.photos || [])
    };
    person.transfer.reviewRecords.push(record);
    person.transfer.reviewDraft = null;
    // C01: status becomes 已复核 once there is at least 1 review record
    // Exception/退回 doesn't reset to 待复核 or change to 异常跟进
    person.transfer.status = '已复核';
    // Keep abnormal info in record but don't change task status backwards
    if (result !== '通过') {
      person.abnormal = result;
    }
    addEvent(person, '复核确认', `${record.reviewerName}：${result}${record.note ? '；' + record.note : ''}`, record.reviewerName);
    return { ok: true, record };
  }

  // C13/N09: restore only requires confirmation; fix field name mapping in history
  function restore(id, values = {}) {
    const person = task(id);
    if (!person || !inScope(person) || !['待返家','返家异常'].includes(person.transfer.status)) return { ok: false, error: '当前没有待办理返家任务' };
    const missing = missingFields(values, 'restore');
    if (missing.length) return { ok: false, error: '请选择' + missing.map(f => f.label).join('、'), missing };
    const conditions = values.conditions || {};
    person.transfer.restore = copy(values);
    person.transfer.status = values.abnormal ? '返家异常' : '已返家';
    person.abnormal = values.abnormal ? '返家条件不具备' : '';
    // N09: proper Chinese field name mapping for history
    const fieldLabels = {
      confirmation: '到家确认', house: '房屋安全', road: '道路通行',
      utilities: '水电恢复', person: '人员状态', method: '返家方式'
    };
    const conditionDesc = Object.entries(conditions)
      .filter(([, v]) => v)
      .map(([k, v]) => (fieldLabels[k] || k) + '：' + v)
      .join('；');
    const detail = [conditionDesc, values.note].filter(Boolean).join('；') || '已确认返家';
    addEvent(person, values.abnormal ? '返家异常' : '返家到位', detail);
    return { ok: true };
  }

  function handover(id, executorId, reason = '') {
    const person = task(id), next = Object.values(data.executors).find(item => item.id === executorId);
    if (!person || !inScope(person) || ['已复核','已返家'].includes(person.transfer.status)) return { ok: false, error: '已完成记录不能转交' };
    if (!next || next.id === person.assignment.currentExecutor.id) return { ok: false, error: '请选择其他办理人' };
    const previous = person.assignment.currentExecutor;
    person.assignment.transferHistory.push({ at: timestamp(), fromExecutorId: previous.id, fromExecutorName: previous.name, toExecutorId: next.id, toExecutorName: next.name, reason });
    person.assignment.currentExecutor = { ...next };
    addEvent(person, '责任转交', `${previous.name} → ${next.name}${reason ? '；' + reason : ''}`, previous.name);
    return { ok: true };
  }

  function photo(id, stage) {
    const person = task(id);
    if (!person || !inScope(person)) return null;
    person.transfer.photos ||= [];
    const item = { id: `photo-${id}-${person.transfer.photos.length + 1}`, at: timestamp(), stage };
    person.transfer.photos.push(item);
    addEvent(person, '现场凭证', `${stage}照片已采集，供人工对照`);
    return item;
  }

  // C08/N05: supplement records actual field changes with before/after, Chinese field names
  function supplementPlacement(id, values = {}) {
    const person = task(id);
    if (!person || !inScope(person)) return { ok: false, error: '当前人员不可操作' };

    // Chinese field name mapping
    const fieldLabels = {
      type: '安置方式', placeName: '地点名称', address: '地址', contact: '联系人',
      phone: '电话', detail: '床位/房间', careNeed: '特殊照护', customType: '安置类型',
      relationship: '关系', residentCount: '入住人数', careLevel: '护理等级',
      transport: '交通方式', followupAt: '跟进时间', placeId: '安置点',
      capacityLabel: '接收情况', area: '区域', bed: '床位'
    };

    // Format value for display (handle objects like location)
    function formatVal(v) {
      if (v === undefined || v === null || v === '') return '（空）';
      if (typeof v === 'object') {
        if (v.lng && v.lat) return `坐标(${v.lng},${v.lat})`;
        return JSON.stringify(v);
      }
      return String(v);
    }

    // Track field changes with before/after values
    const changes = [];
    const oldDest = person.transfer.actualDestination ? copy(person.transfer.actualDestination) : null;

    const dest = values.destination ? normalizeDestination(values.destination) : null;
    if (dest) {
      // Compare destination fields
      const fieldsToCheck = ['type', 'placeId', 'placeName', 'customType', 'address', 'contact', 'phone',
        'detail', 'careNeed', 'relationship', 'residentCount', 'careLevel', 'transport', 'followupAt',
        'area', 'bed', 'location'];
      fieldsToCheck.forEach(field => {
        const oldVal = oldDest?.[field];
        const newVal = dest[field];
        // Deep compare for objects (like location)
        const oldStr = JSON.stringify(oldVal ?? null);
        const newStr = JSON.stringify(newVal ?? null);
        if (oldStr !== newStr && (oldVal || newVal)) {
          const label = fieldLabels[field] || field;
          changes.push({ field: label, before: formatVal(oldVal), after: formatVal(newVal) });
        }
      });
      person.transfer.actualDestination = copy(dest);
      if (values.transferResult) {
        const oldResult = person.transfer.transferResult;
        if (oldResult !== values.transferResult) {
          changes.push({ field: '转移办理结果', before: oldResult || '（空）', after: values.transferResult });
        }
        person.transfer.transferResult = values.transferResult;
      }
    }

    // Check other top-level fields
    if (values.transferResult && !dest) {
      const oldResult = person.transfer.transferResult;
      if (oldResult !== values.transferResult) {
        changes.push({ field: '转移办理结果', before: oldResult || '（空）', after: values.transferResult });
        person.transfer.transferResult = values.transferResult;
      }
    }

    // Only record event if there are actual changes or a note
    if (changes.length > 0 || values.note) {
      const changeDesc = changes.length > 0
        ? changes.map(c => `${c.field}：${c.before} → ${c.after}`).join('；')
        : '';
      const detail = [values.note, changeDesc].filter(Boolean).join('；') || '补充安置信息';
      addEvent(person, '补充安置信息', detail);
    }
    return { ok: true };
  }

  // Modify placement arrangement: requires reason, preserves history
  function modifyPlacement(id, values = {}) {
    const person = task(id);
    if (!person || !inScope(person)) return { ok: false, error: '当前人员不可操作' };
    if (!values.reason) return { ok: false, error: '修改安置安排需填写修改原因' };

    const oldDest = person.transfer.actualDestination ? copy(person.transfer.actualDestination) : null;
    const dest = values.destination ? normalizeDestination(values.destination) : null;
    if (dest) {
      person.transfer.actualDestination = copy(dest);
    }

    // Record the modification with reason and before/after
    const fieldLabels = {
      type: '安置方式', placeName: '地点名称', address: '地址', contact: '联系人',
      phone: '电话', detail: '床位/房间', careNeed: '特殊照护', placeId: '安置点'
    };
    function formatVal(v) {
      if (v === undefined || v === null || v === '') return '（空）';
      if (typeof v === 'object') {
        if (v.lng && v.lat) return `坐标(${v.lng},${v.lat})`;
        return JSON.stringify(v);
      }
      return String(v);
    }
    const changes = [];
    if (oldDest && dest) {
      ['type', 'placeId', 'placeName', 'address', 'contact', 'phone', 'detail', 'careNeed'].forEach(field => {
        const oldStr = JSON.stringify(oldDest[field] ?? null);
        const newStr = JSON.stringify(dest[field] ?? null);
        if (oldStr !== newStr && (oldDest[field] || dest[field])) {
          changes.push(`${fieldLabels[field] || field}：${formatVal(oldDest[field])} → ${formatVal(dest[field])}`);
        }
      });
    }
    const detail = [`修改原因：${values.reason}`, changes.join('；')].filter(Boolean).join('；');
    addEvent(person, '修改安置安排', detail);

    // If modifying after review, add a note that re-confirmation may be needed
    if (['已复核'].includes(person.transfer.status)) {
      addEvent(person, '待重新确认', '安置信息已修改，建议重新确认复核');
    }
    return { ok: true };
  }

  function batch(rows, draft = false) {
    return rows.map(row => ({ id: row.id, ...save(row.id, row.values, draft) }));
  }

  window.TransferStore = {
    task, scoped, counts, hierarchy, groups, normalizeDestination, missingFields,
    parseVoice, eligible, inScope, save, review, restore, handover, photo,
    supplementPlacement, modifyPlacement, batch, sync, statuses, resultToStatus, abnormalResult, collectTaskIds
  };
})();
