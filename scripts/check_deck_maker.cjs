const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const html = readFileSync(join(__dirname, "../deck-maker/index.html"), "utf8");
const context = vm.createContext({ TextEncoder, TextDecoder, crypto: webcrypto });
for (const name of ["profiles.js", "card.js", "factory.js", "projects.js"]) {
  const start = '<script data-bundle="' + name + '">';
  const at = html.indexOf(start);
  assert.notEqual(at, -1, name);
  const body = html.slice(at + start.length, html.indexOf("</script>", at));
  vm.runInContext(body, context, { filename: name });
}
const { AnkiOpsProjects: projects, AnkiOpsFactory: factory, AnkiOpsCard: cards } = context;

function project() {
  return projects.blank(factory.validateJob({
    name: "문법", product: "test-grammar", model: "lab-quiz", version: "1.0.0-RC1", level: "N3"
  }));
}
function row(id, prompt) {
  return { id, level: "N3", prompt, optionA: "하나", optionB: "둘", correct: "B", answer: "둘", explanation: "풀이" };
}
const states = items => Array.from(items, item => item.state);

test("partial imports retain existing fields, identifiers, and unselected corrections", () => {
  const p = project();
  p.notes = [row("a", "첫 문제"), row("b", "둘째 문제")];
  const [patch] = factory.pastedNotes("NoteID\tExplanation\na\t수정 근거", p.job.model, true, "", true);
  const items = projects.plan(p, [patch, row("c", "셋째 문제"), row("b", "둘째 문제")]);
  assert.deepEqual(states(items), ["edit", "add", "same"]);
  const all = projects.merge(p, items, [0]);
  assert.deepEqual(Array.from(all, note => note.id), ["a", "b", "c"]);
  assert.equal(all[0].explanation, "수정 근거");
  assert.equal(all[0].level, "N3");
  assert.equal(all[0].optionB, "둘");
  assert.equal(projects.merge(p, items, [])[0].explanation, "풀이");
  assert.equal(projects.plan(p, [{id: "a", optionB: "새 정답"}])[0].row.answer, "새 정답");
});

test("duplicate, ambiguous, and out-of-scope input cannot overwrite cumulative notes", () => {
  const p = project();
  p.notes = [row("a", "첫 문제")];
  const items = projects.plan(p, [
    row("", "첫 문제"), row("", "새 문제"), row("external", "새 문제"),
    {...row("a", "첫 문제"), level: "N2"}
  ]);
  assert.deepEqual(states(items), ["same", "add", "same", "scope"]);
  assert.equal(projects.merge(p, items, [0, 2, 3]).length, 2);
  const conflicting = projects.plan(p, [
    {...row("a", "첫 문제"), explanation: "수정 1"},
    {...row("a", "첫 문제"), explanation: "수정 2"}
  ]);
  assert.deepEqual(states(conflicting), ["conflict", "conflict"]);
  assert.equal(projects.merge(p, conflicting, [0, 1])[0].explanation, "풀이");
});

test("deck identity is stable across releases and separate across projects", () => {
  const p = project();
  assert.equal(projects.key({...p.job, version: "1.1.0"}), p.key);
  assert.notEqual(projects.key({...p.job, product: "another-deck"}), p.key);
  const versions = ["1.0.0-RC2", "1.0.0-preview.10", "1.0.0", "1.0.0-RC10"];
  assert.equal(projects.latestVersion(versions.map(version => ({version}))), "1.0.0");
  assert.equal(projects.next("1.0.0-preview.9"), "1.0.0-preview.10");
  assert.equal(projects.next("1.0.0-RC9"), "1.0.0-RC10");
  assert.equal(projects.next("1.0.0"), "1.0.1-RC1");
});

test("review missions cover every card type and respect deck-level settings", () => {
  for (const [model, spec] of Object.entries(cards.MODELS)) {
    const job = factory.validateJob({...project().job, model});
    const disabled = {...job, learning: cards.learningProfile(model, {included: {records: false}})};
    const fields = new Set(cards.fieldList(model));
    for (let ordinal = 0; ordinal < spec.types.length; ordinal++) {
      for (const side of [false, true]) {
        const template = cards.ankiCard(job, ordinal, side).split("<script>")[0];
        assert.match(template, /data-r-panel/);
        for (const token of template.matchAll(/{{[#/^]?([^{}]+)}}/g)) {
          assert.ok(fields.has(token[1]), model + " contains an unknown field " + token[1]);
        }
        assert.doesNotMatch(cards.ankiCard(disabled, ordinal, side).split("<script>")[0], /data-r-panel/);
      }
    }
  }
});

test("learning design check finds notes missing explanations for comparison or recall", () => {
  const a = row("a", "객관식");
  const gaps = projects.feedbackGaps([a, {...a, id: "b", trap: "보기의 차이"}, {id: "c", prompt: "회상"}]);
  assert.deepEqual(Array.from(gaps.options, note => note.id), ["a"]);
  assert.deepEqual(Array.from(gaps.recall, note => note.id), ["c"]);
});

test("the displayed version, offline filename, and changelog match the producer", () => {
  const version = factory.VERSION;
  assert.ok(html.includes('<span class="version">v' + version + '</span>'));
  assert.ok(html.includes('Anki_Deck_Operations_v' + version + '.html'));
  const changelog = readFileSync(join(__dirname, "../deck-maker/CHANGELOG.md"), "utf8");
  assert.ok(changelog.split('\n').some(line => line.startsWith('## v' + version + ' ·')));
});

test("exact retests retain both NoteIDs and support different passages under a shared stem", () => {
  const p = project();
  p.notes = [
    {...row("original", "필자의 의도는?"), passage:"첫 번째 글"},
    {...row("variant", "필자의 의도는?"), passage:"다른 관점의 글"}
  ];
  const change = projects.setPair(p, "original", "variant", "역접");
  assert.equal(change.notes[0].id, "original");
  assert.equal(change.notes[1].retestFor, "original");
  assert.equal(change.notes[1].studyRole, "retest");
  assert.equal(change.notes[1].concept, "역접");
  assert.equal(change.learning.included.retest, true);
  const source = factory.authorSource(change.notes, p.job.model);
  assert.ok(source.split("\n")[0].includes("RetestFor"));
  const removed = projects.removePair({...p, notes: change.notes}, "variant");
  assert.equal(removed.notes.length, 2);
  assert.equal(removed.notes[1].studyRole, "");
  assert.equal(removed.learning.included.retest, false);
});

test("authoring refuses the same stimulus, conflicting concept, or a retest claimed by another source", () => {
  const a=row("a","같은 질문"), b=row("b","같은 질문"), other=row("c","다른 질문");
  assert.match(factory.pairProblem(a,b),/질문이나 지문/);
  assert.match(factory.pairProblem(a,a),/다른 노트/);
  assert.match(factory.pairProblem({...a,concept:"문법"},{...other,concept:"어휘"}),/개념 ID/);
  assert.match(factory.pairProblem(a,{...other,retestFor:"other"}),/다른 원문항/);
  assert.match(factory.pairProblem(a,{...other,studyRole:"보충"}),/사용 중/);
});

test("the exported retest bank names each source and carries the distinct reading passage", async () => {
  const p=project();
  p.notes=["first", "other", "retest-1", "retest-2"].map((id, index) => ({
    ...row(id, "필자의 의도는?"), passage:"지문 " + index, optionC:"셋", optionD:"넷"
  }));
  for (const [source, target] of [["first", "retest-1"], ["other", "retest-2"]]) {
    const update=projects.setPair(p, source, target, "독해");
    p.notes=update.notes;
    p.job.learning=update.learning;
  }
  async function inspect(notes) {
    return factory.inspect({input:new TextEncoder().encode(factory.authorSource(notes,p.job.model)), name:"source.tsv", job:p.job});
  }
  const good=await inspect(p.notes);
  assert.equal(good.errors,0);
  assert.deepEqual(Array.from(good.bank.questions,q=>[q.id,q.retestFor,q.passage]),[
    ["retest-1","first","지문 2"],["retest-2","other","지문 3"]
  ]);
  const broken=await inspect(p.notes.map(n=>n.id==="retest-1"?{...n,retestFor:"missing"}:n));
  assert.ok(broken.errors>0);
});
