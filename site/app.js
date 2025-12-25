(() => {
  'use strict';

  let all = [];
  let activeIndex = -1;
  let lastList = [];

  const $ = (id) => document.getElementById(id);

  function norm(s) { return (s || '').toLowerCase(); }

  function score(it, q) {
    const qi = norm(q);
    const n = norm(it.name);
    const d = norm(it.description);
    const ni = n.indexOf(qi);
    const di = d.indexOf(qi);
    if (ni < 0 && di < 0) return -1;
    let s = 0;
    if (ni >= 0) s += 1000 + (200 - Math.min(ni, 200));
    if (di >= 0) s += 100 + (80 - Math.min(di, 80));
    return s;
  }

  function topMatches(q, limit) {
    if (!q) return all.slice(0, limit);
    return all
      .map(it => ({ it, s: score(it, q) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(x => x.it);
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  function setActiveSuggestion(ul, idx) {
    activeIndex = idx;
    [...ul.children].forEach((c, i) => c.classList.toggle('active', i === idx));
  }

  function renderSuggestions(q) {
    const ul = $('suggest');
    ul.innerHTML = '';
    activeIndex = -1;

    const list = q ? topMatches(q, 10) : [];
    if (!list.length) { ul.style.display = 'none'; return; }

    ul.style.display = 'block';
    list.forEach((it, idx) => {
      const li = document.createElement('li');
      li.textContent = `${it.name} — ${it.platform}`;
      li.onclick = () => openDoc(it);
      li.onmouseenter = () => setActiveSuggestion(ul, idx);
      ul.appendChild(li);
    });
  }

  function renderResults(q) {
    const ul = $('results');
    ul.innerHTML = '';

    lastList = topMatches(q, q ? 80 : 120);
    $('count').textContent = `${lastList.length} shown`;

    lastList.forEach((it) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row';
      btn.innerHTML = `<span class="cmd">${escapeHtml(it.name)}</span>
                       <span class="plat">${escapeHtml(it.platform)}</span>
                       <span class="desc">${escapeHtml(it.description || '')}</span>`;
      btn.onclick = () => openDoc(it);
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  async function openDoc(it) {
    $('suggest').style.display = 'none';

    $('docTitle').textContent = it.name;
    const raw = it.doc;
    const rawLink = $('rawLink');
    rawLink.href = raw;
    rawLink.style.display = 'inline-flex';

    const res = await fetch(raw, { cache: 'no-store' });
    const md = await res.text();

    if (window.marked && typeof window.marked.parse === 'function') {
      $('doc').innerHTML = window.marked.parse(md);
    } else {
      $('doc').innerHTML = `<pre>${escapeHtml(md)}</pre>`;
    }
  }

  function initTheme() {
    const KEY = 'cmdbrut_theme';
    const root = document.documentElement;
    const btn = $('themeBtn');

    function set(mode) {
      root.setAttribute('data-color-mode', mode);
      localStorage.setItem(KEY, mode);
      btn.textContent = mode === 'dark' ? 'Light' : 'Dark';
    }

    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') set(saved);
    else set(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    btn.onclick = () => set(root.getAttribute('data-color-mode') === 'dark' ? 'light' : 'dark');
  }

  function wireEvents() {
    const q = $('q');

    q.addEventListener('input', () => {
      const v = q.value.trim();
      renderSuggestions(v);
      renderResults(v);
    });

    q.addEventListener('keydown', (e) => {
      const sug = $('suggest');
      const items = [...sug.children];

      if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        setActiveSuggestion(sug, Math.min(activeIndex + 1, items.length - 1));
        return;
      }
      if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        setActiveSuggestion(sug, Math.max(activeIndex - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        const v = q.value.trim();
        if (items.length && activeIndex >= 0) items[activeIndex].click();
        else if (v && lastList.length) openDoc(lastList[0]);
        return;
      }
      if (e.key === 'Escape') $('suggest').style.display = 'none';
    });

    document.addEventListener('click', (e) => {
      const box = e.target.closest('.searchbox');
      if (!box) $('suggest').style.display = 'none';
    });
  }

  async function loadIndex() {
    const res = await fetch('index.json', { cache: 'no-store' });
    all = await res.json();
    renderResults('');
  }

  initTheme();
  wireEvents();
  loadIndex();
})();
