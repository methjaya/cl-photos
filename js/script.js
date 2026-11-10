(function(){
  var N = 30;
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function $(s){ return document.querySelector(s); }
  var photos = [];
  for (var k = 0; k < N; k++) photos.push({ i: k, id: 'p' + pad(k + 1), n: k + 1 });
  var thumb = function(i){ return 'thumb/' + photos[i].id + '.jpg'; };
  var full = function(i){ return 'img/' + photos[i].id + '.jpg'; };

  var order = photos.map(function(p){ return p.i; });
  var view = 'mosaic', onlyFav = false, shuffled = false;
  var favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem('clr-favs') || '[]')); } catch(e) {}
  function saveFavs(){ try { localStorage.setItem('clr-favs', JSON.stringify(Array.from(favs))); } catch(e) {} }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  var gal = $('#gallery');
  function visible(){ return order.filter(function(i){ return !onlyFav || favs.has(i); }); }
  function shuf(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var heartSvg = '<svg><use href="#i-heart"/></svg>';

  /* ---------- gallery ---------- */
  function tileHTML(i, pos){
    var big = view === 'mosaic' && pos % 7 === 0;
    var src = big ? full(i) : thumb(i);
    var on = favs.has(i);
    return '<figure class="tile' + (big ? ' big' : '') + '" data-i="' + i + '" style="--d:' + Math.min(pos, 18) + '">' +
      '<div class="card" tabindex="0" role="button" aria-label="Open photo ' + photos[i].n + '">' +
      '<img src="' + src + '" alt="Office photo ' + photos[i].n + '" loading="lazy" draggable="false">' +
      '<button class="heart" type="button" aria-label="Favorite photo ' + photos[i].n + '" aria-pressed="' + on + '">' + heartSvg + '</button>' +
      '<span class="no">No. ' + pad(photos[i].n) + '</span></div></figure>';
  }
  function render(){
    var list = visible();
    gal.className = 'gallery' + (view === 'scatter' ? ' scatter' : '');
    gal.style.height = '';
    if (!list.length){
      gal.innerHTML = '<div class="empty"><div><b>No favorites yet</b>Tap the heart on any photo to keep it here.</div></div>';
      gal.style.setProperty('--row', '160px');
    } else {
      gal.innerHTML = list.map(function(i, pos){ return tileHTML(i, pos); }).join('');
    }
    $('#count').textContent = (onlyFav ? list.length + ' of ' + N : N) + ' photos';
    var fn = favs.size;
    $('#favN').textContent = fn ? 'Favorites ' + fn : 'Favorites';
    layout();
  }
  function layout(){
    if (view === 'scatter') return layoutScatter();
    var cs = getComputedStyle(gal);
    var cols = cs.gridTemplateColumns.split(' ').length || 4;
    var gap = parseFloat(cs.columnGap) || 12;
    var row = (gal.clientWidth - (cols - 1) * gap) / cols / 1.5;
    gal.style.setProperty('--row', row + 'px');
  }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function layoutScatter(){
    var tiles = gal.querySelectorAll('.tile');
    if (!tiles.length){ gal.style.height = '200px'; return; }
    var W = gal.clientWidth;
    var cw = W < 600 ? Math.min(180, W * 0.46) : W < 900 ? 220 : 250;
    var ch = (cw - 16) / 1.5 + 8 + 38;
    var cols = Math.max(2, Math.floor(W / (cw * 0.78)));
    var sx = cols > 1 ? (W - cw) / (cols - 1) : 0;
    var sy = ch * 0.8;
    var rows = Math.ceil(tiles.length / cols);
    gal.style.setProperty('--cw', cw + 'px');
    gal.style.setProperty('--ch', ch + 'px');
    gal.style.height = (rows * sy + ch * 0.4 + 30) + 'px';
    tiles.forEach(function(t, n){
      var c = n % cols, r = Math.floor(n / cols);
      var x = Math.max(0, Math.min(W - cw, c * sx + rnd(-16, 16)));
      var y = Math.max(0, r * sy + rnd(-12, 12));
      t.style.left = x + 'px'; t.style.top = y + 'px';
      t.style.setProperty('--rot', rnd(-8, 8).toFixed(1) + 'deg');
      t.style.zIndex = n + 1;
    });
  }
  new ResizeObserver(function(){ if (view !== 'scatter') layout(); }).observe(gal);
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if (view === 'scatter') layoutScatter(); }, 200); });

  /* tilt */
  gal.addEventListener('pointermove', function(e){
    if (!fine || reduce || view === 'scatter') return;
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
    card.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (x * 100) + '%');
    card.style.setProperty('--my', (y * 100) + '%');
  });
  gal.addEventListener('pointerout', function(e){
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (card && !card.contains(e.relatedTarget)){ card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); }
  });

  /* clicks, hearts, scatter drag */
  var dragged = false;
  gal.addEventListener('click', function(e){
    var hb = e.target.closest('.heart');
    var tile = e.target.closest('.tile');
    if (!tile) return;
    var i = +tile.dataset.i;
    if (hb){ e.stopPropagation(); toggleFav(i, hb); return; }
    if (dragged){ dragged = false; return; }
    openLB(i, tile.querySelector('.card img'));
  });
  gal.addEventListener('keydown', function(e){
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')){
      e.preventDefault(); openLB(+e.target.parentNode.dataset.i, e.target.querySelector('img'));
    }
  });
  var drag = null;
  gal.addEventListener('pointerdown', function(e){
    if (view !== 'scatter' || e.target.closest('.heart')) return;
    var tile = e.target.closest('.tile'); if (!tile) return;
    drag = { t: tile, sx: e.clientX, sy: e.clientY, ox: tile.offsetLeft, oy: tile.offsetTop, moved: false, id: e.pointerId };
    var z = 0; gal.querySelectorAll('.tile').forEach(function(t){ z = Math.max(z, +t.style.zIndex || 0); });
    tile.style.zIndex = z + 1;
    try { tile.setPointerCapture(e.pointerId); } catch(err) {}
  });
  gal.addEventListener('pointermove', function(e){
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    drag.moved = true; drag.t.classList.add('drag');
    var W = gal.clientWidth, H = gal.clientHeight;
    var x = Math.max(0, Math.min(W - drag.t.offsetWidth, drag.ox + dx));
    var y = Math.max(0, Math.min(H - drag.t.offsetHeight + 20, drag.oy + dy));
    drag.t.style.left = x + 'px'; drag.t.style.top = y + 'px';
  });
  function endDrag(){ if (!drag) return; drag.t.classList.remove('drag'); dragged = drag.moved; drag = null; if (dragged) setTimeout(function(){ dragged = false; }, 60); }
  gal.addEventListener('pointerup', endDrag); gal.addEventListener('pointercancel', endDrag);

  function toggleFav(i, srcEl){
    var on = !favs.has(i);
    if (on) favs.add(i); else favs.delete(i);
    saveFavs();
    var tile = gal.querySelector('.tile[data-i="' + i + '"] .heart');
    if (tile) tile.setAttribute('aria-pressed', on);
    $('#favN').textContent = favs.size ? 'Favorites ' + favs.size : 'Favorites';
    if (lbOpen && cur === i) $('#lbFav').setAttribute('aria-pressed', on);
    if (on && srcEl) burst(srcEl);
    if (onlyFav && !on && !lbOpen) render();
  }
  function burst(el){
    if (reduce) return;
    var r = el.getBoundingClientRect();
    for (var k = 0; k < 7; k++){
      var s = document.createElement('span');
      s.className = 'burst';
      s.innerHTML = '<svg width="16" height="16"><use href="#i-heart"/></svg>';
      s.style.left = (r.left + r.width / 2 - 8) + 'px'; s.style.top = (r.top + r.height / 2 - 8) + 'px';
      s.style.setProperty('--bx', rnd(-60, 60) + 'px'); s.style.setProperty('--by', rnd(-110, -40) + 'px');
      document.body.appendChild(s); setTimeout(function(n){ n.remove(); }.bind(null, s), 1000);
    }
  }

  /* controls */
  var seg = $('#seg'), segThumb = $('#segThumb');
  function moveThumb(){
    var b = seg.querySelector('[aria-pressed="true"]');
    segThumb.style.width = b.offsetWidth + 'px';
    segThumb.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
  }
  seg.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    view = b.dataset.v;
    seg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
    moveThumb(); render();
  });
  $('#shuffle').addEventListener('click', function(){
    if (shuffled && false) return;
    order = shuf(order); shuffled = true; $('#shuffle').textContent = 'Shuffle again'; render();
  });
  $('#favBtn').addEventListener('click', function(){
    onlyFav = !onlyFav; this.setAttribute('aria-pressed', onlyFav); render();
  });
  $('#slide').addEventListener('click', function(){
    var l = visible(); if (!l.length) return; openLB(l[0], null); setPlay(true);
  });
  function surprise(){
    var i = Math.floor(Math.random() * N);
    openLB(i, null);
  }
  $('#navSurprise').addEventListener('click', surprise);
  $('#heroSurprise').addEventListener('click', surprise);

  /* ---------- hero fan ---------- */
  var fan = $('#fan');
  var picks = shuf(photos.map(function(p){ return p.i; })).slice(0, 5);
  var pos = [[-92, 6, -9], [-46, -4, -4.5], [0, 0, 0], [46, -4, 4.5], [92, 6, 9]];
  fan.innerHTML = picks.map(function(i, k){
    return '<div class="fc" data-i="' + i + '" tabindex="0" role="button" aria-label="Open photo ' + photos[i].n + '" style="--x:' + pos[k][0] + ';--y:' + pos[k][1] + ';--r:' + pos[k][2] + 'deg;z-index:' + (k === 2 ? 5 : 4 - Math.abs(k - 2)) + '"><img src="' + thumb(i) + '" alt="Office photo ' + photos[i].n + '" draggable="false"></div>';
  }).join('');
  fan.addEventListener('click', function(e){ var c = e.target.closest('.fc'); if (c) openLB(+c.dataset.i, c.querySelector('img')); });
  fan.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ var c = e.target.closest('.fc'); if (c) openLB(+c.dataset.i, c.querySelector('img')); } });
  var cards = fan.querySelectorAll('.fc');
  window.addEventListener('pointermove', function(e){
    if (reduce || !fine) return;
    var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    cards.forEach(function(c, k){
      var d = (k - 2);
      c.style.setProperty('--px', (nx * -26 * (1 + Math.abs(d) * .4)).toFixed(1) + 'px');
      c.style.setProperty('--py', (ny * -14 + d * d * ny * -4).toFixed(1) + 'px');
    });
    glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
  });
  var glow = $('#glow');
  glow.style.transform = 'translate(70vw,20vh)';

  /* scroll progress */
  var sb = $('#scrollbar');
  function sp(){ var h = document.documentElement.scrollHeight - innerHeight; sb.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  addEventListener('scroll', sp, { passive: true }); sp();

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), img = $('#lbImg'), strip = $('#strip'), bar = $('#lbBar');
  var lbOpen = false, cur = 0, list = [], timer = null, playing = false, lastFocus = null;
  var DUR = 3600;

  function buildStrip(){
    strip.innerHTML = list.map(function(i, k){
      return '<button type="button" data-k="' + k + '" aria-label="Go to photo ' + photos[i].n + '"><img src="' + thumb(i) + '" alt="" draggable="false"></button>';
    }).join('');
  }
  function openLB(i, origin){
    list = visible(); if (list.indexOf(i) < 0) list = order.slice();
    lastFocus = document.activeElement;
    buildStrip();
    lbOpen = true; lb.classList.add('open'); document.body.style.overflow = 'hidden';
    show(i, 0);
    if (origin && !reduce){
      var from = origin.getBoundingClientRect();
      requestAnimationFrame(function(){
        var to = img.getBoundingClientRect();
        if (!to.width) return;
        var dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
        var s = from.width / to.width;
        img.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', borderRadius: '8px' }, { transform: 'none', borderRadius: '14px' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    } else if (!reduce){
      img.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    $('#lbClose').focus({ preventScroll: true });
  }
  function closeLB(){
    if (!lbOpen) return;
    setPlay(false);
    lbOpen = false; lb.classList.remove('open'); document.body.style.overflow = '';
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch(e) {} }
    if (onlyFav) render();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch(e) {} }
  }
  function show(i, dir){
    cur = i;
    var k = list.indexOf(i);
    img.src = thumb(i);
    img.alt = 'Office photo ' + photos[i].n;
    var big = new Image();
    big.onload = function(){ if (cur === i) img.src = big.src; };
    big.src = full(i);
    $('#lbCount').textContent = pad(k + 1) + ' / ' + pad(list.length) + '   No. ' + pad(photos[i].n);
    $('#lbFav').setAttribute('aria-pressed', favs.has(i));
    strip.querySelectorAll('button').forEach(function(b, n){ b.setAttribute('aria-current', n === k); });
    var b = strip.children[k];
    if (b) strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    if (dir && !reduce) img.animate([{ opacity: .2, transform: 'translateX(' + (dir * 60) + 'px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (playing) restartBar();
  }
  function step(d){
    var k = (list.indexOf(cur) + d + list.length) % list.length;
    show(list[k], d);
  }
  function restartBar(){
    bar.classList.remove('run'); void bar.offsetWidth; bar.style.setProperty('--dur', DUR + 'ms'); bar.classList.add('run');
  }
  function setPlay(on){
    playing = on; clearInterval(timer);
    var b = $('#lbPlay');
    b.innerHTML = '<svg><use href="#' + (on ? 'i-pause' : 'i-play') + '"/></svg>';
    b.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow');
    if (on){ restartBar(); timer = setInterval(function(){ step(1); }, DUR); }
    else bar.classList.remove('run');
  }
  $('#lbClose').addEventListener('click', closeLB);
  $('#lbPrev').addEventListener('click', function(){ step(-1); if (playing) setPlay(true); });
  $('#lbNext').addEventListener('click', function(){ step(1); if (playing) setPlay(true); });
  $('#lbPlay').addEventListener('click', function(){ setPlay(!playing); });
  $('#lbFav').addEventListener('click', function(){ toggleFav(cur, this); });
  $('#lbFull').addEventListener('click', function(){
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else lb.requestFullscreen().catch(function(){});
    } catch(e) {}
  });
  strip.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var i = list[+b.dataset.k]; show(i, i > cur ? 1 : -1); });
  $('#stage').addEventListener('click', function(e){ if (e.target === this) closeLB(); });
  var sx = 0, sy = 0, down = false;
  var stage = $('#stage');
  stage.addEventListener('pointerdown', function(e){ down = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', function(e){
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){ step(dx < 0 ? 1 : -1); if (playing) setPlay(true); }
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLB();
  });
  stage.addEventListener('pointercancel', function(){ down = false; });

  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (lbOpen){
      if (e.key === 'Escape') closeLB();
      else if (e.key === 'ArrowRight'){ step(1); if (playing) setPlay(true); }
      else if (e.key === 'ArrowLeft'){ step(-1); if (playing) setPlay(true); }
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON'){ e.preventDefault(); setPlay(!playing); }
      else if (e.key === 'h' || e.key === 'H') toggleFav(cur, $('#lbFav'));
      else if (e.key === 'f' || e.key === 'F') $('#lbFull').click();
      else if (e.key === 'Tab'){
        var f = lb.querySelectorAll('button'); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    } else if ((e.key === 'r' || e.key === 'R') && !/INPUT|TEXTAREA/.test(e.target.tagName)) surprise();
  });

  render();
  requestAnimationFrame(moveThumb);
  window.addEventListener('load', moveThumb);
})();
