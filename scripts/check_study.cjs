const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const core = require('../assets/study-core.js');

const root = path.resolve(__dirname, '..');
const browser = {window: {}};
for (const asset of ['study-data.js', 'study-courses.js']) {
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

test('each subject has six base questions, valid options and an existing deck link', () => {
  const ids = new Set();
  for (const course of [japanese, toeic, electrical]) {
    assert.equal(course.questions.length, 6);
    assert.ok(catalog.decks.some(deck => deck.id === course.relatedDeck.id && deck.current));
    for (const q of core.allQuestions(course)) {
      assert.ok(!ids.has(q.id));
      ids.add(q.id);
      assert.ok(course.concepts.some(concept => concept.id === q.concept));
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map(option => option[0])).size, 4);
      assert.ok(q.options.every(option => option[1] && option[2]));
      assert.ok(q.options.some(option => option[0] === q.answer));
      assert.ok(q.translation || q.solution);
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
