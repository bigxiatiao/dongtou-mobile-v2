export async function bootstrapBusiness() {
  // Keep the existing store dependencies and original synchronous initialization order.
  await import('../../v2/collection-data.js');
  await import('../../v2/transfer-data.js');
  await import('../../v2/home-data.js');
  await import('../../v2/transfer-store.js');
  await import('../../v2/transfer.js');
  await import('../../v2/grid.js');
  await import('../../v2/department-data.js');
  await import('../../v2/department-store.js');
  await import('../../v2/department.js');
  await import('../../v2/shelter.js');
  await import('../../v2/collection.js');
  await import('../../v2/home-shell.js');
  await import('../../v2/home-map-data.js');
  await import('../../v2/home-map.js');
  await import('../../v2/grid-shelters.js');
  const modal = document.getElementById('modal');
  const closeModal = () => modal.classList.remove('open');
  document.getElementById('close').onclick = closeModal;
  document.getElementById('ok').onclick = closeModal;
  modal.onclick = event => { if (event.target === modal) closeModal(); };
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-role]');
    if (!target || target === document.body || target.dataset.role === document.body.dataset.role) return;
    event.preventDefault(); event.stopImmediatePropagation();
    switchMobileRole(target.dataset.role);
  }, true);
  window.switchMobileRole = switchMobileRole;
  window.__appReady = true;
}
function switchMobileRole(role) {
  if (!['grid', 'dept'].includes(role)) return;
  document.body.dataset.role = role;
  document.querySelector('[data-role-style="grid"]').disabled = role !== 'grid';
  document.querySelector('[data-role-style="shelter"]').disabled = role !== 'dept';
  document.querySelectorAll('button[data-role]').forEach(button => button.classList.toggle('on', button.dataset.role === role));
  document.getElementById('deptNav').classList.add('hidden');
  document.getElementById('brandContext')?.classList.toggle('hidden', role === 'dept');
  document.getElementById('departmentContext')?.classList.toggle('hidden', role !== 'dept');
  document.querySelectorAll('#app .view').forEach(view => view.classList.toggle('active', view.id === (role === 'dept' ? 'dept' : 'home')));
  document.getElementById('modal').classList.remove('open');
  window.DepartmentDemo?.roleChanged(role);
  window.scrollTo(0, 0);
}
