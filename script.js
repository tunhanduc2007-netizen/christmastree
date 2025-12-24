// Configuration
const isMobile = window.innerWidth < 768;
const CONFIG = {
    particleCount: isMobile ? 150 : 1500,
    treeHeight: 6,
    treeRadius: 2.5,
    rotationSpeed: 0.001,
    interactionMultiplier: 0.003,
    snowflakeCount: isMobile ? 8 : 50,
    enableShadows: !isMobile,
    enableBlur: !isMobile,
    fps: isMobile ? 24 : 60
};

// Global variables
const canvas = document.getElementById('hologramCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let rotation = 0;
let isInteracting = false;
let lastInteractionTime = 0;
let revealedCount = 0;
let lastRevealTime = 0;
const revealInterval = 200;
let currentModalIndex = 0;
const photoList = [];

// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.loading-screen').classList.add('hidden');
        init();
    }, 2000);
});

// ===== CANVAS SETUP =====
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== PARTICLE CLASS =====
class Particle {
    constructor() {
        const t = Math.random();
        this.angleOffset = Math.random() * Math.PI * 2;
        this.heightRatio = t;
        this.radiusRatio = t * (0.3 + Math.random() * 0.7);
        this.spiralTurns = 8 + Math.random() * 4;
        this.size = 1 + Math.random() * 2;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.speed = 0.0005 + Math.random() * 0.001;
        this.color = this.getColor();
    }

    getColor() {
        const hue = 320 + Math.random() * 20;
        const saturation = 80 + Math.random() * 20;
        const lightness = 50 + Math.random() * 30;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    update() {
        this.angleOffset += this.speed;
    }

    draw(rotation) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const y = (this.heightRatio - 0.5) * CONFIG.treeHeight * 60;
        const radius = this.radiusRatio * CONFIG.treeRadius * 60;
        const angle = this.angleOffset + this.spiralTurns * Math.PI * 2 * this.heightRatio + rotation;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const scale = 300 / (300 + z);
        const screenX = centerX + x * scale;
        const screenY = centerY + y * scale;

        const size = this.size * scale;
        const alpha = this.alpha * (0.3 + 0.7 * scale);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        // Only add shadow on desktop
        if (CONFIG.enableShadows) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ===== INITIALIZE =====
function init() {
    initParticles();
    createSnowfall();
    setupPhotoModal();
    setupControls();
    setupInteraction();
    animate();

    setTimeout(() => {
        document.querySelector('.hint-circle')?.classList.add('hidden');
    }, 5000);
}

function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        particles.push(new Particle());
    }
}

// ===== SNOWFALL =====
function createSnowfall() {
    const snowContainer = document.querySelector('.snowfall');
    for (let i = 0; i < CONFIG.snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowContainer.appendChild(snowflake);
    }
}

// ===== PHOTO MODAL =====
function setupPhotoModal() {
    // Collect all photo sources
    document.querySelectorAll('.photo-frame img').forEach(img => {
        photoList.push(img.src);
    });

    // Click handlers for photos
    document.querySelectorAll('.photo-frame').forEach((frame, index) => {
        frame.addEventListener('click', () => {
            openModal(index);
            createHeartParticles(event.clientX, event.clientY);
        });
    });

    // Modal controls
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-prev').addEventListener('click', () => navigateModal(-1));
    document.querySelector('.modal-next').addEventListener('click', () => navigateModal(1));

    document.querySelector('.photo-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('photo-modal')) {
            closeModal();
        }
    });
}

function openModal(index) {
    currentModalIndex = index;
    const modal = document.querySelector('.photo-modal');
    const img = document.querySelector('.modal-image');
    img.src = photoList[index];
    modal.classList.add('active');
}

function closeModal() {
    document.querySelector('.photo-modal').classList.remove('active');
}

function navigateModal(direction) {
    currentModalIndex = (currentModalIndex + direction + photoList.length) % photoList.length;
    document.querySelector('.modal-image').src = photoList[currentModalIndex];
}

// ===== HEART PARTICLES =====
function createHeartParticles(x, y) {
    const container = document.querySelector('.heart-particles');
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-particle';
        heart.textContent = '💖';
        heart.style.left = x + (Math.random() - 0.5) * 100 + 'px';
        heart.style.top = y + 'px';
        container.appendChild(heart);

        setTimeout(() => heart.remove(), 2000);
    }
}

// ===== CONTROLS =====
function setupControls() {
    // Music toggle
    const musicBtn = document.querySelector('.music-toggle');
    const audio = document.getElementById('bgMusic');
    let isPlaying = false;

    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            musicBtn.querySelector('.music-icon').textContent = '🔇';
        } else {
            audio.play().catch(() => {
                console.log('Audio playback failed - user interaction required');
            });
            musicBtn.querySelector('.music-icon').textContent = '🎵';
        }
        isPlaying = !isPlaying;
    });

    // Download button
    document.querySelector('.download-btn').addEventListener('click', () => {
        // Take screenshot of canvas
        const link = document.createElement('a');
        link.download = 'christmas-tree-mimimeomeo.png';
        link.href = canvas.toDataURL();
        link.click();

        createHeartParticles(window.innerWidth - 100, 70);
    });

    // Star easter egg (click on canvas center top)
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked near star position
        const centerX = canvas.width / 2;
        const starY = canvas.height / 2 - CONFIG.treeHeight * 60 * 0.55;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - starY) ** 2);

        if (distance < 30) {
            triggerFireworks();
        }
    });
}

function triggerFireworks() {
    alert('✨ Easter Egg! ✨\n\nChúc vợ yêu của chồng luôn hạnh phúc và tràn đầy niềm vui!\n\n💖 Love you 3000! 💖');

    // Create many hearts
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createHeartParticles(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight
            );
        }, i * 100);
    }
}

// ===== INTERACTION =====
function setupInteraction() {
    let isDragging = false;
    let lastX = 0;

    function startInteraction(x) {
        isDragging = true;
        isInteracting = true;
        lastX = x;
        lastInteractionTime = Date.now();

        document.querySelector('.title-overlay')?.classList.add('hide');
        document.querySelector('.hint-circle')?.classList.add('hidden');
    }

    function moveInteraction(x) {
        if (isDragging) {
            const deltaX = x - lastX;
            rotation += deltaX * CONFIG.interactionMultiplier;
            lastX = x;
            lastInteractionTime = Date.now();
        }
    }

    function endInteraction() {
        isDragging = false;
        setTimeout(() => {
            isInteracting = false;
        }, 100);
    }

    const container = document.querySelector('.container');

    // Mouse events on container
    container.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.photo-frame') && !e.target.closest('.control-btn')) {
            startInteraction(e.clientX);
        }
    });
    container.addEventListener('mousemove', (e) => moveInteraction(e.clientX));
    container.addEventListener('mouseup', endInteraction);
    container.addEventListener('mouseleave', endInteraction);

    // Touch events on container
    container.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.photo-frame') && !e.target.closest('.control-btn')) {
            startInteraction(e.touches[0].clientX);
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
            moveInteraction(e.touches[0].clientX);
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        endInteraction();
    }, { passive: true });
}

// ===== DRAW STAR =====
function drawStar(rotation) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const y = -CONFIG.treeHeight * 60 * 0.55;

    const screenX = centerX;
    const screenY = centerY + y;

    const glowSize = 15 + Math.sin(Date.now() * 0.003) * 3;

    ctx.save();

    if (CONFIG.enableShadows) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff69b4';
    }

    ctx.fillStyle = '#ff1493';
    ctx.beginPath();
    ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ===== PHOTO REVEAL =====
function revealNextPhoto() {
    const frames = document.querySelectorAll('.photo-frame');
    if (revealedCount < frames.length) {
        frames[revealedCount].classList.add('show');
        revealedCount++;

        if (revealedCount === 26) {
            setTimeout(() => {
                const message = document.querySelector('.christmas-message');
                const countdown = document.querySelector('.countdown-display');
                if (message) {
                    message.classList.add('show');
                }
                if (countdown) {
                    countdown.classList.add('show');
                }
            }, 500);
        }
    }
}

// ===== ANIMATION LOOP =====
let lastFrameTime = 0;
const frameDelay = 1000 / CONFIG.fps;

function animate(currentTime = 0) {
    requestAnimationFrame(animate);

    // Throttle FPS on mobile
    if (currentTime - lastFrameTime < frameDelay) {
        return;
    }
    lastFrameTime = currentTime;

    ctx.fillStyle = 'rgba(29, 9, 51, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isInteracting) {
        rotation += CONFIG.rotationSpeed;
    }

    particles.forEach(particle => {
        particle.update();
        particle.draw(rotation);
    });

    drawStar(rotation);

    const hasInteracted = lastInteractionTime > 0;
    if (hasInteracted && revealedCount < 26) {
        const now = Date.now();
        if (now - lastRevealTime > revealInterval) {
            revealNextPhoto();
            lastRevealTime = now;
        }
    }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    } else if (e.key === 'ArrowLeft') {
        navigateModal(-1);
    } else if (e.key === 'ArrowRight') {
        navigateModal(1);
    }
});
