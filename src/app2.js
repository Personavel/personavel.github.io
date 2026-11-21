/* ===== Personavel – views ===== */
(function(){
'use strict';
const {D, $, $$, esc, ICON, CATS, state} = PV;
const NAV = [
  ['home','Trang chủ',ICON.home], ['map','Bản đồ khám phá',ICON.map], ['trip','Lịch trình của tôi',ICON.trip],
  ['collection','Bộ sưu tập Sài Gòn',ICON.coll], ['chat','Chatbot hướng dẫn',ICON.chat], ['profile','Trang cá nhân',ICON.user], ['about','Giới thiệu dự án',ICON.info]
];
const BOTTOM = [['home','Trang chủ',ICON.home],['map','Bản đồ',ICON.map],['trip','Lịch trình',ICON.trip],['chat','Chatbot',ICON.chat],['profile','Cá nhân',ICON.user]];

PV.shell = () => {
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="app">
    <aside class="side" id="side">
      <div class="brand">${PV.robot(PV.GUIDES[0],{wave:false}).replace('<svg','<svg style="width:46px"')}<div><b>Personavel</b><small>Your trip · Your story</small></div></div>
      ${PV.langSwitch('side-lang')}
      <nav class="nav">${NAV.map(([k,t,i])=>`<a href="#${k}" data-k="${k}" id="nav-${k}">${i}<span>${t}</span></a>`).join('')}</nav>
      <div class="side-user" id="sideuser"></div>
      <div class="side-foot">${saigonSketch()}<div style="margin-top:6px">Sài Gòn luôn chào đón bạn!</div></div>
    </aside>
    <main class="main" id="main"></main>
  </div>
  <nav class="bottom" id="bottom">${BOTTOM.map(([k,t,i])=>`<a href="#${k}" data-k="${k}">${i}<span>${t}</span></a>`).join('')}</nav>
  <button class="fab" id="fab" aria-label="Mở chatbot hướng dẫn">${PV.robot(PV.GUIDES[0])}</button>
  <div class="drawer" id="drawer" aria-hidden="true"></div>`);
  /* mobile: tapping the tab you're already on (or double-tapping any tab) goes back to Home */
  $('#bottom').addEventListener('click', e => {
    const a = e.target.closest('a[data-k]'); if (!a) return;
    const cur = (location.hash||'#home').slice(1) || 'home';
    if (a.dataset.k === cur) { e.preventDefault(); location.hash = '#home'; }
  });
  $('#fab').onclick = () => PV.chatPop();
  document.addEventListener('keydown', e => { if (e.key==='Escape' && $('#chatpop.on')) PV.chatPop(false); });
  window.addEventListener('hashchange', PV.route);
};
function saigonSketch(){ // original simple line drawing of a twin-spire church skyline
  return `<svg viewBox="0 0 200 90" aria-hidden="true"><defs><linearGradient id="sk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#D5EAF8"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
  <rect width="200" height="90" rx="12" fill="url(#sk)"/>
  <g fill="#fff" stroke="#426B87" stroke-width="1.4">
   <rect x="70" y="42" width="60" height="40"/><path d="M76 42V24l7-12 7 12v18M110 42V24l7-12 7 12v18"/><path d="M92 82V62a8 8 0 0116 0v20"/><circle cx="100" cy="52" r="4"/>
   <rect x="20" y="58" width="40" height="24"/><rect x="140" y="52" width="44" height="30"/>
  </g><path d="M0 82h200" stroke="#8DB8DA" stroke-width="3"/>
  <circle cx="170" cy="22" r="8" fill="#F3DE8A"/></svg>`;
}

PV.drawSideUser = () => { const el=$('#sideuser'); if(!el) return; const p=state.profile;
  el.innerHTML = p&&p.onboarded ? `<div class="avatar" style="width:36px;height:36px;font-size:15px;border-width:2px">${PV.safeImg(p.avatar)?`<img src="${esc(PV.safeImg(p.avatar))}" alt="">`:esc((p.name||'B')[0].toUpperCase())}</div><div style="min-width:0;flex:1"><b class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</b><button class="linkbtn tiny" id="sidelogout">Đăng xuất</button></div>` : '';
  const b=$('#sidelogout'); if (b) b.onclick=()=>PV.logoutModal(); };

PV.img = id => (window.PV_IMG && window.PV_IMG[id]) || null;
PV.thumb = id => (window.PV_THUMB && window.PV_THUMB[id]) || PV.img(id);
PV.lightbox = (items, i=0) => {
  const bg = document.createElement('div'); bg.className='lightbox';
  const draw = () => { const it = items[i]; bg.innerHTML = `<button class="lb-x" aria-label="Đóng">✕</button>${items.length>1?'<button class="lb-prev" aria-label="Ảnh trước">‹</button><button class="lb-next" aria-label="Ảnh sau">›</button>':''}<figure><img src="${it.src}" alt="${esc(it.cap||'')}"><figcaption>${esc(it.cap||'')}${items.length>1?` <span class="tiny">(${i+1}/${items.length})</span>`:''}</figcaption></figure>`; };
  draw(); document.body.appendChild(bg);
  const close = () => { bg.remove(); document.removeEventListener('keydown', key); };
  const go = d => { i = (i + d + items.length) % items.length; draw(); };
  const key = e => { if (e.key==='Escape') close(); if (e.key==='ArrowRight') go(1); if (e.key==='ArrowLeft') go(-1); };
  document.addEventListener('keydown', key);
  bg.addEventListener('click', e => { if (e.target.closest('.lb-prev')) go(-1); else if (e.target.closest('.lb-next')) go(1); else if (e.target===bg || e.target.closest('.lb-x')) close(); });
};
/* responsive sources for the city photos (img/gN.webp has -800 and -1200 versions on the web build) */
PV.gset = (src) => /^img\/g\d+\.webp$/.test(src) ? ` srcset="${src.replace('.webp','-800.webp')} 800w, ${src.replace('.webp','-1200.webp')} 1200w, ${src} 1600w" sizes="100vw"` : '';
PV.galleryHTML = (id='gal') => { const G = window.PV_GALLERY || []; if (!G.length) return '';
  return `<div class="gallery" id="${id}"><div class="g-track">${G.map((g,i)=>`<figure class="g-slide ${i===0?'on':''}" data-i="${i}"><img src="${g.src}"${PV.gset(g.src)} alt="${esc(g.cap)}" loading="lazy" decoding="async"><figcaption>${esc(PV.lang==='en'?g.cap_en:g.cap)}</figcaption></figure>`).join('')}</div>
    <button class="g-prev" aria-label="Ảnh trước">‹</button><button class="g-next" aria-label="Ảnh sau">›</button>
    <div class="g-dots">${G.map((g,i)=>`<i class="${i===0?'on':''}" data-d="${i}"></i>`).join('')}</div></div>`; };
PV.bindGallery = (root, auto=true) => { const G = window.PV_GALLERY || []; const el = root && root.querySelector('.gallery'); if (!el) return ()=>{};
  let i = 0, timer = null;
  const show = n => { i = (n + G.length) % G.length; el.querySelectorAll('.g-slide').forEach((s,k)=>s.classList.toggle('on', k===i)); el.querySelectorAll('.g-dots i').forEach((s,k)=>s.classList.toggle('on', k===i)); };
  const restart = () => { clearInterval(timer); if (auto && !document.body.classList.contains('reduce')) timer = setInterval(()=>{ if (!document.body.contains(el)) return clearInterval(timer); if (document.hidden) return; show(i+1); }, 3500); };
  el.querySelector('.g-prev').onclick = (e) => { e.stopPropagation(); show(i-1); restart(); };
  el.querySelector('.g-next').onclick = (e) => { e.stopPropagation(); show(i+1); restart(); };
  el.querySelectorAll('.g-dots i').forEach(d => d.onclick = (e) => { e.stopPropagation(); show(+d.dataset.d); restart(); });
  el.querySelectorAll('.g-slide img').forEach((im,k) => im.onclick = (e) => { e.stopPropagation(); PV.lightbox(G.map(g=>({src:g.src, cap:PV.lang==='en'?g.cap_en:g.cap})), k); });
  restart(); return () => clearInterval(timer); };

PV.route = () => {
  PV.drawSideUser();
  const k = ((location.hash||'#home').slice(1) || 'home').split('?')[0] || 'home';   // '#map?area=xuan-hoa' → map
  const v = PV.views[k] ? k : 'home';
  $$('.nav a, .bottom a').forEach(a => a.classList.toggle('on', a.dataset.k === v));
  PV.closeDrawer(); if (PV.chatPop) PV.chatPop(false);
  if (PV._leave) { PV._leave(); PV._leave = null; }
  const m = $('#main'); m.innerHTML = ''; m.scrollTop = 0; window.scrollTo(0,0);
  PV.views[v](m);
  $('#fab').style.display = v==='chat' ? 'none' : '';
};
PV.views = {};


/* home hero: Ho Chi Minh City photos as the background behind the greeting.
   A new photo each time you come back to Home, and a slow cross-fade every 60 s while you stay. */
PV.heroIdx = PV.store.get('heroIdx', -1);
function heroBg(){
  const G = window.PV_GALLERY || []; if (!G.length) return '';
  PV.heroIdx = (PV.heroIdx + 1) % G.length; PV.store.set('heroIdx', PV.heroIdx);
  const g = G[PV.heroIdx];
  return `<div class="hero-bg" aria-hidden="true"><img class="on" src="${g.src}"${PV.gset(g.src)} alt="" fetchpriority="high"><img alt=""></div><div class="hero-shade"></div>
    <button class="hero-cap" title="Xem ảnh lớn">📍 ${esc(PV.lang==='en'?g.cap_en:g.cap)}<span class="hero-credit">${g.credit?' · '+PV.L('Ảnh','Photo')+': '+esc(PV.L(g.credit, g.credit==='nhóm Personavel'?'Personavel team':g.credit)):''}</span></button>`;
}
let heroTimer = null;
function bindHero(m){
  const G = window.PV_GALLERY || []; const hero = m.querySelector('#hero'); if (!hero || !G.length) return;
  const imgs = hero.querySelectorAll('.hero-bg img'), cap = hero.querySelector('.hero-cap');
  let front = 0;
  const show = (i) => {
    const g = G[i], back = 1 - front, im = imgs[back];
    im.onload = () => { imgs[front].classList.remove('on'); im.classList.add('on'); front = back; };
    if (/^img\/g\d+\.webp$/.test(g.src)){ im.srcset = `${g.src.replace('.webp','-800.webp')} 800w, ${g.src.replace('.webp','-1200.webp')} 1200w, ${g.src} 1600w`; im.sizes = '100vw'; } else im.removeAttribute('srcset');
    if (!PV._heroFirst){ PV._heroFirst = 1; im.fetchPriority = 'high'; im.loading = 'eager'; }
    im.src = g.src; cap.innerHTML = '📍 ' + esc(PV.lang==='en' ? g.cap_en : g.cap) + (g.credit ? '<span class="hero-credit"> · ' + PV.L('Ảnh','Photo') + ': ' + esc(PV.L(g.credit, g.credit==='nhóm Personavel'?'Personavel team':g.credit)) + '</span>' : '');
  };
  cap.onclick = () => PV.lightbox(G.map(g=>({src:g.src, cap:(PV.lang==='en'?g.cap_en:g.cap)+(g.credit?' — Ảnh: '+g.credit+' (Wikimedia Commons)':'')})), PV.heroIdx);
  clearInterval(heroTimer);
  heroTimer = setInterval(() => { if (document.hidden) return;   // paused while the tab is hidden
    if (!document.body.contains(hero)) { clearInterval(heroTimer); return; }
    PV.heroIdx = (PV.heroIdx + 1) % G.length; PV.store.set('heroIdx', PV.heroIdx); show(PV.heroIdx);
  }, 60000);
}

/* ---------- HOME ---------- */
PV.views.home = (m) => {
  const p = state.profile; const g = PV.todayGuide();
  const rec = PV.recommend(4);
  const visitedN = Object.keys(state.visited).length;
  const badges = PV.badges().filter(b=>b.got).length;
  m.innerHTML = `
  <div class="card hello hero" id="hero">${heroBg()}
    <div class="hero-text"><h1><span class="hi">Xin chào,</span><br><span class="nameline"><em>${esc(p?.name||PV.L('Du khách','Traveller'))}</em>!${PV.robot(g,{cls:'namebot'})}</span></h1>
    <div class="hero-box"><p class="muted" style="margin:0 0 12px"><span>Hôm nay</span> <b>${g.name}</b> <span>sẽ đồng hành cùng bạn.</span> <span>${esc(g.greet)}</span></p>
    <div class="row"><a class="btn notr" href="#chat">${PV.guideOffer ? esc(PV.guideOffer(g.id).cta) : 'Lên lịch trình với ' + g.name}</a><a class="btn ghost" href="#map">Mở bản đồ</a></div>
    <form class="hsearch notr" id="hsf" role="search"><input class="input" id="hq" type="search" enterkeyhint="search" autocomplete="off" aria-label="${PV.L('Tìm địa điểm','Find a place')}" placeholder="${PV.L('Tìm địa điểm, món ăn… vd: Chợ Bến Thành','Find a place or dish… e.g. Ben Thanh Market')}"><button class="btn" type="submit" aria-label="${PV.L('Tìm','Search')}">🔍</button></form></div></div>
  </div>
  <div class="grid g4" style="margin-top:18px">
    <button type="button" class="card stat stat-link" data-act="visited" title="${PV.L('Xem danh sách','See the list')}"><b>${visitedN}</b><span class="muted small">địa điểm đã khám phá</span><i class="stat-go" aria-hidden="true">›</i></button>
    <div class="card stat"><b>${state.points}</b><span class="muted small">điểm tích lũy</span></div>
    <div class="card stat"><b>${badges}</b><span class="muted small">huy hiệu</span></div>
    <div class="card stat"><b>${state.trip.stops.length}</b><span class="muted small">điểm trong lịch trình</span></div>
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="card"><h2 class="h3">Gợi ý dành riêng cho bạn</h2>
      <p class="muted small" style="margin-top:0">${p?.persona ? 'Dựa trên phong cách: <b>'+esc(p.persona.name)+'</b>' : 'Làm bài phân tích phong cách để nhận gợi ý chính xác hơn.'}</p>
      <div class="plist">${rec.map(PV.pitem).join('')}</div></div>
    <div class="grid" style="align-content:start">
      <div class="card"><h2 class="h3">Con đường kể chuyện hôm nay</h2>${(()=>{ const s=D.streets[Math.floor(Date.now()/864e5)%D.streets.length]; return `<p style="margin:0 0 6px"><b>Đường ${esc(s.name)}</b> <span class="tag">${esc(s.wards)}</span></p><p class="small" style="margin:0 0 10px">${esc(s.story)}</p><div class="row"><button class="btn sm" data-street="${s.id}">Xem trên bản đồ</button><button class="btn sm ghost" data-say="${s.id}">${ICON.speaker.replace('<svg','<svg width=16 height=16')} Nghe thuyết minh</button></div>`; })()}</div>
      <div class="grid g2 quick">
        ${[['map','Bản đồ khám phá','Tìm địa điểm, giá vé, giờ mở cửa','#D5EAF8',ICON.map],['trip','Lịch trình của tôi','Sắp xếp điểm đến theo thứ tự','#D6E9F8',ICON.trip],['collection','Bộ sưu tập','Dấu mộc & huy hiệu','#FFF1C1',ICON.coll],['profile','Phong cách du lịch','Xem kết quả phân tích','#F0E8FB',ICON.user]]
          .map(([k,t,d,c,i])=>`<a href="#${k}"><div class="card"><div class="ico" style="background:${c}">${i}</div><div><b>${t}</b><div class="small muted">${d}</div></div></div></a>`).join('')}
      </div>
    </div>
  </div>`;
  PV.bindItems(m); bindHero(m);
  const hsf = $('#hsf', m); if (hsf) hsf.onsubmit = (e) => { e.preventDefault(); const q = $('#hq', m).value.trim(); if (!q){ $('#hq', m).focus(); return; } PV.pendingSearch = q; location.hash = '#map'; };
  $$('[data-street]', m).forEach(b => b.onclick = () => { PV.pendingStreet = b.dataset.street; location.hash = '#map'; });
  $$('[data-say]', m).forEach(b => b.onclick = () => { const s=D.streets.find(x=>x.id===b.dataset.say); PV.narrate(s, b); PV.markStreet(s.id); });
};
PV.pitem = (p) => {
  const c = CATS[PV.mainCat(p)];
  const d = PV.userPos ? ' · ' + PV.fmtKm(PV.dist(PV.userPos, p.coords)) : '';
  return `<div class="pitem" data-pid="${p.id}">${PV.img(p.id) ? `<img class="thumb" src="${PV.thumb(p.id)}" alt="" loading="lazy" decoding="async">` : `<div class="pin" style="background:${c.color}"><span>${c.emoji}</span></div>`}
    <div style="min-width:0"><b>${esc(p.name)}</b>${p.michelin?' <span class="tag mich">Michelin</span>':''}${state.visited[p.id]?' <span class="tag ok">Đã ghé</span>':''}
    <div class="small muted">${esc(p.kind)} · ${PV.priceText(p.price_level)}${d}</div></div></div>`;
};
PV.bindItems = (root) => $$('[data-pid]', root).forEach(el => el.onclick = (e) => { const t = e.target.closest('a,[data-pid]'); if (t && t !== el) return; PV.openPlace(el.dataset.pid); });   // link / nút con bên trong thẻ tự xử lý

/* ---------- PLACE DRAWER ---------- */
PV.openPlace = (id, opt={}) => {
  const p = PV.byId(id); if (!p) return;
  state.history = [id, ...state.history.filter(x=>x!==id)].slice(0,20); PV.save('history');
  const c = CATS[PV.mainCat(p)];
  const inTrip = state.trip.stops.some(s=>s.id===id);
  const d = PV.userPos ? PV.fmtKm(PV.dist(PV.userPos, p.coords)) + ' từ vị trí của bạn' : '';
  const dirUrl = p.coords ? `https://www.google.com/maps/dir/?api=1&destination=${p.coords[1]},${p.coords[0]}` : '';
  const dr = $('#drawer');
  dr.innerHTML = `<header><button class="x" aria-label="Đóng">${ICON.x}</button>
    ${PV.img(p.id) ? `<button class="cover photo" id="d-photo" aria-label="Phóng to ảnh"><img src="${PV.img(p.id)}" alt="${esc(p.name)}" decoding="async"></button>` : `<div class="cover" style="background:linear-gradient(135deg,${c.color}33,#fff)">${c.emoji}</div>`}
    <h2 style="margin:0">${esc(p.name)}</h2>
    <div class="row" style="margin-top:6px"><span class="tag" style="background:${c.color}22">${esc(p.kind)}</span>${p.cats.slice(1).map(k=>`<span class="tag">${CATS[k].name}</span>`).join('')}${p.michelin?'<span class="tag mich">Michelin Guide</span>':''}
    ${p.geo==='approx'?'<span class="tag warn">Vị trí gần đúng</span>':p.geo==='verified'?'<span class="tag ok">Vị trí đã đối chiếu</span>':''}${p.warning?`<span class="tag warn">${esc(p.warning)}</span>`:''}</div></header>
  <div class="body">
    <p style="margin-top:0">${esc(p.desc)}</p>
    <div class="kv"><b>Địa chỉ</b>${esc(p.address||'Chưa xác minh')}${d?`<div class="small muted">${d}</div>`:''}</div>
    <div class="kv"><b>Giờ hoạt động</b>${p.hours&&p.hours.length?`<ul>${p.hours.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:'<span class="muted">Chưa xác minh – nên kiểm tra trước khi đến</span>'}</div>
    <div class="kv"><b>Giá vé / chi phí</b>${p.price&&p.price.length?`<ul>${p.price.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:esc(PV.priceText(p.price_level))}</div>
    ${p.highlights&&p.highlights.length?`<div class="kv"><b>${p.cats.includes('food')?'Món đặc biệt':p.cats.includes('shopping')?'Sản phẩm':'Điểm nổi bật'}</b><ul>${p.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></div>`:''}
    ${p.phone?`<div class="kv"><b>Điện thoại</b>${esc(p.phone)}</div>`:''}
    <div class="kv"><b>Thời gian tham quan gợi ý</b>khoảng ${p.visit_min} phút</div>
    <div class="row" style="margin:16px 0">
      <button class="btn" id="d-trip">${inTrip?'Đã có trong lịch trình':'Thêm vào lịch trình'}</button>
      <button class="btn mint" id="d-visit">${state.visited[id]?'Đã ghé thăm ✓':'Tôi đã ghé thăm'}</button>
      <button class="btn ghost" id="d-say">${ICON.speaker.replace('<svg','<svg width=16 height=16')} Thuyết minh</button>
    </div>
    <div class="row">${p.coords?`<a class="btn ghost sm" href="${dirUrl}" target="_blank" rel="noopener">Chỉ đường (Google Maps)</a>`:''}${p.maps_url?`<a class="btn ghost sm" href="${esc(p.maps_url)}" target="_blank" rel="noopener">Xem trên Google Maps</a>`:''}
      ${!opt.noMap?'<button class="btn ghost sm" id="d-map">Xem trên bản đồ</button>':''}</div>
    <div class="kv" style="margin-top:18px"><b>Nguồn & cập nhật</b><span class="small">${p.source?`<a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.source_name)}</a>`:esc(p.source_name||'Khảo sát của nhóm')} · cập nhật ${esc(p.updated||'')}${p.geo==='approx'?' · tọa độ gần đúng theo tên đường, cần xác minh tại chỗ':''}</span></div>
  </div>`;
  dr.classList.add('open'); dr.setAttribute('aria-hidden','false');
  $('.x', dr).onclick = PV.closeDrawer;
  const ph = $('#d-photo', dr); if (ph) ph.onclick = () => PV.lightbox([{src:PV.img(p.id), cap:p.name}], 0);
  $('#d-trip', dr).onclick = () => { if (!inTrip){ PV.addToTrip(id,'me'); PV.openPlace(id,opt); } };
  $('#d-visit', dr).onclick = () => { PV.markVisited(id); PV.openPlace(id,opt); };
  $('#d-say', dr).onclick = (e) => PV.narrate(p, e.currentTarget);
  const mb = $('#d-map', dr); if (mb) mb.onclick = () => { PV.pendingPlace = id; if (location.hash.split('?')[0]==='#map') PV.focusPlace(id); else location.hash = '#map'; PV.closeDrawer(); };
};
PV.closeDrawer = () => { const d=$('#drawer'); if (d){ d.classList.remove('open'); d.setAttribute('aria-hidden','true'); } };
PV.addToTrip = (id, by='me') => {
  if (state.trip.stops.some(s=>s.id===id)) return;
  state.trip.stops.push({id, by}); PV.retime(state.trip); PV.save('trip');
  PV.toast('Đã thêm vào lịch trình'); if (PV.refreshMapTrip) PV.refreshMapTrip();
};
PV.markVisited = (id) => {
  if (state.visited[id]) return;
  if (!confirmIn('Xác nhận bạn đã ghé thăm địa điểm này để nhận dấu mộc?')) return;
  state.visited[id] = new Date().toLocaleDateString('vi-VN'); PV.save('visited');
  PV.addPoints(10, 'Nhận dấu mộc mới');
};
function confirmIn(){ return true; } // user confirms by pressing the button itself (no native dialogs in embeds)
PV.markStreet = (id) => { if (!state.readStreets[id]){ state.readStreets[id]=1; PV.save('readStreets'); PV.addPoints(2,'Khám phá câu chuyện tên đường'); } };


/* base map with automatic provider fallback (some tile servers refuse pages opened from file://) */
PV.TILES = [
  // Esri first: works without an API key even when the page is opened as a local file (CARTO now answers "API KEY REQUIRED" there)
  {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', o:{maxZoom:19, attribution:'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'}},
  {url:'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', o:{subdomains:'abc', maxZoom:19, attribution:'&copy; OpenStreetMap contributors, Humanitarian OSM Team'}},
  {url:'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', o:{subdomains:'abcd', maxZoom:20, attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}}
];
PV.baseLayer = (mp) => {
  let i = PV.tileIdx || 0, cur = null, dead = false; const status = [];
  mp.on('unload', () => { dead = true; });
  const NAMES = ['Esri','OSM Humanitarian','OpenStreetMap','CARTO'];
  const showFail = () => {
    const el = mp.getContainer(); const old = el.querySelector('.tilefail'); if (old) old.remove();
    el.insertAdjacentHTML('beforeend', `<div class="tilefail"><b>Không tải được nền bản đồ</b><div class="small" style="margin:6px 0">Các ghim địa điểm vẫn dùng được. Trình duyệt đang chặn ảnh bản đồ từ Internet.</div>
      <ul class="tiny" style="text-align:left;margin:6px 0 8px;padding-left:18px">${status.map(s=>`<li>${s}</li>`).join('')}</ul>
      <div class="tiny muted" style="margin-bottom:8px">Gợi ý: mở file bằng <b>Google Chrome</b>, hoặc trong Edge vào Cài đặt → Quyền riêng tư → tắt "Ngăn chặn theo dõi" (Tracking prevention) cho trang này, rồi bấm Thử lại.</div>
      <button class="btn sm" id="tileRetry">Thử lại</button></div>`);
    const r = el.querySelector('#tileRetry'); if (r) r.onclick = (e) => { e.stopPropagation(); el.querySelector('.tilefail').remove(); status.length = 0; i = 0; PV.tileIdx = 0; use(); };
  };
  const use = () => {
    if (dead) return;
    if (cur) { try { mp.removeLayer(cur); } catch(e){} cur = null; }
    if (i >= PV.TILES.length){ showFail(); return; }
    const t = PV.TILES[i]; let ok = 0, bad = 0, switching = false;
    const layer = L.tileLayer(t.url, t.o);
    const next = (why) => { if (switching || dead || cur !== layer) return; switching = true; status.push(NAMES[i] + ': ' + why);
      layer.off('tileload', onLoad); layer.off('tileerror', onErr); clearTimeout(timer);
      const go = () => { if (mp._animatingZoom){ mp.once('zoomend', go); return; } i++; use(); }; setTimeout(go, 0); };
    const onLoad = () => { ok++; PV.tileIdx = i; clearTimeout(timer); };
    const onErr = () => { bad++; if (ok === 0 && bad >= 3) next('bị chặn / lỗi'); };
    // some browsers neither load nor fail (request hangs): give each server 6 s to deliver a first tile
    const timer = setTimeout(() => { if (ok === 0) next('không phản hồi (treo)'); }, 6000);
    layer.on('tileload', onLoad); layer.on('tileerror', onErr);
    cur = layer; layer.addTo(mp);
  };
  use();
};

/* ---------- MAP ---------- */
let map, layer, tripLayer, streetLayer, meMarker;
const active = new Set(Object.keys(CATS));
let budgetMax = 3, onlyRec = null, TOP = new Set(); const TOPN = 15;
PV.views.map = (m) => {
  if (onlyRec === null) onlyRec = false; // luôn mở ở "Tất cả" – trước mở ở "Gợi ý" khiến người đã làm phân tích phong cách tưởng mất địa điểm
  m.innerHTML = `<div class="row" style="margin-bottom:12px"><div><h1 class="title">Bản đồ khám phá</h1><p class="sub" style="margin:0">Khu trung tâm: Sài Gòn, Tân Định, Bến Thành, Cầu Ông Lãnh, Xuân Hòa, Nhiêu Lộc, Bàn Cờ</p></div></div>
  <div class="mapwrap ${PV.store.get('mapPanelHidden', false) ? 'collapsed' : ''}" id="mapwrap">
    <div class="panel">
      <div class="card" style="padding:12px">
        <div class="row" style="gap:6px"><input class="input" id="q" placeholder="Tìm tên đường, địa danh, món ăn…" autocomplete="off"><button class="btn sm" id="qgo" aria-label="Tìm">${ICON.search.replace('<svg','<svg width=18 height=18')}</button></div>
        <div id="qres" class="plist" style="margin-top:8px"></div>
      </div>
      <div class="card" style="padding:12px">
        <b class="small">Loại hình</b>
        <div class="legend" style="margin:6px 0 10px">${Object.entries(CATS).map(([k,c])=>`<span class="chip ${active.has(k)?'on':''}" data-cat="${k}"><span class="dot" style="background:${c.color}"></span>${c.name}</span>`).join('')}</div>
        <b class="small">Ngân sách</b>
        <div class="legend" style="margin:6px 0 10px">${['Miễn phí','< 50k','50–150k','Tất cả'].map((t,i)=>`<span class="chip ${budgetMax===i?'on':''}" data-b="${i}">${t}</span>`).join('')}</div>
        <span class="chip ${onlyRec?'on':''}" id="onlyrec">✨ Chỉ hiện gợi ý theo phong cách của tôi</span>
      </div>
      <div class="card" style="padding:12px"><div class="row"><b class="small">Địa điểm</b><span class="spacer"></span><span class="tiny muted" id="cnt"></span></div><div class="plist" id="plist" style="margin-top:8px"></div></div>
    </div>
    <div style="position:relative;min-height:420px"><div id="map"></div>
      <div class="maplegend" id="maplegend">
        <div class="seg"><button data-mode="rec" class="${onlyRec?'on':''}">✨ Gợi ý cho bạn</button><button data-mode="all" class="${onlyRec?'':'on'}">Tất cả</button></div>
        <div class="lg">${Object.entries(CATS).filter(([k])=>D.places.some(p=>PV.mainCat(p)===k)).map(([k,c])=>`<span><i style="background:${c.color}"></i>${c.name.split(' –')[0]}</span>`).join('')}<span><i class="tripdot"></i>Lịch trình</span></div>
      </div>
      <div class="mapctl" id="mapctl" style="position:absolute;right:12px;top:12px;z-index:500;display:flex;flex-direction:column;gap:8px">
        <button class="btn sm mapctl-btn" id="mapCtlBtn" type="button" aria-expanded="false" aria-controls="mapctl">☰ ${PV.L('Tùy chọn','Options')}</button>
        <button class="btn sm" id="togglePanel" aria-expanded="${!PV.store.get('mapPanelHidden', false)}">${PV.store.get('mapPanelHidden', false) ? '☰ Hiện bộ lọc' : '⟨ Ẩn bộ lọc'}</button>
        <button class="btn sm ghost" id="gps" title="Về vị trí của tôi">${ICON.locate.replace('<svg','<svg width=18 height=18')} Vị trí của tôi</button>
        <button class="btn sm ghost" id="showtrip">${ICON.trip.replace('<svg','<svg width=18 height=18')} Lịch trình</button>
      </div></div>
  </div>`;
  if (!window.L){ $('#map').innerHTML = `<div class="empty">${PV.L('Đang tải bản đồ…','Loading the map…')}</div>`;
    PV.loadLeaflet().then(() => { if (location.hash.split('?')[0] === '#map') PV.route(); }).catch(() => { const e = $('#map'); if (e) e.innerHTML = `<div class="empty">${PV.L('Không tải được thư viện bản đồ. Hãy kiểm tra kết nối Internet.','Could not load the map library. Please check your connection.')}</div>`; });
    return; }
  const mv = PV._mapView; map = L.map('map', {zoomControl:true, maxZoom:19}).setView(mv ? mv.c : [10.7795, 106.6935], mv ? mv.z : 15); PV._mapRef = map;
  map.on('moveend', () => { try { const c=map.getCenter(); PV._mapView = {c:[c.lat,c.lng], z:map.getZoom()}; } catch(e){} });
  PV.baseLayer(map);
  const mc = $('#mapCtlBtn'); if (mc) mc.onclick = () => { const o = $('#mapctl').classList.toggle('open'); mc.setAttribute('aria-expanded', o); mc.innerHTML = o ? '✕ ' + PV.L('Đóng','Close') : '☰ ' + PV.L('Tùy chọn','Options'); };
  $$('#mapctl > button:not(#mapCtlBtn)').forEach(b => b.addEventListener('click', () => { if (innerWidth <= 820 && b.id !== 'mapStyleBtn'){ $('#mapctl').classList.remove('open'); if (mc) mc.innerHTML = '☰ ' + PV.L('Tùy chọn','Options'); } }));
  layer = L.layerGroup().addTo(map); tripLayer = L.layerGroup().addTo(map); streetLayer = L.layerGroup().addTo(map);
  drawPlaces(); PV.refreshMapTrip();
  map.on('zoomend', () => PV.refreshMapTrip());
  if (PV.userPos) showMe();
  $$('[data-cat]', m).forEach(el => el.onclick = () => { const k=el.dataset.cat; active.has(k)?active.delete(k):active.add(k); el.classList.toggle('on'); drawPlaces(); });
  $$('[data-b]', m).forEach(el => el.onclick = () => { budgetMax=+el.dataset.b; $$('[data-b]',m).forEach(x=>x.classList.toggle('on', x===el)); drawPlaces(); });
  const setRec = (v) => { onlyRec = v; $('#onlyrec').classList.toggle('on', v); $$('#maplegend [data-mode]').forEach(b => b.classList.toggle('on', (b.dataset.mode==='rec') === v)); drawPlaces(); };
  $('#onlyrec').onclick = () => setRec(!onlyRec);
  PV.mapShowAll = () => { Object.keys(CATS).forEach(k => active.add(k)); $$('[data-cat]', m).forEach(el => el.classList.add('on'));
    budgetMax = 3; $$('[data-b]', m).forEach(x => x.classList.toggle('on', x.dataset.b === '3')); setRec(false); };
  $$('#maplegend [data-mode]').forEach(b => b.onclick = (e) => { e.stopPropagation(); setRec(b.dataset.mode==='rec'); });
  L.DomEvent && L.DomEvent.disableClickPropagation($('#maplegend'));
  const og0 = PV.origin(); if (og0 && !mv && !PV.pendingPlace && !PV.pendingStreet) map.setView([og0.c[1], og0.c[0]], 15, {animate:false});
  $('#gps').onclick = locate;
  $('#togglePanel').onclick = () => {
    const w = $('#mapwrap'); const hidden = !w.classList.contains('collapsed');
    w.classList.toggle('collapsed', hidden); PV.store.set('mapPanelHidden', hidden);
    const t = $('#togglePanel'); t.textContent = PV.tr(hidden ? '☰ Hiện bộ lọc' : '⟨ Ẩn bộ lọc'); t.setAttribute('aria-expanded', String(!hidden));
    if (map) { map.invalidateSize(); setTimeout(()=>map && map.invalidateSize({pan:false}), 260); }
  };
  $('#showtrip').onclick = () => { if (!state.trip.stops.length) { PV.toast('Lịch trình đang trống – hãy nhờ chatbot gợi ý nhé'); return; } const b = L.latLngBounds(state.trip.stops.map(s=>{const p=PV.byId(s.id);return [p.coords[1],p.coords[0]];})); map.fitBounds(b.pad(.25), {animate:false}); };
  const run = () => search($('#q').value.trim());
  $('#qgo').onclick = run; $('#q').addEventListener('keydown', e => { if (e.key==='Enter') run(); });
  $('#q').addEventListener('input', e => { const v=e.target.value.trim(); if (v.length>=2) search(v, true); else $('#qres').innerHTML=''; });
  setTimeout(()=>map.invalidateSize(), 200);
  if (PV.pendingSearch){ const q=PV.pendingSearch; PV.pendingSearch=null; $('#q').value=q; search(q); }
  if (PV.pendingStreet){ const s=D.streets.find(x=>x.id===PV.pendingStreet); PV.pendingStreet=null; if (s) setTimeout(()=>showStreet(s),300); }
  if (PV.pendingPlace){ const id=PV.pendingPlace; PV.pendingPlace=null; setTimeout(()=>PV.focusPlace(id),300); }
  PV._leave = () => { try { map && map.off() && map.remove(); } catch(e){} map = null; };
};
function visible(p){
  if (!p.coords) return false;
  if (PV.areaOk && !PV.areaOk(p)) return false;   // area filter (areas.js)
  if (!p.cats.some(c=>active.has(c))) return false;
  if (budgetMax<3 && p.price_level!=null && p.price_level>budgetMax) return false;
  if (budgetMax<3 && p.price_level==null) return false;
  if (onlyRec && !TOP.has(p.id)) return false;
  return true;
}
PV.pinSize = (z) => z==null ? 30 : z <= 12 ? 12 : z === 13 ? 16 : z === 14 ? 20 : z === 15 ? 25 : z === 16 ? 29 : 33;
function pinIcon(p){
  const c = CATS[PV.mainCat(p)]; const s = PV.pinSize(map && map.getZoom());
  const fs = Math.max(0, Math.round(s*0.46)); const bw = s < 18 ? 1.5 : 2;
  return L.divIcon({className:'', iconSize:[s,s], iconAnchor:[s/2,s], popupAnchor:[0,-s+2],
    html:`<div class="pin" style="width:${s}px;height:${s}px;border-width:${bw}px;background:${c.color};${state.visited[p.id]?'outline:'+(s<18?2:3)+'px solid #1F4E79;':''}">${s>=18?`<span style="font-size:${fs}px">${c.emoji}</span>`:''}</div>`});
}
PV.mapRedraw = () => drawPlaces();
function drawPlaces(){
  if (!map) return; layer.clearLayers();
  TOP = new Set(D.places.filter(p => p.coords && p.cats.some(c=>active.has(c)) && !(budgetMax<3 && (p.price_level==null || p.price_level>budgetMax))).map(p=>({p, s:PV.score(p)})).sort((a,b)=>b.s-a.s).slice(0,TOPN).map(x=>x.p.id));
  const og = PV.origin();
  if (og) L.marker([og.c[1], og.c[0]], {zIndexOffset:900, icon:L.divIcon({className:'', iconSize:[34,34], iconAnchor:[8,30], html:'<div class="startflag">🚩</div>'})}).addTo(layer).bindTooltip(PV.L('Điểm xuất phát: ','Start: ') + esc(og.name));
  const inTrip = new Set(state.trip.stops.map(s=>s.id));
  const list = D.places.filter(visible);
  const group = L.markerClusterGroup ? L.markerClusterGroup({maxClusterRadius: z => z >= 16 ? 30 : 48, disableClusteringAtZoom: 17, showCoverageOnHover:false, spiderfyOnMaxZoom:true,
      iconCreateFunction: c => { const n = c.getChildCount(), s = n < 10 ? 34 : n < 30 ? 40 : 46; return L.divIcon({className:'pv-cluster', iconSize:[s,s], html:`<span style="width:${s}px;height:${s}px">${n}</span>`}); }}).addTo(layer) : layer;
  list.forEach(p => { if (inTrip.has(p.id)) return;
    L.marker([p.coords[1], p.coords[0]], {icon:pinIcon(p), title:p.name}).addTo(group)
     .bindTooltip(esc(p.name), {direction:'top', offset:[0,-26]}).on('click', ()=>PV.openPlace(p.id,{noMap:true})); });
  const sorted = list.slice().sort((a,b)=> PV.score(b)-PV.score(a));
  const lim = innerWidth <= 820 && !PV._listAll ? 10 : 40;
  $('#plist').innerHTML = (sorted.slice(0,lim).map(PV.pitem).join('') || '<div class="empty small">Không có địa điểm phù hợp bộ lọc</div>')
    + (sorted.length > lim && lim < 40 ? `<button class="btn ghost sm morebtn" id="plmore">Xem thêm ${Math.min(40, sorted.length) - lim} địa điểm</button>` : '');
  const pm = $('#plmore'); if (pm) pm.onclick = () => { PV._listAll = true; drawPlaces(); };
  const all = D.places.filter(p => p.coords).length;
  $('#cnt').textContent = list.length < all ? `${list.length}/${all} ${PV.L('địa điểm','places')}` : `${list.length} ${PV.L('địa điểm','places')}`;
  let fn = $('#fnote'); if (!fn){ fn = document.createElement('div'); fn.id = 'fnote'; fn.className = 'fnote notr'; $('#plist').before(fn); }
  const why = [onlyRec && PV.L('chỉ gợi ý theo phong cách','style picks only'), PV.areaSel && PV.areaSel() && PV.L('một khu vực','one area'),
    active.size < Object.keys(CATS).length && PV.L('một số loại','some categories'), budgetMax < 3 && PV.L('ngân sách','budget')].filter(Boolean);
  fn.hidden = !(why.length && list.length < all);
  if (!fn.hidden){ fn.innerHTML = `${PV.L('Đang lọc','Filtered')}: ${why.join(', ')} · <button class="linkbtn" type="button">${PV.L('Xem tất cả ' + all + ' địa điểm','Show all ' + all + ' places')}</button>`;
    fn.querySelector('button').onclick = () => { if (PV.areaClear && PV.areaSel && PV.areaSel()) PV.areaClear(); PV.mapShowAll && PV.mapShowAll(); }; }
  PV.bindItems($('#plist'));
}
PV.refreshMapTrip = () => {
  if (!map) return; tripLayer.clearLayers(); drawPlaces();
  const pts = [];
  state.trip.stops.forEach((s,i) => { const p = PV.byId(s.id); if (!p||!p.coords) return; const ll=[p.coords[1],p.coords[0]]; pts.push(ll);
    const z = map.getZoom(), sz = z <= 13 ? 20 : z === 14 ? 26 : 34, showBadge = z >= 15;
    L.marker(ll, {zIndexOffset:1000, icon:L.divIcon({className:'', iconSize:[sz,sz], iconAnchor:[sz/2,sz/2],
      html:`<div class="stop">${showBadge?'<div class="badge3d">ĐIỂM ĐẾN CỦA BẠN</div>':''}<div class="num ${s.by==='me'?'mine':''}" style="width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.42)}px;border-width:${sz<26?2:3}px">${i+1}</div></div>`})})
     .addTo(tripLayer).bindTooltip(`${i+1}. ${esc(p.name)}${s.arrive?' · '+s.arrive:''}`).on('click', ()=>PV.openPlace(p.id,{noMap:true})); });
  if (pts.length > 1) L.polyline(pts, {color:'#3D7FB8', weight:4, opacity:.75, dashArray:'8 8'}).addTo(tripLayer);
};
PV.focusPlace = (id) => { const p=PV.byId(id); if (!map||!p||!p.coords) return; map.setView([p.coords[1],p.coords[0]], 17, {animate:false}); PV.openPlace(id,{noMap:true}); };
function locate(){
  if (!navigator.geolocation){ PV.toast('Thiết bị không hỗ trợ định vị'); return; }
  PV.toast('Đang xin quyền vị trí…');
  navigator.geolocation.getCurrentPosition(pos => { PV.userPos=[pos.coords.longitude,pos.coords.latitude]; showMe(true); drawPlaces(); },
    () => PV.toast('Bạn chưa cấp quyền vị trí – vẫn có thể tìm địa điểm thủ công'), {enableHighAccuracy:true, timeout:10000});
}
function showMe(fly){ if (!map||!PV.userPos) return; const ll=[PV.userPos[1],PV.userPos[0]];
  if (meMarker) meMarker.remove(); meMarker = L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="youarehere"></div>',iconSize:[18,18]})}).addTo(map).bindTooltip('Bạn đang ở đây');
  if (fly) map.setView(ll, 16, {animate:false}); }
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
PV.norm = norm;
// Tìm địa điểm bằng cả tiếng Việt (có/không dấu) lẫn tiếng Anh: "Ben Thanh market", "war museum", "coffee", "pagoda"…
// Mỗi từ trong câu tìm phải có trong tên / tên tiếng Anh / nổi bật / loại / địa chỉ; tên khớp được xếp trước.
const EN_WORDS = [ // từ tiếng Việt (đã bỏ dấu) → từ tiếng Anh khách hay gõ
  ['cho','market'], ['bao tang','museum'], ['chua','pagoda temple'], ['nha tho','church cathedral'], ['dinh','palace'],
  ['buu dien','post office'], ['nha hat','opera house theatre theater'], ['my thuat','fine arts art'], ['chung tich chien tranh','war'],
  ['am thuc','food eat restaurant'], ['quan','restaurant eatery'], ['ca phe','coffee cafe'], ['banh mi','sandwich baguette bread'],
  ['com tam','broken rice'], ['pho','noodle soup'], ['hu tieu','noodle soup'], ['bun','noodle vermicelli'], ['lau','hotpot'],
  ['che','dessert sweet'], ['xoi','sticky rice'], ['oc','snail seafood'], ['hai san','seafood'], ['nuong','bbq grill grilled'],
  ['qua luu niem','souvenir gift'], ['dac san','specialty local'], ['thoi trang','fashion clothes'], ['cong vien','park'], ['cau','bridge']];
const CAT_WORDS = { history:'history historic sight landmark', checkin:'photo landmark sight', shopping:'shopping shop', food:'food eat',
  nature:'nature park', entertainment:'entertainment fun' };
const STOP = new Set(['the','of','a','an','in','at','to','near','and','saigon','hcmc','sai','gon','city','vietnam','tp','hcm']);
const hasW = (hay, w) => new RegExp('(^|[^a-z0-9])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^a-z0-9])').test(hay);
let HAY = null;
const hayOf = (p) => { HAY = HAY || new Map(); let h = HAY.get(p); if (h) return h;
  const city = x => x.replace(/thanh pho( ho chi minh)?|tp\.? ?hcm/g,' '); // "Thành phố" ≠ phở
  const nm = city(norm(p.name+' '+(p.name_en||''))), kind = norm(p.kind||'');
  const en = EN_WORDS.filter(([vi]) => hasW(nm+' '+kind, vi)).map(x=>x[1]).join(' ');
  const rest = norm([(p.highlights||[]).join(' '), (p.highlights_en||[]).join(' '), p.address, kind,
    (p.cats||[]).map(c=>CAT_WORDS[c]||c).join(' '), en].join(' '));
  h = {nm, all: nm+' '+city(rest)}; HAY.set(p, h); return h; };
PV.findPlaces = (q) => {
  const nq = norm(q||'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); if (!nq) return [];
  const toks = nq.split(' ').filter(t => t && !STOP.has(t)); if (!toks.length) toks.push(...nq.split(' '));
  const out = [];
  D.places.forEach(p => { const h = hayOf(p);
    const inName = h.nm.includes(nq) || toks.every(t => h.nm.includes(t));
    if (!inName && !h.all.includes(nq) && !toks.every(t => t.length < 3 ? hasW(h.all, t) : h.all.includes(t))) return;
    out.push([inName ? 0 : 1, p]); });
  return out.sort((a,b) => a[0]-b[0]).map(x => x[1]);
};
function search(q, live){
  const box = $('#qres'); if (!q){ box.innerHTML=''; return; }
  const nq = norm(q).replace(/^(duong|pho)\s+/,'').replace(/\s+(street|st|road|rd|walking street)\.?$/,'').trim();
  const streets = D.streets.filter(s => norm(s.name).includes(nq)).slice(0,4);
  const places = PV.findPlaces(q).slice(0,6);
  box.innerHTML = streets.map(s=>`<div class="pitem" data-sid="${s.id}"><div class="pin" style="background:#5B9BD5"><span>🛣️</span></div><div><b>Đường ${esc(s.name)}</b><div class="small muted">Câu chuyện tên đường · ${esc(s.wards)}</div></div></div>`).join('')
    + places.map(PV.pitem).join('')
    + (!live ? `<div class="small muted" style="padding:4px">Đang tìm thêm trên OpenStreetMap…</div>` : '');
  PV.bindItems(box);
  $$('[data-sid]', box).forEach(el => el.onclick = () => showStreet(D.streets.find(s=>s.id===el.dataset.sid)));
  if (live) return;
  if (streets.length===1 && !places.length) showStreet(streets[0]);
  fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&countrycodes=vn&viewbox=106.66,10.81,106.73,10.75&q=${encodeURIComponent(q+', Hồ Chí Minh')}`)
   .then(r=>r.json()).then(js => { const more = box.querySelector('.small.muted:last-child'); if (more) more.remove();
     box.insertAdjacentHTML('beforeend', js.map((r,i)=>`<div class="pitem" data-osm="${i}"><div class="pin" style="background:#9DB4C6"><span>📍</span></div><div><b>${esc(r.name||r.display_name.split(',')[0])}</b><div class="tiny muted">${esc(r.display_name.split(',').slice(1,4).join(','))} · OpenStreetMap</div></div></div>`).join('') || '');
     $$('[data-osm]', box).forEach(el => el.onclick = () => { const r=js[+el.dataset.osm]; map.setView([+r.lat,+r.lon], 17, {animate:false}); L.popup().setLatLng([+r.lat,+r.lon]).setContent(`<b>${esc(r.name||'')}</b><br><span class="tiny">${esc(r.display_name)}</span><br><span class="tiny muted">Dữ liệu OpenStreetMap – chưa có trong kho Personavel</span>`).openOn(map); });
   }).catch(()=>{ const more = box.querySelector('.small.muted:last-child'); if (more) more.textContent='Không kết nối được OpenStreetMap'; });
}
function showStreet(s){
  if (!s) return; PV.markStreet(s.id);
  const card = `<div style="max-width:280px"><b style="font-size:16px">Đường ${esc(s.name)}</b><div class="tiny muted">Phường ${esc(s.wards)} · ${esc(s.area||'')}</div><p class="small" style="margin:6px 0">${esc(s.story)}</p><button class="btn sm" id="st-say">🔊 Nghe thuyết minh</button>
   ${clusterOf(s)}<div class="tiny muted" style="margin-top:6px">Nguồn: tư liệu nhóm Personavel tổng hợp · cần đối chiếu sử liệu</div></div>`;
  const open = (ll, geo) => {
    if (!map) return; streetLayer.clearLayers();
    if (geo){ const g=L.geoJSON(geo,{style:{color:'#E85D5D',weight:7,opacity:.75}}).addTo(streetLayer); try{ map.fitBounds(g.getBounds().pad(.2), {animate:false}); }catch(e){ map.setView(ll,16,{animate:false}); } }
    else map.setView(ll, 16, {animate:false});
    L.popup({maxWidth:300}).setLatLng(ll).setContent(card).openOn(map);
    setTimeout(()=>{ const b=document.getElementById('st-say'); if (b) b.onclick=()=>PV.narrate(s, b); }, 50);
  };
  if (s._ll) return open(s._ll, s._geo);
  fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&polygon_geojson=1&countrycodes=vn&viewbox=106.66,10.81,106.73,10.75&bounded=1&q=${encodeURIComponent('Đường '+s.name.replace(' và ',' ')+', Hồ Chí Minh')}`)
   .then(r=>r.json()).then(js => { const r = js.find(x=>x.category==='highway') || js[0];
     if (!r) return open([10.7765,106.6985]); s._ll=[+r.lat,+r.lon]; s._geo=r.geojson && r.geojson.type!=='Point' ? r.geojson : null; open(s._ll, s._geo); })
   .catch(()=> open([10.7765,106.6985]));
}
PV.showStreet = showStreet;
function clusterOf(s){ const c = D.clusters.find(c=>c.streets.some(n=>s.name.includes(n))); return c ? `<div class="tiny" style="margin-top:8px;padding:6px 8px;border-radius:10px;background:#F0F6FC"><b>${esc(c.name)}</b> (${esc(c.ward)}): ${esc(c.streets.join(', '))}</div>` : ''; }

/* ---------- TRIP ---------- */
let tmap;
PV.views.trip = (m) => {
  const t = state.trip; if (!t.origin && PV.origin()) t.origin = PV.origin();
  if (!t.origin || !(t.origin.gps || PV.area(t.origin.id))){ const a0 = PV.area('ben-thanh'); t.origin = {name:PV.L('Phường ','')+a0.name, c:a0.c, id:a0.id, auto:true}; } // khách mới: chưa chọn thì tạm lấy trung tâm
  PV.retime(t);
  m.innerHTML = `<h1 class="title">Lịch trình của tôi</h1><p class="sub">Điểm <span class="tag" style="background:#FFE3B8">vàng cam</span> do AI đề xuất · điểm <span class="tag" style="background:#E3DAF6">tím</span> do bạn tự thêm</p>
  <div class="grid g2">
    <div class="card">
      <div class="row"><input class="input" id="tt" value="${esc(t.title)}" style="flex:1;min-width:180px"></div>
      <div class="row" style="margin:10px 0 0"><label class="small" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">🚩 Xuất phát từ <select class="input" id="to" style="width:100%;padding:6px 10px">
        <option value="gps" ${t.origin && t.origin.gps ? 'selected':''}>📍 Vị trí hiện tại của tôi</option>
        ${PV.AREAS.map(a=>`<option class="notr" value="${a.id}" ${t.origin && t.origin.id===a.id ? 'selected':''}>${PV.L(`Phường ${a.name} (Q.${a.old} cũ) – ${a.hint}`, `${a.name} ward (old District ${a.old}) – ${a.hint_en||a.hint}`)}</option>`).join('')}</select></label></div>
      ${t.origin && t.origin.auto ? `<div class="tiny muted" style="margin-top:4px">${PV.L('Đang tạm xuất phát từ trung tâm (Chợ Bến Thành) – đổi ở ô trên nếu bạn ở chỗ khác.','Starting from the city centre (Ben Thanh Market) for now – change it above if you are elsewhere.')}</div>` : ''}
      <div class="row" style="margin:10px 0"><label class="small">Bắt đầu <input class="input" type="time" id="ts" value="${esc(t.start)}" style="width:auto;padding:6px 10px"></label>
        <label class="small">Di chuyển <select class="input" id="tm" style="width:auto;padding:6px 10px">${Object.entries(PV.MODES).map(([k,v])=>`<option value="${k}" ${t.mode===k?'selected':''}>${v.name}</option>`).join('')}</select></label></div>
      <div class="stops" id="stops"></div>
      ${t.stops.length?`<div class="row" style="margin-top:12px"><span class="small muted">Tổng quãng đường ~${PV.fmtKm(t.km||0)} · chi phí ước tính ~${PV.fmtVnd(t.cost||0)}/người</span></div>`:''}
      <div class="row" style="margin-top:14px"><button class="btn" id="tai">✨ ${t.stops.length?'Tạo lại':'Tạo'} lịch trình từ điểm xuất phát</button><button class="btn ghost" id="tchat">💬 ${PV.L('Hỏi','Ask')} ${(PV.GUIDES.find(g=>g.id==='ha')||PV.todayGuide()).name}</button><a class="btn ghost" href="#map">${ICON.plus.replace('<svg','<svg width=16 height=16')} Thêm từ bản đồ</a>
      ${t.stops.length?'<button class="btn mint" id="tsave">Lưu vào nhật ký</button><button class="btn ghost" id="tclear">Xóa lịch trình</button>':''}</div>
    </div>
    <div class="card" style="padding:10px"><div id="tripmap"></div><p class="tiny muted" id="tripRouteNote" style="margin:6px 4px 0">Đường nối thể hiện thứ tự tham quan (đường chim bay). Bấm "Chỉ đường" ở từng điểm để xem tuyến thực tế.</p></div>
  </div>`;
  const list = $('#stops');
  if (!t.stops.length) list.innerHTML = `<div class="empty">Lịch trình đang trống.<br>Hãy nhờ chatbot gợi ý hoặc thêm địa điểm từ bản đồ.</div>`;
  else list.innerHTML = (t.origin ? `<div class="stopcard origin"><div class="n">🚩</div><div style="flex:1;min-width:0"><b>${PV.L('Xuất phát: ','Start: ')}${esc(t.origin.name)}</b><div class="small muted">${esc(t.start)} · ${PV.MODE_IC[t.mode]||''} ${PV.MODES[t.mode].name}</div></div></div>` : '') + t.stops.map((s,i) => { const p = PV.byId(s.id); if (!p) return '';
    const from = i ? PV.byId(t.stops[i-1].id)?.coords : (t.origin && t.origin.c); const tip = PV.legTip(s.leg, t.mode), dw = PV.doWhat(p);
    return `${s.leg?`<div class="leg">↓ ${PV.MODE_IC[t.mode]||''} ${PV.MODES[t.mode].name} ~${s.leg.min} phút · ${PV.fmtKm(s.leg.km)}${tip?' · '+esc(tip):''}${from && p.coords?` · <a href="${PV.dirUrl(from, p.coords, t.mode)}" target="_blank" rel="noopener">Chỉ đường</a>`:''}</div>`:''}
    <div class="stopcard"><div class="n ${s.by==='me'?'mine':''}">${i+1}</div><div style="flex:1;min-width:0"><b data-pid="${p.id}" style="cursor:pointer">${esc(p.name)}</b>
      <div class="small muted">${s.arrive||''} – ${s.leave||''} · ${esc(p.kind)} · ${PV.priceText(p.price_level)}</div>
      ${dw?`<div class="small dowhat">${esc(dw)}</div>`:''}
      ${p.price && p.price[0] ? `<div class="tiny muted">💵 ${esc(String(p.price[0]).replace(/\s*\(tham khảo\)/i,'').slice(0,90))}</div>` : ''}
      ${PV.stopLinks(p, null, t.mode)}
      ${s.tag?`<span class="tag meal">${s.tag.startsWith('Ăn vặt')?'🍡':'🍽️'} ${esc(s.tag)}</span>`:''}
      ${(()=>{ const a=PV.toMin(s.arrive||'0:0'); return PV.hourRanges(p) && !PV.openFor(p, a, 20) ? '<span class="tag warn">Có thể ngoài giờ mở cửa</span>' : ''; })()}
      <span class="tag">${s.by==='me'?'Bạn tự thêm':'AI đề xuất'}</span>
      ${(()=>{ if(!PV.placeTips) return ''; const k=PV.placeTips(p).filter(x=>/👔|👘|👜|🕯️|🏫|🎭|🏗️|⚠️/.test(x[0])).slice(0,2); return k.length?`<div class="stoptips">${k.map(x=>`<span>${x[0]} ${x[1]}</span>`).join('')}</div>`:''; })()}</div>
      <div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn ghost sm" data-up="${i}" aria-label="Lên">${ICON.up.replace('<svg','<svg width=14 height=14')}</button><button class="btn ghost sm" data-dn="${i}" aria-label="Xuống">${ICON.down.replace('<svg','<svg width=14 height=14')}</button><button class="btn ghost sm" data-rm="${i}" aria-label="Xóa">${ICON.x.replace('<svg','<svg width=14 height=14')}</button></div></div>`; }).join('');
  PV.bindItems(list);
  const upd = () => { PV.retime(t); PV.save('trip'); PV.views.trip(m); };
  $$('[data-up]',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.up; if(i>0){ [t.stops[i-1],t.stops[i]]=[t.stops[i],t.stops[i-1]]; upd(); } });
  $$('[data-dn]',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.dn; if(i<t.stops.length-1){ [t.stops[i+1],t.stops[i]]=[t.stops[i],t.stops[i+1]]; upd(); } });
  $$('[data-rm]',m).forEach(b=>b.onclick=()=>{ t.stops.splice(+b.dataset.rm,1); upd(); });
  $('#tt').onchange = e => { t.title=e.target.value; PV.save('trip'); };
  $('#ts').onchange = e => { t.start=e.target.value||'08:00'; upd(); };
  $('#tm').onchange = e => { t.mode=e.target.value; upd(); };
  $('#to').onchange = e => { const v = e.target.value; if (!v) return;
    const setO = (o) => { t.origin = o; const pr = state.profile && state.profile.prefs; if (pr){ pr.start = v; if (o.gps) pr.startPos = o.c; PV.save('profile'); } upd(); };
    if (v === 'gps'){ if (!navigator.geolocation){ PV.toast('Thiết bị không hỗ trợ định vị'); return; }
      PV.toast('Đang xin quyền vị trí…');
      navigator.geolocation.getCurrentPosition(pos => { PV.userPos=[pos.coords.longitude,pos.coords.latitude]; setO({name:PV.L('Vị trí của bạn','Your location'), c:PV.userPos, gps:true}); },
        () => PV.toast('Bạn chưa cấp quyền vị trí – hãy chọn một phường'), {enableHighAccuracy:true, timeout:10000}); }
    else { const a = PV.area(v); setO({name:PV.L('Phường ','')+a.name, c:a.c, id:a.id}); } };
  $('#tai').onclick = () => {
    const og = t.origin || PV.origin();
    if (!og){ PV.toast('Hãy chọn điểm xuất phát trước nhé'); $('#to').scrollIntoView({block:'center'}); $('#to').focus(); return; }
    const pm = (state.profile?.prefs?.move||[])[0]; const nt = PV.buildTrip({origin: og, mode: t.stops.length || !pm ? t.mode : pm, start: t.start});
    if (!nt){ PV.toast('Chưa tìm được lịch trình phù hợp'); return; }
    nt.origin = Object.assign({}, og); state.trip = nt; PV.retime(nt); PV.save('trip'); PV.views.trip(m);
    PV.toast(PV.L('Đã tạo lịch trình gần ','Itinerary created near ') + og.name); };
  const tch = $('#tchat'); if (tch) tch.onclick = () => { // lịch trình là việc của Hà → mở thẳng Hà, hỏi bằng ngôn ngữ đang dùng
    const q = PV.L('Gợi ý cho mình lịch trình khám phá Sài Gòn trong một ngày phù hợp với phong cách của mình','Suggest a one-day Saigon itinerary that fits my style');
    if (PV.switchGuide) PV.switchGuide('ha', q); else { PV.pendingAsk = q; location.hash='#chat'; } };
  const sv = $('#tsave'); if (sv) sv.onclick = () => PV.saveDiary();
  const cl = $('#tclear'); if (cl) cl.onclick = () => { t.stops=[]; upd(); };
  if (!window.L && t.stops.length) PV.loadLeaflet().then(() => { if (location.hash === '#trip') PV.route(); }).catch(()=>{});
  if (window.L){
    tmap = L.map('tripmap').setView([10.7795,106.6935], 14);
    PV.baseLayer(tmap);
    const pts=[]; if (t.origin && t.stops.length){ const ll=[t.origin.c[1],t.origin.c[0]]; pts.push(ll);
      L.marker(ll,{icon:L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,30],html:'<div class="startflag">🚩</div>'})}).addTo(tmap).bindTooltip(PV.L('Xuất phát: ','Start: ')+esc(t.origin.name)); }
    t.stops.forEach((s,i)=>{ const p=PV.byId(s.id); if(!p) return; const ll=[p.coords[1],p.coords[0]]; pts.push(ll);
      L.marker(ll,{icon:L.divIcon({className:'',iconSize:[34,34],iconAnchor:[17,17],html:`<div class="stop"><div class="num ${s.by==='me'?'mine':''}">${i+1}</div></div>`})}).addTo(tmap).bindTooltip(esc(p.name)); });
    if (pts.length>1) PV._tripLine = L.polyline(pts,{color:'#3D7FB8',weight:4,dashArray:'8 8'}).addTo(tmap);
    PV._tripMap = tmap;
    if (pts.length) tmap.fitBounds(L.latLngBounds(pts).pad(.3));
    PV._leave = () => { try { tmap && tmap.off() && tmap.remove(); } catch(e){} tmap=null; };
  }
};
PV.saveDiary = () => {
  const t = state.trip; if (!t.stops.length) return;
  PV.modal(`<h3>Lưu vào Nhật ký hành trình</h3>
   <label class="small">Tên hành trình<input class="input" id="dn" value="${esc(t.title)}"></label>
   <label class="small" style="display:block;margin-top:8px">Ngày đi<input class="input" type="date" id="dd" value="${new Date().toISOString().slice(0,10)}"></label>
   <label class="small" style="display:block;margin-top:8px">Cảm nhận của bạn<textarea class="input" id="dt" rows="3" placeholder="Điều bạn nhớ nhất trong chuyến đi…"></textarea></label>
   <label class="small" style="display:block;margin-top:8px">Ảnh bìa (tùy chọn)<input type="file" accept="image/*" id="df"></label>
   <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn" id="dok">Lưu</button></div>`, (box, close) => {
    $('#dok',box).onclick = async () => {
      let img = null; const f = $('#df',box).files[0]; if (f) img = await PV.shrink(f, 480);
      state.diaries.unshift({id:'d'+Date.now(), title:$('#dn',box).value, date:$('#dd',box).value, note:$('#dt',box).value, img, stops:t.stops.map(s=>s.id)});
      PV.save('diaries'); PV.addPoints(15,'Lưu nhật ký hành trình'); close(); location.hash='#profile';
    };
  });
};
PV.shrink = (file, max) => new Promise(res => { const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{ const k=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=im.width*k; c.height=im.height*k; c.getContext('2d').drawImage(im,0,0,c.width,c.height); res(c.toDataURL('image/jpeg',.72)); }; im.onerror=()=>res(null); im.src=r.result; }; r.readAsDataURL(file); });
PV.modal = (html, bind) => {
  const bg = document.createElement('div'); bg.className='modal-bg'; bg.innerHTML=`<div class="modal" role="dialog">${html}</div>`; document.body.appendChild(bg);
  const close = () => bg.remove(); bg.addEventListener('click', e => { if (e.target===bg || e.target.hasAttribute('data-close')) close(); });
  if (bind) bind(bg, close); return close;
};

/* ---------- COLLECTION ---------- */
PV.badges = () => {
  const v = Object.keys(state.visited).map(PV.byId).filter(Boolean);
  const n = c => v.filter(p=>p.cats.includes(c)).length;
  return [
    {id:'b1', e:'🏛️', name:'Nhà sử học nhí', need:'Ghé 5 địa điểm lịch sử – văn hóa', cur:n('history'), max:5},
    {id:'b2', e:'🍜', name:'Thực khách Sài Gòn', need:'Thưởng thức 5 quán ăn', cur:n('food'), max:5},
    {id:'b3', e:'⭐', name:'Thợ săn Michelin', need:'Ghé 2 quán được Michelin Guide giới thiệu', cur:v.filter(p=>p.michelin).length, max:2},
    {id:'b4', e:'🛍️', name:'Tín đồ quà lưu niệm', need:'Ghé 3 cửa hàng quà – đặc sản', cur:n('shopping'), max:3},
    {id:'b5', e:'📸', name:'Thợ săn góc chụp', need:'Ghé 4 điểm kiến trúc – check-in', cur:n('checkin'), max:4},
    {id:'b6', e:'🛣️', name:'Lãng du tên đường', need:'Khám phá câu chuyện của 8 tên đường', cur:Object.keys(state.readStreets).length, max:8},
    {id:'b7', e:'📔', name:'Người giữ kỷ niệm', need:'Lưu 1 nhật ký hành trình', cur:state.diaries.length, max:1},
    {id:'b8', e:'🎧', name:'Người lắng nghe', need:'Nghe 3 bài thuyết minh', cur:state.listened, max:3}
  ].map(b => ({...b, got:b.cur>=b.max}));
};
PV.views.collection = (m) => {
  const all = D.places.filter(p=>p.cats.includes('history') || p.michelin || p.kind==='Thời trang' || p.cats.includes('shopping')).slice(0,40);
  const got = Object.keys(state.visited).length; const total = D.places.length;
  m.innerHTML = `<h1 class="title">Bộ sưu tập Sài Gòn</h1><p class="sub">Mỗi nơi bạn ghé thăm là một dấu mộc điện tử. Hoàn thành chủ đề để mở khóa huy hiệu.</p>
  <div class="card"><div class="row"><b>Tiến độ khám phá</b><span class="spacer"></span><span class="muted small">${got}/${total} địa điểm · ${state.points} điểm</span></div><div class="bar" style="margin-top:8px"><i style="width:${Math.round(got/total*100)}%"></i></div></div>
  <h3 style="margin-top:22px">Huy hiệu</h3><div class="badges">${PV.badges().map(b=>`<div class="badge ${b.got?'got':''}"><div class="e">${b.e}</div><b>${b.name}</b><div class="tiny muted">${b.need}</div><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,b.cur/b.max*100)}%"></i></div><div class="tiny">${Math.min(b.cur,b.max)}/${b.max}</div></div>`).join('')}</div>
  <h3 style="margin-top:22px">Dấu mộc đã nhận</h3>
  <div class="stamps">${Object.keys(state.visited).map(PV.byId).filter(Boolean).map(p=>`<div class="stamp got ${PV.mainCat(p)}" data-pid="${p.id}">${esc(p.name)}<br><span class="tiny">${esc(state.visited[p.id])}</span></div>`).join('') || '<div class="empty">Chưa có dấu mộc. Khi đến một địa điểm, mở thông tin và bấm “Tôi đã ghé thăm”.</div>'}</div>
  <h3 style="margin-top:22px">Dấu mộc đang chờ bạn</h3>
  <div class="stamps">${all.filter(p=>!state.visited[p.id]).map(p=>`<div class="stamp" data-pid="${p.id}">${esc(p.name)}</div>`).join('')}</div>`;
  PV.bindItems(m);
};
})();
