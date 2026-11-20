(() => {
  'use strict';
  const courses = window.STUDY_COURSES;
  const core = window.StudyCore;
  const grid = document.getElementById('study-home-courses');
  const profileId = window.StudyProfiles.current.id;
  const keys = new Set(courses.map(course => core.storageKey(course.id, profileId)));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

  function courseStatus(course, now) {
    let summary = `기본 ${course.questions.length}문제`;
    let action = '학습 시작';
    let reviewCount = 0;
    let retestCount = 0;
    let events = [];
    try {
      const record = core.readRecord(localStorage.getItem(core.storageKey(course.id, profileId)), course);
      if (record) {
        events = record.events;
        reviewCount = core.reviewTargets(events, course).length;
        retestCount = core.retestPlan(events, course, now).filter(item => item.due).length;
        const session = record.session;
        if (session) {
          const total = session.queue.length;
          const solved = session.index + Number(Boolean(session.answered));
          const set = session.mode === 'retry' ? '복습 세트' : '기본 세트';
          if (session.index === total) {
            summary = `${set} · ${total}문제 완료`;
            action = '세트 결과 보기';
          } else if (core.hasSessionProgress(session)) {
            summary = `${set} · ${solved}/${total}문제 풀이`;
            action = '이어 풀기';
          }
        }
      }
    } catch {
      summary = '저장된 풀이를 읽지 못했어요.';
    }
    return {course, summary, action, reviewCount, retestCount, events};
  }

  function courseCard({course, summary, action, reviewCount, retestCount, events}, hasDue, now) {
    function studyUrl(view) {
      const params = new URLSearchParams();
      if (course.id !== 'japanese') params.set('subject', course.id);
      if (view) params.set('view', view);
      const query = params.toString();
      return query ? `study.html?${escape(query)}` : 'study.html';
    }
    const name = escape(course.name);
    const reviewText = `복습할 문제 ${reviewCount}개`;
    const recommendation = hasDue ? null : core.reasonPractice(events, course, now);
    const reason = recommendation && (course.reasons || core.defaultReasons)[recommendation.reason];
    const recommendedAction = recommendation && `${escape(recommendation.concept.label)} 연습`;
    return `<article class="study-home-card">
      <div><h2>${name}</h2><p>${summary}</p>${reason ? `<p>최근 오답 이유 · ${escape(reason)}</p>` : ''}</div>
      <div class="study-home-actions">
        ${retestCount ? `<a class="button primary" href="${studyUrl('retest')}" aria-label="${name} 7일 재시험 ${retestCount}개">7일 재시험 ${retestCount}개</a>` : ''}
        ${recommendation ? `<a class="button primary" href="${studyUrl('reason')}" aria-label="${name} ${recommendedAction}">${recommendedAction}</a>` : ''}
        <a class="button${retestCount || recommendation ? '' : ' primary'}" href="${studyUrl()}" aria-label="${name} ${action}">${action}</a>
        ${reviewCount ? `<a class="button" href="${studyUrl('review')}" aria-label="${name} ${reviewText}">${reviewText}</a>` : ''}
      </div>
    </article>`;
  }

  function render() {
    const now = Date.now();
    const statuses = courses.map(course => courseStatus(course, now));
    const hasDue = statuses.some(status => status.retestCount > 0);
    grid.innerHTML = statuses.map(status => courseCard(status, hasDue, now)).join('');
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
