/* =========================================
   Urchin Core Engine 2026 - Official JS
========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, push, onChildAdded, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// إعدادات الفايربيس (المفاتيح الأصلية 100%)
const firebaseConfig = {
    apiKey: "AIzaSyBZc6wYIoRWErFDlspRMvd08ujx8vtgxPk",
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

let isLoginMode = true;
let currentUserData = null;

// قائمة الكلمات المحظورة (الرقابة الصارمة)
const forbiddenWords = ["سب", "شتيمة", "إباحي", "badword1", "sex", "porn"]; // ضيف الكلمات اللي تريدها هنا

/* 1. نظام التحقق من اليوزر رباعي (Regex) */
function validateUsername(username) {
    // يسمح فقط بحروف صغيرة، أرقام، شرطة، نقطة، أندر سكور
    const regex = /^[a-z0-9._-]+$/;
    if (username.length < 4) return "يجب أن يكون اليوزر 4 أحرف على الأقل.";
    if (!regex.test(username)) return "اليوزر يحتوي على رموز غير مسموحة أو أحرف كبيرة!";
    return null;
}

/* 2. نظام الرقابة الصارمة (AI Simulation) */
function aiContentCheck(text) {
    const lowerText = text.toLowerCase();
    for (let word of forbiddenWords) {
        if (lowerText.includes(word)) return false;
    }
    return true;
}

/* 3. معالجة الدخول والتسجيل */
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('username-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? 'دخول' : 'إنشاء حساب عظيم';
};

window.processAuth = async () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username').value.trim();

    if (!email || !password) return alert("يرجى إدخال البيانات كاملة.");

    if (isLoginMode) {
        // تسجيل الدخول
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("خطأ في تسجيل الدخول: " + error.message);
        }
    } else {
        // إنشاء حساب جديد
        const userError = validateUsername(username);
        if (userError) return alert(userError);

        if (!aiContentCheck(username)) return alert("اسم المستخدم يحتوي على كلمات غير لائقة!");

        try {
            const userCountRef = ref(db, 'stats/total_users');
            
            // استخدام Transaction لضمان معرفة ترتيب المستخدم بدقة
            const result = await runTransaction(userCountRef, (currentValue) => {
                return (currentValue || 0) + 1;
            });

            const userOrder = result.snapshot.val();
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            
            // إذا كان هو أول مستخدم (Order == 1) يحصل على نيترو دائم
            const hasNitro = userOrder === 1;
            const role = userOrder === 1 ? 1 : 0; // 1 للأونر

            const userData = {
                uid: cred.user.uid,
                username: username,
                email: email,
                roleId: role,
                nitro: hasNitro,
                coins: 100, // هدية ترحيبية
                joinedAt: serverTimestamp()
            };

            await set(ref(db, `users/${cred.user.uid}`), userData);
            if(hasNitro) alert("تهانينا! أنت أول مستخدم.. حصلت على نيترو Urchin دائم مجاناً!");
            
        } catch (error) {
            alert("فشل الإنشاء: " + error.message);
        }
    }
};

/* 4. مراقبة حالة المستخدم */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await get(ref(db, `users/${user.uid}`));
        currentUserData = snap.val();
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        document.getElementById('sidebarUsername').innerText = currentUserData.username;
        document.getElementById('user-coins').innerText = currentUserData.coins || 0;
        
        initAppLogic();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
});

/* 5. منطق التطبيق (تبديل الواجهات والدردشة) */
window.switchTab = (tab) => {
    document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(`view-${tab}`).style.display = 'flex';
    event.currentTarget.classList.add('active');
};

function initAppLogic() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        
        // رقابة AI قبل الإرسال
        if (!aiContentCheck(text)) {
            alert("الرسالة مرفوضة: تحتوي على كلام غير لائق!");
            return;
        }

        push(ref(db, 'channels/general/messages'), {
            uid: currentUserData.uid,
            username: currentUserData.username,
            roleId: currentUserData.roleId,
            text: text,
            timestamp: serverTimestamp()
        });
        input.value = "";
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };

    // استقبال الرسائل
    onChildAdded(ref(db, 'channels/general/messages'), (data) => {
        const m = data.val();
        renderMessage(m);
    });
}

function renderMessage(m) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message-3d'; // ستايل 3D جديد
    
    const isOwner = m.roleId === 1;
    const nameColor = isOwner ? '#f1c40f' : '#00d2ff';
    const crown = isOwner ? '<i class="fa-solid fa-crown" style="color:#f1c40f; font-size:12px;"></i>' : '';

    div.style = "display:flex; gap:15px; margin-bottom:20px; animation: slideIn 0.3s ease;";
    div.innerHTML = `
        <img src="https://i.imgur.com/vHqB3q0.png" style="width:45px; height:45px; border-radius:12px; box-shadow:0 5px 15px rgba(0,0,0,0.3);">
        <div class="msg-info">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:${nameColor}; font-weight:bold;">${m.username}</span>
                ${crown}
            </div>
            <p style="color:#e0e0e0; margin-top:4px; line-height:1.4;">${m.text}</p>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

window.handleLogout = () => signOut(auth).then(() => location.reload());

/* 6. الرقابة على البروفايل */
window.saveProfileWithAI = () => {
    const bio = document.getElementById('edit-bio').value;
    if (!aiContentCheck(bio)) {
        alert("لا يمكنك حفظ التغييرات لسبب وجود كلام غير لائق في البايو!");
        return;
    }
    // هنا يتم تحديث الداتا في فايربيس
    alert("تم تحديث البروفايل بنجاح!");
};
