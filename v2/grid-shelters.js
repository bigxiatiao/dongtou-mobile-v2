// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderGridSheltersHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderGridSheltersText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 基层安置点查询：共享转移安置目录，查询范围独立于全局辖区。 */
(() => {
  const data = window.TransferDemoData, collection = window.CollectionStore;
  if (!data || !collection) return;
  const scopes = () => collection.scopes();
  const byScope = id => scopes().find(item => item.id === id);
  const model = {
    defaultScope(id) {
      let item = byScope(id) || byScope('dt');
      while (item?.type === 'grid') item = byScope(item.parentId);
      return item || byScope('dt');
    },
    scopeContains(parentId, id) {
      let item = byScope(id);
      while (item) { if (item.id === parentId) return true; item = byScope(item.parentId); }
      return false;
    },
    query(scopeId, keyword = '') {
      const q = keyword.trim().toLowerCase();
      return data.shelters.filter(item => model.scopeContains(scopeId, item.scopeId) && (!q || [item.name, item.address].some(text => String(text || '').toLowerCase().includes(q))));
    },
    isFull: item => Number.isFinite(item.capacity) && item.capacity > 0 && item.occupied >= item.capacity,
    capacityText: item => `${Number(item.occupied) || 0}/${Number(item.capacity) || 0}人`,
    hasLocation: item => item.location && Number.isFinite(item.location.lat) && Number.isFinite(item.location.lng) && Math.abs(item.location.lat) <= 90 && Math.abs(item.location.lng) <= 180 ? true : false,
    phoneLink: item => /^\+?[\d -]{7,20}$/.test(item.phone || '') ? 'tel:' + item.phone.replace(/[ -]/g, '') : ''
  };
  window.GridSheltersModel = model;
  if (typeof document === 'undefined') return;
  const app = document.getElementById('app');
  if (!app) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => '<i data-tabler=' + ({home:'home-shield',pin:'map-pin',phone:'phone',search:'search'}[name]) + '></i>';
  const list = document.createElement('section');
  list.className = 'view gs-view'; list.id = 'grid-shelter-query';
  renderGridSheltersHTML(list, `<div class="gs-title"><button class="gs-back" data-grid-shelter="home" aria-label="返回首页"><i data-tabler=chevron-left></i></button><h1>安置点查询</h1><button class="gs-scope" data-grid-shelter="scope"><span id="gsScopeName"></span><b><i data-tabler=chevron-down></i></b></button></div><div class="gs-search">${icon('search')}<input id="gsSearch" type="search" placeholder="搜索安置点名称、地址" aria-label="搜索安置点名称或地址"><button data-grid-shelter="clear" aria-label="清空搜索" hidden><i data-tabler=x></i></button></div><div class="gs-result-count" id="gsResultCount"></div><div id="gsRows"></div>`);
  app.appendChild(list);
  const detail = document.createElement('section'); detail.className = 'view gs-view'; detail.id = 'grid-shelter-detail'; app.appendChild(detail);
  const overlay = document.createElement('div'); overlay.className = 'gs-overlay'; overlay.hidden = true; overlay.id = 'gsOverlay'; app.appendChild(overlay);
  let state = {scopeId: 'dp', keyword: '', listScroll: 0, current: null};
  const show = id => { app.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); window.scrollTo(0, 0); };
  const closeLayer = () => { overlay.hidden = true; renderGridSheltersHTML(overlay, ''); };
  const badges = item => `<span class="gs-status ${item.status === '开放中' ? 'open' : 'closed'}">${esc(item.status || '未配置')}</span>${model.isFull(item) ? '<span class="gs-status full">已满员</span>' : ''}`;
  function renderRows() {
    const rows = model.query(state.scopeId, state.keyword), hasSearch = !!state.keyword.trim();
    renderGridSheltersText(document.getElementById('gsScopeName'), byScope(state.scopeId)?.name || '洞头区');
    renderGridSheltersText(document.getElementById('gsResultCount'), `找到 ${rows.length} 处安置点`);
    list.querySelector('[data-grid-shelter="clear"]').hidden = !state.keyword;
    renderGridSheltersHTML(document.getElementById('gsRows'), rows.map(item => `<button class="gs-card" data-grid-shelter-id="${esc(item.id)}"><div class="gs-card-heading"><span class="gs-building">${icon('home')}</span><div><h2>${esc(item.name)}</h2><div class="gs-badges">${badges(item)}</div></div><span class="gs-chevron"><i data-tabler=chevron-right></i></span></div><div class="gs-address">${icon('pin')}<span>${esc(item.address || '地址未配置')}</span></div><div class="gs-capacity"><span>已住 / 容量</span><b>${esc(model.capacityText(item))}</b></div></button>`).join('') || `<div class="gs-empty">${icon('search')}<b>${hasSearch ? '未找到匹配安置点' : '当前范围暂无安置点'}</b><p>${hasSearch ? '试试其他名称或地址，也可以扩大查询范围' : '可以扩大查询范围查看其他安置点'}</p><div>${hasSearch ? '<button class="gs-soft-button" data-grid-shelter="clear">清空搜索</button>' : ''}<button class="gs-soft-button" data-grid-shelter="scope">扩大范围</button></div></div>`);
  }
  let returnHome='home';
  function open(context = {}) {
    closeLayer(); returnHome=context.home||'home'; state = {scopeId: context.scopeId || model.defaultScope(collection.scope().id).id, keyword: '', listScroll: 0, current: null};
    document.getElementById('gsSearch').value = ''; renderRows(); show(list.id);
  }
  function openDetail(id) {
    const item = data.shelters.find(shelter => shelter.id === id); if (!item) return;
    state.listScroll = window.scrollY || 0; state.current = id;
    const phone = model.phoneLink(item);
    renderGridSheltersHTML(detail, `<div class="gs-title"><button class="gs-back" data-grid-shelter="list" aria-label="返回查询列表"><i data-tabler=chevron-left></i></button><h1>安置点详情</h1></div><div class="gs-detail-hero"><span class="gs-building">${icon('home')}</span><h2>${esc(item.name)}</h2><div class="gs-badges">${badges(item)}</div><div class="gs-detail-capacity"><b>${esc(model.capacityText(item))}</b><span>已住 / 容量</span></div></div><div class="gs-detail-info"><div><span>详细地址</span><b>${esc(item.address || '未配置')}</b></div><div><span>联系人</span><b>${esc(item.contact || '未配置')}</b></div><div><span>联系电话</span><b>${esc(item.phone || '未配置')}</b></div></div><div class="gs-detail-actions">${phone ? `<a href="${esc(phone)}">${icon('phone')}拨打电话</a>` : `<button disabled>${icon('phone')}电话未配置</button>`}<button data-grid-shelter="locate" ${model.hasLocation(item) ? '' : 'disabled'}>${icon('pin')}${model.hasLocation(item) ? '地图定位' : '位置未配置'}</button></div>${model.hasLocation(item) ? '' : '<p class="gs-unavailable">暂无坐标，可根据详细地址确认位置。</p>'}`);
    show(detail.id);
  }
  function scopePicker() {
    renderGridSheltersHTML(overlay, `<div class="gs-sheet" role="dialog" aria-modal="true" aria-label="选择安置点查询范围"><div class="gs-sheet-heading"><h2>查询范围</h2><button data-grid-shelter="close" aria-label="关闭"><i data-tabler=x></i></button></div><div class="gs-scope-options">${scopes().filter(item => item.type === 'street' || item.type === 'district').map(item => `<button data-gs-scope="${esc(item.id)}" class="${item.id === state.scopeId ? 'selected' : ''}">${esc(item.name)}<b>${item.id === state.scopeId ? '<i data-tabler=check></i>' : ''}</b></button>`).join('')}</div></div>`);
    overlay.hidden = false;
  }
  function locate() {
    const item = data.shelters.find(shelter => shelter.id === state.current); if (!item || !model.hasLocation(item)) return;
    renderGridSheltersHTML(overlay, `<div class="gs-sheet" role="dialog" aria-modal="true" aria-label="安置点示意位置"><div class="gs-sheet-heading"><h2>地图定位</h2><button data-grid-shelter="close" aria-label="关闭"><i data-tabler=x></i></button></div><div class="gs-location-map"><div class="gs-map-road one"></div><div class="gs-map-road two"></div><span class="gs-map-pin">${icon('pin')}</span><small>示意定位</small></div><div class="gs-location-label"><b>${esc(item.name)}</b><span>${esc(item.address)}</span></div></div>`);
    overlay.hidden = false;
  }
  app.addEventListener('click', event => {
    if (document.body.dataset.role !== 'grid' && !(document.body.dataset.role === 'dept' && ['grid-shelter-query','grid-shelter-detail'].includes(app.querySelector('.view.active')?.id))) return;
    const trigger = event.target.closest('[data-grid-shelter], [data-grid-shelter-id], [data-gs-scope]');
    if (!trigger) { if (event.target === overlay) closeLayer(); return; }
    event.preventDefault(); event.stopImmediatePropagation();
    if (trigger.dataset.gridShelterId) { openDetail(trigger.dataset.gridShelterId); return; }
    if (trigger.dataset.gsScope) { state.scopeId = trigger.dataset.gsScope; closeLayer(); renderRows(); window.scrollTo(0, 0); return; }
    switch (trigger.dataset.gridShelter) {
      case 'open': open(); break;
      case 'home': closeLayer(); if(returnHome==='dept')window.DepartmentDemo?.home();else show('home'); break;
      case 'list': closeLayer(); renderRows(); show(list.id); window.scrollTo(0, state.listScroll); break;
      case 'scope': scopePicker(); break;
      case 'close': closeLayer(); break;
      case 'locate': locate(); break;
      case 'clear': state.keyword = ''; document.getElementById('gsSearch').value = ''; renderRows(); break;
    }
  }, true);
  document.getElementById('gsSearch').addEventListener('input', event => { state.keyword = event.target.value; renderRows(); });
  document.addEventListener('click', event => {
    if (event.target.closest('.role-switch [data-role], [data-scope-id]')) closeLayer();
    if (event.target.closest('[data-scope-id]') && (list.classList.contains('active') || detail.classList.contains('active'))) { state.current = null; show('home'); }
  }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) closeLayer(); });
  window.GridShelters = {open};
})();
