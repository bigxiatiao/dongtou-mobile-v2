// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderTransferHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderTransferText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 基层转移任务：固定四层树、简化办理和可追加的复核。 */
(() => {
  const store = window.TransferStore, data = window.TransferDemoData, app = document.getElementById('app');
  if (!store || !app) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const types = data.formOptions.placementLabel;
  const resultOptions = data.formOptions.transferResult;

  let picker = null, voiceSession = null, addressSession = null, batchDrafts = new Map(), batchCommon = { transferResult: '', placementType: '', destination: {}, note: '' };
  let current = null, source = 'transfer-list', filter = 'all', batch = false, selected = new Set(), expanded = new Set(), formSnapshot = null, supplementEntry = false;

  const open = id => { app.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id)); window.scrollTo(0, 0); };
  const toast = message => { const box = $('#toast'); renderTransferText(box, message); box.style.display = 'block'; clearTimeout(window.__transferToast); window.__transferToast = setTimeout(() => box.style.display = 'none', 2200); };
  const modal = (title, message) => { renderTransferText($('#mt'), title); renderTransferText($('#mx'), message); $('#modal').classList.add('open'); };
  const result = (out, title) => { if (!out.ok) { showValidation(out, app.querySelector('.view.active')); return false; } render(); modal(title, '已保存到本次办理经历。'); return true; };
  const badge = status => `<span class="tag ${/已复核|已返家/.test(status) ? 'g' : /异常/.test(status) ? 'r' : 'o'}">${esc(status)}</span>`;

  const pickerField = (key, label, items, value = '', required = false) => {
    const normalized = items.map(item => typeof item === 'string' ? { value: item, label: item } : item);
    const found = normalized.find(item => item.value === value);
    return `<label class="transfer-field"><span>${label} ${required ? '<em>必填</em>' : '<small>选填</small>'}</span><input type="hidden" data-form="${key}" value="${esc(value)}"><button type="button" class="transfer-picker-trigger" data-transfer-picker="${key}" data-picker-label="${esc(label)}" data-picker-options="${esc(JSON.stringify(normalized))}" aria-label="选择${label}"><span>${esc(found?.label || value || '请选择')}</span><b><i data-tabler=chevron-down></i></b></button></label>`;
  };
  const select = (key, label, values, value = '', required = false) => pickerField(key, label, values, value, required);
  const input = (key, label, value = '', placeholder = '选填', required = false) => `<label class="transfer-field"><span>${label} ${required ? '<em>必填</em>' : '<small>选填</small>'}</span><input data-form="${key}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${key === 'phone' ? 'inputmode="tel"' : ''} ${required ? 'aria-required="true"' : ''}></label>`;
  const readout = (label, value) => `<div class="transfer-readout"><small>${label}</small><b>${esc(value || '选择安置点后带出')}</b></div>`;
  const mask = v => String(v || '').replace(/(1\d{2})\d{4}(\d{4})/g, '$1****$2');

  function render() {
    const people = store.scoped(), tree = store.hierarchy(filter), counts = store.counts();
    const totalMembers = tree.reduce((n, d) => n + d.memberCount, 0);
    renderTransferText($('#transferListSummary'), `${data.action.name} · ${tree.length}处门址 · ${totalMembers}人`);
    renderTransferText($('#home .metric[data-workbench="transfer-list"] strong'), people.length);
    renderTransferText($('#homeTransferStatus'), `待转移${counts['待转移']} · 待复核${counts['待复核']} · 异常${counts['异常跟进']}`);
    $$('.transfer-tabs button').forEach(button => {
      const status = button.dataset.status;
      renderTransferText(button, `${status === 'all' ? '全部' : status} ${status === 'all' ? people.length : counts[status]}`);
      button.classList.toggle('active', filter === status);
    });
    // No grouping mode switcher — fixed 4-layer tree
    renderTransferHTML($('#transferGrouping'), '');

    renderTransferHTML($('#transferRows'), tree.map(door => renderDoor(door)).join('') || '<div class="transfer-empty">当前筛选暂无人员</div>');
    $('#batchBar').classList.toggle('show', batch);
    $('#transferRows').classList.toggle('is-selecting', batch);
    renderTransferText($('#selectedCount'), selected.size);

    const urgent = $('#home [data-transfer-person]');
    if (urgent) {
      const first = people.find(p => store.eligible(p));
      urgent.hidden = !first;
      if (first) {
        urgent.dataset.transferPerson = first.id;
        renderTransferText($('.avatar', urgent), first.name[0]);
        renderTransferHTML($('.info', urgent), `<b>${esc(first.name)} · 转移办理</b><small>${esc(first.address)}</small>${badge(first.status)}`);
      }
    }
  }

  function checkboxHtml(id, label, memberIds, level) {
    if (!batch) return '';
    const eligibleIds = memberIds.filter(tid => { const p = store.task(tid); return p && store.eligible(p); });
    if (!eligibleIds.length) {
      // N08: disabled placeholder for alignment
      return `<span class="transfer-group-check disabled" aria-disabled="true"><span class="transfer-checkbox"></span></span>`;
    }
    const checked = eligibleIds.length > 0 && eligibleIds.every(id => selected.has(id));
    const partial = !checked && eligibleIds.some(id => selected.has(id));
    return `<button class="transfer-group-check ${checked ? 'checked' : partial ? 'partial' : ''}" data-${level}-select="${esc(id)}" aria-pressed="${!!checked}" aria-label="${checked ? '取消选择' : '选择'}${esc(label)}"><span class="transfer-checkbox">${checked ? '<i data-tabler=check></i>' : partial ? '<i data-tabler=minus></i>' : ''}</span></button>`;
  }

  function groupHeading(level, id, label, count, ids, isExpanded) {

    const selectedCount = ids.filter(id => selected.has(id)).length;
    return `<div class="transfer-group-title">
      ${checkboxHtml(id, label, ids, level)}
      <button class="transfer-group-head" data-group-toggle="${level}:${esc(id)}" aria-expanded="${isExpanded}">
        <span class="transfer-level-icon" aria-hidden="true"><i data-tabler=${{door:'home',building:'building',room:'door'}[level]}></i></span>
        <span class="transfer-group-label">${esc(label)}</span>
        <span class="transfer-group-meta">${batch && selectedCount ? `<small>已选${selectedCount}</small>` : ''}<span class="transfer-group-count">${count}<small>人</small></span></span>
        <span class="transfer-chevron ${isExpanded ? 'expanded' : ''}" aria-hidden="true"><i data-tabler=chevron-right></i></span>
      </button>
    </div>`;
  }

  function renderDoor(door) {
    const allIds = collectAllIds(door, 'door');
    const isExpanded = expanded.has('door:' + door.id);
    return `<section class="transfer-group card">
      ${groupHeading('door', door.id, door.label, door.memberCount, allIds, isExpanded)}
      ${isExpanded ? door.buildings.map(b => renderBuilding(b, door.id)).join('') : ''}
    </section>`;
  }

  function renderBuilding(building, doorId) {
    const allIds = collectAllIds(building, 'building');
    const isExpanded = expanded.has('building:' + building.id);
    return `<div class="transfer-nested-group transfer-building-group">
      ${groupHeading('building', building.id, building.label, building.memberCount, allIds, isExpanded)}
      ${isExpanded ? building.rooms.map(r => renderRoom(r, building.id)).join('') : ''}
    </div>`;
  }

  function renderRoom(room, buildingId) {
    const allIds = room.members.map(p => p.id);
    const isExpanded = expanded.has('room:' + room.id);
    return `<div class="transfer-nested-group transfer-room-group">
      ${groupHeading('room', room.id, room.label, room.memberCount, allIds, isExpanded)}
      ${isExpanded ? `<div class="transfer-room-people">${room.members.map(personRow).join('')}</div>` : ''}
    </div>`;
  }

  function personRow(person) {
    return `<div class="row transfer-member-row" data-person-id="${esc(person.id)}">
      ${batch ? (store.eligible(person) ? `<label class="transfer-check-hit" data-select-person="${person.id}"><input class="selection-box" type="checkbox" aria-label="选择${esc(person.name)}" ${selected.has(person.id) ? 'checked' : ''}><span><i data-tabler=check></i></span></label>` : `<span class="transfer-check-hit disabled" aria-disabled="true"><span></span></span>`) : ''}
      <div class="info"><div class="transfer-member-heading"><b>${esc(person.name)}</b>${badge(person.status)}</div><small>${esc(person.reason)}</small></div>
      <span class="transfer-chevron" aria-hidden="true"><i data-tabler=chevron-right></i></span>
    </div>`;
  }

  function collectAllIds(node, level) {
    return store.collectTaskIds(node, level);
  }

  function identity(person) {
    const planned = person.transfer.plannedDestination, actual = person.transfer.actualDestination;
    const room = window.CollectionStore?.get('room', person.person.roomId);
    return `<div class="card transfer-person-card">
      <div class="transfer-person-heading"><div><h2>${esc(person.name)}</h2><small>${esc(person.address)}</small></div>${badge(person.status)}</div>
      <div class="transfer-key-info">
        <span>${esc(mask(person.phone))}</span>
        <a class="transfer-call" href="tel:${esc(person.phone)}">联系</a>
        <span>${esc(room?.unit || '')} ${esc(room?.name || '')}</span>
        <span>办理人：${esc(person.executor)}</span>
      </div>
      <div class="transfer-reason"><b>转移依据</b><div>${(person.transfer.matchedReasons || [{ label: person.reason, sourceLabel: '指令' }]).map(reason => `<span class="transfer-reason-chip">${esc(reason.label)}<small>${esc(reason.sourceLabel)}</small></span>`).join('')}</div></div>
      <div class="transfer-tags"><small>人员特征</small>${person.person.tags.map(tag => `<span class="tag b">${esc(tag)}</span>`).join('')}</div>
      <div class="transfer-key-info"><span>${esc(data.action.name)}</span><span>${esc(person.instruction.name)}</span><span>截止 ${esc(person.instruction.deadline)}</span></div>
      <div class="transfer-shortcuts">
        <button class="mini-btn" data-transfer-profile="${person.id}">人员与家庭档案</button>
        ${!['已复核','已返家'].includes(person.status) ? '<button class="mini-btn" data-transfer-handover>转交办理</button>' : ''}
      </div>
      ${actual || planned ? `<details class="transfer-placement-summary"><summary>安置信息</summary>
        <p>计划：${esc(planned?.placeName || '未指定')} ${esc(planned?.detail || '')}</p>
        <p>实际：${esc(actual?.placeName || '待填写')} ${esc(actual?.address || actual?.detail || '')}</p>
        ${person.transfer.transferResult ? `<p>办理结果：${esc(person.transfer.transferResult)}</p>` : ''}
      </details>` : ''}
    </div>`;
  }

  function history(person) {
    return `<details class="card transfer-history"><summary>办理经历 · ${person.transfer.events.length}条 <span>展开查看</span></summary>
      <ol>${[...person.transfer.events].reverse().map(event => `<li><time>${esc(event.at)}</time><b>${esc(event.type)} · ${esc(event.actor)}</b><p>${esc(event.detail)}</p></li>`).join('')}</ol>
      ${person.assignment.transferHistory.length ? `<div class="transfer-assignment-history"><b>责任变更</b>${person.assignment.transferHistory.map(change => `<p>${esc(change.at)} · ${esc(change.fromExecutorName)} → ${esc(change.toExecutorName)}${change.reason ? ' · ' + esc(change.reason) : ''}</p>`).join('')}</div>` : ''}
    </details>`;
  }

  // C03: split into common fields (shown directly) and extra fields (collapsible)
  function commonFields(destination = {}) {
    destination ||= {};
    const type = destination.type || '';
    let fields = '';
    if (type === 'center') {
      fields = `${pickerField('placeId', '集中安置点', data.shelters.map(item => ({ value: item.id, label: item.name, detail: item.capacityLabel + ' · ' + item.status })), destination.placeId)}
        <div class="transfer-shelter-info">${readout('地址', destination.address)}${readout('联系人', destination.contact ? `${destination.contact} · ${destination.phone}` : '')}${destination.capacityLabel ? readout('接收情况', destination.capacityLabel) : ''}</div>`;
    } else if (type === 'relative') {
      fields = `${input('contact', '亲友姓名', destination.contact)}
        ${select('relationship', '亲友关系', data.formOptions.relationship, destination.relationship)}
        ${input('phone', '亲友电话', destination.phone, '', false)}
        ${addressField(destination)}`;
    } else if (type === 'hotel') {
      fields = `${input('placeName', '酒店 / 民宿名称', destination.placeName)}
        ${addressField(destination)}
        ${input('contact', '联系人', destination.contact)}
        ${input('phone', '联系电话', destination.phone)}`;
    } else if (type === 'care') {
      fields = `${input('placeName', '机构名称', destination.placeName)}
        ${addressField(destination)}
        ${input('contact', '联系人', destination.contact)}
        ${input('phone', '联系电话', destination.phone)}`;
    } else if (type === 'other') {
      fields = `${input('customType', '安置类型', destination.customType, '如单位安置')}
        ${input('placeName', '地点名称', destination.placeName)}
        ${addressField(destination)}
        ${input('contact', '联系人', destination.contact)}
        ${input('phone', '联系电话', destination.phone)}`;
    } else if (type === 'unknown') {
      fields = `<div class="transfer-required-note">去向未明将进入异常跟进，情况写入办理说明。</div>`;
    }
    return fields;
  }

  function extraFields(destination = {}) {
    destination ||= {};
    const type = destination.type || '';
    let fields = '';
    if (type === 'center') {
      fields = `${input('detail', '区域 / 床位', destination.detail)}
        ${input('careNeed', '特殊照护需求', destination.careNeed)}`;
    } else if (type === 'relative') {
      fields = `${input('careNeed', '特殊照护需求', destination.careNeed)}`;
    } else if (type === 'hotel') {
      fields = `${input('detail', '房间号', destination.detail)}
        ${input('residentCount', '入住人数', destination.residentCount)}
        ${input('careNeed', '特殊照护需求', destination.careNeed)}`;
    } else if (type === 'care') {
      fields = `${select('careLevel', '护理等级', data.formOptions.careLevel, destination.careLevel)}
        ${input('careNeed', '特殊照护需求', destination.careNeed)}`;
    } else if (type === 'other') {
      fields = `${input('transport', '交通方式', destination.transport)}
        ${input('careNeed', '特殊照护需求', destination.careNeed)}`;
    } else if (type === 'unknown') {
      fields = `${input('followupAt', '后续跟进时间', destination.followupAt)}`;
    }
    return fields;
  }

  // C11: address coordinates preserved after rerender
  function addressField(destination = {}) {
    const locationData = destination.location ? ` data-location="${esc(JSON.stringify(destination.location))}"` : '';
    return `<div class="transfer-address-field">
      <label class="transfer-field"><span>详细地址 <small>选填</small></span><input data-form="address" value="${esc(destination.address || '')}" placeholder="输入详细地址或点击地图选址"${locationData}></label>
      <button type="button" class="transfer-location-btn" data-transfer-address><i data-tabler=map-pin></i> 地图选址</button>
    </div>`;
  }

  // C03: common fields shown directly, extra fields in collapsible
  function placementSection(destination = {}, showOptional = true) {
    const type = destination.type || '';
    const typeSelect = pickerField('placementType', '安置方式', Object.entries(types).map(([value, label]) => ({ value, label })), type);
    let body = '';
    if (type) {
      const common = commonFields(destination);
      const extra = extraFields(destination);
      body = common;
      if (extra && showOptional) {
        body += `<details class="transfer-form-extra" id="optionalFields"><summary>展示更多（选填）<i data-tabler=chevron-down></i></summary><div class="form-grid">${extra}</div></details>`;
      } else if (extra) {
        body += `<div class="form-grid">${extra}</div>`;
      }
    }
    return `${typeSelect}<div class="form-grid">${body}</div>`;
  }

  function values(section) {
    const out = {};
    $$('[data-form]', section).forEach(field => out[field.dataset.form] = field.value.trim());
    return out;
  }

  function transferValues(section) {
    const out = values(section);
    const destination = {};
    for (const key of ['type','placeId','placeName','customType','address','contact','phone','detail','note','careNeed','relationship','residentCount','careLevel','medicalNeed','transport','followupAt']) {
      if (out[key] !== undefined) destination[key] = out[key];
    }
    // Map placementType to destination.type
    destination.type = out.placementType || destination.type || '';
    if (destination.type === 'center' && !destination.placeId && destination.placeName) {
      destination.placeId = data.shelters.find(item => item.name === destination.placeName)?.id;
    }
    const address = section.querySelector('[data-form="address"]');
    if (address?.dataset.location) destination.location = JSON.parse(address.dataset.location);
    return {
      transferResult: out.transferResult,
      placementType: out.placementType || destination.type,
      destination: store.normalizeDestination(destination),
      note: out.transferNote || ''
    };
  }

  function evidence(stage, person) {
    const count = (person.transfer.photos || []).filter(p => p.stage === stage).length;
    return `<div class="transfer-evidence"><button class="photo" data-transfer-photo="${stage}">${count ? '<i data-tabler=check></i> 已采集 ' + count + '张 · 继续补拍' : '<i data-tabler=plus></i>现场照片（选填）'}</button><small>现场凭证，供人工对照</small></div>`;
  }

  function renderPerson(view) {
    const person = store.sync(current), section = $('#' + view);
    let form = '';
    if (view === 'transfer') {
      const isSupplementStatus = ['待复核','已复核','待返家','已返家','返家异常'].includes(person.status);
      const useSupplement = supplementEntry && isSupplementStatus;
      // N01: read from actualDestination for supplement, not stale form
      const saved = useSupplement
        ? (formSnapshot || { transferResult: '', placementType: '', destination: person.transfer.actualDestination || {}, note: '' })
        : (formSnapshot || person.transfer.form || { transferResult: '', placementType: '', destination: person.transfer.actualDestination || {} });
      const dest = saved.destination || {};
      const isRefused = saved.transferResult === '拒绝转移';
      const isNotHome = saved.transferResult === '人员不在家';
      const plannedDest = formSnapshot?.destination || person.transfer.form?.destination || person.transfer.plannedDestination || {};

      if (useSupplement) {
        // N01: Supplement mode - reachable from 待复核/已复核/返家 stages
        form = `<div class="card transfer-processing">
          <div class="ph">补充安置信息<small>不改变当前任务状态</small></div>
          <div class="field">
            <div class="form-grid">${placementSection(dest, true)}</div>
            <label>办理说明（选填）<textarea data-form="transferNote" placeholder="补充说明">${esc(saved.note || '')}</textarea></label>
            ${evidence('补充', person)}
          </div>
          <div class="actions transfer-sticky-actions">
            <button class="btn primary" data-transfer-supplement>保存补充信息</button>
          </div>
        </div>`;
      } else if (isRefused) {
        // Business rule: 拒绝转移 - only show 办理说明 and 照片, hide placement
        form = `<div class="card transfer-processing">
          <div class="ph">现场办理<small>拒绝转移 — 仅记录说明和凭证</small></div>
          <div class="field">
            <div class="form-grid">
              ${pickerField('transferResult', '转移办理结果', resultOptions.map(v => ({ value: v, label: v })), saved.transferResult, true)}
            </div>
            <div class="notice">当前结果为拒绝转移，无需填写安置信息</div>
            <label>办理说明<textarea data-form="transferNote" placeholder="记录沟通情况和拒绝原因">${esc(saved.note || '')}</textarea></label>
            ${evidence('转移', person)}
          </div>
          <div class="actions transfer-sticky-actions">
            <button class="btn" data-transfer-save="draft">暂存</button>
            <button class="btn primary" data-transfer-save="submit">提交办理结果</button>
          </div>
        </div>`;
      } else if (isNotHome) {
        // Business rule: 人员不在家 - show planned placement (计划安置)
        form = `<div class="card transfer-processing">
          <div class="ph">现场办理<small>人员不在家 — 记录计划安置信息</small></div>
          <div class="field">
            <div class="form-grid">
              ${pickerField('transferResult', '转移办理结果', resultOptions.map(v => ({ value: v, label: v })), saved.transferResult || '人员不在家', true)}
            </div>
            <button type="button" class="transfer-voice-button" data-transfer-voice><i data-tabler=microphone></i>语音填写</button>
            <div class="ph" style="margin:8px 0 4px">计划安置<small>人员返回后落实</small></div>
            <div class="form-grid" id="placementFields">
              ${placementSection(plannedDest, true)}
            </div>
            <label>办理说明（选填）<textarea data-form="transferNote" placeholder="同行人员、药品、身体状况或异常情况">${esc(saved.note || '')}</textarea></label>
            ${evidence('转移', person)}
          </div>
          <div class="actions transfer-sticky-actions">
            <button class="btn" data-transfer-save="draft">暂存</button>
            <button class="btn primary" data-transfer-save="submit">提交办理结果</button>
          </div>
        </div>`;
      } else {
        form = `<div class="card transfer-processing">
          <div class="ph">现场办理<small>仅"转移办理结果"必填，其余选填可后补</small></div>
          <div class="field">
            <div class="form-grid">
              ${pickerField('transferResult', '转移办理结果', resultOptions.map(v => ({ value: v, label: v })), saved.transferResult || '', true)}
            </div>
            <button type="button" class="transfer-voice-button" data-transfer-voice><i data-tabler=microphone></i>语音填写</button>
            <div class="form-grid" id="placementFields">
              ${placementSection(dest, true)}
            </div>
            <label>办理说明（选填）<textarea data-form="transferNote" placeholder="同行人员、药品、身体状况或异常情况">${esc(saved.note || '')}</textarea></label>
            ${evidence('转移', person)}
          </div>
          <div class="actions transfer-sticky-actions">
            <button class="btn" data-transfer-save="draft">暂存</button>
            <button class="btn primary" data-transfer-save="submit">提交办理结果</button>
          </div>
        </div>`;
      }
    } else if (view === 'review') {
      const draft = person.transfer.reviewDraft || {};
      form = `<div class="card transfer-processing">
        <div class="ph">本次复核<small>${esc(person.reviewer)} · 已记录${person.transfer.reviewRecords.length}次</small></div>
        <div class="field">
          <div class="form-grid">
            ${select('result', '复核结果', ['通过','退回补正','异常确认'], draft.result || '通过', true)}
          </div>
          <details class="transfer-form-extra"><summary>补充说明与联系方式（选填）<i data-tabler=chevron-down></i></summary>
            ${input('contact', '接收人 / 联系方式', draft.contact)}
            <label>复核说明<textarea data-form="note">${esc(draft.note || '')}</textarea></label>
          </details>
          ${evidence('复核', person)}
        </div>
        <div class="actions transfer-sticky-actions">
          <button class="btn" data-transfer-supplement-entry>补充安置信息</button>
          <button class="btn" data-transfer-review="draft">暂存</button>
          <button class="btn primary" data-transfer-review="confirm">确认本次复核</button>
        </div>
      </div>
      <details class="card transfer-history"><summary>历史复核 · ${person.transfer.reviewRecords.length}条</summary>
        <ol>${[...person.transfer.reviewRecords].reverse().map(r => `<li><time>${esc(r.at)}</time><b>${esc(r.reviewerName)} · ${esc(r.result)}</b><p>${esc(r.note || '已确认')}${r.contact ? ' · ' + esc(mask(r.contact)) : ''}${r.photos?.length ? ' · 照片' + r.photos.length + '张' : ''}</p></li>`).join('')}</ol>
      </details>`;
    } else {
      // C13: only confirmation required; house/road/utilities/person all optional
      const saved = person.transfer.restoreDraft || person.transfer.restore || {}, conditions = saved.conditions || {}, done = person.status === '已返家';
      form = `<div class="card transfer-processing">
        <div class="ph">返家确认<small>仅"到家确认"必选，其余条件选填</small></div>
        <div class="field">
          <div class="form-grid">
            ${select('confirmation', '到家确认', ['现场确认','家属视频确认','电话回访'], conditions.confirmation, true)}
          </div>
          <details class="transfer-form-extra"><summary>展示更多（选填）<i data-tabler=chevron-down></i></summary>
            <div class="form-grid">
              ${select('house', '房屋安全', ['安全可入住','需继续观察','不可入住'], conditions.house)}
              ${select('road', '道路通行', ['正常','受限','中断'], conditions.road)}
              ${select('utilities', '水电恢复', ['均已恢复','部分恢复','未恢复'], conditions.utilities)}
              ${select('person', '人员状态', ['身体正常','需医疗关注','不宜返家'], conditions.person)}
              ${select('method', '返家方式', ['网格员陪同','家属接回','集中送返','自行返家'], conditions.method)}
            </div>
          </details>
          <label>执行说明（选填）<textarea data-form="note">${esc(saved.note || '')}</textarea></label>
          ${evidence('返家', person)}
        </div>
        ${done ? '<div class="notice green">已确认返家到位</div>' : '<div class="actions transfer-sticky-actions"><button class="btn" data-transfer-supplement-entry>补充安置信息</button><button class="btn" data-transfer-restore="abnormal">记录返家异常</button><button class="btn primary" data-transfer-restore="finish">确认返家到位</button></div>'}
      </div>`;
    }
    renderTransferHTML(section, `<div class="list-toolbar"><button class="btn back" data-transfer-back><i data-tabler=chevron-left></i></button><h1>${view === 'review' ? '安置复核' : view === 'grid-restore' ? '返家办理' : '逐人转移办理'}</h1></div>${identity(person)}${form}${history(person)}`);
  }

  function showPerson(id, from = 'transfer-list', view) {
    const person = store.task(id);
    if (!person || !store.inScope(person)) { toast('当前范围暂无此任务'); return; }
    current = person; source = from; formSnapshot = null; supplementEntry = false;
    const page = view || (['待复核','已复核'].includes(person.status) ? 'review' : ['待返家','已返家','返家异常'].includes(person.status) ? 'grid-restore' : 'transfer');
    renderPerson(page); open(page);
  }

  function preserve() {
    const view = app.querySelector('.view.active')?.id;
    if (!current) return;
    if (view === 'transfer') formSnapshot = transferValues($('#transfer'));
    if (view === 'review') current.transfer.reviewDraft = values($('#review'));
    if (view === 'grid-restore') {
      const out = values($('#grid-restore'));
      current.transfer.restoreDraft = { note: out.note, conditions: Object.fromEntries(['house','road','utilities','person','method','confirmation'].map(key => [key, out[key]])) };
    }
  }

  // C07: batch common destination fillable with voice support
  function renderBatch() {
    const section = $('#batch');
    const selectedPeople = [...selected].map(id => store.task(id)).filter(store.eligible);
    const commonDest = batchCommon.destination || {};
    renderTransferHTML(section, `<div class="list-toolbar"><button class="btn back" data-workbench="transfer-list"><i data-tabler=chevron-left></i></button><h1>批量转移 · ${selected.size}人</h1></div>
      <details class="card transfer-processing transfer-batch-common" open>
        <summary>统一填写办理结果和安置信息<span>逐人仍可调整</span></summary>
        <div class="field" data-batch-common>
          <div class="form-grid">
            ${pickerField('transferResult', '转移办理结果', resultOptions.map(v => ({ value: v, label: v })), batchCommon.transferResult || '', true)}
          </div>
          <button type="button" class="transfer-voice-button" data-batch-voice><i data-tabler=microphone></i>语音填写</button>
          <div class="form-grid">
            ${placementSection(commonDest, true)}
          </div>
          <label>办理说明（选填）<textarea data-form="transferNote" placeholder="同行人员、药品等情况">${esc(batchCommon.note || '')}</textarea></label>
          <button class="btn primary" data-batch-apply>应用到所选${selected.size}人</button>
        </div>
      </details>
      <div id="batchPeople">${selectedPeople.map(person => {
        const saved = batchDrafts.get(person.id) || person.transfer.form || { transferResult: '', placementType: '', destination: {} };
        return `<details class="card batch-person transfer-processing" data-batch-id="${person.id}">
          <summary><b>${esc(person.name)}</b>${badge(person.status)}<span>${esc(types[saved.placementType || saved.destination?.type] || '待填去向')} · 点击办理</span></summary>
          <div class="field">
            <div class="form-grid">
              ${pickerField('transferResult', '转移办理结果', resultOptions.map(v => ({ value: v, label: v })), saved.transferResult || '', true)}
            </div>
            <button type="button" class="transfer-voice-button" data-transfer-voice="${person.id}"><i data-tabler=microphone></i>语音填写</button>
            <div class="form-grid">
              ${placementSection(saved.destination || {}, true)}
            </div>
            <label>办理说明（选填）<textarea data-form="transferNote">${esc(saved.note || '')}</textarea></label>
          </div>
        </details>`;
      }).join('')}</div>
      <div class="actions transfer-sticky-actions">
        <button class="btn" data-workbench="batch-draft">暂存</button>
        <button class="btn primary" data-workbench="batch-submit">逐人校验并提交</button>
      </div>`);
  }

  // C07: snapshot batch common area including destination fields
  function snapshotBatch() {
    const common = $('#batch [data-batch-common]');
    if (common) {
      const vals = transferValues(common);
      batchCommon = {
        transferResult: vals.transferResult || '',
        placementType: vals.placementType || vals.destination?.type || '',
        destination: vals.destination || {},
        note: vals.note || ''
      };
    }
    $$('#batchPeople [data-batch-id]').forEach(box => batchDrafts.set(box.dataset.batchId, transferValues(box)));
  }

  function toggleMembers(memberIds) {
    const eligibleIds = memberIds.filter(tid => { const p = store.task(tid); return p && store.eligible(p); });
    const remove = eligibleIds.length > 0 && eligibleIds.every(id => selected.has(id));
    eligibleIds.forEach(id => remove ? selected.delete(id) : selected.add(id));
    render();
  }

  function handoverSheet() {
    let sheet = $('#transferHandover');
    if (!sheet) { sheet = document.createElement('div'); sheet.id = 'transferHandover'; sheet.className = 'collection-sheet'; app.append(sheet); }
    renderTransferHTML(sheet, `<div class="collection-sheet-backdrop" data-transfer-close></div>
      <div class="collection-sheet-panel">
        <div class="sheet-head"><b>转交办理</b><button class="close" data-transfer-close><i data-tabler=x></i></button></div>
        ${pickerField('executorId', '接替办理人', Object.values(data.executors).filter(e => e.id !== current.assignment.currentExecutor.id).map(e => ({ value: e.id, label: e.name })), '', true)}
        <label>原因（选填）<input id="handoverReason" placeholder="如临时请假"></label>
        <div class="actions"><button class="btn" data-transfer-close>取消</button><button class="btn primary" data-transfer-confirm-handover>确认转交</button></div>
      </div>`);
    sheet.classList.remove('hidden');
  }

  function showValidation(out, section) {
    toast(out.error);
    if (!section) return;
    $$('.transfer-field.invalid', section).forEach(field => field.classList.remove('invalid'));
    const first = out.missing?.[0];
    (out.missing || []).forEach(field => section.querySelector(`[data-form="${field.key}"]`)?.closest('label')?.classList.add('invalid'));
    if (first) {
      const field = section.querySelector(`[data-form="${first.key}"]`);
      field?.closest('details')?.setAttribute('open', '');
      field?.closest('label')?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }
  }

  function sheet(id, title, body) {
    let root = $('#' + id);
    if (!root) { root = document.createElement('div'); root.id = id; root.className = 'transfer-sheet'; app.append(root); }
    renderTransferHTML(root, `<div class="transfer-sheet-backdrop" data-transfer-sheet-close="${id}"></div>
      <div class="transfer-sheet-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="transfer-sheet-head"><h2>${esc(title)}</h2><button type="button" data-transfer-sheet-close="${id}" aria-label="关闭${esc(title)}"><i data-tabler=x></i></button></div>
        ${body}
      </div>`);
    root.classList.remove('hidden');
    document.body.classList?.add('transfer-sheet-open');
    return root;
  }

  function closeSheet(id) {
    $('#' + id)?.classList.add('hidden');
    if (id === 'transferVoiceSheet' && voiceSession?.recognition) voiceSession.recognition.stop();
    if (!$$('.transfer-sheet:not(.hidden)').length) document.body.classList?.remove('transfer-sheet-open');
  }

  const contextFor = button => button.closest('[data-batch-common]') || button.closest('[data-batch-id]') || button.closest('.view');

  function openPicker(button) {
    const root = button.closest('#transferHandover') || contextFor(button), key = button.dataset.transferPicker;
    picker = { button, root, key, options: JSON.parse(button.dataset.pickerOptions) };
    const value = root.querySelector(`[data-form="${key}"]`)?.value;
    sheet('transferOptionSheet', button.dataset.pickerLabel, `<div class="transfer-sheet-options">${picker.options.map((item, index) => `<button type="button" data-transfer-option="${index}" class="${value === item.value ? 'selected' : ''}"><span><b>${esc(item.label)}</b>${item.detail ? `<small>${esc(item.detail)}</small>` : ''}</span><i>${value === item.value ? '<i data-tabler=check></i>' : '<i data-tabler=circle></i>'}</i></button>`).join('')}</div>`);
  }

  function setFormValue(root, key, value) {
    const field = root.querySelector(`[data-form="${key}"]`);
    if (field) {
      field.value = value;
      const trigger = field.parentElement?.querySelector('.transfer-picker-trigger');
      if (trigger) {
        const choices = JSON.parse(trigger.dataset.pickerOptions);
        renderTransferText(trigger.querySelector('span'), choices.find(item => item.value === value)?.label || value || '请选择');
      }
      field.closest('label')?.classList.remove('invalid');
    }
  }

  // C06: switching placement type clears old type-specific data
  function clearTypeSpecificFields(destination, oldType, newType) {
    if (oldType === newType || !oldType) return destination;
    const cleared = { ...destination, type: newType };
    // Clear fields that are specific to the old type
    const typeSpecificFields = {
      center: ['placeId', 'placeName', 'detail', 'careNeed'],
      relative: ['contact', 'relationship', 'phone', 'address', 'careNeed'],
      hotel: ['placeName', 'address', 'contact', 'phone', 'detail', 'residentCount', 'careNeed'],
      care: ['placeName', 'address', 'contact', 'phone', 'careLevel', 'careNeed'],
      other: ['customType', 'placeName', 'address', 'contact', 'phone', 'transport', 'careNeed'],
      unknown: ['followupAt']
    };
    // Clear old type fields
    if (typeSpecificFields[oldType]) {
      typeSpecificFields[oldType].forEach(field => {
        if (cleared[field]) delete cleared[field];
      });
    }
    // Clear location if address was cleared
    if (oldType !== newType && typeSpecificFields[oldType]?.includes('address')) {
      delete cleared.location;
    }
    return cleared;
  }

  function chooseOption(index) {
    const selection = picker, choice = selection.options[index];
    if (!choice) return;

    const oldType = selection.root.querySelector('[data-form="placementType"]')?.value || '';
    setFormValue(selection.root, selection.key, choice.value);
    closeSheet('transferOptionSheet');
    // Capture current inputs on every selection before clearing old type fields.
    // This also initializes drafts when a picker is the first action on a page.
    const updateSelection = draft => {
      if (selection.key === 'placementType') {
        draft.placementType = choice.value;
        draft.destination = clearTypeSpecificFields(draft.destination || {}, oldType, choice.value);
        draft.destination.type = choice.value;
      }
      if (selection.key === 'placeId') {
        draft.destination = store.normalizeDestination({ ...draft.destination, placeId: choice.value });
      }
    };
    if (selection.root.hasAttribute('data-batch-common')) {
      snapshotBatch();
      updateSelection(batchCommon);
      renderBatch();
      $('#batch .transfer-batch-common').open = true;
      return;
    }
    if (selection.key === 'placementType' || selection.key === 'placeId' || selection.key === 'transferResult') {
      if (selection.root.dataset.batchId) {
        snapshotBatch();
        const id = selection.root.dataset.batchId, vals = batchDrafts.get(id);
        updateSelection(vals);
        renderBatch();
        const box = $$('#batchPeople [data-batch-id]').find(box => box.dataset.batchId === id);
        if (box) box.open = true;
      } else {
        preserve();
        updateSelection(formSnapshot);
        renderPerson('transfer');
      }
    }
  }

  function openVoice(button) {
    voiceSession = { root: contextFor(button), parsed: {}, recognition: null };
    sheet('transferVoiceSheet', '语音填写', `<div class="transfer-voice-content">
      <p>说出安置方式、姓名、关系、电话、地址等；未匹配的文字会追加到办理说明，确认后填入。</p>
      <div class="transfer-voice-samples">${data.voiceExamples.map((sample, index) => `<button type="button" data-voice-sample="${index}">${esc(sample.label)}示例</button>`).join('')}</div>
      <button class="btn transfer-record" data-voice-record><i data-tabler=microphone></i> 开始语音转文字</button>
      <small id="transferVoiceStatus">可点击示例体验，或直接输入一段文字。</small>
      <textarea id="transferVoiceText" placeholder="例如：投亲靠友，亲友姓名王晓梅，关系子女，电话13700008890，地址北岙街道海滨路88号。"></textarea>
      <button class="btn" data-voice-parse>识别字段</button>
      <div id="transferVoicePreview"></div>
      <div class="actions"><button class="btn" data-transfer-sheet-close="transferVoiceSheet">取消</button><button class="btn primary" data-voice-apply disabled>确认填入</button></div>
    </div>`);
  }

  function parseVoice() {
    const parsed = store.parseVoice($('#transferVoiceText').value);
    voiceSession.parsed = parsed;
    const names = {
      type: '安置方式', placeId: '安置点', placeName: '地点', contact: '亲友 / 联系人',
      relationship: '关系', phone: '电话', address: '地址', detail: '房间 / 床位',
      careNeed: '特殊照护需求', customType: '安置类型', transport: '交通方式',
      followupAt: '跟进时间', note: '办理说明', residentCount: '入住人数',
      careLevel: '护理等级', medicalNeed: '医疗需求'
    };
    // N07: get current values for overwrite preview
    const root = voiceSession.root;
    let currentNote = '', currentDest = {}, currentType = '';
    if (root.hasAttribute('data-batch-common')) {
      // Shared and individual forms use the same visible input values.
    }
    const currentValues = transferValues(root);
    currentNote = currentValues.note || '';
    currentDest = currentValues.destination || {};
    currentType = currentValues.placementType || currentDest.type || '';
    const currentForVoice = { note: currentNote, ...currentDest };
    if (currentType) currentForVoice.type = currentType;

    renderTransferHTML($('#transferVoicePreview'), Object.keys(parsed).length
      ? `<div class="transfer-voice-preview">${Object.entries(parsed).filter(([key]) => key !== 'placeId').map(([key, value]) => {
        const currentVal = currentForVoice[key];
        const showCurrent = currentVal && String(currentVal) !== String(value);
        return `<div><small>${names[key] || key}${key === 'note' ? ' · 追加内容' : ''}</small><b${showCurrent ? ' style="color:var(--blue-11)"' : ''}>${esc(key === 'type' ? (types[value] || value) : value)}</b>${showCurrent ? (key === 'note' ? `<small>保留原说明：${esc(currentVal)}</small>` : `<small style="text-decoration:line-through;opacity:0.6">${esc(key === 'type' ? (types[currentVal] || currentVal) : currentVal)}</small>`) : ''}</div>`;
      }).join('')}<p>确认后填入匹配字段，办理说明追加并保留原文；提交前可继续修改。</p></div>`
      : '<p>暂未识别到字段，请补充关键词。</p>');
    $('[data-voice-apply]').disabled = !Object.keys(parsed).length;
  }

  function applyVoice() {
    const root = voiceSession.root, parsed = voiceSession.parsed;
    const placementType = parsed.type || '';
    const destFields = {};
    for (const key of ['placeId','placeName','customType','address','contact','phone','detail','careNeed','relationship','residentCount','careLevel','medicalNeed','transport','followupAt']) {
      if (parsed[key]) destFields[key] = parsed[key];
    }
    const note = parsed.note || '';

    if (root.hasAttribute('data-batch-common')) {
      snapshotBatch();
      if (placementType) batchCommon.placementType = placementType;
      if (note) batchCommon.note = (batchCommon.note ? batchCommon.note + '；' : '') + note;
      batchCommon.destination = store.normalizeDestination({ ...batchCommon.destination, ...destFields, type: placementType || batchCommon.destination?.type });
      renderBatch();
      $('#batch .transfer-batch-common').open = true;
    } else if (root.dataset.batchId) {
      snapshotBatch();
      const id = root.dataset.batchId, vals = batchDrafts.get(id);
      if (placementType) vals.placementType = placementType;
      vals.destination = store.normalizeDestination({ ...vals.destination, ...destFields, type: placementType || vals.destination?.type });
      if (note) vals.note = (vals.note ? vals.note + '；' : '') + note;
      renderBatch();
      const box = $$('#batchPeople [data-batch-id]').find(box => box.dataset.batchId === id);
      if (box) box.open = true;
    } else {
      preserve();
      if (placementType) formSnapshot.placementType = placementType;
      formSnapshot.destination = store.normalizeDestination({ ...formSnapshot.destination, ...destFields, type: placementType || formSnapshot.destination?.type });
      if (note) formSnapshot.note = (formSnapshot.note ? formSnapshot.note + '；' : '') + note;
      renderPerson('transfer');
    }
    // Auto-expand optional fields if filled
    const updatedRoot = root.hasAttribute('data-batch-common') ? $('#batch [data-batch-common]')
      : root.dataset.batchId ? $$('#batchPeople [data-batch-id]').find(box => box.dataset.batchId === root.dataset.batchId)
      : $('#transfer');
    const optionalDetails = updatedRoot?.querySelector('#optionalFields');
    if (optionalDetails) optionalDetails.setAttribute('open', '');
    closeSheet('transferVoiceSheet');
    toast('已填入识别字段，请核对');
  }

  function openAddress(button) {
    addressSession = { root: contextFor(button), choice: null };
    sheet('transferAddressSheet', '地图选址', `<div class="transfer-address-content">
      <input id="transferAddressSearch" placeholder="搜索地点或地址">
      <div class="transfer-demo-map"><span>示例地图</span>${data.addressExamples.map((place, index) => `<button type="button" style="left:${22 + index * 27}%;top:${35 + (index % 2) * 22}%" data-address-choice="${index}"><i data-tabler=map-pin></i> ${esc(place.name)}</button>`).join('')}</div>
      <div id="transferAddressResults">${data.addressExamples.map((place, index) => `<button type="button" class="transfer-address-option" data-address-choice="${index}"><b>${esc(place.name)}</b><small>${esc(place.address)}</small></button>`).join('')}</div>
      <label class="transfer-field"><span>详细地址</span><input id="transferAddressText" value="${esc(addressSession.root.querySelector('[data-form="address"]')?.value || '')}" placeholder="也可手动输入地址"></label>
      <small id="transferAddressCoordinates">选择示例点可带入坐标，手输地址不生成坐标。</small>
      <div class="actions"><button class="btn" data-transfer-sheet-close="transferAddressSheet">取消</button><button class="btn primary" data-address-apply>使用此地址</button></div>
    </div>`);
  }

  function componentClick(event) {
    const find = selector => event.target.closest(selector);
    let button;
    if (button = find('[data-transfer-sheet-close]')) { closeSheet(button.dataset.transferSheetClose); return true; }
    if (button = find('[data-transfer-picker]')) { openPicker(button); return true; }
    if (button = find('[data-transfer-option]')) { chooseOption(Number(button.dataset.transferOption)); return true; }
    if (button = find('[data-batch-voice]')) { openVoice(button); return true; }
    if (button = find('[data-transfer-voice]')) { openVoice(button); return true; }
    if (button = find('[data-voice-sample]')) { $('#transferVoiceText').value = data.voiceExamples[Number(button.dataset.voiceSample)].text; parseVoice(); return true; }
    if (find('[data-voice-parse]')) { parseVoice(); return true; }
    if (find('[data-voice-apply]')) { applyVoice(); return true; }
    if (find('[data-voice-record]')) {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) { renderTransferText($('#transferVoiceStatus'), '当前浏览器不支持语音识别，可用示例或输入文字体验字段解析。'); return true; }
      if (voiceSession.recognition) { voiceSession.recognition.stop(); voiceSession.recognition = null; return true; }
      const recognition = new Recognition();
      recognition.lang = 'zh-CN'; recognition.interimResults = false;
      voiceSession.recognition = recognition;
      const session = voiceSession;
      recognition.onresult = event => {
        if (voiceSession !== session || $('#transferVoiceSheet').classList.contains('hidden')) return;
        $('#transferVoiceText').value = event.results[0][0].transcript; parseVoice();
      };
      recognition.onerror = () => { renderTransferText($('#transferVoiceStatus'), '未能识别，可重试或使用示例文字。'); };
      recognition.onend = () => { if (voiceSession !== session) return; voiceSession.recognition = null; renderTransferHTML($('[data-voice-record]'), '<i data-tabler=microphone></i> 重新语音填写'); };
      try {
        recognition.start();
        button = find('[data-voice-record]');
        renderTransferHTML(button, '<i data-tabler=player-stop></i> 结束录音');
        renderTransferText($('#transferVoiceStatus'), '正在听，请说出安置信息…');
      } catch (error) { renderTransferText($('#transferVoiceStatus'), '语音未启动，请使用示例或输入文字。'); }
      return true;
    }
    if (button = find('[data-transfer-address]')) { openAddress(button); return true; }
    if (button = find('[data-address-choice]')) {
      const place = data.addressExamples[Number(button.dataset.addressChoice)];
      addressSession.choice = place;
      $('#transferAddressText').value = place.address;
      renderTransferText($('#transferAddressCoordinates'), `坐标 ${place.lng}, ${place.lat}`);
      $$('[data-address-choice]').forEach(item => item.classList.toggle('selected', item.dataset.addressChoice === button.dataset.addressChoice));
      return true;
    }
    if (find('[data-address-apply]')) {
      const value = $('#transferAddressText').value.trim();
      if (!value) { toast('请填写或选择地址'); return true; }
      const field = addressSession.root.querySelector('[data-form="address"]');
      setFormValue(addressSession.root, 'address', value);
      const point = addressSession.choice;
      if (point && value === point.address) field.dataset.location = JSON.stringify({ lng: point.lng, lat: point.lat });
      else delete field.dataset.location;
      closeSheet('transferAddressSheet');
      toast('已填入地址');
      return true;
    }
    return false;
  }

  function handleClick(event) {
    if (componentClick(event)) return true;
    const target = event.target, find = selector => target.closest(selector);
    let button;

    if (button = find('[data-transfer-close]')) { $('#transferHandover').classList.add('hidden'); return true; }
    if (button = find('[data-transfer-confirm-handover]')) {
      if (result(store.handover(current.id, $('#transferHandover [data-form="executorId"]').value, $('#handoverReason').value.trim()), '已转交办理')) {
        $('#transferHandover').classList.add('hidden');
        renderPerson(app.querySelector('.view.active').id);
      }
      return true;
    }
    if (find('[data-transfer-handover]')) { preserve(); handoverSheet(); return true; }
    if (find('[data-transfer-supplement-entry]')) {
      preserve();
      supplementEntry = true;
      formSnapshot = null;
      renderPerson('transfer');
      open('transfer');
      return true;
    }

    if (button = find('[data-group-toggle]')) {
      const key = button.dataset.groupToggle;
      expanded.has(key) ? expanded.delete(key) : expanded.add(key);
      render(); return true;
    }
    if (button = find('[data-door-select]')) {
      const tree = store.hierarchy(filter);
      const door = tree.find(d => d.id === button.dataset.doorSelect);
      if (door) toggleMembers(collectAllIds(door, 'door'));
      return true;
    }
    if (button = find('[data-building-select]')) {
      const tree = store.hierarchy(filter);
      for (const door of tree) {
        const building = door.buildings.find(b => b.id === button.dataset.buildingSelect);
        if (building) { toggleMembers(collectAllIds(building, 'building')); return true; }
      }
      return true;
    }
    if (button = find('[data-room-select]')) {
      const tree = store.hierarchy(filter);
      for (const door of tree) {
        for (const building of door.buildings) {
          const room = building.rooms.find(r => r.id === button.dataset.roomSelect);
          if (room) { toggleMembers(room.members.map(p => p.id)); return true; }
        }
      }
      return true;
    }
    if (button = find('[data-select-person]')) {
      event.preventDefault?.();
      const id = button.dataset.selectPerson;
      selected.has(id) ? selected.delete(id) : selected.add(id);
      render(); return true;
    }
    if (button = find('#transferRows [data-person-id]')) { showPerson(button.dataset.personId); return true; }
    if (button = find('#home [data-transfer-person]')) { showPerson(button.dataset.transferPerson, 'home'); return true; }
    if (button = find('#transfer-list .transfer-tabs [data-status]')) { filter = button.dataset.status; selected.clear(); render(); return true; }
    if (button = find('[data-transfer-profile],[data-transfer-room]')) {
      preserve();
      const person = store.task(button.dataset.transferProfile || button.dataset.transferRoom);
      const ok = button.hasAttribute('data-transfer-profile') ? window.CollectionDemo.openPerson(person.person.collectionPersonId) : window.CollectionDemo.openObject('room', person.person.roomId);
      if (!ok) toast('关联档案暂不可用');
      return true;
    }
    if (find('[data-transfer-back]')) { open(source); render(); return true; }

    if (button = find('[data-transfer-photo]')) {
      preserve();
      const stage = button.dataset.transferPhoto;
      const photo = store.photo(current.id, stage);
      if (stage === '复核') { current.pendingReviewPhotos ||= []; current.pendingReviewPhotos.push(photo); }
      renderPerson(app.querySelector('.view.active').id);
      toast('已记录现场凭证');
      return true;
    }
    if (button = find('[data-transfer-save]')) {
      const draft = button.dataset.transferSave === 'draft';
      const vals = transferValues($('#transfer'));
      // Map placementType to destination.type for store
      if (vals.placementType && vals.destination) vals.destination.type = vals.placementType;
      const out = store.save(current.id, vals, draft);
      if (result(out, draft ? '草稿已保存' : '办理结果已提交')) {
        formSnapshot = null;
        renderPerson(draft ? 'transfer' : current.status === '待复核' ? 'review' : 'transfer');
        if (!draft && current.status === '待复核') open('review');
      }
      return true;
    }
    if (button = find('[data-transfer-supplement]')) {
      const vals = transferValues($('#transfer'));
      if (vals.placementType && vals.destination) vals.destination.type = vals.placementType;
      const out = store.supplementPlacement(current.id, vals);
      if (out.ok) {
        toast('补充信息已保存');
        if (supplementEntry) {
          // N01: return to the original view (review or grid-restore)
          supplementEntry = false;
          formSnapshot = null;
          const page = ['待复核','已复核'].includes(current.status) ? 'review' : ['待返家','已返家','返家异常'].includes(current.status) ? 'grid-restore' : 'transfer';
          renderPerson(page);
          open(page);
        } else {
          renderPerson('transfer');
        }
        render();
      }
      else showValidation(out, $('#transfer'));
      return true;
    }
    if (button = find('[data-transfer-review]')) {
      const out = values($('#review'));
      if (button.dataset.transferReview === 'draft') {
        current.transfer.reviewDraft = out;
        toast('复核草稿已保存');
      } else {
        out.photos = current.pendingReviewPhotos || [];
        if (result(store.review(current.id, out), '复核已记录')) {
          current.pendingReviewPhotos = [];
          const page = current.status === '异常跟进' ? 'transfer' : 'review';
          formSnapshot = null;
          renderPerson(page); open(page);
        }
      }
      return true;
    }
    if (button = find('[data-transfer-restore]')) {
      const out = values($('#grid-restore'));
      if (result(store.restore(current.id, {
        abnormal: button.dataset.transferRestore === 'abnormal',
        note: out.note,
        conditions: Object.fromEntries(['house','road','utilities','person','method','confirmation'].map(key => [key, out[key]]))
      }), '返家结果已保存')) {
        current.transfer.restoreDraft = null;
        renderPerson('grid-restore');
      }
      return true;
    }

    if (find('[data-batch-apply]')) {
      snapshotBatch();
      const missing = store.missingFields({ transferResult: batchCommon.transferResult, placementType: batchCommon.placementType });
      if (missing.length) {
        showValidation({ error: '请填写' + missing.map(f => f.label).join('、'), missing }, $('#batch [data-batch-common]'));
        return true;
      }
      // C07: apply common destination fields to all selected people
      for (const id of selected) {
        const draft = batchDrafts.get(id) || { transferResult: '', placementType: '', destination: {}, note: '' };
        if (batchCommon.transferResult) draft.transferResult = batchCommon.transferResult;
        if (batchCommon.placementType) {
          draft.placementType = batchCommon.placementType;
          if (!draft.destination) draft.destination = {};
          draft.destination.type = batchCommon.placementType;
        }
        // Apply common destination fields if they have values
        if (batchCommon.destination) {
          if (!draft.destination) draft.destination = {};
          const commonDest = batchCommon.destination;
          // Copy non-empty fields from common destination
          ['placeId','placeName','customType','address','contact','phone','detail','careNeed','relationship','residentCount','careLevel','medicalNeed','transport','followupAt'].forEach(key => {
            if (commonDest[key]) draft.destination[key] = commonDest[key];
          });
          if (commonDest.location) draft.destination.location = commonDest.location;
        }
        if (batchCommon.note) draft.note = batchCommon.note;
        batchDrafts.set(id, draft);
      }
      renderBatch();
      toast('已填写共同结果，可展开人员分别调整');
      return true;
    }

    if (button = find('[data-workbench]')) {
      const action = button.dataset.workbench;
      if (action === 'transfer-list') { open('transfer-list'); render(); return true; }
      if (action === 'batch-start') {
        batch = true;
        const tree = store.hierarchy(filter);
        tree.forEach(door => {
          expanded.add('door:' + door.id);
          door.buildings.forEach(b => expanded.add('building:' + b.id));
        });
        render(); return true;
      }
      if (action === 'batch-cancel') { batch = false; selected.clear(); render(); return true; }
      if (action === 'batch-detail') {
        if (!selected.size) { toast('请先选择人员'); return true; }
        renderBatch(); open('batch'); return true;
      }
      if (action === 'batch-submit' || action === 'batch-draft') {
        const rows = $$('#batchPeople .batch-person').map(box => {
          const vals = transferValues(box);
          if (vals.placementType && vals.destination) vals.destination.type = vals.placementType;
          return { id: box.dataset.batchId, values: vals };
        });
        const results = store.batch(rows, action === 'batch-draft');
        const success = results.filter(r => r.ok).length;
        if (!success) {
          const box = $$('#batchPeople [data-batch-id]').find(box => box.dataset.batchId === results[0]?.id);
          if (box) { box.open = true; showValidation(results[0], box); }
          else toast('请补充资料');
          return true;
        }
        render();
        modal(action === 'batch-draft' ? '批量草稿已保存' : '批量办理结果', `${success}人已保存${results.length > success ? '；' + (results.length - success) + '人资料不齐，保持原状态' : ''}`);
        if (action === 'batch-submit') {
          results.filter(r => r.ok).forEach(r => selected.delete(r.id));
          batch = selected.size > 0;
          if (batch) { snapshotBatch(); renderBatch(); const failed = $('#batchPeople [data-batch-id]'); if (failed) failed.open = true; }
          else open('transfer-list');
          render();
        }
        return true;
      }
    }
    return false;
  }

  app.addEventListener('click', event => { if (document.body.dataset.role === 'grid' && handleClick(event)) event.stopImmediatePropagation(); }, true);
  app.addEventListener('input', event => {
    if (event.target.id === 'transferAddressSearch') {
      const query = event.target.value.trim();
      $$('#transferAddressResults [data-address-choice]').forEach(button => button.hidden = !button.textContent.includes(query));
    }
    if (event.target.matches?.('[data-form="address"]')) delete event.target.dataset.location;
    if (event.target.id === 'transferVoiceText') { $('[data-voice-apply]').disabled = true; renderTransferHTML($('#transferVoicePreview'), ''); }
  });

  window.TransferDemo = {
    handleClick, people: data.people, showPerson, counts: store.counts, render,
    resume(view) { if (current) { store.sync(current); renderPerson(view); } },
    scopeChanged() {
      ['transferVoiceSheet','transferAddressSheet','transferOptionSheet'].forEach(closeSheet);
      $('#transferHandover')?.classList.add('hidden');
      batchDrafts.clear(); batchCommon = { transferResult: '', placementType: '', destination: {}, note: '' };
      selected.clear(); expanded.clear(); filter = 'all'; batch = false; supplementEntry = false;
      const view = app.querySelector('.view.active')?.id;
      if (view === 'batch' || current && !store.inScope(current) && ['transfer','review','grid-restore','collection-detail'].includes(view)) {
        current = null; formSnapshot = null; open('transfer-list');
      }
      render();
    }
  };
  render();
})();
