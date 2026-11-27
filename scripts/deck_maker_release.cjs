const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const directory = path.join(__dirname, "..", "deck-maker");
const html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
const changelog = fs.readFileSync(path.join(directory, "CHANGELOG.md"), "utf8");
const version = html.match(/const VERSION = "([\d.]+)";/)[1];
const section = changelog.match(/^## v([^ ]+) · (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## v|(?![\s\S]))/m);
if (!section || section[1] !== version) throw Error("The first changelog entry must match the producer version.");

function loadBuilder(temp, source = html) {
  const modules = ["vendor/jszip.min.js", "vendor/exceljs.min.js", "vendor/sql-wasm.js",
    "vendor/sql-wasm-inline.js", "profiles.js", "card.js", "factory.js", "projects.js", "sample.js"];
  for (const name of modules) {
    const opener = '<script data-bundle="' + name + '">';
    const start = source.indexOf(opener);
    if (start < 0) throw Error("Missing bundled source " + name);
    const end = source.indexOf("</script>", start);
    const file = path.join(temp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, source.slice(start + opener.length, end));
  }
  globalThis.AnkiOpsCard = require(path.join(temp, "card.js"));
  globalThis.AnkiOpsFactory = require(path.join(temp, "factory.js"));
  require(path.join(temp, "projects.js"));
  require(path.join(temp, "sample.js"));
  return {factory: globalThis.AnkiOpsFactory, projects: globalThis.AnkiOpsProjects, sampleFor:globalThis.AnkiOpsSampleFor,
    sample:globalThis.AnkiOpsSample};
}

async function modelSamples(dir, factory, sampleFor) {
  const destination = path.join(dir,"rule-06");
  const evidenceFile = path.join(directory,"sample-qa.json");
  const recorded = fs.existsSync(evidenceFile) ? JSON.parse(fs.readFileSync(evidenceFile,"utf8")) : {};
  for (const [subdirectory,model,counts] of [["kanji-lab","lab-kanji",[2,6]],["kanji-revolution","kr-quiz",[2,2]]]) {
    const sample = sampleFor(model);
    const input = new TextEncoder().encode(sample.tsv);
    let result = await factory.build({ input,name:sample.job.product + ".tsv",job:sample.job,
      createdAt:Date.parse(section[2] + "T00:00:00Z") });
    if (result.run.dataset.notes !== counts[0] || result.run.dataset.cards !== counts[1] ||
        result.run.operatingStandard.version !== factory.RULE06.version) throw Error("RULE-06 sample data differs from the release plan.");
    const evidence = recorded.producerVersion === version && recorded.models?.[model];
    if (evidence && evidence.apkgSHA256 === result.result.packageSHA256 &&
        evidence.previewSHA256 === await factory.digest(result.files["preview.html"])) {
      result = await factory.updateEvidence(result,evidence.gates);
    }
    const target = path.join(destination,subdirectory);
    fs.mkdirSync(target,{recursive:true});
    fs.writeFileSync(path.join(target,"index.html"),result.files["preview.html"]);
    fs.writeFileSync(path.join(target,"sample.apkg"),result.files[result.apkgName]);
    fs.writeFileSync(path.join(target,"candidate.zip"),result.archive);
  }
}

async function artifacts(dir) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "deck-release-"));
  try {
    const {factory, projects, sampleFor} = loadBuilder(temp);
    const sample = projects.starterProject();
    const data = await projects.validateNotes(sample, sample.notes, {production: true});
    const build = await factory.build({input: data, name: "JLPT_Grammar_Contrast_10.tsv",
      job: sample.job, createdAt: Date.parse(section[2] + "T00:00:00Z")});
    if (build.run.dataset.notes !== 10 || build.run.dataset.cards !== 10) throw Error("Expected 10 contrast notes and cards.");
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, "JLPT_Grammar_Contrast_10.apkg"), build.files[build.apkgName]);
    fs.writeFileSync(path.join(dir, "JLPT_Grammar_Contrast_10_Preview.html"), build.files["preview.html"]);
    fs.writeFileSync(path.join(dir, "Anki_Deck_Operations_v" + version + ".html"), html);
    await modelSamples(dir,factory,sampleFor);
    fs.writeFileSync(path.join(dir, "notes.md"), section[3].trim() +
      "\n\n[제작기 열기](https://dlquffhqnxj.github.io/anki-deck-site/deck-maker/) · " +
      "[사용법과 전체 변경 이력](https://github.com/dlquffhqnxj/anki-deck-site/tree/deck-maker-v" + version + "/deck-maker)\n");
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
}

module.exports = { loadBuilder };

if (require.main === module) {
  if (process.argv[2] === "--version") console.log(version);
  else if (process.argv[2]) artifacts(path.resolve(process.argv[2])).catch(error => {
    console.error(error.issues || error); process.exitCode = 1;
  });
  else throw Error("Provide an output directory or --version.");
}
