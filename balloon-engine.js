/**
 * HTML5 Canvas Balloon & Gondola Physics Engine for Percent Balloon
 * Renders clouds, sky, floating balloons tied to a gondola, pop shockwaves,
 * rubber particles, confetti, and Game Over / Game Clear animations.
 */
class BalloonEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.balloons = [];
        this.particles = [];
        this.shockwaves = [];
        this.confetti = [];
        this.clouds = [];
        this.floatingTexts = [];

        this.maxBalloons = 100;
        this.gondolaState = 'normal'; // 'normal' | 'falling' | 'rising'
        this.gondolaOffsetY = 0;
        this.gondolaVelocityY = 0;
        this.shakeMagnitude = 0;
        this.time = 0;

        this.palette = [
            { main: '#FF3366', light: '#FF85A2', dark: '#B8002E' }, // Red/Pink
            { main: '#FF9900', light: '#FFC966', dark: '#B36B00' }, // Orange
            { main: '#FFDE00', light: '#FFF080', dark: '#B39B00' }, // Yellow
            { main: '#2CE65C', light: '#8FF8A8', dark: '#0E9632' }, // Green
            { main: '#00C8FF', light: '#80E3FF', dark: '#007FA3' }, // Cyan
            { main: '#4D6BFF', light: '#99ABFF', dark: '#1935B8' }, // Blue
            { main: '#B84DFF', light: '#DBA3FF', dark: '#6E14A8' }, // Purple
            { main: '#FF4DC4', light: '#FFA3E0', dark: '#A81478' }  // Magenta
        ];

        this.initClouds();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
            const ro = new ResizeObserver(() => this.resize());
            ro.observe(this.canvas.parentElement);
        }
        this.animate();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.recalculateBalloonLayout();
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * 1600,
                y: 40 + Math.random() * 420,
                scale: 0.5 + Math.random() * 0.9,
                speed: 0.15 + Math.random() * 0.35,
                alpha: 0.35 + Math.random() * 0.35
            });
        }
    }

    // Create initial balloons in a natural bouquet cluster
    initBalloons(count = 100) {
        this.maxBalloons = Math.max(count, 1);
        this.balloons = [];
        this.particles = [];
        this.shockwaves = [];
        this.confetti = [];
        this.floatingTexts = [];
        this.gondolaState = 'normal';
        this.gondolaOffsetY = 0;
        this.gondolaVelocityY = 0;

        for (let i = 0; i < count; i++) {
            this.balloons.push(this.createBalloonObject(i, count));
        }
        this.recalculateBalloonLayout();
    }

    createBalloonObject(index, total) {
        const colorObj = this.palette[index % this.palette.length];
        return {
            id: index + '-' + Math.random().toString(36).substring(2, 6),
            relX: 0,
            relY: 0,
            x: this.width / 2,
            y: this.height / 2,
            vx: 0,
            vy: 0,
            radius: 24,
            scale: 1,
            color: colorObj,
            phase: Math.random() * Math.PI * 2,
            swaySpeed: 1.3 + Math.random() * 1.2,
            swayAmp: 3 + Math.random() * 4.5,
            layer: index % 3,
            popping: false,
            popScale: 1
        };
    }

    // Arrange balloons in an inverted teardrop / hot-air-balloon bouquet shape
    recalculateBalloonLayout() {
        const count = this.balloons.length;
        if (count === 0) return;

        const scaleFactor = Math.min(1, Math.max(0.65, this.height / 740));
        const clusterRadiusX = Math.min(this.width * 0.34, 300 * scaleFactor);
        const clusterRadiusY = Math.min(this.height * 0.25, 195 * scaleFactor);
        const baseBalloonRadius = (count > 100 ? 19 : count > 60 ? 23 : 27) * scaleFactor;

        // Golden angle spiral distribution inside an oval bouquet
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
            const b = this.balloons[i];
            const ratio = (i + 0.5) / count;
            const r = Math.sqrt(ratio);
            const theta = i * goldenAngle;

            b.relX = Math.cos(theta) * r * clusterRadiusX;
            // Shift upper half slightly wider like a real balloon bunch
            const verticalBias = Math.sin(theta) * r * clusterRadiusY;
            b.relY = verticalBias - (1 - Math.abs(Math.cos(theta)) * 0.25) * (18 * scaleFactor);
            b.radius = baseBalloonRadius * (0.92 + (i % 5) * 0.03);
        }
    }

    getGondolaAnchor() {
        const remaining = this.balloons.length;
        const ratio = Math.min(remaining / Math.max(this.maxBalloons, 1), 1.2);
        const scaleFactor = Math.min(1, Math.max(0.65, this.height / 740));
        // As balloons pop, gondola sinks slightly to build tension
        const sinkOffset = (1 - ratio) * Math.min(this.height * 0.12, 80 * scaleFactor);
        const bobbing = Math.sin(this.time * 2.1) * 5;

        const anchorX = this.width * 0.5;
        const anchorY = this.height * 0.72 + sinkOffset + bobbing + this.gondolaOffsetY;
        const clusterCenterY = anchorY - Math.min(this.height * 0.34, 230 * scaleFactor);

        return { anchorX, anchorY, clusterCenterY };
    }

    // Pop a single random outer/inner balloon with particle burst
    popOneBalloon() {
        if (this.balloons.length === 0) return false;

        // Prefer popping outer balloons first so the cluster shrinks naturally
        const popIndex = this.balloons.length - 1 - Math.floor(Math.random() * Math.min(5, this.balloons.length));
        const idx = Math.max(0, popIndex);
        const b = this.balloons[idx];

        const { anchorX, clusterCenterY } = this.getGondolaAnchor();
        const bx = anchorX + b.relX + Math.sin(this.time * b.swaySpeed + b.phase) * b.swayAmp;
        const by = clusterCenterY + b.relY + Math.cos(this.time * b.swaySpeed + b.phase) * (b.swayAmp * 0.6);

        this.spawnPopEffects(bx, by, b.color.main, b.radius);
        this.balloons.splice(idx, 1);
        this.shake(4.5);
        return true;
    }

    // Add bonus balloons (for PERFECT 0% diff)
    addBonusBalloons(count = 10, onEachAdded = null, onComplete = null) {
        let added = 0;
        const interval = setInterval(() => {
            if (added >= count) {
                clearInterval(interval);
                this.recalculateBalloonLayout();
                if (onComplete) onComplete();
                return;
            }
            const newBalloon = this.createBalloonObject(this.balloons.length, this.balloons.length + 1);
            newBalloon.scale = 0.1;
            this.balloons.push(newBalloon);
            this.recalculateBalloonLayout();

            const { anchorX, clusterCenterY } = this.getGondolaAnchor();
            this.spawnShockwave(anchorX + newBalloon.relX, clusterCenterY + newBalloon.relY, '#FFF780', 40);

            added++;
            if (onEachAdded) onEachAdded(added);
        }, 95);
    }

    spawnPopEffects(x, y, color, radius) {
        // 1. Expanding Shockwave Ring
        this.spawnShockwave(x, y, color, radius * 2.4);

        // 2. Rubber Shred Particles
        const count = 14;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
            const speed = 3.5 + Math.random() * 8.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: 4 + Math.random() * 6,
                color: i % 3 === 0 ? '#FFFFFF' : color,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.35,
                alpha: 1,
                gravity: 0.25
            });
        }

        // 3. Comic "POP!" star burst
        this.floatingTexts.push({
            text: Math.random() > 0.5 ? 'POP!' : 'バン!',
            x: x + (Math.random() - 0.5) * 20,
            y: y - 10,
            vy: -1.8,
            scale: 0.6,
            maxScale: 1.15,
            alpha: 1,
            color: color
        });
    }

    spawnShockwave(x, y, color, maxRadius = 60) {
        this.shockwaves.push({
            x,
            y,
            radius: 8,
            maxRadius,
            color,
            alpha: 1
        });
    }

    shake(amount = 6) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, amount);
    }

    triggerGameOverFall() {
        this.gondolaState = 'falling';
        this.gondolaVelocityY = -5; // Slight jump before plummeting
        this.shake(18);
    }

    triggerGameClearRise() {
        this.gondolaState = 'rising';
        this.gondolaVelocityY = -2.2;
        this.spawnConfetti(140);
    }

    spawnConfetti(amount = 100) {
        for (let i = 0; i < amount; i++) {
            const c = this.palette[i % this.palette.length].main;
            this.confetti.push({
                x: Math.random() * this.width,
                y: -20 - Math.random() * this.height * 0.6,
                vx: (Math.random() - 0.5) * 4,
                vy: 2.2 + Math.random() * 4.5,
                w: 8 + Math.random() * 8,
                h: 5 + Math.random() * 6,
                color: c,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2
            });
        }
    }

    animate() {
        this.time += 0.016;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    update() {
        // Update clouds
        for (const c of this.clouds) {
            c.x += c.speed;
            if (c.x > this.width + 200) {
                c.x = -220;
                c.y = 40 + Math.random() * (this.height * 0.5);
            }
        }

        // Update gondola physics for Game Over / Game Clear
        if (this.gondolaState === 'falling') {
            this.gondolaVelocityY += 0.58; // Gravity
            this.gondolaOffsetY += this.gondolaVelocityY;
            if (this.gondolaOffsetY > this.height * 0.55) {
                this.gondolaOffsetY = this.height * 0.55;
            }
        } else if (this.gondolaState === 'rising') {
            this.gondolaOffsetY += this.gondolaVelocityY;
            if (this.gondolaOffsetY < -this.height * 0.25) {
                this.gondolaOffsetY = -this.height * 0.25;
            }
        }

        // Smooth balloon scale-in
        for (const b of this.balloons) {
            if (b.scale < 1) {
                b.scale = Math.min(1, b.scale + 0.12);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.vRot;
            p.alpha -= 0.028;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i];
            s.radius += (s.maxRadius - s.radius) * 0.25;
            s.alpha -= 0.06;
            if (s.alpha <= 0) this.shockwaves.splice(i, 1);
        }

        // Update floating POP texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            if (ft.scale < ft.maxScale) ft.scale += 0.1;
            ft.alpha -= 0.035;
            if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
        }

        // Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const cf = this.confetti[i];
            cf.x += cf.vx + Math.sin(this.time * 3 + i) * 0.8;
            cf.y += cf.vy;
            cf.rot += cf.vRot;
            if (cf.y > this.height + 40 && this.gondolaState === 'rising') {
                cf.y = -20;
                cf.x = Math.random() * this.width;
            }
        }

        // Decay screen shake
        if (this.shakeMagnitude > 0.1) {
            this.shakeMagnitude *= 0.86;
        } else {
            this.shakeMagnitude = 0;
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake offset
        if (this.shakeMagnitude > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
            ctx.translate(dx, dy);
        }

        // 1. Sky Background changes dynamically with remaining balloons
        this.drawSkyBackground(ctx);

        // 2. Fluffy Clouds
        this.drawClouds(ctx);

        // 3. Anchor coordinates
        const { anchorX, anchorY, clusterCenterY } = this.getGondolaAnchor();

        // 4. Draw Strings from Gondola to each Balloon
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        for (let i = 0; i < this.balloons.length; i++) {
            const b = this.balloons[i];
            const bx = anchorX + b.relX + Math.sin(this.time * b.swaySpeed + b.phase) * b.swayAmp;
            const by = clusterCenterY + b.relY + Math.cos(this.time * b.swaySpeed + b.phase) * (b.swayAmp * 0.6);
            b.x = bx;
            b.y = by;

            ctx.moveTo(anchorX + (b.relX * 0.08), anchorY - 38);
            ctx.quadraticCurveTo(
                anchorX + b.relX * 0.45,
                (anchorY - 38 + by) * 0.5,
                bx,
                by + b.radius * 0.9
            );
        }
        ctx.stroke();

        // 5. Draw Gondola (Basket & Character silhouettes)
        this.drawGondola(ctx, anchorX, anchorY);

        // 6. Draw Balloons sorted by Y/layer for 3D depth
        for (let i = 0; i < this.balloons.length; i++) {
            this.drawSingleBalloon(ctx, this.balloons[i]);
        }

        // 7. Draw Shockwaves
        for (const s of this.shockwaves) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 4;
            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.stroke();
            ctx.restore();
        }

        // 8. Draw Pop Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65, 2);
            ctx.fill();
            ctx.restore();
        }

        // 9. Draw Comic POP Texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.translate(ft.x, ft.y);
            ctx.scale(ft.scale, ft.scale);
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = '900 18px "M PLUS Rounded 1c", sans-serif';
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeText(ft.text, 0, 0);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);
            ctx.restore();
        }

        // 10. Draw Confetti
        for (const cf of this.confetti) {
            ctx.save();
            ctx.translate(cf.x, cf.y);
            ctx.rotate(cf.rot);
            ctx.fillStyle = cf.color;
            ctx.fillRect(-cf.w / 2, -cf.h / 2, cf.w, cf.h);
            ctx.restore();
        }

        ctx.restore();
    }

    drawSkyBackground(ctx) {
        const count = this.balloons.length;
        const grad = ctx.createLinearGradient(0, 0, 0, this.height);

        if (count === 0 || this.gondolaState === 'falling') {
            // Danger / Stormy red-dark sky
            grad.addColorStop(0, '#2B0918');
            grad.addColorStop(0.5, '#6B1126');
            grad.addColorStop(1, '#B83227');
        } else if (count <= 15) {
            // Sunset tension sky
            grad.addColorStop(0, '#1A2980');
            grad.addColorStop(0.55, '#B24592');
            grad.addColorStop(1, '#F15F79');
        } else if (count <= 40) {
            // Golden afternoon sky
            grad.addColorStop(0, '#1FA2FF');
            grad.addColorStop(0.6, '#12D8FA');
            grad.addColorStop(1, '#F7B733');
        } else {
            // Bright TV-show blue sky
            grad.addColorStop(0, '#0072FF');
            grad.addColorStop(0.55, '#00C6FF');
            grad.addColorStop(1, '#B8F1FF');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawClouds(ctx) {
        for (const c of this.clouds) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(c.scale, c.scale);
            ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;

            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, Math.PI * 2);
            ctx.arc(32, -10, 46, 0, Math.PI * 2);
            ctx.arc(70, -4, 38, 0, Math.PI * 2);
            ctx.arc(35, 16, 36, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawSingleBalloon(ctx, b) {
        const r = b.radius * b.scale;
        if (r <= 0.5) return;

        ctx.save();
        ctx.translate(b.x, b.y);

        // Slight tilt following horizontal offset
        const tilt = (b.relX / 300) * 0.18 + Math.sin(this.time * 2 + b.phase) * 0.05;
        ctx.rotate(tilt);

        // Balloon knot at bottom
        ctx.fillStyle = b.color.dark;
        ctx.beginPath();
        ctx.moveTo(-4, r * 0.98);
        ctx.lineTo(4, r * 0.98);
        ctx.lineTo(0, r * 0.85);
        ctx.closePath();
        ctx.fill();

        // Main glossy 3D Balloon Oval
        const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.35, r * 0.08, 0, 0, r * 1.15);
        grad.addColorStop(0, b.color.light);
        grad.addColorStop(0.55, b.color.main);
        grad.addColorStop(1, b.color.dark);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle outer rim for TV pop look
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();

        // Specular gloss highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.16, r * 0.28, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawGondola(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Slight swing rotation
        const swing = this.gondolaState === 'falling'
            ? Math.sin(this.time * 18) * 0.22
            : Math.sin(this.time * 1.6) * 0.035;
        ctx.rotate(swing);

        // Rigging cables connecting basket to balloon strings hub
        ctx.strokeStyle = '#E0E6ED';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-36, 0);
        ctx.lineTo(-10, -40);
        ctx.moveTo(36, 0);
        ctx.lineTo(10, -40);
        ctx.stroke();

        // Metallic connector ring
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#996515';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-16, -44, 32, 10, 5);
        ctx.fill();
        ctx.stroke();

        // Cute passenger character inside basket
        const isPanicking = this.balloons.length <= 15 || this.gondolaState === 'falling';
        ctx.fillStyle = '#FFE0B2';
        ctx.beginPath();
        ctx.arc(0, -14, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes / Expression
        ctx.fillStyle = '#3E2723';
        if (isPanicking) {
            // > < panic eyes
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, -17); ctx.lineTo(-3, -14); ctx.lineTo(-7, -11);
            ctx.moveTo(7, -17); ctx.lineTo(3, -14); ctx.lineTo(7, -11);
            ctx.stroke();
            // Open mouth
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.arc(0, -8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(-4.5, -15, 2, 0, Math.PI * 2);
            ctx.arc(4.5, -15, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -12, 4, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }

        // Gondola Basket Body
        const basketGrad = ctx.createLinearGradient(-46, 0, 46, 48);
        basketGrad.addColorStop(0, '#D4883A');
        basketGrad.addColorStop(0.5, '#B5651D');
        basketGrad.addColorStop(1, '#7A3E0A');

        ctx.fillStyle = basketGrad;
        ctx.strokeStyle = '#4A2504';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(-44, 0);
        ctx.lineTo(44, 0);
        ctx.lineTo(34, 46);
        ctx.lineTo(-34, 46);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Basket weave stripes
        ctx.strokeStyle = 'rgba(74, 37, 4, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-39, 15); ctx.lineTo(39, 15);
        ctx.moveTo(-36, 30); ctx.lineTo(36, 30);
        ctx.moveTo(-20, 0); ctx.lineTo(-15, 46);
        ctx.moveTo(0, 0); ctx.lineTo(0, 46);
        ctx.moveTo(20, 0); ctx.lineTo(15, 46);
        ctx.stroke();

        // Top Gold Rim of Gondola
        ctx.fillStyle = '#FFCC00';
        ctx.strokeStyle = '#7A3E0A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-48, -6, 96, 12, 6);
        ctx.fill();
        ctx.stroke();

        // Show badge on basket
        ctx.fillStyle = '#E60033';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-24, 12, 48, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('% BALLOON', 0, 23);

        ctx.restore();
    }
}

window.BalloonEngine = BalloonEngine;
