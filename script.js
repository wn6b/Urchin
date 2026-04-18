/**
 * Urchin Engine v3.0 - 2026 Ultimate Security Edition
 * Features: Geo-Blocking, Custom Email Auth, Urchin Warden AI (Auto-Mod)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getDatabase, 
    ref, set, get, push, onChildAdded, remove, update, serverTimestamp, query, limitToLast 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. إعدادات الفايربيس (يجب وضع المفاتيح من إعدادات مشروعك لحماية البيانات)
const firebaseConfig = {
  apiKey: "AIzaSyBZc6wYIoRWErfDLspRMvd08ujx8vtgxPk",
  authDomain: "wano-studio.firebaseapp.com",
  databaseURL: "https://wano-studio-default-rtdb.firebaseio.com",
  projectId: "wano-studio",
  storageBucket: "wano-studio.firebasestorage.app",
  messagingSenderId: "464709722674",
  appId: "1:464709722674:web:5393cdd4c00c033014122b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
let userData = null;

// ==========================================
// 2. نظام الحماية الجغرافية (Block Specific Regions)
// ==========================================
async function enforceGeoBlocking() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        // الكود IL يرمز للكيان، سيتم تدمير واجهة الموقع فوراً إذا طابق
        if (data.country_code === 'IL') {
            document.body.innerHTML = `<div style="color:red; text-align:center; margin-top:20vh; font-size:24px;">
                <b>Access Denied.</b><br>Urchin is blocked in your region.
            </div>`;
            throw new Error("Blocked Region");
        }
    } catch (e) {
        console.warn("Geo-check passed or failed to load API.");
    }
}
enforceGeoBlocking();

// ==========================================
// 3. نظام الذكاء الاصطناعي والمراقبة (Urchin Warden AI)
// ==========================================
const badWordsList = ["كلمة_سيئة1", "كلمة_سيئة2", "سب", "شتم", "nsfw_link"]; // ضف الكلمات هنا

class UrchinAI {
    static async scanMessage(text, uid) {
        let isClean = true;
        let lowerText = text.toLowerCase();

        for (let word of badWordsList) {
            if (lowerText.includes(word)) {
                isClean = false;
                break;
            }
        }

        if (!isClean) {
            // إعطاء ميوت لمدة 30 دقيقة (1800000 ملي ثانية)
            const muteTime = Date.now() + 1800000;
            await update(ref(db, `users/${uid}`), { mutedUntil: muteTime });
            
            // تنبيه المستخدم
            alert("⚠️ Urchin AI: تم رصد ألفاظ غير لائقة. تم إعطاؤك ميوت لمدة 30 دقيقة.");
            return false; // يمنع إرسال الرسالة
        }
        return true;
    }

    static checkMuteStatus() {
        if (userData && userData.mutedUntil && Date.now() < userData.mutedUntil) {
            const remaining = Math.ceil((userData.mutedUntil - Date.now()) / 60000);
            alert(`🔇 أنت في وضع الصامت (Mute). يتبقى: ${remaining} دقيقة.`);
            return true; // المستخدم معاقب
        }
        return false;
    }
}

// ==========================================
// 4. نظام تسجيل الدخول وإنشاء الحساب (Custom Auth)
// ==========================================

// دالة إنشاء حساب جديد
window.handleSignup = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // إرسال رسالة تحقق للجيميل
        await sendEmailVerification(user);
        alert("تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني (الجيميل) لتأكيد الحساب.");
        
        // حفظ البيانات في الفايربيس (النظام القديم للأوائل والبادجات يعمل هنا)
        await createDatabaseProfile(user, username);
        
    } catch (error) {
        alert("خطأ في الإنشاء: " + error.message);
    }
};

// دالة تسجيل الدخول للحسابات الموجودة
window.handleLogin = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            alert("يرجى تأكيد بريدك الإلكتروني أولاً!");
            auth.signOut();
            return;
        }
        console.log("تم تسجيل الدخول بنجاح.");
    } catch (error) {
        alert("البريد أو كلمة المرور غير صحيحة!");
    }
};

// دالة تسجيل الخروج
window.handleLogout = () => {
    signOut(auth).then(() => {
        window.location.reload();
    });
};

// مراقبة حالة المستخدم (هل هو مسجل دخول أم لا)
onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
        currentUser = user;
        const snapshot = await get(ref(db, `users/${user.uid}`));
        userData = snapshot.val();
        
        showAppScreen();
        initChatSystem();
    } else {
        showAuthScreen();
    }
});

// ==========================================
// 5. إنشاء الملف الشخصي وقاعدة البيانات (First User God Mode)
// ==========================================
async function createDatabaseProfile(user, rawUsername) {
    const countRef = ref(db, 'app_stats/total_users');
    let sequence = 1;
    
    // إحصاء عدد المستخدمين
    const snap = await get(countRef);
    if(snap.exists()) sequence = snap.val() + 1;
    await set(countRef, sequence);

    let roleId = 0;
    let badges = ["badge-nitro"];
    let finalUsername = rawUsername.replace(/\s+/g, '').toLowerCase();

    // أول شخص هو المالك المطلق
    if (sequence === 1) {
        roleId = 1;
        badges = ["badge-1", "badge-admin", "badge-owner", "badge-developer"];
    } else {
        // فرض يوزر رباعي للمستخدمين العاديين
        if (finalUsername.length < 4) {
            finalUsername += Math.floor(1000 + Math.random() * 9000);
        }
    }

    userData = {
        uid: user.uid,
        email: user.email,
        username: finalUsername,
        photoURL: "https://via.placeholder.com/150", // صورة افتراضية
        roleId: roleId,
        badges: badges,
        sequenceId: sequence,
        joinedAt: serverTimestamp(),
        mutedUntil: 0 // لا يوجد ميوت مبدئياً
    };

    await set(ref(db, `users/${user.uid}`), userData);
}

// ==========================================
// 6. محرك الدردشة والأداء العالي
// ==========================================
function initChatSystem() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatArea = document.getElementById('chat-messages');

    // إرسال الرسالة مع فحص الـ AI
    const attemptSendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        // 1. فحص إذا كان المستخدم معاقب (Muted)
        if (UrchinAI.checkMuteStatus()) return;

        // 2. فحص محتوى الرسالة عبر الـ AI
        const isClean = await UrchinAI.scanMessage(text, currentUser.uid);
        if (!isClean) {
            input.value = "";
            return; // الـ AI أوقف الرسالة
        }

        // 3. إرسال الرسالة لقاعدة البيانات
        const msgData = {
            uid: userData.uid,
            username: userData.username,
            photo: userData.photoURL,
            text: text,
            roleId: userData.roleId,
            badges: userData.badges,
            timestamp: serverTimestamp()
        };
        
        push(ref(db, 'channels/general/messages'), msgData);
        input.value = "";
    };

    sendBtn.onclick = attemptSendMessage;
    input.onkeypress = (e) => { if(e.key === 'Enter') attemptSendMessage(); };

    // تحميل آخر 100 رسالة فقط (Pagination) لمنع التعليق
    const messagesQuery = query(ref(db, 'channels/general/messages'), limitToLast(100));
    onChildAdded(messagesQuery, (data) => {
        renderMessage(data.val(), data.key);
    });
}

function renderMessage(msg, msgId) {
    const chatArea = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.id = `msg-${msgId}`;

    // تمييز المالك (الأونر)
    const nameStyle = msg.roleId === 1 ? 'color: #ff4757; font-weight: bold;' : '';
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';

    msgDiv.innerHTML = `
        <img src="${msg.photo}" class="msg-avatar">
        <div class="msg-content">
            <div class="msg-header">
                <span class="msg-username" style="${nameStyle}">${msg.username}</span>
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-text">${escapeHTML(msg.text)}</div>
        </div>
    `;
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ==========================================
// 7. إعدادات الواجهة والـ Settings (UI Handlers)
// ==========================================
function showAppScreen() {
    // هذه الدوال تفترض وجود العناصر في ملف الـ HTML
    if(document.getElementById('auth-screen')) document.getElementById('auth-screen').style.display = 'none';
    if(document.getElementById('app-screen')) document.getElementById('app-screen').style.display = 'flex';
}

function showAuthScreen() {
    if(document.getElementById('auth-screen')) document.getElementById('auth-screen').style.display = 'flex';
    if(document.getElementById('app-screen')) document.getElementById('app-screen').style.display = 'none';
}

// وظيفة لفتح قائمة الإعدادات (Settings)
window.toggleSettings = () => {
    const settingsPanel = document.getElementById('settings-panel');
    if(settingsPanel) {
        settingsPanel.classList.toggle('active');
    } else {
        console.log("جاري تطوير قائمة الإعدادات...");
    }
};

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}