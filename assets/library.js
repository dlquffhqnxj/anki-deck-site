(() => {
  'use strict';
  const data = window.ANKI_LIBRARY;
  const main = document.querySelector('#main');
  const support = window.LibrarySupport;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = (url, text, cls = 'text-link') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  const size = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MiB` : `${(n / 1024).toFixed(1)} KiB`;
  const seoulDate = new Intl.DateTimeFormat('ko-KR', {dateStyle:'medium', timeZone:'Asia/Seoul'});
  const detailUrl = d => `deck.html?id=${encodeURIComponent(d.id)}`;
  const previewUrl = d => `preview.html?id=${encodeURIComponent(d.id)}`;
  const trialUrl = d => `trial.html?id=${encodeURIComponent(d.id)}`;
  const guideUrl = (d, flow, from) => {
    const query = new URLSearchParams({id: d.id, flow});
    if (from) query.set('from', from);
    return `guide.html?${query}`;
  };
  const hasInteractivePreview = d => Boolean(d.preview || d.sample);
  const hasPackage = d => d.assets.some(a => a.name.endsWith('.apkg') && !a.blocked);
  const badge = d => `<span class="badge ${d.blocked ? 'badge-fail' : ''}">${d.blocked ? '설치 보류' : d.classification === 'pilot' ? '제작 표본' : d.classification === 'platform' ? '제작 도구' : d.prerelease ? '배포 후보' : '정식 릴리스'}</span>`;
  const accessNote = `<div class="access-note"><strong>다운로드 안내</strong><p>GitHub 저장소는 비공개입니다. 파일을 받으려면 저장소 접근 권한이 있는 계정으로 로그인해 주세요.</p></div>`;
  const title = (kicker, heading, copy) => `<div class="page-title"><div><p class="kicker">${esc(kicker)}</p><h1>${esc(heading)}</h1>${copy ? `<p class="intro">${esc(copy)}</p>` : ''}</div></div>`;
  function shots(d, large = false) {
    const controls = `<div class="shot-switch" role="group" aria-label="${esc(d.title)} 대표 화면"><button type="button" data-shot-side="0" aria-pressed="true">화면 1</button><button type="button" data-shot-side="1" aria-pressed="false">화면 2</button></div>`;
    const figures = d.shots.map((s, i) => `<figure class="shot" data-shot-panel="${i}"><button class="shot-button" type="button" data-image="${esc(s.path)}" data-caption="${esc(d.title + ' · ' + s.caption)}" aria-label="${esc(d.title + ' · ' + s.caption + ' 크게 보기')}"><img src="${esc(s.path)}" alt="${esc(d.title + ' ' + d.version + ' · ' + s.caption)}" loading="${large || i === 0 ? 'eager' : 'lazy'}" width="750" height="550"></button><figcaption class="shot-caption">${esc(s.caption)}</figcaption></figure>`).join('');
    return `<div class="shot-gallery" data-active-shot="0">${d.shots.length === 2 ? controls : ''}<div class="shot-pair ${large ? 'detail-pair' : ''}">${figures}</div></div>`;
  }
  function samplePair(d, large) {
    const sample = d.sample;
    return `<div class="shot-pair sample-pair ${large ? 'detail-pair' : ''}">
      <figure class="sample-side"><figcaption>학습 예시 · 앞면</figcaption><strong>${esc(sample.type)}</strong><p>${esc(sample.prompt)}</p></figure>
      <figure class="sample-side"><figcaption>학습 예시 · 뒷면</figcaption><strong>${esc(sample.answer)}</strong><p>${esc(sample.explanation)}</p></figure>
    </div>`;
  }
  function previewPair(d, large = false) {
    return d.shots.length ? shots(d, large) : d.sample ? samplePair(d, large) : '';
  }
  function originalPreviewLink(d) {
    const asset = d.assets.find(a => a.name === d.preview_asset);
    return asset ? external(asset.url, '원본 HTML 다운로드 · 권한 필요', 'button') : '';
  }
  function relatedVersions(d) {
    if (!d.related?.length) return '';
    return `<nav class="related-versions" aria-label="관련 버전">${d.related.map(([id, label]) => `<a class="text-link" href="${detailUrl({id})}">${esc(label)}</a>`).join('')}</nav>`;
  }
  function catalog() {
    const current = data.decks.filter(d => d.current);
    const subjects = new Map(current.map(d => [d.subject, d.subject_label]));
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const topics = {kanji:'한자 읽기·쓰기', language:'어휘·문법', practice:'실전문제', work:'실무', summary:'핵심 정리', production:'덱 제작'};
    const options = (entries, first) => `<option value="">${first}</option>${entries.map(([key, label]) => `<option value="${esc(key)}">${esc(label)}</option>`).join('')}`;
    main.innerHTML = `<div class="page-title"><div><h1>학습할 덱을 골라보세요</h1><p class="intro">학습 목적에 맞는 덱을 찾고 대표 카드를 풀어보세요.</p></div><div class="page-meta"><div><strong>${current.length}</strong><span>현재 항목</span></div><div><strong>${data.decks.length}</strong><span>등록 릴리스</span></div></div></div>
      <form class="catalog-filters panel" role="search" aria-label="덱 찾기">
        <label class="filter-search">덱 이름 또는 내용<input type="search" name="q" maxlength="100" placeholder="예: 한자혁명, 독해, TOEIC"></label>
        <label>과목<select name="subject" aria-label="과목">${options([...subjects], '전체 과목')}</select></label>
        <label>JLPT 급수<select name="level" aria-label="JLPT 급수">${options(levels.map(l => [l,l]), '전체 급수')}</select></label>
        <label>학습 목적<select name="topic" aria-label="학습 목적">${options(Object.entries(topics), '전체 목적')}</select></label>
        <button class="button" type="reset">초기화</button>
      </form>
      <p class="result-count" id="results" role="status"></p>
      <section class="deck-grid" aria-label="현재 덱과 제작 자료">${current.map(deckCard).join('')}</section>
      <p class="empty" id="no-decks" hidden>조건에 맞는 덱이 없습니다. 검색어나 필터를 바꿔 보세요.</p>
      <div class="section panel preview-launch"><div><h2>이전판을 찾고 있나요?</h2><p>이전 릴리스의 미리보기와 배포 파일을 볼 수 있습니다.</p></div><a class="button" href="releases.html">릴리스 기록 보기</a></div>`;
    const form = main.querySelector('form');
    const cards = [...main.querySelectorAll('.deck-card')];
    const params = new URLSearchParams(location.search);
    for (const field of form.querySelectorAll('input, select')) {
      if (params.has(field.name)) field.value = params.get(field.name).slice(0, 100);
    }
    const aliases = {english:'영어 토익', japanese:'일본어 JLPT', 'electrical-engineer':'전기기사 자격증'};
    const searchable = current.map(d => [
      d.title, d.version, d.subject_label, d.purpose, aliases[d.subject], ...d.structure,
      ...Object.entries(d.tracks || {}).flatMap(([topic, grades]) => [topics[topic], ...grades])
    ].join(' ').toLowerCase());
    function applyFilters() {
      const {q, subject, level, topic} = Object.fromEntries(new FormData(form));
      const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      cards.forEach((card, index) => {
        const d = current[index];
        const matchesTrack = (!level && !topic) || Object.entries(d.tracks || {}).some(([key, grades]) => (!topic || key === topic) && (!level || grades.includes(level)));
        card.hidden = Boolean((subject && d.subject !== subject) || !matchesTrack || !tokens.every(token => searchable[index].includes(token)));
        if (!card.hidden) shown++;
      });
      document.querySelector('#results').textContent = `덱 ${shown}개`;
      document.querySelector('#no-decks').hidden = shown !== 0;
      const updated = new URLSearchParams(Object.entries({q, subject, level, topic}).filter(([, value]) => value.trim()));
      history.replaceState(null, '', location.pathname + (updated.toString() ? '?' + updated : ''));
    }
    form.addEventListener('input', applyFilters);
    form.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
    form.addEventListener('reset', () => queueMicrotask(applyFilters));
    applyFilters();
  }
  function deckCard(d) {
    const action = d.trial ? `<a class="button primary" href="${trialUrl(d)}">3문항 풀기</a>`
      : hasInteractivePreview(d) ? `<a class="button" href="${previewUrl(d)}">미리보기</a>` : '';
    return `<article class="deck-card"><div class="card-head"><div class="card-top"><span class="subject">${esc(d.subject_label)}</span><span class="version">${esc(d.version)}</span></div><h2 class="card-title"><a href="${detailUrl(d)}">${esc(d.title)}</a></h2><p class="card-description">${esc(d.purpose)}</p></div>${previewPair(d)}<div class="card-bottom">${badge(d)}<div class="card-links"><a class="card-action" href="${detailUrl(d)}">상세·파일</a>${action}</div></div></article>`;
  }
  const statusClass = v => v === 'PASS' || v === 'STATIC_PASS' ? 'pass' : v === 'FAIL' ? 'fail' : 'pending';
  const qaLabels = {STATIC:'파일·카드 구성 검사', IMPORT:'새 프로필 가져오기', UPDATE:'기존 덱 업데이트', DEVICE:'기기별 실행·동작'};
  const statusLabels = {PASS:'확인한 범위 통과', PARTIAL:'일부 확인', NOT_TESTED:'확인 기록 없음', NOT_APPLICABLE:'해당 없음', FAIL:'문제 발견'};
  function qaBoxes(d) {
    return `<div class="qa-grid">${Object.entries(qaLabels).map(([key, label]) => `<div class="qa-box"><span class="qa-label">${label} · ${key}</span><strong class="${statusClass(d.qa[key])}">${esc(d.qa[key] || 'NOT_TESTED')}</strong><p>${esc(statusLabels[d.qa[key]] || '확인 기록 없음')}</p>${d.qa_source ? '' : support.evidence(d,key)}</div>`).join('')}</div>`;
  }
  function runtimeDevices(d) {
    const devices = Object.entries(d.runtime_devices || {});
    if (!devices.length) return '';
    return `<div class="panel body-copy"><h3>기기별 기본 실행 확인</h3><p>${devices.map(([device, status]) => `${esc(device)} <strong class="${statusClass(status)}">${esc(status === 'PASS' ? 'PASS · 사용자 확인' : 'NOT_TESTED · 미확인')}</strong>`).join(' / ')}</p><p class="scope">${esc(d.runtime_scope)}. 기기별 실행 PASS와 전체 DEVICE QA는 확인 범위가 다릅니다.</p></div>`;
  }
  function downloads(d) {
    return `<div class="table-wrap"><table><thead><tr><th>배포 파일</th><th>용량</th><th>다운로드</th></tr></thead><tbody>${d.assets.map(a => `<tr><td><span class="file-name">${esc(a.name)}</span><span class="hash">SHA-256: ${esc(a.sha256 || '등록된 해시 없음')}</span></td><td>${size(a.size)}</td><td>${a.blocked ? '<span class="download-unavailable">손상 기록 · 보류</span>' : external(a.url, a.kind, 'download-link')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function countLine(d) {
    const parts = [['notes','노트'],['cards','카드'],['media','미디어']].filter(([k]) => Number.isInteger(d.counts?.[k])).map(([k,label]) => `${label} ${d.counts[k].toLocaleString('ko-KR')}${k==='notes'?'개':k==='media'?'개':'장'}`);
    return parts.length ? `<p class="scope">등록 수량 · ${parts.join(' · ')}</p>` : '';
  }
  function installPanel(d) {
    if (!hasPackage(d)) return '';
    const apkg = d.assets.find(a => a.name === d.install?.asset && !a.blocked);
    const paths = d.install?.paths || [
      {id:'fresh', label:'처음 설치', copy:'APKG를 받고 Anki의 파일 → 가져오기에서 엽니다.'},
      {id:'update', label:'기존 덱 업데이트', copy:d.update}
    ];
    const existing = paths.filter(p => p.id !== 'fresh');
    return `<section class="section panel install-panel" id="install">
      <h2>설치·업데이트</h2>
      ${d.package_counts ? `<p class="package-counts">한자 학습 <strong>${d.package_counts.study.toLocaleString('ko-KR')}장</strong> · 5파트 실전 <strong>${d.package_counts.practice.toLocaleString('ko-KR')}문항</strong></p>` : ''}
      <div class="install-modes" role="group" aria-label="설치 상황"><button class="button" type="button" data-install-mode="fresh" aria-pressed="true">처음 설치</button><button class="button" type="button" data-install-mode="update" aria-pressed="false">기존 덱 업데이트</button></div>
      <label class="install-version" hidden>지금 쓰는 버전<select id="install-from" aria-label="지금 쓰는 버전">${existing.map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select></label>
      <div id="install-instructions" aria-live="polite"></div>
      <div class="install-download">${apkg ? external(apkg.url, '통합 APKG 받기', 'button primary') : '<a class="button primary" href="#downloads">APKG 목록 보기</a>'}<p>다운로드하려면 GitHub에 로그인하세요.</p></div>
      <p class="scope"><a class="text-link" id="install-guide" href="${esc(guideUrl(d, 'install'))}">단계별 안내 열기 →</a></p>
    </section>`;
  }
  function bindInstall(d) {
    const panel = main.querySelector('#install');
    if (!panel) return;
    const modes = [...panel.querySelectorAll('[data-install-mode]')];
    const select = panel.querySelector('#install-from');
    let mode = 'fresh';
    function render() {
      const initial = {copy:'APKG를 받고 Anki의 파일 → 가져오기에서 엽니다.'};
      const path = d.install?.paths.find(p => p.id === (mode === 'fresh' ? 'fresh' : select.value))
        || (mode === 'fresh' ? initial : {copy:d.update});
      select.closest('label').hidden = mode !== 'update' || !d.install;
      modes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.installMode === mode)));
      panel.querySelector('#install-instructions').innerHTML = `<p>${esc(path.copy)}</p>${path.scope ? `<p class="scope">${esc(path.scope)}</p>` : ''}`;
      panel.querySelector('#install-guide').href = mode === 'update'
        ? guideUrl(d, 'update', d.install ? select.value : '')
        : guideUrl(d, 'install');
    }
    modes.forEach(button => button.addEventListener('click', () => { mode = button.dataset.installMode; render(); }));
    select.addEventListener('change', render);
    render();
  }
  function detail(d) {
    document.title = `${d.title} ${d.version} · Anki 덱 라이브러리`;
    main.innerHTML = `<a class="back" href="${d.current ? 'index.html' : 'releases.html'}">${d.current ? '덱 라이브러리' : '릴리스 기록'}로 돌아가기</a><div class="detail-header"><div class="detail-title"><p class="kicker">${esc(d.subject_label)}</p><h1>${esc(d.title)}</h1><div class="detail-badges"><span class="version">${esc(d.version)}</span>${badge(d)}${!d.current ? '<span class="badge badge-muted">이전판</span>' : ''}</div><p class="detail-description">${esc(d.purpose)}</p>${countLine(d)}</div></div><div class="detail-actions">${d.trial ? `<a class="button primary" href="${trialUrl(d)}">3문항 풀기</a>` : ''}${hasInteractivePreview(d) ? `<a class="button ${d.trial ? '' : 'primary'}" href="${previewUrl(d)}">${d.classification === 'platform' ? '동작 체험' : '카드 미리보기'}</a>` : ''}${hasPackage(d) ? '<a class="button" href="#install">설치·업데이트</a>' : ''}${originalPreviewLink(d)}${external(d.release_url, 'GitHub 릴리스', 'button')}<a class="button" href="#downloads">배포 파일 보기</a></div>${relatedVersions(d)}${installPanel(d)}<section class="section"><div class="section-heading"><h2>${d.shots.length && d.shot_kind !== 'example' ? '대표 카드 화면' : '앞·뒷면 학습 예시'}</h2>${d.shots.length ? '<span class="section-note">눌러서 크게 보기</span>' : ''}</div>${previewPair(d, true)}${d.shot_scope ? `<p class="scope">${esc(d.shot_scope)}</p>` : ''}</section>${d.blocked ? '<div class="section access-note"><strong>설치 보류</strong><p>기존 배포 ZIP에 손상 기록이 있습니다. 복구한 내부 카드의 미리보기는 확인할 수 있지만, 정상 배포 패키지가 확인되기 전에는 새 설치에 사용하지 마세요.</p></div>' : ''}<section class="section" id="downloads"><div class="section-heading"><h2>다운로드</h2><span class="section-note">등록된 릴리스 자산</span></div>${accessNote}${d.download_note ? `<p class="device-note">${esc(d.download_note)}</p>` : ''}${downloads(d)}</section><section class="section"><div class="section-heading"><h2>기록된 검증 상태</h2></div>${qaBoxes(d)}${runtimeDevices(d)}${d.qa_note ? `<p class="device-note">${esc(d.qa_note)}</p>` : ''}${d.device_note ? `<p class="device-note">${esc(d.device_note)}</p>` : ''}<p class="scope">이 표는 GitHub에 기록된 Anki 검증 상태입니다. 사이트의 화면 확인으로 상태를 올리지 않습니다.</p></section>${support.deck(d)}<section class="section guide-grid"><article class="panel body-copy"><h2>학습 방법</h2><p>${esc(d.study)}</p>${d.structure.length ? `<ul>${d.structure.map(v => `<li>${esc(v)}</li>`).join('')}</ul>` : ''}</article><article class="panel body-copy"><h2>업데이트</h2><p>${esc(d.update)}</p><p><a href="${esc(guideUrl(d, 'update'))}">단계별 설치·업데이트 안내</a></p></article></section>`;
  }
  function releases() {
    main.innerHTML = `${title('RELEASES', '릴리스 기록', '현재판과 이전판의 화면·배포 파일을 확인할 수 있습니다.')}${accessNote}<div class="section-heading"><h2>현재판</h2><span class="section-note">${data.decks.filter(d=>d.current).length}개</span></div><section class="release-list">${data.decks.filter(d=>d.current).map(releaseRow).join('')}</section><h2 class="previous-heading">이전판</h2><section class="release-list">${data.decks.filter(d=>!d.current).map(releaseRow).join('')}</section>`;
  }
  function releaseRow(d) { return `<article class="release-row"><div><h2><a href="${detailUrl(d)}">${esc(d.title)}</a> <span class="version">${esc(d.version)}</span></h2><p>${esc(d.subject_label)} · 게시 ${esc(seoulDate.format(new Date(d.published_at)))} · ${badge(d)}</p>${support.changes(d)}</div><div class="release-links"><a class="text-link" href="${detailUrl(d)}">상세·파일</a>${hasInteractivePreview(d) ? `<a class="text-link" href="${previewUrl(d)}">미리보기</a>` : ''}</div></article>`; }
  function deviceSummary(d) {
    const confirmed = Object.entries(d.runtime_devices || {}).filter(([, value]) => value === 'PASS');
    return confirmed.length ? `<div class="scope">${confirmed.map(([device]) => esc(device)).join(' · ')} 기본 실행 확인</div>` : '';
  }
  function qa() {
    const current = data.decks.filter(d=>d.current);
    main.innerHTML = `${title('QUALITY & COMPATIBILITY', '검증·호환성', '파일 검사·가져오기·업데이트·기기 실행을 나누어 확인 범위를 표시합니다.')}<div class="panel body-copy"><p><strong>PASS</strong>는 해당 범위의 통과, <strong>PARTIAL</strong>은 일부 범위 확인, <strong>NOT_TESTED</strong>는 미실행, <strong>FAIL</strong>은 실패 기록을 뜻합니다. 배포 후보는 사용자 승인과 필요한 검증을 마친 최종 기준본(GM)과 구분됩니다.</p></div><section class="section"><div class="table-wrap"><table><thead><tr><th>현재 항목</th>${Object.entries(qaLabels).map(([key,label])=>`<th>${esc(label)}<div class="file-name">${key}</div></th>`).join('')}</tr></thead><tbody>${current.map(d=>`<tr><td><a class="text-link" href="${detailUrl(d)}">${esc(d.title)}</a><div class="file-name">${esc(d.version)}</div></td>${['STATIC','IMPORT','UPDATE','DEVICE'].map(k=>`<td class="${statusClass(d.qa[k])}">${esc(d.qa[k] || 'NOT_TESTED')}<div class="file-name">${esc(statusLabels[d.qa[k]] || '확인 기록 없음')}</div>${k === 'DEVICE' ? deviceSummary(d) : ''}${support.evidence(d,k)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><section class="section guide-grid"><article class="panel body-copy"><h2>검사 범위</h2><p><strong>파일·카드 구성 검사 (STATIC)</strong>: 파일이 정상적으로 열리는지, 카드 틀이 사용하는 필드·이미지가 제대로 연결되어 있는지 확인합니다.<br><strong>새 프로필 가져오기 (IMPORT)</strong>: 덱이 없는 새 Anki 프로필에 처음 넣는 검사입니다.<br><strong>기존 덱 업데이트 (UPDATE)</strong>: 이전판에 새 버전을 적용했을 때 학습 기록이 유지되는지 확인합니다.<br><strong>기기별 실행·동작 (DEVICE)</strong>: 실제 앱의 표시·버튼·터치·미디어와 필요한 동기화를 확인합니다.</p></article><article class="panel body-copy"><h2>확인 범위와 미리보기</h2><p>미리보기는 카드의 모양과 사용 흐름을 확인하는 표본입니다. 전체 콘텐츠 감수나 Anki에서의 학습·동기화 검증을 대신하지 않습니다.</p><p>기기별 기본 실행 PASS는 사용자가 실행을 확인한 범위입니다. 세부 기능·미디어·왕복 동기화가 남으면 전체 DEVICE는 PARTIAL로 표시합니다. 확인 기기는 상세 페이지에 표시합니다.</p></article></section><section class="section panel body-copy"><h2>정보 기준</h2><p>GitHub 등록 릴리스 ${data.decks.length}건, 현재 덱·제작 자료와 버전별 검증 기록을 기준으로 구성했습니다. 이 사이트는 <strong>${esc(data.updated_at)}</strong> 시점의 자료입니다.</p><p class="scope">기준 커밋: ${esc(data.source_commit)}. 새 릴리스는 자료를 갱신한 뒤 반영됩니다.</p></section>`;
  }
  function preview(d) {
    if (!hasInteractivePreview(d)) { detail(d); return; }
    const label = d.preview_label || (d.preview ? '실제 카드 미리보기' : '학습 예시 체험');
    document.title = `${d.title} 미리보기 · Anki 덱 라이브러리`;
    main.innerHTML = `<a class="back" href="${detailUrl(d)}">상세로 돌아가기</a>
      ${title('CARD PREVIEW', d.title, d.version + ' · ' + label)}
      <div class="preview-actions">
        ${d.preview ? external(d.preview, '전체 화면', 'button') : ''}
        ${originalPreviewLink(d)}
      </div>
      ${d.preview
          ? `<iframe class="preview-frame" src="${esc(d.preview)}" title="${esc(d.title + ' 실제 카드 미리보기')}" sandbox="allow-scripts allow-same-origin allow-downloads"></iframe>`
          : sampleExercise(d.sample)}
      <p class="scope">${esc(d.preview_scope || d.shot_scope)} 학습 기록은 Anki에 저장되지 않습니다.</p>
      ${d.sample && d.shots.length ? `<section class="section"><h2>${d.shot_kind === 'example' ? '학습 예시 화면' : '대표 카드 화면'}</h2>${shots(d, true)}</section>` : ''}`;
    if (!d.preview) bindSample(d.sample);
  }
  function sampleExercise(sample) {
    return `<section class="panel sample-exercise" aria-labelledby="sample-question">
      <p class="sample-type">${esc(sample.type)}</p>
      <h2 id="sample-question">${esc(sample.prompt)}</h2>
      ${sample.options ? `<div class="sample-options" role="group" aria-label="선택지">${sample.options.map((option, i) => `<button class="button" type="button" data-option="${i}">${esc(option)}</button>`).join('')}</div>` : ''}
      <div class="sample-controls">
        <button class="button primary" type="button" data-reveal aria-controls="sample-answer">정답 보기</button>
        <button class="button" type="button" data-reset hidden>다시 풀기</button>
      </div>
      <div class="sample-answer" id="sample-answer" role="status" hidden>
        <strong data-feedback></strong><p>${esc(sample.answer)}</p><p>${esc(sample.explanation)}</p>
      </div>
    </section>`;
  }
  function bindSample(sample) {
    const exercise = main.querySelector('.sample-exercise');
    const revealButton = exercise.querySelector('[data-reveal]');
    const resetButton = exercise.querySelector('[data-reset]');
    const buttons = Array.from(exercise.querySelectorAll('[data-option]'));
    const answer = exercise.querySelector('#sample-answer');
    const feedback = exercise.querySelector('[data-feedback]');
    function reveal(choice) {
      buttons.forEach((button, index) => {
        const correct = sample.options[index] === sample.answer;
        button.disabled = true;
        if (correct) button.classList.add('correct-choice');
        else if (index === choice) button.classList.add('wrong-choice');
      });
      feedback.textContent = choice === undefined ? '정답' : sample.options[choice] === sample.answer ? '정답입니다' : '오답입니다';
      answer.hidden = false;
      revealButton.disabled = true;
      resetButton.hidden = false;
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => reveal(index)));
    revealButton.addEventListener('click', () => reveal());
    resetButton.addEventListener('click', () => {
      buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct-choice', 'wrong-choice');
      });
      answer.hidden = true;
      resetButton.hidden = true;
      revealButton.disabled = false;
      (buttons[0] || revealButton).focus();
    });
  }
  function images() {
    main.querySelectorAll('.shot-switch').forEach(group => {
      group.addEventListener('click', event => {
        const button = event.target.closest('[data-shot-side]');
        if (!button) return;
        group.closest('.shot-gallery').dataset.activeShot = button.dataset.shotSide;
        group.querySelectorAll('button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
      });
    });
    if (!main.querySelector('[data-image]')) return;
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<div class="dialog-top"><p id="image-caption"></p><button type="button" class="dialog-close">닫기</button></div><img class="dialog-image" alt="">';
    dialog.setAttribute('aria-labelledby', 'image-caption'); document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    document.querySelectorAll('[data-image]').forEach(b=>b.addEventListener('click',()=>{
      dialog.querySelector('img').src=b.dataset.image; dialog.querySelector('img').alt=b.dataset.caption; dialog.querySelector('p').textContent=b.dataset.caption; dialog.showModal();
    }));
  }
  try {
    if (!data?.decks?.length) throw new Error('덱 정보가 없습니다.');
    const filename = location.pathname.split('/').pop() || 'index.html';
    const route = {'releases.html':'releases','guide.html':'guide','qa.html':'qa','deck.html':'deck','preview.html':'preview','trial.html':'trial'}[filename] || 'catalog';
    const id = new URLSearchParams(location.search).get('id');
    const d = data.decks.find(d=>d.id===id);
    if (route === 'catalog') catalog(); else if (route === 'releases') releases(); else if (route === 'guide') window.LibraryGuide.render(main, data.decks, esc); else if (route === 'qa') qa();
    else if (d && route === 'trial' && d.trial) window.LibraryTrial.render(main, d, esc, detailUrl(d));
    else if (d) route === 'preview' ? preview(d) : detail(d);
    else main.innerHTML = '<div class="missing"><h1>덱을 찾을 수 없습니다</h1><p>덱 라이브러리에서 다시 선택해 주세요.</p><a class="button primary" href="index.html">덱 라이브러리</a></div>';
    if (d && route === 'deck') bindInstall(d);
    support.bind();
    const navRoute = ['deck','preview','trial'].includes(route) ? 'catalog' : route;
    document.querySelector(`[data-nav="${navRoute}"]`)?.classList.add('active');
    document.querySelector(`[data-nav="${navRoute}"]`)?.setAttribute('aria-current','page');
    document.querySelector('#breadcrumb').textContent = ({catalog:'덱 라이브러리',releases:'릴리스 기록',guide:'설치·업데이트',qa:'검증·호환성',deck:'덱 상세',preview:'카드 미리보기',trial:'3문항 학습 체험'})[route];
    document.querySelector('#snapshot-date').textContent = data.updated_at.replaceAll('-','.');
    images();
  } catch(e) {
    console.error(e); main.innerHTML = '<section class="missing"><h1>덱 정보를 불러오지 못했습니다</h1><p>잠시 후 다시 열어주세요. 배포 파일은 GitHub 릴리스에서 확인할 수 있습니다.</p><a class="button" href="https://github.com/dlquffhqnxj/anki-deck-project/releases">GitHub 릴리스</a></section>';
  }
})();
