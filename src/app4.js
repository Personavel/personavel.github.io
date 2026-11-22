/* ===== Personavel – welcome, onboarding, tour, init ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;

/* after the logo has fully appeared: the background colours flip places with a quick flash */
PV.introSwap = (ov, at, fadeBack) => {
  if (document.body.classList.contains('reduce')) return;
  const bg = document.getElementById('pvbg'); const cs = bg ? getComputedStyle(bg) : null;
  const v = (n, d) => (cs && cs.getPropertyValue(n).trim()) || d;
  const themed = PV.state.settings.theme && PV.state.settings.theme.id && PV.state.settings.theme.id !== 'default';
  const c1 = themed ? v('--b1','#FFFFFF') : '#E4F1FC', c2 = themed ? v('--b2','#DCEBF8') : '#9FCBEE', c3 = themed ? v('--b3','#F4F9FE') : '#BFDCF5', c4 = themed ? v('--b4','#CFE3F6') : '#5E9FD6';
  // brightest of the colours flashes up from below
  const L = h => { h = h.replace('#',''); const n = parseInt(h,16); return (n>>16&255)*.3 + (n>>8&255)*.59 + (n&255)*.11; };
  const sat = h => { h = h.replace('#',''); const n = parseInt(h,16), r=(n>>16&255), g=(n>>8&255), b=(n&255); const mx=Math.max(r,g,b), mn=Math.min(r,g,b); return mx ? (mx-mn)/mx * (mx/255+.35) : 0; };
  const cols = [c1,c2,c3,c4].sort((a,b)=>L(a)-L(b)); const dark = cols[0];
  const accent = [c1,c2,c3,c4].filter(c=>c!==dark).sort((a,b)=>sat(b)-sat(a))[0] || cols[3];
  const mix = (a, b, t) => { const A=parseInt(a.slice(1),16), B=parseInt(b.slice(1),16); const ch=(x,s)=>(x>>s)&255; return '#'+[16,8,0].map(s=>Math.round(ch(A,s)+(ch(B,s)-ch(A,s))*t).toString(16).padStart(2,'0')).join(''); };
  const mid = L(dark) < 60 ? mix(accent, '#FFFFFF', .12) : accent, light = mix(accent, '#FFFFFF', L(dark) < 60 ? .45 : .6);
  const fx = document.createElement('div'); fx.className = 'introswap';
  const vw = innerWidth, vh = innerHeight, diag = Math.hypot(vw, vh), ang = Math.atan2(vh, vw) * 180 / Math.PI;
  fx.style.cssText = `--dk:${dark};--md:${mid};--lt:${light};--ang:${ang.toFixed(2)}deg;--diag:${Math.round(diag)}px;--len:${Math.round(Math.max(260, diag*.42))}px`;
  fx.innerHTML = '<i class="sa"></i><i class="sb"></i><i class="streak"><b></b></i><i class="streak s2"><b></b></i>';
  setTimeout(() => { if (document.body.contains(ov)) ov.appendChild(fx); }, at);
  // the logo lights up as the streak passes over it
  setTimeout(() => { const lg = ov.querySelector('.intro-stage .logoText') || ov.querySelector('.logoText'); if (lg){ lg.style.setProperty('--lt', light); lg.classList.add('lit'); } }, at + 750);
};
const spell = (txt, start, step) => [...String(txt)].map((c,i)=>`<span aria-hidden="true" class="${c===' '?'sp':''}" style="animation-delay:${(start+i*step).toFixed(2)}s">${c===' '?'&nbsp;':esc(c)}</span>`).join('');
PV.welcome = (force) => {
  const p = state.profile;
  const returning = p && p.name && p.onboarded && !force;
  const ov = document.createElement('div'); ov.className='overlay'; ov.id='welcome';
  ov.innerHTML = `${[[8,40,90,26],[22,70,140,34],[60,20,110,28],[75,82,160,40]].map(([t,dl,w,h],i)=>`<div class="cloud" style="top:${t}vh;width:${w}px;height:${h}px;animation-delay:-${dl/4}s;animation-duration:${26+i*6}s"></div>`).join('')}
    <button class="btn ghost sm skip" id="wskip">Bỏ qua</button>
    ${PV._langJustChosen ? '' : PV.langSwitch('welcome-lang')}
    <div class="welcome-center" id="wc">
      <div class="intro-stage">
        <div class="logoText letters" aria-label="Personavel">${'Personavel'.split('').map((c,i)=>`<span aria-hidden="true" style="animation-delay:${(0.2+i*0.16).toFixed(2)}s">${c}</span>`).join('')}</div>
        ${returning?'':`<div class="introbot">${PV.robot(PV.GUIDES[0])}</div>`}
      </div>
      <div class="wbelow">${returning ? `<div class="logoText letters retname" aria-label="${esc(p.name)}">${spell(p.name, 2.0, 0.14)}</div><div class="slogan letters" aria-label="${esc(PV.L('Chào mừng bạn trở lại!','Welcome back!'))}">${spell(PV.L('Chào mừng bạn trở lại!','Welcome back!'), 2.25 + 0.14*p.name.length, 0.05)}</div>`
                  : `<div class="slogan fade d1">Your trip, Your story.</div><div class="fade d3" style="margin-top:18px"><button class="btn" id="wgo">Bắt đầu hành trình</button><div class="tiny muted" style="margin-top:8px">Chạm vào bất kỳ đâu để tiếp tục</div></div>`}</div>
    </div>`;
  document.body.appendChild(ov);
  if (PV.themeInto) PV.themeInto(ov);
  PV.introSwap(ov, 2250, !returning);
  if (!returning) PV.animateIntroBot(ov);
  const close = () => { ov.style.transition='opacity .5s'; ov.style.opacity='0'; setTimeout(()=>ov.remove(),500); };
  $('#wskip',ov).onclick = (e) => { e.stopPropagation(); if (!state.profile){ state.profile={name:PV.L('Du khách','Traveller'), joined:new Date().toLocaleDateString('vi-VN'), onboarded:true}; PV.save('profile'); } close(); PV.route(); };
  if (returning){ ov.onclick = (e) => { if (!(e.target.closest && e.target.closest('.langsw'))) close(); }; setTimeout(close, Math.round((2.25 + 0.14*p.name.length + 0.05*PV.L('Chào mừng bạn trở lại!','Welcome back!').length + 1.4)*1000)); return; }
  let stepped = false;
  const next = () => { if (stepped) return; stepped = true; PV.intro(ov, close); };
  ov.addEventListener('click', e => { if (e.target.id!=='wskip' && !(e.target.closest && e.target.closest('.langsw'))) next(); });
};


/* smooth intro: robot slides in with the logo, then one continuous half circle under it, ending on the right */
PV.animateIntroBot = (ov) => {
  const bot = ov.querySelector('.introbot'), stage = ov.querySelector('.intro-stage'); if (!bot || !stage) return;
  const reduce = document.body.classList.contains('reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = () => {
    const W = stage.offsetWidth, H = stage.offsetHeight, w = bot.offsetWidth, h = bot.offsetHeight;
    const sr = stage.getBoundingClientRect();
    const roomLeft = sr.left;
    let x0 = -w - 6, y0 = -h * 0.08;
    if (roomLeft < w + 10){ x0 = 0; y0 = H * 1.02; }                    // narrow screens: start under the left end of the logo
    let x1 = W + 6; const roomRight = innerWidth - sr.right;
    let y1 = y0;
    if (roomRight < w + 10){ x1 = W - w; y1 = H * 1.02; }            // narrow screens: stop under the right end of the logo
    const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2, depth = H * 1.05 + h * 0.15;
    const frames = [];
    const N = 48;
    for (let k = 0; k <= N; k++){
      const t = k / N, phi = Math.PI * t;
      const x = cx - rx * Math.cos(phi);
      const y = y0 + (y1 - y0) * t + depth * Math.sin(phi);
      const tilt = -10 * Math.cos(phi);                                 // leans into the curve
      frames.push({transform:`translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`});
    }
    const endT = frames[frames.length-1].transform.replace(/rotate\([^)]*\)/,'rotate(0deg)');
    frames[frames.length-1] = {transform:endT};
    bot.style.transform = frames[0].transform;
    if (reduce){ bot.style.transform = endT; bot.style.opacity = 1; return; }
    // phase 1: arrive together with the logo
    const inAnim = bot.animate([{transform:`translate(${(x0 - innerWidth*0.6).toFixed(1)}px, ${y0}px)`, opacity:0},{transform:frames[0].transform, opacity:1}],
      {duration:600, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards'});
    inAnim.onfinish = () => { bot.style.opacity = 1;
      // phase 2: one smooth half circle (single easing over the whole path)
      const arc = bot.animate(frames, {duration:1050, easing:'cubic-bezier(.45,.05,.35,1)', fill:'forwards'});
      arc.onfinish = () => { bot.style.transform = endT; bot.classList.add('landed'); };
    };
  };
  const start = () => requestAnimationFrame(() => requestAnimationFrame(run));
  // wait for the brush font so the path is measured on the final logo width
  try { Promise.race([document.fonts.load("100px PVBrush"), new Promise(r=>setTimeout(r,400))]).then(start); } catch(e){ start(); }
};

PV.intro = (ov, close) => {
  const wc = $('#wc', ov);
  const g = PV.GUIDES[0]; // the first robot to appear always wears the red ao dai
  const HL = [
    ['🧭','Du lịch tự túc','Tự khám phá TP.HCM với bản đồ và lịch trình của riêng bạn.'],
    ['🎯','Gợi ý đúng gu','Địa điểm phù hợp sở thích và kinh phí cá nhân.'],
    ['🎧','Thuyết minh tận nơi','Kể ý nghĩa, giá trị lịch sử – văn hóa của từng điểm tham quan.'],
    ['🤖','Chatbot đồng hành','Hỏi đường, gợi ý quán ăn, lên lịch trình nhanh.']
  ];
  const box = document.createElement('div'); box.className='ob'; wc.replaceWith(box);
  const drawSlide = () => {
    box.innerHTML = `<div class="ob-slide">
      <div class="botline">${PV.robot(g)}<div class="bubble"><span class="ob-hi">Xin chào! Mình là <b>${g.name}</b>, hướng dẫn viên của Personavel.</span><b>Personavel có gì?</b></div></div>
      <div class="ob-hl">${HL.map(([e,t,d])=>`<div class="ob-hl-i"><span class="e">${e}</span><div><b>${t}</b><small>${d}</small></div></div>`).join('')}</div></div>
      <div class="row ob-foot"><span class="tiny muted ob-team">Nhóm 11A13 – THPT Lê Quý Đôn</span><span class="spacer"></span><button class="btn" id="sn">Bắt đầu ✨</button></div>`;
    box.classList.remove('ob-in'); void box.offsetWidth; box.classList.add('ob-in');
    $('#sn',box).onclick = (e) => { e.stopPropagation(); askName(); };
  };
  const askName = () => {
    box.innerHTML = `<div class="botline">${PV.robot(g)}<div class="bubble">Mình nên gọi bạn là gì?</div></div>
      <form id="nf" class="row"><input class="input" id="nm" placeholder="Tên hoặc biệt danh của bạn" style="flex:1" maxlength="30" autocomplete="name"><button class="btn">Xác nhận</button></form>
      <label class="row tiny muted" style="margin-top:8px"><input type="checkbox" id="rem" checked> Ghi nhớ tên cho lần truy cập sau</label>
      ${(()=>{ const accs=PV.accounts(); const ks=Object.keys(accs); return ks.length ? `<div style="margin-top:16px;padding-top:12px;border-top:1px dashed var(--line)"><b class="small">Hoặc tiếp tục với tài khoản đã lưu trên máy này</b><div class="grid" style="gap:8px;margin-top:8px">${ks.map(k=>`<div class="pitem" style="align-items:center"><div class="avatar" style="width:36px;height:36px;font-size:15px;border-width:2px">${PV.safeImg(accs[k].avatar)?`<img src="${esc(PV.safeImg(accs[k].avatar))}" alt="">`:esc(accs[k].name[0].toUpperCase())}</div><div style="flex:1;min-width:0"><b>${esc(accs[k].name)}</b><div class="tiny muted">${esc(accs[k].persona||'')}${accs[k].persona?' · ':''}lưu lúc ${esc(accs[k].savedAt)}</div></div><button class="btn sm" data-acc="${k}">Tiếp tục</button></div>`).join('')}</div></div>` : ''; })()}`;
    $('#nm',box).focus();
    $$('[data-acc]',box).forEach(bt => bt.onclick = (e) => { e.stopPropagation(); PV.login(bt.dataset.acc); close(); location.hash='#home'; PV.route(); PV.toast('Chào mừng '+state.profile.name+' quay lại!'); });
    $('#nf',box).onsubmit = (e) => { e.preventDefault(); const name = $('#nm',box).value.trim() || PV.L('Du khách','Traveller');
      state.profile = Object.assign(state.profile||{}, {name, joined: state.profile?.joined || new Date().toLocaleDateString('vi-VN')});
      if ($('#rem',box).checked) PV.save('profile'); quizIntro(name); };
  };
  const quizIntro = (name) => {
    box.innerHTML = `<div class="botline">${PV.robot(g)}<div class="bubble">Chào <b>${esc(name||state.profile.name)}</b>! Trả lời vài câu nhanh để mình gợi ý địa điểm hợp sở thích và kinh phí của bạn nhé.</div></div>
      <div class="row"><button class="btn ghost" id="qlater">Để sau</button><span class="spacer"></span><button class="btn" id="qstart">Bắt đầu</button></div>`;
    $('#qstart',box).onclick = (e)=>{ e.stopPropagation(); quiz(); };
    $('#qlater',box).onclick = (e)=>{ e.stopPropagation(); go(true); };
  };
  const quiz = () => { box.onclick = e => e.stopPropagation(); PV.runQuiz(box, ok => {
    if (ok){ const per = state.profile.persona;
      box.innerHTML = `<div class="botline">${PV.robot(g)}<div class="bubble">Tuyệt vời! Bạn thuộc tuýp <b>${per.e} ${esc(per.name)}</b>.<br><span class="small">${esc(per.d)}</span><br>Nào, cùng bắt đầu hành trình của riêng bạn nhé!</div></div><div class="row"><span class="spacer"></span><button class="btn" id="fin">Bắt đầu hành trình ✨</button></div>`;
      $('#fin',box).onclick = (e)=>{ e.stopPropagation(); go(true); };
    } else go(true); }); };
  const go = (isNew) => { state.profile.onboarded = true; PV.save('profile'); close(); location.hash = '#home'; PV.route(); if (isNew) setTimeout(PV.greetNew, 600); };
  const finish = (isNew) => {
    box.innerHTML = `<div class="botline">${PV.robot(g)}<div class="bubble">Tuyệt vời! Hành trình khám phá TP.HCM của bạn đã sẵn sàng. Cùng Personavel bắt đầu nhé!</div></div><div class="row"><span class="spacer"></span><button class="btn" id="go">Khám phá ngay</button></div>`;
    $('#go',box).onclick = (e) => { e.stopPropagation(); state.profile.onboarded = true; PV.save('profile'); close(); location.hash = '#home'; PV.route(); if (isNew) setTimeout(PV.greetNew, 600); };
  };
  drawSlide();
};

/* guided tour for new users (6.5) */
PV.tour = () => {
  const mobile = innerWidth <= 820;
  const steps = [
    ['map','Bản đồ khám phá','Tìm địa điểm, xem thông tin, hình ảnh, giá vé, giờ hoạt động và câu chuyện lịch sử của từng nơi, từng con đường.'],
    ['trip','Lịch trình của tôi','Chọn địa điểm, thêm vào lịch trình và sắp xếp chuyến đi. Điểm đến hiện trực tiếp trên bản đồ.'],
    ['collection','Bộ sưu tập Sài Gòn','Nơi lưu giữ dấu mộc của những địa điểm bạn đã khám phá và các huy hiệu thú vị.'],
    ['profile','Trang cá nhân','Xem thông tin, điểm tích lũy, nhật ký hành trình và kết quả phân tích phong cách du lịch.'],
    ['chat','Chatbot hướng dẫn','Đặt câu hỏi, nhờ gợi ý địa điểm và xây dựng lịch trình cùng hướng dẫn viên robot.']
  ];
  let i = 0; const hole = document.createElement('div'); hole.className='tour-hole'; const tip = document.createElement('div'); tip.className='tour-tip';
  document.body.append(hole, tip);
  const end = () => { hole.remove(); tip.remove(); PV.store.set('toured', true); };
  const draw = () => {
    const [k,t,d] = steps[i];
    const el = mobile ? $(`.bottom a[data-k="${k}"]`) : $(`#nav-${k}`);
    if (!el){ i++; if (i<steps.length) draw(); else end(); return; }
    const r = el.getBoundingClientRect();
    Object.assign(hole.style, {left:r.left-6+'px', top:r.top-6+'px', width:r.width+12+'px', height:r.height+12+'px'});
    tip.innerHTML = `<div class="row" style="align-items:flex-start;flex-wrap:nowrap">${PV.robot(PV.GUIDES[0],{wave:false}).replace('<svg','<svg style="width:46px;flex:0 0 46px"')}<div><b>${t}</b><p class="small" style="margin:4px 0 10px">${d}</p></div></div>
      <div class="row"><span class="tiny muted">${i+1}/${steps.length}</span><span class="spacer"></span><button class="btn ghost sm" id="tskip">Bỏ qua</button><button class="btn sm" id="tnext">${i<steps.length-1?'Tiếp tục':'Hoàn tất'}</button></div>`;
    const tw = Math.min(340, innerWidth*.9);
    if (mobile) Object.assign(tip.style, {left:Math.max(8, Math.min(innerWidth-tw-8, r.left + r.width/2 - tw/2))+'px', top:'', bottom:(innerHeight - r.top + 14)+'px'});
    else Object.assign(tip.style, {left:r.right+18+'px', top:Math.max(10, r.top-20)+'px', bottom:''});
    $('#tskip',tip).onclick = end; $('#tnext',tip).onclick = () => { i++; i<steps.length ? draw() : end(); };
  };
  draw();
};

/* ---------- init ---------- */
/* first visit: ask which language to use before anything else */
PV.langGate = (next) => {
  if (state.settings.langChosen){ next(); return; }
  const g = PV.GUIDES[0];
  const ov = document.createElement('div'); ov.className = 'overlay langgate'; ov.id = 'langgate';
  ov.innerHTML = `${[[8,40,90,26],[22,70,140,34],[60,20,110,28],[75,82,160,40]].map(([t,dl,w,h],i)=>`<div class="cloud" style="top:${t}vh;width:${w}px;height:${h}px;animation-delay:-${dl/4}s;animation-duration:${26+i*6}s"></div>`).join('')}<div class="lg-card">
      <div class="lg-bot">${PV.robot(g)}</div>
      <h2>Xin chào! <span>Hello!</span></h2>
      <p>Bạn muốn dùng ngôn ngữ nào?<br><span>Which language would you like to use?</span></p>
      <div class="lg-opts">
        <button class="lg-opt" data-l="vi"><svg class="flag" viewBox="0 0 30 20"><rect width="30" height="20" rx="3" fill="#DA251D"/><path d="M15 4.2l1.35 4.15h4.36l-3.53 2.56 1.35 4.15L15 12.5l-3.53 2.56 1.35-4.15-3.53-2.56h4.36z" fill="#FFCD00"/></svg><strong>Tiếng Việt</strong><small>Vietnamese</small></button>
        <button class="lg-opt" data-l="en"><svg class="flag" viewBox="0 0 60 40"><clipPath id="lgc"><rect width="60" height="40" rx="6"/></clipPath><g clip-path="url(#lgc)"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="7"/></g></svg><strong>English</strong><small>Tiếng Anh</small></button>
      </div>
      <small class="lg-note">Bạn có thể đổi lại bất cứ lúc nào trong Cài đặt · You can change this anytime in Settings</small>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelectorAll('.lg-opt').forEach(b => b.onclick = () => {
    state.settings.langChosen = true; PV._langJustChosen = true; PV.save('settings'); // vừa chọn ở màn trước → màn chào không hỏi lại
    if (PV.lang !== b.dataset.l) PV.setLang(b.dataset.l); else PV.save('settings');
    b.classList.add('picked'); ov.classList.add('out'); ov.style.pointerEvents = 'none';
    setTimeout(() => { ov.remove(); next(); }, 220);
  });
};
PV.splashDue = () => {
  let upd = false; try { upd = sessionStorage.getItem('pv_upd') === '1'; sessionStorage.removeItem('pv_upd'); } catch(e){}
  if (upd) return false;                                                                   // tự tải lại sau khi cập nhật phiên bản
  if (state.settings.splash === 'off') return false;
  if (/[?&](code|error|error_description|type)=/.test(location.search + location.hash)) return false;   // quay về từ Google / email
  return !/^#(reset-password|account)\b/.test(location.hash);
};
PV.init = () => {
  const boot = document.getElementById('boot'); if (boot) requestAnimationFrame(() => { boot.classList.add('out'); setTimeout(() => boot.remove(), 300); });   // static hero from index.html
  if (state.settings.apiKey || state.settings.model){ delete state.settings.apiKey; delete state.settings.model; PV.save('settings'); }   // never keep API keys in the browser
  document.body.classList.toggle('reduce', !!state.settings.reduce);
  PV.shell();
  PV.i18nInit();
  PV.route();
  const p = state.profile;
  if (!p || !p.onboarded){ // brand-new visitor (never picked a language yet): default white–blue; returning users keep their theme
    if (!state.settings.langChosen && state.settings.theme && state.settings.theme.id !== 'default'){ state.settings.theme = {id:'default'}; PV.save('settings'); PV.applyTheme && PV.applyTheme({id:'default'}); }
    PV.langGate(() => PV.welcome());
  }
  else if (PV.splashDue()) PV.welcome(false);
  // màn chào hiện MỖI LẦN vào lại web, ở bất kỳ trang nào (trình duyệt hay mở lại đúng trang đang xem dở như #chat, #trip);
  // bỏ qua khi: vừa đăng nhập / đặt lại mật khẩu, web tự tải lại để cập nhật bản mới, hoặc Cài đặt → tắt màn mở đầu
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', PV.init); else PV.init();
})();
