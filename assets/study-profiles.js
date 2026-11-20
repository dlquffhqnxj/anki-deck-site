(() => {
  'use strict';

  const registryKey = 'anki-study-profiles-v1';
  const tabKey = 'anki-study-profile-tab-v1';
  const defaultProfile = {id: 'default', name: '기본 프로필'};
  const initial = {version: 1, active: defaultProfile.id, profiles: [defaultProfile]};

  function readRegistry() {
    const raw = localStorage.getItem(registryKey);
    if (raw === null) return initial;
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.profiles)) {
      throw new Error('학습 프로필 목록을 읽지 못했어요.');
    }
    const profiles = [defaultProfile];
    const ids = new Set([defaultProfile.id]);
    for (const entry of saved.profiles) {
      if (typeof entry?.id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(entry.id) || ids.has(entry.id) ||
          typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 32) continue;
      ids.add(entry.id);
      profiles.push({id: entry.id, name: entry.name});
    }
    return {version: 1, active: ids.has(saved.active) ? saved.active : defaultProfile.id, profiles};
  }

  function profileForTab(registry) {
    let tabId;
    try { tabId = sessionStorage.getItem(tabKey); } catch {}
    return registry.profiles.find(profile => profile.id === tabId)
      || registry.profiles.find(profile => profile.id === registry.active)
      || defaultProfile;
  }

  let registry;
  try { registry = readRegistry(); } catch { registry = initial; }
  const current = profileForTab(registry);
  try { sessionStorage.setItem(tabKey, current.id); } catch {}
  window.StudyProfiles = {current};

  const bar = document.querySelector('#study-profile');
  if (!bar) return;
  bar.innerHTML = `
    <div class="study-profile-controls">
      <label for="study-profile-select">학습 프로필</label>
      <select id="study-profile-select"></select>
      <button class="button" type="button" data-add-profile aria-expanded="false" aria-controls="study-profile-form">프로필 추가</button>
    </div>
    <form id="study-profile-form" hidden>
      <label for="study-profile-name">프로필 이름</label>
      <input id="study-profile-name" name="name" maxlength="32" required>
      <button class="button primary" type="submit">만들고 전환</button>
    </form>
    <p class="study-profile-note">이 브라우저에 프로필별로 기록을 저장해요.</p>
    <p class="study-profile-error" role="status"></p>`;
  const select = bar.querySelector('select');
  const form = bar.querySelector('form');
  const add = bar.querySelector('[data-add-profile]');
  const status = bar.querySelector('[role="status"]');

  function populate() {
    select.replaceChildren(...registry.profiles.map(profile => new Option(profile.name, profile.id)));
    select.value = current.id;
  }

  function selectProfile(next, profiles) {
    localStorage.setItem(registryKey, JSON.stringify({version: 1, active: next, profiles}));
    try { sessionStorage.setItem(tabKey, next); } catch {}
    location.reload();
  }

  select.addEventListener('change', () => {
    try {
      const saved = readRegistry();
      if (saved.profiles.some(profile => profile.id === select.value)) selectProfile(select.value, saved.profiles);
      else { registry = saved; populate(); }
    } catch {
      populate();
      status.textContent = '프로필을 바꾸지 못했어요. 브라우저 저장 공간을 확인해 주세요.';
    }
  });
  add.addEventListener('click', () => {
    form.hidden = !form.hidden;
    add.setAttribute('aria-expanded', String(!form.hidden));
    if (!form.hidden) form.elements.name.focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) { status.textContent = '프로필 이름을 입력해 주세요.'; return; }
    try {
      const saved = readRegistry();
      if (saved.profiles.some(profile => profile.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        status.textContent = '이미 있는 프로필 이름이에요. 다른 이름을 입력해 주세요.';
        return;
      }
      const id = crypto.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      selectProfile(id, [...saved.profiles, {id, name}]);
    } catch {
      status.textContent = '프로필을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== registryKey) return;
    try { registry = readRegistry(); populate(); } catch {}
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try {
      registry = readRegistry();
      if (profileForTab(registry).id !== current.id) location.reload();
      else populate();
    } catch {}
  });
  populate();
})();
