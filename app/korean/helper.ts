// ─── Unicode → Preeti converter ─────────────────────────────────────────────
// Based on npttf2utf mapping (github.com/casualsnek/npttf2utf)

export const PREETI_MAP: Record<string, string> = {
  "अ":"c", "आ":"cf", "इ":"O", "ई":"l{", "उ":"p", "ऊ":"pm",
  "ऋ":"C", "ए":"P", "ऐ":"P]", "ओ":"cfa", "औ":"cfa]",
  "ं":"+", "ँ":"F", "ः":"M", "ा":"f", "ि":"l", "ी":"L",
  "ु":"'", "ू":"\"", "ृ":"[", "े":"]", "ै":"}", "ो":"f]", "ौ":"f}",
  "क":"s", "ख":"v", "ग":"u", "घ":"3", "ङ":"]",
  "च":"r", "छ":"5", "ज":"h", "झ":"4", "ञ":"`",
  "ट":"6", "ठ":"7", "ड":"8", "ढ":"9", "ण":"0",
  "त":"t", "थ":"y", "द":"b", "ध":"w", "न":"g",
  "प":"k", "फ":"(", "ब":"a", "भ":"e", "म":"d",
  "य":"o", "र":"/", "ल":"n", "व":"j", "श":"z",
  "ष":"i", "स":";", "ह":"x", "क्ष":"I", "त्र":"q",
  "ज्ञ":"1", "द्द":"2", "द्ध":"4", "द्य":"B", "द्र":">",
  "द्म":"ß", "द्व":"å", "ड्ड":"•", "ट्ट":"§", "ठ्ठ":"¶",
  "ङ्क":"Í", "ङ्ख":"Î", "ङ्ग":"Ë", "ङ्घ":"‹", "त्त":"Q",
  "त्त्":"Œ", "त्र्":"œ", "स्त्र":"÷", "श्र":">", "र्‍":"¥",
  "ऽ":"˜", "।":".", "्":"\\", "्र":"|", "र्":"{",
  "०":"0", "१":"!", "२":"@", "३":"#", "४":"$",
  "५":"%", "६":"^", "७":"&", "८":"*", "९":"(",
  "(":"-", ")":"_", "-":"(", ".":"=", ",":",",
  "?":"<", "“":"æ", "”":"Æ", "‘":"…", "’":"Ú",
  "ॐ":"ç", " ":" ", "\n":"\n", "\t":"\t",
};

// Multi-char conjuncts / clusters that must be matched first (longest first)
const PREETI_MULTI: Record<string, string> = {
  "क्ष्":"I", "ज्ञ्":"¡", "घ्":"£", "झ्":"¤", "ध्":"W",
  "भ्":"E", "च्":"R", "त्":"T", "थ्":"Y", "ग्":"U",
  "ष्":"i", "ब्":"A", "क्":"S", "म्":"D", "न्":"G",
  "ज्":"H", "व्":"J", "प्":"K", "स्":":", "श्":"Z",
  "ह्":"X", "ल्":"N", "ख्":"V", "द्य":"B", "द्र":"›",
  "द्म":"ß", "द्व":"å", "ङ्ढ":"°", "ङ्क":"Í", "ङ्ख":"Î",
  "ङ्ग":"Ë", "ङ्घ":"‹", "ट्ठ":"Ý", "ड्ड":"•", "ठ्ठ":"¶",
  "ट्ट":"§", "त्त्":"Œ", "त्र्":"œ", "हृ":"Å", "झ":"´",
  "फ्":"ˆ", "ध्र":"„", "रू":"¿", "रु":"?", "्य":"Ø",
};

export default function unicodeToPreeti(input: string): string {
  if (!input) return "";

  // 1. Normalise common Unicode composition issues
  let s = input
    .replace(/़/g, "")               // remove nukta
    .replace(/्ा/g, "")              // invalid halant-aa
    .replace(/ँँ/g, "ँ")
    .replace(/ंं/g, "ं")
    .replace(/ेे/g, "े")
    .replace(/ैै/g, "ै")
    .replace(/ुु/g, "ु")
    .replace(/ूू/g, "ू");

  // 2. Fix vowel + matra combos into standalone/pre-composed forms
  s = s
    .replace(/अाे/g, "ओ")
    .replace(/अाै/g, "औ")
    .replace(/अा/g, "आ")
    .replace(/एे/g, "ऐ")
    .replace(/ाे/g, "ो")
    .replace(/ाै/g, "ौ")
    .replace(/ेा/g, "ो")
    .replace(/ैा/g, "ौ");

  // 3. Reph (र्) handling: in Unicode र् precedes the consonant cluster.
  //    In Preeti it becomes '{' placed AFTER the whole cluster + matras.
  //    Pattern: र् + (consonant|halant)* + (matra|anusvara|visarga)*
  const rephRe = /र्((?:[क-ह]्?)*)([ािीुूृेैोौंःँ]*)/g;
  s = s.replace(rephRe, (_match, cluster: string, matras: string) => {
    return cluster + matras + "{";
  });

  // 4. Move 'ि' (chhotee ee) BEFORE the consonant cluster it attaches to.
  //    In Unicode:  कि = क + ि  →  In Preeti: s + l  (ल is ि)
  //    We need to handle clusters like क्ति, श्रि, etc.
  const iMatraRe = /ि((?:[क-ह]्)*[क-ह])/g;
  s = s.replace(iMatraRe, (_match, cluster: string) => "l" + cluster);

  // 5. Handle the 'm' modifier for aspirated/extended vowels
  //    These are common transformations in Preeti → Unicode post-rules.
  //    Reverse them here.
  s = s
    .replace(/ऊ/g, "pm")
    .replace(/झ/g, "em")
    .replace(/फ/g, "km")
    .replace(/क्त/g, "Qm")
    .replace(/क्र/g, "qm");

  // 6. Map multi-character clusters first (longest match)
  //    Sort keys by length descending so "क्ष्" matches before "क्ष"
  const multiKeys = Object.keys(PREETI_MULTI).sort((a, b) => b.length - a.length);
  for (const key of multiKeys) {
    s = s.split(key).join(PREETI_MULTI[key]);
  }

  // 7. Map remaining single Unicode chars
  let out = "";
  for (const ch of s) {
    out += PREETI_MAP[ch] ?? ch; // leave unknown chars (spaces, English) as-is
  }

  return out;
}