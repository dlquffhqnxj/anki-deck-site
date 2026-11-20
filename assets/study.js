(() => {
  'use strict';
  const courses = window.STUDY_COURSES;
  const params = new URLSearchParams(location.search);
  const subject = params.get('subject');
  const bank = courses.find(course => course.id === subject) || courses[0];
  const core = window.StudyCore;
  const main = document.querySelector('#main');
  const KEY = core.storageKey(bank.id);
  const questions = new Map(core.allQuestions(bank).map(q => [q.id, q]));
  const questionNumbers = new Map(bank.questions.map((q, index) => [q.id, index + 1]));
  const concepts = new Map(bank.concepts.map(concept => [concept.id, concept]));
  const reasons = bank.reasons || core.defaultReasons;
  const basicCount = bank.questions.length;
  document.title = bank.name + ' 학습 체험 · Anki LAB';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let view = params.get('view') === 'review' ? 'progress' : 'practice';
  let events=[],session=null,theme='light',period='all',storageOK=true,notice='',clock=performance.now(),activeMs=0;
  function load() {
    try {
      const saved = core.readRecord(localStorage.getItem(KEY), bank);
      if (saved) ({events, theme, session} = saved);
    } catch {
      storageOK = false;
      notice = '저장된 기록을 읽지 못했습니다. 기존 저장값은 덮어쓰지 않습니다. 새 체험 기록은 백업으로 보관해 주세요.';
    }
  }
  function persist(){
    if(!storageOK)return;
    try{
      const saved = core.readRecord(localStorage.getItem(KEY), bank);
      if (saved) {
        const merged = new Map(saved.events.map(e => [e.id, e]));
        events.forEach(e => merged.set(e.id, e));
        events = core.validateEvents([...merged.values()], bank);
      }
      localStorage.setItem(KEY,JSON.stringify({schemaVersion:1,bankVersion:bank.version,events,session,theme}));
    }catch{storageOK=false;notice='브라우저에 저장하지 못했습니다. 이 창을 닫기 전에 기록 백업을 받아 주세요.';}
  }
  function setView(next) {
    view = next;
    if (next !== 'progress') {
      const url = new URL(location.href);
      if (url.searchParams.get('view') === 'review') {
        url.searchParams.delete('view');
        history.replaceState(history.state, '', url);
      }
    }
  }
  function newSession(mode, queue = bank.questions.map(q => q.id)) {
    return {queue, index: 0, mode, eventIds: [], selected: null, confidence: null, hint: false, answered: null};
  }
  function ensureSession() {
    if (session) return;
    session = newSession('practice');
    persist();
  }
  function start(mode = 'practice', ids) {
    if (ids?.length === 0) return;
    session = newSession(mode, ids);
    setView('practice');
    activeMs = 0;
    clock = performance.now();
    persist();
    render('question-title');
  }
  function current(){return session&&questions.get(session.queue[session.index]);}
  function snapshot(){return core.stats(events,bank);}
  function retry(concept){const s=snapshot();let ids=s.needs.filter(r=>!concept||r.q.concept===concept).map(r=>r.q.id);if(!ids.length&&concept)ids=bank.questions.filter(q=>q.concept===concept).map(q=>q.id);start('retry',ids);}
  function formatRate(rows){return rows.length?Math.round(rows.filter(e=>e.correct).length/rows.length*100)+'%':'—';}
  const label={sure:'확신해요',unsure:'헷갈려요',guess:'추측이에요'};
  function questionLabel(q) {
    return questionNumbers.has(q.id) ? '문제 ' + questionNumbers.get(q.id) : '추가 문제';
  }
  function relatedDeckLink() {
    const deck = bank.relatedDeck;
    return `<a class="lab-button secondary" href="deck.html?id=${encodeURIComponent(deck.id)}">${esc(deck.name)} 보기</a>`;
  }
  function header() {
    return `<div class="lab-heading">
      <div><h1>${esc(bank.name)} 학습 체험</h1><p>기본 ${basicCount}문제를 풀고, 정답 해설과 복습할 문제를 확인하세요.</p></div>
      <button class="lab-icon-button" data-action="theme" aria-label="${theme==='dark'?'밝은 화면으로':'어두운 화면으로'}">${theme==='dark'?'라이트 모드':'다크 모드'}</button>
    </div>
    <nav class="lab-subjects" aria-label="학습 과목">
      ${courses.map(course => {
        const url = course.id === 'japanese' ? 'study.html' : 'study.html?subject=' + encodeURIComponent(course.id);
        return `<a href="${url}"${course.id === bank.id ? ' aria-current="page"' : ''}>${esc(course.name)}</a>`;
      }).join('')}
    </nav>
    <div class="lab-notice"><p>체험 기록은 <strong>이 브라우저에 과목별로 저장</strong>됩니다. 다른 기기로 옮길 때는 백업을 이용하세요.</p></div>
    <div class="lab-tabs" role="group" aria-label="학습 체험 화면">
      ${[['practice','문제 풀이'],['progress','성장 기록']].map(([key,text])=>`<button data-view="${key}" aria-pressed="${view===key}">${text}</button>`).join('')}
    </div>
    ${notice ? `<p class="lab-alert" role="status">${esc(notice)}</p>` : ''}`;
  }
  function sidebar(s) {
    const today = s.today.length;
    const percent = Math.round(today / basicCount * 100);
    const finished = today === basicCount;

    return `<aside class="lab-aside">
      <section class="mission-card">
        <h2>오늘의 기본 문제</h2>
        <div class="mission-total"><strong>${today}<span> / ${basicCount}</span></strong><span class="mission-stamp">${finished ? '완료' : '진행 중'}</span></div>
        <div class="mission-track" role="progressbar" aria-label="오늘 푼 기본 문제" aria-valuenow="${today}" aria-valuemin="0" aria-valuemax="${basicCount}"><i style="width:${percent}%"></i></div>
        <p>${finished ? '한 세트를 마쳤습니다. 복습할 문제를 골라 보세요.' : `기본 문제 ${basicCount}개를 풀어 한 세트를 완성하세요.`}</p>
        <span class="lab-caption">한국 시간 기준 · 기본 문항별 하루 첫 풀이</span>
      </section>
      <section class="skill-card">
        <div class="lab-section-title"><h2>이번 훈련의 개념</h2></div>
        ${s.concepts.map(c => `<div class="concept-row"><div><strong>${esc(c.label)}</strong><p>${c.total ? `${c.total}회 관찰 · 첫 풀이 오답 ${c.wrong}회` : '아직 풀이 기록 없음'}</p></div></div>`).join('')}
        <button class="lab-button secondary full" data-action="retry" ${s.needs.length ? '' : 'disabled'}>오답부터 다시 풀기${s.needs.length ? ' · ' + s.needs.length + '문제' : ''}</button>
        <p class="lab-caption">재도전 결과는 첫 풀이 성적과 따로 봅니다.</p>
      </section>
      <div class="lab-save"><div>
        <strong>${storageOK ? '기기 안에 기록 중' : '이 창에서 임시 기록 중'}</strong>
        <p>백업 파일은 다른 기기의 같은 과목에서 불러올 수 있습니다.</p>
        <button class="lab-text-button" data-action="export">기록 백업</button> ·
        <label class="lab-text-button file-label">백업 불러오기<input type="file" id="restore-file" accept="application/json,.json"></label>
      </div></div>
    </aside>`;
  }
  function practice(s) {
    const q = current();
    if (!q) return completion(s);
    const c = concepts.get(q.concept);
    const answer = events.find(e => e.id === session.answered);
    const sessionLabel = !questionNumbers.has(q.id) ? '개념 추가 문제'
      : session.mode === 'retry' ? '약점 재도전' : '기본 훈련';
    const sentence = esc(q.sentence).replace('（　）', '<span class="sentence-gap">&nbsp;?&nbsp;</span>')
      .replace('_____', '<span class="sentence-gap">_____</span>');

    return `<div class="lab-workspace">
      <section class="question-panel">
        <div class="question-top"><span class="lab-tag">${sessionLabel}</span><span class="question-count">${String(session.index + 1).padStart(2, '0')} <span>/ ${String(session.queue.length).padStart(2, '0')}</span></span></div>
        <div class="question-progress" aria-hidden="true">${session.queue.map((_, i) => `<i class="${i < session.index ? 'done' : i === session.index ? 'current' : ''}"></i>`).join('')}</div>
        <p class="concept-label">${esc(c.label)} · ${esc(q.type)}</p>
        <h2 id="question-title" tabindex="-1">${esc(q.prompt)}</h2>
        <p class="lab-question-text" lang="${bank.language}">${sentence}</p>
        <div class="answer-options" role="group" aria-label="답 선택">
          ${q.options.map(([id, text]) => {
            const state = !answer ? '' : id === q.answer ? 'correct' : id === answer.selected ? 'wrong' : 'muted';
            const verdict = state === 'correct' ? '정답' : state === 'wrong' ? '내 선택 · 오답' : '';
            return `<button id="option-${id}" class="answer-option ${state}" data-option="${id}" aria-pressed="${(answer?.selected || session.selected) === id}" ${answer ? 'disabled' : ''}>
              <span class="option-letter">${id.toUpperCase()}</span><span lang="${bank.language}">${esc(text)}</span>
              ${verdict ? `<span class="option-verdict">${verdict}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
        ${answer ? feedback(q, c, answer) : `
          <div class="confidence"><p>답에 얼마나 확신이 있나요?</p><div role="group" aria-label="확신 정도">
            ${Object.entries(label).map(([id, text]) => `<button id="confidence-${id}" data-confidence="${id}" aria-pressed="${session.confidence === id}">${text}</button>`).join('')}
          </div></div>
          <div class="question-tools"><button class="lab-text-button" data-action="hint" ${session.hint ? 'disabled' : ''}>${session.hint ? '힌트 사용 중' : '힌트 보기'}</button><span>답과 확신 정도를 고른 뒤 확인하세요.</span></div>
          ${session.hint ? `<div class="hint-box">${esc(q.hint)}<p>힌트를 사용한 문항은 도움 없이 푼 정답률에서 제외합니다.</p></div>` : ''}
          <button class="lab-button primary full" data-action="submit" ${session.selected && session.confidence ? '' : 'disabled'}>정답 확인</button>`}
        <p class="trial-note">브라우저 학습 체험용 창작 연습문제</p>
      </section>
      ${sidebar(s)}
    </div>`;
  }
  function feedback(q, c, e) {
    const correctOption = q.options.find(option => option[0] === q.answer);
    const chosenOption = q.options.find(option => option[0] === e.selected);
    return `<div class="answer-feedback ${e.correct ? 'is-correct' : 'is-wrong'}">
      <p class="feedback-eyebrow">${e.correct ? '정답' : '오답'}</p>
      <h2 id="feedback-title" tabindex="-1"><span lang="${bank.language}">${q.answer.toUpperCase()}. ${esc(correctOption[1])}</span></h2>
      <p>${esc(q.solution || q.translation)}</p>
      ${!q.solution ? `<p class="translation">${esc(correctOption[2])}</p>` : ''}
      ${e.correct ? '' : `<p class="chosen-explanation"><strong>내가 고른 답 · <span lang="${bank.language}">${e.selected.toUpperCase()}. ${esc(chosenOption[1])}</span></strong><br>${esc(chosenOption[2])}</p>`}
      <div class="rule-box"><span>기억할 기준</span><strong>${esc(c.rule)}</strong></div>
      <details class="option-reasons"><summary>선택지별 이유 보기</summary>
        ${q.options.map(([id, text, why]) => `<p><strong lang="${bank.language}">${id.toUpperCase()}. ${esc(text)}</strong><br>${esc(why)}</p>`).join('')}
      </details>
      ${!e.correct ? `<label class="error-label">어디서 막혔나요? <span>선택 사항 · 직접 판단</span><select id="error-reason">
        ${Object.entries(reasons).map(([id, text]) => `<option value="${id}" ${e.reason === id ? 'selected' : ''}>${text}</option>`).join('')}
      </select></label>` : ''}
      <p class="feedback-record">${e.mode === 'delayed' ? '24시간 이후 재확인' : e.mode === 'retry' ? '재도전' : '풀이'} 기록됨 · ${esc(label[e.confidence])}${e.hint ? ' · 힌트 사용' : ''}</p>
    </div>
    <button class="lab-button primary full" data-action="next">${session.index === session.queue.length - 1 ? '세트 마치기' : '다음 문제'}</button>`;
  }
  function reviewPanel(rows) {
    const targets = core.reviewTargets(rows, bank);
    if (!targets.length) return '';
    const wrongCount = targets.filter(target => target.kind === 'wrong').length;
    return `<form class="review-panel" aria-labelledby="review-title">
      <h3 id="review-title" tabindex="-1">헷갈린 문제 다시 풀기</h3>
      <p class="review-counts"><span>오답 <strong>${wrongCount}개</strong></span><span>확신이 낮았던 정답 <strong>${targets.length - wrongCount}개</strong></span></p>
      <fieldset>
        <legend>다시 풀 문항 선택</legend>
        ${targets.map(({question: q, kind}) => `<label class="review-row">
          <input type="checkbox" name="question" value="${esc(q.id)}" checked>
          <span class="review-question"><strong>${questionLabel(q)} · ${esc(concepts.get(q.concept).label)}</strong><span lang="${bank.language}">${esc(q.sentence)}</span></span>
          <span class="review-status ${kind}">${kind === 'wrong' ? '오답' : '헷갈린 정답'}</span>
        </label>`).join('')}
      </fieldset>
      <div class="review-actions">
        <button type="submit" class="lab-button primary" value="selected">선택한 문제 다시 풀기</button>
        ${bank.followups?.length ? '<button type="submit" class="lab-button secondary" value="related">같은 개념의 추가 문제 풀기</button>' : ''}
        ${relatedDeckLink()}
      </div>
    </form>`;
  }
  function completion(s) {
    const attempts = new Map(events.map(e => [e.id, e]));
    const rows = (session?.eventIds || []).map(id => attempts.get(id)).filter(Boolean);
    return `<div class="lab-workspace">
      <section class="question-panel completion">
        <h2 id="completion-title" tabindex="-1">세트 풀이 결과</h2>
        <p class="completion-score">${rows.filter(e => e.correct).length}<span> / ${rows.length} 정답</span></p>
        ${reviewPanel(rows) || '<p>이번 세트에서 오답과 헷갈린 정답이 없었습니다.</p>'}
        <div class="completion-actions">
          <button class="lab-button secondary" data-view="progress">결과 분석 보기</button>
          <button class="lab-text-button" data-action="restart">기본 ${basicCount}문제 다시 풀기</button>
        </div>
        <p class="lab-caption">세트 정답 수에는 힌트 사용이 포함됩니다.</p>
        ${ankiReviewHelp()}
      </section>
      ${sidebar(s)}
    </div>`;
  }
  function progress() {
    const weekStart = core.day(Date.now() - 6 * 86400000);
    const filtered = events.filter(e => period === 'all' || core.day(e.at) >= weekStart);
    const stats = core.stats(filtered, bank);
    const all = snapshot();
    const uncertain = stats.first.filter(e => e.correct && e.confidence !== 'sure').length;
    const weakness = [...stats.concepts].sort((a, b) => b.wrong - a.wrong || b.uncertain - a.uncertain);
    const top = weakness.find(c => c.wrong > 0 || c.uncertain > 0);
    const recent = filtered.slice(-20).reverse();
    const review = reviewPanel(filtered);
    const recoveryRows = all.reviewed.filter(row => row.status !== 'none');

    return `<section class="progress-view">
      <div class="lab-section-title">
        <div><h2 id="progress-title" tabindex="-1">풀이 결과</h2></div>
        <div class="period-controls" role="group" aria-label="기록 기간">
          <button data-period="all" aria-pressed="${period === 'all'}">전체</button>
          <button data-period="week" aria-pressed="${period === 'week'}">최근 7일</button>
        </div>
      </div>
      <div class="metrics-grid">
        <article class="metric"><span>도움 없이 첫 풀이</span><strong>${formatRate(stats.unaided)}</strong><p>${stats.success.length} / ${stats.unaided.length}회 정답 · 힌트 제외</p></article>
        <article class="metric"><span>맞혔지만 불확실</span><strong>${uncertain}<small>회</small></strong><p>기본 문항의 첫 풀이에서 ‘헷갈림·추측’ 정답</p></article>
        <article class="metric"><span>24시간 후 재확인 통과</span><strong>${all.repaired}<small>문제</small></strong><p>전체 기록 · 최근 오답 후 힌트 없이 정답</p></article>
      </div>
      ${review ? `<div class="skill-card review-progress">${review}</div>` : ''}
      ${filtered.length ? ankiReviewHelp() : ''}
      ${filtered.length ? '' : `<div class="progress-empty"><h3>풀이 기록이 없습니다</h3><p>문제를 풀면 여기에서 개념별 오답과 보완할 내용을 볼 수 있습니다.</p><button class="lab-button primary" data-view="practice">문제 풀러 가기</button></div>`}
      <div class="analysis-grid">
        <section class="skill-card">
          <div class="lab-section-title"><h3>개념별 관찰 기록</h3><span>오답 많은 순</span></div>
          ${weakness.map(c => {
            const rate = c.attempts ? Math.round(c.correct / c.attempts * 100) : 0;
            return `<div class="weakness-row">
              <div><strong>${esc(c.label)}</strong><span>${c.attempts ? rate + '%' : '아직 기록 없음'}</span></div>
              <div class="concept-track"><i style="width:${rate}%"></i></div>
              <p>도움 없이 ${c.correct}/${c.attempts}회 · 첫 풀이 오답 ${c.wrong}회 · 힌트 ${c.hints}회</p>
              <span class="sample-note">${c.small ? '관찰 중 · 도움 없는 첫 풀이 8회 미만' : '기본 연습문제의 풀이 결과'}</span>
            </div>`;
          }).join('')}
        </section>
        <section class="recommendation">
          <h3>${top ? esc(top.label) + '부터 다시' : '한 번에 한 개념씩'}</h3>
          <p>${top ? esc(top.action) : '첫 풀이 결과가 쌓이면 오답이 많거나 확신이 낮은 개념부터 제안합니다.'}</p>
          ${top ? `<button class="lab-button primary" data-concept="${esc(top.id)}">이 개념 집중 연습</button>` : ''}
          <div class="recovery-list">
            <h4>오답 보완 상태 · 전체 기록</h4>
            ${recoveryRows.map(row => {
              const status = row.status === 'checked' ? '24시간 후 통과'
                : row.status === 'waiting' ? (row.due ? '다시 확인할 시간' : '바로 고침 · 재확인 대기')
                : '다시 풀기 필요';
              return `<p><span>${questionLabel(row.q)} · ${esc(concepts.get(row.q.concept).label)}</span><strong>${status}</strong></p>`;
            }).join('') || '<p>아직 오답 기록이 없습니다.</p>'}
          </div>
        </section>
      </div>
      <section class="skill-card reason-summary">
        <h3>내가 남긴 오답 이유</h3>
        <div class="reason-counts">${Object.entries(reasons).map(([id, text]) => `<span>${esc(text)}<strong>${filtered.filter(e => !e.correct && e.reason === id).length}</strong></span>`).join('')}</div>
        <p class="lab-caption">재도전에서 틀린 횟수도 포함합니다. 오답 이유는 본인이 표시합니다.</p>
      </section>
      <details class="metric-rules">
        <summary>숫자는 어떻게 계산하나요?</summary>
        <ul>
          <li>첫 풀이는 기본 문항별로 한국 날짜 기준 첫 번째 제출을 집계합니다.</li>
          <li>도움 없이 푼 정답률을 구할 때는 힌트를 본 제출을 분모와 분자에서 제외합니다. 확신 정도는 별도로 기록합니다.</li>
          <li>헷갈린 문제는 조회 기간의 최근 풀이가 오답이거나 ‘헷갈려요·추측이에요’를 고른 정답입니다.</li>
          <li>24시간 후 재확인은 마지막 오답으로부터 24시간 이상 지난 후 힌트 없이 맞힌 문항입니다.</li>
          <li>개념당 도움 없는 첫 풀이 8회 미만은 ‘관찰 중’으로 표시합니다. 8회는 이 체험의 표시 기준입니다.</li>
        </ul>
      </details>
      <section class="history-panel">
        <h3>최근 풀이</h3>
        <div class="lab-table-wrap"><table>
          <thead><tr><th>한국 시간</th><th>문제·개념</th><th>결과</th><th>풀이 방식</th><th>확신</th></tr></thead>
          <tbody>${recent.map(e => {
            const date = new Date(e.at).toLocaleString('ko-KR', {timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
            const mode = e.mode === 'practice' ? '기본 훈련' : e.mode === 'delayed' ? '24시간 후 재확인' : '재도전';
            return `<tr><td>${esc(date)}</td><td>${questionLabel(questions.get(e.questionId))} · ${esc(concepts.get(e.concept).label)}</td><td>${e.correct ? '정답' : '오답'}${e.hint ? ' · 힌트' : ''}</td><td>${mode}</td><td>${esc(label[e.confidence])}</td></tr>`;
          }).join('') || '<tr><td colspan="5">풀이 기록이 없습니다.</td></tr>'}</tbody>
        </table></div>
        <p class="lab-caption">최근 20회 표시 · 이 과목의 전체 기록은 백업 파일에 포함됩니다.</p>
      </section>
      <div class="backup-bar">
        <div><h3>기록을 이어가세요</h3><p>브라우저 데이터를 지우면 기록이 사라집니다. 백업은 다른 기기의 같은 과목에서 불러올 수 있습니다.</p></div>
        <button class="lab-button secondary" data-action="export">기록 백업</button>
        <label class="lab-button secondary file-label">백업 불러오기<input type="file" id="restore-file" accept="application/json,.json"></label>
      </div>
    </section>`;
  }
  function ankiReviewHelp() {
    return `<details class="anki-review-help">
      <summary>Anki에서 복습할 카드 찾기</summary>
      <p>PC Anki의 탐색 창에서 덱을 선택한 뒤, 기존 검색 조건에 아래 검색어 중 하나를 공백으로 이어 붙이세요.</p>
      <dl class="anki-searches">
        <div><dt><code>rated:7:1</code></dt><dd>최근 7일 동안 ‘다시’를 누른 카드</dd></div>
        <div><dt><code>prop:lapses&gt;3</code></dt><dd>복습 중 4회 이상 잊은 카드</dd></div>
      </dl>
      <p>틀리거나 떠올리지 못했다면 ‘다시’, 맞혔지만 망설였다면 ‘어려움’을 누르세요.</p>
      <p><a href="https://docs.ankiweb.net/manual/searching" target="_blank" rel="noopener noreferrer">Anki 검색 도움말</a></p>
    </details>`;
  }
  function render(focusId) {
    document.body.dataset.labTheme = theme;
    const content = view === 'practice' ? practice(snapshot()) : progress();
    main.innerHTML = `<div class="study-shell">${header()}${content}</div>`;
    const target = focusId && (document.getElementById(focusId) || document.getElementById('progress-title'));
    if (target) target.focus({preventScroll: target.tagName === 'BUTTON'});
  }
  function submit(){
    const q=current();if(!q||session.answered||!session.selected||!session.confidence)return;
    if(events.length>=20000){notice='체험 기록 한도에 도달했습니다. 전체 기록을 백업해 주세요.';render();return;}
    const at=Date.now(),previous=core.recovery(events,q.id,at),mode=previous.wrong&&at-previous.wrong.at>=86400000?'delayed':session.mode;
    const e={id:uid(),bankVersion:bank.version,questionId:q.id,concept:q.concept,selected:session.selected,correct:session.selected===q.answer,confidence:session.confidence,hint:session.hint,mode,at,activeMs:Math.min(120000,Math.max(0,Math.round(activeMs+(document.hidden?0:performance.now()-clock)))),reason:'unknown'};
    events.push(e);session.answered=e.id;session.eventIds.push(e.id);persist();render('feedback-title');
  }
  function exportFile(){
    const blob=new Blob([JSON.stringify({schemaVersion:1,bankVersion:bank.version,exportedAt:new Date().toISOString(),scope:'design-trial-only',events},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='anki-design-records-'+bank.id+'-'+core.day(Date.now())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice=bank.name+' 체험 기록 백업을 만들었습니다.';render();
  }
  main.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.view){setView(b.dataset.view);notice='';render(b.closest('.completion') ? 'progress-title' : undefined);return;}
    if(b.dataset.period){period=b.dataset.period;render();return;}
    if(b.dataset.option){if(session.answered)return;session.selected=b.dataset.option;persist();render(b.id);return;}
    if(b.dataset.confidence){if(session.answered)return;session.confidence=b.dataset.confidence;persist();render(b.id);return;}
    if(b.dataset.concept){retry(b.dataset.concept);return;}
    switch(b.dataset.action){
      case 'theme':theme=theme==='dark'?'light':'dark';persist();render();break;
      case 'hint':if(!session.answered){session.hint=true;persist();render();}break;
      case 'submit':submit();break;
      case 'next':
        if (!session.answered) return;
        session.index++;
        session.selected = null;
        session.confidence = null;
        session.hint = false;
        session.answered = null;
        activeMs = 0;
        clock = performance.now();
        persist();
        render(current() ? 'question-title' : 'completion-title');
        break;
      case 'retry':retry();break;
      case 'restart':start();break;
      case 'export':exportFile();break;
    }
  });
  main.addEventListener('submit', e => {
    if (!e.target.matches('.review-panel')) return;
    e.preventDefault();
    const ids = new FormData(e.target).getAll('question').filter(id => questions.has(id));
    const queue = e.submitter?.value === 'related' ? core.followupQueue(ids, bank) : ids;
    start('retry', queue);
  });
  main.addEventListener('change',async e=>{
    if (e.target.matches('.review-panel input[name="question"]')) {
      const form = e.target.form;
      const hasSelection = Boolean(form.querySelector('input[name="question"]:checked'));
      form.querySelectorAll('button[type="submit"]').forEach(button => { button.disabled = !hasSelection; });
      return;
    }
    if(e.target.id==='error-reason'){const row=events.find(x=>x.id===session.answered);if(row){row.reason=e.target.value;persist();}return;}
    if(e.target.id!=='restore-file'||!e.target.files[0])return;
    try{
      const f=e.target.files[0];if(f.size>8*1024*1024)throw Error('8 MB 이하의 체험 백업만 불러올 수 있습니다.');
      const x=JSON.parse(await f.text());if(x?.schemaVersion!==1||x.bankVersion!==bank.version||x.scope!=='design-trial-only')throw Error(bank.name+' 학습 체험 백업 파일을 골라 주세요.');
      const incoming=core.validateEvents(x.events,bank),merged=new Map(events.map(row=>[row.id,row]));let added=0;
      for(const row of incoming){if(merged.has(row.id)){const existing=merged.get(row.id);const fields=['questionId','selected','at','confidence','hint','mode','activeMs'];if(fields.some(k=>existing[k]!==row[k]))throw Error('같은 기록 ID의 내용이 달라 불러오기를 중단했습니다.');}else{merged.set(row.id,row);added++;}}
      const next=core.validateEvents([...merged.values()],bank);events=next;persist();notice=`기록 ${added}회를 추가했습니다. 중복 기록은 다시 넣지 않았습니다.`;view='progress';render();
    }catch(err){notice=err.message==='Unexpected end of JSON input'?'파일 내용을 읽을 수 없습니다.':(err instanceof SyntaxError?'올바른 JSON 백업이 아닙니다.':err.message);render();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)activeMs+=performance.now()-clock;else clock=performance.now();});
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !storageOK) return;
    load();
    if (storageOK) notice = '같은 브라우저의 다른 탭 기록을 반영했습니다.';
    ensureSession();
    render();
  });
  load();
  ensureSession();
  render(view === 'progress' ? 'review-title' : undefined);
})();
