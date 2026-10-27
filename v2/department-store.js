/* 部门数据与任务规则。权限在读取及写入边界检查，不依赖页面隐藏。 */
(() => {
  const config=window.DepartmentData, transfer=window.TransferDemoData;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const getPath=(o,k)=>k.split('.').reduce((v,p)=>v?.[p],o);
  function setPath(o,k,v){const a=k.split('.');let t=o;a.slice(0,-1).forEach(p=>{t[p]??={};t=t[p];});t[a.at(-1)]=v;}
  let data=config.seed(),accountId=data.accounts[0].accountId,serial=0;
  const drafts=new Map(),recent=new Map();
  const id=prefix=>`${prefix}-new-${++serial}`;
  const now=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai',hour12:false});
  const account=()=>data.accounts.find(a=>a.accountId===accountId);
  const authorized=u=>!!u&&u.departmentId===account().id&&account().authorizedUnitIds.includes(u.id);
  const unit=uid=>{const u=data.units.find(x=>x.id===uid);return authorized(u)?u:null;};
  const units=()=>data.units.filter(authorized);
  const membership=mid=>{const m=data.memberships.find(x=>x.id===mid);return m&&m.departmentId===account().id&&unit(m.unitId)?m:null;};
  function person(pid,mid){const p=data.people.find(x=>x.id===pid&&x.departmentId===account().id);const m=mid?membership(mid):data.memberships.find(x=>x.personId===pid&&membership(x.id)&&x.status==='在册')||data.memberships.find(x=>x.personId===pid&&membership(x.id));return p&&m&&m.personId===pid?{...p,membership:clone(m)}:null;}
  const people=uid=>data.memberships.filter(m=>membership(m.id)&&m.status==='在册'&&(!uid||m.unitId===uid)).map(m=>person(m.personId,m.id));
  const instruction=iid=>data.instructions.find(i=>i.id===iid&&i.departmentId===account().id);
  function execution(eid){const e=data.executions.find(x=>x.id===eid);const u=e&&unit(e.unitId),i=e&&instruction(e.instructionId);return u&&e.departmentId===account().id&&i?.unitIds.includes(u.id)&&i.targetUnitTypes.includes(u.unitType)&&(!i.targetObjectTypes.length||i.targetObjectTypes.includes(u.objectType))?e:null;}
  const executions=()=>data.executions.filter(e=>execution(e.id));
  const task=tid=>{const t=data.tasks.find(x=>x.id===tid);return t&&t.departmentId===account().id&&execution(t.executionId)?.personTaskIds.includes(t.id)?t:null;};
  const tasks=()=>data.tasks.filter(t=>task(t.id));
  const taskPerson=t=>data.people.find(p=>p.id===t?.personId&&p.departmentId===account().id);
  const fail=(key,label)=>({key,label});
  const outcome=missing=>({ok:false,error:missing.map(x=>x.label).join('；'),missing});
  const validPhone=v=>/^(?:\+?\d{1,3}[ -]?)?(?:1[3-9]\d{9}|0\d{2,3}[ -]?\d{7,8})(?:[ -]\d{1,6})?$/.test(String(v));
  const tel=v=>validPhone(v)?'tel:'+String(v).replace(/[ -]/g,''):'';
  const hasGeo=v=>v&&Number.isFinite(v.lng)&&Number.isFinite(v.lat)&&Math.abs(v.lng)<=180&&Math.abs(v.lat)<=90;
  function validId(v){if(!/^\d{17}[\dX]$/i.test(v))return false;const y=+v.slice(6,10),m=+v.slice(10,12),d=+v.slice(12,14),dt=new Date(Date.UTC(y,m-1,d));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return false;const w=[7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];return '10X98765432'[[...v.slice(0,17)].reduce((n,c,i)=>n+Number(c)*w[i],0)%11]===v[17].toUpperCase();}
  function validCredit(v){const alphabet='0123456789ABCDEFGHJKLMNPQRTUWXY',w=[1,3,9,27,19,26,16,17,20,29,25,13,8,24,10,30,28];if(v.length!==18||[...v].some(c=>!alphabet.includes(c)))return false;return alphabet[(31-[...v.slice(0,17)].reduce((n,c,i)=>n+alphabet.indexOf(c)*w[i],0)%31)%31]===v[17];}
  const visible=(f,r,e)=>!f.when||f.when(r,e);
  function validate(fields,record,context=record){const errors=[];fields.filter(f=>!f.readonly&&visible(f,context)).forEach(f=>{
    const v=getPath(record,f.key),empty=v==null||v===''||(Array.isArray(v)&&!v.length);
    if(empty){if(f.required)errors.push(fail(f.key,`请填写${f.label}`));return;}
    if(f.type==='tel'&&!validPhone(v))errors.push(fail(f.key,`${f.label}格式不正确，支持手机或座机`));
    if(['integer','positive'].includes(f.type)&&(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||(f.type==='positive'&&Number(v)<1)))errors.push(fail(f.key,`${f.label}应为${f.type==='positive'?'正':'非负'}整数`));
    if(f.type==='choice'&&!f.options.some(o=>(typeof o==='string'?o:o.value)===v))errors.push(fail(f.key,`${f.label}请选择已有选项`));
    if(f.type==='location'&&!hasGeo(v))errors.push(fail(f.key,`${f.label}经纬度无效`));
    if(f.type==='street'&&!window.CollectionStore.scopes().some(s=>s.type==='street'&&s.id===v))errors.push(fail(f.key,'请选择已有街道'));
    if(f.type==='datetime'&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(v))||!Number.isFinite(Date.parse(v))))errors.push(fail(f.key,`${f.label}格式不正确`));
    if(f.type==='credit'&&!validCredit(String(v)))errors.push(fail(f.key,'统一社会信用代码校验不通过'));
    if(f.type==='document'&&((record.documentType==='居民身份证'&&!validId(v))||(record.documentType==='护照'&&!/^[A-Za-z0-9]+$/.test(v))))errors.push(fail(f.key,'证件号码与证件类型不匹配'));
  });return errors;}
  function writable(fields,input,record){const out={};fields.filter(f=>!f.readonly&&visible(f,record)).forEach(f=>{let v=getPath(input,f.key);if(v===undefined)v='';if(typeof v==='string')v=v.trim();setPath(out,f.key,clone(v));});return out;}
  function saveUnit(input,uid){const old=uid?unit(uid):null;if(uid&&!old)return outcome([fail('id','无权维护该单位')]);
    const candidate={...clone(old||{}),...clone(input),departmentId:account().id,unitType:account().type};
    if(old)candidate.objectType=old.objectType;
    const fields=config.unitFields(account(),candidate),patch=writable(fields,candidate,candidate),errors=validate(fields,candidate);
    if(errors.length)return outcome(errors);
    const target=old||{id:id('unit'),departmentId:account().id,unitType:account().type,verification:{status:'pending',by:'',at:''},mapPoint:{x:50,y:45}};
    Object.assign(target,patch,{updatedAt:now()});
    if(!old){data.units.push(target);account().authorizedUnitIds.push(target.id);}
    return{ok:true,item:target};
  }
  function savePerson(input,pid,mid){const old=pid?person(pid,mid):null;if(pid&&!old)return outcome([fail('id','无权维护该人员')]);
    const uid=old?.membership.unitId||input.membership?.unitId,u=unit(uid);if(!u)return outcome([fail('membership.unitId','请选择当前部门已有单位')]);
    const candidate={...clone(old||{}),...clone(input),membership:{...clone(old?.membership||{}),...clone(input.membership||{}),unitId:uid},departmentId:account().id};
    candidate.membership.status ||= '在册';
    if(!candidate.documentType&&candidate.documentNumber)return outcome([fail('documentType','清除证件类型时请同时清空证件号码')]);
    const fields=config.personFields(account(),candidate),errors=validate(fields,candidate),patch=writable(fields,candidate,candidate);
    const tagIds=window.CollectionStore.normalizeTagIds('person',candidate.tagIds||[],old?.tagIds||[]);
    if(JSON.stringify(tagIds)!==JSON.stringify(candidate.tagIds||[]))errors.push(fail('tagIds','人员标签请选择配置目录中的选项'));
    if(errors.length)return outcome(errors);
    const member=old?data.memberships.find(m=>m.id===old.membership.id):{id:id('membership'),unitId:uid,departmentId:account().id,verification:{status:'pending',by:'',at:''}};
    const p=old?data.people.find(p=>p.id===pid):{id:id('person'),departmentId:account().id};
    const mp=patch.membership;delete patch.membership;Object.assign(p,patch,{updatedAt:now()});Object.assign(member,mp,{personId:p.id});
    if(!old){data.people.push(p);data.memberships.push(member);}return{ok:true,item:person(p.id,member.id)};
  }
  function move(pid,mid,uid){const p=person(pid,mid),u=unit(uid);if(!p||!u)return outcome([fail('membership.unitId','请选择本部门已有单位')]);if(p.membership.unitId===uid)return{ok:true,item:p};
    const old=data.memberships.find(m=>m.id===mid),at=now();old.status='已离开';old.leftAt=at;
    const m={...clone(old),id:id('membership'),unitId:uid,status:'在册',joinedAt:at,verification:{status:'pending',by:'',at:''}};delete m.leftAt;data.memberships.push(m);return{ok:true,item:person(pid,m.id)};
  }
  function verify(kind,oid,mid){const item=kind==='unit'?unit(oid):membership(mid);if(!item||(kind==='person'&&item.personId!==oid))return outcome([fail('id','当前对象不可核查')]);item.verification={status:'verified',by:account().user,at:now()};return{ok:true};}
  function event(target,type,detail,changes=[]){const e={id:id('event'),at:now(),actorId:account().accountId,actorName:account().user,type,detail,sourceId:target.id,changes:clone(changes)};target.events.push(e);return e;}
  const eligible=(t,phase='transfer')=>!!t&&(phase==='review'?['待复核','已复核'].includes(t.status):['待转移','转移途中','异常跟进'].includes(t.status));
  const statuses=['待转移','转移途中','待复核','已复核','异常跟进'];
  function normalizeDestination(dest){if(!dest?.type)return null;const d=clone(dest),fields=config.destinationFields[d.type];if(!fields)return null;const out={type:d.type};fields.forEach(([k])=>{if(d[k]!==undefined&&d[k]!=='')out[k]=typeof d[k]==='string'?d[k].trim():clone(d[k]);});return window.TransferStore.normalizeDestination(out);}
  function destinationErrors(d){if(!d||(!d.type&&!Object.values(d).some(Boolean)))return[];const errors=[];if(!config.destinationFields[d.type])return[fail('destination.type','请选择有效安置方式')];const fields=config.destinationFields[d.type].map(([k,l,t])=>fieldForDestination(k,l,t));
    errors.push(...validate(fields,d).map(error=>({...error,key:'destination.'+error.key})));
    if(d.type==='center'&&d.placeId&&!transfer.shelters.some(s=>s.id===d.placeId))errors.push(fail('destination.placeId','请选择目录中的安置点'));return errors;
  }
  function fieldForDestination(key,label,type='text'){if(type==='relationship'||type==='careLevel')return{key,label,type:'choice',options:transfer.formOptions[type]};return{key,label,type};}
  function saveTask(tid,values={},mode='transfer'){
    const t=task(tid);if(!t)return outcome([fail('id','无权办理该任务')]);
    if(mode==='transfer'&&!eligible(t))return outcome([fail('status','当前任务请使用后补或修改安置入口')]);
    if(!['transfer','supplement','modify'].includes(mode))return outcome([fail('mode','操作类型无效')]);
    if(mode!=='transfer'&&!['待复核','已复核','转移途中','待转移','异常跟进'].includes(t.status))return outcome([fail('status','当前任务不可维护')]);
    const result=mode==='transfer'?values.transferResult:t.transferResult;
    const validResults=['转移途中','已落实安置','拒绝转移','人员不在现场','联系不上','其他异常'];
    if(mode==='transfer'&&!validResults.includes(result))return outcome([fail('transferResult','请选择办理结果')]);
    const raw=result==='拒绝转移'?null:values.destination;
    const errors=result==='拒绝转移'?[]:destinationErrors(raw);
    if(result==='已落实安置'&&raw?.type==='unknown')errors.push(fail('destination.type','已落实安置不能选择去向未明'));
    const old=t.destination||t.plannedDestination;
    const dest=normalizeDestination(raw);
    if(mode==='transfer'&&result!=='拒绝转移'&&old&&JSON.stringify(normalizeDestination(old))!==JSON.stringify(dest)&&!String(values.changeReason||'').trim())errors.push(fail('changeReason','已有安置安排发生变更，请填写修改原因'));
    if(mode==='modify'&&!String(values.changeReason||'').trim())errors.push(fail('changeReason','请填写修改安置安排原因'));
    if(mode==='supplement'&&old){
      const changing=Object.keys(old).some(k=>old[k]!==''&&old[k]!=null&&JSON.stringify(old[k])!==JSON.stringify(dest?.[k]));
      if(changing)errors.push(fail('destination','已有安排发生变更，请使用“修改安置安排”并填写原因'));
    }
    if(errors.length)return outcome(errors);
    const before=clone({destination:t.destination,plannedDestination:t.plannedDestination,note:t.note,photos:t.photos});
    if(result==='人员不在现场'){t.plannedDestination=dest;t.destination=null;}else{t.destination=dest;t.plannedDestination=null;}
    t.note=String(values.note||'').trim();t.photos=clone(values.photos||[]);
    if(mode==='transfer'){
      t.transferResult=result;
      const mapped=result==='人员不在现场'?'人员不在家':result;
      // Shared state mapping; department wording is adapted at the boundary.
      t.status=window.TransferStore.resultToStatus(mapped);
    }
    const after={destination:t.destination,plannedDestination:t.plannedDestination,note:t.note,photos:t.photos};
    const changes=Object.keys(after).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])).map(k=>({key:k,old:before[k],value:after[k]}));
    if(mode!=='transfer'&&!changes.length)return{ok:true,unchanged:true};
    const description={转移途中:'已出发，尚未到达',已落实安置:'已落实安置，等待复核',人员不在现场:'现场未找到人员，继续跟踪',拒绝转移:'本人明确拒绝，继续劝导',联系不上:'暂未联系到本人',其他异常:'需继续跟踪处理'};
    const destinationLabel=dest?`${transfer.formOptions.placementLabel[dest.type]}${dest.placeName?'；地点：'+dest.placeName:''}`:'尚未填写';
    const recorded=event(t,mode==='transfer'?'提交转移办理':mode==='modify'?'修改安置安排':'补充安置信息',`${mode==='transfer'?'办理结果：'+result+'（'+description[result]+'）；':''}${result==='人员不在现场'?'计划安置':'安置安排'}：${destinationLabel}${values.changeReason?'；修改原因：'+values.changeReason:''}${t.note?'；办理说明：'+t.note:''}`,changes);recorded.photos=clone(t.photos);
    return{ok:true,item:t};
  }
  function review(tid,values={}){const t=task(tid);if(!eligible(t,'review'))return outcome([fail('status','当前任务尚不符合安置复核阶段')]);const result=values.result||'通过';if(!transfer.formOptions.result.includes(result))return outcome([fail('result','复核结果无效')]);
    const r={id:id('review'),at:now(),actorId:account().accountId,actorName:account().user,result,contact:values.contact||'',note:values.note||'',photos:clone(values.photos||[])};t.reviewRecords.push(r);t.status='已复核';
    if(result!=='通过')t.pendingCorrections.push({id:id('correction'),taskId:t.id,reviewId:r.id,at:r.at,note:r.note||result,status:'pending'});
    const recorded=event(t,'确认安置复核',`第${t.reviewRecords.length}次复核；结果：${result}${r.contact?'；接收联系：'+r.contact:''}${r.note?'；说明：'+r.note:''}`);recorded.photos=clone(r.photos);return{ok:true,item:t};
  }
  function resolve(tid,cid,values={}){const t=task(tid),c=t?.pendingCorrections.find(x=>x.id===cid&&x.status==='pending');if(!c)return outcome([fail('id','补正事项不存在或已处理')]);Object.assign(c,{status:'resolved',resolvedAt:now(),resolvedBy:account().user,resolutionNote:values.note||'',photos:clone(values.photos||[])});const recorded=event(t,'确认补正已处理',`${c.note}${c.resolutionNote?'；处理说明：'+c.resolutionNote:''}`);recorded.photos=clone(c.photos);return{ok:true};}
  function saveMeasures(eid,values={}){const e=execution(eid);if(!e)return outcome([fail('id','无权办理单位措施')]);const errors=[];
    e.measures.forEach(m=>{const v=values.measures?.[m.key];if(!['已落实','未落实'].includes(v))errors.push(fail(`measures.${m.key}`,`请选择${m.label}结果`));if(m.result==='已落实'&&v==='未落实'&&!String(values.changeReason||'').trim())errors.push(fail('changeReason','已落实回退需填写原因'));});
    const u=unit(e.unitId),fields=config.inspections[u.unitType].filter(f=>visible(f,u,e)).map(f=>({...f,when:null}));errors.push(...validate(fields,values,u));if(errors.length)return outcome(errors);
    const changes=e.measures.filter(m=>m.result!==values.measures[m.key]).map(m=>({key:m.key,label:m.label,old:m.result||'待确认',value:values.measures[m.key]}));
    e.measures.forEach(m=>m.result=values.measures[m.key]);e.inspection=writable(fields,values,u).inspection||{};e.note=values.note||'';e.photos=clone(values.photos||[]);
    const recorded=event(e,'提交单位措施',`${e.measures.map(m=>m.label+'：'+m.result).join('；')}${values.changeReason?'；变更原因：'+values.changeReason:''}${e.note?'；执行说明：'+e.note:''}`,changes);recorded.photos=clone(e.photos);recorded.inspection=clone(e.inspection);return{ok:true};
  }
  function progress(eid){const e=execution(eid);if(!e)return null;const members=e.personTaskIds.map(task),u=unit(e.unitId);const roster=people(u.id),taskPersons=new Set(members.filter(Boolean).map(t=>t.personId));
    const missing=u.unitType==='site'&&!e.noTransferRequired?roster.filter(p=>!taskPersons.has(p.id)):[];
    const corrections=members.filter(Boolean).flatMap(t=>t.pendingCorrections.filter(c=>c.status==='pending'));
    const conflict=(e.noTransferRequired&&members.length>0)||members.some(t=>!t)||missing.length>0;
    const reviewed=members.filter(t=>t?.reviewRecords.length>0).length,measuresDone=e.measures.length>0&&e.measures.every(m=>m.result==='已落实');
    const personnelDone=e.noTransferRequired?members.length===0:members.length>0&&reviewed===members.length;
    return{total:members.length,reviewed,measuresDone,personnelDone,corrections,missing,conflict,complete:measuresDone&&personnelDone&&!corrections.length&&!conflict,rosterPending:!e.noTransferRequired&&!members.length};
  }
  function batch(rows,phase='transfer'){if(!['transfer','review'].includes(phase))return rows.map(r=>({id:r.id,...outcome([fail('phase','批量阶段无效')])}));const seen=new Set();return rows.map(r=>{if(seen.has(r.id))return{id:r.id,ok:false,error:'任务重复，未重复提交'};seen.add(r.id);if(!eligible(task(r.id),phase))return{id:r.id,ok:false,error:'当前任务阶段不适用'};return{id:r.id,...(phase==='review'?review(r.id,r.values):saveTask(r.id,r.values))};});}
  function groups(status='all'){const map=new Map();tasks().filter(t=>status==='all'||t.status===status).forEach(t=>{const key=t.executionId;if(!map.has(key))map.set(key,{execution:execution(key),unit:unit(t.unitId),tasks:[]});map.get(key).tasks.push(t);});return[...map.values()];}
  function mapGroups(mode){if(mode==='task'&&!window.GridHomeData.getCurrentAction())return[];return units().map(u=>{const rows=mode==='collection'?[{id:u.id,type:'unit',label:u.name,status:u.verification.status==='verified'?'已核查':'待核查',color:u.verification.status==='verified'?'green':'red'}]:tasks().filter(t=>t.unitId===u.id&&['待转移','待复核','异常跟进'].includes(t.status)).map(t=>({id:t.id,type:'task',label:taskPerson(t)?.name||'人员',status:t.status,color:{待转移:'orange',待复核:'yellow',异常跟进:'red'}[t.status]}));const color=['red','orange','yellow','green'].find(c=>rows.some(x=>x.color===c));return{unit:u,items:rows,color};}).filter(g=>g.items.length);}
  function search(kind,q){q=String(q).trim().toLowerCase();if(!q)return[];return(kind==='unit'?units():people()).filter(r=>(kind==='unit'?[r.name,r.address,r.vesselNumber,r.pointNumber]:[r.name,r.phone,r.documentNumber]).some(v=>String(v||'').toLowerCase().includes(q)));}
  const contacts=()=>[...data.contacts.filter(c=>c.visibility==='public'||c.departmentId===account().id),{id:account().id+'-duty',name:account().user,organization:account().fullName,position:'部门值班（示例）',phone:account().phone},...units().map(u=>({id:u.id,name:u.principalName,organization:u.name,position:'单位负责人',phone:u.principalPhone,unitId:u.id}))];
  const draftKey=key=>accountId+':'+key;
  window.DepartmentStore={get data(){return data;},config,account,units,unit,people,person,membership,instruction,execution,executions,task,tasks,taskPerson,groups,mapGroups,progress,eligible,statuses,saveUnit,savePerson,move,verify,saveTask,review,resolve,saveMeasures,batch,search,contacts,getPath,setPath,visible,validate,validPhone,tel,hasGeo,normalizeDestination,
    switchAccount(aid){if(!data.accounts.some(a=>a.accountId===aid))return false;accountId=aid;return true;},
    draft(key,value){if(arguments.length===2){if(value===null)drafts.delete(draftKey(key));else drafts.set(draftKey(key),clone(value));}return clone(drafts.get(draftKey(key))||null);},
    recent(kind){return recent.get(draftKey(kind))||[kind==='unit'?units()[0].name:people()[0].name];},
    remember(kind,q){recent.set(draftKey(kind),[q,...this.recent(kind).filter(x=>x!==q)].slice(0,5));},
    reset(){data=config.seed();accountId=data.accounts[0].accountId;serial=0;drafts.clear();recent.clear();}
  };
})();
