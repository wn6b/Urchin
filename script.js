<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0a0a0f">
    <meta name="description" content="Urchin - The Future of Communication, 2026 Edition">
    
    <title>Urchin App</title>

    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="icon-192.png">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="auth-screen" class="active-screen">
        <div class="urchin-logo-container" aria-label="Urchin Logo">
            <i class="fa-solid fa-water"></i>
        </div>
        
        <div class="auth-box">
            <h1>Urchin</h1>
            <p id="auth-subtitle">Connect. Beyond Limits.</p>
            
            <button class="btn-login" id="loginBtn" aria-label="Login with Google">
                <i class="fa-brands fa-google"></i> 
                <span id="login-text">Login to Urchin</span>
            </button>
            
            <div class="auth-footer">
                <small>Secure connection via Firebase Auth</small>
            </div>
        </div>
    </div>

    <div id="app-screen" style="display: none;">

        <nav id="sidebar" class="sidebar">
            
            <div class="servers-list">
                <div class="server-icon active-server">
                    <i class="fa-solid fa-water"></i> </div>
                <div class="server-icon add-server">
                    <i class="fa-solid fa-plus"></i>
                </div>
            </div>

            <div class="channels-panel">
                <div class="server-header">
                    <h2>Urchin Official</h2>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
                
                <div class="channels-list">
                    <div class="category-title">
                        <i class="fa-solid fa-angle-down"></i> TEXT CHANNELS
                    </div>
                    <div class="channel-item active-channel">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>general</span>
                    </div>
                    <div class="channel-item">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>announcements</span>
                    </div>
                    <div class="channel-item">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>bot-commands</span>
                    </div>
                </div>

                <div class="user-controls">
                    <div class="user-info-bar">
                        <div class="avatar-wrapper">
                            <img src="" alt="User" id="sidebarAvatar" class="sidebar-avatar">
                            <div class="status-indicator online"></div>
                        </div>
                        <div class="user-name-role">
                            <strong id="sidebarUsername">User</strong>
                            <span id="sidebarRole">#0000</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button aria-label="Mute"><i class="fa-solid fa-microphone"></i></button>
                        <button aria-label="Deafen"><i class="fa-solid fa-headphones"></i></button>
                        <button aria-label="Settings"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
            </div>
        </nav>

        <main id="main-content" class="main-content">
            
            <header class="app-header">
                <div class="header-left">
                    <button id="mobileMenuBtn" class="hamburger-btn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="channel-info">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>general</span>
                    </div>
                </div>
                
                <div class="header-right">
                    <button class="header-icon" aria-label="Threads"><i class="fa-solid fa-hashtag"></i></button>
                    <button class="header-icon" aria-label="Members List"><i class="fa-solid fa-user-group"></i></button>
                    <div class="user-profile-mini">
                        <img src="" alt="Avatar" class="user-avatar" id="currentUserAvatar">
                    </div>
                </div>
            </header>

            <section class="chat-area" id="chat-messages">
                <div class="welcome-banner">
                    <div class="welcome-icon"><i class="fa-solid fa-hashtag"></i></div>
                    <h1>Welcome to #general!</h1>
                    <p>This is the start of the Urchin Official server.</p>
                </div>
                </section>

            <footer class="input-area">
                <div class="input-wrapper">
                    <button class="action-btn attach-btn" aria-label="Upload File">
                        <i class="fa-solid fa-circle-plus"></i>
                    </button>
                    
                    <input type="text" id="messageInput" placeholder="Message #general..." autocomplete="off">
                    
                    <div class="input-actions-right">
                        <button class="action-btn nitro-gift-btn" aria-label="Gift Nitro">
                            <i class="fa-solid fa-gift"></i>
                        </button>
                        <button class="action-btn emoji-btn" aria-label="Emojis">
                            <i class="fa-solid fa-face-smile"></i>
                        </button>
                    </div>
                    
                    <button class="send-btn" id="sendBtn" aria-label="Send Message">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </footer>
            
        </main>
    </div>

    <script type="module" src="script.js"></script>
</body>
</html>
