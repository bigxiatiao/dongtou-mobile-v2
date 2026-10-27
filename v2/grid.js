// React view boundary; the fallback keeps the existing store/controller regression fixtures runnable.
function renderGridHTML(element, markup) {
  if (window.ReactView) return window.ReactView.html(element, markup);
  element.innerHTML = markup; return markup;
}
function renderGridText(element, value) {
  if (window.ReactView) return window.ReactView.text(element, value);
  element.textContent = value; return value;
}
/* 主工作台交互：集中处理网格端导航、筛选和演示反馈。 */
(function() {
  const app=document.getElementById('app');
  const toast=document.getElementById('toast');
  const modal=document.getElementById('modal');
  const note=t=> {
    renderGridText(toast, t);
    toast.style.display='block';
    clearTimeout(window.__workbenchToast);
    window.__workbenchToast=setTimeout(()=>toast.style.display='none',1800)
  };
  const show=id=> {
    app.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    window.scrollTo(0,0)
  };
  const modalMsg=(title,msg)=> {
    renderGridText(document.getElementById('mt'), title);
    renderGridText(document.getElementById('mx'), msg);
    modal.classList.add('open')
  };
  const messages=[ {
    id:1,title:'海滨路低洼段临时交通提醒',text:'海滨路低洼段因积水暂时无法通行，请经滨海大道绕行。现场情况变化将另行通知。',time:'今天09:20'
  }, {
  id:2,title:'安置点接收工作已启动',text:'请按安排组织人员前往安置点，到点后由工作人员核验登记。',time:'今天09:10'
}, {
id:3,title:'本轮防台工作提醒',text:'请核实实际居住人员，并及时更新任务办理情况。',time:'昨天18:00'
}
];
let readMessages=new Set([3]);
let messageFilter='全部';
const noticeBar=document.getElementById('latestNotice');
function renderNoticeBar() {
  const unread=messages.filter(m=>!readMessages.has(m.id)).length;
  renderGridHTML(noticeBar, '<b>最新通知</b>'+(unread?'<i class="unread-dot">'+unread+'</i>':'')+'<button data-workbench="notice-list">09:20 镇街指挥室：海滨路低洼段因积水暂时无法通行，请绕行滨海大道。　09:10 安置点接收工作已启动。</button><span><i data-tabler=chevron-right></i></span>')
}
renderNoticeBar();
function renderNotices() {
  const rows=messages.filter(m=>messageFilter==='全部'||(messageFilter==='已读'?readMessages.has(m.id):!readMessages.has(m.id)));
  renderGridText(document.getElementById('noticeUnread'), '未读 '+messages.filter(m=>!readMessages.has(m.id)).length);
  document.querySelectorAll('#noticeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.messageFilter===messageFilter));
  renderGridHTML(document.getElementById('noticeRows'), rows.map(m=>'<button class="notice-item" data-message-id="'+m.id+'"><b>'+m.title+'</b><span class="tag '+(readMessages.has(m.id)?'g':'r')+'">'+(readMessages.has(m.id)?'已读':'未读')+'</span><small>镇街指挥室 · '+m.time+'</small></button>').join('')||'<div class="card"><div class="notice">暂无消息</div></div>');
  renderNoticeBar()
}
function openMessage(id) {
  const m=messages.find(x=>x.id===id);
  if(!m)return;
  readMessages.add(id);
  renderGridHTML(document.getElementById('noticeDetailBody'), '<div class="card"><div class="ph">'+m.title+'<small>'+m.time+'</small></div><div class="field notice-body"><p>发布单位：镇街指挥室</p><p>'+m.text+'</p><span class="tag g">已读</span></div></div>');
  renderNotices();
  show('notice-detail')
}
renderNotices();
let detailReturn='home';
function showDetail(kind,source) {
  detailReturn=source||app.querySelector('.view.active')?.id||'home';
  show(kind==='transfer'?'transfer':kind==='review'?'review':kind==='risk'?'risk':'grid-restore');
}
window.WorkbenchNotices={summary(){return noticeBar.querySelector('button')?.textContent||messages[0].title;},open(){renderNotices();show('notice-list');},openMessage,setFilter(value){messageFilter=value;renderNotices();},unread(){return messages.filter(m=>!readMessages.has(m.id)).length;},messages};
// 基层角色的导航、筛选和操作由同一个点击入口处理。
app.addEventListener('click',e=> {
  if(document.body.dataset.role!=='grid')return;
  if(window.TransferDemo?.handleClick(e))return;
  const status=e.target.closest('.tabs [data-status]');
  if(status) {
    e.stopImmediatePropagation();
    const box=status.closest('.tabs');
    box.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    status.classList.add('active');
    const id=box.closest('#transfer-list')?'transferRows':box.closest('#risk-list')?'riskRows':'baseRows';
    document.querySelectorAll('#'+id+' .task-row').forEach(r=>r.classList.toggle('hidden',status.dataset.status!=='all'&&r.dataset.status!==status.dataset.status));
    return;
  }
  const v=e.target.closest('[data-workbench]');
  if(v) {
    e.stopImmediatePropagation();
    const act=v.dataset.workbench;
    if(act==='home'||act==='transfer-list'||act==='risk-list'||act==='base-list'||act==='notice-list') {
      if(act==='notice-list')renderNotices();
      show(act);
      return;
    }
    if(act==='risk'||act==='transfer'||act==='review'||act==='restore') {
      showDetail(act);
      return;
    }
  }
  const messageTab=e.target.closest('[data-message-filter]');
  if(messageTab) {
    e.stopImmediatePropagation();
    messageFilter=messageTab.dataset.messageFilter;
    renderNotices();
    return;
  }
  const message=e.target.closest('[data-message-id]');
  if(message) {
    e.stopImmediatePropagation();
    openMessage(Number(message.dataset.messageId));
    return;
  }
  const tab=e.target.closest('[data-tab]');
  if(tab) {
    e.stopImmediatePropagation();
    const id=tab.dataset.tab;
    if(id==='tasks') {
      show(detailReturn);
      return;
    }
    if(id==='transfer'||id==='review'||id==='grid-restore'||id==='risk') {
      showDetail(id==='review'?'review':id);
      return;
    }
    if(id==='home')show('home');
    return;
  }
  const action=e.target.closest('[data-action]');
  if(action) {
    e.stopImmediatePropagation();
    const x=action.dataset.action;
    if(x==='voice') {
      renderGridHTML(action, '<i data-tabler=microphone></i> 正在听…');
      setTimeout(()=> {
        renderGridHTML(action, '<i data-tabler=check></i> 已转文字');
        note('语音已转为文字，可继续修改');
      },650);
      return;
    }
    if(x==='camera') {
      action.classList.add('face');
      renderGridHTML(action, '现场照片已采集<br>09:48 · 已定位');
      note('照片已采集，可继续补拍');
      return;
    }
    if(x==='level') {
      action.parentElement.querySelectorAll('.level,.home-levels button').forEach(b=>b.classList.remove('selected'));
      action.classList.add('selected');
      note('应急等级已切换');
      return;
    }
    if(x==='mode') {
      action.parentElement.querySelectorAll('.mode').forEach(b=>b.classList.remove('on'));
      action.classList.add('on');
      note('采集情形已切换');
      return;
    }
    if(x==='status') {
      action.parentElement.querySelectorAll('.check').forEach(b=>b.classList.remove('selected'));
      action.classList.add('selected');
      note('现场状态已记录');
      return;
    }
    if(x==='apply-release') {
      modalMsg('风险解除申请已提交','现场资料已提交部门复核。');
      return;
    }
    if(x==='report-restore') {
      modalMsg('恢复条件已上报','现场条件与凭证已提交，等待后台研判。');
      return;
    }
    if(['add','route','call','submit-risk'].includes(x)) {
      modalMsg(x==='submit-risk'?'风险处置已生成':x==='finish-review'?'复核已办结':'操作已记录','现场信息、照片和操作人已记录，后台可继续查看和督办。');
      return;
    }
  }
},true);
}
)();
