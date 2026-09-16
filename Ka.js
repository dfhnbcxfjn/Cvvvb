javascript:(function(){
if(document.getElementById('ka-rev'))return;

// ── fetch hook ───────────────────────────────────────────────────────────
const _fetch = window.fetch;
let lastAnswers = [];

function dig(obj, found = []) {
  if (!obj || typeof obj !== 'object') return found;
  if (Array.isArray(obj)) { obj.forEach(i => dig(i, found)); return found; }
  const keys = Object.keys(obj);
  const isCorrect = (obj.correct === true)
    || (obj.status === 'correct' || obj.considered === 'correct');
  if (isCorrect) {
    const val = obj.content ?? obj.value ?? obj.expression ?? obj.text ?? JSON.stringify(obj);
    if (val) found.push(String(val).replace(/\*\*/g,'').trim());
  }
  keys.forEach(k => { if (typeof obj[k] === 'object') dig(obj[k], found); });
  return found;
}

function parse(raw) {
  try {
    const outer = JSON.parse(raw);
    // itemData is a double-encoded JSON string inside the GQL blob
    const itemData = outer?.data?.assessmentItem?.item?.itemData;
    if (itemData) {
      const inner = JSON.parse(itemData);
      const answers = dig(inner);
      if (answers.length) return answers;
    }
    // fallback: dig the whole outer blob
    return dig(outer);
  } catch(e) { return []; }
}

window.fetch = async function(...args) {
  const res = await _fetch(...args);
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url ?? '';
  if (url.includes('getAssessmentItem') || url.includes('assessmentItem')) {
    const clone = res.clone();
    clone.text().then(raw => {
      const answers = parse(raw);
      if (answers.length) {
        lastAnswers = answers;
        showAnswers(answers);
        tryAutoFill(answers);
      }
    }).catch(()=>{});
  }
  return res;
};

// ── panel ────────────────────────────────────────────────────────────────
const panel = document.createElement('div');
panel.id = 'ka-rev';
panel.style.cssText = `
  position:fixed;top:68px;right:14px;width:220px;max-height:340px;overflow-y:auto;
  background:#0f172a;border:1px solid #1e293b;border-radius:10px;
  padding:12px;z-index:2147483647;font-family:system-ui,sans-serif;
  color:#cbd5e1;box-shadow:0 8px 32px rgba(0,0,0,.7);
`;

const hdr = document.createElement('div');
hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
const title = document.createElement('span');
title.textContent = 'KA Rev';
title.style.cssText = 'font-weight:700;font-size:13px;color:#818cf8;letter-spacing:.5px';
const closeBtn = document.createElement('span');
closeBtn.textContent = '✕';
closeBtn.style.cssText = 'color:#ef4444;cursor:pointer;font-size:12px;font-weight:700';
closeBtn.onclick = () => { window.fetch = _fetch; panel.remove(); };
hdr.append(title, closeBtn);

const ansBox = document.createElement('div');
ansBox.style.cssText = 'font-size:12px;line-height:1.6;color:#94a3b8;min-height:24px';
ansBox.textContent = 'waiting for question…';

const autoBtn = document.createElement('button');
autoBtn.textContent = '⚡ Auto Fill';
autoBtn.style.cssText = `
  width:100%;margin-top:8px;padding:6px 0;border:none;border-radius:6px;
  background:#4f46e5;color:#fff;font-size:11px;font-weight:600;cursor:pointer;
`;
autoBtn.onclick = () => tryAutoFill(lastAnswers);

panel.append(hdr, ansBox, autoBtn);
document.body.appendChild(panel);

// ── display ──────────────────────────────────────────────────────────────
function showAnswers(answers) {
  ansBox.innerHTML = '';
  answers.forEach((a, i) => {
    const row = document.createElement('div');
    row.style.cssText = `
      background:#1e293b;border-radius:5px;padding:4px 7px;
      margin-bottom:4px;color:#a5b4fc;font-size:12px;word-break:break-word;
    `;
    row.textContent = answers.length > 1 ? `${i+1}. ${a}` : a;
    ansBox.appendChild(row);
  });
}

// ── auto-fill MC ─────────────────────────────────────────────────────────
function tryAutoFill(answers) {
  if (!answers.length) return;
  // MC: find radio options whose text matches the answer
  const opts = [...document.querySelectorAll(
    '[data-testid="answer-option"], .perseus-radio-option, .choice-item, li[class*="choice"]'
  )];
  let filled = 0;
  opts.forEach(opt => {
    const txt = (opt.innerText || '').replace(/\s+/g,' ').trim();
    if (answers.some(a => txt.includes(a) || a.includes(txt.slice(0,30)))) {
      opt.click();
      filled++;
    }
  });
  // Free response: inject into focused input
  if (!filled && answers[0]) {
    const input = document.querySelector(
      'input[type="text"]:not([readonly]), .perseus-input, [contenteditable="true"]'
    );
    if (input) {
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(
        input.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(input, answers[0]);
        input.dispatchEvent(new Event('input', {bubbles:true}));
        input.dispatchEvent(new Event('change', {bubbles:true}));
      } else {
        document.execCommand('insertText', false, answers[0]);
      }
    }
  }
}
})();
