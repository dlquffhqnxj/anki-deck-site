const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const core = require('../assets/study-core.js');

const root = path.resolve(__dirname, '..');
const browser = {window: {}};
for (const asset of ['study-data.js', 'study-courses.js', 'study-retention-data.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets', asset), 'utf8'), browser, {filename: asset});
}
const [japanese, toeic, electrical] = browser.window.STUDY_COURSES;
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data', 'library.json'), 'utf8'));
const now = Date.now();

function attempt(bank, question, id, changes = {}) {
  return {
    id, bankVersion: bank.version, questionId: question.id,
    selected: question.answer, confidence: 'sure', hint: false,
    mode: 'practice', at: now - 10000, activeMs: 8000, reason: 'unknown',
    ...changes,
  };
}

test('each subject has its expected question counts, valid options and an existing deck link', () => {
  const ids = new Set();
  const baseCount = {japanese: 8, toeic: 6, electrical: 7};
  for (const course of [japanese, toeic, electrical]) {
    assert.equal(course.questions.length, baseCount[course.id]);
    assert.equal(course.followups.length, 8);
    assert.equal(course.retests.length, 8);
    assert.ok(catalog.decks.some(deck => deck.id === course.relatedDeck.id && deck.current));
    for (const q of core.allQuestions(course)) {
      assert.ok(!ids.has(q.id));
      ids.add(q.id);
      assert.ok(course.concepts.some(concept => concept.id === q.concept));
      assert.equal(q.options.length, q.concept === 'kanji-shape' ? 2 : 4);
      assert.equal(new Set(q.options.map(option => option[0])).size, q.options.length);
      assert.ok(q.options.every(option => option[1] && option[2]));
      assert.ok(q.options.some(option => option[0] === q.answer));
      assert.ok(q.translation || q.solution);
      if (q.concept === 'kanji-shape') assert.ok(q.reading && q.translation);
    }
  }
});

test('review includes wrong answers and low-confidence correct answers once each', () => {
  const [q1, q2, q3, q4] = toeic.questions;
  const rows = core.validateEvents([
    attempt(toeic, q1, 'wrong', {selected: 'a'}),
    attempt(toeic, q2, 'unsure', {confidence: 'unsure'}),
    attempt(toeic, q3, 'guess', {confidence: 'guess'}),
    attempt(toeic, q4, 'confident'),
    attempt(toeic, q2, 'unsure-again', {confidence: 'unsure', at: now - 9000}),
  ], toeic);
  assert.deepEqual(core.reviewTargets(rows, toeic).map(({question, kind}) => [question.id, kind]), [
    [q1.id, 'wrong'], [q2.id, 'uncertain'], [q3.id, 'uncertain'],
  ]);
  const resolved = core.validateEvents([...rows, attempt(toeic, q2, 'resolved', {at: now - 8000, mode: 'retry'})], toeic);
  assert.ok(!core.reviewTargets(resolved, toeic).some(({question}) => question.id === q2.id));
  assert.equal(core.stats(resolved, toeic, now).success.length, 3);
});

test('two selected unit-conversion questions give one different question on the same concept', () => {
  const [q1, q2] = electrical.questions;
  const [followup] = electrical.followups;
  assert.deepEqual(core.followupQueue([q1.id, q2.id], electrical), [followup.id]);
  assert.equal(followup.concept, q1.concept);
  assert.ok(![q1.id, q2.id].includes(followup.id));
  const rows = core.validateEvents([
    attempt(electrical, q1, 'base-wrong', {selected: 'a', reason: 'unit'}),
    attempt(electrical, followup, 'extra-correct', {mode: 'retry'}),
  ], electrical);
  const stats = core.stats(rows, electrical, now);
  assert.equal(stats.today.length, 1);
  assert.equal(stats.success.length, 0);
  assert.equal(rows[0].reason, 'unit');
});

test('each missed concept opens a sourced card and a different supplemental question', () => {
  for (const course of [japanese, toeic, electrical]) {
    for (const concept of course.concepts) {
      const {prompt, answer, example, source, sources = [source], deck = course.relatedDeck} = concept.review;
      assert.ok(prompt && answer && example && sources.length);
      for (const [title, url] of sources) {
        assert.ok(title);
        assert.equal(new URL(url).protocol, 'https:');
      }
      assert.ok(catalog.decks.some(d => d.id === deck.id && d.current));
      if (course.language !== 'ko') assert.ok(concept.review.translation);
      if (course.language === 'ja') assert.ok(concept.review.reading);
    }
    for (const source of core.allQuestions(course)) {
      const alternate = core.conceptPracticeQuestion(source, course);
      assert.ok(course.followups.includes(alternate));
      assert.equal(alternate.concept, source.concept);
      assert.notEqual(alternate.id, source.id);
      assert.notEqual(alternate.sentence, source.sentence);
    }
  }
  for (const q of electrical.questions) {
    assert.equal(core.conceptPracticeQuestion(q, electrical).type, q.type);
  }
});

test('legacy Japanese records validate unchanged and foreign subject records are rejected', () => {
  assert.equal(japanese.version, 'design-jp-1');
  assert.equal(japanese.questions[0].id, 'demo-jp-01');
  const old = attempt(japanese, japanese.questions[0], 'existing-jp', {
    selected: 'a', confidence: 'guess', reason: 'rule',
  });
  assert.equal(core.validateEvents([old], japanese)[0].reason, 'rule');
  assert.throws(() => core.validateEvents([old], toeic), /문항 버전/);
  assert.throws(() => core.validateEvents([old], electrical), /문항 버전/);
});

test('home and practice read the same legacy session and keep the course records separate', () => {
  assert.equal(core.storageKey(japanese.id), 'anki-design-lab-v1');
  assert.equal(core.storageKey(toeic.id), 'anki-design-lab-v1-toeic');
  assert.equal(core.storageKey(electrical.id), 'anki-design-lab-v1-electrical');
  const personalKeys = [japanese, toeic, electrical].flatMap(bank =>
    ['default', 'profile-a', 'profile-b'].map(profile => core.storageKey(bank.id, profile)));
  assert.equal(new Set(personalKeys).size, 9);
  assert.equal(core.readRecord(null, japanese), null);

  const [first, second] = japanese.questions;
  const raw = {
    schemaVersion: 1,
    bankVersion: japanese.version,
    events: [attempt(japanese, first, 'graded', {confidence: 'unsure'})],
    theme: 'dark',
    session: {
      queue: [first.id, second.id], index: 0, mode: 'practice',
      eventIds: ['graded'], selected: first.answer, confidence: 'unsure', hint: true, answered: 'graded',
    },
  };
  const saved = core.readRecord(JSON.stringify(raw), japanese);
  assert.deepEqual(saved.session, raw.session);
  assert.equal(saved.theme, 'dark');
  assert.equal(core.reviewTargets(saved.events, japanese).length, 1);
  assert.throws(() => core.readRecord(JSON.stringify(raw), toeic), /버전/);

  raw.session.index = 1;
  raw.session.selected = second.answer;
  assert.equal(core.readRecord(JSON.stringify(raw), japanese).session.answered, null);
  assert.equal(core.readRecord(JSON.stringify(raw), japanese).session.selected, second.answer);
});

test('each concept has at least two reserved retest questions and every question has a reasoning check', () => {
  for (const bank of [japanese, toeic, electrical]) {
    const all = core.allQuestions(bank);
    assert.equal(new Set(all.map(q => q.sentence)).size, all.length);
    for (const concept of bank.concepts) {
      assert.ok(bank.retests.filter(q => q.concept === concept.id).length >= 2);
    }
    for (const q of all) {
      const {prompt, answer, options} = q.evidence;
      assert.ok(prompt && options.every(option => option[1]));
      assert.ok(options.some(([id]) => id === answer));
    }
    const retest = bank.retests[0];
    assert.throws(() => core.validateEvents([attempt(bank, retest, 'wrong-mode')], bank), /재시험/);
    assert.throws(() => core.validateEvents([attempt(bank, bank.questions[0], 'invalid-evidence', {evidence: 'missing'})], bank), /풀이 근거/);
    const rows = core.validateEvents([attempt(bank, retest, 'retest', {mode: 'retest', evidence: retest.evidence.answer})], bank);
    assert.ok(core.retestPassed(rows[0], retest));
    assert.equal(core.stats(rows, bank, now).today.length, 0);
    assert.equal(core.reviewTargets(rows, bank).length, 0);
  }
});

test('retest waits seven days, retries with a fresh variant, and closes only after a confident pass', () => {
  const bank = electrical;
  const [base] = bank.questions;
  const [extra] = bank.followups;
  const [first, second] = bank.retests;
  const interval = core.RETEST_INTERVAL;
  const dueAt = now - 2 * interval - 60_000;
  const entries = [
    attempt(bank, base, 'initial', {at: dueAt - interval, confidence: 'guess'}),
    attempt(bank, extra, 'immediate', {at: dueAt - interval + 1000, mode: 'retry'}),
  ];
  const plan = (at) => core.retestPlan(core.validateEvents(entries, bank), bank, at);
  assert.equal(plan(dueAt - 1)[0].due, false);
  assert.equal(plan(dueAt)[0].due, true);
  assert.equal(plan(dueAt)[0].question.id, first.id);
  entries.push(attempt(bank, first, 'chosen-wrong-evidence', {at: dueAt, mode:'retest', evidence:'same'}));
  assert.equal(plan(dueAt)[0].dueAt, dueAt + interval);
  assert.equal(plan(dueAt)[0].question.id, second.id);
  entries.push(attempt(bank, second, 'low-confidence', {at:dueAt + interval, mode:'retest', confidence:'unsure'}));
  assert.equal(plan(now)[0].question.id, first.id);
  entries.push(attempt(bank, first, 'pass', {at: dueAt + 2 * interval, mode:'retest'}));
  assert.equal(plan(now).length, 0);
  entries.push(attempt(bank, base, 'new-cycle', {at:now, selected:'a'}));
  assert.equal(plan(now)[0].anchorId, 'new-cycle');
});

test('recommendations use recent reported reasons, count each question once per day, and target the skill', () => {
  const bank = electrical;
  const source = bank.questions.find(q => q.id === 'demo-elec-04');
  const wrong = source.options.find(option => option[0] !== source.answer)[0];
  const sameDay = Math.floor((now + 9 * 3_600_000) / 86_400_000) * 86_400_000 - 9 * 3_600_000;
  const recent = sameDay - 3_600_000;
  const rows = core.validateEvents([
    attempt(bank, source, 'unclassified', {selected:wrong}),
    attempt(bank, source, 'old-reason', {selected:wrong, reason:'formula', at:now - core.RETEST_INTERVAL - 1000}),
    attempt(bank, source, 'same-day-1', {selected:wrong, reason:'unit', at:recent}),
    attempt(bank, source, 'same-day-2', {selected:wrong, reason:'unit', at:recent + 1000}),
  ], bank);
  assert.equal(core.reasonPractice([], bank, now), null);
  const recommendation = core.reasonPractice(rows, bank, now);
  assert.equal(recommendation.reason, 'unit');
  assert.equal(recommendation.count, 1);
  assert.equal(recommendation.question.concept, 'unit-conversion');
  assert.ok(bank.followups.includes(recommendation.question));
});

test('additional practice rotates and preserves the connector skill across new work situations', () => {
  const [source] = toeic.questions.filter(q => q.id === 'demo-toeic-03');
  const wrong = attempt(toeic, source, 'needs-connector', {selected: 'b', reason: 'rule'});
  const first = core.reasonPractice(core.validateEvents([wrong], toeic), toeic, now).question;
  assert.equal(first.id, 'review-toeic-connector-clause');
  const completed = attempt(toeic, first, 'connector-drill', {mode: 'retry', at: now - 5000});
  const rows = core.validateEvents([wrong, completed], toeic);
  const next = core.reasonPractice(rows, toeic, now).question;
  assert.equal(next.id, 'review-toeic-connector-demo');
  assert.equal(next.evidence.answer, source.evidence.answer);
  const plan = core.retestPlan(rows, toeic, wrong.at + core.RETEST_INTERVAL);
  assert.equal(plan[0].question.id, 'retest-toeic-connector-shipping');
});

test('kanji and electrical voltage questions reach different followups and retests from a base attempt', () => {
  const cases = [
    [japanese, 'demo-jp-kanji-weekend', 'review-jp-kanji-month-end', 'retest-jp-kanji-book-end'],
    [electrical, 'demo-elec-ohm-voltage', 'review-elec-ohm-voltage', 'retest-elec-ohm-voltage'],
  ];
  for (const [bank, baseId, followupId, retestId] of cases) {
    const base = bank.questions.find(q => q.id === baseId);
    const first = core.conceptPracticeQuestion(base, bank);
    assert.equal(first.id, followupId);
    const at = now - core.RETEST_INTERVAL;
    const rows = core.validateEvents([attempt(bank, base, 'old-uncertain', {at, confidence: 'unsure'})], bank);
    const [retest] = core.retestPlan(rows, bank, now);
    assert.equal(retest.question.id, retestId);
    assert.equal(retest.dueAt, now);
    assert.notEqual(first.id, retest.question.id);
  }
});
