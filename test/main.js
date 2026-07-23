// 1. Initialize Lenis (Smooth Scrolling)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// 2. Boot Sequence Logic
const bootScreen = document.getElementById('boot-screen');
const hasBooted = sessionStorage.getItem('os_booted');

function runBootSequence(isReboot = false) {
    if (bootScreen) {
        bootScreen.style.display = 'flex';
        bootScreen.style.opacity = '1';
        document.body.style.overflow = 'hidden';
        
        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(bootScreen, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        bootScreen.style.display = 'none';
                        document.body.style.overflow = '';
                        sessionStorage.setItem('os_booted', 'true');
                        if (!isReboot) initTextAnimations();
                    }
                });
            }
        });

        tl.to("#bt1", {opacity: 1, duration: 0.1})
          .to("#bt2", {opacity: 1, duration: 0.1, delay: 0.3})
          .to("#bt3", {opacity: 1, duration: 0.1, delay: 0.2})
          .to("#bt4", {opacity: 1, duration: 0.1, delay: 0.4})
          .to("#bt5", {opacity: 1, duration: 0.1, delay: 0.2});
    }
}

if (!hasBooted) {
    runBootSequence(false);
} else if (bootScreen) {
    bootScreen.style.display = 'none';
    initTextAnimations();
}

window.triggerSystemReboot = function() {
    sessionStorage.removeItem('os_booted');
    runBootSequence(true);
};

// 3. Text Scrambler & Scroll Animations (GSAP + SplitType)
gsap.registerPlugin(ScrollTrigger);
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

function initTextAnimations() {
    const splitTexts = document.querySelectorAll('.reveal-text');
    
    splitTexts.forEach(text => {
        const split = new SplitType(text, { types: 'chars' });
        
        gsap.from(split.chars, {
            scrollTrigger: { trigger: text, start: "top 85%" },
            opacity: 0,
            y: 20,
            duration: 0.1,
            stagger: 0.02,
            onStart: function() {
                split.chars.forEach((char, i) => {
                    const originalChar = char.innerText;
                    let iterations = 0;
                    const interval = setInterval(() => {
                        char.innerText = letters[Math.floor(Math.random() * letters.length)];
                        if (iterations >= 10) {
                            clearInterval(interval);
                            char.innerText = originalChar;
                        }
                        iterations++;
                    }, 30 + (i * 10));
                });
            }
        });
    });

    gsap.utils.toArray('.reveal-fade').forEach((el, i) => {
        gsap.from(el, { scrollTrigger: { trigger: el, start: "top 90%" }, y: 30, opacity: 0, duration: 0.8, delay: i * 0.1, ease: "power3.out" });
    });
}

// 4. Custom Cursor & Binary Trail Engine (Canvas)
const cursorSvg = document.getElementById('cursor-svg');
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let prevMouseX = mouseX;
let prevMouseY = mouseY;
let particles = [];

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;
    const speed = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (cursorSvg) {
        if(speed > 2) {
            gsap.to(cursorSvg, { x: mouseX - 6, y: mouseY - 6, rotate: angle * 0.2, duration: 0.1 });
            if (Math.random() > 0.4 && canvas) {
                particles.push({
                    x: mouseX, y: mouseY, text: Math.random() > 0.5 ? '1' : '0',
                    life: 1, rot: Math.random() * 360, vy: (Math.random() * -2) - 0.5
                });
            }
        } else {
            gsap.to(cursorSvg, { x: mouseX - 6, y: mouseY - 6, rotate: 0, duration: 0.2 });
        }
    }
    prevMouseX = mouseX;
    prevMouseY = mouseY;
});

function renderTrail() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px 'JetBrains Mono'";
    ctx.textAlign = "center";
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = `rgba(0, 255, 102, ${p.life})`;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
    }
    requestAnimationFrame(renderTrail);
}
if (canvas) renderTrail();

// 5. Magnetic Hover Mechanics
const magnetics = document.querySelectorAll('.magnetic');
magnetics.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    });
});

// 6. Background System Logs Generator
const logContainer = document.getElementById('system-logs');
const logPhrases = [
    "THREAD CREATED", "Memory Allocated", "GPU Synced", 
    "Optimizing asset allocation models...", "Packet Received", 
    "Retrieving F1 Telemetry...", "Synchronization Complete", 
    "Neural Cache Loaded", "Establishing connection to Kochi relay...",
    "Compiling C Matrix..."
];

if (logContainer) {
    setInterval(() => {
        if(Math.random() > 0.6) {
            const log = document.createElement('div');
            log.className = 'sys-log-entry';
            const time = new Date().toLocaleTimeString();
            log.innerText = `[${time}] ${logPhrases[Math.floor(Math.random() * logPhrases.length)]}`;
            logContainer.appendChild(log);
            if(logContainer.children.length > 8) {
                logContainer.removeChild(logContainer.firstChild);
            }
        }
    }, 1200);
}

// 7. 3D Card Physics & Glare Engine
const cards = document.querySelectorAll('.magnetic-card');
cards.forEach(card => {
    const glare = card.querySelector('.card-glare');
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        
        gsap.to(card, { transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`, duration: 0.4, ease: "power2.out" });
        
        if (glare) {
            glare.style.opacity = '1';
            glare.style.transform = `translate(${x - rect.width/2}px, ${y - rect.height/2}px)`;
        }
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, { transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        if (glare) glare.style.opacity = '0';
    });
});

// 8. Logo Easter Egg (7 Clicks for Dev Mode)
let logoClicks = 0;
const logoNode = document.querySelector('.logo');
if (logoNode) {
    logoNode.addEventListener('click', () => {
        logoClicks++;
        if (logoClicks === 7) {
            logoClicks = 0;
            const terminalWindow = document.getElementById('terminal-window');
            const termInput = document.getElementById('terminal-input');
            if (terminalWindow && termInput) {
                terminalWindow.style.display = 'flex';
                termInput.focus();
                const termOutput = document.getElementById('terminal-output');
                const div = document.createElement('div');
                div.className = "success";
                div.innerHTML = ">> ACCESS GRANTED. DEVELOPER NOTES UNLOCKED.<br>>> The system is stable. Execution is clean.";
                termOutput.appendChild(div);
                termOutput.parentElement.scrollTop = termOutput.parentElement.scrollHeight;
            }
        }
    });
}