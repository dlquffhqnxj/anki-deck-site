(() => {
  'use strict';

  const reasons = {
    reading: '읽기',
    meaning: '뜻',
    shape: '한자 모양',
    form: '활용',
    context: '문맥'
  };

  function render(main, deck, esc, detailUrl) {
    document.title = `${deck.title} 3문항 학습 체험 · Anki 덱 라이브러리`;
    const questions = deck.trial;
    const storagePrefix = `anki-quick-study:v1:${deck.id}:`;
    const sessionId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const recorded = [];
    let queue = questions;
    let position = 0;
    let round = 0;
    let attempt = null;
    let roundResults = [];
    let firstResults = [];

    main.innerHTML = `
      <a class="back" href="${detailUrl}">덱 상세로 돌아가기</a>
      <header class="trial-heading"><p class="trial-deck">${esc(deck.title)} · ${esc(deck.version)}</p><h1>3문항 학습 체험</h1></header>
      <div class="trial" id="trial-content"></div>
      <p class="scope">체험 중 남긴 혼동 이유는 이 브라우저에 저장됩니다.</p>`;
    const content = main.querySelector('#trial-content');

    function showCard(moveFocus = false) {
      const q = queue[position];
      const checked = attempt?.checked;
      const answered = typeof attempt?.correct === 'boolean';
      content.innerHTML = `
        <section class="panel trial-card" aria-labelledby="trial-question">
          <div class="trial-progress">
            <span>${round ? '오답 재도전' : esc(q.type)}</span>
            <strong>${position + 1} / ${queue.length}</strong>
            <progress aria-label="풀이 진행" value="${position + 1}" max="${queue.length}"></progress>
          </div>
          <h2 id="trial-question" tabindex="-1">${esc(q.prompt)}</h2>
          <p class="trial-japanese" lang="ja">${esc(q.display)}</p>
          ${q.hint ? `<p class="scope">${esc(q.hint)}</p>` : ''}
          ${q.options ? `<div class="trial-options" role="group" aria-label="답 선택">${q.options.map((option, i) => {
            const state = checked && option === q.answer ? 'correct-choice' : attempt?.selected === i ? 'wrong-choice' : '';
            const status = state === 'correct-choice' ? '<small>정답</small>' : state === 'wrong-choice' ? '<small>내 선택 · 오답</small>' : '';
            return `<button type="button" class="button ${state}" data-action="choose" data-index="${i}" ${checked ? 'disabled' : ''}><span lang="ja">${esc(option)}</span>${status}</button>`;
          }).join('')}</div>` : ''}
          ${checked ? `<div class="trial-answer" id="trial-feedback" tabindex="-1"><strong>${answered ? (attempt.correct ? '맞혔어요' : '다시 확인해요') : '정답'} · ${esc(q.answer)}</strong><p>${esc(q.explanation)}</p></div>` : ''}
          ${answered ? `<label class="trial-reason">헷갈린 부분 <span>선택 사항</span><select id="trial-reason" aria-label="헷갈린 부분"><option value="">기록하지 않음</option>${Object.entries(reasons).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label>` : ''}
        </section>
        <div class="trial-controls">
          ${!checked && !q.options ? '<button type="button" class="button primary" data-action="reveal">정답 보기</button>' : ''}
          ${checked && !answered ? '<button type="button" class="button" data-action="grade" data-correct="false">틀렸어요</button><button type="button" class="button primary" data-action="grade" data-correct="true">맞혔어요</button>' : ''}
          ${answered ? `<button type="button" class="button primary" data-action="next">${position + 1 === queue.length ? '결과 보기' : '다음 문제'}</button>` : ''}
        </div>`;
      if (moveFocus) content.querySelector(checked ? '#trial-feedback' : '#trial-question').focus();
    }

    function record(q, reason) {
      if (!Object.hasOwn(reasons, reason)) return;
      const key = storagePrefix + sessionId + ':' + round + ':' + q.id;
      recorded.push({key, reason});
      try {
        localStorage.setItem(key, reason);
      } catch {
        // The active trial still works where browser storage is unavailable.
      }
    }

    function reasonCounts() {
      const all = new Map(recorded.map(({key, reason}) => [key, reason]));
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(storagePrefix)) all.set(key, localStorage.getItem(key));
        }
      } catch {
        // Show the reasons collected in this session.
      }
      const counts = Object.fromEntries(Object.keys(reasons).map(key => [key, 0]));
      for (const reason of all.values()) {
        if (Object.hasOwn(counts, reason)) counts[reason]++;
      }
      return counts;
    }

    function showResults() {
      const firstCorrect = firstResults.filter(r => r.correct).length;
      const correct = roundResults.filter(r => r.correct).length;
      const misses = roundResults.filter(r => !r.correct);
      const counts = reasonCounts();
      const most = Math.max(...Object.values(counts));
      const leading = Object.keys(counts).filter(key => counts[key] === most).map(key => reasons[key]);
      content.innerHTML = `
        <section class="panel trial-card trial-results">
          <h2 id="trial-result-title" tabindex="-1">${round ? '오답 재도전 결과' : '체험 결과'}</h2>
          <dl class="trial-metrics">
            <div><dt>첫 풀이</dt><dd>${firstCorrect} / ${questions.length}</dd></div>
            ${round ? `<div><dt>이번 재도전</dt><dd>${correct} / ${queue.length}</dd></div>` : ''}
            <div><dt>가장 자주 남긴 혼동 이유</dt><dd>${most ? `${leading.join(' · ')}${leading.length > 1 ? ' 각' : ''} ${most}회` : '기록 없음'}</dd></div>
          </dl>
          ${misses.length ? `<p class="scope">다시 풀 카드 · ${misses.map(r => esc(r.question.type)).join(' · ')}</p>` : '<p class="scope">이번 풀이에서 틀린 문제가 없습니다.</p>'}
          <div class="detail-actions">
            ${misses.length ? `<button class="button primary" data-action="retry">오답 ${misses.length}개 다시 풀기</button>` : ''}
            <button class="button" data-action="restart">처음부터 풀기</button>
            <a class="button ${misses.length ? '' : 'primary'}" href="${detailUrl}#install">설치·업데이트 안내</a>
          </div>
        </section>`;
      content.querySelector('#trial-result-title').focus();
    }

    content.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const q = queue[position];
      switch (button.dataset.action) {
        case 'choose': {
          if (attempt) return;
          const selected = Number(button.dataset.index);
          attempt = {checked: true, selected, correct: q.options[selected] === q.answer};
          break;
        }
        case 'reveal':
          attempt = {checked: true};
          break;
        case 'grade':
          attempt.correct = button.dataset.correct === 'true';
          break;
        case 'next': {
          record(q, content.querySelector('#trial-reason').value);
          roundResults.push({question:q, correct:attempt.correct});
          if (!round) firstResults = roundResults;
          position++;
          attempt = null;
          if (position === queue.length) {
            showResults();
            return;
          }
          break;
        }
        case 'retry':
          queue = roundResults.filter(result => !result.correct).map(result => result.question);
          round++;
          position = 0;
          attempt = null;
          roundResults = [];
          break;
        case 'restart':
          window.location.reload();
          return;
      }
      showCard(true);
    });
    showCard();
  }

  window.LibraryTrial = {render};
})();
