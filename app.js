// ══════════════════════════════════════════════
//  OWNER CONFIG & STORAGE
// ══════════════════════════════════════════════
const OWNER_EMAIL = "waylalyzydy51@gmail.com";
const OWNER_PASS_HASH = "f2HgJv_E_yi_owner_urchin_2025"; 

const S = {
  get: (k, def = null) => { try { const v = localStorage.getItem("urchin_"+k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem("urchin_"+k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem("urchin_"+k); } catch {} },
};

const uid = () => Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const hashPass = (p) => { let h = 0; for(let i=0;i<p.length;i++) h=((h<<5)-h)+p.charCodeAt(i), h|=0; return h.toString(36)+"_urchin"; };

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let state = {
  users: S.get("users", {}),
  posts: S.get("posts", []),
  servers: S.get("servers", []),
  bots: S.get("bots", []),
  me: null,
  page: 'home',
  activeSid: null,
  activeChId: null
};

function saveState() {
  S.set("users", state.users);
  S.set("posts", state.posts);
  S.set("servers", state.servers);
  S.set("bots", state.bots);
}

// ══════════════════════════════════════════════
//  INIT & RENDER SYSTEM
// ══════════════════════════════════════════════
window.onload = () => {
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    const sid = S.get("session");
    if (sid && state.users[sid]) {
      state.me = state.users[sid];
      showApp();
    } else {
      showAuth();
    }
  }, 1000);
};

function showAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').innerHTML = `
    <div style="padding: 20px; text-align: center; margin-top: 50px;">
      <h1 style="color: var(--accent); margin-bottom: 30px; font-size: 36px;">Urchin</h1>
      <div style="background: var(--bg-secondary); padding: 20px; border-radius: 20px; border: 1px solid var(--border2);">
        <h2 style="margin-bottom: 20px; font-size: 18px;">Sign In or Register</h2>
        <input type="text" id="a-name" class="input-modern mb-10" placeholder="Display Name (For Register)" style="margin-bottom: 10px;">
        <input type="text" id="a-user" class="input-modern mb-10" placeholder="Username (Max 4 chars)" maxlength="4" style="margin-bottom: 10px;">
        <input type="email" id="a-email" class="input-modern mb-10" placeholder="Email" style="margin-bottom: 10px;">
        <input type="password" id="a-pass" class="input-modern mb-10" placeholder="Password" style="margin-bottom: 10px;">
        <button class="btn-primary w-full" onclick="handleAuth()" style="margin-bottom: 10px;">Login / Register</button>
      </div>
    </div>
  `;
}

window.handleAuth = () => {
  const email = document.getElementById('a-email').value.trim().toLowerCase();
  const pass = document.getElementById('a-pass').value;
  const user = document.getElementById('a-user').value.trim().toLowerCase();
  const name = document.getElementById('a-name').value.trim();

  if(!email || !pass) return alert("Email & Password required!");

  // Owner logic
  if(email === OWNER_EMAIL.toLowerCase()) {
    let owner = Object.values(state.users).find(u => u.email === email);
    if(!owner) {
      owner = { id: "owner_"+uid(), email, username: "wano", displayName: "Marwan", avatar: null, banner: null, passHash: hashPass(pass), isOwner: true, isTri: true, joinedAt: Date.now() };
      state.users[owner.id] = owner; saveState();
    }
    state.me = owner; S.set("session", owner.id); showApp(); return;
  }

  // Check login
  let existing = Object.values(state.users).find(u => u.email === email);
  if(existing) {
    if(existing.passHash !== hashPass(pass)) return alert("Wrong password");
    state.me = existing; S.set("session", existing.id); showApp(); return;
  }

  // Register
  if(!user || !name) return alert("Username and Name required for register!");
  if(user.length > 4) return alert("Username max 4 chars");
  if(Object.values(state.users).find(u => u.username === user)) return alert("Username taken");

  const newUser = { id: uid(), email, username: user, displayName: name, avatar: null, banner: null, passHash: hashPass(pass), isOwner: false, isTri: false, joinedAt: Date.now() };
  state.users[newUser.id] = newUser; saveState();
  state.me = newUser; S.set("session", newUser.id); showApp();
};

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderTopNav();
  renderBottomNav();
  navTo('home');
}

function navTo(page) {
  state.page = page;
  renderBottomNav();
  const main = document.getElementById('main-content');
  main.className = "flex-1 overflow-y relative fade"; // reset animation
  
  if(page === 'home') main.innerHTML = renderHome();
  if(page === 'servers') main.innerHTML = renderServers();
  if(page === 'settings') main.innerHTML = renderSettings();
}

// ══════════════════════════════════════════════
//  UI RENDERING
// ══════════════════════════════════════════════

function renderTopNav() {
  let ownerBtns = state.me.isOwner ? `
    <button class="btn-owner" onclick="openModal('bot')">🤖 Bot</button>
  ` : '';
  document.getElementById('top-bar').innerHTML = `
    <div style="font-weight:900; font-size:20px; color:var(--accent);">Urchin ${state.me.isOwner ? '<span style="font-size:10px;color:var(--warn)">OWNER</span>' : ''}</div>
    <div class="flex-row gap-10 items-center">
      ${ownerBtns}
      <div class="avatar" style="width:34px;height:34px;background-image:url('${state.me.avatar||''}');background-color:var(--accent);" onclick="navTo('settings')">${!state.me.avatar ? state.me.displayName[0] : ''}</div>
    </div>
  `;
}

function renderBottomNav() {
  const navs = [
    {id:'home', icon:'🏠', label:'Home'},
    {id:'servers', icon:'🌐', label:'Servers'},
    {id:'settings', icon:'⚙️', label:'Settings'}
  ];
  document.getElementById('bottom-nav').innerHTML = navs.map(n => `
    <button class="nav-btn ${state.page === n.id ? 'active' : ''}" onclick="navTo('${n.id}')">
      <span style="font-size:18px">${n.icon}</span> ${n.label}
    </button>
  `).join('');
}

function renderHome() {
  let html = `<div style="padding:16px;">`;
  html += `<button class="btn-primary" style="margin-bottom:20px" onclick="openModal('post')">📝 Write a Post</button>`;
  
  if(state.posts.length === 0) html += `<p style="text-align:center; color:var(--text-muted); margin-top:50px;">No posts yet!</p>`;
  
  state.posts.forEach(p => {
    const u = state.users[p.uid] || {displayName: "User", username: "user"};
    html += `
      <div style="background:var(--bg-secondary); border:1px solid var(--border2); border-radius:16px; padding:16px; margin-bottom:12px;">
        <div class="flex-row items-center gap-10" style="margin-bottom:10px">
          <div class="avatar" style="width:36px;height:36px;background-image:url('${u.avatar||''}');background-color:var(--accent);">${!u.avatar ? u.displayName[0] : ''}</div>
          <div>
            <div style="font-weight:bold; font-size:14px;">${u.displayName}</div>
            <div style="font-size:11px; color:var(--text-muted)">@${u.username}</div>
          </div>
        </div>
        <div style="font-size:14px; line-height:1.5;">${p.text}</div>
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════
//  SERVERS (With Image Upload instead of Emoji)
// ══════════════════════════════════════════════
function renderServers() {
  if(state.activeSid) return renderChat();

  let srvList = state.servers.map(s => `
    <div class="srv-icon" onclick="openServer('${s.id}')" style="margin-bottom:10px;">
      ${s.iconBase64 ? `<img src="${s.iconBase64}">` : `<span style="color:var(--accent); font-weight:bold">${s.name[0]}</span>`}
    </div>
  `).join('');

  return `
    <div class="servers-layout">
      <div class="srv-sidebar">
        ${srvList}
        <div class="srv-icon" style="background:var(--bg-tertiary); color:var(--accent);" onclick="openModal('createServer')">➕</div>
      </div>
      <div class="ch-sidebar flex-center" style="color:var(--text-muted)">
        <p>Select or create a server</p>
      </div>
    </div>
  `;
}

window.openServer = (sid) => { state.activeSid = sid; navTo('servers'); };
window.closeServer = () => { state.activeSid = null; navTo('servers'); };

function renderChat() {
  const srv = state.servers.find(s => s.id === state.activeSid);
  if(!srv) return '';
  return `
    <div class="flex-col h-full" style="height:100%;">
      <div class="top-bar flex-row items-center gap-10">
        <button class="btn-owner" style="border:none;background:var(--bg-hover);color:var(--text-primary)" onclick="closeServer()">🔙</button>
        <div class="avatar" style="width:30px;height:30px;background-image:url('${srv.iconBase64||''}');background-color:var(--accent);">${!srv.iconBase64 ? srv.name[0] : ''}</div>
        <div style="font-weight:bold">${srv.name}</div>
      </div>
      <div class="flex-1 overflow-y" style="padding:16px;">
        <p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:50px;">Welcome to the start of ${srv.name}!</p>
      </div>
      <div style="padding:10px; border-top:1px solid var(--border2); display:flex; gap:10px;">
        <input type="text" class="input-modern" placeholder="Message...">
        <button class="btn-primary" style="width:auto">Send</button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════
//  SETTINGS & PROFILE
// ══════════════════════════════════════════════
function renderSettings() {
  let botsHtml = '';
  if(state.me.isOwner) {
    botsHtml = `
      <div style="margin-top:30px; border-top:1px solid var(--border2); padding-top:20px;">
        <h3 style="color:var(--accent); margin-bottom:15px;">🤖 My Bots</h3>
        ${state.bots.map(b => `
          <div style="background:var(--bg-secondary); border:1px solid var(--border2); border-radius:12px; padding:15px; margin-bottom:10px;">
            <div class="flex-row items-center gap-10" style="margin-bottom:10px">
              <div class="avatar" style="width:40px;height:40px;background-image:url('${b.avatar||''}');background-color:var(--accent);"></div>
              <div>
                <div style="font-weight:bold">${b.name} <span style="background:var(--accent-dim);color:var(--accent);padding:2px 6px;border-radius:4px;font-size:10px;">BOT</span></div>
                <div style="font-size:11px;color:var(--text-muted)">${b.bio}</div>
              </div>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:5px;">Token (Keep Secret):</div>
            <div style="background:var(--bg-primary); padding:8px; border-radius:6px; font-family:monospace; font-size:10px; color:var(--warn); margin-bottom:10px;">${b.token}</div>
            
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:5px;">Official Invite Link:</div>
            <div style="background:var(--bg-primary); padding:8px; border-radius:6px; font-family:monospace; font-size:10px; color:var(--accent);">https://urchin.app/bot/add/${b.id}</div>
            
            <p style="font-size:10px; color:var(--success); margin-top:10px;">✅ يدعم أوامر السلاش (/) والبريفكس (!) ويعمل على أي استضافة.</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <div style="padding:16px;">
      
      <div style="position:relative; height:120px; border-radius:16px; background-image:url('${state.me.banner||''}'); background-color:var(--bg-hover); background-size:cover; background-position:center; cursor:pointer;" onclick="document.getElementById('in-banner').click()">
        <div class="flex-center" style="position:absolute; inset:0; background:rgba(0,0,0,0.4); color:#fff; font-size:12px; font-weight:bold; border-radius:16px;">📷 Change Banner</div>
      </div>
      <input type="file" id="in-banner" hidden accept="image/*" onchange="uploadImage(this, 'banner')">

      <div style="display:flex; align-items:center; gap:15px; margin-top:-20px; padding-left:15px;">
        <div style="position:relative; width:80px; height:80px; border-radius:50%; border:4px solid var(--bg-primary); background-image:url('${state.me.avatar||''}'); background-color:var(--accent); background-size:cover; cursor:pointer;" onclick="document.getElementById('in-avatar').click()">
           <div class="flex-center" style="position:absolute; inset:0; background:rgba(0,0,0,0.4); color:#fff; font-size:20px; border-radius:50%;">📷</div>
        </div>
        <input type="file" id="in-avatar" hidden accept="image/*" onchange="uploadImage(this, 'avatar')">
        <div style="margin-top:20px;">
          <h2 style="font-size:18px;">${state.me.displayName}</h2>
          <p style="font-size:12px; color:var(--text-muted)">@${state.me.username}</p>
        </div>
      </div>

      <div style="margin-top:30px;">
        <button class="btn-owner" style="width:100%; padding:12px; color:var(--danger); border-color:var(--danger); background:transparent;" onclick="logout()">Sign Out</button>
      </div>

      ${botsHtml}
    </div>
  `;
}

// ══════════════════════════════════════════════
//  IMAGE UPLOAD HANDLER (Base64)
// ══════════════════════════════════════════════
window.uploadImage = (input, type) => {
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    if(type === 'avatar' || type === 'banner') {
      state.me[type] = base64;
      state.users[state.me.id][type] = base64;
      saveState(); navTo('settings');
    } else if (type === 'botAvatar') {
      document.getElementById('bot-avatar-preview').style.backgroundImage = \`url('\${base64}')\`;
      document.getElementById('bot-avatar-preview').dataset.b64 = base64;
    } else if (type === 'srvIcon') {
      document.getElementById('srv-icon-preview').style.backgroundImage = \`url('\${base64}')\`;
      document.getElementById('srv-icon-preview').dataset.b64 = base64;
    }
  };
  reader.readAsDataURL(file);
};

// ══════════════════════════════════════════════
//  MODALS & ACTIONS
// ══════════════════════════════════════════════
window.openModal = (type) => {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  overlay.classList.remove('hidden');

  if(type === 'post') {
    content.innerHTML = `
      <h3 style="margin-bottom:15px;">New Post</h3>
      <textarea id="post-text" class="input-modern" rows="4" placeholder="What's happening?"></textarea>
      <div style="display:flex; gap:10px; margin-top:15px;">
        <button class="btn-primary" onclick="submitPost()">Post</button>
        <button class="btn-owner" style="flex:1; border:none; background:var(--bg-hover); color:var(--text-muted);" onclick="closeModal()">Cancel</button>
      </div>
    `;
  }
  else if(type === 'createServer') {
    content.innerHTML = `
      <h3 style="margin-bottom:15px;">Create Server</h3>
      
      <div style="display:flex; justify-content:center; margin-bottom:15px;">
        <div id="srv-icon-preview" style="width:80px; height:80px; border-radius:16px; background-color:var(--bg-hover); background-size:cover; background-position:center; cursor:pointer; border:2px dashed var(--border2);" onclick="document.getElementById('in-srv-icon').click()">
          <div class="flex-center" style="width:100%; height:100%; color:var(--text-muted); font-size:12px;">Upload Image</div>
        </div>
        <input type="file" id="in-srv-icon" hidden accept="image/*" onchange="uploadImage(this, 'srvIcon')">
      </div>

      <input type="text" id="srv-name" class="input-modern mb-10" placeholder="Server Name">
      <div style="display:flex; gap:10px; margin-top:15px;">
        <button class="btn-primary" onclick="submitServer()">Create</button>
        <button class="btn-owner" style="flex:1; border:none; background:var(--bg-hover); color:var(--text-muted);" onclick="closeModal()">Cancel</button>
      </div>
    `;
  }
  else if(type === 'bot') {
    content.innerHTML = `
      <h3 style="margin-bottom:15px; color:var(--accent);">🤖 Create Bot</h3>
      <div style="display:flex; justify-content:center; margin-bottom:15px;">
        <div id="bot-avatar-preview" style="width:60px; height:60px; border-radius:50%; background-color:var(--bg-hover); background-size:cover; cursor:pointer; border:2px dashed var(--border2);" onclick="document.getElementById('in-bot-avatar').click()"></div>
        <input type="file" id="in-bot-avatar" hidden accept="image/*" onchange="uploadImage(this, 'botAvatar')">
      </div>
      <input type="text" id="bot-name" class="input-modern mb-10" placeholder="Bot Name" style="margin-bottom:10px;">
      <input type="text" id="bot-bio" class="input-modern mb-10" placeholder="Bot Bio">
      <p style="font-size:10px; color:var(--text-muted); margin-top:10px;">Bot will get an official invite link and token.</p>
      <div style="display:flex; gap:10px; margin-top:15px;">
        <button class="btn-primary" onclick="submitBot()">Create Bot</button>
        <button class="btn-owner" style="flex:1; border:none; background:var(--bg-hover); color:var(--text-muted);" onclick="closeModal()">Cancel</button>
      </div>
    `;
  }
};

window.closeModal = () => document.getElementById('modal-overlay').classList.add('hidden');

window.submitPost = () => {
  const text = document.getElementById('post-text').value.trim();
  if(!text) return;
  state.posts.unshift({ id: uid(), uid: state.me.id, text, time: Date.now() });
  saveState(); closeModal(); navTo('home');
};

window.submitServer = () => {
  const name = document.getElementById('srv-name').value.trim();
  const iconBase64 = document.getElementById('srv-icon-preview').dataset.b64 || '';
  if(!name) return alert("Server name required");
  const srv = { id: uid(), name, iconBase64, ownerId: state.me.id };
  state.servers.push(srv);
  saveState(); closeModal(); navTo('servers');
};

window.submitBot = () => {
  const name = document.getElementById('bot-name').value.trim();
  const bio = document.getElementById('bot-bio').value.trim();
  const avatar = document.getElementById('bot-avatar-preview').dataset.b64 || '';
  if(!name) return alert("Bot name required");
  
  const botId = uid();
  const b = { id: botId, name, bio, avatar, token: "urchin_bot_"+uid()+"."+uid() };
  state.bots.push(b);
  saveState(); closeModal(); navTo('settings');
};

window.logout = () => { S.del("session"); location.reload(); };
