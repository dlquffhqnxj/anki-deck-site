/* Shared study record validation and measures. */
(function(root){
  'use strict';
  const day = timestamp => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
  const defaultReasons = {
    unknown: '아직 모르겠음', meaning: '뜻을 몰랐음', rule: '규칙을 혼동함',
    reading: '문장을 잘못 읽음', slip: '입력·선택 실수'
  };
  const allQuestions = bank => [...bank.questions, ...(bank.followups || [])];
  const storageKey = subject => subject === 'japanese' ? 'anki-design-lab-v1' : 'anki-design-lab-v1-' + subject;
  function validateEvents(events,bank) {
    if(!Array.isArray(events)||events.length>20000)throw Error('기록 개수 형식이 올바르지 않습니다.');
    const ids=new Set(),questions=new Map(allQuestions(bank).map(q=>[q.id,q]));
    const reasons = new Set(Object.keys(bank.reasons || defaultReasons));
    return events.map(e=>{
      const q=questions.get(e?.questionId);
      if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(e.id)||ids.has(e.id)||!q||e.bankVersion!==bank.version||!q.options.some(o=>o[0]===e.selected)||!['sure','unsure','guess'].includes(e.confidence)||typeof e.hint!=='boolean'||!['practice','retry','delayed'].includes(e.mode)||!Number.isFinite(e.at)||e.at<Date.UTC(2026,0,1)||e.at>Date.now()+300000||!Number.isInteger(e.activeMs)||e.activeMs<0||e.activeMs>120000||!reasons.has(e.reason||'unknown'))throw Error('이 체험의 기록 형식·문항 버전과 맞지 않습니다.');
      ids.add(e.id);
      return {id:e.id,bankVersion:bank.version,questionId:q.id,concept:q.concept,selected:e.selected,correct:e.selected===q.answer,confidence:e.confidence,hint:e.hint,mode:e.mode,at:e.at,activeMs:e.activeMs,reason:e.reason||'unknown'};
    }).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  }
  function validSession(saved, bank, events) {
    const questions = new Map(allQuestions(bank).map(q => [q.id, q]));
    if (!saved || !Array.isArray(saved.queue) || !saved.queue.length || saved.queue.length > questions.size ||
        new Set(saved.queue).size !== saved.queue.length || !saved.queue.every(id => questions.has(id)) ||
        !Number.isInteger(saved.index) || saved.index < 0 || saved.index > saved.queue.length ||
        !['practice', 'retry'].includes(saved.mode) || !Array.isArray(saved.eventIds)) return null;

    const questionId = saved.queue[saved.index];
    const question = questions.get(questionId);
    const attempts = new Map(events.map(event => [event.id, event]));
    return {
      queue: saved.queue,
      index: saved.index,
      mode: saved.mode,
      eventIds: saved.eventIds.filter(id => attempts.has(id)),
      selected: question?.options.some(option => option[0] === saved.selected) ? saved.selected : null,
      confidence: ['sure', 'unsure', 'guess'].includes(saved.confidence) ? saved.confidence : null,
      hint: Boolean(saved.hint),
      answered: question && attempts.get(saved.answered)?.questionId === questionId ? saved.answered : null,
    };
  }
  function readRecord(raw, bank) {
    if (raw === null) return null;
    const saved = JSON.parse(raw);
    if (saved?.schemaVersion !== 1 || saved.bankVersion !== bank.version) throw Error('저장된 학습 기록의 버전과 맞지 않습니다.');
    const events = validateEvents(saved.events, bank);
    return {
      events,
      session: validSession(saved.session, bank, events),
      theme: saved.theme === 'light' ? 'light' : 'dark',
    };
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
    const basicIds = new Set(bank.questions.map(q => q.id));
    const first=firsts(events.filter(e => basicIds.has(e.questionId))),today=first.filter(e=>day(e.at)===day(now)),unaided=first.filter(e=>!e.hint),success=unaided.filter(e=>e.correct);
    const conceptStats=bank.concepts.map(c=>{const rows=first.filter(e=>e.concept===c.id),alone=rows.filter(e=>!e.hint);return {...c,total:rows.length,attempts:alone.length,correct:alone.filter(e=>e.correct).length,wrong:rows.filter(e=>!e.correct).length,uncertain:rows.filter(e=>e.correct&&e.confidence!=='sure').length,hints:rows.filter(e=>e.hint).length,small:alone.length<8};});
    const reviewed=allQuestions(bank).map(q=>({q,...recovery(events,q.id,now)}));
    return {first,today,unaided,success,concepts:conceptStats,reviewed,repaired:reviewed.filter(r=>r.status==='checked').length,needs:reviewed.filter(r=>r.status==='needs'||r.status==='waiting')};
  }
  function reviewTargets(rows, bank) {
    const latest = new Map(rows.map(row => [row.questionId, row]));
    const targets = [];
    for (const question of allQuestions(bank)) {
      const attempt = latest.get(question.id);
      if (attempt && (!attempt.correct || attempt.confidence !== 'sure')) {
        targets.push({question, kind: attempt.correct ? 'uncertain' : 'wrong'});
      }
    }
    return targets;
  }
  function followupQueue(ids, bank) {
    const selected = new Set(ids);
    const concepts = new Set(allQuestions(bank).filter(q => selected.has(q.id)).map(q => q.concept));
    const practice = [...(bank.followups || []), ...bank.questions];
    return [...concepts].map(concept => {
      const matches = practice.filter(q => q.concept === concept);
      return (matches.find(q => !selected.has(q.id)) || matches[0]).id;
    });
  }
  const api={day,storageKey,readRecord,validateEvents,firsts,recovery,stats,defaultReasons,allQuestions,reviewTargets,followupQueue};root.StudyCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
