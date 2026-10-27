/* Run with node field-audit.test.js from any directory. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixture = require('./original-field-fixture.json');
const matrix = fs.readFileSync(path.join(__dirname, 'FIELD-MATRIX.md'), 'utf8');
const originalFields = name => fixture.fields[name];
const originalChoices = name => fixture.choices[name];

const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'collection-data.js'), 'utf8'), sandbox);
const store = sandbox.window.CollectionStore;
const app = {addEventListener() {}};
let checkedTagOptions = [];
const detailTitle = {textContent: ''}, detailBody = {innerHTML: ''};
const document = {getElementById: id => ({app,collectionDetailTitle:detailTitle,collectionDetailBody:detailBody}[id] || null), querySelector: () => null,
  querySelectorAll: selector => selector === '#collectionDetailBody [data-tag-option]:checked' ? checkedTagOptions : []};
const page = fs.readFileSync(path.join(__dirname, 'collection.js'), 'utf8');
const ending = '  renderBrowse();\n})();';
assert.ok(page.includes(ending), 'collection.js bootstrap changed');
const pageSandbox = {window: sandbox.window, document, setTimeout, clearTimeout};
vm.runInNewContext(page.replace(ending, '  window.__audit={renderFields,renderCreateFields,renderTags,selectedTagIds,createContext,requiredMissing,verifyAction,pendingPeopleHtml,renderDetail,buildingRooms};\n})();'), pageSandbox);
const render = pageSandbox.window.__audit;
const sampleRooms=store.related(store.get('building','building-18-3')).rooms;
assert.ok(new Set(sampleRooms.map(room=>room.unit)).size>=2,'sample building shows multiple units');
assert.ok(new Set(sampleRooms.filter(room=>room.unit==='1单元').map(room=>room.floorNum)).size>=3,'sample unit shows multiple floors');
const roomGroups=render.buildingRooms(store.get('building','building-18-3'));
assert.ok(roomGroups.includes('data-detail-unit="1单元"')&&roomGroups.includes('data-detail-unit="2单元"'),'building switches units');
assert.ok(roomGroups.indexOf('1层')<roomGroups.indexOf('2层')&&roomGroups.indexOf('2层')<roomGroups.indexOf('3层'),'floors ascend');
assert.ok(roomGroups.includes('data-add-room-floor='),'room creation is attached to floor');
const configs = {door: 'men_option', building: 'lou_option', room: 'hs_option', person: 'persop_option'};
const optionNames = {
  legalStatus: 'columns_legalStatus', underground: 'columns_wdmjzddxjz',
  state: 'columns_useStatus', specialSituation: 'columns_tsqk',
  maritalStatus: 'columns_hyzt', education: 'columns_sjycd', nation: 'columns_mz',
  residentStatus: 'columns_zhzt', residentIdentity: 'columns_zhsf',
  personType: 'columns_zhrylx', relationship: 'columns_relationship', gender: 'columns_gender'
};
let checked = 0;
for (const [type, name] of Object.entries(configs)) {
  const original = originalFields(name);
  const fields = store.schemas[type].fields.slice(0, original.length);
  assert.equal(fields.length, original.length, type + ' count');
  assert.deepEqual(Array.from(fields, f => f.sourceKey), original.map(f => f.key), type + ' source key order');
  const section = matrix.split('## ' + {door: '门址', building: '楼栋', room: '户室', person: '人员'}[type] + ' `' + name + '`')[1]?.split('\n## ')[0];
  assert.ok(section, type + ' matrix section');
  const rows = section.split('\n').filter(line => /^\| (?:`?[\w,]+`?)(?: → \w+)? \|/.test(line));
  const mappings = rows.map(line => line.split('|')[1].trim().replaceAll('`', '').split(' → '));
  assert.deepEqual(mappings.map(x => x[0]), original.map(x => x.key), type + ' matrix source key order');
  assert.deepEqual(mappings.map((x, i) => x[1] || x[0]), Array.from(fields, f => f.key), type + ' matrix demo key order');
  for (let i = 0; i < original.length; i++) {
    const a = original[i], f = fields[i];
    assert.equal(f.label, a.title, type + ' label ' + a.key);
    assert.equal(f.required, a.required, type + ' required ' + a.key);
    if (a.disabled) assert.equal(f.editable, false, type + ' disabled ' + a.key);
    if (a.photo) assert.equal(f.type, 'photo', type + ' photo ' + a.key);
    else if (a.select) assert.ok(['select', 'lookup', 'relation', 'date'].includes(f.type), type + ' picker ' + a.key);
    else if (!a.readonly) assert.equal(f.type, a.type, type + ' type ' + a.key);
    if (optionNames[f.key]) assert.deepEqual(Array.from(f.options), originalChoices(optionNames[f.key]), type + ' options ' + a.key);
    checked++;
  }
  const record = {door: store.state.data.doors[0], building: store.state.data.buildings[0],
    room: store.state.data.rooms[0], person: store.state.data.people[0]}[type];
  const parent = type === 'room' ? {buildingId: record.buildingId} : type === 'person' ? {roomId: record.roomId} : {};
  const context = render.createContext(type, parent);
  for (const [mode, html] of [
    ['create', render.renderCreateFields(type, context)],
    ['detail', render.renderFields(type, record)],
    ['edit', render.renderFields(type, record, true)]
  ]) {
    let last = -1;
    const expected = store.visibleFields(type, mode, record);
    for (const f of expected) {
      const index = html.indexOf('>' + f.label, last + 1);
      assert.ok(index > last, type + ' ' + mode + ' render order ' + f.key);
      last = index;
      const selector = mode === 'create' ? 'data-create-field="' + f.key + '"' : 'data-field="' + f.key + '"';
      if (mode === 'detail' || f.editable === false && mode === 'edit' || f.createable === false && mode === 'create') {
        assert.ok(!html.includes(selector), type + ' ' + mode + ' readonly ' + f.key);
      }
    }
    if (type === 'door' || type === 'building') {
      assert.equal(html.includes('>采集地址'), false, type + ' ' + mode + ' collected record');
    }
  }
  const missing = {...context, [type === 'door' || type === 'building' ? 'location' : type === 'room' ? 'homeNum' : 'name']: ''};
  assert.equal(render.requiredMissing(type, missing), true, type + ' incomplete create');
}
for (const type of ['door', 'building']) {
  const census = {...store.state.data[type === 'door' ? 'doors' : 'buildings'][0], dataType: 0, collectAddress: '七普原址'};
  assert.ok(render.renderFields(type, census).includes('>采集地址'), type + ' census detail');
  const edited = render.renderFields(type, census, true);
  assert.ok(edited.includes('data-field="collectAddress"'), type + ' census edit');
  assert.ok(!edited.includes('data-field="street"'), type + ' census readonly');
  assert.equal(render.requiredMissing(type, {...census, gridCode: '', location: ''}, 'edit'), false, type + ' census readonly required');
}
assert.ok(render.renderFields('building', {...store.state.data.buildings[0], yardAlias: []}, true).includes('data-field="yardAlias"'), 'empty repeatable edit input');
const building = store.state.data.buildings[0];
assert.equal(store.fieldValue({lon: 121.15, lat: 27.83}, store.schemas.door.fields[3]), '121.15,27.83');
assert.equal(store.originalRecord('door', {location: '121.15,27.83', legalStatus: '临时地址'}).lon, 121.15);
assert.equal(store.originalRecord('door', {location: '121.15,27.83', legalStatus: '临时地址'}).lat, 27.83);
assert.equal(store.originalRecord('door', {legalStatus: '临时地址'}).legalStatus, '临时地址');
assert.equal(store.originalRecord('building', {legalStatus: '临时地址'}).legalStatus, 0);
assert.equal(store.fieldValue({state: 0}, store.schemas.room.fields[5]), '无效');
assert.equal(store.originalRecord('room', {state: '无效'}).state, 0);
assert.equal(store.originalRecord('building', {...building, doorNumber: ['18号', '19号'], photo: ['a.jpg']}).door[1], '19号');
assert.equal(store.originalRecord('building', building).affiliatedDoorAddressUuids[0], building.doorIds[0]);
assert.ok(store.generatedAddress('room', {buildingId: building.id, unit: '1单元', floor: '3层', homeNum: '302室'}).startsWith(building.standardAddress));
store.update('building', building.id, {doorNumber: ['18号', '19号']});
assert.ok(!building.address.includes(','), 'repeated door numbers must not add commas to address');
const doorValues = {...render.createContext('door', {}), street: '测试路', doorNumber: '1号'};
doorValues.standardAddress = store.generatedAddress('door', doorValues);
assert.equal(render.requiredMissing('door', doorValues), false);
const newDoor = store.addDoor(doorValues);
const buildingValues = {...render.createContext('building', {}), buildingNumber: '1幢', doorIds: [newDoor.id], tagIds: ['building-old', 'building-danger']};
buildingValues.standardAddress = store.generatedAddress('building', buildingValues);
assert.equal(render.requiredMissing('building', buildingValues), false);
const newBuilding = store.addBuilding(buildingValues);
assert.ok(newBuilding && store.related(newDoor).buildings.some(x => x.id === newBuilding.id));
assert.deepEqual(Array.from(newBuilding.tagIds), buildingValues.tagIds, 'building create saves multiple tags');
const roomValues = {...render.createContext('room', {buildingId: newBuilding.id}), homeNum: '101室'};
roomValues.address = store.generatedAddress('room', roomValues);
assert.equal(render.requiredMissing('room', roomValues), false);
const newRoom = store.addRoom(roomValues);
const personValues = {...render.createContext('person', {roomId: newRoom.id}), name: '测试人员', idNo: '330305199001011234', gender: '男', personType: '普通人员', birthdate: '1990-01-01', phone: '13800000000', nation: '汉族', microGridNumber: '东屏03网格', tagIds: ['person-alone', 'person-elder']};
personValues.standardAddress = newRoom.address;
assert.equal(render.requiredMissing('person', personValues), false);
const newPerson = store.addPerson(personValues);
assert.ok(newPerson && store.related(newRoom).people.some(x => x.id === newPerson.id));
assert.deepEqual(Array.from(newPerson.tagIds), personValues.tagIds, 'person create saves multiple tags');
for (const type of ['building', 'person']) {
  const catalog = store.tagCatalog(type);
  assert.equal(catalog.length, type === 'building' ? 4 : 6, type + ' catalog count');
  assert.ok(catalog.every((tag, i) => tag.appliesTo === type && tag.enabled && (i === 0 || catalog[i - 1].sort <= tag.sort)), type + ' catalog metadata');
  const ids = Array.from(catalog.slice(0, 2), tag => tag.id);
  const createHtml = render.renderCreateFields(type, type === 'person' ? {roomId: newRoom.id} : {});
  assert.ok(createHtml.indexOf('collection-tag-group') > createHtml.indexOf('>' + store.schemas[type].fields.at(-1).label), type + ' tags follow original fields');
  assert.ok(ids.every(id => createHtml.includes('data-tag-option="' + id + '"')), type + ' create options');
  checkedTagOptions = ids.map(tagOption => ({dataset: {tagOption}}));
  assert.deepEqual(JSON.parse(JSON.stringify(render.selectedTagIds(type))), ids, type + ' checked multiselect');
  const item = type === 'building' ? newBuilding : newPerson;
  store.update(type, item.id, {tagIds: render.selectedTagIds(type)});
  assert.deepEqual(JSON.parse(JSON.stringify(store.get(type, item.id).tagIds)), ids, type + ' saved tags');
  const reopened = render.renderTags(type, store.get(type, item.id).tagIds, true);
  assert.ok(ids.every(id => reopened.includes('data-tag-option="' + id + '" checked')), type + ' reopened edit selection');
  const detail = render.renderTags(type, store.get(type, item.id).tagIds);
  assert.ok(catalog.slice(0, 2).every(tag => detail.includes(tag.name)), type + ' detail names');
  const removed = ids.slice(1);
  store.update(type, item.id, {tagIds: removed});
  assert.deepEqual(Array.from(store.get(type, item.id).tagIds), removed, type + ' edit can deselect');
  assert.deepEqual(Array.from(store.originalRecord(type, item).tagIds || []), [], type + ' original mapping excludes tags');
  assert.deepEqual(JSON.parse(JSON.stringify(store.normalizeTagIds(type, [ids[0], ids[0], 'unknown', store.tagCatalog(type === 'building' ? 'person' : 'building')[0].id]))), [ids[0]], type + ' rejects invalid and duplicate tags');
}
assert.deepEqual(Array.from(store.tagCatalog('building'), tag => tag.name).filter(name => ['老旧房','危房'].includes(name)), ['老旧房','危房']);
assert.deepEqual(Array.from(store.tagCatalog('person'), tag => tag.name).filter(name => ['孕妇','老人','小孩','独居'].includes(name)), ['独居','孕妇','老人','小孩']);
assert.ok(!render.renderCreateFields('door').includes('collection-tag-group'));
assert.ok(!render.renderCreateFields('room', {buildingId: newBuilding.id}).includes('collection-tag-group'));
store.reset();
assert.ok(store.state.data.buildings[0].tagIds.length > 1 && store.state.data.people[0].tagIds.length > 1, 'preset multiselect examples');
for (const item of store.state.data.buildings.filter(x => x.status === 'verified')) {
  assert.equal(store.pendingPeopleForBuilding(item.id).length, 0, item.id + ' verified sample has no pending people');
}
assert.equal(store.get('building','building-88-1').status,'pending','building with pending person starts pending');
assert.equal(store.pendingPeopleForBuilding('building-88-1').length,1,'second sample demonstrates building blocker');
const verifyBuilding=store.get('building','building-18-3');
const verifyDoor=store.get('door','door-18');
const firstPerson=store.get('person','person-chen');
const initialVerifiedPeople=store.counts().peopleVerified;
for (const [type,id] of [['door',verifyDoor.id],['building',verifyBuilding.id],['person',firstPerson.id]]) {
  render.renderDetail(type,id);
  assert.ok(detailBody.innerHTML.includes('data-verify-open="' + type + ':' + id + '"'), type + ' prominent verification action');
  assert.ok(detailBody.innerHTML.includes('class="detail-hero"') && detailBody.innerHTML.includes('data-detail-tab="info"'), type + ' summary and secondary information tab');
}
render.renderDetail('room','room-302');
assert.ok(!detailBody.innerHTML.includes('data-verify-open='),'room has no verification UI');
const extraPerson=store.addPerson({...personValues,roomId:'room-301',name:'测试第二人'});
assert.equal(store.pendingPeopleForBuilding(verifyBuilding.id).length,2);
render.renderDetail('building',verifyBuilding.id);
assert.ok(detailBody.innerHTML.includes('2 人待核查'),'building summary counts pending people');
assert.ok(detailBody.innerHTML.includes('data-detail-tab="info"') && detailBody.innerHTML.includes('data-detail-tab="relations"'),'building information precedes room tab');
assert.ok(render.pendingPeopleHtml(verifyBuilding.id).includes('待核查人员记录（2 条）'),'building relation view exposes pending people');
assert.ok(render.pendingPeopleHtml(verifyBuilding.id).includes('待核查人员记录（2 条）'),'blocker list counts records');
assert.equal(store.setStatus('building',verifyBuilding.id),null,'building blocked by pending people');
assert.equal(verifyBuilding.status,'pending');
assert.equal(store.setStatus('person',firstPerson.id).status,'verified');
assert.equal(verifyBuilding.status,'pending','person verification does not cascade to building');
assert.equal(store.pendingPeopleForBuilding(verifyBuilding.id).length,1,'partial verification still blocks building');
assert.ok(render.pendingPeopleHtml(verifyBuilding.id).includes('data-verify-person="' + extraPerson.id + '"'),'blocked building offers person detail');
assert.ok(!render.pendingPeopleHtml(verifyBuilding.id).includes('data-verify-person="' + firstPerson.id + '"'),'verified person removed from blocker list');
assert.equal(store.setStatus('building',verifyBuilding.id),null);
assert.equal(store.setStatus('door',verifyDoor.id).status,'verified','door verification independent');
assert.equal(verifyBuilding.status,'pending');
assert.equal(store.counts().verified,3,'door count updates without changing building');
assert.equal(store.counts().peopleVerified,initialVerifiedPeople+1,'person count updates without changing building');
assert.equal(store.setStatus('person',extraPerson.id).status,'verified');
assert.equal(verifyBuilding.status,'pending','all people verified still requires building action');
assert.equal(store.pendingPeopleForBuilding(verifyBuilding.id).length,0);
assert.equal(store.setStatus('building',verifyBuilding.id).status,'verified');
assert.equal(store.counts().verified,4,'building count updates after explicit verification');
render.renderDetail('building',verifyBuilding.id);
assert.ok(!detailBody.innerHTML.includes('data-verify-open='),'verified building action hidden after refresh');
assert.equal(store.setStatus('room','room-301'),null,'room has no independent verification');
assert.ok(render.verifyAction('door',{id:'x',status:'pending'}).includes('data-verify-open="door:x"'));
assert.ok(render.verifyAction('building',{id:verifyBuilding.id,status:'pending'}).includes('data-verify-open="building:'));
assert.ok(render.verifyAction('person',{id:'x',status:'pending'}).includes('data-verify-open="person:x"'));
assert.equal(render.verifyAction('room',{id:'x',status:'pending'}),'');
assert.equal(render.verifyAction('building',verifyBuilding),'','verified building has no button');
assert.ok(render.pendingPeopleHtml('building-18-3')==='','verified people disappear from pending list');
assert.equal(checked, 68);
console.log('PASS: 68 original fields, 12 forms, four create flows, tags and independent verification with building blockers');
