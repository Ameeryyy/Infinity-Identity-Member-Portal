class InfinityBrain {
    constructor() {
        this.settings = this.getSettings();
        this.init();
    }
    init() {
        this.applySecurity();
        this.applyGlobalStyles();
        this.setupCustomAlert();
        if (this.settings && this.settings.theme) this.applyTheme(this.settings.theme);
        else this.applyTheme('system');
        this.setupNetworkMonitor();
        this.restorePageState();
    }
    applySecurity() {
        document.addEventListener('copy', e => e.preventDefault());
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
    }
    applyGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = 'html,body{margin:0;padding:0;width:100vw;min-height:100vh;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;transition:background-color .4s ease,color .4s ease}*,*:before,*:after{box-sizing:inherit}*{-webkit-tap-highlight-color:transparent!important;user-select:none!important;outline:none!important}';
        document.head.appendChild(style);
    }
    applyTheme(theme) {
        const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
        document.documentElement.style.setProperty('--bg', isDark ? '#000' : '#fff');
        document.documentElement.style.setProperty('--fg', isDark ? '#fff' : '#000');
        document.body.style.backgroundColor = 'var(--bg)';
        document.body.style.color = 'var(--fg)';
    }
    saveSettings(data) {
        this.settings = { ...this.settings, ...data };
        localStorage.setItem('infinity_settings', JSON.stringify(this.settings));
        this.applyTheme(this.settings.theme);
    }
    getSettings() {
        return JSON.parse(localStorage.getItem('infinity_settings'));
    }
    setupCustomAlert() {
        const style = document.createElement('style');
        style.textContent = '.inf-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:9999;opacity:0;transition:opacity .3s}.inf-alert{background:var(--bg);color:var(--fg);padding:25px;border-radius:12px;border:1px solid currentColor;text-align:center;width:80%;max-width:300px;transform:scale(0.9);transition:transform .3s}.inf-alert h3{margin:0 0 10px 0;font-size:18px;font-weight:400}.inf-alert p{margin:0 0 20px 0;font-size:14px;opacity:0.8;line-height:1.5}.inf-alert button{padding:10px 24px;border:1px solid currentColor;background:transparent;color:inherit;border-radius:8px;cursor:pointer;font-size:14px;width:100%;text-transform:uppercase;font-weight:bold;letter-spacing:1px}.inf-show{opacity:1}.inf-show .inf-alert{transform:scale(1)}';
        document.head.appendChild(style);
        window.alert = (title, message) => {
            if (!message) { message = title; title = 'Alert'; }
            const overlay = document.createElement('div');
            overlay.className = 'inf-overlay';
            overlay.innerHTML = `<div class="inf-alert"><h3>${title}</h3><p>${message}</p><button onclick="const o=this.closest('.inf-overlay');o.classList.remove('inf-show');setTimeout(()=>o.remove(),300)">OK</button></div>`;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('inf-show'), 10);
        };
    }
    setupNetworkMonitor() {
        const path = window.location.pathname.toLowerCase();
        const isIndex = path.endsWith('index.html') || path.endsWith('/');
        const isOffline = path.endsWith('offline.html');
        window.addEventListener('offline', () => {
            if (!isIndex && !isOffline) {
                this.savePageState();
                localStorage.setItem('inf_last_page', window.location.href);
                window.location.href = 'offline.html';
            }
        });
        window.addEventListener('online', () => {
            if (isOffline) {
                alert('NETWORK RESTORED', 'Connection successfully re-established. Redirecting back to your previous node in 3 seconds...');
                setTimeout(() => {
                    window.location.href = localStorage.getItem('inf_last_page') || 'home.html';
                }, 3000);
            }
        });
        if (!navigator.onLine && !isIndex && !isOffline) {
            this.savePageState();
            localStorage.setItem('inf_last_page', window.location.href);
            window.location.href = 'offline.html';
        }
    }
    savePageState() {
        const inputs = document.querySelectorAll('input, textarea');
        const state = {};
        inputs.forEach((input, index) => {
            state[input.id || input.name || 'input_' + index] = input.value;
        });
        localStorage.setItem('inf_state_' + window.location.pathname, JSON.stringify(state));
    }
    restorePageState() {
        try {
            const state = JSON.parse(localStorage.getItem('inf_state_' + window.location.pathname));
            if (state) {
                document.querySelectorAll('input, textarea').forEach((input, index) => {
                    const key = input.id || input.name || 'input_' + index;
                    if (state[key] !== undefined) input.value = state[key];
                });
            }
        } catch (e) {}
    }
    async setupAuth() {
        try {
            const publicKey = {
                challenge: new Uint8Array(32),
                rp: { name: "Infinity Identity" },
                user: { id: new Uint8Array(16), name: "User", displayName: "User" },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { userVerification: "preferred" },
                timeout: 60000,
                attestation: "none"
            };
            await navigator.credentials.create({ publicKey });
            return true;
        } catch (e) {
            return false;
        }
    }
}
const brain = new InfinityBrain();
