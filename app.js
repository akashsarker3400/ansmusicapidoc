/* The documentation's small amount of behaviour: theme, code tabs, copy,
   the on-page contents, the search palette, and the rail on a phone.
   No framework — it is a page of text. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ── theme ─────────────────────────────────────────────────────── */
  const root = document.documentElement;
  $('#theme').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ans-doc-theme', next); } catch (e) {}
  });

  /* ── code: tabs and copy ───────────────────────────────────────── */
  $$('.code').forEach(block => {
    const pres = $$('pre', block);
    const tabs = $$('[role=tab]', block);
    if (tabs.length) {
      tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
        pres.forEach(p => { p.hidden = p.dataset.tab !== tab.dataset.tab; });
        /* Remember the language across the page. */
        $$('.code [role=tab]').forEach(t => {
          if (t.dataset.tab === tab.dataset.tab && t.closest('.code') !== block) t.click();
        });
      }, { passive: true }));
    }
    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const pre = pres.find(p => !p.hidden) || pres[0];
      try {
        await navigator.clipboard.writeText(pre.innerText);
        btn.textContent = 'Copied';
      } catch (e) {
        btn.textContent = 'Select and copy';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
    block.appendChild(btn);
  });
  /* Endpoint bodies have bare <pre>s; give those a copy button too. */
  $$('.ep-body > pre, .two pre').forEach(pre => {
    if (pre.closest('.code')) return;
    const wrap = document.createElement('div');
    wrap.className = 'code';
    wrap.style.margin = '0';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    const btn = document.createElement('button');
    btn.className = 'copy'; btn.type = 'button'; btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pre.innerText); btn.textContent = 'Copied'; }
      catch (e) { btn.textContent = 'Select and copy'; }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
    wrap.appendChild(btn);
  });

  /* ── on-page contents + scrollspy ──────────────────────────────── */
  const headings = $$('main h2[id], main section h2, main h3[id]').filter(h => h.closest('section')?.id);
  const tocList = $('#toc-list');
  const entries = [];
  $$('main section').forEach(section => {
    const h2 = $('h2', section);
    if (!h2) return;
    const a = document.createElement('a');
    a.href = '#' + section.id;
    a.textContent = h2.textContent.replace(/^\d+\s*/, '').replace(/#$/, '').trim();
    tocList.appendChild(a);
    entries.push({ el: section, a });
    $$('h3[id]', section).forEach(h3 => {
      const b = document.createElement('a');
      b.href = '#' + h3.id; b.className = 'h3';
      b.textContent = h3.textContent.replace(/#$/, '').trim();
      tocList.appendChild(b);
      entries.push({ el: h3, a: b });
    });
  });

  const railLinks = $$('.rail a');
  const setActive = id => {
    railLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  };
  const spy = () => {
    const y = window.scrollY + 120;
    let current = entries[0];
    for (const e of entries) if (e.el.offsetTop <= y) current = e;
    if (!current) return;
    entries.forEach(e => e.a.classList.toggle('active', e === current));
    /* The rail highlights the nearest thing it lists. */
    let id = current.el.id;
    if (!railLinks.some(a => a.getAttribute('href') === '#' + id)) id = current.el.closest('section')?.id;
    setActive(id);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { spy(); ticking = false; });
  }, { passive: true });
  spy();

  /* ── the rail on a phone ───────────────────────────────────────── */
  const rail = $('#rail');
  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = rail.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  rail.addEventListener('click', e => {
    if (e.target.closest('a')) { rail.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  /* ── search ────────────────────────────────────────────────────── */
  const palette = $('#palette');
  const input = $('#palette-input');
  const results = $('#palette-results');

  /* Everything with an id and a heading, plus each table row's first cell —
     so a field name or an event name is findable. */
  const index = [];
  $$('main section').forEach(section => {
    const title = $('h2', section)?.textContent.replace(/^\d+\s*/, '').replace(/#$/, '').trim();
    index.push({ text: title, sub: 'Section', href: '#' + section.id, verb: '' });
    $$('h3[id], h4[id]', section).forEach(h => {
      index.push({ text: h.textContent.replace(/#$/, '').trim(), sub: title, href: '#' + h.id, verb: '' });
    });
    $$('.ep', section).forEach(ep => {
      const verb = $('.verb', ep)?.textContent.trim();
      const path = $('.ep-path', ep)?.textContent.trim();
      const h = ep.previousElementSibling?.matches('h3[id]') ? ep.previousElementSibling : ep.closest('section');
      index.push({ text: path, sub: title, href: '#' + h.id, verb });
    });
    $$('tbody tr', section).forEach(tr => {
      const cell = tr.querySelector('td code, td .pill');
      if (!cell) return;
      const h = tr.closest('.ep')?.previousElementSibling?.id ? tr.closest('.ep').previousElementSibling
              : (() => { let p = tr.closest('.tw'); while (p && !(p.matches('h3[id]') )) p = p.previousElementSibling; return p; })();
      index.push({ text: cell.textContent.trim(), sub: (h?.textContent || title).replace(/#$/, '').trim(), href: '#' + (h?.id || section.id), verb: '' });
    });
  });
  const seen = new Set();
  const uniq = index.filter(i => { const k = i.text + i.href; if (seen.has(k)) return false; seen.add(k); return true; });

  const render = q => {
    const needle = q.trim().toLowerCase();
    const hits = needle
      ? uniq.filter(i => (i.text + ' ' + i.sub + ' ' + i.verb).toLowerCase().includes(needle)).slice(0, 14)
      : uniq.filter(i => i.sub === 'Section').slice(0, 14);
    results.innerHTML = hits.length
      ? hits.map((h, i) => `<a href="${h.href}" class="${i === 0 ? 'hl' : ''}">${h.verb ? `<span class="v">${h.verb}</span>` : ''}${esc(h.text)}<small>${esc(h.sub)}</small></a>`).join('')
      : `<div class="empty">Nothing matches “${esc(q)}”.</div>`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const open = () => { palette.showModal(); input.value = ''; render(''); input.focus(); };
  $('#search-open').addEventListener('click', open);
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : open(); }
    if (e.key === '/' && !palette.open && !/input|textarea/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); open(); }
  });
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); palette.close(); return; }
    const items = $$('a', results);
    const at = items.findIndex(a => a.classList.contains('hl'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      items.forEach(a => a.classList.remove('hl')); next?.classList.add('hl'); next?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') { e.preventDefault(); items[at]?.click(); }
  });
  results.addEventListener('click', e => { if (e.target.closest('a')) palette.close(); });
  palette.addEventListener('click', e => { if (e.target === palette) palette.close(); });

  /* A hash arrived before the fonts did; the layout moved under it. */
  if (location.hash && document.fonts?.ready) {
    document.fonts.ready.then(() => document.querySelector(location.hash)?.scrollIntoView());
  }

  $('#year').textContent = String(new Date().getFullYear());
})();
