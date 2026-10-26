/**
 * NIJAASWINI — Cinematic Illustrated Author Scrubbing Engine
 * 
 * HTML5 Canvas & requestAnimationFrame rendering engine.
 * Supports:
 * - Mouse horizontal scrubbing
 * - Touch interaction with vertical scroll passthrough
 * - Eased interpolation (lerp)
 * - Progressive frame preloading with progress telemetry
 * - Instant poster display (zero blank flash)
 * - Graceful fallback to interactive ambient canvas if sequence is unavailable
 * - DevicePixelRatio crisp rendering
 * - Configurable resting pose & idle settling
 * - Reduced-motion accessibility preference
 * - Memory & event listener cleanup
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CharacterScrubber = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function parseObjectPosition(posStr) {
    if (!posStr) return { x: 0.5, y: 0.5 };
    const parts = posStr.trim().split(/\s+/);
    const parseVal = (val) => {
      if (val === 'center') return 0.5;
      if (val === 'left' || val === 'top') return 0;
      if (val === 'right' || val === 'bottom') return 1;
      if (val.endsWith('%')) return parseFloat(val) / 100;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0.5 : parsed;
    };
    return {
      x: parts.length >= 1 ? parseVal(parts[0]) : 0.5,
      y: parts.length >= 2 ? parseVal(parts[1]) : 0.5
    };
  }

  function getFrameUrl(template, index) {
    const numStr3 = String(index).padStart(3, '0');
    const numStr2 = String(index).padStart(2, '0');
    const numStr = String(index);
    return template
      .replace('{fff}', numStr3)
      .replace('{ff}', numStr2)
      .replace('{f}', numStr)
      .replace('{000}', numStr3)
      .replace('{00}', numStr2)
      .replace('{index}', numStr);
  }

  function drawCover(ctx, img, canvasWidth, canvasHeight, alignX, alignY, offsetX = 0, offsetY = 0, scaleMult = 1) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight;
    if (imgRatio > canvasRatio) {
      drawHeight = canvasHeight * scaleMult;
      drawWidth = drawHeight * imgRatio;
    } else {
      drawWidth = canvasWidth * scaleMult;
      drawHeight = drawWidth / imgRatio;
    }

    const maxDeltaX = drawWidth - canvasWidth;
    const maxDeltaY = drawHeight - canvasHeight;

    const dx = -maxDeltaX * alignX + offsetX;
    const dy = -maxDeltaY * alignY + offsetY;

    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  }

  function initScrubVideo(userConfig = {}) {
    const defaultConfig = {
      FRAME_SRC: 'assets/frames/frame-{fff}.webp',
      POSTER_SRC: 'assets/images/nijaaswini-hero.png',
      FRAME_COUNT: 300,
      FPS: 30,
      OBJECT_POSITION: 'center 8%',
      SENSITIVITY: 0.85,
      EASE: 0.12,
      IDLE_MS: 1500,
      NEUTRAL: 0.5, // 50% resting pose (frame 150)
      canvas: null,
      container: null,
      onProgress: null,
      onStatusChange: null
    };

    let config = { ...defaultConfig, ...userConfig };

    let canvas = config.canvas;
    let ownCanvas = false;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'character-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      if (config.container) {
        config.container.appendChild(canvas);
      } else {
        document.body.appendChild(canvas);
      }
      ownCanvas = true;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // State
    const duration = config.FRAME_COUNT / config.FPS;
    let currentTime = duration * config.NEUTRAL;
    let targetTime = currentTime;
    let prevX = null;
    let isInteracting = false;
    let lastInputTime = performance.now();
    let isDestroyed = false;
    let rafId = null;

    // Poster state
    let posterImg = new Image();
    let posterLoaded = false;
    posterImg.crossOrigin = 'anonymous';
    posterImg.src = config.POSTER_SRC;
    posterImg.onload = () => {
      posterLoaded = true;
      requestDraw();
    };

    // Frame sequence state
    const frames = new Array(config.FRAME_COUNT);
    let framesLoadedCount = 0;
    let sequenceAvailable = false;
    let probingFinished = false;

    // Subtle ambient particle floating state for rich cinematic look
    const particles = [];
    const PARTICLE_COUNT = 24;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.0003,
        speedY: -Math.random() * 0.0006 - 0.0002,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2
      });
    }

    function emitStatus(extra = {}) {
      if (typeof config.onStatusChange === 'function') {
        const frameIndex = Math.min(config.FRAME_COUNT, Math.max(1, Math.round((currentTime / duration) * (config.FRAME_COUNT - 1)) + 1));
        const status = {
          currentTime: Number(currentTime.toFixed(3)),
          targetTime: Number(targetTime.toFixed(3)),
          frameIndex,
          totalFrames: config.FRAME_COUNT,
          sensitivity: config.SENSITIVITY,
          ease: config.EASE,
          isInteracting,
          usingPoster: !sequenceAvailable,
          framesLoaded: framesLoadedCount,
          sequenceAvailable,
          probingFinished,
          ...extra
        };
        config.onStatusChange(status);
      }
    }

    function emitProgress() {
      if (typeof config.onProgress === 'function') {
        const ratio = config.FRAME_COUNT > 0 ? framesLoadedCount / config.FRAME_COUNT : 0;
        config.onProgress(ratio, framesLoadedCount, config.FRAME_COUNT);
      }
    }

    // Probe first frame to verify if sequence exists
    function probeSequence() {
      const probeImg = new Image();
      probeImg.src = getFrameUrl(config.FRAME_SRC, 1);
      probeImg.onload = () => {
        sequenceAvailable = true;
        probingFinished = true;
        loadSequenceProgressively();
      };
      probeImg.onerror = () => {
        sequenceAvailable = false;
        probingFinished = true;
        emitProgress();
        emitStatus({ statusText: 'Poster Reference (Sequence Pending)' });
      };
    }

    function loadSequenceProgressively() {
      // Load neutral frame first
      const neutralIndex = Math.round(config.FRAME_COUNT * config.NEUTRAL);
      loadSingleFrame(neutralIndex, () => {
        requestDraw();
        // Then load in batches outward
        for (let i = 1; i <= config.FRAME_COUNT; i++) {
          if (i !== neutralIndex) {
            loadSingleFrame(i);
          }
        }
      });
    }

    function loadSingleFrame(index, cb) {
      const img = new Image();
      img.src = getFrameUrl(config.FRAME_SRC, index);
      img.onload = () => {
        frames[index - 1] = img;
        framesLoadedCount++;
        emitProgress();
        emitStatus();
        if (cb) cb();
      };
      img.onerror = () => {
        // graceful handle
        framesLoadedCount++;
        emitProgress();
      };
    }

    // Responsive Canvas Resizing with DPR cap to protect GPU memory
    function resizeCanvas() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || canvas.parentElement?.clientWidth || window.innerWidth;
      const height = rect.height || canvas.parentElement?.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      requestDraw();
    }

    // Rendering
    function renderFrame(now) {
      if (isDestroyed || !ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Lerp current time toward target time
      if (!prefersReducedMotion) {
        currentTime += (targetTime - currentTime) * config.EASE;

        // Idle settling back to resting pose
        if (!isInteracting && (now - lastInputTime > config.IDLE_MS)) {
          const neutralTime = duration * config.NEUTRAL;
          targetTime += (neutralTime - targetTime) * (config.EASE * 0.4);
        }
      } else {
        currentTime = duration * config.NEUTRAL;
      }

      const normPos = parseObjectPosition(config.OBJECT_POSITION);
      const currentNorm = currentTime / duration; // 0 to 1
      const frameIndex = Math.min(config.FRAME_COUNT, Math.max(1, Math.round(currentNorm * (config.FRAME_COUNT - 1)) + 1));

      let activeImage = null;
      if (sequenceAvailable && frames[frameIndex - 1] && frames[frameIndex - 1].complete) {
        activeImage = frames[frameIndex - 1];
      } else if (posterLoaded) {
        activeImage = posterImg;
      }

      if (activeImage && activeImage.complete) {
        // If using poster, calculate interactive perspective shift based on current scrub time
        let subtleShiftX = 0;
        let subtleShiftY = 0;
        let subtleScale = 1.0;

        if (!sequenceAvailable) {
          // Interactive subtle 3D parallax shift so moving mouse responds dynamically even with poster
          const deltaFromNeutral = (currentNorm - config.NEUTRAL) * 2; // -1 to 1
          subtleShiftX = deltaFromNeutral * (width * 0.025);
          subtleShiftY = Math.sin(now * 0.0015) * (height * 0.005);
          subtleScale = 1.0 + Math.abs(deltaFromNeutral) * 0.015;
        }

        drawCover(
          ctx,
          activeImage,
          width,
          height,
          normPos.x,
          normPos.y,
          subtleShiftX,
          subtleShiftY,
          subtleScale
        );
      }

      // Atmospheric golden literary particles layer (subtle, warm, cinematic)
      drawAtmosphere(ctx, width, height, now);

      emitStatus();

      rafId = requestAnimationFrame(renderFrame);
    }

    function drawAtmosphere(context, w, h, time) {
      context.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const px = p.x * w;
        const py = p.y * h;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(time * 0.002 + p.pulse));

        context.beginPath();
        context.arc(px, py, p.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(216, 178, 110, ${alpha.toFixed(2)})`; // warm antique gold
        context.fill();
      }
      context.restore();
    }

    function requestDraw() {
      // Loop is handled by RAF, but ensures a frame is queued
      if (!rafId && !isDestroyed) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    // Scrub Interactions
    function handlePointerDown(e) {
      if (prefersReducedMotion) return;
      isInteracting = true;
      prevX = e.clientX || (e.touches && e.touches[0].clientX);
      lastInputTime = performance.now();
    }

    function handlePointerMove(e) {
      if (prefersReducedMotion) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      if (currentX === undefined) return;

      if (prevX === null) {
        prevX = currentX;
        return;
      }

      const deltaX = currentX - prevX;
      prevX = currentX;

      const viewportWidth = window.innerWidth || 1000;
      const offset = (deltaX / viewportWidth) * config.SENSITIVITY * duration;

      targetTime = Math.max(0, Math.min(duration, targetTime + offset));
      lastInputTime = performance.now();
      isInteracting = true;
    }

    function handlePointerUp() {
      isInteracting = false;
      prevX = null;
      lastInputTime = performance.now();
    }

    // Attach scrub events to the stage or window
    const scrubTarget = config.container || window;

    scrubTarget.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp, { passive: true });

    // Touch support (using passive touchmove to allow smooth vertical page scroll)
    scrubTarget.addEventListener('touchstart', handlePointerDown, { passive: true });
    scrubTarget.addEventListener('touchmove', handlePointerMove, { passive: true });
    scrubTarget.addEventListener('touchend', handlePointerUp, { passive: true });
    scrubTarget.addEventListener('touchcancel', handlePointerUp, { passive: true });

    // Window resize
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Initialize
    resizeCanvas();
    probeSequence();
    rafId = requestAnimationFrame(renderFrame);

    return {
      updateConfig(newOpts) {
        config = { ...config, ...newOpts };
        emitStatus();
      },
      setFrame(index) {
        const norm = (index - 1) / (config.FRAME_COUNT - 1);
        targetTime = norm * duration;
        lastInputTime = performance.now();
      },
      destroy() {
        isDestroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        scrubTarget.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        scrubTarget.removeEventListener('touchstart', handlePointerDown);
        scrubTarget.removeEventListener('touchmove', handlePointerMove);
        scrubTarget.removeEventListener('touchend', handlePointerUp);
        scrubTarget.removeEventListener('touchcancel', handlePointerUp);
        window.removeEventListener('resize', resizeCanvas);
        if (ownCanvas && canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
      },
      getState() {
        return {
          currentTime,
          targetTime,
          duration,
          sequenceAvailable,
          framesLoadedCount
        };
      }
    };
  }

  return { initScrubVideo };
});
