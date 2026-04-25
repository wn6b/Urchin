// استيراد Firebase Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, push, child, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// إعدادات قاعدة البيانات الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyBZc6wYIoRWErFDlspRMvd08ujx8vtgxPk",
    authDomain: "wano-studio.firebaseapp.com",
    databaseURL: "https://wano-studio-default-rtdb.firebaseio.com",
    projectId: "wano-studio",
    storageBucket: "wano-studio.firebasestorage.app",
    messagingSenderId: "464709722674",
    appId: "1:464709722674:web:5393cdd4c00c033014122b"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ثوابت المالك (Owner)
const OWNER_EMAIL = "waylalyzydy51@gmail.com";
const COOLDOWN_42H = 42 * 60 * 60 * 1000;

// متغيرات الحالة (State)
let currentUser = null;
let currentProfile = null;
let activeServerId = null;
let activeChannelId = null;
let isMicOn = true;

// -----------------------------------------------------
// 1. نظام شاشة التحميل (Loading)
// -----------------------------------------------------
window.onload = () => {
    let progress = 0;
    const bar = document.getElementById('loading-progress');
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
            }, 500);
        }
        bar.style.width = `${progress}%`;
    }, 150);
};

// -----------------------------------------------------
// 2. نظام المصادقة (Auth)
// -----------------------------------------------------
let authMode = 'login';
window.switchAuthTab = (mode) => {
    authMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('auth-name').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-username-wrapper').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-submit-btn').innerText = mode === 'login' ? 'Sign In' : 'Sign Up';
    document.getElementById('auth-error').innerText = '';
};

// متابعة حالة تسجيل الدخول (تبقى مسجلة حتى لو خرج المستخدم وعاد بعد سنين)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const snapshot = await get(child(ref(db), `users/${user.uid}`));
        if (snapshot.exists()) {
            currentProfile = snapshot.val();
            updateLastSeen();
            setupRealtimeListeners();
            showApp();
        }
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
});

window.handleAuth = async () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const err = document.getElementById('auth-error');
    err.innerText = '';

    try {
        if (authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const name = document.getElementById('auth-name').value.trim();
            const username = document.getElementById('auth-username').value.trim().toLowerCase();
            
            if (!name || !username) return err.innerText = 'Fill all fields';
            if (username.length > 4) return err.innerText = 'Username max 4 chars';
            
            // تحقق من عدم تكرار اليوزر
            const usersSnap = await get(ref(db, 'users'));
            if (usersSnap.exists()) {
                const users = usersSnap.val();
                for (let key in users) {
                    if (users[key].username === username) {
                        return err.innerText = 'Username already taken!';
                    }
                }
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
            
            const newProfile = {
                uid: user.uid,
                email: email,
                displayName: name,
                username: username,
                bio: "",
                avatar: "",
                banner: "",
                isOwner: isOwner,
                isTri: false,
                lastUsernameChange: 0,
                joinedAt: Date.now(),
                lastSeen: Date.now()
            };
            
            await set(ref(db, `users/${user.uid}`), newProfile);
        }
    } catch (error) {
        err.innerText = error.message;
    }
};

window.logout = () => { signOut(auth); location.reload(); };

function updateLastSeen() {
    if(currentUser) update(ref(db, `users/${currentUser.uid}`), { lastSeen: Date.now() });
}
setInterval(updateLastSeen, 60000); // تحديث كل دقيقة

// -----------------------------------------------------
// 3. واجهة المستخدم والتنقل (UI & Navigation)
// -----------------------------------------------------
function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    
    // إظهار أزرار المالك
    if (currentProfile.isOwner) {
        document.getElementById('btn-add-tri').classList.remove('hidden');
        document.getElementById('btn-add-bot').classList.remove('hidden');
        document.getElementById('owner-bots-section').classList.remove('hidden');
    }

    // الشارات (Badges)
    let badges = '';
    if(currentProfile.isOwner) badges += '<span class="badge-owner">OWNER 👑</span>';
    if(currentProfile.isTri) badges += '<span class="badge-tri">TRI ⭐</span>';
    document.getElementById('user-badges').innerHTML = badges;
    
    // الصورة المصغرة فوق
    document.getElementById('top-avatar').style.backgroundImage = `url(${currentProfile.avatar || 'https://via.placeholder.com/150/111623/5b8def?text='+currentProfile.displayName[0]})`;
    
    navTo('home');
}

window.navTo = (page) => {
    ['home', 'servers', 'settings'].forEach(p => document.getElementById(`page-${p}`).classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event && event.currentTarget ? event.currentTarget.classList.add('active') : null;

    if (page === 'settings') loadSettingsPage();
};

// -----------------------------------------------------
// 4. رفع الصور (Base64)
// -----------------------------------------------------
function handleImageUpload(inputId, callback) {
    const input = document.getElementById(inputId);
    input.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsDataURL(file);
        }
    });
}

// -----------------------------------------------------
// 5. الإعدادات وتغيير الملف الشخصي
// -----------------------------------------------------
function loadSettingsPage() {
    document.getElementById('set-displayname').value = currentProfile.displayName;
    document.getElementById('set-bio').value = currentProfile.bio || '';
    document.getElementById('set-username').value = currentProfile.username;
    
    document.getElementById('settings-display-name-text').innerText = currentProfile.displayName;
    document.getElementById('settings-username-text').innerText = '@' + currentProfile.username;
    
    if(currentProfile.avatar) document.getElementById('settings-avatar-img').src = currentProfile.avatar;
    if(currentProfile.banner) document.getElementById('settings-banner-img').src = currentProfile.banner;

    // حساب وقت الكول داون (42 ساعة)
    const timeSinceChange = Date.now() - (currentProfile.lastUsernameChange || 0);
    const timeRemaining = Math.max(0, COOLDOWN_42H - timeSinceChange);
    
    const unInput = document.getElementById('set-username');
    const timerText = document.getElementById('username-timer');
    
    if (timeRemaining > 0 && !currentProfile.isOwner) {
        unInput.disabled = true;
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        timerText.innerText = `Wait ${hours}h to change username again.`;
        timerText.classList.remove('hidden');
    } else {
        unInput.disabled = false;
        timerText.classList.add('hidden');
    }
}

// تفعيل رفع صورة البروفايل والبنر (واجهة الإعدادات)
let tempAvatar = null, tempBanner = null;
handleImageUpload('file-avatar', (base64) => { tempAvatar = base64; document.getElementById('settings-avatar-img').src = base64; });
handleImageUpload('file-banner', (base64) => { tempBanner = base64; document.getElementById('settings-banner-img').src = base64; });

window.saveSettings = async () => {
    const newName = document.getElementById('set-displayname').value.trim();
    const newBio = document.getElementById('set-bio').value.trim();
    let newUsername = document.getElementById('set-username').value.trim().toLowerCase();

    if(!newName) return alert("Name required");

    let updates = { displayName: newName, bio: newBio };
    if (tempAvatar) updates.avatar = tempAvatar;
    if (tempBanner) updates.banner = tempBanner;

    // تغيير اليوزر
    if (newUsername !== currentProfile.username && (!document.getElementById('set-username').disabled)) {
        if(newUsername.length > 4 && !currentProfile.isOwner) return alert("Max 4 chars");
        
        // فحص التكرار
        const usersSnap = await get(ref(db, 'users'));
        let taken = false;
        if(usersSnap.exists()){
            Object.values(usersSnap.val()).forEach(u => {
                if(u.username === newUsername && u.uid !== currentProfile.uid) taken = true;
            });
        }
        if(taken) return alert("Username taken!");
        
        updates.username = newUsername;
        updates.lastUsernameChange = Date.now();
    }

    await update(ref(db, `users/${currentProfile.uid}`), updates);
    currentProfile = { ...currentProfile, ...updates }; // Update local
    alert("Profile Updated Successfully!");
    loadSettingsPage();
};

// -----------------------------------------------------
// 6. حصريات المالك (Tri Users & Bots)
// -----------------------------------------------------
window.submitTriUser = async () => {
    if(!currentProfile.isOwner) return;
    const email = document.getElementById('tri-email').value;
    const pass = document.getElementById('tri-pass').value;
    const username = document.getElementById('tri-username').value.toLowerCase();
    
    if(username.length !== 3) return alert("Tri username must be exactly 3 chars!");
    
    try {
        // إنشاء الحساب (يتطلب استخدام API واجهة خلفية عادة لإنشاء حساب بدون تسجيل الخروج، لكن للتبسيط في الواجهة سنقوم بحفظ بياناته ليقوم المالك بتسليمه)
        alert("Due to Firebase Auth security, the Owner must create this account via Firebase Console and set the username manually in DB, OR use Admin SDK. In standard client JS, creating a user logs you out.");
    } catch(e) { alert(e.message); }
};

let tempBotAvatar = null;
handleImageUpload('bot-avatar', (base64) => { tempBotAvatar = base64; document.getElementById('bot-avatar-preview').src = base64; });

window.submitBot = async () => {
    if(!currentProfile.isOwner) return;
    const name = document.getElementById('bot-name').value.trim();
    const bio = document.getElementById('bot-bio').value.trim();
    if(!name) return alert("Bot name required");

    const botId = "bot_" + Date.now();
    const token = "urchin_bot_" + Math.random().toString(36).substr(2) + Date.now().toString(36);
    
    const botData = {
        id: botId, name, bio, avatar: tempBotAvatar || "", token,
        createdAt: Date.now()
    };
    
    await set(ref(db, `bots/${botId}`), botData);
    closeModal();
    alert("Bot Created!");
};

// -----------------------------------------------------
// 7. نظام السيرفرات والغرف الصوتية والشات الكامل
// -----------------------------------------------------
window.submitCreateServer = async () => {
    const name = document.getElementById('cs-name').value;
    const icon = document.getElementById('cs-icon').value || '🌐';
    if(!name) return;

    const serverId = "srv_" + Date.now();
    const defaultChannelId = "ch_" + Date.now();
    const voiceChannelId = "vc_" + Date.now();

    const newServer = {
        id: serverId, name, icon, ownerId: currentProfile.uid,
        channels: {
            [defaultChannelId]: { name: 'general', type: 'text' },
            [voiceChannelId]: { name: 'Voice Lounge', type: 'voice' }
        },
        members: { [currentProfile.uid]: { role: 'owner' } }
    };

    await set(ref(db, `servers/${serverId}`), newServer);
    closeModal();
};

window.openServer = (sid) => {
    activeServerId = sid;
    document.querySelectorAll('.server-icon').forEach(el => el.classList.remove('active'));
    document.getElementById('srv-icon-'+sid).classList.add('active');
    
    // جلب القنوات
    onValue(ref(db, `servers/${sid}`), (snap) => {
        const srv = snap.val();
        if(!srv) return;
        
        document.getElementById('server-channels').classList.remove('hidden');
        document.getElementById('active-server-header').innerHTML = `<h3>${srv.icon} ${srv.name}</h3><p class="text-small text-muted">Click for Settings</p>`;
        
        let chHtml = '';
        for(let cid in srv.channels) {
            const ch = srv.channels[cid];
            const icon = ch.type === 'voice' ? '🎙️' : '#';
            chHtml += `<div class="channel-item flex-row items-center gap-5" onclick="joinChannel('${cid}', '${ch.type}', '${ch.name}')">${icon} ${ch.name}</div>`;
        }
        document.getElementById('channels-list').innerHTML = chHtml;
    });
};

window.joinChannel = (cid, type, name) => {
    if(type === 'voice') {
        document.getElementById('voice-controls').classList.remove('hidden');
        // هنا يتم دمج WebRTC الحقيقي مستقبلاً. حالياً واجهة مرئية محاكية للواقع:
        isMicOn = true;
        updateMicUI();
    } else {
        activeChannelId = cid;
        document.getElementById('server-channels').classList.add('hidden'); // إخفاء القائمة
        document.getElementById('chat-area').classList.remove('hidden'); // عرض شاشة كاملة
        document.getElementById('bottom-nav').classList.add('hidden'); // إخفاء الناف بار
        document.getElementById('back-btn').classList.remove('hidden');
        
        document.getElementById('chat-header').innerHTML = `<h3># ${name}</h3>`;
        loadChatMessages();
    }
};

window.exitFullScreenChat = () => {
    activeChannelId = null;
    document.getElementById('chat-area').classList.add('hidden');
    document.getElementById('server-channels').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    document.getElementById('back-btn').classList.add('hidden');
};

window.sendMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text || !activeServerId || !activeChannelId) return;

    await push(ref(db, `servers/${activeServerId}/messages/${activeChannelId}`), {
        uid: currentProfile.uid,
        text: text,
        timestamp: Date.now()
    });
    input.value = '';
};

function loadChatMessages() {
    const messagesRef = ref(db, `servers/${activeServerId}/messages/${activeChannelId}`);
    onValue(messagesRef, (snap) => {
        const msgs = snap.val();
        let html = '';
        if(msgs) {
            Object.values(msgs).forEach(m => {
                const mine = m.uid === currentProfile.uid;
                html += `
                <div class="flex-col ${mine ? 'items-end' : 'items-start'}">
                    <div style="background:${mine?'var(--accent)':'var(--bg-secondary)'}; padding:10px 14px; border-radius:12px; max-width:80%;">
                        <p class="text-small bold mb-5 ${mine?'hidden':''}">${m.uid}</p>
                        <p>${m.text}</p>
                    </div>
                </div>`;
            });
        }
        document.getElementById('chat-messages').innerHTML = html;
        document.getElementById('chat-messages').scrollTop = 999999;
    });
}

// Voice Simulation
window.toggleMic = () => {
    isMicOn = !isMicOn;
    updateMicUI();
};
function updateMicUI() {
    const btn = document.getElementById('btn-mic');
    btn.innerHTML = isMicOn ? '🎙️ Mic On' : '🔇 Mic Off';
    btn.className = isMicOn ? 'btn-success flex-1' : 'btn-danger flex-1';
}
window.leaveVoice = () => { document.getElementById('voice-controls').classList.add('hidden'); };

// -----------------------------------------------------
// 8. المنشورات (Posts)
// -----------------------------------------------------
window.submitPost = async () => {
    const text = document.getElementById('post-text').value.trim();
    if(!text) return;
    await push(ref(db, 'posts'), { uid: currentProfile.uid, text, timestamp: Date.now() });
    document.getElementById('post-text').value = '';
    closeModal();
};

function setupRealtimeListeners() {
    // استماع المنشورات
    onValue(ref(db, 'posts'), async (snap) => {
        const posts = snap.val();
        if(!posts) return document.getElementById('posts-container').innerHTML = '<p class="text-center text-muted">No posts yet 🌊</p>';
        
        // نأتي بأسماء المستخدمين (في تطبيق حقيقي يتم حفظ الاسم مع البوست أو عمل Join)
        let html = '';
        const sorted = Object.entries(posts).sort((a,b)=>b[1].timestamp - a[1].timestamp);
        
        for(let [id, p] of sorted) {
            html += `
            <div class="post-card">
                <div class="flex-row items-center gap-10 mb-10">
                    <div class="avatar-small"></div>
                    <div>
                        <span class="bold">${p.uid === currentProfile.uid ? currentProfile.displayName : 'User'}</span>
                    </div>
                </div>
                <p>${p.text}</p>
            </div>`;
        }
        document.getElementById('posts-container').innerHTML = html;
    });

    // استماع السيرفرات
    onValue(ref(db, 'servers'), (snap) => {
        const servers = snap.val();
        let html = '';
        if(servers) {
            for(let sid in servers) {
                const s = servers[sid];
                // إظهار السيرفرات التي أنت عضو فيها فقط
                if(s.members && s.members[currentProfile.uid]) {
                    html += `<div id="srv-icon-${sid}" class="server-icon" onclick="openServer('${sid}')">${s.icon}</div>`;
                }
            }
        }
        document.getElementById('server-list').innerHTML = html;
    });
    
    // استماع البوتات (للمالك فقط)
    if(currentProfile.isOwner) {
        onValue(ref(db, 'bots'), (snap) => {
            const bots = snap.val();
            let html = '';
            if(bots) {
                for(let key in bots) {
                    const b = bots[key];
                    html += `
                    <div class="bot-item">
                        <div class="flex-row items-center gap-10">
                            <div class="avatar-small" style="background-image:url('${b.avatar}')"></div>
                            <div>
                                    <h4>${b.name} <span class="badge-bot">BOT</span></h4>
                                <p class="text-small text-muted">${b.bio}</p>
                            </div>
                        </div>
                        <div class="token-box">TOKEN: ${b.token}</div>
                        <div class="token-box text-accent border-none mt-5">Invite: https://urchin.app/bot/add/${b.id}</div>
                    </div>`;
                }
            }
            document.getElementById('bots-list').innerHTML = html;
        });
    }
}

// -----------------------------------------------------
// 9. إعدادات السيرفر (Server Settings)
// -----------------------------------------------------
let tempServerBanner = null;
handleImageUpload('ss-banner', (base64) => { 
    tempServerBanner = base64; 
    alert("تم اختيار بنر السيرفر بنجاح!"); 
});

window.openServerSettings = async () => {
    if(!activeServerId) return;
    const snap = await get(ref(db, `servers/${activeServerId}`));
    if(!snap.exists()) return;
    
    const srv = snap.val();
    
    // التحقق من الصلاحيات (فقط منشئ السيرفر يقدر يغير إعداداته)
    if(srv.ownerId !== currentProfile.uid) {
        return alert("عذراً، فقط مالك السيرفر يقدر يغير الإعدادات!");
    }
    
    document.getElementById('ss-name').value = srv.name || '';
    document.getElementById('ss-bio').value = srv.bio || '';
    openModal('modal-server-settings');
};

window.saveServerSettings = async () => {
    if(!activeServerId) return;
    const newName = document.getElementById('ss-name').value.trim();
    const newBio = document.getElementById('ss-bio').value.trim();
    
    if(!newName) return alert("اسم السيرفر مطلوب!");
    
    let updates = { name: newName, bio: newBio };
    if(tempServerBanner) updates.banner = tempServerBanner; // حفظ البنر كـ Base64
    
    await update(ref(db, `servers/${activeServerId}`), updates);
    alert("تم تحديث إعدادات السيرفر بنجاح!");
    closeModal();
};

// -----------------------------------------------------
// 10. النوافذ المنبثقة (Modals Helpers)
// -----------------------------------------------------
window.openModal = (id) => {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.querySelectorAll('.modal-box').forEach(m => m.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
};

window.closeModal = (e) => {
    // إغلاق النافذة فقط إذا ضغط المستخدم خارجها أو استدعينا الفنكشن بدون Event
    if(e && e.target.id !== 'modal-overlay') return;
    document.getElementById('modal-overlay').classList.add('hidden');
};
