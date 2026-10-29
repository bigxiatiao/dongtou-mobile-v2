const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const dir = __dirname;

const sandbox = { window: {}, console };
vm.runInNewContext(fs.readFileSync(`${dir}/collection-data.js`, 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(`${dir}/transfer-data.js`, 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(`${dir}/transfer-store.js`, 'utf8'), sandbox);

const { window } = sandbox, { CollectionStore: collection, TransferDemoData: data, TransferStore: store } = window;
assert.ok(store && data);

// === Issue 04: Data fixtures ===
// 17 people, each a unique collection person
assert.equal(data.people.length, 17, 'should have 17 people');
assert.equal(new Set(data.people.map(p => p.person.collectionPersonId)).size, 17, 'each person unique');

// 8 statuses, each at least 2 people
const statusCounts = store.counts();
for (const status of store.statuses) {
  assert.ok(statusCounts[status] >= 2, `${status} should have at least 2 people, got ${statusCounts[status]}`);
}

// Multi-door, multi-building, multi-room layout
const tree = store.hierarchy('all');
assert.ok(tree.length >= 2, 'should have at least 2 doors');
const door18 = tree.find(d => d.id === 'door-18');
assert.ok(door18, 'door-18 should exist');
assert.ok(door18.buildings.length >= 2, 'door-18 should have at least 2 buildings');

// Same room, same status (room-302 has P01 and P11 both 待转移)
const room302 = store.task('P01');
assert.equal(room302.person.roomId, 'room-302');
const p11 = store.task('P11');
assert.equal(p11.person.roomId, 'room-302');
assert.equal(p11.status, '待转移');

// Same room, different status (room-302 has P01 待转移, P02 转移途中, etc.)
const room302People = data.people.filter(p => p.person.roomId === 'room-302');
assert.ok(room302People.length >= 4, 'room-302 should have 4+ people');
const room302Statuses = new Set(room302People.map(p => p.status));
assert.ok(room302Statuses.size >= 3, 'room-302 should have 3+ different statuses');

// Stable archive relations
for (const person of data.people) {
  const record = collection.get('person', person.person.collectionPersonId);
  assert.ok(record, 'archive record exists for ' + person.person.collectionPersonId);
  assert.equal(record.name, person.name);
  assert.equal(record.roomId, person.person.roomId);
  assert.equal(record.scopeId, person.assignment.scopeId);
  assert.ok(collection.related(record).room);
  assert.ok(collection.related(record).building);
}

console.log('PASS: 16 people, 8 statuses 2+ each, multi-door/building/room, stable archive relations');

// === Issue 04: Scope and hierarchy ===
collection.setScope('dp03');
assert.equal(store.scoped().length, 16, 'dp03 should have 16 people (P03 is bq01)');

collection.setScope('bq01');
assert.equal(store.scoped().length, 1, 'bq01 should have 1 person');
assert.equal(store.scoped()[0].name, '王建国');

collection.setScope('dp03');

// Hierarchy: fixed 4-layer tree
const h = store.hierarchy('all');
assert.ok(h.length >= 2, 'at least 2 doors in dp03');
// door-18 should have building-18-3 and building-18-5
const d18 = h.find(d => d.id === 'door-18');
assert.ok(d18, 'door-18 in hierarchy');
assert.ok(d18.buildings.length >= 2, 'door-18 has 2+ buildings');
const b185 = d18.buildings.find(b => b.id === 'building-18-5');
assert.ok(b185, 'building-18-5 exists');
assert.ok(b185.rooms.length >= 1, 'building-18-5 has rooms');

// Count consistency: hierarchy total = scoped total
const hierarchyTotal = h.reduce((n, d) => n + d.memberCount, 0);
assert.equal(hierarchyTotal, store.scoped().length, 'hierarchy total matches scoped count');

// Status filter: tree only shows matching people
const pendingTree = store.hierarchy('待转移');
const pendingIds = [];
pendingTree.forEach(d => d.buildings.forEach(b => b.rooms.forEach(r => r.members.forEach(p => pendingIds.push(p.id)))));
assert.ok(pendingIds.length >= 2, '待转移 tree has 2+ people');
assert.ok(pendingIds.includes('P01'));
assert.ok(pendingIds.includes('P11'));

console.log('PASS: scope filtering, fixed 4-layer hierarchy, status tree filtering');

// === Issue 05: Selection and batch ===
// collectTaskIds works at each level
const doorNode = h.find(d => d.id === 'door-18');
const doorIds = store.collectTaskIds(doorNode, 'door');
assert.ok(doorIds.length > 0, 'door collects task ids');

const buildingNode = doorNode.buildings.find(b => b.id === 'building-18-3');
const buildingIds = store.collectTaskIds(buildingNode, 'building');
assert.ok(buildingIds.length > 0, 'building collects task ids');

const roomNode = buildingNode.rooms.find(r => r.id === 'room-302');
const roomIds = store.collectTaskIds(roomNode, 'room');
assert.ok(roomIds.length >= 4, 'room-302 has 4+ members');

console.log('PASS: collectTaskIds at door/building/room levels');

// === Status mapping (latest rules: 已到达待安置 removed, 人员不在家→待转移) ===
assert.equal(store.resultToStatus('转移途中'), '转移途中');
assert.equal(store.resultToStatus('已落实安置'), '待复核');
assert.equal(store.resultToStatus('拒绝转移'), '异常跟进');
assert.equal(store.resultToStatus('人员不在家'), '待转移');
assert.equal(store.resultToStatus('联系不上'), '异常跟进');
assert.equal(store.resultToStatus('其他异常'), '异常跟进');

// abnormalResult (人员不在家 is NOT abnormal)
assert.equal(store.abnormalResult('拒绝转移'), true);
assert.equal(store.abnormalResult('联系不上'), true);
assert.equal(store.abnormalResult('人员不在家'), false);
assert.equal(store.abnormalResult('已落实安置'), false);
assert.equal(store.abnormalResult('转移途中'), false);

console.log('PASS: transferResult → status mapping correct (new rules)');

// === C02: Minimal validation - only transferResult required ===
// Only transferResult required, placementType optional
const missing1 = store.missingFields({});
assert.ok(missing1.length >= 1, 'empty form has missing fields');
assert.ok(missing1.some(f => f.key === 'transferResult'));
assert.ok(!missing1.some(f => f.key === 'placementType'), 'placementType is optional');

// With only result, no missing
const missing2 = store.missingFields({ transferResult: '转移途中' });
assert.equal(missing2.length, 0, 'result only = no missing');

// With result + type, no missing
const missing2b = store.missingFields({ transferResult: '转移途中', placementType: 'center' });
assert.equal(missing2b.length, 0, 'result + type = no missing');

// 已落实安置 + 去向未明 = conflict
const missing3 = store.missingFields({ transferResult: '已落实安置', placementType: 'unknown' });
assert.ok(missing3.length > 0, '已落实安置 + unknown = conflict');

// 异常结果 doesn't need placement details
const missing4 = store.missingFields({ transferResult: '联系不上', placementType: 'unknown' });
assert.equal(missing4.length, 0, '联系不上 + unknown = ok');

// C09: validation of optional fields when filled
const missing5 = store.missingFields({ transferResult: '转移途中', destination: { phone: 'abc' } });
assert.ok(missing5.length > 0, 'invalid phone format detected');
assert.ok(missing5.some(f => f.key === 'phone'));

const missing6 = store.missingFields({ transferResult: '转移途中', destination: { residentCount: '-5' } });
assert.ok(missing6.length > 0, 'negative residentCount detected');

const missing7 = store.missingFields({ transferResult: '转移途中', destination: { careLevel: '特级护理' } });
assert.ok(missing7.length > 0, 'invalid careLevel option detected');

console.log('PASS: C02 minimal validation, C09 optional field validation, conflict detection');

// === Issue 06: Save with new result mapping ===
// Save P01 with 已落实安置 → 待复核
const p01 = store.task('P01');
const out1 = store.save('P01', {
  transferResult: '已落实安置',
  placementType: 'center',
  destination: { type: 'center', placeId: 'shelter-001' }
});
assert.equal(out1.ok, true);
assert.equal(p01.transfer.status, '待复核');
assert.equal(p01.transfer.transferResult, '已落实安置');

// Save P11 with 转移途中 → 转移途中
const p11task = store.task('P11');
const out2 = store.save('P11', {
  transferResult: '转移途中',
  placementType: 'center',
  destination: { type: 'center', placeId: 'shelter-001' }
});
assert.equal(out2.ok, true);
assert.equal(p11task.transfer.status, '转移途中');
const p11TransferEvent = p11task.transfer.events[p11task.transfer.events.length - 1];
assert.equal(p11TransferEvent.type, '转移办理');
assert.ok(p11TransferEvent.detail.includes('办理结果：转移途中（已出发，尚未到达）'), 'timeline explains the transfer result');
assert.ok(p11TransferEvent.detail.includes('安置方式：集中安置'), 'timeline labels the placement method');
assert.ok(p11TransferEvent.detail.includes('安置地点：东屏避灾安置中心'), 'timeline labels the placement location');

// Save with 拒绝转移 → 异常跟进
const p01reset = store.task('P01');
p01reset.transfer.status = '待转移'; store.sync(p01reset);
const out3 = store.save('P01', { transferResult: '拒绝转移', placementType: 'unknown' });
assert.equal(out3.ok, true);
assert.equal(p01reset.transfer.status, '异常跟进');
assert.equal(p01reset.abnormal, '拒绝转移');

// Draft doesn't change status
const p11reset = store.task('P11');
p11reset.transfer.status = '待转移'; store.sync(p11reset);
const out4 = store.save('P11', { transferResult: '已落实安置', placementType: 'center' }, true);
assert.equal(out4.ok, true);
assert.equal(p11reset.transfer.status, '待转移', 'draft does not change status');

console.log('PASS: save with result mapping, draft preserves status');

// === Batch independence ===
collection.setScope('dp03');
// Reset P01 to 待转移
const p01r = store.task('P01');
p01r.transfer.status = '待转移'; store.sync(p01r);

const batchResult = store.batch([
  { id: 'P01', values: { transferResult: '已落实安置', placementType: 'center', destination: { type: 'center', placeId: 'shelter-001' } } },
  { id: 'P11', values: { transferResult: '联系不上', placementType: 'unknown' } }
]);
assert.equal(batchResult[0].ok, true);
assert.equal(batchResult[1].ok, true);
assert.equal(store.task('P01').transfer.status, '待复核');
assert.equal(store.task('P11').transfer.status, '异常跟进');

// Batch with one failure doesn't affect others
const p01again = store.task('P01');
p01again.transfer.status = '待转移'; store.sync(p01again);
const batchResult2 = store.batch([
  { id: 'P01', values: { transferResult: '已落实安置', placementType: 'center', destination: { type: 'center', placeId: 'shelter-001' } } },
  { id: 'P11', values: {} } // missing fields, should fail
]);
assert.equal(batchResult2[0].ok, true);
assert.equal(batchResult2[1].ok, false);

console.log('PASS: batch independence, failure isolation');

// === Review: multiple, immutable history ===
assert.equal(store.review('P01', {}).ok, true);
const firstRecord = JSON.stringify(store.task('P01').transfer.reviewRecords[0]);
const reviewCount = store.task('P01').transfer.reviewRecords.length;
assert.equal(store.review('P01', {}).ok, true);
assert.equal(store.task('P01').transfer.reviewRecords.length, reviewCount + 1);
assert.equal(JSON.stringify(store.task('P01').transfer.reviewRecords[0]), firstRecord, 'old review not modified');

console.log('PASS: multiple reviews, immutable history');

// === Handover ===
// Reset P01 to a transferable status first
store.task('P01').transfer.status = '异常跟进'; store.sync(store.task('P01'));
assert.equal(store.handover('P01', 'u-lin-hai', '临时请假').ok, true);
assert.equal(store.task('P01').assignment.currentExecutor.name, '林海');

// === Restore ===
const p06 = store.task('P06');
assert.equal(store.restore('P06', { conditions: { house: '安全可入住', road: '正常', person: '身体正常', confirmation: '现场确认' } }).ok, true);
assert.equal(p06.transfer.status, '已返家');

// Restore fails when conditions unsafe without abnormal flag
const p06reset = store.task('P06');
p06reset.transfer.status = '待返家'; store.sync(p06reset);
assert.equal(store.restore('P06', { conditions: { house: '不可入住', road: '正常', person: '身体正常' } }).ok, false);
assert.equal(store.restore('P06', { abnormal: true, conditions: { house: '不可入住', road: '正常', person: '身体正常' }, note: '积水未退' }).ok, true);
assert.equal(store.task('P06').transfer.status, '返家异常');

console.log('PASS: handover, restore, restore abnormal');

// === Voice parsing: covers all editable fields ===
for (const sample of data.voiceExamples) {
  const parsed = store.parseVoice(sample.text);
  if (sample.type === 'relative') {
    assert.equal(parsed.type, 'relative');
    assert.equal(parsed.contact, '王晓梅');
    assert.equal(parsed.relationship, '子女');
    assert.equal(parsed.phone, '13700008890');
  }
  if (sample.type === 'center') {
    assert.equal(parsed.type, 'center');
    assert.equal(parsed.placeId, 'shelter-001');
  }
  if (sample.type === 'hotel') {
    assert.equal(parsed.type, 'hotel');
    assert.equal(parsed.contact, '周经理');
    assert.equal(parsed.placeName, '洞头海逸酒店');
    assert.equal(parsed.detail, '208');
  }
  if (sample.type === 'care') {
    assert.equal(parsed.type, 'care');
    assert.ok(parsed.placeName.includes('福利院'));
    assert.ok(parsed.careLevel);
  }
  if (sample.type === 'other') {
    assert.equal(parsed.type, 'other');
    assert.ok(parsed.customType);
    assert.ok(parsed.transport);
  }
  if (sample.type === 'unknown') {
    assert.equal(parsed.type, 'unknown');
    assert.ok(parsed.followupAt);
  }
  if (sample.type === 'note') {
    assert.ok(parsed.note, '办理说明 should be parsed');
  }
}

// Unmatched speech is kept as note rather than silently discarded.
assert.equal(store.parseVoice('老人带了药，需要女儿陪同。').note, '老人带了药，需要女儿陪同');
const mixedVoice = store.parseVoice('投亲靠友，亲友姓名王晓梅，关系子女，电话13700008890，地址海滨路88号，老人带了降压药，需要女儿陪同。');
assert.equal(mixedVoice.contact, '王晓梅');
assert.equal(mixedVoice.address, '海滨路88号');
assert.equal(mixedVoice.note, '老人带了降压药，需要女儿陪同');
assert.ok(!mixedVoice.note.includes('13700008890'), 'matched phone is not repeated in note');
const unknownRelationship = store.parseVoice('投亲靠友，关系老同学，办理说明请傍晚回访。');
assert.ok(!unknownRelationship.relationship, 'unmatched option is not written to selector');
assert.ok(unknownRelationship.note.includes('关系老同学'), 'unmatched option text is retained');
assert.ok(unknownRelationship.note.includes('请傍晚回访'));
const countWithNote = store.parseVoice('入住人数3人，其中老人2名、儿童1名。');
assert.equal(countWithNote.residentCount, '3');
assert.equal(countWithNote.note, '其中老人2名、儿童1名');

console.log('PASS: voice parsing covers all field types');

// === Configured shelter: read-only auto-fill ===
const normalized = store.normalizeDestination({ type: 'center', placeId: 'shelter-001', address: '伪地址', contact: '伪姓名', phone: '0' });
assert.equal(normalized.address, data.shelters[0].address);
assert.equal(normalized.phone, data.shelters[0].phone);
assert.equal(normalized.contact, data.shelters[0].contact);
assert.equal(normalized.location.lng, data.shelters[0].location.lng);

// Shelter capacity not modified by photo
const originalCapacity = data.shelters[0].occupied;
store.photo('P02', '转移');
assert.equal(data.shelters[0].occupied, originalCapacity, 'shelter capacity unchanged');

console.log('PASS: configured shelter auto-fill, read-only capacity');

// === Supplement placement without changing status ===
const p09 = store.task('P09');
const statusBefore = p09.transfer.status;
const supOut = store.supplementPlacement('P09', {
  destination: { type: 'relative', contact: '新联系人', phone: '13800001111' },
  note: '补充亲友联系方式'
});
assert.equal(supOut.ok, true);
assert.equal(p09.transfer.status, statusBefore, 'supplement does not change status');
assert.equal(p09.transfer.actualDestination.contact, '新联系人');

console.log('PASS: supplement placement preserves status');

// === Refresh restores initial state ===
const fresh = { window: {} };
for (const file of ['collection-data.js', 'transfer-data.js', 'transfer-store.js']) {
  vm.runInNewContext(fs.readFileSync(`${dir}/${file}`, 'utf8'), fresh);
}
assert.equal(fresh.window.TransferStore.task('P01').status, '待转移');
assert.equal(new Set(fresh.window.TransferDemoData.people.map(p => p.status)).size, 8, 'all 8 statuses present after refresh');

console.log('PASS: refresh restores initial state');

// === Page entry smoke test (minimal DOM boundary) ===
const nodes = new Map();
const views = ['home','transfer-list','transfer','review','grid-restore','batch','collection-detail'].map(id => ({
  id, active: id === 'home', innerHTML: '', querySelector: () => null, querySelectorAll: () => [],
  classList: { toggle(name, on) { if (name === 'active') views.find(v => v.classList === this).active = on; }, add() {}, remove() {} }
}));
function node() {
  const n = { textContent: '', innerHTML: '', style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {} }, value: '', hidden: false };
  n.querySelector = () => node();
  n.querySelectorAll = () => [];
  return n;
}
const appMock = {
  queryAll: selector => selector === '.view' ? views : [],
  querySelector: selector => selector === '.view.active' ? views.find(v => v.active) : null,
  querySelectorAll: selector => selector === '.view' ? views : [],
  addEventListener() {}, append() {}
};
const documentMock = {
  body: { dataset: { role: 'grid' }, classList: { add() {}, remove() {} } },
  getElementById: id => id === 'app' ? appMock : null,
  querySelector(selector) {
    if (selector[0] === '#' && views.some(v => '#' + v.id === selector)) return views.find(v => '#' + v.id === selector);
    if (!nodes.has(selector)) nodes.set(selector, node());
    return nodes.get(selector);
  },
  querySelectorAll: selector => selector === '.view' ? views : [],
  createElement: () => ({ id: '', className: '', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, append() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [] })
};
fresh.document = documentMock;
fresh.setTimeout = () => 0;
fresh.clearTimeout = () => {};
fresh.window.scrollTo = () => {};
vm.runInNewContext(fs.readFileSync(`${dir}/transfer.js`, 'utf8'), fresh);
const page = fresh.window.TransferDemo;
assert.ok(page, 'TransferDemo initialized');
assert.equal(views.find(v => v.active).id, 'home', 'bootstrap keeps home');

page.showPerson('P01');
assert.equal(views.find(v => v.active).id, 'transfer');
assert.ok(views.find(v => v.id === 'transfer').innerHTML.includes('陈秀英'));

// Back returns to transfer-list
const click = matches => page.handleClick({ target: { closest: selector => matches[selector] || null } });
click({ '[data-transfer-back]': {} });
assert.equal(views.find(v => v.active).id, 'transfer-list');

// Review page for 待复核 (P10 is in dp03)
page.showPerson('P10');
assert.equal(views.find(v => v.active).id, 'review');

// Grid-restore for 待返家
fresh.window.CollectionStore.setScope('dp03');
page.scopeChanged();
page.showPerson('P06');
assert.equal(views.find(v => v.active).id, 'grid-restore');

// C12: list hierarchy keeps the visual columns and level markers in the page output.
page.render();
const transferRowsMarkup = nodes.get('#transferRows')?.innerHTML || '';
assert.ok(transferRowsMarkup.includes('transfer-level-icon'), 'list renders level icons');
assert.ok(transferRowsMarkup.includes('transfer-group-meta'), 'list renders a fixed count column');
assert.ok(transferRowsMarkup.includes('transfer-chevron'), 'list renders an aligned expand affordance');

console.log('PASS: page entry, navigation, stage-specific views');

// === C01: Review status by confirmation count ===
// Reset P01 to 待复核 for testing
const p01test = store.task('P01');
p01test.transfer.status = '待复核';
p01test.transfer.reviewRecords = [];
store.sync(p01test);

// First review → 已复核 (regardless of result)
const review1 = store.review('P01', { result: '通过' });
assert.ok(review1.ok, 'first review succeeds');
assert.equal(p01test.transfer.status, '已复核', 'first review → 已复核');
assert.equal(p01test.transfer.reviewRecords.length, 1, '1 review record');

// Second review (退回补正) → still 已复核, not 异常跟进
const review2 = store.review('P01', { result: '退回补正', note: '资料不全' });
assert.ok(review2.ok, 'second review succeeds');
assert.equal(p01test.transfer.status, '已复核', 'second review → still 已复核');
assert.equal(p01test.transfer.reviewRecords.length, 2, '2 review records');
assert.equal(p01test.transfer.reviewRecords[1].result, '退回补正', 'exception recorded');

console.log('PASS: C01 review status by count, not result');

// === C08: Supplement records actual field changes ===
const p10test = store.task('P10');
const eventsBefore = p10test.transfer.events.length;
const oldDest = p10test.transfer.actualDestination ? JSON.parse(JSON.stringify(p10test.transfer.actualDestination)) : null;

// Supplement with new contact, no note
const supp1 = store.supplementPlacement('P10', {
  destination: { type: 'relative', contact: '新联系人', phone: '13800001111' }
});
assert.ok(supp1.ok, 'supplement succeeds');
assert.ok(p10test.transfer.events.length > eventsBefore, 'event recorded even without note');
const lastEvent = p10test.transfer.events[p10test.transfer.events.length - 1];
// Events are stored as [at, type, detail] in the raw transfer.events
assert.equal(lastEvent.type, '补充安置信息', 'event type is 补充安置信息');
assert.ok(lastEvent.detail.includes('联系人'), 'event mentions field change in Chinese');

console.log('PASS: C08 supplement records field changes');

// === C13: Restore only requires confirmation ===
const p06test = store.task('P06');
p06test.transfer.status = '待返家';
store.sync(p06test);

// Only confirmation, all other conditions empty
const restore1 = store.restore('P06', {
  conditions: { confirmation: '现场确认' }
});
assert.ok(restore1.ok, 'restore with only confirmation succeeds');
assert.equal(p06test.transfer.status, '已返家', 'status becomes 已返家');

// Reset for next test
p06test.transfer.status = '待返家';
store.sync(p06test);

// Missing confirmation should fail
const restore2 = store.restore('P06', {
  conditions: { house: '安全可入住' }
});
assert.ok(!restore2.ok, 'restore without confirmation fails');
assert.ok(restore2.error.includes('到家确认'), 'error mentions confirmation');

console.log('PASS: C13 restore only requires confirmation');

// === C10: Voice parsing preserves content ===
const voice1 = store.parseVoice('办理说明：对象情绪稳定，已携带随身药品和身份证件，同行家属一人。');
assert.ok(voice1.note, 'note field parsed');
assert.ok(voice1.note.includes('情绪稳定'), 'note contains first part');
assert.ok(voice1.note.includes('药品'), 'note contains content after comma');
assert.ok(voice1.note.includes('家属'), 'note preserves full content');

const voice2 = store.parseVoice('特殊照护：半失能照护，需要协助服药和日常起居照料。');
assert.ok(voice2.careNeed, 'careNeed field parsed');
assert.ok(!voice2.careNeed.includes('需求需求'), 'no duplicate 需求');

console.log('PASS: C10 voice parsing preserves content');

// === Latest rules: 人员不在家 → 待转移, not abnormal ===
// Reset P11 to initial state (earlier tests modified it)
const p11test = store.task('P11');
p11test.transfer.transferResult = '人员不在家';
p11test.transfer.status = '待转移';
p11test.abnormal = '';
store.sync(p11test);
assert.equal(p11test.transfer.transferResult, '人员不在家', 'P11 has 人员不在家 result');
assert.equal(p11test.status, '待转移', '人员不在家 → 待转移 status');
assert.equal(store.abnormalResult('人员不在家'), false, '人员不在家 is NOT abnormal');

// Save with 人员不在家 → stays 待转移
// Reset P01 to eligible state first
const p01ForSave = store.task('P01');
p01ForSave.transfer.status = '待转移';
p01ForSave.transfer.transferResult = '';
p01ForSave.transfer.actualDestination = null;
p01ForSave.transfer.plannedDestination = null;
store.sync(p01ForSave);
const saveNotHome = store.save('P01', { transferResult: '人员不在家' });
assert.ok(saveNotHome.ok, 'save 人员不在家 succeeds');
assert.equal(p01ForSave.status, '待转移', 'status stays 待转移 after 人员不在家');
const saveNotHomeWithPlan = store.save('P01', {
  transferResult: '人员不在家',
  placementType: 'center',
  destination: { type: 'center', placeId: 'shelter-001' }
});
assert.ok(saveNotHomeWithPlan.ok, 'save 人员不在家 with planned placement succeeds');
assert.equal(p01ForSave.transfer.plannedDestination.placeName, '东屏避灾安置中心');
assert.equal(p01ForSave.transfer.actualDestination, null, 'planned placement is not actual placement');
const notHomeEvent = p01ForSave.transfer.events[p01ForSave.transfer.events.length - 1];
assert.ok(notHomeEvent.detail.includes('计划安置方式：集中安置'), 'not-home history labels planned placement');
// Reset P01 for other tests
p01ForSave.transfer.status = '异常跟进';
p01ForSave.transfer.transferResult = '拒绝转移';
store.sync(p01ForSave);

console.log('PASS: 人员不在家 → 待转移, not abnormal');

// === N06: Strict validation ===
// residentCount must be positive integer
const val1 = store.missingFields({ transferResult: '转移途中', destination: { residentCount: 'abc' } });
assert.ok(val1.some(f => f.key === 'residentCount'), 'non-numeric residentCount rejected');

const val2 = store.missingFields({ transferResult: '转移途中', destination: { residentCount: '1.5' } });
assert.ok(val2.some(f => f.key === 'residentCount'), 'decimal residentCount rejected');

const val3 = store.missingFields({ transferResult: '转移途中', destination: { residentCount: '3' } });
assert.ok(!val3.some(f => f.key === 'residentCount'), 'valid integer residentCount accepted');

// Phone validation in supplement
const val4 = store.missingFields({ transferResult: '转移途中', destination: { phone: 'abc' } });
assert.ok(val4.some(f => f.key === 'phone'), 'invalid phone rejected');

// Relationship must match data.formOptions
const val5 = store.missingFields({ transferResult: '转移途中', destination: { relationship: '邻居' } });
assert.ok(!val5.some(f => f.key === 'relationship'), '邻居 is valid (in data.formOptions)');

console.log('PASS: N06 strict validation');

// === N07: Voice parsing no residue ===
const voice3 = store.parseVoice('特殊照护需求需轮椅');
assert.ok(voice3.careNeed, 'careNeed parsed');
assert.ok(!voice3.careNeed.startsWith('需求'), 'no leading 需求 residue');
assert.ok(voice3.careNeed.includes('轮椅'), 'content preserved');

console.log('PASS: N07 voice parsing no residue');

// === N09: Restore history Chinese field names ===
const p07test = store.task('P07');
p07test.transfer.status = '待返家';
store.sync(p07test);
const restore3 = store.restore('P07', {
  conditions: { confirmation: '电话回访', method: '自行返家' }
});
assert.ok(restore3.ok, 'restore succeeds');
const restoreEvent = p07test.transfer.events[p07test.transfer.events.length - 1];
assert.ok(restoreEvent.detail.includes('到家确认'), 'history contains 到家确认');
assert.ok(restoreEvent.detail.includes('返家方式'), 'history contains 返家方式');
assert.ok(!restoreEvent.detail.includes('undefined'), 'no undefined in history');

console.log('PASS: N09 restore history Chinese field names');

// === modifyPlacement function ===
// Use P10 who is in dp03 scope and in 待复核 status
const p10mod = store.task('P10');
const eventsBefore2 = p10mod.transfer.events.length;
const mod1 = store.modifyPlacement('P10', {
  destination: { type: 'relative', contact: '新联系人', phone: '13800001111' },
  reason: '原联系人无法接应'
});
assert.ok(mod1.ok, 'modifyPlacement succeeds');
assert.ok(p10mod.transfer.events.length > eventsBefore2, 'event recorded');
const modEvent = p10mod.transfer.events[p10mod.transfer.events.length - 1];
assert.equal(modEvent.type, '修改安置安排', 'event type is 修改安置安排');
assert.ok(modEvent.detail.includes('修改原因'), 'event includes reason');

// Without reason should fail
const mod2 = store.modifyPlacement('P10', {
  destination: { type: 'hotel', placeName: '新酒店' }
});
assert.ok(!mod2.ok, 'modifyPlacement without reason fails');

console.log('PASS: modifyPlacement with reason required');

// === Data: no 已到达待安置 in options ===
assert.ok(!data.formOptions.transferResult.includes('已到达待安置'), '已到达待安置 removed from options');

console.log('PASS: Data updated, 已到达待安置 removed');

// Picker regression: execute the actual controller with form fields at the DOM boundary.
const pickerView = views.find(view => view.id === 'transfer');
pickerView.dataset = {};
pickerView.hasAttribute = () => false;
function bindPickerForm(entries) {
  const fields = Object.entries(entries).map(([key, value]) => ({
    dataset: { form: key }, value,
    parentElement: { querySelector: () => null }, closest: () => null
  }));
  pickerView.querySelectorAll = selector => selector === '[data-form]' ? fields : [];
  pickerView.querySelector = selector => fields.find(field => selector === `[data-form="${field.dataset.form}"]`) || null;
}
function choosePicker(key, value) {
  const button = {
    dataset: { transferPicker: key, pickerLabel: key, pickerOptions: JSON.stringify([{ value, label: value }]) },
    closest: selector => selector === '.view' ? pickerView : null
  };
  click({ '[data-transfer-picker]': button });
  click({ '[data-transfer-option]': { dataset: { transferOption: '0' } } });
}
fresh.window.CollectionStore.setScope('dp03');
page.showPerson('P01');
bindPickerForm({ transferResult: '', placementType: '', transferNote: '保留尚未提交的说明' });
assert.doesNotThrow(() => choosePicker('placementType', 'center'), 'first placement selection does not throw');
assert.ok(pickerView.innerHTML.includes('data-transfer-picker="placeId"'), 'selected type renders shelter picker');
assert.ok(pickerView.innerHTML.includes('保留尚未提交的说明'));

bindPickerForm({ transferResult: '', placementType: 'center', placeId: '', transferNote: '保留说明' });
assert.doesNotThrow(() => choosePicker('placeId', 'shelter-001'));
assert.ok(pickerView.innerHTML.includes('东屏避灾安置中心'), 'selected shelter is rendered');
assert.equal((pickerView.innerHTML.replace(/<i data-tabler=[^>]+><\/i>/g, '').match(/<summary>展示更多(?:（选填）)?<\/summary>/g) || []).length, 1, 'only placement extras are collapsed');
assert.ok(!/<details\b[^>]*>(?:(?!<\/details>)[\s\S])*data-form="transferNote"/.test(pickerView.innerHTML), 'handling note is directly visible');
assert.ok(!/<details\b[^>]*>(?:(?!<\/details>)[\s\S])*transfer-evidence/.test(pickerView.innerHTML), '现场照片 is directly visible');

bindPickerForm({ transferResult: '', placementType: 'center', placeId: 'shelter-001', transferNote: '结果切换时的新说明' });
choosePicker('transferResult', '拒绝转移');
assert.ok(!pickerView.innerHTML.includes('data-transfer-picker="placementType"'), 'result selection refreshes conditional fields');
assert.ok(pickerView.innerHTML.includes('结果切换时的新说明'));

page.showPerson('P01');
bindPickerForm({ transferResult: '转移途中', placementType: 'relative', contact: '旧亲友', address: '旧亲友地址' });
choosePicker('placementType', 'hotel');
assert.ok(!pickerView.innerHTML.includes('value="旧亲友"'));
assert.ok(!pickerView.innerHTML.includes('value="旧亲友地址"'), 'type change clears old destination after snapshot');

page.showPerson('P10');
click({ '[data-transfer-supplement-entry]': {} });
bindPickerForm({ placementType: 'relative', contact: '亲友', address: '亲友地址' });
choosePicker('placementType', 'hotel');
assert.ok(pickerView.innerHTML.includes('酒店 / 民宿名称'), 'supplement renders the newly selected type');
assert.ok(!pickerView.innerHTML.includes('亲友姓名'), 'supplement does not reset picker to saved type');
console.log('PASS: first placement/shelter selection, result refresh, type clearing and supplement drafts');

page.showPerson('P01');
bindPickerForm({ transferResult: '转移途中', placementType: 'relative', contact: '原亲友', transferNote: '原有说明' });
choosePicker('transferResult', '转移途中');
const voiceButton = { closest: selector => selector === '.view' ? pickerView : null };
click({ '[data-transfer-voice]': voiceButton });
documentMock.querySelector('#transferVoiceText').value = '投亲靠友，亲友姓名王晓梅，电话13700008890，老人带了药，需要女儿陪同。';
click({ '[data-voice-parse]': {} });
assert.ok(nodes.get('#transferVoicePreview').innerHTML.includes('老人带了药，需要女儿陪同'), 'unmatched speech is previewed as note');
assert.ok(!pickerView.innerHTML.includes('老人带了药，需要女儿陪同'), 'preview does not apply without confirmation');
assert.ok(pickerView.innerHTML.includes('原有说明'));
click({ '[data-voice-apply]': {} });
assert.ok(pickerView.innerHTML.includes('原有说明；老人带了药，需要女儿陪同'), 'confirmation appends to existing note');
assert.ok(pickerView.innerHTML.includes('value="王晓梅"'), 'matched field is filled independently');
console.log('PASS: unmatched voice text previews and appends to visible handling note after confirmation');

console.log('\n✓ All transfer behavior tests passed');
