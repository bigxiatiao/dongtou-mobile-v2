const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window: {}, console};
for (const name of ['collection-data.js', 'transfer-data.js', 'grid-shelters.js']) {
  vm.runInNewContext(fs.readFileSync(`${__dirname}/${name}`, 'utf8'), context);
}
const {GridSheltersModel: model, TransferDemoData: data, CollectionStore: collection} = context.window;
assert.equal(model.defaultScope('dp03').id, 'dp');
assert.equal(model.defaultScope('bq01').id, 'bq');
assert.equal(model.defaultScope('dt').id, 'dt');
assert.ok(model.query('dp', '').every(item => item.scopeId === 'dp'));
assert.equal(model.query('dp', '东屏避灾')[0], data.shelters[0], 'query reads shared catalog records');
assert.equal(model.query('dp', '海滨路126')[0], data.shelters[0], 'address is searchable');
assert.equal(model.query('dp', '不存在').length, 0);
assert.ok(model.query('dt', '').length > model.query('dp', '').length, 'district expands query');
assert.ok(model.query('dt', '').some(item => model.isFull(item) && item.status === '开放中'));
assert.ok(model.query('dt', '').some(item => item.status === '未开放'));
assert.equal(model.capacityText({capacity: 50, occupied: 20}), '20/50人');
assert.equal(model.hasLocation({location: {lat: 27.8, lng: 121.1}}), true);
assert.equal(model.hasLocation({location: {lat: 200, lng: 121.1}}), false);
assert.equal(model.hasLocation({}), false);
assert.equal(model.phoneLink({phone: '13800008890'}), 'tel:13800008890');
assert.equal(model.phoneLink({phone: '138****8890'}), '');
const before = JSON.stringify(data.shelters), scope = collection.scope().id;
model.query('dt', ''); model.query('bq', '北岙');
assert.equal(JSON.stringify(data.shelters), before, 'read-only query leaves occupancy and catalog untouched');
assert.equal(collection.scope().id, scope, 'query scope does not change global work scope');
console.log('PASS: shelter shared catalog, scope, search, capacity, contact and location boundaries');
