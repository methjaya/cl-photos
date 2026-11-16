(function(){
  /* ALBUMS comes from js/albums.js: one entry per day, newest first.
     Each photo row is [number, width, height] of img/<day>/pNN.jpg (already upright). */
  var ALBUMS = window.ALBUMS || [];
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function $(s){ return document.querySelector(s); }
  var ALL = [];
  ALBUMS.forEach(function(a){
    a.list = a.photos.map(function(p, k){
      var id = 'p' + pad(p[0]), ratio = p[1] / p[2];
      var ph = { i: k, id: id, n: p[0], w: p[1], h: p[2], album: a, key: a.key + '/' + id,
                 tall: p[2] > p[1], tall3: ratio < 0.55,
                 img: 'img/' + a.key + '/' + id + '.jpg', thumb: 'thumb/' + a.key + '/' + id + '.jpg' };
      ALL.push(ph); return ph;
    });
  });

  var DAYCOL = ['var(--g2)', 'var(--g4)', 'var(--g1)', 'var(--g3)'];   // dot colour of each day's tag
  function dtag(p){ return '<span class="dtag" style="--dc:' + DAYCOL[ALBUMS.indexOf(p.album) % DAYCOL.length] + '">' + p.album.short + '</span>'; }

  var A = 0;                                  // index of the day on show (0 = newest)
  var photos = ALBUMS[0].list;                // photos of that day
  var N = photos.length;
  var thumb = function(i){ return photos[i].thumb; };
  var full = function(i){ return photos[i].img; };

  var order = photos.map(function(p){ return p.i; });
  var view = 'mosaic', onlyFav = false, shuffled = false;

  /* hearts and rotations are saved per photo as "<day>/<id>", e.g. "2026-11-10/p07" */
  function legacy(k){ return String(k).indexOf('/') < 0 ? '2026-11-10/' + k : String(k); }
  var favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem('clr-favs2') || '[]').map(legacy)); } catch(e) {}
  function saveFavs(){ try { localStorage.setItem('clr-favs2', JSON.stringify(Array.from(favs))); } catch(e) {} }
  function isFav(i){ return favs.has(photos[i].key); }
  var rots = {};
  try { var r0 = JSON.parse(localStorage.getItem('clr-rot') || '{}') || {}; Object.keys(r0).forEach(function(k){ rots[legacy(k)] = r0[k]; }); } catch(e) {}
  function saveRots(){ try { localStorage.setItem('clr-rot', JSON.stringify(rots)); } catch(e) {} }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  var gal = $('#gallery');
  function visible(){ return order.filter(function(i){ return !onlyFav || isFav(i); }); }
  function shuf(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  var heartSvg = '<svg><use href="#i-heart"/></svg>';

  /* ---------- gallery ---------- */
  function tileHTML(i, pos){
    var p = photos[i];
    var big = view === 'mosaic' && !p.tall && pos % 7 === 0;
    var cls = 'tile' + (big ? ' big' : '') + (p.tall3 ? ' tall3' : (p.tall ? ' tall' : ''));
    var src = big ? full(i) : thumb(i);
    var on = isFav(i);
    return '<figure class="' + cls + '" data-i="' + i + '" style="--d:' + Math.min(pos, 18) + '">' +
      '<div class="card" tabindex="0" role="button" aria-label="Open photo ' + p.n + '">' +
      '<img src="' + src + '" alt="Office photo ' + p.n + ' from ' + p.album.date + '" loading="lazy" draggable="false">' + dtag(p) +
      '<button class="heart" type="button" aria-label="Favorite photo ' + p.n + '" aria-pressed="' + on + '">' + heartSvg + '</button>' +
      '<span class="no">No. ' + pad(p.n) + '</span></div></figure>';
  }
  function favCount(){ var n = 0; photos.forEach(function(p, i){ if (isFav(i)) n++; }); return n; }
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
    var fn = favCount();
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
  function layoutScatter(){
    var tiles = gal.querySelectorAll('.tile');
    if (!tiles.length){ gal.style.height = '200px'; return; }
    var W = gal.clientWidth;
    var cw = W < 600 ? Math.min(180, W * 0.46) : W < 900 ? 220 : 250;
    var tw = cw * 0.7;
    var dims = { land: [cw, (cw - 16) / 1.5 + 46], tall: [tw, (tw - 16) * 1.5 + 46], tall3: [tw, (tw - 16) * 2 + 46] };
    gal.style.setProperty('--cw', dims.land[0] + 'px'); gal.style.setProperty('--ch', dims.land[1] + 'px');
    gal.style.setProperty('--tw', tw + 'px');
    gal.style.setProperty('--th', dims.tall[1] + 'px'); gal.style.setProperty('--th3', dims.tall3[1] + 'px');
    var sizes = [], sumW = 0, sumH = 0, maxH = 0;
    tiles.forEach(function(t){
      var d = t.classList.contains('tall3') ? dims.tall3 : t.classList.contains('tall') ? dims.tall : dims.land;
      sizes.push(d); sumW += d[0]; sumH += d[1]; maxH = Math.max(maxH, d[1]);
    });
    var aw = sumW / tiles.length, ah = sumH / tiles.length;
    var cols = Math.max(2, Math.floor(W / (aw * 0.78)));
    var sx = cols > 1 ? (W - aw) / (cols - 1) : 0, sy = ah * 0.8;
    var rows = Math.ceil(tiles.length / cols);
    gal.style.height = (rows * sy + maxH * 0.5 + 30) + 'px';
    tiles.forEach(function(t, n){
      var c = n % cols, r = Math.floor(n / cols);
      var x = Math.max(0, Math.min(W - sizes[n][0], c * sx + rnd(-16, 16)));
      var y = Math.max(0, r * sy + rnd(-12, 12));
      t.style.left = x + 'px'; t.style.top = y + 'px';
      t.style.setProperty('--rot', rnd(-8, 8).toFixed(1) + 'deg');
      t.style.zIndex = n + 1;
    });
  }
  new ResizeObserver(function(){ if (view !== 'scatter') layout(); }).observe(gal);
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if (view === 'scatter') layoutScatter(); moveAll(); }, 200); });

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
    var on = !isFav(i);
    var fid = photos[i].key;
    if (on) favs.add(fid); else favs.delete(fid);
    saveFavs();
    var tile = gal.querySelector('.tile[data-i="' + i + '"] .heart');
    if (tile) tile.setAttribute('aria-pressed', on);
    var fn = favCount();
    $('#favN').textContent = fn ? 'Favorites ' + fn : 'Favorites';
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

  /* ---------- controls ---------- */
  var seg = $('#seg'), segThumb = $('#segThumb');
  var daySeg = $('#daySeg'), dayThumb = $('#dayThumb');
  function moveThumb(sg, th){
    var b = sg.querySelector('[aria-pressed="true"]'); if (!b) return;
    th.style.width = b.offsetWidth + 'px';
    th.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
  }
  function moveAll(){ moveThumb(seg, segThumb); moveThumb(daySeg, dayThumb); }
  seg.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    view = b.dataset.v;
    seg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
    moveThumb(seg, segThumb); render();
  });

  /* days */
  daySeg.innerHTML = '<span class="thumb" id="dayThumb"></span>' + ALBUMS.map(function(a, k){
    return '<button type="button" data-a="' + k + '" aria-pressed="' + (k === 0) + '" title="' + a.title + ' on ' + a.date + '">' + a.short + '</button>';
  }).join('');
  dayThumb = $('#dayThumb');
  function head(){
    var a = ALBUMS[A];
    $('#albTitle').textContent = a.title;
    $('#albDate').textContent = a.date;
    $('#albTag').hidden = A !== 0;
    var h = $('#albHead'); h.classList.remove('swap'); void h.offsetWidth; h.classList.add('swap');
  }
  function setAlbum(a){
    A = a; photos = ALBUMS[a].list; N = photos.length;
    order = photos.map(function(p){ return p.i; });
    onlyFav = false; shuffled = false;
    $('#favBtn').setAttribute('aria-pressed', 'false'); $('#shuffle').textContent = 'Shuffle';
    daySeg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', +x.dataset.a === a); });
    moveThumb(daySeg, dayThumb); head(); render();
  }
  daySeg.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b || +b.dataset.a === A) return;
    setAlbum(+b.dataset.a);
  });
  function openPhoto(p, origin){            // open any photo, switching day first if needed
    var a = ALBUMS.indexOf(p.album);
    if (a !== A) setAlbum(a);
    openLB(p.i, origin);
  }

  $('#shuffle').addEventListener('click', function(){
    order = shuf(order); shuffled = true; $('#shuffle').textContent = 'Shuffle again'; render();
  });
  $('#favBtn').addEventListener('click', function(){
    onlyFav = !onlyFav; this.setAttribute('aria-pressed', onlyFav); render();
  });
  $('#slide').addEventListener('click', function(){
    var l = visible(); if (!l.length) return; openLB(l[0], null); setPlay(true);
  });
  function surprise(){ openPhoto(ALL[Math.floor(Math.random() * ALL.length)], null); }
  $('#navSurprise').addEventListener('click', surprise);
  $('#heroSurprise').addEventListener('click', surprise);

  /* ---------- hero fan ---------- */
  var fan = $('#fan');
  /* 5 random photos from every day; at least 2 always come from the newest day */
  var newest = ALL.filter(function(p){ return p.album === ALBUMS[0]; });
  var others = ALL.filter(function(p){ return p.album !== ALBUMS[0]; });
  var picks = shuf(shuf(newest).slice(0, Math.min(2, newest.length)).concat(shuf(others).slice(0, 3)));
  if (picks.length < 5) picks = shuf(ALL).slice(0, 5);
  var pos = [[-92, 6, -9], [-46, -4, -4.5], [0, 0, 0], [46, -4, 4.5], [92, 6, 9]];
  fan.innerHTML = picks.map(function(p, k){
    return '<div class="fc' + (p.tall ? ' tallc' : '') + '" data-g="' + ALL.indexOf(p) + '" tabindex="0" role="button" aria-label="Open photo ' + p.n + ' from ' + p.album.date + '" style="--ar:' + (p.w / p.h).toFixed(3) + ';--x:' + pos[k][0] + ';--y:' + pos[k][1] + ';--r:' + pos[k][2] + 'deg;z-index:' + (k === 2 ? 5 : 4 - Math.abs(k - 2)) + '"><img src="' + p.thumb + '" alt="Office photo ' + p.n + '" draggable="false">' + dtag(p) + '</div>';
  }).join('');
  function fanOpen(c){ if (c) openPhoto(ALL[+c.dataset.g], c.querySelector('img')); }
  fan.addEventListener('click', function(e){ fanOpen(e.target.closest('.fc')); });
  fan.addEventListener('keydown', function(e){ if (e.key === 'Enter') fanOpen(e.target.closest('.fc')); });
  var cards = fan.querySelectorAll('.fc');
  var glow = $('#glow');
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
  glow.style.transform = 'translate(70vw,20vh)';

  /* scroll progress */
  var sb = $('#scrollbar');
  function sp(){ var h = document.documentElement.scrollHeight - innerHeight; sb.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  addEventListener('scroll', sp, { passive: true }); sp();

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), img = $('#lbImg'), strip = $('#strip'), bar = $('#lbBar');
  var stage = $('#stage');
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
    img.classList.add('noanim');
    img.src = thumb(i);
    img.alt = 'Office photo ' + photos[i].n;
    fit();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ img.classList.remove('noanim'); }); });
    var big = new Image();
    big.onload = function(){ if (cur === i) img.src = big.src; };
    big.src = full(i);
    $('#lbCount').textContent = ALBUMS[A].short + '  ' + pad(k + 1) + ' / ' + pad(list.length) + '   No. ' + pad(photos[i].n);
    $('#lbFav').setAttribute('aria-pressed', isFav(i));
    strip.querySelectorAll('button').forEach(function(b, n){ b.setAttribute('aria-current', n === k); });
    var b = strip.children[k];
    if (b) strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    if (dir && !reduce) img.animate([{ opacity: .2, transform: 'translateX(' + (dir * 60) + 'px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (playing) restartBar();
  }
  /* size the picture so it still fits the stage after a quarter turn, then apply the turn */
  function fit(){
    var p = photos[cur], r = rots[p.key] || 0;
    var swap = Math.abs(Math.round(r / 90)) % 2 === 1;
    var sw = stage.clientWidth - 32, sh = stage.clientHeight;
    var vw = swap ? p.h : p.w, vh = swap ? p.w : p.h;
    var s = Math.max(.05, Math.min(sw / vw, sh / vh, 1));
    img.style.width = (p.w * s) + 'px';
    img.style.height = (p.h * s) + 'px';
    img.style.transform = 'rotate(' + r + 'deg)';
    var on = (((r % 360) + 360) % 360) !== 0;
    $('#lbRotL').classList.toggle('on', on); $('#lbRotR').classList.toggle('on', on);
  }
  function rotate(dir){
    var key = photos[cur].key;
    rots[key] = (rots[key] || 0) + dir * 90;
    fit(); saveRots();
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
  $('#lbRotL').addEventListener('click', function(){ rotate(-1); });
  $('#lbRotR').addEventListener('click', function(){ rotate(1); });
  window.addEventListener('resize', function(){ if (lbOpen) fit(); });
  $('#lbFav').addEventListener('click', function(){ toggleFav(cur, this); });
  $('#lbFull').addEventListener('click', function(){
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else lb.requestFullscreen().catch(function(){});
    } catch(e) {}
  });
  strip.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; var i = list[+b.dataset.k]; show(i, i > cur ? 1 : -1); });
  stage.addEventListener('click', function(e){ if (e.target === this) closeLB(); });
  var sx = 0, sy = 0, down = false;
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
      else if (e.key === 'r') rotate(1);
      else if (e.key === 'R') rotate(-1);
      else if (e.key === 'f' || e.key === 'F') $('#lbFull').click();
      else if (e.key === 'Tab'){
        var f = lb.querySelectorAll('button'); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    } else if ((e.key === 'r' || e.key === 'R') && !/INPUT|TEXTAREA/.test(e.target.tagName)) surprise();
  });

  head();
  render();
  requestAnimationFrame(moveAll);
  window.addEventListener('load', moveAll);
})();
