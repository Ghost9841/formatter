"use client";

import { useState, useCallback } from "react";

// ─── types ───────────────────────────────────────────────────────────────────
interface Row {
  kanji: string;
  kana: string;
  english: string;
  nepali: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function isDevanagari(s: string) {
  return /[\u0900-\u097f]/.test(s);
}

function parseLine(line: string): Row | null {
  const raw = line.trim();
  if (!raw) return null;

  let kanji: string;
  let kana: string;
  let rest: string;

  // ── Format A: 役（やく）role भूमिका
  //    kanji and kana are already joined: word（reading）
  const fmtA = raw.match(/^([^\s（(]+)[（(]([^）)]+)[）)]\s*(.*)/);

  // ── Format B: 水族館 すいぞくかん aquarium एक्वेरियम
  //    space-separated kanji kana …
  if (fmtA) {
    kanji = fmtA[1];
    kana  = "（" + fmtA[2] + "）";
    rest  = fmtA[3].trim();
  } else {
    const toks = raw.split(/[\s\u3000]+/).filter(Boolean);
    if (toks.length < 3) return null;
    kanji = toks[0];
    kana  = "（" + toks[1] + "）";
    rest  = toks.slice(2).join(" ");
  }

  // From `rest`, peel Devanagari word(s) off the right end
  const restToks = rest.split(/[\s\u3000]+/).filter(Boolean);
  let j = restToks.length - 1;
  const nepArr: string[] = [];
  while (j >= 0 && (isDevanagari(restToks[j]) || restToks[j] === "," || restToks[j] === "।")) {
    nepArr.unshift(restToks[j]);
    j--;
  }

  const nepali  = nepArr.join(" ").replace(/^,\s*/, "").trim();
  const english = restToks.slice(0, j + 1).join(" ").trim();

  if (!english || !nepali) return null;
  return { kanji, kana, english, nepali };
}

// ─── component ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(12);
  const [copied, setCopied] = useState(false);

  const convert = useCallback(() => {
    const lines = input.split("\n");
    const good: Row[] = [];
    const bad: string[] = [];

    lines.forEach((raw, i) => {
      const r = parseLine(raw);
      if (r) good.push(r);
      else if (raw.trim()) bad.push(`Line ${i + 1} skipped: "${raw.trim()}"`);
    });

    setRows(good);
    setSkipped(bad);
    setCopied(false);
  }, [input]);

  const copyForWord = useCallback(() => {
    if (!rows.length) return;
    const tsv = rows
      .map((r) => [r.kanji, r.kana, r.english, r.nepali].join("\t"))
      .join("\n");
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [rows]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") convert();
  };

  return (
    <>
      {/* ── custom fonts ── */}
      <style>{`
        @font-face {
          font-family: 'MSMincho';
          src: url('/MSMINCHO.TTC') format('truetype');
        }
        @font-face {
          font-family: 'TimesCustom';
          src: url('/TIMES.TTF') format('truetype');
        }
        @font-face {
          font-family: 'Kokila';
          src: url('/KOKILAI.TTF') format('truetype');
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f7f6f3;
          font-family: system-ui, sans-serif;
          color: #1a1a1a;
        }

        .page {
          max-width: 860px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
        }

        /* ── header ── */
        .header {
          margin-bottom: 2rem;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 1rem;
        }
        .header h1 {
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .header p {
          font-size: 0.78rem;
          color: #666;
          margin-top: 3px;
        }

        /* ── input area ── */
        .input-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 6px;
        }
        textarea {
          width: 100%;
          height: 170px;
          resize: vertical;
          font-size: 13.5px;
          line-height: 1.85;
          padding: 10px 12px;
          border: 1.5px solid #ccc;
          border-radius: 6px;
          background: #fff;
          color: #1a1a1a;
          font-family: 'MSMincho', monospace;
          outline: none;
          transition: border-color 0.15s;
        }
        textarea:focus { border-color: #333; }

        /* ── controls row ── */
        .controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 7px 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 5px;
          border: 1.5px solid #1a1a1a;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: background 0.12s, color 0.12s;
        }
        .btn-primary {
          background: #1a1a1a;
          color: #f7f6f3;
        }
        .btn-primary:hover { background: #333; }
        .btn-secondary {
          background: transparent;
          color: #1a1a1a;
        }
        .btn-secondary:hover { background: #eee; }
        .btn-secondary:disabled {
          opacity: 0.4;
          cursor: default;
        }

        /* font-size control */
        .size-control {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-left: auto;
          font-size: 12px;
          color: #555;
        }
        .size-control input[type=range] {
          width: 90px;
          accent-color: #1a1a1a;
        }
        .size-badge {
          font-size: 11px;
          font-weight: 700;
          background: #1a1a1a;
          color: #f7f6f3;
          border-radius: 4px;
          padding: 1px 6px;
          min-width: 30px;
          text-align: center;
        }

        /* status */
        .status {
          font-size: 12px;
          color: #888;
        }
        .status.ok { color: #2d7a2d; }
        .status.copied { color: #1a6fb5; font-weight: 600; }

        /* ── table output ── */
        .output-wrap {
          margin-top: 18px;
          border: 1.5px solid #ccc;
          border-radius: 6px;
          overflow: auto;
          background: #fff;
          min-height: 72px;
        }
        .empty-msg {
          padding: 20px 14px;
          font-size: 13px;
          color: #aaa;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }
        td {
          border: 1px solid #d4d4d4;
          padding: 5px 10px;
          vertical-align: middle;
        }
        tr:nth-child(even) td { background: #fafafa; }
        tr:hover td { background: #f0f0f0; }

        /* column font families */
        .col-jp  { font-family: 'MSMincho', 'MS Mincho', serif; }
        .col-kana { font-family: 'MSMincho', 'MS Mincho', serif; }
        .col-en  { font-family: 'TimesCustom', 'Times New Roman', serif; }
        .col-np  { font-family: 'Kokila', 'Noto Sans Devanagari', serif; }

        /* ── errors ── */
        .errors {
          margin-top: 10px;
          font-size: 11.5px;
          color: #c0392b;
          white-space: pre-wrap;
          line-height: 1.7;
        }

        /* ── hint ── */
        .hint {
          margin-top: 18px;
          font-size: 11px;
          color: #aaa;
          border-top: 1px solid #e8e8e8;
          padding-top: 10px;
        }
      `}</style>

      <div className="page">
        {/* header */}
        <div className="header">
          <h1>Vocab Formatter</h1>
          <p>JP → Kana → English → Nepali &nbsp;·&nbsp; paste, convert, copy to Word</p>
        </div>

        {/* textarea */}
        <div className="input-label">Paste entries — one per line</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            "水族館 すいぞくかん aquarium (n) एक्वेरियम\n" +
            "王族 おうぞく royalty (n) राजपरिवार\n" +
            "料理 りょうり cooking, cuisine (n) खाना"
          }
          spellCheck={false}
        />

        {/* controls */}
        <div className="controls">
          <button className="btn btn-primary" onClick={convert}>
            Convert
          </button>
          <button
            className="btn btn-secondary"
            onClick={copyForWord}
            disabled={!rows.length}
          >
            Copy for Word
          </button>

          {copied && <span className="status copied">✓ Copied — paste into a 4-column Word table</span>}
          {!copied && rows.length > 0 && (
            <span className="status ok">{rows.length} row{rows.length !== 1 ? "s" : ""} converted</span>
          )}

          {/* font size slider */}
          <div className="size-control">
            <span>Font size</span>
            <input
              type="range"
              min={9}
              max={20}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <span className="size-badge">{fontSize}pt</span>
          </div>
        </div>

        {/* output table */}
        <div className="output-wrap">
          {rows.length === 0 ? (
            <div className="empty-msg">Table appears here after converting…</div>
          ) : (
            <table>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td
                      className="col-jp"
                      style={{ fontSize: `${fontSize}pt`, whiteSpace: "nowrap" }}
                    >
                      {r.kanji}
                    </td>
                    <td
                      className="col-kana"
                      style={{ fontSize: `${fontSize}pt`, whiteSpace: "nowrap" }}
                    >
                      {r.kana}
                    </td>
                    <td
                      className="col-en"
                      style={{ fontSize: `${fontSize}pt` }}
                    >
                      {r.english}
                    </td>
                    <td
                      className="col-np"
                      style={{ fontSize: `${fontSize + 1.5}pt` }}
                    >
                      {r.nepali}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* parse errors */}
        {skipped.length > 0 && (
          <div className="errors">{skipped.join("\n")}</div>
        )}

        {/* hint */}
        <div className="hint">
          Ctrl + Enter to convert &nbsp;·&nbsp; "Copy for Word" puts tab-separated values on the clipboard — paste into a 4-column table in Word and fonts will match after embedding.
        </div>
      </div>
    </>
  );
}
