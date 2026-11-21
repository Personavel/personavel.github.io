/* ===== Personavel – core ===== */
(function(){
'use strict';
const D = window.PV_DATA;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* only allow image sources we create ourselves (photos read on this device, our own files) or https images */
const safeImg = u => { u = String(u || ''); return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u) || /^https:\/\/[^\s"'<>]+$/.test(u) || /^img\/[\w\/.-]+$/.test(u) ? u : ''; };
/* links: http(s), tel and mailto only – never javascript: */
const safeUrl = u => { u = String(u || '').trim(); return /^(https?:|tel:|mailto:)/i.test(u) ? u : '#'; };
const PV = window.PV = {D, $, $$, esc, safeImg, safeUrl};

/* ---------- storage (localStorage, fallback to memory) ---------- */
const mem = {};
PV.store = {
  get(k, d){ try{ const v = localStorage.getItem('pv_'+k); return v==null ? (k in mem ? mem[k] : d) : JSON.parse(v); }catch(e){ return k in mem ? mem[k] : d; } },
  set(k, v){ mem[k] = v; try{ localStorage.setItem('pv_'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ delete mem[k]; try{ localStorage.removeItem('pv_'+k); }catch(e){} }
};
const S = PV.store;
/* Leaflet is only downloaded when a map is needed (web build); the offline single file has it built in */
let leafletP = null;
PV.loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);
  const src = window.PV_LEAFLET; if (!src) return Promise.reject(new Error('no leaflet'));
  return leafletP = leafletP || new Promise((ok, fail) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = src.css; document.head.appendChild(css);
    const js = document.createElement('script'); js.src = src.js; js.async = true;
    js.onload = () => ok(window.L); js.onerror = () => { leafletP = null; fail(new Error('leaflet load failed')); };
    document.head.appendChild(js);
  });
};
PV.state = {
  profile: S.get('profile', null),       // {name, avatar, joined, prefs, persona}
  trip: S.get('trip', {title:'Hành trình của tôi', start:'08:00', mode:'moto', stops:[]}),
  visited: S.get('visited', {}),          // id -> date
  diaries: S.get('diaries', []),
  readStreets: S.get('readStreets', {}),
  listened: S.get('listened', 0),
  points: S.get('points', 0),
  settings: S.get('settings', {reduce:false, guide:null}),
  chat: S.get('chat', []),
  history: S.get('history', [])           // recently viewed place ids
};
PV.save = k => S.set(k, PV.state[k]);

/* ---------- categories ---------- */
PV.CATS = {
  history:{name:'Văn hóa – Lịch sử', color:'#1F6FC5', emoji:'🏛️'},
  food:{name:'Ẩm thực', color:'#E8590C', emoji:'🍜'},
  entertainment:{name:'Vui chơi – Giải trí', color:'#D6336C', emoji:'🎡'},
  nature:{name:'Thiên nhiên – Thư giãn', color:'#2F9E44', emoji:'🌳'},
  shopping:{name:'Mua sắm', color:'#8E44AD', emoji:'🛍️'},
  checkin:{name:'Kiến trúc – Check-in', color:'#0B7285', emoji:'📸'}
};
PV.mainCat = p => (p.cats.includes('history') ? 'history' : p.cats[0]);
PV.byId = id => D.places.find(p => p.id === id);
PV.priceText = l => l==null ? 'Chưa xác minh' : ['Miễn phí','Dưới 50.000đ','50.000 – 150.000đ','Trên 150.000đ'][l];

/* ---------- geo ---------- */
PV.dist = (a, b) => { // [lng,lat] -> km
  const R=6371, toR=x=>x*Math.PI/180;
  const dLat=toR(b[1]-a[1]), dLng=toR(b[0]-a[0]);
  const h=Math.sin(dLat/2)**2+Math.cos(toR(a[1]))*Math.cos(toR(b[1]))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
};
PV.MODES = {walk:{name:'Đi bộ', kmh:4.5, road:1.25}, moto:{name:'Xe máy', kmh:18, road:1.35}, car:{name:'Ô tô', kmh:15, road:1.35}, taxi:{name:'Taxi / Grab', kmh:16, road:1.35}, bus:{name:'Xe buýt', kmh:12, road:1.4}, metro:{name:'Metro', kmh:22, road:1.5}};
PV.travel = (a, b, mode='moto') => { const m=PV.MODES[mode]||PV.MODES.moto; const km=PV.dist(a,b)*m.road; const extra = mode==='walk'?0 : mode==='metro'||mode==='bus' ? 10 : 4; return {km, min:Math.max(3, Math.round(km/m.kmh*60 + extra))}; };
PV.fmtKm = km => km<1 ? Math.round(km*1000)+' m' : km.toFixed(1)+' km';
PV.userPos = null;
/* where the visitor starts: one of the central wards, or their own GPS position */
PV.AREAS = [
  {id:'ben-thanh', old:1, name:'Bến Thành', hint:'Chợ Bến Thành, phố đi bộ Nguyễn Huệ', hint_en:'Bến Thành Market, Nguyễn Huệ walking street', c:[106.6981,10.7725]},
  {id:'sai-gon', old:1, name:'Sài Gòn', hint:'Nhà thờ Đức Bà, Bưu điện, Nhà hát', hint_en:'Notre-Dame Cathedral, Post Office, Opera House', c:[106.6995,10.7795]},
  {id:'tan-dinh', old:1, name:'Tân Định', hint:'Chợ và Nhà thờ Tân Định', hint_en:'Tân Định Market & Church', c:[106.6904,10.7893]},
  {id:'xuan-hoa', old:3, name:'Xuân Hòa', hint:'Hồ Con Rùa, Võ Văn Tần', hint_en:'Turtle Lake, Võ Văn Tần', c:[106.6915,10.7826]},
  {id:'nhieu-loc', old:3, name:'Nhiêu Lộc', hint:'Kỳ Đồng, Lê Văn Sỹ', hint_en:'Kỳ Đồng, Lê Văn Sỹ', c:[106.6810,10.7855]},
  {id:'ban-co', old:3, name:'Bàn Cờ', hint:'Chợ Bàn Cờ, Nguyễn Thiện Thuật', hint_en:'Bàn Cờ Market, Nguyễn Thiện Thuật', c:[106.6815,10.7705]},
  {id:'cau-ong-lanh', old:1, name:'Cầu Ông Lãnh', hint:'Nguyễn Thái Học, Cô Giang', hint_en:'Nguyễn Thái Học, Cô Giang', c:[106.6962,10.7660]}
];
PV.area = id => PV.AREAS.find(a => a.id === id) || null;
/* the starting point used for suggestions and itineraries: {name, c:[lng,lat], gps?} */
PV.origin = () => {
  const pr = PV.state.profile?.prefs || {};
  if (pr.start === 'gps' && PV.userPos) return {name:PV.L('Vị trí của bạn','Your location'), c:PV.userPos, gps:true};
  if (pr.start === 'gps' && pr.startPos) return {name:PV.L('Vị trí của bạn','Your location'), c:pr.startPos, gps:true};
  const a = PV.area(pr.start); return a ? {name:PV.L('Phường ','')+a.name, c:a.c, id:a.id} : null;
};

/* ---------- time helpers ---------- */
PV.toMin = t => { const [h,m]=String(t).split(':').map(Number); return h*60+(m||0); };
PV.fmtT = m => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
// Mọi khung giờ mở cửa trong dòng giờ đầu tiên có giờ cụ thể (ví dụ "7h00–12h00, 14h00–17h00"), tính bằng phút
PV.hourRanges = p => {
  for (const line of (p.hours||[])){
    const re = /(\d{1,2})\s*[:h]\s*(\d{2})?\s*[–\-—]\s*(\d{1,2})\s*[:h]\s*(\d{2})?/g; const out = []; let m;
    while ((m = re.exec(line))){ const o = +m[1]*60+(+m[2]||0); let c = +m[3]*60+(+m[4]||0); if (c<=o) c+=1440; out.push([o,c]); }
    if (out.length) return out;
  }
  return null;
};
PV.parseHours = p => { const r = PV.hourRanges(p); return r ? [r[0][0], r[r.length-1][1]] : null; }; // giờ mở sớm nhất – đóng muộn nhất
// Tới lúc arr, ở khoảng stay phút: điểm có đang mở không? (điểm tham quan không ghi giờ: chỉ ban ngày 7h–17h30)
PV.openFor = (p, arr, stay) => {
  const r = PV.hourRanges(p), need = Math.min(stay || 30, 45);
  if (r) return r.some(([o, c]) => arr >= o - 60 && Math.max(arr, o) + need <= c);
  if (p.cats && p.cats.includes('history') && !PV.foodType(p)) return arr >= 7*60 && arr + need <= 17*60+30;
  return true;
};

/* ---------- robots (original mascot) ---------- */
PV.GUIDES = [
  {id:'an', name:'An', role:'Trưởng đoàn – mê lịch sử', dress:'#D62839', trim:'#FFD36E', greet:'Xin chào! Mình là An. Hôm nay mình dẫn bạn đi nghe những câu chuyện của Sài Gòn nhé!', voice:'nhẹ nhàng, chu đáo'},
  {id:'uyen', name:'Uyên', role:'Chuyên gia ẩm thực', dress:'#F4A261', trim:'#FFF1C1', greet:'Chào bạn! Uyên đây. Đói chưa? Mình biết nhiều quán ngon lắm đó!', voice:'vui vẻ, hào hứng'},
  {id:'ha', name:'Hà', role:'Hướng dẫn viên truyền thông', dress:'#5B9BD5', trim:'#D5EAF8', greet:'Hà xin chào! Cần lên lịch trình hay hỏi đường, cứ gọi Hà nha.', voice:'năng động, rõ ràng'},
  {id:'kiet', name:'Kiệt', role:'Thợ săn góc chụp', dress:'#3FA7C9', trim:'#E3F4FA', greet:'Yo! Kiệt đây. Muốn có ảnh check-in đẹp thì đi với Kiệt!', voice:'trẻ trung, hài hước'},
  {id:'phuong', name:'Phương', role:'Người kể chuyện văn hóa', dress:'#A98BDB', trim:'#F0E8FB', greet:'Chào bạn, Phương đây. Cùng khám phá kiến trúc và văn hóa thành phố nhé!', voice:'sâu lắng, truyền cảm'}
];
PV.todayGuide = () => {
  const chosen = PV.state.settings.guide;
  if (chosen) return PV.GUIDES.find(g=>g.id===chosen) || PV.GUIDES[0];
  const day = Math.floor((Date.now()+7*3600e3)/864e5);
  return PV.GUIDES[day % 5];
};
PV.robot = (g, opt={}) => {
  g = g || PV.todayGuide();
  const wave = opt.wave !== false;
  return `<svg viewBox="0 0 120 140" class="${opt.cls||''}" role="img" aria-label="Hướng dẫn viên ${esc(g.name)}">
  <defs><linearGradient id="hd${g.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCEBF7"/></linearGradient></defs>
  <ellipse cx="60" cy="134" rx="30" ry="4" fill="#294B63" opacity=".12"/>
  <!-- flag arm -->
  <g class="${wave?'wavearm':''}" style="transform-origin:92px 82px">
    <rect x="88" y="70" width="6" height="22" rx="3" fill="${g.dress}" transform="rotate(-35 91 80)"/>
    <line x1="101" y1="40" x2="101" y2="78" stroke="#8C6B3F" stroke-width="2.5"/>
    <rect x="101" y="40" width="20" height="14" fill="#DA251D"/>
    <polygon points="111,43 112.2,46.6 116,46.6 113,48.8 114.1,52.4 111,50.2 107.9,52.4 109,48.8 106,46.6 109.8,46.6" fill="#FFDD00"/>
  </g>
  <!-- body / ao dai -->
  <path d="M38 80 Q60 70 82 80 L88 128 Q60 134 32 128 Z" fill="${g.dress}"/>
  <path d="M52 78 L60 128 L68 78" fill="${g.trim}" opacity=".55"/>
  <rect x="26" y="84" width="8" height="24" rx="4" fill="${g.dress}"/>
  <circle cx="60" cy="96" r="3" fill="${g.trim}"/>
  <!-- head -->
  <rect x="32" y="40" width="56" height="42" rx="18" fill="url(#hd${g.id})" stroke="#A9CDE8" stroke-width="2"/>
  <rect x="40" y="50" width="40" height="24" rx="12" fill="#294B63"/>
  <ellipse class="eye" cx="51" cy="62" rx="4" ry="5" fill="#9FE3FF"/><ellipse class="eye" cx="69" cy="62" rx="4" ry="5" fill="#9FE3FF"/>
  <path d="M54 69 Q60 73 66 69" stroke="#9FE3FF" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="44" cy="70" r="3" fill="#F2B5C9" opacity=".8"/><circle cx="76" cy="70" r="3" fill="#F2B5C9" opacity=".8"/>
  <!-- headphones -->
  <path d="M30 60 Q30 34 60 34 Q90 34 90 60" stroke="#426B87" stroke-width="4" fill="none"/>
  <rect x="24" y="54" width="10" height="16" rx="5" fill="#426B87"/><rect x="86" y="54" width="10" height="16" rx="5" fill="#426B87"/>
  <!-- non la -->
  <path d="M18 42 L60 12 L102 42 Q60 48 18 42 Z" fill="#F3DE8A" stroke="#D9B44A" stroke-width="1.5"/>
  <path d="M34 38 L60 18 M86 38 L60 18 M47 41 L60 15 M73 41 L60 15" stroke="#D9B44A" stroke-width=".8" opacity=".7"/>
  </svg>`;
};

/* ---------- icons ---------- */
const I = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
PV.ICON = {
  home:I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  map:I('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  trip:I('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a4 4 0 000-8h-4a4 4 0 010-8h6"/>'),
  coll:I('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>'),
  chat:I('<path d="M4 5h16v11H8l-4 4z"/><path d="M8 10h8M8 13h5"/>'),
  user:I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
  info:I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  locate:I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'),
  speaker:I('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/>'),
  send:I('<path d="M4 12l16-8-6 16-2-6z"/>'),
  search:I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),
  x:I('<path d="M6 6l12 12M18 6L6 18"/>'),
  up:I('<path d="M12 19V5M6 11l6-6 6 6"/>'), down:I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  gear:I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>')
};

PV.toast = (msg) => { const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2600); };
PV.addPoints = (n, why) => { PV.state.points += n; PV.save('points'); if (why) PV.toast(`+${n} điểm · ${why}`); };

/* ---------- recommendation ---------- */
PV.weights = () => {
  const pr = PV.state.profile && PV.state.profile.prefs;
  const w = {history:1, food:1, shopping:.6, checkin:.8, nature:.6, entertainment:.6};
  if (!pr) return w;
  const like = pr.likes || [];
  const map = {food:'food', history:'history', shopping:'shopping', checkin:'checkin', nature:'nature', relax:'nature', art:'history', fun:'entertainment'};
  for (const k in w) w[k] = .35;
  like.forEach(l => { const c=map[l]; if (c) w[c] = Math.min(2, w[c]+1.2); });
  if (pr.style==='culture') w.history += .6;
  if (pr.style==='checkin') w.checkin += .8;
  if (pr.style==='relax') { w.nature += .6; }
  if ((pr.spaces||[]).includes('market')) w.food += .3;
  if ((pr.spaces||[]).includes('museum')) w.history += .3;
  return w;
};
/* places that work well with children: open spaces, museums with free child tickets, sweets & snacks */
PV.KIDS = new Set(['h0','h1','h3','h5','h6','h7','t0','t1','f14','f21','f27','f29','f40','f69','f71','f73','s9','s13']);
PV.budgetLevel = () => { const b = PV.state.profile?.prefs?.budget; return b==='low'?1 : b==='mid'?2 : b==='high'?3 : b==='lux'?3 : 2; };
PV.score = (p, w = PV.weights()) => {
  let s = 0; p.cats.forEach((c,i) => s += (w[c]||.3) * (i===0?1:.5));
  const bl = PV.budgetLevel();
  if (p.price_level!=null){ if (p.price_level > bl) s -= .6*(p.price_level-bl); else s += .1; }
  const pr = PV.state.profile?.prefs || {};
  if (p.michelin && (pr.food||[]).includes('fine')) s += .5;
  if (p.michelin) s += .15;
  if (((pr.diet||[]).includes('veg') || /chay|vegetarian|vegan/i.test(pr.diet_other||'')) && p.cats.includes('food')) s += /chay/i.test(p.name+p.desc) ? 1.2 : -.8;
  if ((pr.food||[]).includes('street') && p.cats.includes('food') && (p.price_level||1) <= 1) s += .3;
  if (p.geo==='missing' || !p.coords) s -= 5;
  if (p.warning) s -= .2;
  const og = PV.origin();
  if (og && p.coords){ const d = PV.dist(og.c, p.coords), walk = (pr.move||[])[0]==='walk' || (pr.needs||[]).some(x=>x==='kids'||x==='elder'||x==='wheel');
    s -= Math.max(0, d - .6) * (walk ? .8 : .4); }                      // far from where you start = less useful
  if ((pr.needs||[]).includes('kids') || [].concat(pr.with||[]).includes('kids')){   // travelling with children
    if (PV.KIDS.has(p.id)) s += .5;
    if (p.id === 'h8') s -= 1.5;                                                  // war images: hard for small children
  }
  return s;
};
PV.recommend = (n=6, filter=()=>true) => D.places.filter(p=>p.coords && filter(p)).map(p=>({p, s:PV.score(p)})).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.p);

/* ---------- itinerary builder ---------- */
/* what kind of eating stop is this? 'meal' (a real meal), 'snack' (dessert / drinks / street snacks) or null (not a food stop) */
PV.foodType = (p) => {
  if (!p || !p.cats || !p.cats.includes('food')) return null;
  if (p.cats.some(c => c !== 'food' && c !== 'checkin')) return null;           // e.g. markets: visited for sightseeing
  const t = PV.norm([p.name, ...(p.highlights||[]).slice(0,2)].join(' '));
  const nm = PV.norm(p.name);
  if (/^(bun|pho|com|mi |mien|hu tieu|chao|banh canh|canh bun|lau|nha hang|quan an|bo kho|bo bit tet|cha ca|banh da|banh cuon|banh xeo|bo la lot)/.test(nm) && !/che|am thuc/.test(nm)) return 'meal';
  if (/(^| )(che|che nong|flan|milo|milo dam|tau hu|tao pho|banh tieu|banh trang tron|kem tuoi|kem que|tiem kem|tra sua|ca phe|cafe|coffee|sinh to|nuoc ep|bot chien|xoi che|goi cuon|banh beo|bach tuoc|oc|banh can|banh flan|dessert|do uong|nuoc mia)( |$)/.test(t+' ')) return 'snack';
  if (/khu pho am thuc|pho am thuc/.test(t)) return 'snack';
  return 'meal';
};
PV.buildTrip = (o={}) => {
  const pr = PV.state.profile?.prefs || {};
  const custom = pr.time==='other' && pr.time_other ? (pr.time_other.match(/(\d{1,2})\s*(?:h|giờ|:|g)\s*(\d{2})?/i) || null) : null;
  const custom2 = custom ? (pr.time_other.slice(custom.index + custom[0].length).match(/(\d{1,2})\s*(?:h|giờ|:|g)?\s*(\d{2})?/) || null) : null;
  const cStart = custom && +custom[1] < 24 ? String(custom[1]).padStart(2,'0')+':'+(custom[2]||'00') : null;
  const cHours = custom2 && cStart && +custom2[1] < 25 && +custom2[1] > +custom[1] ? (+custom2[1] - +custom[1]) : null;
  const start = PV.toMin(o.start || cStart || (pr.time==='night'?'17:00': pr.time==='evening'?'14:00':'08:00'));
  const hours = o.hours || cHours || (pr.time==='night'||pr.time==='evening' ? 6 : pr.time==='morning' ? 5 : 9);
  const end = Math.min(start + hours*60, Math.max(22*60, start + 3*60));   // không xếp tham quan quá 22h (trừ khi khách bắt đầu rất muộn)
  const mode = o.mode || (pr.move||[])[0] || 'moto';
  const pace = o.pace || pr.pace || 'normal';
  const maxStops = o.stops || (pace==='many'?8 : pace==='slow'?5 : 6);
  const stayK = pace==='slow' ? 1.4 : pace==='many' ? .85 : 1;
  const radius = pace==='near' || mode==='walk' ? 1.6 : 4.5;
  const w = Object.assign(PV.weights(), o.weights||{});
  const exclude = new Set(o.exclude||[]);
  const must = (o.must||[]).map(PV.byId).filter(Boolean);
  let pool = D.places.filter(p => p.coords && !exclude.has(p.id) && p.geo!=='missing' && (o.filter ? o.filter(p) : true));
  if (o.budget!=null) pool = pool.filter(p => p.price_level==null || p.price_level <= o.budget);
  const scored = new Map(pool.map(p => [p.id, PV.score(p, w)]));
  const og = o.origin || PV.origin(); const origin = og ? og.c : (PV.userPos || null);
  // anchor: must-visit or best near origin / centre
  const centre = [106.6985, 10.7765];
  const inMealAt = (m) => [[6*60+30, 10*60], [10*60+45, 14*60], [17*60, 21*60]].some(([x,y]) => m >= x && m <= y);
  const anchorPool = pool.filter(p => (!PV.foodType(p) || (PV.foodType(p) === 'meal' && inMealAt(start))) && PV.openFor(p, start + 10, p.visit_min));
  let cur = must[0] || (anchorPool.length ? anchorPool : pool).slice().sort((a,b)=> (scored.get(b.id) - (origin?PV.dist(origin,b.coords)*.25:0)) - (scored.get(a.id) - (origin?PV.dist(origin,a.coords)*.25:0)))[0];
  if (!cur) return null;
  const stops = []; let t = start; let prev = origin;
  const used = new Set();
  // nhịp ăn như người thật: hai bữa chính cách nhau ≥ 3,5 giờ; ăn vặt cách mọi lần ăn ≥ 2 giờ, tối đa 1 lần
  // (2 lần nếu đi ≥ 10 giờ) và không ăn vặt sát trước một bữa chính chưa ăn; bữa chính cách lần ăn vặt ≥ 1,5 giờ
  const MEALS = [[6*60+30, 10*60, 'Ăn sáng'], [10*60+45, 14*60, 'Ăn trưa'], [17*60, 21*60, 'Ăn tối']];
  const MEAL_GAP = 210, AFTER_SNACK = 90, SNACK_GAP = 120, MAX_SNACK = hours >= 10 ? 2 : 1;
  let lastMealEnd = -1e9, lastFoodEnd = -1e9, snacks = 0, meals = 0;
  const mealWindow = (m) => MEALS.find(([a,b]) => m >= a && m <= b);
  const addStop = (p) => {
    let leg = null;
    if (prev){ leg = PV.travel(prev, p.coords, mode); t += leg.min; }
    const hrs = PV.parseHours(p);
    let wait = 0;
    if (hrs && t < hrs[0] && hrs[0]-t < 90) { wait = hrs[0]-t; t = hrs[0]; }
    const arrive = t; let stay = Math.round((p.visit_min || 45)*stayK/5)*5;
    const rg = PV.hourRanges(p), inR = rg && rg.find(([a, c]) => arrive >= a - 5 && arrive < c);
    if (inR && arrive + stay > inR[1]) stay = Math.max(20, Math.floor((inR[1] - arrive)/5)*5);   // về trước giờ đóng cửa
    t += stay;
    const ft = PV.foodType(p); let tag = null;
    if (ft === 'meal'){ const mw = mealWindow(arrive); tag = mw ? mw[2] : 'Bữa ăn'; lastMealEnd = t; lastFoodEnd = t; meals++; }
    else if (ft === 'snack'){ tag = arrive >= 13*60+30 && arrive < 17*60+30 ? 'Ăn vặt chiều' : 'Ăn vặt / tráng miệng'; lastFoodEnd = t; snacks++; }
    stops.push({id:p.id, arrive:PV.fmtT(arrive), leave:PV.fmtT(t), stay, leg, by:'ai', tag});
    used.add(p.id); prev = p.coords;
  };
  addStop(cur);
  must.slice(1).forEach(p => { if (!used.has(p.id)) addStop(p); });
  const sights = () => stops.filter(x => !x.tag).length;    // số điểm tham quan – quán ăn không chiếm chỗ, để không bỏ bữa chính
  const foods = () => stops.filter(x => x.tag).length, wantFood = foods() + (o.extraFood || 0);   // "thêm quán ăn": thêm 1 quán nếu nhịp ăn cho phép
  while ((sights() < maxStops || foods() < wantFood) && stops.length < maxStops + 3 && t < end - 30){
    let best=null, bs=-1e9;
    for (const p of pool){
      if (used.has(p.id)) continue;
      if (sights() >= maxStops && !PV.foodType(p)) continue;     // đủ điểm tham quan rồi – chỉ còn tìm quán
      const d = PV.dist(prev, p.coords);
      if (d > radius*1.6) continue;
      let s = scored.get(p.id) - d*(mode==='walk'?1.2:.35);
      const tr = PV.travel(prev, p.coords, mode).min, arr = t + tr;
      const ft = PV.foodType(p);
      if (ft === 'meal'){
        const sinceMeal = arr - lastMealEnd, win = mealWindow(arr);
        if (sinceMeal < MEAL_GAP || arr - lastFoodEnd < AFTER_SNACK) s -= 100;   // còn no – chưa ăn bữa nữa (kể cả ngay sau ăn vặt)
        else if (win) s += (stops.some(x => x.tag === win[2]) ? -100 : 2.4);   // one breakfast / lunch / dinner each
        else if (!meals && arr - start > 240) s += .8;                        // long trip without food: allow a late meal
        else s -= 100;                                                        // no full meals outside meal times
      } else if (ft === 'snack'){
        const soon = mealWindow(arr) || mealWindow(arr + 75);                                       // đang/sắp tới giờ một bữa chính
        if (arr - lastFoodEnd < SNACK_GAP) s -= 100;                                                // vừa ăn xong
        else if (snacks >= MAX_SNACK) s -= 100;
        else if (soon && !stops.some(x => x.tag === soon[2]) && arr < end - 90) s -= 100;           // để bụng cho bữa chính sắp tới
        else s += (arr >= 14*60 && arr <= 17*60) || arr >= 19*60+30 ? .9 : .2;                     // ăn vặt chiều hoặc tráng miệng tối
      }
      if (!PV.openFor(p, arr, Math.round((p.visit_min || 45)*stayK))) s -= 100;   // tới nơi lúc chưa mở / sắp đóng cửa → không xếp
      if (/sau giờ học/i.test((p.hours||[]).join(' ')) && arr < 16*60) s -= 3;
      if (s > bs){ bs = s; best = p; }
    }
    if (!best || bs < -50) break;
    addStop(best);
  }
  const total = stops.reduce((a,s)=>a + (s.leg?s.leg.km:0), 0);
  const cost = stops.reduce((a,s)=>{ const p=PV.byId(s.id); return a + ([0,40000,90000,200000][p.price_level ?? 1]); }, 0);
  return {title:o.title || 'Hành trình gợi ý', start:PV.fmtT(start), mode, stops, km:total, cost, created:Date.now(), origin: og ? Object.assign({}, og) : null};
};
PV.retime = (trip) => { // recompute times after manual edits
  let t = PV.toMin(trip.start||'08:00'); let prev = trip.origin ? trip.origin.c : null;
  trip.stops.forEach(s => { const p = PV.byId(s.id); if (!p) return; s.leg = prev ? PV.travel(prev, p.coords, trip.mode) : null; if (s.leg) t += s.leg.min; s.arrive = PV.fmtT(t); s.stay = s.stay || p.visit_min || 45; t += s.stay; s.leave = PV.fmtT(t); prev = p.coords; });
  trip.km = trip.stops.reduce((a,s)=>a+(s.leg?s.leg.km:0),0);
  trip.cost = trip.stops.reduce((a,s)=>{ const p=PV.byId(s.id); return a + ([0,40000,90000,200000][p?.price_level ?? 1]); }, 0);
  return trip;
};
PV.fmtVnd = n => n.toLocaleString('vi-VN') + 'đ';
PV.MODE_IC = {walk:'🚶', moto:'🛵', car:'🚗', taxi:'🚕', bus:'🚌', metro:'🚇'};
/* Google Maps directions between two [lng,lat] points with the closest travel mode */
PV.dirUrl = (a, b, mode) => `https://www.google.com/maps/dir/?api=1&origin=${a[1]},${a[0]}&destination=${b[1]},${b[0]}&travelmode=${mode==='walk'?'walking':(mode==='bus'||mode==='metro')?'transit':'driving'}`;
/* one short, practical line on how to do this leg */
PV.legTip = (leg, mode) => {
  if (!leg) return '';
  if (leg.km <= .7 && mode !== 'walk') return PV.L('Rất gần – có thể đi bộ','Very close – you can walk');
  if (mode === 'walk' && leg.km > 2) return PV.L('Hơi xa để đi bộ – cân nhắc gọi xe','A long walk – consider a ride');
  if (mode === 'taxi') return PV.L('Gọi Grab / Be / Xanh SM','Book Grab / Be / Xanh SM');
  if (mode === 'bus' || mode === 'metro') return PV.L('Xem tuyến và trạm gần nhất trong “Chỉ đường”','See routes and the nearest stop in “Directions”');
  if (mode === 'moto') return PV.L('Gửi xe tại bãi gần điểm đến','Park at a lot near the place');
  return '';
};
/* what to do / eat at a stop, taken from the place's highlights */
// Món nên thử / điểm nên xem – đã làm sạch ghi chú nháp trong dữ liệu ("Chưa xác minh", "cần xác nhận…", "2. Phở Hoài", "Món Giá")
PV.cleanHl = (p, max = 3) => {
  const en = PV.lang === 'en', seen = new Set();
  return ((en && p.highlights_en) || p.highlights || []).map(h => String(h || '')
      .replace(/\s*chưa xác minh\s*/gi, ' ').split(/;|\s{3,}/)[0].replace(/\s+/g, ' ').trim())
    .filter(h => h && h.length < 70 && !/^\d+\.\s/.test(h) && !/^món\s*giá$|^giá\b|cần (xác nhận|xác minh)/i.test(h))
    .filter(h => { const k = h.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, max);
};
PV.doWhat = (p, max = 3) => {
  const hl = PV.cleanHl(p, max);
  if (!hl.length) return '';
  return (PV.foodType(p) ? PV.L('🍴 Nên ăn: ','🍴 What to eat: ') : PV.L('👀 Nên xem: ','👀 What to see: ')) + hl.join(' · ');
};
// Link Google Maps của địa điểm (bỏ tham số theo dõi utm_…); không có thì tìm theo tên + địa chỉ
PV.mapsLink = (p) => {
  if (p.maps_url) { try { const u = new URL(p.maps_url); [...u.searchParams.keys()].filter(k => /^utm_/.test(k)).forEach(k => u.searchParams.delete(k)); return u.toString(); } catch(e) { return p.maps_url; } }
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + ' ' + (p.address || 'TP.HCM'));
};
// Hàng link dưới mỗi điểm trong lịch trình: bản đồ, chỉ đường từ điểm trước, chi tiết, tìm hiểu thêm
PV.stopLinks = (p, from, mode) => {
  const e = PV.esc, a = (href, txt) => `<a href="${e(href)}" target="_blank" rel="noopener">${txt}</a>`;
  return `<div class="stoplinks">${a(PV.mapsLink(p), PV.L('📍 Google Maps','📍 Google Maps'))}${from && p.coords ? a(PV.dirUrl(from, p.coords, mode), PV.L('🧭 Chỉ đường','🧭 Directions')) : ''}<button type="button" class="linkbtn" data-pid="${e(p.id)}">${PV.L('ℹ️ Chi tiết','ℹ️ Details')}</button>${p.source && /^https?:/.test(p.source) ? a(p.source, PV.L('📖 Tìm hiểu thêm','📖 Read more')) : ''}</div>`;
};


/* ---------- MP3 narration (bổ sung sau): audio/<slug>.mp3 next to this HTML file ---------- */
PV.slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
PV.audioFile = item => 'audio/' + (PV.lang==='en' ? 'en/' : '') + (item.story ? 'duong-' : '') + PV.slug(item.name) + '.mp3';
let curAudio = null;
PV.narrate = (item, btn) => {
  if (curAudio){ curAudio.pause(); curAudio = null; if (btn) btn.classList.remove('on'); return; }
  if (window.speechSynthesis && speechSynthesis.speaking){ speechSynthesis.cancel(); }
  const au = new Audio(PV.audioFile(item));
  let fell = false;
  const fallback = () => { if (fell) return; fell = true; curAudio = null; PV.speak(PV.narration(item), btn); };
  au.onerror = fallback;
  au.onended = () => { curAudio = null; if (btn) btn.classList.remove('on'); };
  au.play().then(() => { curAudio = au; if (btn) btn.classList.add('on'); PV.state.listened++; PV.save('listened'); }).catch(fallback);
};

/* ---------- narration (thuyết minh) ---------- */
PV.narration = (p) => {
  const en = PV.lang==='en';
  if (p.story) return en ? `${p.name} Street. ${p.story_en||p.story}` : `Đường ${p.name}. ${p.story}`;
  const nm = en ? (p.name_en||p.name) : p.name, ds = en ? (p.desc_en||PV.tr(p.desc)) : p.desc;
  let t = `${nm}. ${ds}`;
  const hl = en ? (p.highlights_en||p.highlights) : p.highlights;
  if (hl && hl.length && p.cats.includes('history')) t += (en?' Highlights: ':' Điểm nổi bật: ') + hl.join('; ') + '.';
  const hr = en ? (p.hours_en||[]) : (p.hours||[]);
  if (hr.length) t += (en?' Opening hours: ':' Giờ mở cửa: ') + hr[0] + '.';
  return t;
};
let speaking = null;
PV.speak = async (text, btn) => {
  try{
    if (window.claude && window.claude.use){
      const t = await window.claude.use('tts');
      if (t){ await t.speak(text.slice(0,2000)); return; }
    }
  }catch(e){}
  if (!('speechSynthesis' in window)) { PV.toast('Trình duyệt chưa hỗ trợ đọc thuyết minh'); return; }
  if (speaking){ speechSynthesis.cancel(); speaking = null; if (btn) btn.classList.remove('on'); return; }
  const u = new SpeechSynthesisUtterance(text);
  const en = PV.lang==='en'; const vs = speechSynthesis.getVoices(); const vi = vs.find(v=> en ? /^en/i.test(v.lang) : /^vi/i.test(v.lang));
  if (vi) u.voice = vi; else if (!en) PV.toast('Máy chưa có giọng tiếng Việt – sẽ đọc bằng giọng mặc định');
  u.lang = en ? 'en-US' : 'vi-VN'; u.rate = 1;
  u.onend = () => { speaking = null; if (btn) btn.classList.remove('on'); };
  speaking = u; if (btn) btn.classList.add('on');
  speechSynthesis.speak(u);
  PV.state.listened++; PV.save('listened');
};
})();
