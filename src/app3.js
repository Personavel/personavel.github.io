/* ===== Personavel – profile, chat, onboarding ===== */
(function(){
'use strict';
const {D, $, $$, esc, ICON, CATS, state} = PV;

/* ---------- QUIZ (bài phân tích phong cách) ---------- */
PV.QUIZ = [
  {k:'likes', multi:true, q:'Bạn thích trải nghiệm gì khi đi du lịch?', o:[['food','🍜','Ăn uống, chợ, phố ẩm thực'],['history','🏛️','Lịch sử – văn hóa, di tích'],['art','🎭','Bảo tàng – nghệ thuật'],['checkin','📸','Chụp ảnh check-in'],['shopping','🛍️','Mua sắm'],['relax','☕','Cà phê, thiên nhiên, đi thong thả'],['fun','🎡','Vui chơi giải trí']]},
  {k:'food', multi:true, q:'Khẩu vị và lưu ý khi ăn uống?', o:[['viet','🥢','Món Việt'],['asia','🍣','Món Á (Hàn, Nhật, Trung)'],['euro','🍝','Món Âu'],['street','🥟','Ăn vặt đường phố'],['fine','🍷','Nhà hàng sang trọng'],['veg','🥗','Ăn chay'],['nospicy','🌶️','Không ăn cay'],['other','✍️','Dị ứng / lưu ý khác (tự ghi)']], other:'Ví dụ: dị ứng hải sản, đậu phộng…'},
  {k:'budget', q:'Ngân sách dự kiến cho một người mỗi ngày?', o:[['low','🪙','Dưới 200.000đ – tiết kiệm'],['mid','💵','200.000 – 500.000đ'],['high','💳','500.000đ – 1 triệu'],['lux','💎','Trên 1 triệu – dịch vụ cao cấp']]},
  {k:'start', q:'Bạn sẽ xuất phát từ đâu?', o:[['gps','📍','Vị trí hiện tại của tôi'], ...PV.AREAS.map(a=>[a.id,'🏙️','Phường '+a.name+' – '+a.hint])]},
  {k:'with', multi:true, q:'Bạn đi cùng ai?', o:[['solo','🧍','Một mình'],['friends','👯','Bạn bè'],['couple','💑','Người thương'],['family','👨‍👩‍👧','Gia đình'],['kids','🧒','Có trẻ em đi cùng'],['elder','👵','Có người lớn tuổi'],['wheel','♿','Có người dùng xe lăn / hạn chế đi lại']]},
  {k:'time', q:'Bạn sẵn sàng tham quan vào khung giờ nào?', o:[['day','🌤️','Cả ngày (sáng – chiều)'],['morning','🌅','Sáng sớm đến trưa'],['evening','🌇','Chiều đến tối'],['night','🌙','Tối đến khuya'],['other','✍️','Khác (tự ghi)']], other:'Ví dụ: 9h – 15h, hoặc chỉ cuối tuần…'},
  {k:'move', multi:true, q:'Phương tiện bạn ưa thích?', o:[['walk','🚶','Đi bộ'],['moto','🛵','Xe máy'],['car','🚗','Ô tô'],['taxi','🚕','Taxi / Grab'],['bus','🚌','Xe buýt'],['metro','🚇','Metro']]}
];
PV.persona = (pr) => {
  const L = pr.likes||[];
  const P = [
    {id:'food', name:'Nhà thám hiểm ẩm thực', e:'🍜', d:'Bạn khám phá thành phố bằng vị giác: quán lâu năm, món địa phương và phố ẩm thực về đêm.', ok: L.includes('food') || pr.style==='foodie'},
    {id:'hist', name:'Người kể chuyện lịch sử', e:'🏛️', d:'Bạn thích hiểu câu chuyện phía sau mỗi công trình, con đường và hiện vật.', ok: L.includes('history') || L.includes('art') || pr.style==='culture'},
    {id:'snap', name:'Thợ săn góc chụp', e:'📸', d:'Kiến trúc đẹp, góc phố độc đáo và ánh sáng đẹp là ưu tiên của bạn.', ok: L.includes('checkin') || pr.style==='checkin'},
    {id:'shop', name:'Tín đồ mua sắm', e:'🛍️', d:'Local brand, quà lưu niệm và đặc sản là điểm dừng không thể thiếu.', ok: L.includes('shopping')},
    {id:'chill', name:'Người tận hưởng thong thả', e:'☕', d:'Bạn đi chậm, chọn ít điểm nhưng tận hưởng trọn vẹn từng nơi.', ok: pr.style==='relax' || pr.pace==='slow'}
  ];
  const order = {foodie:'food', culture:'hist', checkin:'snap', relax:'chill'};
  return P.find(p=>p.id===order[pr.style] && p.ok) || P.find(p=>p.ok) || {id:'all', name:'Nhà lãng du đa sắc', e:'🧭', d:'Bạn muốn thử mọi thứ một chút – Personavel sẽ cân bằng giữa ăn uống, văn hóa và check-in.'};
};
PV.runQuiz = (container, done) => {
  const ans = Object.assign({}, state.profile?.prefs || {}); let i = 0;
  const draw = () => {
    const Q = PV.QUIZ[i]; const cur = ans[Q.k];
    container.innerHTML = `<div class="row"><b>Câu ${i+1}/${PV.QUIZ.length}</b><span class="spacer"></span><button class="btn ghost sm" id="qskip">Để sau</button></div>
     <div class="prog"><i style="width:${(i)/PV.QUIZ.length*100}%"></i></div>
     <h3>${esc(Q.q)}</h3><p class="tiny muted" style="margin-top:-4px">${Q.multi?'Chọn một hoặc nhiều đáp án':'Chọn một đáp án'}</p>
     <div class="opts">${Q.o.map(([v,e,t])=>`<button class="opt ${(Q.multi?(cur||[]).includes(v):cur===v)?'on':''}" data-v="${v}"><span class="e">${e}</span><span>${t}</span></button>`).join('')}</div>
     ${Q.other && (Q.multi?(cur||[]).includes('other'):cur==='other') ? `<input class="input" id="qother" style="margin-top:10px" maxlength="120" placeholder="${esc(Q.other)}" value="${esc(ans[Q.k+'_other']||'')}">` : ''}
     <div class="row" style="margin-top:18px">${i>0?'<button class="btn ghost" id="qb">Quay lại</button>':''}<span class="spacer"></span><button class="btn" id="qn">${i===PV.QUIZ.length-1?'Hoàn thành':'Tiếp tục'}</button></div>`;
    $$('.opt', container).forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      if (Q.multi){ let a = (ans[Q.k]||[]).slice(); if (v==='none') a=['none']; else { a=a.filter(x=>x!=='none'); a.includes(v)?a=a.filter(x=>x!==v):a.push(v); } ans[Q.k]=a; }
      else { ans[Q.k]=v;
        if (Q.k==='start' && v==='gps' && navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => { PV.userPos=[pos.coords.longitude,pos.coords.latitude]; ans.startPos = PV.userPos; },
          () => { PV.toast(PV.L('Chưa lấy được vị trí – mình tạm dùng khu Bến Thành, bạn đổi lại trong Lịch trình nhé','Could not get your location – using Bến Thành for now')); ans.start='ben-thanh'; }, {enableHighAccuracy:true, timeout:10000});
        if (v!=='other') setTimeout(()=>{ if (i<PV.QUIZ.length-1){ i++; draw(); } else finish(); }, 180); }
      draw();
      const qo = $('#qother', container); if (qo && v==='other') qo.focus();
    });
    const qb=$('#qb',container); if (qb) qb.onclick=()=>{ i--; draw(); };
    const qo = $('#qother', container); if (qo) qo.oninput = () => { ans[Q.k+'_other'] = qo.value.trim(); };
    if (qo) qo.onkeydown = (e) => { if (e.key==='Enter'){ e.preventDefault(); $('#qn',container).click(); } };
    $('#qn',container).onclick = () => { if (i<PV.QUIZ.length-1){ i++; draw(); } else finish(); };
    $('#qskip',container).onclick = () => done(false);
  };
  const finish = () => {
    const p = state.profile || {name:PV.L('Du khách','Traveller'), joined:new Date().toLocaleDateString('vi-VN')};
    const W = [].concat(ans.with||[]), L = ans.likes||[];
    const F = ans.food||[]; ans.diet = F.filter(x => ['veg','nospicy','other'].includes(x)); if (!ans.diet.length) ans.diet = ['none'];
    ans.diet_other = ans.food_other || '';
    if (ans.start === 'gps' && PV.userPos) ans.startPos = PV.userPos;
    ans.needs = W.filter(x => ['kids','elder','wheel'].includes(x)); if (!ans.needs.length) ans.needs = ['none'];
    ans.style = L.includes('relax') ? 'relax' : ans.style; delete ans.spaces;
    ans.pace = (L.includes('relax') || ans.needs.some(x=>x!=='none')) ? 'slow' : 'normal';
    p.prefs = ans; p.persona = PV.persona(ans); p.quizAt = Date.now(); state.profile = p; PV.save('profile');
    done(true);
  };
  draw();
};

/* ---------- PROFILE ---------- */
PV.views.profile = (m) => {
  const p = state.profile || {name:'Bạn'}; const pr = p.prefs; const per = p.persona;
  const w = PV.weights(); const maxW = Math.max(...Object.values(w));
  const label = (k,v) => { const Q=PV.QUIZ.find(q=>q.k===k); if(!Q||v==null) return '—'; const arr=[].concat(v); return arr.map(x=> x==='other' && pr[k+'_other'] ? pr[k+'_other'] : PV.tr((Q.o.find(o=>o[0]===x)||[,,x])[2])).join(', '); };
  m.innerHTML = `<h1 class="title">Trang cá nhân</h1><p class="sub">Personavel ghi nhớ bạn là ai, bạn đã khám phá những gì và phong cách du lịch của bạn thay đổi ra sao.</p>
  <div class="grid g2">
   <div class="card"><div class="row" style="gap:16px"><div class="avatar" id="av">${PV.safeImg(p.avatar)?`<img src="${esc(PV.safeImg(p.avatar))}" alt="">`:esc((p.name||'B')[0].toUpperCase())}</div>
     <div style="flex:1;min-width:0"><h2 class="pname"><span>${esc(p.name)}</span><button class="pedit-ic" id="pedit" aria-label="Chỉnh sửa hồ sơ" title="Chỉnh sửa hồ sơ"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></h2><div class="small muted">${PV.L('Tham gia ','Joined ')}${esc(p.joined||'')}</div><div class="row" style="margin-top:8px"><button class="btn sm ghost" id="pset">${ICON.gear.replace('<svg','<svg width=14 height=14')} Cài đặt</button><button class="btn sm ghost" id="plogout" style="color:#B54848">Đăng xuất</button></div></div></div>
     <div class="grid g3 keep" style="margin-top:16px"><button type="button" class="stat stat-link" data-act="visited" title="${PV.L('Xem danh sách','See the list')}"><b>${Object.keys(state.visited).length}</b><span class="tiny muted">địa điểm ›</span></button><div class="stat"><b>${state.points}</b><span class="tiny muted">điểm</span></div><div class="stat"><b>${PV.badges().filter(b=>b.got).length}</b><span class="tiny muted">huy hiệu</span></div></div></div>
   <div class="card"><h3>Phân tích phong cách du lịch</h3>
     ${pr ? `<div class="row" style="gap:12px;align-items:flex-start"><div style="font-size:42px">${per.e}</div><div><b style="font-size:18px">${esc(per.name)}</b><p class="small" style="margin:4px 0">${esc(per.d)}</p></div></div>
     ${Object.entries(CATS).map(([k,c])=>`<div class="prefbar"><span>${c.emoji} ${c.name.split(' –')[0]}</span><div class="bar"><i style="width:${Math.round(w[k]/maxW*100)}%;background:${c.color}"></i></div><span class="tiny muted">${Math.round(w[k]/maxW*100)}%</span></div>`).join('')}
     <div class="small" style="margin-top:8px">💰 ${esc(label('budget',pr.budget))} · 👥 ${esc(label('with',pr.with))} · 🕒 ${esc(label('time',pr.time))} · 🛵 ${esc(label('move',pr.move))}${pr.diet && pr.diet.length && !pr.diet.includes('none') ? ' · 🥗 '+esc(label('food',pr.diet)) : ''}${PV.origin() ? ' · 🚩 '+esc(PV.origin().name) : ''}</div>` : '<p class="muted">Bạn chưa làm bài phân tích phong cách du lịch.</p>'}
     <button class="btn sm" id="pquiz" style="margin-top:12px">${pr?'Làm lại bài phân tích':'Làm bài phân tích'}</button></div>
  </div>
  <div class="grid g2" style="margin-top:18px">
   <div class="card"><div class="row"><h3 style="margin:0">Nhật ký hành trình</h3><span class="spacer"></span><a class="small" href="#trip">+ Từ lịch trình</a></div>
     <div class="grid" style="margin-top:10px">${state.diaries.map(d=>`<div class="diary">${PV.safeImg(d.img)?`<img src="${esc(PV.safeImg(d.img))}" alt="">`:'<div class="cover" style="width:90px;height:90px;margin:0;background:var(--baby)">📔</div>'}<div style="flex:1;min-width:0"><b>${esc(d.title)}</b><div class="tiny muted">${esc(d.date)} · ${d.stops.length} địa điểm</div><p class="small" style="margin:4px 0">${esc(d.note||'')}</p><div class="tiny muted">${d.stops.map(id=>PV.byId(id)?.name).filter(Boolean).map(esc).join(' → ')}</div><button class="btn ghost sm" data-del="${d.id}" style="margin-top:6px">Xóa</button></div></div>`).join('') || '<div class="empty small">Chưa có nhật ký. Hoàn thành một lịch trình rồi bấm “Lưu vào nhật ký”.</div>'}</div></div>
   <div class="card"><h3>Gợi ý từ Personavel</h3><div class="row" style="align-items:flex-start;gap:10px">${PV.robot(PV.GUIDES[0]).replace('<svg','<svg style="width:70px;flex:0 0 70px"')}<div class="bubble small">${(()=>{ const r=PV.recommend(3,p=>!state.visited[p.id]); return 'Dựa trên sở thích của bạn, mình nghĩ bạn sẽ thích: '+r.map(x=>'<b>'+esc(x.name)+'</b>').join(', ')+'.'; })()}</div></div>
     ${pr && pr.quizAt && Date.now()-pr.quizAt > 30*864e5 ? '<p class="small" style="margin-top:12px">⏰ Đã hơn 30 ngày từ lần phân tích trước. Sở thích của bạn có thay đổi không? <a href="#" id="requiz">Cập nhật ngay</a></p>':''}
     <h4 style="margin-top:14px">Đã xem gần đây</h4><div class="plist">${state.history.slice(0,4).map(PV.byId).filter(Boolean).map(PV.pitem).join('') || '<span class="small muted">Chưa có</span>'}</div></div>
  </div>`;
  PV.bindItems(m);
  $('#pquiz').onclick = () => PV.quizModal();
  const rq=$('#requiz'); if (rq) rq.onclick = e => { e.preventDefault(); PV.quizModal(); };
  $$('[data-del]',m).forEach(b=>b.onclick=()=>{ state.diaries=state.diaries.filter(d=>d.id!==b.dataset.del); PV.save('diaries'); PV.views.profile(m); });
  $('#pedit').onclick = () => PV.modal(`<h3>Chỉnh sửa hồ sơ</h3><label class="small">Tên hiển thị<input class="input" id="en" value="${esc(p.name)}"></label><label class="small" style="display:block;margin-top:8px">Ảnh đại diện<input type="file" accept="image/*" id="ea"></label><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn" id="eok">Lưu</button></div>`, (box,close)=>{
    $('#eok',box).onclick = async () => { p.name = $('#en',box).value.trim() || p.name; const f=$('#ea',box).files[0]; if (f) p.avatar = await PV.shrink(f,200); state.profile=p; PV.save('profile'); close(); PV.views.profile(m); }; });
  const av=$('#av'); if (av){ av.style.cursor='pointer'; av.title='Đổi ảnh đại diện'; av.onclick=()=>$('#pedit').click(); }
  $('#pset').onclick = () => PV.settingsModal();
  $('#plogout').onclick = () => PV.logoutModal();
};
PV.quizModal = () => PV.modal('<div id="qz"></div>', (box, close) => PV.runQuiz($('#qz',box), ok => { close(); if (ok) PV.toast('Đã cập nhật phong cách du lịch'); PV.route(); }));
PV.settingsModal = () => {
  const s = state.settings;
  PV.modal(`<h3>Cài đặt</h3>
   <h4 style="margin:6px 0">Ngôn ngữ</h4>${PV.langSwitch()}
   ${PV.themeSection ? PV.themeSection() : ''}
   <label class="row small" style="margin-top:12px"><input type="checkbox" id="sr" ${s.reduce?'checked':''}> Giảm hiệu ứng chuyển động</label>
   <label class="row small" style="margin-top:8px"><input type="checkbox" id="ssp" ${s.splash!=='off'?'checked':''}> ${PV.L('Hiện màn mở đầu mỗi lần mở web','Show the intro screen every time')}</label>
   <h4 style="margin-top:14px">Dữ liệu</h4><button class="btn ghost sm" id="sreset">Xóa dữ liệu của tài khoản đang dùng (tài khoản đã đăng xuất vẫn được giữ)</button>
   <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn" id="sok">Lưu</button></div>`, (box, close) => {
    if (PV.bindTheme) PV.bindTheme(box);
    $('#sok',box).onclick = () => { s.reduce=$('#sr',box).checked; s.splash=$('#ssp',box).checked?'on':'off'; PV.save('settings'); document.body.classList.toggle('reduce', s.reduce); close(); PV.toast('Đã lưu cài đặt'); };
    $('#sreset',box).onclick = () => { [...PV.USER_KEYS,'settings'].forEach(k=>PV.store.del(k)); location.hash=''; location.reload(); };
  });
};


/* ---------- accounts on this device: log out / switch user ---------- */
PV.USER_KEYS = ['profile','trip','visited','diaries','readStreets','listened','points','chat','history','toured','badgesSeen'];
PV.accounts = () => PV.store.get('accounts', {});
PV.snapshot = () => { const o={}; PV.USER_KEYS.forEach(k => { o[k] = k in state ? state[k] : PV.store.get(k, null); }); return o; };
PV.restore = (snap) => {
  PV.USER_KEYS.forEach(k => { if (snap[k]==null) { PV.store.del(k); if (k in state) state[k] = defaults()[k]; } else { PV.store.set(k, snap[k]); if (k in state) state[k] = snap[k]; } });
};
function defaults(){ return {profile:null, trip:{title:'Hành trình của tôi', start:'08:00', mode:'moto', stops:[]}, visited:{}, diaries:[], readStreets:{}, listened:0, points:0, chat:[], history:[]}; }
PV.logout = (keep) => {
  const p = state.profile;
  if (keep && p && p.name){
    const accs = PV.accounts(); const key = (p.uid ||= 'u'+Date.now());
    accs[key] = {name:p.name, avatar:p.avatar||null, persona:p.persona?.name||'', savedAt:new Date().toLocaleString('vi-VN'), data:PV.snapshot(), theme:state.settings.theme||{id:'default'}};
    try { PV.store.set('accounts', accs); } catch(e){}
    // localStorage can be full (diary photos): retry without photos
    if (!PV.store.get('accounts',{})[key]) { accs[key].data.diaries = (accs[key].data.diaries||[]).map(d=>({...d, img:null})); PV.store.set('accounts', accs); }
  }
  PV.restore(defaults());
  state.settings.guide = null; state.settings.theme = {id:'default'}; PV.save('settings'); // logged-out = default white–blue
  PV.applyTheme && PV.applyTheme({id:'default'});
  if (window.speechSynthesis) speechSynthesis.cancel();
  location.hash = '#home'; PV.route(); PV.welcome(true);
};
PV.login = (key) => {
  const accs = PV.accounts(); const a = accs[key]; if (!a) return;
  PV.restore(a.data); state.profile.onboarded = true; PV.save('profile');
  const th = a.theme || {id:'default'}; state.settings.theme = th; PV.save('settings'); // bring back this account's own background
  PV.applyTheme && PV.applyTheme(th);
};
PV.forgetAccount = (key) => { const accs = PV.accounts(); delete accs[key]; PV.store.set('accounts', accs); };
PV.logoutModal = () => {
  const p = state.profile || {name:PV.L('Du khách','Traveller')};
  const n = {v:Object.keys(state.visited).length, d:state.diaries.length, t:state.trip.stops.length};
  PV.modal(`<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${PV.robot(PV.GUIDES[0],{wave:false}).replace('<svg','<svg style="width:64px;flex:0 0 64px"')}
     <div><h3 style="margin:0 0 4px">Đăng xuất khỏi Personavel?</h3><p class="small muted" style="margin:0">Sau khi đăng xuất, website quay về màn hình chào để <b>người dùng mới</b> bắt đầu từ đầu: nhập tên, làm bài phân tích phong cách và xem hướng dẫn sử dụng.</p></div></div>
   <div class="card" style="margin:14px 0;padding:12px"><div class="row"><div class="avatar" style="width:44px;height:44px;font-size:18px;border-width:2px">${PV.safeImg(p.avatar)?`<img src="${esc(PV.safeImg(p.avatar))}" alt="">`:esc((p.name||'B')[0].toUpperCase())}</div>
     <div><b>${esc(p.name)}</b><div class="tiny muted">${p.persona?esc(p.persona.name)+' · ':''}${n.v} địa điểm đã ghé · ${state.points} điểm · ${n.d} nhật ký · lịch trình ${n.t} điểm</div></div></div></div>
   <p class="small" style="margin:0">💾 Dữ liệu của <b>${esc(p.name)}</b> (hồ sơ, lịch trình, dấu mộc, nhật ký) được giữ lại trên máy này. Lần sau chỉ cần chọn tên “${esc(p.name)}” ở màn hình chào để tiếp tục hành trình.</p>
   <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost" data-close>Hủy</button><button class="btn" id="lo-keep">Đăng xuất</button></div>`, (box, close) => {
    $('#lo-keep',box).onclick = () => { close(); PV.logout(true); PV.toast('Đã đăng xuất – dữ liệu của '+p.name+' được lưu trên máy này'); };
  });
};


/* ---------- chatbot greets a new user after the analysis ---------- */
PV.greetNew = () => {
  const old = document.getElementById('greetpop'); if (old) old.remove();
  const g = PV.todayGuide(); const p = state.profile || {}; const per = p.persona;
  const rec = PV.recommend(3);
  const pop = document.createElement('div'); pop.className = 'greetpop'; pop.id = 'greetpop'; pop.setAttribute('role','dialog');
  pop.innerHTML = `<button class="gp-x" aria-label="Đóng">✕</button>
    <div class="row" style="flex-wrap:nowrap;align-items:flex-end;gap:10px">${PV.robot(g).replace('<svg','<svg class="gp-bot"')}
    <div class="bubble gp-b"><b>Xin chào ${esc(p.name||PV.L('Du khách','Traveller'))}!</b> Mình là <b>${g.name}</b> – hướng dẫn viên của bạn hôm nay.
    ${per ? `<div style="margin-top:6px">Phong cách của bạn: <b>${per.e} ${esc(per.name)}</b>.</div>` : ''}
    <div style="margin-top:6px">Mình gợi ý bạn bắt đầu với: ${rec.map(x=>`<a href="#" class="gp-place" data-gp="${x.id}">${esc(x.name)}</a>`).join(', ')}.</div>
    <div style="margin-top:6px">Bạn muốn mình giúp gì trước?</div></div></div>
    <div class="gp-acts"><button class="btn sm" data-gpa="trip">🗺️ Lên lịch trình cho mình</button><button class="btn sm ghost" data-gpa="tour">🧭 Hướng dẫn sử dụng</button><button class="btn sm ghost" data-gpa="map">📍 Mở bản đồ</button><button class="btn sm ghost" data-gpa="chat">💬 Trò chuyện</button></div>`;
  document.body.appendChild(pop);
  const close = () => { pop.classList.add('out'); setTimeout(()=>pop.remove(), 250); };
  pop.querySelector('.gp-x').onclick = close;
  pop.querySelectorAll('.gp-place').forEach(a => a.onclick = (e) => { e.preventDefault(); PV.openPlace(a.dataset.gp); });
  pop.querySelectorAll('[data-gpa]').forEach(b => b.onclick = () => { const a = b.dataset.gpa; close();
    if (a==='trip'){ const q = PV.L('Lên lịch trình 1 ngày phù hợp với phong cách của mình','Plan a 1 day trip that fits my style'); if (PV.switchGuide) PV.switchGuide('ha', q); else { PV.pendingAsk = q; location.hash = '#chat'; } }
    else if (a==='tour'){ location.hash = '#home'; setTimeout(PV.tour, 350); }
    else if (a==='map') location.hash = '#map';
    else location.hash = '#chat'; });
  const t = PV.state.chat; if (!t.length || t[t.length-1].t !== 'greet-'+p.name) {}
};

/* ---------- ABOUT ---------- */
PV.views.about = (m) => {
  m.innerHTML = `<h1 class="title">Giới thiệu dự án</h1>
  <div class="card hello" style="margin-bottom:18px">${PV.robot(PV.GUIDES[0],{cls:'bot'})}<div><h1><em>Personavel</em></h1><p style="margin:0">Nền tảng bản đồ du lịch tự túc, tích hợp hướng dẫn tham quan, thuyết minh và gợi ý lịch trình cá nhân hóa tại TP.HCM.</p><p class="muted" style="margin:8px 0 0">“Không có hành trình nào hoàn hảo, chỉ có hành trình phù hợp với mỗi người.” — <b>YOUR TRIP – YOUR STORY.</b></p></div></div>
  <div class="grid g2">
   <div class="card"><h3>Ý tưởng hình thành</h3><p>Thay vì tìm thông tin từ nhiều nguồn riêng lẻ, du khách làm một bài trắc nghiệm ngắn để Personavel hiểu sở thích, ngân sách và phong cách du lịch. Từ đó, hệ thống đề xuất địa điểm phù hợp, hiển thị trên bản đồ số và để chatbot hướng dẫn viên xây dựng lịch trình, thuyết minh về các địa danh và những con đường mang ý nghĩa văn hóa.</p>
   <h3>Mục tiêu</h3><ul><li>Nâng cao trải nghiệm du lịch tự túc.</li><li>Góp phần quảng bá hình ảnh TP.HCM.</li><li>Thúc đẩy chất lượng dịch vụ địa phương.</li><li>Xây dựng nền tảng tiện ích cho cả người dân thành phố.</li></ul></div>
   <div class="card"><h3>Nhóm thực hiện – Lớp 11A13, THPT Lê Quý Đôn</h3><div class="grid g2">${[['Nguyễn Ngọc Khánh An','an'],['Nguyễn Minh Hà','ha'],['Phan Tuấn Kiệt','kiet'],['Phạm Nhật Thục Uyên','uyen'],['Phạm Lê Nguyên Phương','phuong']].map(([n,g])=>`<div class="row" style="flex-wrap:nowrap">${PV.robot(PV.GUIDES.find(x=>x.id===g),{wave:false}).replace('<svg','<svg style="width:48px;flex:0 0 48px"')}<div><b class="small">${n}</b><div class="tiny muted">Hướng dẫn viên ${PV.GUIDES.find(x=>x.id===g).name}</div></div></div>`).join('')}</div>
   <p class="small" style="margin-top:12px">Giáo viên hướng dẫn: <b>Cô Nguyễn Thị Kim Thoa</b></p>
   <h3>Nguồn dữ liệu</h3><p class="small">Bản đồ: © Esri, © OpenStreetMap contributors. Thông tin địa điểm: khảo sát của nhóm, website chính thức của các địa điểm, Wikipedia, Michelin Guide và Google Maps. Ảnh nền Trang chủ: Wikimedia Commons (giấy phép CC BY, CC BY-SA, CC0 – ghi tên tác giả trên từng ảnh). Giá vé, giờ mở cửa có thể thay đổi – vui lòng kiểm tra trước khi đến. Các địa điểm có nhãn <span class="tag warn">Vị trí gần đúng</span> cần được xác minh thêm.</p>
   <button class="btn ghost sm" id="replay">Xem lại màn hình chào</button> <button class="btn ghost sm" id="retour">Xem hướng dẫn sử dụng</button></div>
  </div>`;
  $('#replay').onclick = () => PV.welcome(true);
  $('#retour').onclick = () => { location.hash='#home'; setTimeout(PV.tour, 300); };
};

/* ---------- CHAT ---------- */
PV.views.chat = (m) => {
  const g = PV.todayGuide();
  m.innerHTML = `<h1 class="title">Chatbot hướng dẫn</h1><p class="sub">Năm hướng dẫn viên robot luân phiên mỗi ngày – bạn cũng có thể tự chọn người đồng hành.</p>
  <div class="chatwrap">
    <div class="guides">${PV.GUIDES.map(x=>`<div class="guide ${x.id===g.id?'on':''}" data-g="${x.id}">${PV.robot(x,{wave:false})}<div><b>${x.name}</b><div class="tiny muted">${x.role}</div></div></div>`).join('')}
      <button class="btn ghost sm" id="cclear">Cuộc trò chuyện mới</button></div>
    <div class="card chat"><div class="msgs" id="msgs" aria-live="polite"></div>
      <div class="sugg" id="sugg">${(PV.guideSuggest ? PV.guideSuggest(g.id) : ['🗺️ Lên lịch trình 1 ngày','🍜 Gợi ý quán ăn ngon gần đây','🏛️ Kể chuyện về Dinh Độc Lập','🛣️ Đường Nguyễn Huệ có ý nghĩa gì?','🌙 Đi chơi buổi tối ở đâu?','🎁 Mua quà lưu niệm ở đâu?']).map(s=>`<button class="chip">${s}</button>`).join('')}</div>
      <form class="composer" id="cf"><input class="input" id="ci" placeholder="Hỏi ${g.name} bất cứ điều gì về Sài Gòn…" autocomplete="off"><button class="btn" aria-label="Gửi">${ICON.send.replace('<svg','<svg width=18 height=18')}</button></form></div>
  </div>`;
  { const gr = $('.guides', m); const hint = () => gr.classList.toggle('more-r', gr.scrollWidth - gr.scrollLeft - gr.clientWidth > 8); gr.addEventListener('scroll', hint, {passive:true}); requestAnimationFrame(hint); addEventListener('resize', hint, {passive:true}); }
  $$('.guide',m).forEach(el => el.onclick = () => { state.settings.guide = el.dataset.g; PV.save('settings'); const ng=PV.todayGuide(); state.chat.push({r:'bot', t:PV.L(ng.greet, PV.tr(ng.greet)), g:ng.id}); PV.save('chat'); PV.views.chat(m); });
  $('#cclear').onclick = () => { state.chat=[]; PV.save('chat'); PV.views.chat(m); };
  const cs=$('#cset'); if (cs) cs.onclick = e => { e.preventDefault(); PV.settingsModal(); };
  PV.chatCore($('.chat', m));
};

/* shared chat engine: works inside any root that has .msgs, .sugg, .composer (full page or floating popup) */
PV.chatCore = (root) => {
  const q = s => root.querySelector(s);
  const msgs = q('.msgs'), ci = q('.composer input');
  const g = PV.todayGuide();
  if (!state.chat.length) state.chat.push({r:'bot', t:`${PV.L(g.greet, PV.tr(g.greet))}\n${state.profile?.persona ? PV.L('Mình thấy bạn là “'+state.profile.persona.name+'”. ', 'I see you are a “'+PV.tr(state.profile.persona.name)+'”. ') : ''}${PV.guideOffer ? PV.guideOffer(g.id).ask : PV.L('Bạn muốn mình lên lịch trình, gợi ý quán ăn hay kể chuyện về một địa danh nào?','Would you like me to plan a trip, suggest places to eat or tell you about a landmark?')}`, g:g.id});
  msgs.innerHTML = '';
  state.chat.forEach(c => msgs.insertAdjacentHTML('beforeend', bubble(c)));
  bindCards(msgs); msgs.scrollTop = msgs.scrollHeight;
  // easy scrolling: wheel / touchpad / touch, plus drag with the mouse, and a "jump to latest" button
  msgs.tabIndex = 0;
  if (!msgs._dragBound){ msgs._dragBound = true;
    let down = false, y0 = 0, s0 = 0, moved = false;
    msgs.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button,a,input,textarea,.pitem,[data-pid]')) return; down = true; moved = false; y0 = e.clientY; s0 = msgs.scrollTop; });
    window.addEventListener('pointermove', e => { if (!down) return; const dy = e.clientY - y0; if (Math.abs(dy) > 4){ moved = true; msgs.classList.add('dragging'); } msgs.scrollTop = s0 - dy; });
    window.addEventListener('pointerup', () => { if (down){ down = false; msgs.classList.remove('dragging'); } });
    msgs.addEventListener('click', e => { if (moved){ e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'msgs-jump'; jump.textContent = '↓'; jump.title = PV.L('Tin mới nhất','Latest message');
    jump.onclick = () => msgs.scrollTo({top: msgs.scrollHeight, behavior: 'smooth'});
    if (getComputedStyle(msgs.parentElement).position === 'static') msgs.parentElement.style.position = 'relative';
    msgs.after(jump);
    const upd = () => jump.classList.toggle('on', msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight > 80);
    msgs.addEventListener('scroll', upd, {passive:true}); setTimeout(upd, 50);
  }
  root.querySelectorAll('.sugg .chip').forEach(b => b.onclick = () => send(b.textContent.replace(/^\S+\s/,'')));
  q('.composer').onsubmit = e => { e.preventDefault(); const v=ci.value.trim(); if (v){ ci.value=''; send(v); } };
  if (PV.pendingAsk){ const t=PV.pendingAsk; PV.pendingAsk=null; setTimeout(()=>send(t),200); }
  async function send(text){
    const me = {r:'me', t:text}; state.chat.push(me); msgs.insertAdjacentHTML('beforeend', bubble(me));
    const ty = document.createElement('div'); ty.className='msg'; ty.innerHTML=`<div class="av">${PV.robot(PV.todayGuide(),{wave:false})}</div><div class="bubble typing"><span></span><span></span><span></span></div>`; msgs.appendChild(ty); msgs.scrollTop=msgs.scrollHeight;
    let res; try { res = await PV.answer(text); } catch(e){ res = PV.localAnswer(text); res.t = PV.L('(Không kết nối được AI, mình trả lời bằng kho dữ liệu.)\n','(Could not reach the AI, answering from the database.)\n') + res.t; }
    ty.remove(); res.r='bot'; res.g=res.by||PV.todayGuide().id; state.chat.push(res); state.chat = state.chat.slice(-60); PV.save('chat');
    if (!document.body.contains(msgs)) return;
    msgs.insertAdjacentHTML('beforeend', bubble(res)); bindCards(msgs); msgs.scrollTop=msgs.scrollHeight;
  }
  function bindCards(r){
    $$('[data-pid]', r).forEach(el => el.onclick = (e) => { const t = e.target.closest('a,[data-pid]'); if (t && t !== el) return;   // link / nút con trong thẻ tự xử lý
      if (PV._mapRef && PV.focusPlace && location.hash.split('?')[0]==='#map') PV.focusPlace(el.dataset.pid); else PV.openPlace(el.dataset.pid); });
    $$('[data-usetrip]', r).forEach(b => b.onclick = () => { const c = state.chat[+b.dataset.usetrip]; if (!c||!c.trip) return; state.trip = JSON.parse(JSON.stringify(c.trip)); state.trip.stops.forEach(s=>s.by='ai'); PV.retime(state.trip); PV.save('trip'); PV.toast('Đã lưu lịch trình'); if (location.hash.split('?')[0]==='#map' && PV.refreshMapTrip) PV.refreshMapTrip(); else location.hash='#trip'; });
    $$('[data-adjust]', r).forEach(b => b.onclick = () => { ci.value='Mình muốn điều chỉnh: '; ci.focus(); });
    $$('[data-say2]', r).forEach(b => b.onclick = () => { const c=state.chat[+b.dataset.say2]; if (c) PV.speak(c.t.replace(/[*_#>]/g,''), b); });
    $$('[data-askg]', r).forEach(b => b.onclick = () => { const c=state.chat[+b.dataset.askq]; if (PV.switchGuide) PV.switchGuide(b.dataset.askg, c && c.ask && c.ask.q, root); });
  }
  function bubble(c){
    const idx = state.chat.indexOf(c);
    if (c.r==='me') return `<div class="msg me"><div class="bubble">${esc(c.t)}</div></div>`;
    const g = PV.GUIDES.find(x=>x.id===c.g) || PV.todayGuide();
    let extra = '';
    if (c.places && c.places.length) extra += `<div class="plist" style="margin-top:8px">${c.places.map(PV.byId).filter(Boolean).map(p => { const dw = PV.doWhat(p, 2);
      return PV.pitem(p).replace(/<\/div><\/div>\s*$/, `${dw ? `<div class="small dowhat">${esc(dw)}</div>` : ''}${PV.stopLinks(p)}</div></div>`); }).join('')}</div>`;
    if (c.trip) extra += `<div class="tripcard"><b>🗺️ ${esc(c.trip.title)}</b><div class="tiny muted">Bắt đầu ${c.trip.start} · ${PV.MODES[c.trip.mode]?.name||''} · ~${PV.fmtKm(c.trip.km||0)} · ~${PV.fmtVnd(c.trip.cost||0)}/người</div>
      <ol>${c.trip.stops.map((s,i)=>{const p=PV.byId(s.id); if(!p) return ''; const prev=i?PV.byId(c.trip.stops[i-1].id):null, from=prev?prev.coords:(c.trip.origin&&c.trip.origin.c), dw=PV.doWhat(p); return `<li><b>${s.arrive||''}</b> <span data-pid="${p.id}" style="cursor:pointer;text-decoration:underline dotted">${esc(PV.L(p.name, p.name_en||p.name))}</span>${s.tag?` <span class="tag meal">${s.tag.startsWith('Ăn vặt')?'🍡':'🍽️'} ${esc(PV.L(s.tag, s.tag.startsWith('Ăn vặt')?'Snack':s.tag==='Ăn sáng'?'Breakfast':s.tag==='Ăn trưa'?'Lunch':s.tag==='Ăn tối'?'Dinner':s.tag))}</span>`:''} <span class="tiny muted">(${s.stay||p.visit_min} ${PV.L('phút','min')}${s.leg?PV.L(' · đi ',' · ')+s.leg.min+PV.L(' phút',' min travel'):''})</span>${dw?`<div class="small dowhat">${esc(dw)}</div>`:''}${PV.stopLinks(p, from, c.trip.mode)}</li>`;}).join('')}</ol>
      <div class="row"><button class="btn sm" data-usetrip="${idx}">Lưu lịch trình</button><button class="btn ghost sm" data-adjust="${idx}">Điều chỉnh lịch trình</button></div></div>`;
    if (c.ask && !c.ask.done){ const to = PV.GUIDES.find(x=>x.id===c.ask.g); if (to) extra += `<div class="askg"><button class="btn sm" type="button" data-askg="${to.id}" data-askq="${idx}">${PV.robot(to,{wave:false}).replace('<svg','<svg style="width:22px;height:22px;flex:0 0 22px" aria-hidden="true"')} ${PV.L('Hỏi','Ask')} ${esc(to.name)}</button></div>`; }
    if (c.sources && c.sources.length) extra += `<div class="src">📚 Nguồn tham khảo: ${c.sources.map(s=>s.url?`<a href="${esc(PV.safeUrl(s.url))}" target="_blank" rel="noopener">${esc(s.name)}</a>`:esc(s.name)).join(' · ')}</div>`;
    return `<div class="msg"><div class="av">${PV.robot(g,{wave:false})}</div><div class="bubble">${esc(c.t)}${extra}<div style="margin-top:6px"><button class="btn ghost sm" data-say2="${idx}" title="Nghe">${ICON.speaker.replace('<svg','<svg width=14 height=14')}</button></div></div></div>`;
  }
};

/* floating chat popup: opens over the current page so the map (or anything else) stays exactly where it was */
PV.chatPop = (open) => {
  let el = $('#chatpop');
  if (open === undefined) open = !(el && el.classList.contains('on'));
  if (!open){ if (el){ el.classList.remove('on'); el.setAttribute('aria-hidden','true'); } return; }
  const g = PV.todayGuide();
  if (!el){ el = document.createElement('section'); el.id='chatpop'; el.className='chatpop'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Chatbot hướng dẫn'); document.body.appendChild(el); }
  el.innerHTML = `<div class="cp-head">${PV.robot(g,{wave:false}).replace('<svg','<svg style="width:40px;flex:0 0 40px"')}<div style="flex:1;min-width:0"><b>${g.name}</b><div class="tiny muted">Hướng dẫn viên của bạn</div></div>
      <a class="btn ghost sm" href="#chat" id="cpfull" title="Mở trang chatbot đầy đủ">⤢</a><button class="btn ghost sm" id="cpclose" aria-label="Đóng">✕</button></div>
    <div class="msgs" aria-live="polite"></div>
    <div class="sugg">${(PV.guideSuggest ? PV.guideSuggest(g.id).slice(0,3) : ['🗺️ Lên lịch trình 1 ngày','🍜 Gợi ý quán ăn ngon gần đây','🌙 Đi chơi buổi tối ở đâu?']).map(s=>`<button class="chip">${s}</button>`).join('')}</div>
    <form class="composer"><input class="input" placeholder="Hỏi ${g.name} bất cứ điều gì về Sài Gòn…" autocomplete="off"><button class="btn" aria-label="Gửi">${ICON.send.replace('<svg','<svg width=18 height=18')}</button></form>`;
  el.classList.add('on'); el.setAttribute('aria-hidden','false');
  el.querySelector('#cpclose').onclick = () => PV.chatPop(false);
  el.querySelector('#cpfull').onclick = () => PV.chatPop(false);
  PV.chatCore(el);
  setTimeout(()=>{ const i=el.querySelector('.composer input'); if (i && window.innerWidth>820) i.focus(); }, 50);
};

/* ---------- answer engines ---------- */
PV.answer = async (text) => {
  const key = null;   // API keys are never stored or sent from the browser (a server-side proxy will come later)
  let sampler = null;
  try { if (window.claude && window.claude.use) sampler = await window.claude.use('sample'); } catch(e){}
  // thời tiết: hỏi Open-Meteo trực tiếp (trung tâm TP.HCM); không được thì để localAnswer trả lời chung
  { const A = ' ' + text.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,' ') + ' ', F = ' ' + PV.norm(text).replace(/[^a-z0-9]+/g,' ') + ' ';
    const wq = [' thời tiết ',' trời mưa ',' có mưa ',' mưa không ',' nắng không ',' nóng không '].some(w => A.includes(w)) || [' thoi tiet ',' weather ',' rain ',' raining ',' rainy ',' sunny ',' temperature ',' forecast '].some(w => F.includes(w));
    if (wq && PV.getWeather) { try {
      const w = await PV.getWeather(10.7769, 106.7009), tips = PV.weatherAdvice ? PV.weatherAdvice(w, PV.L('trung tâm TP.HCM','central HCMC')) : [];
      return {t: PV.L(`${PV.weatherIcon ? PV.weatherIcon(w) : ''} Trung tâm TP.HCM lúc này: ${w.desc}, ${Math.round(w.temp)}°C (cảm giác ${Math.round(w.feels)}°C), độ ẩm ${Math.round(w.hum)}%.`, `${PV.weatherIcon ? PV.weatherIcon(w) : ''} Central HCMC right now: ${w.desc}, ${Math.round(w.temp)}°C (feels like ${Math.round(w.feels)}°C), humidity ${Math.round(w.hum)}%.`)
        + (tips.length ? '\n' + tips.map(x => '• ' + String(x).replace(/<[^>]+>/g, '')).join('\n') : ''), sources: [{name: 'Open-Meteo', url: 'https://open-meteo.com'}]};
    } catch(e){} } }
  if (!key && !sampler) return PV.localAnswer(text);
  const sys = PV.systemPrompt();
  const hist = state.chat.slice(-12).filter(c=>c.t).map(c=>({role:c.r==='me'?'user':'assistant', content:c.t}));
  if (!hist.length || hist[hist.length-1].role!=='user') hist.push({role:'user', content:text});
  while (hist.length && hist[0].role!=='user') hist.shift();
  let raw;
  if (sampler){ const r = await sampler([{role:'user', content: sys + '\n\n=== CUỘC TRÒ CHUYỆN ===\n' + hist.map(h=>(h.role==='user'?'Người dùng: ':'Hướng dẫn viên: ')+h.content).join('\n') + '\n\nTrả lời đúng định dạng JSON.'}], {cache:false}); raw = r.text; }
  else {
    const r = await fetch('https://api.anthropic.com/v1/messages', {method:'POST', headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({model: state.settings.model || 'claude-sonnet-5-5', max_tokens: 1500, system: sys, messages: hist})});
    if (!r.ok) throw new Error('API '+r.status);
    const j = await r.json(); raw = (j.content||[]).map(c=>c.text||'').join('');
  }
  const m = raw.match(/\{[\s\S]*\}/); let o;
  try { o = JSON.parse(m ? m[0] : raw); } catch(e){ return {t: raw.trim()}; }
  const out = {t: o.reply || '…'};
  const ok = id => !!PV.byId(id);
  if (Array.isArray(o.place_ids)) out.places = o.place_ids.filter(ok).slice(0,6);
  if (o.itinerary && Array.isArray(o.itinerary.stops) && o.itinerary.stops.length){
    const ids = o.itinerary.stops.filter(ok);
    const trip = PV.buildTrip({must: ids, stops: ids.length, start: o.itinerary.start || undefined, mode: o.itinerary.mode || undefined, title: o.itinerary.title});
    if (trip){ trip.stops = trip.stops.filter(s => ids.includes(s.id)); trip.stops.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)); trip.start = o.itinerary.start || trip.start; PV.retime(trip); out.trip = trip; }
  }
  if (Array.isArray(o.sources)) out.sources = o.sources.filter(s=>s&&s.name).slice(0,4);
  return out;
};
PV.systemPrompt = () => {
  const g = PV.todayGuide(); const pr = state.profile?.prefs || {};
  const cat = D.places.filter(p=>p.coords).map(p => [p.id, p.name, p.cats.join('/'), p.address.split(',').slice(0,2).join(','), 'giá:'+PV.priceText(p.price_level), (p.hours||[])[0]||'giờ: chưa rõ', p.michelin?'Michelin':'', (PV.foodType(p)?'nên ăn: ':'nên xem: ')+PV.cleanHl(p,3).join('; '), 'link: '+PV.mapsLink(p), p.geo==='approx'?'vị trí gần đúng':''].filter(Boolean).join(' | ')).join('\n');
  const st = D.streets.map(s=>`Đường ${s.name} (${s.wards}): ${s.story}`).join('\n');
  return `Bạn là ${g.name}, hướng dẫn viên du lịch ảo của Personavel – một robot mặc áo dài, đội nón lá, giọng ${g.voice}. Bạn giúp du khách khám phá TP.HCM (trọng tâm phường Sài Gòn, Tân Định, Bến Thành, Cầu Ông Lãnh, Xuân Hòa, Nhiêu Lộc, Bàn Cờ – tức Quận 1, Quận 3 cũ). Luôn trả lời bằng ${PV.lang==='en'?'TIẾNG ANH (English) – người dùng chọn giao diện tiếng Anh':'tiếng Việt'}, thân thiện, ngắn gọn (tối đa ~150 chữ).
QUY TẮC: Chỉ dùng thông tin trong KHO DỮ LIỆU bên dưới cho giá vé, giờ mở cửa, địa chỉ. Khi gợi ý địa điểm hoặc lên lịch trình, với MỖI điểm hãy nêu ngắn "nên xem" (điểm tham quan) hoặc "nên ăn" (quán ăn) lấy từ kho dữ liệu, kèm đúng đường link Google Maps của điểm đó trong kho – không tự tạo link khác. Không bịa thông tin lịch sử; nếu không chắc, nói rõ "thông tin này chưa được xác minh". Với địa điểm có "vị trí gần đúng", nhắc người dùng kiểm tra lại. Trước khi lập lịch trình, nếu chưa biết thời gian, ngân sách hoặc khu vực, hãy hỏi lại 1–2 câu ngắn (không hỏi trùng điều đã biết trong hồ sơ). Khi kể chuyện lịch sử/địa danh, thêm nguồn tham khảo.
HỒ SƠ NGƯỜI DÙNG: tên ${state.profile?.name||'chưa rõ'}; phong cách ${state.profile?.persona?.name||'chưa phân tích'}; sở thích ${JSON.stringify(pr)}.
LỊCH TRÌNH HIỆN TẠI: ${state.trip.stops.map(s=>PV.byId(s.id)?.name).filter(Boolean).join(' → ') || 'trống'}.
KHO DỮ LIỆU ĐỊA ĐIỂM (id | tên | loại | địa chỉ | giá | giờ | ...):
${cat}
KHO TÊN ĐƯỜNG:
${st}
ĐỊNH DẠNG TRẢ LỜI: chỉ một đối tượng JSON, không thêm chữ nào khác:
{"reply":"lời nói của bạn","place_ids":["id địa điểm muốn giới thiệu (tối đa 5)"],"itinerary":null hoặc {"title":"...","start":"HH:MM","mode":"walk|moto|taxi|bus","stops":["id theo thứ tự"]},"sources":[{"name":"tên nguồn","url":"đường dẫn nếu có"}]}`;
};

/* local rule-based engine – works offline with the dataset (Vietnamese + English) */
PV.localAnswer = (text) => {
  const L = PV.L, n = PV.norm(text);
  const W = ' ' + n.replace(/[^a-z0-9]+/g,' ').trim() + ' ';                       // normalised words
  const A = ' ' + text.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,' ').trim() + ' '; // words with tones kept
  const plain = !/[à-ỹđ]/i.test(text.normalize('NFC'));                            // user typed without Vietnamese accents
  const has = (...w) => w.some(x => W.includes(' ' + x.trim() + ' '));             // whole words / phrases only
  const hasA = (...w) => w.some(x => A.includes(' ' + x.trim() + ' '));
  const evening = () => hasA('buổi tối','tối nay','ban đêm','buổi đêm','đêm nay','về đêm','khuya') || has('evening','tonight','night','late') || (plain && has('buoi toi','toi nay','ban dem','dem nay','ve dem','khuya'));
  const EX = PV._exclude || new Set();
  const nm = p => L(p.name, p.name_en || p.name);
  const kind = p => PV.tr(p.kind);
  // adjust last trip
  const last = [...state.chat].reverse().find(c=>c.trip);
  if (last && (has('bo ','khong muon','thay ','doi ','dieu chinh','di bo thoi','them quan','them diem','remove','skip','drop','instead','adjust','change','add food','add a','walk only') || n.startsWith('bo '))) {
    const del = has('bo','khong muon','thay','doi','remove','skip','drop','instead');
    const ids0 = last.trip.stops.map(s=>s.id), isFood = id => !!PV.foodType(PV.byId(id));
    let ex = del ? ids0.filter(id => { const p=PV.byId(id); return n.includes(PV.norm(p.name.split(/[–(-]/)[0].trim())) || (p.name_en && n.includes(PV.norm(p.name_en.split('(')[0].trim()))); }) : [];
    if (del && !ex.length && PV.findPlaces){   // "remove the post office", "bỏ bảo tàng": tìm theo từ khóa trong các điểm của lịch trình
      const rest = n.replace(/\b(bo|khong muon|thay|doi|di|diem|cho|remove|skip|drop|instead|the|please|di bo|lich trinh)\b/g,' ').trim();
      const hit = rest && PV.findPlaces(rest).find(p => ids0.includes(p.id)); if (hit) ex = [hit.id]; }
    const walk = has('di bo','walk'), addFood = has('them quan','them mon','an uong','an gi','add food','food','eat','restaurant');
    if (del && !ex.length && !walk && !addFood) return {t: L(`Bạn muốn bỏ điểm nào? Lịch trình đang có: ${ids0.map(id=>PV.byId(id).name).join(', ')}.`, `Which stop should I remove? The plan has: ${ids0.map(id=>nm(PV.byId(id))).join(', ')}.`)};
    const keep = ids0.filter(id=>!ex.includes(id));
    const sightsKeep = keep.filter(id=>!isFood(id)).length, sightsEx = ex.filter(id=>!isFood(id)).length;
    // lịch trình nhiều ngày: điểm thay thế không lấy lại chỗ đã đi ở các ngày khác
    const otherDays = /^(Ngày|Day) \d/.test(last.trip.title || '') ? state.chat.filter(c => c.trip && c !== last && !/\((đã điều chỉnh|adjusted)\)$/.test(c.trip.title||'')).flatMap(c => c.trip.stops.map(s => s.id)).filter(id => !ids0.includes(id)) : [];
    const o = {must: keep, exclude: [...ex, ...otherDays], start: last.trip.start, mode: walk?'walk':last.trip.mode,
      stops: Math.max(sightsKeep + sightsEx + (has('them diem','add a stop','add a place','one more')?1:0), 2), extraFood: addFood ? 1 : 0};
    if (addFood) o.weights = {food:2.5};
    const trip = PV.buildTrip(o); if (trip) { trip.title = last.trip.title.replace(/ \((đã điều chỉnh|adjusted)\)$/,'') + L(' (đã điều chỉnh)',' (adjusted)');
      const added = trip.stops.map(s=>s.id).filter(id => !ids0.includes(id)), nmv = id => PV.byId(id).name;
      const parts = [ex.length && L('bỏ '+ex.map(nmv).join(', '), 'removed '+ex.map(id=>nm(PV.byId(id))).join(', ')),
        added.length && L('thêm '+added.map(nmv).join(', '), 'added '+added.map(id=>nm(PV.byId(id))).join(', ')),
        walk && last.trip.mode !== 'walk' && L('chuyển sang đi bộ', 'switched to walking')].filter(Boolean);
      const noFood = addFood && !added.some(isFood) ? L(' Chưa thêm được quán ăn vì các bữa đã kín – ăn thêm lúc này sẽ quá sát bữa trước.', ' I could not add another food stop – the meals are already well spaced and one more would be too soon.') : '';
      return {t: L(`Mình đã điều chỉnh lịch trình${parts.length?' – '+parts.join('; '):''}. Thời gian và quãng đường đã được tính lại.`, `I've adjusted the itinerary${parts.length?' – '+parts.join('; '):''}. Times and distances have been recalculated.`) + noFood, trip}; }
  }
  // street story
  const st = D.streets.find(s => n.includes(PV.norm(s.name)) && has('duong','ten duong','y nghia','nghia la gi','nghia','la ai','la gi','vi sao','tai sao','street','mean','meaning','name','story','why','who'));
  if (st) { PV.markStreet(st.id);
    return {t: L(`Đường ${st.name} (phường ${st.wards}): ${st.story}\nBạn muốn xem con đường này trên bản đồ? Vào “Bản đồ khám phá” và gõ tên đường nhé!`, `${st.name} Street (${st.wards} ward): ${st.story_en||st.story}\nWant to see it on the map? Open “Explore map” and type the street name!`),
      sources:[{name:L('Tư liệu tên đường – nhóm Personavel tổng hợp','Street notes – compiled by the Personavel team')}]}; }
  // specific place
  const keyOf = p => [PV.norm(p.name.split(/[–(-]/)[0].trim()), p.name_en ? PV.norm(p.name_en.split('(')[0].trim()) : null].filter(Boolean);
  const pl = D.places.slice().sort((a,b)=>b.name.length-a.name.length).find(p => !EX.has(p.id) && keyOf(p).some(k => k.length>3 && W.includes(' '+k.replace(/[^a-z0-9]+/g,' ').trim()+' ')));
  // ---- những câu đúng chủ đề du lịch nhưng trước đây rơi vào câu trả lời chung chung ----
  // về chính web
  if (has('ai lam','ai tao','ai viet','ai phat trien','nhom nao lam','personavel la gi','web nay la gi','web nay cua ai','who made','who built','who created','who developed','what is personavel','about this app','about this website'))
    return {t: L('Personavel là bản đồ du lịch tự túc TP.HCM do nhóm học sinh 11A13, trường THPT Lê Quý Đôn làm ra. Web gom bản đồ địa điểm, câu chuyện tên đường, lịch trình tự động và 5 trợ lý ảo (An, Uyên, Hà, Kiệt, Phương) vào một chỗ. Your Trip, Your Story 💙',
      'Personavel is a self-guided travel map of Ho Chi Minh City made by student team 11A13 at Lê Quý Đôn High School. It brings together a map of places, street-name stories, automatic itineraries and 5 virtual guides (An, Uyên, Hà, Kiệt, Phương). Your Trip, Your Story 💙')};
  // trang phục khi vào chùa, nhà thờ ("ăn mặc" không phải ăn uống)
  if (has('an mac','mac gi','mac the nao','mac ra sao','trang phuc','quan ao','dress','dress code','wear','what to wear') && has('chua','nha tho','den','mieu','hoi quan','pagoda','temple','church','cathedral','shrine'))
    return {t: L('Khi vào chùa, đền, nhà thờ ở Sài Gòn:\n• Mặc kín vai và đầu gối – tránh áo hai dây, quần đùi, váy ngắn (mang theo khăn choàng là tiện nhất).\n• Cởi giày dép trước khi vào chánh điện chùa; nói nhỏ, không chạm vào tượng hay đồ thờ.\n• Không chĩa chân về phía bàn thờ, không đi ngang trước mặt người đang lễ.\n• Hỏi trước khi chụp ảnh nhà sư, người đang cầu nguyện; tắt đèn flash trong điện.\n• Nhà thờ thường không cho tham quan trong giờ lễ – xem giờ mở cửa ở thẻ địa điểm nhé.',
      'Visiting pagodas, temples and churches in Saigon:\n• Cover shoulders and knees – no tank tops, shorts or short skirts (a light scarf helps).\n• Take off your shoes before entering a pagoda’s main hall; speak quietly and do not touch statues or offerings.\n• Do not point your feet at the altar or walk right in front of people praying.\n• Ask before photographing monks or worshippers; no flash inside.\n• Churches usually close to visitors during Mass – check the opening hours on the place card.')};
  // lễ hội, Tết
  if (has('le hoi','tet','trung thu','giang sinh','noel','vu lan','ram thang gieng','festival','festivals','lunar new year','christmas','mid autumn') && !has('lich trinh','itinerary','plan','trip'))
    return {t: L('Các dịp lễ nổi bật ở Sài Gòn:\n• Tết Nguyên Đán (tháng 1–2 dương lịch): đường hoa Nguyễn Huệ, hội hoa xuân, phố sách Tết; nhiều quán nghỉ vài ngày đầu năm, phố xá vắng hơn thường lệ.\n• Tết Trung thu (rằm tháng 8 âm lịch): phố lồng đèn Lương Nhữ Học, múa lân khắp các phường.\n• Giáng sinh: khu Nhà thờ Đức Bà, Nguyễn Huệ, nhà thờ Tân Định trang trí rực rỡ, rất đông tối 24/12.\n• Lễ 30/4 – 1/5, 2/9 và Tết Dương lịch: thường có bắn pháo hoa và phân luồng ở trung tâm.\nNgày lễ rất đông – nên đi sớm, gửi xe xa trung tâm và theo dõi thông báo phân luồng nhé.',
      'Main festive times in Saigon:\n• Lunar New Year (Jan–Feb): the Nguyễn Huệ flower street, spring flower fairs and the Tết book street; many shops close for the first days and the city is quieter than usual.\n• Mid-Autumn Festival (15th day of the 8th lunar month): the lantern street on Lương Nhữ Học and lion dances everywhere.\n• Christmas: the Cathedral area, Nguyễn Huệ and Tân Định church are lit up; very crowded on the evening of 24 Dec.\n• 30 Apr – 1 May, 2 Sep and New Year’s Eve: usually fireworks and traffic diversions in the centre.\nHolidays are packed – go early, park away from the centre and watch for diversion notices.')};
  // ra sân bay
  if (has('san bay','tan son nhat','airport'))
    return {t: L('Đi sân bay Tân Sơn Nhất từ trung tâm (Quận 1 cũ):\n• Grab/taxi: khoảng 20–40 phút, giờ cao điểm (16h30–19h) có thể hơn 1 tiếng – nên đi sớm.\n• Xe buýt 109 (từ công viên 23/9) và 152: rẻ, có chỗ để hành lý, chạy tới tối.\nGiá Grab thay đổi theo giờ – xem giá chính xác trong ứng dụng trước khi đặt.',
      'Getting to Tân Sơn Nhất airport from the centre (old District 1):\n• Grab/taxi: about 20–40 min; at rush hour (4:30–7 pm) it can take over an hour – leave early.\n• Bus 109 (from 23/9 Park) and bus 152: cheap, room for luggage, running into the evening.\nGrab fares change with demand – check the exact price in the app before booking.')};
  // dị ứng
  if (has('di ung','allergy','allergic','allergies'))
    return {t: L('Nếu bạn bị dị ứng, hãy nói rõ với quán trước khi gọi món, ví dụ: “Tôi bị dị ứng đậu phộng” hoặc “Tôi bị dị ứng hải sản”.\n• Đậu phộng hay có trong: gỏi cuốn (nước chấm), bánh tráng trộn, xôi, chè, các món gỏi.\n• Hải sản, tôm khô hay có trong: bánh tráng trộn, mắm, nước dùng bún riêu.\nNếu dị ứng nặng, luôn mang thuốc theo người. Bạn cần mình gợi ý quán chay hoặc món đơn giản không?',
      'If you have an allergy, tell the staff before ordering, e.g. “Tôi bị dị ứng đậu phộng” (I am allergic to peanuts) or “Tôi bị dị ứng hải sản” (seafood).\n• Peanuts often appear in: spring-roll dipping sauce, bánh tráng trộn, sticky rice, chè desserts and salads.\n• Seafood and dried shrimp often appear in: bánh tráng trộn, fermented sauces and bún riêu broth.\nIf your allergy is severe, always carry your medication. Want me to suggest vegetarian places or simple dishes?')};
  // thời tiết khi không lấy được dữ liệu trực tiếp (bản có mạng trả lời bằng số liệu thật ở PV.answer)
  if (hasA('thời tiết','trời mưa','có mưa','mưa không','nắng không','nóng không') || has('thoi tiet','weather','rain','raining','rainy','sunny','temperature','forecast') || (plain && has('troi mua','co mua','mua khong','nang khong')))
    return {t: L('Mình chưa lấy được thời tiết trực tiếp lúc này. Sài Gòn nắng nóng quanh năm (khoảng 26–35°C); mùa mưa từ tháng 5 đến tháng 11, thường mưa rào buổi chiều 30–60 phút rồi tạnh. Nên mang dù gọn, kem chống nắng và nước uống. Xem thời tiết từng nơi trong thẻ địa điểm nhé.',
      'I cannot get live weather right now. Saigon is hot all year (about 26–35°C); the rainy season runs May to November, usually with a 30–60 minute afternoon downpour. Bring a small umbrella, sunscreen and water. Each place card shows its live weather.')};
  // hai địa điểm + đi lại ("đi Grab từ chợ Bến Thành tới Dinh Độc Lập bao nhiêu tiền?", "how far from A to B")
  { const both = D.places.filter(p => p.coords && keyOf(p).some(k => k.length>3 && W.includes(' '+k.replace(/[^a-z0-9]+/g,' ').trim()+' ')))
      .map(p => [p, Math.min(...keyOf(p).map(k => { const i = W.indexOf(' '+k.replace(/[^a-z0-9]+/g,' ').trim()+' '); return i < 0 ? 1e9 : i; }))]).sort((a, b) => a[1] - b[1]).map(x => x[0])
      .filter((p, i, arr) => arr.findIndex(q => PV.dist(q.coords, p.coords) < .15) === i);   // cùng một chỗ (vd 2 bản ghi "Chợ Bến Thành") chỉ tính 1 lần
    if (both.length >= 2 && has('tu','den','toi','qua','sang','di','grab','taxi','xe','bao xa','bao lau','bao nhieu tien','from','to','how far','how long','how much','get','route')) {
      const [a, b] = both, walk = PV.travel(a.coords, b.coords, 'walk'), moto = PV.travel(a.coords, b.coords, 'moto'), fare = PV.legCost({km: moto.km}, 'taxi');
      const r = x => Math.round(x / 1000) * 1000, vnd = x => r(x).toLocaleString('vi-VN') + 'đ';
      return {t: L(`Từ ${a.name} tới ${b.name}: khoảng ${PV.fmtKm(moto.km)}.\n• Đi bộ: ~${walk.min} phút${walk.min > 25 ? ' (hơi xa, trời nắng nên đi xe)' : ''}.\n• Xe máy / Grab: ~${moto.min} phút.\n• Grab ô tô / taxi: ước tính ${vnd(fare.min)}–${vnd(fare.max)} (giá thay đổi theo giờ, xem chính xác trong ứng dụng).${PV.isRush && PV.isRush(new Date().getHours()*60+new Date().getMinutes()) ? '\n⚠️ Đang giờ cao điểm – cộng thêm thời gian kẹt xe.' : ''}`,
        `From ${nm(a)} to ${nm(b)}: about ${PV.fmtKm(moto.km)}.\n• Walking: ~${walk.min} min${walk.min > 25 ? ' (a bit far in the heat – take a ride)' : ''}.\n• Motorbike / Grab bike: ~${moto.min} min.\n• Grab car / taxi: roughly ${vnd(fare.min)}–${vnd(fare.max)} (fares vary – check the app).${PV.isRush && PV.isRush(new Date().getHours()*60+new Date().getMinutes()) ? '\n⚠️ It is rush hour – allow extra time.' : ''}`), places: [a.id, b.id]};
    } }
  // chặt chém, lừa đảo
  if (has('chat chem','lua dao','bi lua','moi chao','cheo keo','gia cao','nang gia','scam','scams','rip off','ripoff','overcharge','overcharged','tourist trap','cheat','cheated','touts')) {
    const T = PV.TRAPS || [], here = pl && pl.coords ? T.filter(x => PV.dist(pl.coords, x.c) <= Math.max(x.r, .4)) : [];
    const list = (here.length ? here : T).map(x => '• ' + L(x.vi, x.en)).join('\n');
    return {t: L(`${here.length ? 'Quanh ' + pl.name + ' cần lưu ý' : 'Những chỗ du khách hay bị chèo kéo, nâng giá ở trung tâm'}:\n${list}\nMẹo chung: hỏi giá trước khi mua hoặc lên xe, gọi xe qua ứng dụng, mặc cả lịch sự và cứ từ chối nếu thấy không ổn.`,
      `${here.length ? 'Things to watch around ' + nm(pl) : 'Where visitors are often touted or overcharged in the centre'}:\n${list}\nGeneral tips: ask the price before buying or getting on, book rides in an app, bargain politely and simply walk away if it feels wrong.`), places: pl ? [pl.id] : []};
  }
  // "ăn gì gần Chợ Bến Thành", "chụp ảnh quanh Dinh Độc Lập": gợi ý các điểm gần điểm được nhắc tới, không giới thiệu lại chính nó
  const nearQ = has('gan','quanh','ke ben','canh','gan do','xung quanh','near','nearby','around','close to');
  const foodQ = has('an','an gi','quan an','an uong','an ngon','ngon','do an','mon','eat','food','restaurant','pho','banh mi','dessert','snack');
  const photoQ = has('chup anh','check in','song ao','photo','photos','instagram');
  if (pl && pl.coords && nearQ && (foodQ || photoQ)) {
    const ok = q => foodQ ? !!PV.foodType(q) : q.cats.includes('checkin');
    const near = D.places.filter(q => q.id !== pl.id && q.coords && !EX.has(q.id) && ok(q)).map(q => [q, PV.dist(pl.coords, q.coords)])
      .filter(([, d]) => d <= 1.5).sort((a, b) => a[1] - b[1]).slice(0, 5);
    if (near.length) return {t: L(`Quanh ${pl.name} có mấy ${foodQ ? 'quán ngon' : 'góc chụp đẹp'} này (xếp từ gần tới xa):\n` + near.map(([q, d]) => `• ${q.name} – ${PV.fmtKm(d)}${foodQ && PV.foodType(q) === 'snack' ? ' (ăn vặt)' : ''}`).join('\n'),
      `Near ${nm(pl)}, try these ${foodQ ? 'places to eat' : 'photo spots'} (closest first):\n` + near.map(([q, d]) => `• ${nm(q)} – ${PV.fmtKm(d)}${foodQ && PV.foodType(q) === 'snack' ? ' (snack)' : ''}`).join('\n')),
      places: near.map(([q]) => q.id)};
  }
  if (pl && !has('lich trinh','ke hoach','itinerary','plan')) {
    const hours = L((pl.hours||[])[0], (pl.hours_en||[])[0] || PV.tr((pl.hours||[])[0]));
    const price = L((pl.price||[])[0], (pl.price_en||[])[0] || PV.tr((pl.price||[])[0])) || PV.tr(PV.priceText(pl.price_level));
    const hl = PV.cleanHl(pl, 3);
    const t = `${nm(pl)}: ${L(pl.desc, pl.desc_en || PV.tr(pl.desc))}\n📍 ${pl.address}\n🕒 ${hours||L('Giờ mở cửa chưa xác minh','Opening hours not verified')}\n🎟️ ${price}${hl.length?'\n'+(PV.foodType(pl)?L('🍴 Nên ăn: ','🍴 What to eat: '):L('👀 Nên xem: ','👀 What to see: '))+hl.join(', '):''}${pl.geo==='approx'?L('\n(Lưu ý: vị trí trên bản đồ là gần đúng, bạn nên kiểm tra lại.)','\n(Note: the map position is approximate, please double-check.)'):''}`;
    return {t, places:[pl.id], sources:[pl.source?{name:pl.source_name,url:pl.source}:{name:PV.tr(pl.source_name||'Khảo sát của nhóm')}]};
  }
  // tóm tắt nên ăn gì ở từng bữa, nên xem gì ở các điểm chính (link nằm trong thẻ lịch trình bên dưới)
  const tripGuide = (trip) => {
    const meals = trip.stops.filter(x => x.tag).map(x => { const p = PV.byId(x.id), hl = PV.cleanHl(p, 2);
      const tag = L(x.tag, x.tag.startsWith('Ăn vặt') ? 'Snack' : x.tag === 'Ăn sáng' ? 'Breakfast' : x.tag === 'Ăn trưa' ? 'Lunch' : 'Dinner');
      return `• ${x.arrive} ${tag} – ${nm(p)}${hl.length ? ': ' + hl.join(', ') : ''}`; });
    const sights = trip.stops.filter(x => !x.tag).map(x => { const p = PV.byId(x.id), hl = PV.cleanHl(p, 1); return hl.length ? `• ${nm(p)}: ${hl[0]}` : ''; }).filter(Boolean).slice(0, 4);
    return (meals.length ? L('\n\n🍴 Nên ăn gì:\n', '\n\n🍴 What to eat:\n') + meals.join('\n') : '')
      + (sights.length ? L('\n\n👀 Nên xem gì:\n', '\n\n👀 What to see:\n') + sights.join('\n') : '')
      + L('\n\nBấm 📍 dưới mỗi điểm để mở Google Maps.', '\n\nTap 📍 under each stop to open it in Google Maps.');
  };
  // itinerary (kể cả "ngày 2" sau khi đã có lịch trình)
  const nextDayQ = state.chat.some(c=>c.trip) && has('ngay 2','ngay thu 2','ngay thu hai','ngay 3','ngay thu 3','ngay tiep','ngay tiep theo','hom sau','day 2','day two','day 3','next day','second day');
  if (nextDayQ || has('lich trinh','ke hoach','len lich','hanh trinh','di dau','1 ngay','mot ngay','nua ngay','buoi sang','buoi toi','buoi chieu','toi nay','itinerary','plan','trip','schedule','one day','1 day','half day','tonight','evening','morning','afternoon','where to go')) {
    const o = {};
    // "ngày 2", "day 2", "ngày tiếp theo": xếp ngày mới, không lặp lại các điểm đã có ở những ngày trước
    const prevTrips = state.chat.filter(c => c.trip).map(c => c.trip);
    const nextDay = prevTrips.length && (has('ngay 2','ngay thu 2','ngay thu hai','ngay 3','ngay thu 3','ngay tiep','ngay tiep theo','ngay mai','hom sau','day 2','day two','day 3','next day','second day','tomorrow') );
    if (nextDay) o.exclude = [...new Set(prevTrips.flatMap(t => t.stops.map(s => s.id)))];
    const days = (n.match(/(\d)\s*(ngay|days?)\b/) || [])[1] | 0;
    const dur = n.match(/(\d+(?:[.,]5)?)\s*(tieng|hours?|hrs?)\b/) || n.match(/(?:trong|khoang|tam|mat)\s*(\d+(?:[.,]5)?)\s*gio\b/);
    if (dur) o.hours = Math.min(12, Math.max(1.5, parseFloat(dur[1].replace(',','.'))));
    if (evening()) { o.start='17:30'; o.hours=o.hours||5; }
    else if (has('buoi chieu','afternoon')) { o.start='14:00'; o.hours=o.hours||5; }
    else if (has('buoi sang','nua ngay','morning','half day')) { o.start='07:30'; o.hours=o.hours||4.5; }
    const tm = text.replace(/(\d+(?:[.,]5)?)\s*(tiếng|tieng|hours?|hrs?)\b/gi, ' ').replace(/(trong|khoảng|khoang|tầm|tam|mất|mat)\s*\d+(?:[.,]5)?\s*(giờ|gio)\b/gi, ' ').match(/(\d{1,2})\s*(h|giờ|:|am|pm)\s*(\d{2})?/i); if (tm && +tm[1]<24) { let h=+tm[1]; if (/pm/i.test(tm[2]) && h<12) h+=12; o.start = String(h).padStart(2,'0')+':'+(tm[3]||'00'); }
    if (has('tiet kiem','re','sinh vien','it tien','cheap','budget','student')) o.budget = 1;
    if (has('di bo','walk')) o.mode='walk'; else if (has('taxi','grab')) o.mode='taxi'; else if (has('xe may','motorbike','scooter')) o.mode='moto';
    const w = {};
    if (has('an uong','am thuc','an ngon','quan an','food','eat')) w.food = 2.2;
    if (has('lich su','van hoa','bao tang','di tich','history','culture','museum')) w.history = 2.2;
    if (has('check in','chup anh','song ao','photo','instagram')) w.checkin = 2.2;
    if (has('mua sam','qua','luu niem','thoi trang','shopping','souvenir','gift','fashion')) w.shopping = 2.2;
    o.weights = w;
    const trip = PV.buildTrip(o);
    if (!trip) return {t:L('Mình chưa tìm được lịch trình phù hợp. Bạn thử nói rõ hơn khung giờ hoặc sở thích nhé!','I could not find a suitable itinerary. Try telling me the time of day or what you like!')};
    const night = o.start && PV.toMin(o.start) >= 17*60;
    trip.title = night ? L('Sài Gòn về đêm','Saigon by night') : L('Một ngày khám phá Sài Gòn','A day exploring Saigon');
    const dayNo = nextDay ? prevTrips.length + 1 : 0;
    if (dayNo) trip.title = L(`Ngày ${dayNo} – `, `Day ${dayNo} – `) + trip.title;
    else if (days >= 2) trip.title = L('Ngày 1 – ', 'Day 1 – ') + trip.title;
    const dayNote = days >= 2 && !nextDay ? L(`\nĐây là Ngày 1 trong ${days} ngày. Gõ “ngày 2” để mình xếp tiếp các điểm khác, không trùng với hôm nay.`, `\nThis is Day 1 of ${days}. Type “day 2” and I'll plan different places for the next day.`)
      : dayNo ? L(`\nNgày ${dayNo} không lặp lại điểm nào của những ngày trước.`, `\nDay ${dayNo} does not repeat any place from earlier days.`) : '';
    const per = state.profile?.persona;
    return {t: L(`Mình đã lên lịch trình ${trip.stops.length} điểm (từ ${trip.start} đến khoảng ${trip.stops.length ? trip.stops[trip.stops.length-1].leave : trip.start}), di chuyển bằng ${PV.MODES[trip.mode].name.toLowerCase()}. Các điểm được chọn theo ${per?'phong cách “'+per.name+'”':'những địa điểm nổi bật'}, ưu tiên gần nhau và xếp bữa ăn vào khung trưa/tối.${!state.profile?.prefs?'\nGợi ý: hãy làm bài phân tích phong cách (trong Trang cá nhân) để mình đề xuất chính xác hơn.':''}\nBạn có thể lưu, hoặc nói “bỏ [tên địa điểm]”, “thêm quán ăn”, “đi bộ thôi”… để mình điều chỉnh.`,
      `I've planned a ${trip.stops.length}-stop itinerary (${trip.start} to about ${trip.stops.length ? trip.stops[trip.stops.length-1].leave : trip.start}), travelling by ${PV.tr(PV.MODES[trip.mode].name).toLowerCase()}. Stops are chosen for ${per?'your “'+PV.tr(per.name)+'” style':'their highlights'}, kept close together, with meals at lunch/dinner time.${!state.profile?.prefs?'\nTip: take the style analysis (in My profile) for better suggestions.':''}\nYou can save it, or say “remove [place]”, “add food”, “walk only”… and I'll adjust it.`) + dayNote + tripGuide(trip), trip};
  }
  // category suggestions
  const near = has('gan day','gan toi','quanh day','gan nhat','near','nearby','around');
  const pick = (f, k=4) => { let arr = D.places.filter(p=>p.coords && f(p) && !EX.has(p.id)); if (near && PV.userPos) arr.sort((a,b)=>PV.dist(PV.userPos,a.coords)-PV.dist(PV.userPos,b.coords)); else arr.sort((a,b)=>PV.score(b)-PV.score(a)); return arr.slice(0,k).map(p=>p.id); };
  const gps = near && !PV.userPos ? L(' (bật “Vị trí của tôi” trên bản đồ để mình xếp theo khoảng cách)',' (turn on “My location” on the map so I can sort by distance)') : '';
  const DISH = {'pho':'phở','banh mi':'bánh mì','bun bo':'bún bò','bun cha':'bún chả','com tam':'cơm tấm','che':'chè','oc':'ốc','banh xeo':'bánh xèo','xoi':'xôi','hu tieu':'hủ tiếu','chao':'cháo','lau':'lẩu','banh trang':'bánh tráng','sup cua':'súp cua','banh flan':'bánh flan','bot chien':'bột chiên','chay':'chay','bo kho':'bò kho','banh beo':'bánh bèo','bach tuoc':'bạch tuộc','mi ':'mì','noodle':'mì','vegetarian':'chay','vegan':'chay','snail':'ốc','sandwich':'bánh mì','broken rice':'cơm tấm','pancake':'bánh xèo','sticky rice':'xôi','dessert':'chè','soup':'súp cua','hotpot':'lẩu'};
  const AMBIG = {'pho':['phở'],'chao':['cháo'],'lau':['lẩu'],'che':['chè'],'oc':['ốc'],'xoi':['xôi'],'chay':['chay','ăn chay','quán chay','đồ chay']};
  const AMBIG_PLAIN = {'pho':['an pho','quan pho','pho bo','pho ga','to pho','pho ngon','eat pho','good pho','best pho','pho place','pho places','pho restaurant','pho shop','some pho','for pho','pho near'],'chao':['an chao','quan chao','chao long','chao ga','chao vit','chao ca','chao suon','chao ech'],'lau':['an lau','quan lau','lau thai','lau de','lau bo','lau hai san'],'che':['an che','quan che','che ba mau','che thai','tiem che','che ngon'],'oc':['an oc','quan oc','oc ngon'],'xoi':['an xoi','xoi ga','xoi man','quan xoi'],'chay':['an chay','quan chay','do chay','com chay']};
  const dk = Object.keys(DISH).find(d => { const k = d.trim();
    if (AMBIG[k]) return plain ? has(...AMBIG_PLAIN[k]) : hasA(...AMBIG[k]);
    return has(k); });  if (dk) { const da = DISH[dk].toLowerCase(), dn = PV.norm(DISH[dk]);
    const tA = p => ' '+[p.name, ...(p.highlights||[]).slice(0,3)].join(' ').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,' ')+' ';
    const tN = p => ' '+PV.norm([p.name, ...(p.highlights||[]).slice(0,3)].join(' ')).replace(/[^a-z0-9]+/g,' ')+' ';
    let ids = pick(p=>p.cats.includes('food') && tA(p).includes(' '+da+' '), 5);              // exact dish with tones (cháo ≠ chảo)
    if (!ids.length && !AMBIG[dk.trim()]) ids = pick(p=>p.cats.includes('food') && tN(p).includes(' '+dn+' '), 5); if (ids.length) return {t: L(`Món “${DISH[dk]}” thì bạn có thể thử những quán này${gps}:`, `For “${DISH[dk]}”, try these places${gps}:`), places:ids}; }
  // dish name typed by the user ("bún riêu", "milo dầm", "bánh tiêu"…) → places whose name / signature dishes contain it
  { const GEN = new Set(['sai','gon','saigon','tp','hcm','ho','chi','minh','thanh','le','hoi','tet','tham','quan','lich','su','van','hoa','nha','tho','chua','mac','ao','an mac','goi','y','an','ngon','o','dau','gan','day','minh','muon','cho','nao','di','toi','ban','co','khong','the','nhat','tim','thu','mon','nhung','cac','va','voi','la','o?','xin','chao','hello','hi','oi','a','nhe','nha','cam','on','ban','la','ai','gi','ten','khoe']);
    const w = n.replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean); const grams = [];
    for (let i=0;i<w.length-1;i++){ if (!GEN.has(w[i]) && !GEN.has(w[i+1])) grams.push(w[i]+' '+w[i+1]); }
    if (grams.length && !has('mua qua','luu niem','mua sam','shopping','souvenir','qua tang')){
      const hits = D.places.filter(p => p.cats.includes('food')).map(p => { const hay = ' '+PV.norm([p.name, ...(p.highlights||[])].join(' | ')).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ')+' '; return [p, grams.filter(g => hay.includes(' '+g+' ')).length]; }).filter(x => x[1]>0).sort((a,b)=>b[1]-a[1]);
      if (hits.length) return {t:L(`Món bạn hỏi có ở ${hits.length>1?'những quán này':'quán này'} nè:`, `You can find that dish here:`), places: hits.slice(0,5).map(x=>x[0].id)};
    } }
  if (has('mua qua',' qua tang','qua luu niem','qua ve','luu niem','dac san','mua sam','shopping','thoi trang','souvenir','gift','buy','fashion')) return {t:L('Mua quà và mua sắm thì bạn ghé những nơi này nhé:','For gifts and shopping, try these places:'), places:pick(p=>p.cats.includes('shopping'),5)};
  if (has('an','quan','mon','doi','ngon','am thuc','food','eat','hungry','restaurant','lunch','dinner','breakfast') && !has('an mac','quan ao')) return {t: L(`Một vài quán ngon hợp khẩu vị của bạn${gps}:`, `Some tasty places that match your taste${gps}:`), places:pick(p=>p.cats.includes('food'))};
  if (evening()) return {t:L('Buổi tối ở Sài Gòn, bạn có thể ghé phố ẩm thực, chợ đêm hoặc ngắm kiến trúc lên đèn:','In the evening you can try food streets, night markets or see the city lit up:'), places:pick(p=>{ const h=PV.parseHours(p); return h && h[1] >= 21*60; },5)};
  if (has('lich su','bao tang','di tich','van hoa','nha tho','chua','history','museum','culture','church','pagoda','heritage')) return {t:L('Những điểm văn hóa – lịch sử nên ghé:','Cultural and historic places worth visiting:'), places:pick(p=>p.cats.includes('history'),5), sources:[{name:L('Wikipedia & website các địa điểm','Wikipedia & official websites')}]};
  if (has('di dao','dao pho','dao choi','pho di bo','di bo dao','walk around','stroll','walking street')) return {t:L('Đi dạo thì mấy chỗ này vừa đẹp vừa gần nhau, bạn có thể đi bộ nối tiếp:','For a stroll, these spots are pretty and close together – easy to walk between:'), places:pick(p=>p.cats.includes('checkin')||p.cats.includes('history'),5)};
  if (has('check in','chup','song ao','dep','photo','picture','instagram')) return {t:L('Mấy góc check-in đẹp đây:','Here are some great photo spots:'), places:pick(p=>p.cats.includes('checkin'),5)};
  if (hasA('xin chào','chào','chào bạn') || has('hello','hi','hey')) { const g=PV.todayGuide(); return {t:L(`${g.greet} Bạn cần mình giúp gì nào?`, `${PV.tr(g.greet)} How can I help?`)}; }
  if (PV.guideOffer){ const g = PV.todayGuide(), o = PV.guideOffer(g.id);   // only what this guide does
    return {t: L(`Mình là ${g.name}, mình chuyên ${o.can}. Bạn thử hỏi:\n${o.ex.map(x => '• ' + x).join('\n')}`, `I'm ${g.name} – I can help with ${o.can}. Try asking:\n${o.ex.map(x => '• ' + x).join('\n')}`)}; }
  return {t:L('Mình có thể giúp bạn:\n• Lên lịch trình (vd: “lên lịch trình buổi tối, đi bộ, tiết kiệm”)\n• Gợi ý quán theo món (vd: “phở ngon gần đây”)\n• Kể chuyện địa danh (vd: “kể về Bưu điện Thành phố”)\n• Giải thích tên đường (vd: “đường Hai Bà Trưng có ý nghĩa gì”)',
    'I can help you:\n• Plan a trip (e.g. “evening itinerary, walking, on a budget”)\n• Suggest food by dish (e.g. “good phở near me”)\n• Tell landmark stories (e.g. “tell me about the Central Post Office”)\n• Explain street names (e.g. “what does Hai Bà Trưng street mean”)'), places:PV.recommend(3).map(p=>p.id)};
};

/* ---------- celebrate: the guide pops up when a collection badge is completed ---------- */
PV.checkBadges = () => {
  if (!state.profile) return;
  const got = PV.badges().filter(b=>b.got);
  let seen = PV.store.get('badgesSeen', null);
  if (!Array.isArray(seen)) { PV.store.set('badgesSeen', got.map(b=>b.id)); return; } // first run: no retro party
  const fresh = got.filter(b => !seen.includes(b.id));
  if (!fresh.length) return;
  PV.store.set('badgesSeen', [...seen, ...fresh.map(b=>b.id)]);
  setTimeout(() => PV.celebrate(fresh), 900);
};
PV.celebrate = (list) => {
  const old = document.getElementById('celebrate'); if (old) old.remove();
  const g = PV.todayGuide(); const name = state.profile?.name || PV.L('Du khách','Traveller');
  const all = PV.badges(); const done = all.filter(b=>b.got).length;
  const next = all.filter(b=>!b.got).sort((a,b)=>(b.cur/b.max)-(a.cur/a.max))[0];
  const bn = b => `${b.e} <b>${esc(PV.tr(b.name))}</b>`;
  const ov = document.createElement('div'); ov.className = 'celebrate-ov'; ov.id = 'celebrate'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
  ov.innerHTML = `<div class="confetti" aria-hidden="true">${Array.from({length:60},(_,i)=>`<i style="left:${(i*37+11)%100}%;background:${['#2F6FA3','#D62839','#F4C430','#7FC3EA','#1F4E79','#F28C8C'][i%6]};animation-delay:${1+(i%9)*.13}s;animation-duration:${2.2+(i%5)*.35}s"></i>`).join('')}</div>
    <div class="cel-box">
      <div class="cel-bot">${PV.robot(g)}<div class="cel-badge">${list[0].e}</div></div>
      <div class="cel-card">
        <button class="cel-x" aria-label="Đóng">✕</button>
        <div class="cel-title">🎉 ${PV.L('Chúc mừng','Congratulations')} ${esc(name)}!</div>
        <div>${PV.L('Bạn vừa hoàn thành mục','You just completed')} ${list.map(bn).join(', ')} ${PV.L('trong Bộ sưu tập Sài Gòn.','in the Saigon Collection.')}</div>
        <div class="tiny muted" style="margin-top:4px">${list.map(b=>esc(PV.tr(b.need))).join(' · ')}</div>
        <div style="margin-top:8px">${done===all.length ? PV.L('Bạn đã sưu tập đủ tất cả huy hiệu – một nhà khám phá Sài Gòn thực thụ! 🏆','You have collected every badge – a true Saigon explorer! 🏆')
          : PV.L(`Bạn đã có ${done}/${all.length} huy hiệu.`, `You now have ${done}/${all.length} badges.`) + (next ? ' ' + PV.L('Mục gần xong nhất:','Closest next:') + ` ${bn(next)} (${Math.min(next.cur,next.max)}/${next.max}).` : '')}</div>
        <div class="gp-acts" style="justify-content:center"><button class="btn sm" data-ca="coll">🏅 ${PV.L('Xem bộ sưu tập','View collection')}</button><button class="btn sm ghost" data-ca="map">📍 ${PV.L('Khám phá tiếp','Keep exploring')}</button></div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => { ov.classList.add('out'); setTimeout(()=>ov.remove(), 300); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key==='Escape') close(); }; document.addEventListener('keydown', esc_);
  ov.addEventListener('click', e => { if (e.target===ov) close(); });
  ov.querySelector('.cel-x').onclick = close;
  ov.querySelectorAll('[data-ca]').forEach(b => b.onclick = () => { close(); const h = b.dataset.ca==='coll' ? '#collection' : '#map'; if (location.hash===h) PV.route(); else location.hash = h; });
  if (location.hash==='#collection') { const m=document.getElementById('main'); m && PV.views.collection(m); }
};
(() => { // watch every change that can complete a badge
  const W = ['visited','readStreets','diaries','listened'];
  const orig = PV.save;
  PV.save = k => { orig(k); if (W.includes(k)) { try { PV.checkBadges(); } catch(e){} } };
})();
})();
