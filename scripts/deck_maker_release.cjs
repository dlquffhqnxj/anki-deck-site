const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const directory = path.join(__dirname, "..", "deck-maker");
const html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
const changelog = fs.readFileSync(path.join(directory, "CHANGELOG.md"), "utf8");
const version = html.match(/const VERSION = "([\d.]+)";/)[1];
const section = changelog.match(/^## v([^ ]+) · (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## v|(?![\s\S]))/m);
if (!section || section[1] !== version) throw Error("The first changelog entry must match the producer version.");

function loadBuilder(temp) {
  const modules = ["vendor/jszip.min.js", "vendor/exceljs.min.js", "vendor/sql-wasm.js",
    "vendor/sql-wasm-inline.js", "profiles.js", "card.js", "factory.js", "projects.js"];
  for (const name of modules) {
    const opener = '<script data-bundle="' + name + '">';
    const start = html.indexOf(opener);
    if (start < 0) throw Error("Missing bundled source " + name);
    const end = html.indexOf("</script>", start);
    const file = path.join(temp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, html.slice(start + opener.length, end));
  }
  globalThis.AnkiOpsCard = require(path.join(temp, "card.js"));
  globalThis.AnkiOpsFactory = require(path.join(temp, "factory.js"));
  require(path.join(temp, "projects.js"));
  return {factory: globalThis.AnkiOpsFactory, projects: globalThis.AnkiOpsProjects};
}

async function artifacts(dir) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "deck-release-"));
  try {
    const {factory, projects} = loadBuilder(temp);
    const sample = projects.starterProject();
    const data = await projects.validateNotes(sample, sample.notes, {production: true});
    const build = await factory.build({input: data, name: "JLPT_Grammar_Contrast_10.tsv",
      job: sample.job, createdAt: Date.parse(section[2] + "T00:00:00Z")});
    if (build.run.dataset.notes !== 10 || build.run.dataset.cards !== 10) throw Error("Expected 10 contrast notes and cards.");
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, "JLPT_Grammar_Contrast_10.apkg"), build.files[build.apkgName]);
    fs.writeFileSync(path.join(dir, "JLPT_Grammar_Contrast_10_Preview.html"), build.files["preview.html"]);
    fs.writeFileSync(path.join(dir, "Anki_Deck_Operations_v" + version + ".html"), html);
    fs.writeFileSync(path.join(dir, "notes.md"), section[3].trim() +
      "\n\n[제작기 열기](https://dlquffhqnxj.github.io/anki-deck-site/deck-maker/) · " +
      "[사용법과 전체 변경 이력](https://github.com/dlquffhqnxj/anki-deck-site/tree/deck-maker-v" + version + "/deck-maker)\n");
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
}

if (require.main === module) {
  if (process.argv[2] === "--version") console.log(version);
  else if (process.argv[2]) artifacts(path.resolve(process.argv[2])).catch(error => {
    console.error(error.issues || error); process.exitCode = 1;
  });
  else throw Error("Provide an output directory or --version.");
}
