/* Pure event validation and measures shared by the UI and regression checks. */
(function(root){
  'use strict';
  const day = timestamp => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
  function validateEvents(events,bank) {
    if(!Array.isArray(events)||events.length>20000)throw Error('기록 개수 형식이 올바르지 않습니다.');
    const ids=new Set(),questions=new Map(bank.questions.map(q=>[q.id,q]));
    return events.map(e=>{
      const q=questions.get(e?.questionId);
      if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(e.id)||ids.has(e.id)||!q||e.bankVersion!==bank.version||!q.options.some(o=>o[0]===e.selected)||!['sure','unsure','guess'].includes(e.confidence)||typeof e.hint!=='boolean'||!['practice','retry','delayed'].includes(e.mode)||!Number.isFinite(e.at)||e.at<Date.UTC(2026,0,1)||e.at>Date.now()+300000||!Number.isInteger(e.activeMs)||e.activeMs<0||e.activeMs>120000||!['unknown','meaning','rule','reading','slip'].includes(e.reason||'unknown'))throw Error('이 체험의 기록 형식·문항 버전과 맞지 않습니다.');
      ids.add(e.id);
      return {id:e.id,bankVersion:bank.version,questionId:q.id,concept:q.concept,selected:e.selected,correct:e.selected===q.answer,confidence:e.confidence,hint:e.hint,mode:e.mode,at:e.at,activeMs:e.activeMs,reason:e.reason||'unknown'};
    }).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  }
  function firsts(events) {const seen=new Set();return events.filter(e=>{const key=day(e.at)+'|'+e.questionId;if(seen.has(key))return false;seen.add(key);return true;});}
  function recovery(events,qid,now=Date.now()) {
    const list=events.filter(e=>e.questionId===qid),wrong=list.filter(e=>!e.correct).at(-1);
    if(!wrong)return {status:'none'};
    const after=list.filter(e=>e.at>wrong.at&&e.correct&&!e.hint);
    const delayed=after.find(e=>e.at-wrong.at>=86400000);
    if(delayed)return {status:'checked',wrong,checked:delayed};
    return {status:after.length?'waiting':'needs',wrong,due:now-wrong.at>=86400000};
  }
  function stats(events,bank,now=Date.now()) {
    const first=firsts(events),today=first.filter(e=>day(e.at)===day(now)),unaided=first.filter(e=>!e.hint),success=unaided.filter(e=>e.correct);
    const conceptStats=bank.concepts.map(c=>{const rows=first.filter(e=>e.concept===c.id),alone=rows.filter(e=>!e.hint);return {...c,total:rows.length,attempts:alone.length,correct:alone.filter(e=>e.correct).length,wrong:rows.filter(e=>!e.correct).length,uncertain:rows.filter(e=>e.correct&&e.confidence!=='sure').length,hints:rows.filter(e=>e.hint).length,small:alone.length<8};});
    const reviewed=bank.questions.map(q=>({q,...recovery(events,q.id,now)}));
    return {first,today,unaided,success,concepts:conceptStats,reviewed,repaired:reviewed.filter(r=>r.status==='checked').length,needs:reviewed.filter(r=>r.status==='needs'||r.status==='waiting')};
  }
  const api={day,validateEvents,firsts,recovery,stats};root.StudyCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
