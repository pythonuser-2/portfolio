// 1. Audio Engine Setup
const sfx = {
    keystroke: typeof Howl === 'function' ? new Howl({ src: ['https://actions.google.com/sounds/v1/office/keyboard_typing_fast.ogg'], volume: 0.05 }) : null,
    error: typeof Howl === 'function' ? new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'], volume: 0.1 }) : null,
    open: typeof Howl === 'function' ? new Howl({ src: ['https://actions.google.com/sounds/v1/science_fiction/sci_fi_computer_startup.ogg'], volume: 0.2 }) : null,
    alarm: typeof Howl === 'function' ? new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg'], volume: 0.3 }) : null 
};

function safePlay(sound) { if (sound && typeof sound.play === 'function') sound.play(); }
function isInteractReady() { return typeof interact === 'function' && interact.modifiers && typeof interact.modifiers.restrictRect === 'function'; }

// 2. Window Management (Interact.js & LocalStorage Persistence)
const terminalWindow = document.getElementById('terminal-window');
const termInput = document.getElementById('terminal-input');
const termOutput = document.getElementById('terminal-output');
const hasTerminal = terminalWindow && termInput && termOutput;

if (hasTerminal) {
    document.addEventListener('keydown', (e) => {
        if (e.key === '`') {
            if (terminalWindow.style.display === 'none' || terminalWindow.style.display === '') {
                terminalWindow.style.display = 'flex';
                safePlay(sfx.open);
                termInput.focus();
            } else {
                terminalWindow.style.display = 'none';
            }
        }
    });
}

if (isInteractReady()) {
    const savedX = localStorage.getItem('termX');
    const savedY = localStorage.getItem('termY');
    
    if (savedX && savedY && terminalWindow) {
        terminalWindow.style.transform = `translate(${savedX}px, ${savedY}px)`;
        terminalWindow.setAttribute('data-x', savedX);
        terminalWindow.setAttribute('data-y', savedY);
    }

    interact('.os-window').draggable({
        allowFrom: '.drag-handle',
        inertia: true,
        modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ],
        listeners: {
            move (event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                localStorage.setItem('termX', x);
                localStorage.setItem('termY', y);
            }
        }
    });
}

// 3. Easter Egg Engines (Matrix, Konami, Idle Detection)
let matrixInterval;
function startMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const nums = '0123456789';
    const alphabet = katakana + latin + nums;
    const fontSize = 16; const columns = canvas.width / fontSize;
    const drops = []; for (let x = 0; x < columns; x++) drops[x] = 1;
    
    const draw = () => {
        ctx.fillStyle = 'rgba(5, 5, 5, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff66'; ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    };
    matrixInterval = setInterval(draw, 30);
}

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPosition = 0;
if (hasTerminal) {
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiPosition]) {
            konamiPosition++;
            if (konamiPosition === konamiCode.length) {
                konamiPosition = 0; terminalWindow.style.display = 'flex'; termInput.focus();
                printToTerminal(">> KONAMI PROTOCOL ACCEPTED. WEAPONS HOT.", "success");
            }
        } else { konamiPosition = 0; }
    });
}

// 15-Second Idle Detection Handler
let idleTimer = null;
function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        if (hasTerminal) {
            terminalWindow.style.display = 'flex';
            termInput.focus();
            printToTerminal(">> Idle detected. Need something? Type 'help'.", "warning");
            safePlay(sfx.open);
        }
    }, 15000);
}
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
resetIdleTimer();

// 4. Expanded Command Router
if (termInput) {
    const cmdHistory = [];
    let historyIdx = -1;

    termInput.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') safePlay(sfx.keystroke);
        
        if (e.key === 'ArrowUp') {
            if (historyIdx < cmdHistory.length - 1) {
                historyIdx++;
                this.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIdx > 0) {
                historyIdx--;
                this.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
            } else {
                historyIdx = -1;
                this.value = '';
            }
        }

        if (e.key === 'Enter') {
            const command = this.value.trim().toLowerCase();
            this.value = ''; 
            if (command) { cmdHistory.push(command); historyIdx = -1; }
            printToTerminal(`guest@sys:~# ${command}`);
    
            switch(command) {
            case 'help':
                printToTerminal("COMMANDS: help, whoami, skills, projects, contact, f1, coffee, matrix, panic, sudo, reboot, history, clear", "success");
                break;
            case 'whoami':
                printToTerminal("ABHIMANYU KM. COMPUTER SCIENCE STUDENT. GENERALIST BY CHOICE.");
                break;
            case 'skills':
                printToTerminal("CORE: C | Python | HTML/CSS | Logic Restructuring");
                break;
            case 'projects':
                printToTerminal("1. Local Server Deployment Architecture\n2. C Matrix Sorting Algorithmic Design\n3. F1 Telemetry Analytics\n4. Systematic SIP Allocation Modeling");
                break;
            case 'contact':
                printToTerminal("SCROLLING TO COMMUNICATION NODES...", "success");
                const contactSec = document.getElementById('contact');
                if (contactSec) contactSec.scrollIntoView({ behavior: 'smooth' });
                break;
            case 'f1':
                printToTerminal("FETCHING TELEMETRY...");
                setTimeout(() => printToTerminal("RACE CLASSIFICATION: JAPAN 2026 // LOGIC PARSED.", "success"), 600);
                break;
            case 'sudo':
                printToTerminal("Permission denied.");
                setTimeout(() => {
                    printToTerminal("...", "warning");
                    setTimeout(() => {
                        printToTerminal("Just kidding.", "success");
                        printToTerminal("Welcome Developer. Developer Mode Unlocked.", "success");
                    }, 800);
                }, 800);
                break;
            case 'reboot':
                printToTerminal("REBOOTING SYSTEM KERNEL...", "warning");
                setTimeout(() => {
                    if (typeof window.triggerSystemReboot === 'function') {
                        window.triggerSystemReboot();
                    } else {
                        window.location.reload();
                    }
                }, 1000);
                break;
            case 'history':
                cmdHistory.forEach((cmd, idx) => printToTerminal(`${idx + 1}  ${cmd}`));
                break;
            case 'secret':
                printToTerminal("The perfect line requires absolute precision. Apex acquired.", "success");
                break;
            case 'resume':
                printToTerminal("RESUME FILE NOT FOUND IN CURRENT DIRECTORY. QUERY SYSTEM OWNER.", "warning");
                break;
            case 'coffee':
                printToTerminal("COFFEE METER: [████████░░] 80%");
                printToTerminal("Caffeine optimization protocols nominal.");
                break;
            case 'matrix':
                if (!matrixInterval) {
                    printToTerminal("Follow the white rabbit...", "success"); startMatrix();
                } else {
                    clearInterval(matrixInterval); matrixInterval = null;
                    const mxCanvas = document.getElementById('matrix-canvas');
                    if (mxCanvas) mxCanvas.style.display = 'none';
                    printToTerminal("Matrix unloaded.");
                }
                break;
            case 'panic':
                printToTerminal("INITIATING SYSTEM LOCKDOWN...", "error");
                document.body.classList.add('panic-mode');
                const pOverlay = document.getElementById('panic-overlay');
                if (pOverlay) { pOverlay.style.display = 'block'; pOverlay.style.opacity = '0.5'; }
                safePlay(sfx.alarm);
                setTimeout(() => {
                    document.body.classList.remove('panic-mode');
                    if (pOverlay) pOverlay.style.display = 'none';
                    printToTerminal(">> False Alarm. System Restored.", "success");
                }, 3500);
                break;
            case 'clear':
                if (termOutput) termOutput.innerHTML = '';
                break;
            case '':
                break;
            default:
                safePlay(sfx.error);
                printToTerminal(`Command not found: ${command}`, "error");
            }
            if (termOutput && termOutput.parentElement) termOutput.parentElement.scrollTop = termOutput.parentElement.scrollHeight;
        }
    });
}

function printToTerminal(text, className = '') {
    if (!termOutput) return;
    const div = document.createElement('div');
    div.innerText = text;
    if (className) div.className = className;
    termOutput.appendChild(div);
}