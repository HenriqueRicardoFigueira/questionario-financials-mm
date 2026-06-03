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
  let pendingScale = null;
  let pendingSingle = null;
  let outroTextMode = false;
  let textConfirmMode = false;

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

  function currentQuestion() {
    return qs[step] || null;
  }

  function currentAction() {
    const q = currentQuestion();
    return q && q.action ? q.action : {};
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
    const answered = Object.keys(answers).filter(function (k) { return /^q\d+$/.test(k); }).length;
    const pct = TOTAL ? Math.round((answered / TOTAL) * 100) : 0;
    document.getElementById('pFill').style.width = pct + '%';
    document.getElementById('pLbl').textContent = answered + '/' + TOTAL;
  }

  function resetPending() {
    pendingScale = null;
    pendingSingle = null;
    outroTextMode = false;
  }

  function showConfirm(visible, enabled, label) {
    const cfm = document.getElementById('cfm');
    if (!visible) {
      cfm.classList.add('hidden');
      cfm.style.display = 'none';
      cfm.disabled = false;
      return;
    }
    cfm.classList.remove('hidden');
    cfm.style.display = 'block';
    cfm.disabled = !enabled;
    cfm.textContent = label || 'Confirmar →';
  }

  function hideInput() {
    document.getElementById('opts').classList.add('hidden');
    showConfirm(false);
    const tw = document.getElementById('txtWrap');
    tw.classList.add('hidden');
    tw.classList.remove('outro-inline', 'text-confirm-mode');
    const inp = document.getElementById('txtIn');
    inp.rows = 1;
    inp.classList.remove('txt-in-large');
    const counter = document.getElementById('txtCount');
    if (counter) counter.classList.add('hidden');
    document.getElementById('scl').classList.add('hidden');
    textConfirmMode = false;
    resetPending();
  }

  function getTextMaxLen(action) {
    return action.maxLen || MAX_TEXT_LEN;
  }

  function updateCharCounter() {
    const counter = document.getElementById('txtCount');
    const inp = document.getElementById('txtIn');
    if (!counter || !inp) return;
    if (textConfirmMode) {
      const maxLen = getTextMaxLen(currentAction());
      counter.classList.remove('hidden');
      counter.textContent = inp.value.length + ' / ' + maxLen;
      return;
    }
    counter.classList.add('hidden');
  }

  function highlightSingleOption(val) {
    document.querySelectorAll('.opt').forEach(function (b) {
      b.classList.toggle('sel', b.textContent === val);
    });
  }

  function showOutroField(ph) {
    const tw = document.getElementById('txtWrap');
    const inp = document.getElementById('txtIn');
    tw.classList.remove('hidden');
    tw.classList.add('outro-inline');
    inp.value = '';
    inp.maxLength = MAX_TEXT_LEN;
    inp.placeholder = ph || 'Descreva o motivo...';
    inp.dataset.outro = '';
    inp.dataset.outroKey = '';
    setTimeout(function () { inp.focus(); }, 300);
    updateOutroConfirmState();
  }

  function updateOutroConfirmState() {
    const inp = document.getElementById('txtIn');
    if (outroTextMode) {
      const hasText = inp.value.trim().length > 0;
      showConfirm(true, hasText, 'Confirmar →');
      return;
    }
    updateMultiConfirmState();
  }

  function multiHasOutroSelected() {
    const outroOpt = currentAction().outro;
    return outroOpt && multi.indexOf(outroOpt) >= 0;
  }

  function updateMultiConfirmState() {
    const action = currentAction();
    if (action.type !== 'multi') return;
    const outroOpt = action.outro;
    const count = multi.length;
    if (outroOpt && multiHasOutroSelected()) {
      outroTextMode = true;
      const tw = document.getElementById('txtWrap');
      if (tw.classList.contains('hidden')) {
        showOutroField('Descreva o outro motivo...');
      }
      const hasText = document.getElementById('txtIn').value.trim().length > 0;
      showConfirm(true, count > 0 && hasText, count > 0 ? 'Confirmar (' + count + ') →' : 'Confirmar →');
      return;
    }
    outroTextMode = false;
    document.getElementById('txtWrap').classList.add('hidden');
    document.getElementById('txtWrap').classList.remove('outro-inline');
    showConfirm(true, count > 0, count > 0 ? 'Confirmar (' + count + ') →' : 'Confirmar →');
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
    const cfm = document.getElementById('cfm');

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
        cfm.onclick = submitMulti;
        updateMultiConfirmState();
      } else if (action.confirm) {
        cfm.onclick = submitConfirm;
        showConfirm(false);
      }
    } else if (type === 'text') {
      const tw = document.getElementById('txtWrap');
      const inp = document.getElementById('txtIn');
      const maxLen = getTextMaxLen(action);
      tw.classList.remove('hidden');
      inp.value = '';
      inp.maxLength = maxLen;
      inp.placeholder = ph || 'Digite aqui...';
      if (action.large) {
        inp.rows = 4;
        inp.classList.add('txt-in-large');
      } else {
        inp.rows = 1;
        inp.classList.remove('txt-in-large');
      }
      if (action.confirm) {
        textConfirmMode = true;
        tw.classList.add('text-confirm-mode');
        cfm.onclick = commitTextConfirm;
        showConfirm(true, true, 'Confirmar →');
        updateCharCounter();
      }
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
      if (action.confirm) {
        cfm.onclick = submitConfirm;
        showConfirm(false);
      }
    }
    scrollDown();
  }

  async function pickSingle(val) {
    const action = currentAction();
    const outroOpt = action.outro || 'Outro';

    if (action.confirm) {
      pendingSingle = val;
      highlightSingleOption(val);
      if (val === outroOpt) {
        outroTextMode = true;
        showOutroField('Descreva o outro motivo...');
        return;
      }
      outroTextMode = false;
      document.getElementById('txtWrap').classList.add('hidden');
      document.getElementById('txtWrap').classList.remove('outro-inline');
      showConfirm(true, true, 'Confirmar →');
      return;
    }

    hideInput();
    await addBubble(val, 'user');
    const key = currentQuestion().key;
    if (key) answers[key] = val;
    step++;
    updProg();
    await nextStep();
  }

  function syncMultiOptionButtons() {
    document.querySelectorAll('#opts .opt').forEach(function (b) {
      b.classList.toggle('sel', multi.indexOf(b.textContent) >= 0);
    });
  }

  function toggleMulti(val, btn, max) {
    const action = currentAction();
    const outroOpt = action.outro;
    const exclusiveOpt = action.exclusive;
    const idx = multi.indexOf(val);

    if (idx >= 0) {
      multi.splice(idx, 1);
      btn.classList.remove('sel');
    } else if (exclusiveOpt && val === exclusiveOpt) {
      multi = [exclusiveOpt];
      syncMultiOptionButtons();
    } else {
      if (exclusiveOpt) {
        const exIdx = multi.indexOf(exclusiveOpt);
        if (exIdx >= 0) {
          multi.splice(exIdx, 1);
          syncMultiOptionButtons();
        }
      }
      if (max && multi.length >= max) return;
      multi.push(val);
      btn.classList.add('sel');
    }

    if (outroOpt && val === outroOpt && idx < 0) {
      outroTextMode = true;
      showOutroField('Descreva o outro motivo...');
    } else if (outroOpt && idx >= 0 && val === outroOpt) {
      outroTextMode = false;
      document.getElementById('txtWrap').classList.add('hidden');
      document.getElementById('txtWrap').classList.remove('outro-inline');
    }
    updateMultiConfirmState();
  }

  async function submitMulti() {
    if (!multi.length) return;
    const action = currentAction();
    const outroOpt = action.outro;
    let saved = multi.slice();
    if (outroOpt && multiHasOutroSelected()) {
      const text = document.getElementById('txtIn').value.trim().slice(0, MAX_TEXT_LEN);
      if (!text) return;
      saved = saved.map(function (v) {
        return v === outroOpt ? outroOpt + ': ' + text : v;
      });
    }
    const val = saved.join(', ');
    hideInput();
    await addBubble(val, 'user');
    const key = currentQuestion().key;
    if (key) answers[key] = saved;
    step++;
    updProg();
    await nextStep();
  }

  async function commitTextConfirm() {
    const action = currentAction();
    const maxLen = getTextMaxLen(action);
    const val = document.getElementById('txtIn').value.trim().slice(0, maxLen);
    if (!val && !action.optional) return;
    hideInput();
    if (val) await addBubble(val, 'user');
    const key = currentQuestion().key;
    if (key) answers[key] = val;
    step++;
    updProg();
    await nextStep();
  }

  async function submitConfirm() {
    if (pendingScale != null) {
      await commitScale(pendingScale);
      return;
    }
    if (pendingSingle != null) {
      await commitSingle(pendingSingle);
    }
  }

  async function commitScale(val) {
    hideInput();
    const labels = currentAction().scaleLabels || {};
    const display = labels[val] ? val + ' – ' + labels[val] : String(val);
    await addBubble(display, 'user');
    const key = currentQuestion().key;
    if (key) answers[key] = val;
    step++;
    updProg();
    await nextStep();
  }

  async function commitSingle(val) {
    const action = currentAction();
    const outroOpt = action.outro || 'Outro';
    let finalVal = val;

    if (val === outroOpt) {
      const text = document.getElementById('txtIn').value.trim().slice(0, MAX_TEXT_LEN);
      if (!text) return;
      finalVal = outroOpt + ': ' + text;
    }

    hideInput();
    await addBubble(finalVal, 'user');
    const key = currentQuestion().key;
    if (key) answers[key] = finalVal;
    step++;
    updProg();
    await nextStep();
  }

  async function pickScale(val, btn) {
    const action = currentAction();
    document.querySelectorAll('.scl-btn').forEach(function (b) { b.classList.remove('sel'); });
    btn.classList.add('sel');

    if (action.confirm) {
      pendingScale = val;
      showConfirm(true, true, 'Confirmar →');
      return;
    }

    await wait(220);
    await commitScale(val);
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

  function formatAnswerForSummary(q, raw) {
    const action = q.action || {};
    if (raw === undefined || raw === null || raw === '') {
      return action.optional ? '(não informado)' : '—';
    }
    if (action.type === 'scale' && action.scaleLabels) {
      const n = Number(raw);
      const lbl = action.scaleLabels[n];
      return lbl ? n + ' – ' + lbl : String(raw);
    }
    if (Array.isArray(raw)) return raw.join('; ');
    return String(raw);
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
    card.appendChild(ico);

    const h2 = document.createElement('h2');
    h2.textContent = END.title || 'Obrigado!';
    card.appendChild(h2);

    if (END.showSummary !== false) {
      const sumTitle = document.createElement('h3');
      sumTitle.className = 'end-summary-title';
      sumTitle.textContent = END.summaryTitle || 'Resumo das suas respostas';
      card.appendChild(sumTitle);

      const list = document.createElement('dl');
      list.className = 'end-summary';
      qs.forEach(function (q) {
        if (!q.key) return;
        const dt = document.createElement('dt');
        dt.textContent = q.label || q.key;
        const dd = document.createElement('dd');
        dd.textContent = formatAnswerForSummary(q, answers[q.key]);
        list.appendChild(dt);
        list.appendChild(dd);
      });
      card.appendChild(list);
    }

    const p = document.createElement('p');
    p.textContent = END.text || '';
    card.appendChild(p);
    chat.appendChild(card);
    scrollDown();
  }

  async function showEnd() {
    hideInput();
    await saveAnswers();
    await botSay(END.botMessages || ['Obrigado pela participação!'], 600);
    renderEndCard();
    updProg();
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
  window.submitConfirm = submitConfirm;
  window.commitTextConfirm = commitTextConfirm;
  window.submitText = function () {
    if (textConfirmMode) {
      commitTextConfirm();
      return;
    }
    if (outroTextMode && currentAction().type === 'single') {
      submitConfirm();
      return;
    }
    if (outroTextMode && currentAction().type === 'multi') {
      submitMulti();
      return;
    }
    const inp = document.getElementById('txtIn');
    const val = inp.value.trim().slice(0, MAX_TEXT_LEN);
    if (!val) return;
    hideInput();
    addBubble(val, 'user').then(function () {
      if (currentQuestion().key) answers[currentQuestion().key] = val;
      step++;
      updProg();
      nextStep();
    });
  };
  window.onKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textConfirmMode) commitTextConfirm();
      else if (outroTextMode && currentAction().type === 'single') submitConfirm();
      else if (outroTextMode && currentAction().type === 'multi') submitMulti();
      else window.submitText();
    }
  };
  window.autoResize = function (el) {
    el.style.height = 'auto';
    const cap = el.classList.contains('txt-in-large') ? 160 : 90;
    el.style.height = Math.min(el.scrollHeight, cap) + 'px';
    updateCharCounter();
    updateOutroConfirmState();
  };

  window.addEventListener('DOMContentLoaded', function () {
    if (!qs.length) {
      console.error('PESQUISA_QUESTIONS vazio — edite questions.js');
      return;
    }
    const inp = document.getElementById('txtIn');
    if (inp) {
      inp.addEventListener('input', function () {
        updateCharCounter();
        updateOutroConfirmState();
      });
    }
    applyHeaderConfig();
    fixHeight();
    window.addEventListener('resize', fixHeight);
    updProg();
    nextStep();
  });
})();
