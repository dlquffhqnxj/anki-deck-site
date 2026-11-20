(() => {
  'use strict';
  const courses = window.STUDY_COURSES;
  const core = window.StudyCore;
  const grid = document.getElementById('study-home-courses');
  const profileId = window.StudyProfiles.current.id;
  const keys = new Set(courses.map(course => core.storageKey(course.id, profileId)));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

  function courseCard(course) {
    let summary = `기본 ${course.questions.length}문제`;
    let action = '학습 시작';
    let reviewCount = 0;
    let retestCount = 0;
    try {
      const record = core.readRecord(localStorage.getItem(core.storageKey(course.id, profileId)), course);
      if (record) {
        reviewCount = core.reviewTargets(record.events, course).length;
        retestCount = core.retestPlan(record.events, course).filter(item => item.due).length;
        const session = record.session;
        if (session) {
          const total = session.queue.length;
          const solved = session.index + Number(Boolean(session.answered));
          const set = session.mode === 'retry' ? '복습 세트' : '기본 세트';
          if (session.index === total) {
            summary = `${set} · ${total}문제 완료`;
            action = '세트 결과 보기';
          } else if (session.mode === 'retry' || solved || session.selected || session.confidence || session.hint) {
            summary = `${set} · ${solved}/${total}문제 풀이`;
            action = '이어 풀기';
          }
        }
      }
    } catch {
      summary = '저장된 풀이를 읽지 못했어요.';
    }

    const params = new URLSearchParams();
    if (course.id !== 'japanese') params.set('subject', course.id);
    const query = params.toString();
    const practiceUrl = query ? `study.html?${query}` : 'study.html';
    params.set('view', 'review');
    const reviewUrl = `study.html?${params}`;
    params.set('view', 'retest');
    const retestUrl = `study.html?${params}`;
    const name = escape(course.name);
    const reviewText = `복습할 문제 ${reviewCount}개`;
    return `<article class="study-home-card">
      <div><h2>${name}</h2><p>${summary}</p></div>
      <div class="study-home-actions">
        <a class="button primary" href="${escape(practiceUrl)}" aria-label="${name} ${action}">${action}</a>
        ${retestCount ? `<a class="button" href="${escape(retestUrl)}" aria-label="${name} 7일 재시험 ${retestCount}개">7일 재시험 ${retestCount}개</a>` : ''}
        ${reviewCount ? `<a class="button" href="${escape(reviewUrl)}" aria-label="${name} ${reviewText}">${reviewText}</a>` : ''}
      </div>
    </article>`;
  }

  function render() {
    grid.innerHTML = courses.map(courseCard).join('');
  }

  window.addEventListener('storage', event => {
    if (event.key === null || keys.has(event.key)) render();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) render();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  render();
})();
