    <script type="module">
        // استيراد مكتبات فايربيس للإصدار 10
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
        import { getDatabase, ref, set, get, push, onChildAdded, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

        // إعدادات الفايربيس (رابط قاعدة البيانات الخاص بك)
        const firebaseConfig = {
            databaseURL: "https://wano-studio-default-rtdb.firebaseio.com",
            // ملاحظة: بمجرد ما تفعل Firebase Auth راح تحتاج تضيف الـ apiKey والـ projectId هنا مستقبلاً
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getDatabase(app);

        // متغيرات الجلسة
        let currentUser = null;
        let userData = null;

        // 1. نظام دعم اللغات (Internationalization)
        // يتعرف على لغة جهاز المستخدم تلقائياً
        const userLang = navigator.language.startsWith('ar') ? 'ar' : 'en';
        const i18n = {
            'ar': { 
                loginBtn: "تسجيل الدخول إلى Urchin", 
                subtitle: "تواصل. بلا حدود.", 
                placeholder: "اكتب رسالتك هنا..." 
            },
            'en': { 
                loginBtn: "Login to Urchin", 
                subtitle: "Connect. Beyond Limits.", 
                placeholder: "Message #general..." 
            }
        };

        // تطبيق اللغة على الواجهة
        document.querySelector('.btn-login').innerHTML = `<i class="fa-brands fa-google"></i> ${i18n[userLang].loginBtn}`;
        document.getElementById('auth-subtitle').innerText = i18n[userLang].subtitle;
        document.getElementById('messageInput').placeholder = i18n[userLang].placeholder;

        // 2. نظام سحب النيترو بالحظ (Gacha System)
        function rollNitroLuck() {
            const roll = Math.random() * 100; // سحب رقم عشوائي من 0 إلى 100
            const now = Date.now();
            let duration = 0;
            
            if (roll <= 70) {
                duration = 7 * 24 * 60 * 60 * 1000; // 70% - أسبوع
            } else if (roll <= 90) {
                duration = 14 * 24 * 60 * 60 * 1000; // 20% - أسبوعين
            } else {
                duration = 30 * 24 * 60 * 60 * 1000; // 10% - شهر
            }
            return now + duration;
        }

        // 3. دالة تسجيل الدخول
        window.startLogin = () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider).catch(error => {
                console.error("خطأ في تسجيل الدخول:", error);
            });
        };

        // مراقبة حالة المستخدم
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                // إخفاء شاشة تسجيل الدخول وإظهار التطبيق
                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('app-screen').style.display = 'flex';
                document.getElementById('currentUserAvatar').src = user.photoURL;
                
                await processUserRegistration(user);
                loadMessages();
            } else {
                // إرجاع المستخدم لشاشة تسجيل الدخول
                document.getElementById('auth-screen').style.display = 'flex';
                document.getElementById('app-screen').style.display = 'none';
            }
        });

        // 4. نظام تسجيل الحسابات وتوزيع البادجات
        async function processUserRegistration(user) {
            const userRef = ref(db, 'users/' + user.uid);
            const snapshot = await get(userRef);
            
            if (!snapshot.exists()) {
                // مستخدم جديد: نعطيه رقم تسلسلي بدقة عالية لتوزيع البادجات
                const countRef = ref(db, 'app_stats/total_users');
                const result = await runTransaction(countRef, (currentCount) => {
                    return (currentCount || 0) + 1;
                });
                
                const userSequenceNumber = result.snapshot.val();
                let badges = [];
                let role = "member";
                
                // توزيع بادجات الأوائل
                if (userSequenceNumber === 1) {
                    badges.push("badge-1", "badge-admin");
                    role = "admin";
                } else if (userSequenceNumber === 2) {
                    badges.push("badge-2");
                } else if (userSequenceNumber === 3) {
                    badges.push("badge-3");
                }
                
                // إضافة بادج النيترو المبدئي كهدية تسجيل
                const nitroExpiryDate = rollNitroLuck();
                badges.push("badge-nitro");
                
                userData = {
                    uid: user.uid,
                    name: user.displayName,
                    photo: user.photoURL,
                    role: role,
                    badges: badges,
                    nitroExpires: nitroExpiryDate,
                    joinDate: serverTimestamp(),
                    sequenceId: userSequenceNumber
                };
                
                // حفظ البيانات في قاعدة البيانات
                await set(userRef, userData);
            } else {
                // مستخدم قديم
                userData = snapshot.val();
            }
        }

        // 5. نظام إرسال واستقبال الرسائل (Real-time)
        window.sendMessage = async () => {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (text === "") return;
            
            input.value = ""; // تفريغ الحقل فوراً لسرعة الاستجابة
            
            const messagesRef = push(ref(db, 'channels/general/messages'));
            await set(messagesRef, {
                uid: currentUser.uid,
                name: userData.name,
                photo: userData.photo,
                badges: userData.badges || [],
                text: text,
                timestamp: serverTimestamp()
            });
        };

        // تفعيل الإرسال بالضغط على Enter
        document.getElementById('messageInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // 6. تحميل ورسم الرسائل مع البادجات
        function loadMessages() {
            const messagesRef = ref(db, 'channels/general/messages');
            const chatArea = document.getElementById('chat-messages');
            
            // استماع للرسائل الجديدة بشكل فوري
            onChildAdded(messagesRef, (data) => {
                const msg = data.val();
                
                // تحويل البادجات إلى أيقونات HTML
                let badgesHtml = '';
                if (msg.badges) {
                    msg.badges.forEach(badge => {
                        let icon = '';
                        // استخدمنا FontAwesome مؤقتاً لحد ما تصمم شعارات Urchin الخاصة
                        if(badge === 'badge-1') icon = '<i class="fa-solid fa-crown"></i>';
                        if(badge === 'badge-2') icon = '<i class="fa-solid fa-medal"></i>';
                        if(badge === 'badge-3') icon = '<i class="fa-solid fa-star"></i>';
                        if(badge === 'badge-admin') icon = '<i class="fa-solid fa-shield-halved"></i>';
                        if(badge === 'badge-nitro') icon = '<i class="fa-solid fa-gem"></i>';
                        
                        badgesHtml += `<span class="badge ${badge}" title="${badge}">${icon}</span>`;
                    });
                }

                // حساب الوقت بدقة
                const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
                const timeString = date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
                
                // بناء هيكل الرسالة
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';
                msgDiv.innerHTML = `
                    <img src="${msg.photo}" alt="avatar" class="msg-avatar">
                    <div class="msg-content">
                        <div class="msg-header">
                            <span class="msg-username">${msg.name}</span>
                            <div class="badges-container">${badgesHtml}</div>
                            <span class="msg-time">${timeString}</span>
                        </div>
                        <div class="msg-text">${msg.text}</div>
                    </div>
                `;
                
                chatArea.appendChild(msgDiv);
                // النزول لأسفل الدردشة تلقائياً
                chatArea.scrollTop = chatArea.scrollHeight;
            });
        }
    </script>
