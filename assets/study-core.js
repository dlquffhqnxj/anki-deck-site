/* Shared study record validation and measures. */
(function(root){
  'use strict';
  const day = timestamp => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
  const defaultReasons = {
    unknown: '아직 모르겠음', meaning: '뜻을 몰랐음', rule: '규칙을 혼동함',
    reading: '문장을 잘못 읽음', slip: '입력·선택 실수'
  };
  const practiceQuestions = bank => [...bank.questions, ...(bank.followups || [])];
  const allQuestions = bank => [...practiceQuestions(bank), ...(bank.retests || [])];
  const RETEST_INTERVAL = 7 * 86400000;
  function storageKey(subject, profile = 'default') {
    const previous = subject === 'japanese' ? 'anki-design-lab-v1' : 'anki-design-lab-v1-' + subject;
    return profile === 'default' ? previous : previous + ':profile:' + profile;
  }
  function validateEvents(events,bank) {
    if(!Array.isArray(events)||events.length>20000)throw Error('기록 개수 형식이 올바르지 않습니다.');
    const ids=new Set(),questions=new Map(allQuestions(bank).map(q=>[q.id,q]));
    const retestIds = new Set((bank.retests || []).map(q => q.id));
    const reasons = new Set(Object.keys(bank.reasons || defaultReasons));
    return events.map(e=>{
      const q=questions.get(e?.questionId);
      if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(e.id)||ids.has(e.id)||!q||e.bankVersion!==bank.version||!q.options.some(o=>o[0]===e.selected)||!['sure','unsure','guess'].includes(e.confidence)||typeof e.hint!=='boolean'||!['practice','retry','delayed','retest'].includes(e.mode)||!Number.isFinite(e.at)||e.at<Date.UTC(2026,0,1)||e.at>Date.now()+300000||!Number.isInteger(e.activeMs)||e.activeMs<0||e.activeMs>120000||!reasons.has(e.reason||'unknown'))throw Error('이 체험의 기록 형식·문항 버전과 맞지 않습니다.');
      if (retestIds.has(q.id) !== (e.mode === 'retest') ||
          (e.evidence !== undefined && !q.evidence?.options.some(([id]) => id === e.evidence))) {
        throw Error('재시험 또는 풀이 근거 기록이 해당 문항과 맞지 않습니다.');
      }
      ids.add(e.id);
      return {id:e.id,bankVersion:bank.version,questionId:q.id,concept:q.concept,selected:e.selected,correct:e.selected===q.answer,confidence:e.confidence,hint:e.hint,mode:e.mode,at:e.at,activeMs:e.activeMs,reason:e.reason||'unknown',...(e.evidence ? {evidence:e.evidence} : {})};
    }).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  }
  function validSession(saved, bank, events) {
    const questions = new Map(practiceQuestions(bank).map(q => [q.id, q]));
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
      ...(question?.evidence?.options.some(([id]) => id === saved.evidence) ? {evidence:saved.evidence} : {}),
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
    const reviewed=practiceQuestions(bank).map(q=>({q,...recovery(events,q.id,now)}));
    return {first,today,unaided,success,concepts:conceptStats,reviewed,repaired:reviewed.filter(r=>r.status==='checked').length,needs:reviewed.filter(r=>r.status==='needs'||r.status==='waiting')};
  }
  function reviewTargets(rows, bank) {
    const latest = new Map(rows.map(row => [row.questionId, row]));
    const targets = [];
    for (const question of practiceQuestions(bank)) {
      const attempt = latest.get(question.id);
      if (attempt && (!attempt.correct || attempt.confidence !== 'sure')) {
        targets.push({question, kind: attempt.correct ? 'uncertain' : 'wrong'});
      }
    }
    return targets;
  }
  function followupQueue(ids, bank) {
    const selected = new Set(ids);
    const concepts = new Set(practiceQuestions(bank).filter(q => selected.has(q.id)).map(q => q.concept));
    const practice = [...(bank.followups || []), ...bank.questions];
    return [...concepts].map(concept => {
      const matches = practice.filter(q => q.concept === concept);
      return (matches.find(q => !selected.has(q.id)) || matches[0]).id;
    });
  }
  function conceptPracticeQuestion(source, bank) {
    const variants = (bank.followups || []).filter(q => q.concept === source.concept && q.id !== source.id);
    return variants.find(q => q.type === source.type) || variants[0];
  }
  function retestPassed(attempt, question) {
    return attempt.correct && attempt.confidence === 'sure' && !attempt.hint &&
      (!attempt.evidence || attempt.evidence === question?.evidence?.answer);
  }
  function retestPlan(events, bank, now = Date.now()) {
    const variants = bank.retests || [];
    const byId = new Map(allQuestions(bank).map(question => [question.id, question]));
    const pending = new Map();
    const lastSeen = new Map();
    for (const attempt of events) {
      if (attempt.at > now) continue;
      const open = pending.get(attempt.concept);
      if (attempt.mode === 'retest') {
        lastSeen.set(attempt.questionId, attempt.at);
        if (!open || attempt.at < open.at + RETEST_INTERVAL) continue;
        if (retestPassed(attempt, byId.get(attempt.questionId))) pending.delete(attempt.concept);
        else pending.set(attempt.concept, attempt);
      } else if (!open && (!attempt.correct || attempt.confidence !== 'sure')) {
        pending.set(attempt.concept, attempt);
      }
    }
    return [...pending.values()].flatMap(anchor => {
      const type = byId.get(anchor.questionId)?.type;
      const [question] = variants.filter(q => q.concept === anchor.concept)
        .sort((a, b) => (lastSeen.get(a.id) || 0) - (lastSeen.get(b.id) || 0) ||
          Number(b.type === type) - Number(a.type === type));
      if (!question) return [];
      const dueAt = anchor.at + RETEST_INTERVAL;
      return [{concept: anchor.concept, anchorId: anchor.id, dueAt, due: now >= dueAt, question}];
    }).sort((a, b) => a.dueAt - b.dueAt);
  }
  function reasonPractice(events, bank, now = Date.now()) {
    const recent = new Map();
    for (const e of events) {
      if (!e.correct && e.reason && e.reason !== 'unknown' && e.at >= now - RETEST_INTERVAL && e.at <= now) {
        recent.set(day(e.at) + '|' + e.questionId, e);
      }
    }
    const groups = new Map();
    for (const e of recent.values()) {
      const group = groups.get(e.reason) || {reason:e.reason, count:0, confident:0};
      group.count++;
      if (e.confidence === 'sure') group.confident++;
      if (!group.last || e.at >= group.last.at) group.last = e;
      groups.set(e.reason, group);
    }
    const ordered = [...groups.values()].sort((a,b) =>
      b.count-a.count || b.confident-a.confident || b.last.at-a.last.at);
    const questions = allQuestions(bank);
    for (const group of ordered) {
      const source = questions.find(q => q.id === group.last.questionId);
      if (!source) continue;
      const focus = bank.reasonFocus?.[group.reason];
      const concept = bank.concepts.find(c => c.id === (focus?.concept || source.concept));
      if (!concept) continue;
      const question = conceptPracticeQuestion({id: source.id, concept: concept.id, type: source.type}, bank);
      if (question) return {reason:group.reason, count:group.count, concept, question, action:focus?.action || concept.action};
    }
    return null;
  }
  const api={day,storageKey,readRecord,validateEvents,firsts,recovery,stats,defaultReasons,allQuestions,reviewTargets,followupQueue,conceptPracticeQuestion,retestPassed,retestPlan,reasonPractice,RETEST_INTERVAL};root.StudyCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
