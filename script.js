/**
 * Urchin Core Engine - 2026 Edition
 * Architecture: Mobile-First PWA, Real-time Firebase Sync
 * Coded for Maximum Performance & Realistic UI/UX
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, push, onChildAdded, onChildChanged, onChildRemoved, runTransaction, serverTimestamp, onValue, onDisconnect, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// إعدادات الفايربيس (Core Config)
const firebaseConfig = {
    databaseURL: "https://wano-studio-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// State Management
let currentUser = null;
let userData = null;
let typingTimeout = null;

// --- 1. نظام دعم اللغات الشامل (Internationalization) ---
const userLang = navigator.language.slice(0, 2);
const i18n = {
    'ar': { login: "دخول إلى Urchin", sub: "تواصل. بلا حدود.", input: "اكتب رسالة في #general...", online: "متصل", offline: "غير متصل", typing: "يكتب الآن..." },
    'en': { login: "Login to Urchin", sub: "Connect. Beyond Limits.", input: "Message #general...", online: "Online", offline: "Offline", typing: "is typing..." },
    'fr': { login: "Connexion Urchin", sub: "Connectez. Sans Limites.", input: "Message #general...", online: "En ligne", offline: "Hors ligne", typing: "écrit..." },
    'de': { login: "Anmeldung Urchin", sub: "Verbinden. Ohne Grenzen.", input: "Nachricht #general...", online: "Online", offline: "Offline", typing: "schreibt..." }
};

// تحديد اللغة (إذا ما لقى اللغة يختار الإنجليزي كافتراضي)
const lang = i18n[userLang] ? userLang : 'en';

// تطبيق الترجمة على واجهة الدخول
document.getElementById('loginBtn').innerHTML = `<i class="fa-brands fa-google"></i> ${i18n[lang].login}`;
document.getElementById('auth-subtitle').innerText = i18n[lang].sub;
document.getElementById('messageInput').placeholder = i18n[lang].input;

// --- 2. نظام الاهتزاز للموبايل (Haptic Feedback) ---
function triggerHaptic(type = 'light') {
    if (navigator.vibrate) {
        if (type === 'light') navigator.vibrate(50);
        if (type === 'heavy') navigator.vibrate([100, 50, 100]);
    }
}

// --- 3. نظام عجلة حظ النيترو (Nitro Gacha System) ---
function calculateNitroExpiry() {
    const chance = Math.random() * 100;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    
    // 70% أسبوع | 20% أسبوعين | 10% شهر
    if (chance <= 70) return now + (7 * DAY);
    if (chance <= 90) return now + (14 * DAY);
    return now + (30 * DAY);
}

// --- 4. إدارة حالة الاتصال (Presence System) ---
function setupPresence(uid) {
    const userStatusRef = ref(db, `/status/${uid}`);
    const connectedRef = ref(db, ".info/connected");

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            const isOnlineForDatabase = { state: 'online', last_changed: serverTimestamp() };
            const isOfflineForDatabase = { state: 'offline', last_changed: serverTimestamp() };

            onDisconnect(userStatusRef).set(isOfflineForDatabase).then(() => {
                set(userStatusRef, isOnlineForDatabase);
            });
        }
    });
}

// --- 5. نظام تسجيل الدخول وتوزيع البادجات والرتب (Role IDs) ---
document.getElementById('loginBtn').onclick = () => {
    triggerHaptic('heavy');
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => console.error("Login Error:", err));
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'flex';
        }, 500);
        
        document.getElementById('currentUserAvatar').src = user.photoURL;
        
        await initializeUserAccount(user);
        setupPresence(user.uid);
        initChatSystem();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('auth-screen').style.opacity = '1';
        document.getElementById('app-screen').style.display = 'none';
    }
});

async function initializeUserAccount(user) {
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);

    if (!snap.exists()) {
        // نظام التسجيل الدقيق (Transaction) لتحديد الأوائل
        const countRef = ref(db, 'app_stats/total_users');
        const result = await runTransaction(countRef, (currentCount) => (currentCount || 0) + 1);
        const sequence = result.snapshot.val();
        
        let badges = ["badge-nitro"]; // النيترو هدية للكل
        let roleId = 0; // 0 = Member (Default)

        // توزيع بادجات التأسيس والرتب باستخدام ID
        if (sequence === 1) { 
            badges.push("badge-1", "badge-admin"); 
            roleId = 1; // 1 = Admin
        } else if (sequence === 2) { 
            badges.push("badge-2"); 
        } else if (sequence === 3) { 
            badges.push("badge-3"); 
        }

        userData = {
            uid: user.uid,
            name: user.displayName,
            photo: user.photoURL,
            roleId: roleId,
            badges: badges,
            nitroExpiry: calculateNitroExpiry(),
            joinSequence: sequence,
            createdAt: serverTimestamp()
        };
        await set(userRef, userData);
    } else {
        userData = snap.val();
        
        // فحص انتهاء النيترو وتجديده بالحظ إذا انتهى
        if (userData.nitroExpiry && Date.now() > userData.nitroExpiry) {
            userData.nitroExpiry = calculateNitroExpiry();
            await set(ref(db, `users/${user.uid}/nitroExpiry`), userData.nitroExpiry);
        }
    }
}

// --- 6. نظام الدردشة المتقدم (Chat & Typing Indicators) ---
function initChatSystem() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // إرسال الرسالة
    const handleSend = async () => {
        const text = input.value.trim();
        if (!text) return;
        
        input.value = "";
        triggerHaptic('light');
        setTypingStatus(false);

        const msgData = {
            uid: currentUser.uid,
            name: userData.name,
            photo: userData.photo,
            roleId: userData.roleId,
            badges: userData.badges || [],
            text: text,
            timestamp: serverTimestamp()
        };
        
        await push(ref(db, 'channels/general/messages'), msgData);
    };

    sendBtn.onclick = handleSend;
    input.onkeypress = (e) => {
        setTypingStatus(true);
        if (e.key === 'Enter') handleSend();
    };

    loadMessages();
    listenToTyping();
}

// رفع حالة "يكتب الآن" للفايربيس
function setTypingStatus(isTyping) {
    const typingRef = ref(db, `channels/general/typing/${currentUser.uid}`);
    if (isTyping) {
        set(typingRef, userData.name);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => set(typingRef, null), 2000);
    } else {
        set(typingRef, null);
    }
}

// الاستماع لمن يكتب
function listenToTyping() {
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.style.cssText = 'padding: 5px 15px; font-size: 12px; color: var(--primary-accent); display: none;';
    document.getElementById('chat-messages').after(typingIndicator);

    onValue(ref(db, 'channels/general/typing'), (snap) => {
        const typers = [];
        snap.forEach(child => {
            if (child.key !== currentUser.uid && child.val()) {
                typers.push(child.val());
            }
        });
        
        if (typers.length > 0) {
            typingIndicator.innerText = `${typers.join(', ')} ${i18n[lang].typing}`;
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    });
}

// تحميل الرسائل بكفاءة (Pagination)
function loadMessages() {
    const chatArea = document.getElementById('chat-messages');
    chatArea.innerHTML = ''; // تنظيف الشاشة

    // استدعاء آخر 50 رسالة فقط لتخفيف الحمل على الموبايل
    const recentMessagesQuery = query(ref(db, 'channels/general/messages'), limitToLast(50));
    
    onChildAdded(recentMessagesQuery, (data) => {
        const m = data.val();
        
        // بناء أيقونات البادجات
        let badgesHtml = '';
        m.badges?.forEach(b => {
            let icon = '';
            if (b === 'badge-1') icon = '<i class="fa-solid fa-crown" style="color:#000;"></i>';
            else if (b === 'badge-2') icon = '<i class="fa-solid fa-medal" style="color:#000;"></i>';
            else if (b === 'badge-3') icon = '<i class="fa-solid fa-star" style="color:#fff;"></i>';
            else if (b === 'badge-admin') icon = '<i class="fa-solid fa-shield-halved"></i>';
            else if (b === 'badge-nitro') icon = '<i class="fa-solid fa-gem"></i>';
            
            if(icon) badgesHtml += `<span class="badge ${b}">${icon}</span>`;
        });

        // تنسيق الوقت
        const msgTime = m.timestamp ? new Date(m.timestamp) : new Date();
        const timeStr = msgTime.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });

        // تمييز اسم الآدمن (roleId 1) بلون مختلف
        const nameColor = m.roleId === 1 ? 'color: var(--danger);' : '';

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerHTML = `
            <img src="${m.photo}" class="msg-avatar" loading="lazy">
            <div class="msg-content">
                <div class="msg-header">
                    <span class="msg-username" style="${nameColor}">${m.name}</span>
                    <div class="badges-container">${badgesHtml}</div>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-text">${escapeHTML(m.text)}</div>
            </div>
        `;
        
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight; // نزول تلقائي لآخر رسالة
    });
}

// حماية من ثغرات XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
