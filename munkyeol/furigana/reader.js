"use strict";

if (!self.kuromoji) importScripts("./kuromoji.js");

const hasKanji = /[\p{Script=Han}々]/u;
const kanaOnly = /^[ぁ-ゖゝゞー]+$/u;
let tokenizer;

function hiragana(text) {
  return text.normalize("NFKC").replace(/[\u30a1-\u30f6\u30fd-\u30fe]/g,
    letter => String.fromCharCode(letter.charCodeAt(0) - 0x60));
}

function loadTokenizer() {
  if (!tokenizer) {
    tokenizer = new Promise((resolve, reject) => {
      self.kuromoji.builder({ dicPath: "./dict" }).build((error, instance) => {
        if (error) reject(error);
        else resolve(instance);
      });
    }).then(instance => {
      delete globalThis.furiganaDictionaries;
      return instance;
    }).catch(error => {
      tokenizer = undefined;
      throw error;
    });
  }
  return tokenizer;
}

// Align dictionary readings with the written kana so okurigana stays in the base text.
function addTokenReadings(surface, reading, start, annotations) {
  if (!hasKanji.test(surface) || typeof reading !== "string") return;
  const pronunciation = hiragana(reading);
  if (!kanaOnly.test(pronunciation)) return;
  const pieces = surface.match(/[\p{Script=Han}々]+|[^\p{Script=Han}々]+/gu);
  const pattern = pieces.map(piece => hasKanji.test(piece) ? "([ぁ-ゖゝゞー]+?)" : hiragana(piece));
  if (pattern.some((piece, index) => !hasKanji.test(pieces[index]) && !kanaOnly.test(piece))) return;
  const matches = new RegExp("^" + pattern.join("") + "$", "u").exec(pronunciation);
  if (!matches) return;

  let group = 1;
  let offset = start;
  for (const piece of pieces) {
    const end = offset + piece.length;
    if (hasKanji.test(piece)) annotations.push({ start: offset, end, reading: matches[group++] });
    offset = end;
  }
}

function readingsFor(text, analyzer) {
  const annotations = [];
  let offset = 0;
  for (const token of analyzer.tokenize(text)) {
    const surface = token.surface_form;
    if (!surface) continue;
    const start = text.indexOf(surface, offset);
    if (start === -1) continue;
    offset = start + surface.length;
    if (token.word_type === "KNOWN") {
      let reading = token.reading;
      if (surface === "お手数") reading = "オテスウ";
      else if (surface === "手数" && text[start - 1] === "お") reading = "テスウ";
      addTokenReadings(surface, reading, start, annotations);
    }
  }
  return annotations;
}

function vocabularyCandidates(text, analyzer) {
  const candidates = [];
  const positions = new Set();
  const commonVerbs = new Set(["する", "ある", "いる", "なる", "できる", "行う", "言う", "思う", "下さる", "いただく", "くださる"]);
  let offset = 0;
  for (const token of analyzer.tokenize(text)) {
    const surface = token.surface_form;
    if (!surface) continue;
    const start = text.indexOf(surface, offset);
    if (start < 0) continue;
    offset = start + surface.length;
    const katakana = /^\p{Script=Katakana}[ァ-ヺー]{2,}$/u.test(surface);
    if ((!hasKanji.test(surface) && !katakana) || surface.length < 2 ||
        !["名詞", "動詞", "形容詞"].includes(token.pos) ||
        ["固有名詞", "接尾", "数", "非自立"].includes(token.pos_detail_1)) continue;
    const reading = hiragana(token.reading || (katakana ? surface : ""));
    const lookup = token.basic_form === "*" || !token.basic_form ? surface : token.basic_form;
    if (!kanaOnly.test(reading) || commonVerbs.has(lookup)) continue;
    if (positions.has(lookup)) continue;
    positions.add(lookup);
    candidates.push({ term: surface, reading, lookup, start, end: offset });
  }
  return candidates;
}

self.addEventListener("message", async ({ data }) => {
  try {
    const analyzer = await loadTokenizer();
    if (data.words) self.postMessage({ id: data.id, words: vocabularyCandidates(data.text, analyzer) });
    else self.postMessage({ id: data.id, readings: readingsFor(data.text, analyzer) });
  } catch {
    self.postMessage({ id: data.id, failed: true });
  }
});
