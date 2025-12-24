/**
 * PURE HOLOGRAM CHRISTMAS TREE
 * Hidden Gold Magic System
 */

window.onload = function () {
    const CFG = {
        // Particle counts
        baseMist: window.innerWidth < 768 ? 250 : 800,
        hiddenGold: window.innerWidth < 768 ? 200 : 700,
        stardust: 120,

        // Tree dimensions
        treeW: 340,
        treeH: 640,
        focal: 900,

        // Magic reveal thresholds
        speedThreshold: 0.012, // Tốc độ tối thiểu để kích hoạt vàng
        fadeOutDelay: 2000     // Thời gian chờ trước khi ẩn (ms)
    };

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, CX, CY;

    // Animation state
    let angle = 0;
    let velocity = 0.001;
    let goldAlpha = 0; // 0 = hidden, 1 = fully revealed
    let lastActiveTime = 0;

    let dragging = false;
    let lastMX = 0;

    let particles = [];

    // Resize handler
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        CX = W / 2;
        CY = H / 2 + 60;

        CFG.treeW = Math.min(W * 0.42, 340);
        CFG.treeH = Math.min(H * 0.68, 640);

        initParticles();
    }

    // === PARTICLE CLASSES ===

    class MistParticle {
        constructor(type) {
            this.type = type; // 'base' | 'gold' | 'dust'
            this.reset();
        }

        reset() {
            if (this.type === 'dust') {
                // Background floating dust
                const range = 1500;
                this.x = (Math.random() - 0.5) * range;
                this.y = (Math.random() - 0.5) * range;
                this.z = (Math.random() - 0.5) * range;
                this.size = Math.random() * 1.5 + 0.5;
                this.speed = Math.random() * 0.0005;
            } else {
                // Tree particles
                this.y = (Math.random() - 0.5) * CFG.treeH;
                const relY = (this.y + CFG.treeH / 2) / CFG.treeH;

                // Spiral pattern
                const spiralTurns = 15;
                const baseAngle = Math.random() * Math.PI * 2;
                const spiralOffset = relY * Math.PI * spiralTurns;
                const theta = baseAngle + spiralOffset;

                // Cone radius (wider at bottom)
                const maxRadius = Math.pow(relY, 0.82) * CFG.treeW;
                const radiusFactor = 0.3 + Math.random() * 0.7; // Random depth
                const r = radiusFactor * maxRadius;

                this.x = Math.cos(theta) * r;
                this.z = Math.sin(theta) * r;

                // Micro offset for natural look
                this.x += (Math.random() - 0.5) * 8;
                this.y += (Math.random() - 0.5) * 8;
                this.z += (Math.random() - 0.5) * 8;

                // Breathing wobble
                this.wobblePhase = Math.random() * Math.PI * 2;
                this.wobbleSpeed = 0.001 + Math.random() * 0.001;
                this.wobbleAmp = 2 + Math.random() * 3;

                if (this.type === 'gold') {
                    this.size = Math.random() * 2.5 + 1;
                    this.sparklePhase = Math.random() * 1000;
                } else {
                    this.size = Math.random() * 3.5 + 1.5;
                }
            }
        }

        render(time, scale, px, py) {
            const s = this.size * scale;
            let alpha = Math.min(1, scale * 0.7);

            // === HIDDEN GOLD LOGIC ===
            if (this.type === 'gold') {
                // Chỉ vẽ khi goldAlpha > 0
                if (goldAlpha < 0.01) return;

                alpha *= goldAlpha;

                // Sparkle effect khi reveal
                const sparkle = Math.sin(time * 0.01 + this.sparklePhase);
                let finalSize = s;
                if (sparkle > 0.88 && goldAlpha > 0.8) {
                    finalSize *= 2;
                    alpha = 1;
                }

                // Draw gold glow
                const grad = ctx.createRadialGradient(px, py, 0, px, py, finalSize);
                grad.addColorStop(0, 'rgba(255,255,255,0.9)');
                grad.addColorStop(0.4, 'rgba(255,215,0,' + alpha + ')');
                grad.addColorStop(1, 'rgba(255,165,0,0)');

                ctx.fillStyle = grad;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(px, py, finalSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

            } else if (this.type === 'base') {
                // Base mist - always visible
                // Breathing effect
                const breathe = Math.sin(time * this.wobbleSpeed + this.wobblePhase);
                const finalSize = s * (1 + breathe * 0.08);

                const grad = ctx.createRadialGradient(px, py, 0, px, py, finalSize);
                grad.addColorStop(0, 'rgba(255,255,255,0.5)');
                grad.addColorStop(0.5, 'rgba(200,220,240,0.25)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = grad;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(px, py, finalSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

            } else {
                // Stardust
                ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.3) + ')';
                ctx.beginPath();
                ctx.arc(px, py, s * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function initParticles() {
        particles = [];

        // Base mist (always visible)
        for (let i = 0; i < CFG.baseMist; i++) {
            particles.push(new MistParticle('base'));
        }

        // Hidden gold (conditional)
        for (let i = 0; i < CFG.hiddenGold; i++) {
            particles.push(new MistParticle('gold'));
        }

        // Background dust
        for (let i = 0; i < CFG.stardust; i++) {
            particles.push(new MistParticle('dust'));
        }
    }

    // === ANIMATION LOOP ===
    function loop() {
        ctx.clearRect(0, 0, W, H);
        const time = Date.now();

        // Physics
        if (!dragging) {
            // Friction
            velocity *= 0.94;
            // Min auto-spin
            if (Math.abs(velocity) < 0.0008) {
                velocity = 0.0008 * (velocity >= 0 ? 1 : -1);
            }
        }

        angle += velocity;

        // === GOLD REVEAL SYSTEM ===
        const speed = Math.abs(velocity);
        const isActive = speed > CFG.speedThreshold;

        if (isActive) {
            lastActiveTime = time;
        }

        const timeSinceActive = time - lastActiveTime;
        const shouldReveal = isActive || timeSinceActive < CFG.fadeOutDelay;

        const targetAlpha = shouldReveal ? 1 : 0;
        const fadeSpeed = targetAlpha > goldAlpha ? 0.06 : 0.03; // Fade in nhanh, fade out chậm
        goldAlpha += (targetAlpha - goldAlpha) * fadeSpeed;

        // === 3D PROJECTION ===
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        particles.forEach(p => {
            let rx, rz, ry;

            if (p.type === 'dust') {
                // Parallax effect for dust
                const dustAngle = angle * -0.15;
                const dc = Math.cos(dustAngle);
                const ds = Math.sin(dustAngle);
                rx = p.x * dc - p.z * ds;
                rz = p.z * dc + p.x * ds;
                ry = p.y;
            } else {
                rx = p.x * cos - p.z * sin;
                rz = p.z * cos + p.x * sin;
                ry = p.y;
            }

            const depth = CFG.focal + rz;
            p._visible = depth > 0;

            if (p._visible) {
                const scale = CFG.focal / depth;
                p._scale = scale;
                p._px = rx * scale + CX;
                p._py = ry * scale + CY;
                p._rz = rz;
            }
        });

        // Z-sort (far to near)
        particles.sort((a, b) => b._rz - a._rz);

        // === RENDER ===

        // Volumetric light cone (subtle)
        if (goldAlpha > 0.3) {
            drawVolumetricCone(goldAlpha);
        }

        // Particles (additive blending for glow)
        ctx.globalCompositeOperation = 'lighter';
        particles.forEach(p => {
            if (p._visible) {
                p.render(time, p._scale, p._px, p._py);
            }
        });
        ctx.globalCompositeOperation = 'source-over';

        // Star
        drawStar(time, cos, sin);

        // UI update
        updateUI();

        requestAnimationFrame(loop);
    }

    function drawVolumetricCone(intensity) {
        const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY - 100, CFG.treeH * 0.6);
        grad.addColorStop(0, 'rgba(255,215,0,' + (intensity * 0.03) + ')');
        grad.addColorStop(0.7, 'rgba(255,215,0,' + (intensity * 0.01) + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    function drawStar(time, cos, sin) {
        const sy = -CFG.treeH / 2 - 35;
        const depth = CFG.focal;
        const scale = CFG.focal / depth;
        const px = CX;
        const py = sy * scale + CY;
        const size = 20 * scale;

        ctx.save();
        ctx.translate(px, py);

        // Xoay chậm
        const rotation = time * 0.0004;
        ctx.rotate(rotation);

        // === RAYS (Tia sáng 8 hướng) ===
        const rayCount = 8;
        const rayLength = size * 3.5;
        const pulse = Math.sin(time * 0.002) * 0.4 + 0.6;

        for (let i = 0; i < rayCount; i++) {
            const rayAngle = (i / rayCount) * Math.PI * 2;
            const grad = ctx.createLinearGradient(
                0, 0,
                Math.cos(rayAngle) * rayLength,
                Math.sin(rayAngle) * rayLength
            );
            grad.addColorStop(0, 'rgba(255,215,0,' + (pulse * 0.7) + ')');
            grad.addColorStop(0.5, 'rgba(255,215,0,' + (pulse * 0.3) + ')');
            grad.addColorStop(1, 'rgba(255,215,0,0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
            ctx.stroke();
        }

        // === GLOW ===
        ctx.shadowBlur = 25 + pulse * 15;
        ctx.shadowColor = '#FFD700';

        // === NGÔI SAO 5 CÁNH ===
        // Gradient fill
        const starGrad = ctx.createRadialGradient(0, -size * 0.2, 0, 0, 0, size);
        starGrad.addColorStop(0, '#FFFEF5');
        starGrad.addColorStop(0.4, '#FFD700');
        starGrad.addColorStop(0.8, '#FFA500');
        starGrad.addColorStop(1, '#DAA520');
        ctx.fillStyle = starGrad;

        // Stroke viền
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;

        // Vẽ 5 cánh
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;

            const outerX = Math.cos(outerAngle) * size;
            const outerY = Math.sin(outerAngle) * size;
            const innerX = Math.cos(innerAngle) * size * 0.38;
            const innerY = Math.sin(innerAngle) * size * 0.38;

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Highlight (Ánh sáng phản chiếu)
        ctx.shadowBlur = 0;
        const highlightGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 0, -size * 0.2, -size * 0.2, size * 0.4);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(-size * 0.2, -size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function updateUI() {
        const txt = document.querySelector('.text-container');
        if (goldAlpha > 0.6) {
            txt.classList.add('visible');
        }
    }

    // === EVENTS ===
    function handleStart(x) {
        dragging = true;
        lastMX = x;
        velocity = 0;
    }

    function handleMove(x) {
        if (!dragging) return;
        const delta = x - lastMX;
        lastMX = x;
        velocity = delta * 0.01;
    }

    function handleEnd() {
        dragging = false;
    }

    canvas.addEventListener('mousedown', e => handleStart(e.clientX));
    canvas.addEventListener('mousemove', e => handleMove(e.clientX));
    canvas.addEventListener('mouseup', handleEnd);

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        handleStart(e.touches[0].clientX);
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        handleEnd();
    }, { passive: false });

    window.addEventListener('resize', resize);

    resize();
    loop();
};
