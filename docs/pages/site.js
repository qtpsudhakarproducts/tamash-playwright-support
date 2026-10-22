(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  /* ---- theme ---- */
  var themeBtn = doc.querySelector('[data-theme-toggle]');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tp-theme', next); } catch (e) {}
    });
  }

  /* ---- mobile menu ---- */
  var menuBtn = doc.querySelector('.menu-toggle');
  var sidebar = doc.querySelector('.sidebar');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', function () {
      var open = sidebar.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  } else if (menuBtn) {
    menuBtn.hidden = true;
  }

  /* ---- copy buttons on code blocks ---- */
  doc.querySelectorAll('.doc pre').forEach(function (pre) {
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to the clipboard');
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = (code || pre).innerText.replace(/\n$/, '');
      function done(ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
    pre.appendChild(btn);
  });

  /* ---- language tabs on the home page ---- */
  doc.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('[role=tab]');
    var panels = group.querySelectorAll('[data-panel]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== tab.getAttribute('data-tab'); });
      });
    });
  });

  /* ---- current heading in the table of contents ---- */
  var links = Array.prototype.slice.call(doc.querySelectorAll('.toc a'));
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (a && e.isIntersecting) {
          links.forEach(function (x) { x.classList.remove('active'); });
          a.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -75% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* ---- search ---- */
  var dialog = doc.getElementById('search');
  var input = doc.getElementById('search-input');
  var list = doc.getElementById('search-results');
  var index = window.__SEARCH_INDEX__ || [];
  var active = -1;
  var lastFocus = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function terms(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }

  function score(entry, ts) {
    var total = 0;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      var s = 0;
      if (entry.title.toLowerCase().indexOf(t) !== -1) s += entry.kind === 'page' ? 12 : 8;
      if (entry.hay.indexOf(t) !== -1) s += 3;
      if (!s) return 0;
      total += s;
    }
    return total;
  }

  function snippet(entry, ts) {
    var text = entry.text || '';
    var low = text.toLowerCase();
    var at = -1;
    for (var i = 0; i < ts.length && at < 0; i++) at = low.indexOf(ts[i]);
    if (at < 0) return escapeHtml(text.slice(0, 110));
    var start = Math.max(0, at - 40);
    var piece = text.slice(start, start + 120);
    var html = escapeHtml(piece);
    ts.forEach(function (t) {
      html = html.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return (start > 0 ? '… ' : '') + html + (start + 120 < text.length ? ' …' : '');
  }

  function render(q) {
    var ts = terms(q);
    list.innerHTML = '';
    active = -1;
    if (!ts.length) {
      var pages = index.filter(function (e) { return e.kind === 'page'; }).slice(0, 8);
      pages.forEach(function (e) { list.appendChild(item(e, ts)); });
      return;
    }
    var hits = index
      .map(function (e) { return { e: e, s: score(e, ts) }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 10);
    if (!hits.length) {
      var li = doc.createElement('li');
      li.className = 'search-empty';
      li.textContent = 'Nothing found for “' + q + '”. Try a shorter word.';
      list.appendChild(li);
      return;
    }
    hits.forEach(function (h) { list.appendChild(item(h.e, ts)); });
    setActive(0);
  }

  function item(e, ts) {
    var li = doc.createElement('li');
    li.setAttribute('role', 'option');
    var a = doc.createElement('a');
    a.href = e.url;
    a.innerHTML =
      '<span class="r-title">' + escapeHtml(e.title) + '</span>' +
      '<span class="r-where">' + escapeHtml(e.where) + '</span>' +
      (ts.length ? '<span class="r-snippet">' + snippet(e, ts) + '</span>' : '');
    li.appendChild(a);
    return li;
  }

  function setActive(n) {
    var items = list.querySelectorAll('li[role=option]');
    if (!items.length) return;
    active = (n + items.length) % items.length;
    items.forEach(function (li, i) {
      li.classList.toggle('active', i === active);
      li.setAttribute('aria-selected', String(i === active));
    });
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function openSearch() {
    if (!dialog) return;
    lastFocus = doc.activeElement;
    dialog.hidden = false;
    input.value = '';
    render('');
    input.focus();
  }
  function closeSearch() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (dialog && input) {
    doc.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    doc.querySelectorAll('[data-search-close]').forEach(function (b) { b.addEventListener('click', closeSearch); });
    dialog.addEventListener('mousedown', function (e) { if (e.target === dialog) closeSearch(); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') {
        var cur = list.querySelector('li.active a') || list.querySelector('li[role=option] a');
        if (cur) { e.preventDefault(); window.location.href = cur.href; }
      }
    });
    doc.addEventListener('keydown', function (e) {
      var typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dialog.hidden ? openSearch() : closeSearch(); }
      else if (e.key === '/' && !typing && dialog.hidden) { e.preventDefault(); openSearch(); }
      else if (e.key === 'Escape') closeSearch();
    });
  }
})();
