(function () {
  'use strict';

  const CFG = window.PESQUISA_CONFIG || {};
  const END = window.PESQUISA_END || {};
  const APPS_SCRIPT_URL = (CFG.appsScriptUrl || '').trim();
  const SUBMIT_TOKEN = (CFG.submitToken || '').trim();
  const MAX_TEXT_LEN = 2000;

  const qs = Array.isArray(window.PESQUISA_QUESTIONS) ? window.PESQUISA_QUESTIONS : [];
  const TOTAL = qs.filter(function (q) { return q.key; }).length;

  const SURVEY_CONTEXT = getSurveyContext();
  const chat = document.getElementById('chat');

  let step = 0;
  let answers = {};
  let multi = [];

  function sanitizeParam(value, maxLen) {
    if (!value) return '';
    return String(value)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim()
      .slice(0, maxLen);
  }

  function getSurveyContext() {
    const params = new URLSearchParams(window.location.search);
    let sessionId = '';
    try {
      sessionId = localStorage.getItem('mm_pesquisa_session') || '';
      if (!sessionId) {
        sessionId = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('mm_pesquisa_session', sessionId);
      }
    } catch (e) {
      sessionId = 's_' + Date.now();
    }
    return {
      session_id: sessionId,
      customer_id: sanitizeParam(params.get('customer_id') || params.get('cliente_id'), 64),
      email: sanitizeParam(params.get('email'), 120),
      order_id: sanitizeParam(params.get('order_id') || params.get('pedido_id'), 64),
      utm_source: sanitizeParam(params.get('utm_source'), 64),
      utm_campaign: sanitizeParam(params.get('utm_campaign'), 64)
    };
  }

  function scrollDown() {
    requestAnimationFrame(function () {
      chat.scrollTop = chat.scrollHeight;
    });
  }

  function addBubble(text, side, delay) {
    delay = delay || 0;
    return new Promise(function (resolve) {
      setTimeout(function () {
        const row = document.createElement('div');
        row.className = 'row ' + side + ' gap';
        const b = document.createElement('div');
        b.className = 'bbl ' + side;
        b.textContent = String(text).slice(0, MAX_TEXT_LEN);
        row.appendChild(b);
        chat.appendChild(row);
        scrollDown();
        resolve();
      }, delay);
    });
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'row bot';
    row.id = 'typ';
    const b = document.createElement('div');
    b.className = 'bbl bot typing';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      b.appendChild(dot);
    }
    row.appendChild(b);
    chat.appendChild(row);
    scrollDown();
  }

  function rmTyping() {
    const el = document.getElementById('typ');
    if (el) el.remove();
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  async function botSay(msgs, delay) {
    delay = delay == null ? 700 : delay;
    showTyping();
    await wait(delay);
    rmTyping();
    for (let i = 0; i < msgs.length; i++) {
      await addBubble(msgs[i], 'bot', 0);
      if (i < msgs.length - 1) {
        await wait(260);
        if (i < msgs.length - 2) {
          showTyping();
          await wait(480);
          rmTyping();
        }
      }
    }
  }

  function updProg() {
    const pct = step === 0 ? 0 : Math.round((step / TOTAL) * 100);
    document.getElementById('pFill').style.width = pct + '%';
    document.getElementById('pLbl').textContent = step + '/' + TOTAL;
  }

  function hideInput() {
    document.getElementById('opts').classList.add('hidden');
    const cfm = document.getElementById('cfm');
    cfm.classList.add('hidden');
    cfm.style.display = 'none';
    document.getElementById('txtWrap').classList.add('hidden');
    document.getElementById('scl').classList.add('hidden');
  }

  function showInput(q) {
    hideInput();
    multi = [];
    const action = q.action || {};
    const type = action.type;
    const opts = action.opts || [];
    const max = action.max;
    const ph = action.ph;
    const min = action.min;
    const l0 = action.l0;
    const l10 = action.l10;

    if (type === 'single' || type === 'multi') {
      const wrap = document.getElementById('opts');
      wrap.innerHTML = '';
      wrap.classList.remove('hidden');
      opts.forEach(function (o) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        b.textContent = o;
        if (type === 'single') {
          b.onclick = function () { pickSingle(o); };
        } else {
          b.onclick = function () { toggleMulti(o, b, max); };
        }
        wrap.appendChild(b);
      });
      if (type === 'multi') {
        const cfm = document.getElementById('cfm');
        cfm.classList.remove('hidden');
        cfm.style.display = 'none';
      }
    } else if (type === 'text') {
      const tw = document.getElementById('txtWrap');
      tw.classList.remove('hidden');
      const inp = document.getElementById('txtIn');
      inp.value = '';
      inp.maxLength = MAX_TEXT_LEN;
      inp.placeholder = ph || 'Digite aqui...';
      inp.dataset.outro = '';
      inp.dataset.outroKey = '';
      setTimeout(function () { inp.focus(); }, 300);
    } else if (type === 'scale') {
      const sw = document.getElementById('scl');
      sw.innerHTML = '';
      sw.classList.remove('hidden');
      const nums = document.createElement('div');
      nums.className = 'scl-nums';
      for (let i = min; i <= max; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'scl-btn';
        b.textContent = String(i);
        b.onclick = function () { pickScale(i, b); };
        nums.appendChild(b);
      }
      const lbls = document.createElement('div');
      lbls.className = 'scl-lbls';
      const left = document.createElement('span');
      left.textContent = l0 || '';
      const right = document.createElement('span');
      right.textContent = l10 || '';
      lbls.appendChild(left);
      lbls.appendChild(right);
      sw.appendChild(nums);
      sw.appendChild(lbls);
    }
    scrollDown();
  }

  async function askOutro(key) {
    await botSay(['Pode especificar? 😊'], 350);
    const tw = document.getElementById('txtWrap');
    tw.classList.remove('hidden');
    const inp = document.getElementById('txtIn');
    inp.value = '';
    inp.maxLength = MAX_TEXT_LEN;
    inp.placeholder = 'Conta pra gente...';
    inp.dataset.outro = '1';
    inp.dataset.outroKey = key;
    setTimeout(function () { inp.focus(); }, 300);
  }

  async function pickSingle(val) {
    hideInput();
    await addBubble(val, 'user');
    const key = qs[step].key;
    if (key) answers[key] = val;
    step++;
    updProg();
    if (val === 'Outro') await askOutro(key);
    else await nextStep();
  }

  function toggleMulti(val, btn, max) {
    const idx = multi.indexOf(val);
    if (idx >= 0) {
      multi.splice(idx, 1);
      btn.classList.remove('sel');
    } else {
      if (max && multi.length >= max) return;
      multi.push(val);
      btn.classList.add('sel');
    }
    const cfm = document.getElementById('cfm');
    cfm.style.display = multi.length > 0 ? 'block' : 'none';
    cfm.textContent = multi.length > 0 ? 'Confirmar (' + multi.length + ') →' : 'Confirmar →';
  }

  async function submitMulti() {
    if (!multi.length) return;
    const val = multi.join(', ');
    hideInput();
    await addBubble(val, 'user');
    const key = qs[step].key;
    if (key) answers[key] = multi.slice();
    step++;
    updProg();
    if (multi.includes('Outro')) await askOutro(key);
    else await nextStep();
  }

  async function submitText() {
    const inp = document.getElementById('txtIn');
    const val = inp.value.trim().slice(0, MAX_TEXT_LEN);
    if (!val) return;
    const isOutro = inp.dataset.outro === '1';
    const outroKey = inp.dataset.outroKey;
    inp.dataset.outro = '';
    inp.dataset.outroKey = '';
    hideInput();
    await addBubble(val, 'user');
    if (isOutro) {
      if (Array.isArray(answers[outroKey])) {
        answers[outroKey] = answers[outroKey].map(function (v) {
          return v === 'Outro' ? 'Outro: ' + val : v;
        });
      } else if (answers[outroKey] === 'Outro') {
        answers[outroKey] = 'Outro: ' + val;
      }
      await nextStep();
    } else {
      if (qs[step].key) answers[qs[step].key] = val;
      step++;
      updProg();
      await nextStep();
    }
  }

  async function pickScale(val, btn) {
    document.querySelectorAll('.scl-btn').forEach(function (b) { b.classList.remove('sel'); });
    btn.classList.add('sel');
    await wait(220);
    hideInput();
    await addBubble(String(val), 'user');
    if (qs[step].key) answers[qs[step].key] = val;
    step++;
    updProg();
    await nextStep();
  }

  async function nextStep() {
    if (step >= qs.length) {
      await showEnd();
      return;
    }
    const q = qs[step];
    await botSay(q.msgs || [], step === 0 ? 350 : 550);
    showInput(q);
  }

  async function saveAnswers() {
    if (!APPS_SCRIPT_URL) {
      console.warn('Configure appsScriptUrl em config.js — veja SETUP.md');
      return;
    }
    try {
      const payload = {
        timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        ...SURVEY_CONTEXT,
        ...answers
      };
      if (SUBMIT_TOKEN) payload._token = SUBMIT_TOKEN;

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Erro ao salvar respostas:', e);
    }
  }

  function renderEndCard() {
    const card = document.createElement('div');
    card.className = 'end-card';
    const ico = document.createElement('span');
    ico.className = 'ico';
    ico.textContent = END.emoji || '✅';
    const h2 = document.createElement('h2');
    h2.textContent = END.title || 'Obrigado!';
    const p = document.createElement('p');
    p.textContent = END.text || '';
    card.appendChild(ico);
    card.appendChild(h2);
    card.appendChild(p);
    chat.appendChild(card);
    scrollDown();
  }

  async function showEnd() {
    hideInput();
    await saveAnswers();
    await botSay(END.botMessages || ['Obrigado pela participação!'], 600);
    renderEndCard();
  }

  function applyHeaderConfig() {
    const titleEl = document.getElementById('hdrTitle');
    const logoEl = document.getElementById('hdrLogo');
    const pageTitle = CFG.surveyTitle || 'Pesquisa';
    document.title = pageTitle;
    if (titleEl) titleEl.textContent = pageTitle;
    if (logoEl && CFG.logoUrl) {
      logoEl.src = CFG.logoUrl;
      logoEl.alt = pageTitle;
      logoEl.classList.remove('hidden');
      if (titleEl) titleEl.classList.add('hidden');
    }
  }

  function fixHeight() {
    const shell = document.querySelector('.shell');
    if (shell) shell.style.height = window.innerHeight + 'px';
  }

  window.submitMulti = submitMulti;
  window.submitText = submitText;
  window.onKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitText();
    }
  };
  window.autoResize = function (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  };

  window.addEventListener('DOMContentLoaded', function () {
    if (!qs.length) {
      console.error('PESQUISA_QUESTIONS vazio — edite questions.js');
      return;
    }
    applyHeaderConfig();
    fixHeight();
    window.addEventListener('resize', fixHeight);
    updProg();
    nextStep();
  });
})();
