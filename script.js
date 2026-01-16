    document.documentElement.classList.add('js');

    document.getElementById('year').textContent = new Date().getFullYear();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;

          if (e.target.classList.contains('reveal')) e.target.classList.add('in');
          if (e.target.classList.contains('observe-problem')) e.target.classList.add('in');
          if (e.target.classList.contains('observe-card')) e.target.classList.add('in');
          if (e.target.classList.contains('observe-step')) e.target.classList.add('in');
          if (e.target.classList.contains('observe-cta')) e.target.classList.add('in');

          if (e.target.classList.contains('observe')) e.target.classList.add('in-view');

          io.unobserve(e.target);
        });
      }, { threshold: 0.18 });

      document.querySelectorAll('.reveal, .observe, .observe-problem, .observe-card, .observe-step, .observe-cta')
        .forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.reveal, .observe, .observe-problem, .observe-card, .observe-step, .observe-cta')
        .forEach(el => {
          el.classList.add('in');
          if (el.classList.contains('observe')) el.classList.add('in-view');
        });
    }

    document.querySelectorAll('.observe-problem').forEach((el, i) => el.style.transitionDelay = (i * 70) + 'ms');
    document.querySelectorAll('.observe-card').forEach((el, i) => el.style.transitionDelay = (i * 90) + 'ms');
    document.querySelectorAll('.observe-step').forEach((el, i) => el.style.transitionDelay = (i * 110) + 'ms');

    const companyInput = document.getElementById("companyInput");
    const brandTitle = document.getElementById("brandTitle");
    const logoInput = document.getElementById("logoInput");
    const logoPreview = document.getElementById("logoPreview");
    const palettePreview = document.getElementById("palettePreview");
    const generateBtn = document.getElementById("generateBtn");
    const presetButtons = Array.from(document.querySelectorAll(".presetBtn"));
    const canvas = document.getElementById("paletteCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      console.warn('Canvas not supported, palette extraction disabled');
      logoInput.disabled = true;
      logoInput.style.opacity = '0.5';
    }

    if (!window.FileReader) {
      console.warn('FileReader not supported, logo upload disabled');
      logoInput.disabled = true;
      logoInput.style.opacity = '0.5';
    }

    const presetPalettes = {
      minimalist: ["#000000", "#ffffff", "#000000"],
      mint: ["#2a9d8f", "#264653", "#e9c46a"],
      orchard: ["#7f5539", "#b08968", "#f1dca7"],
      ocean: ["#1e3a8a", "#3b82f6", "#06b6d4"],
      forest: ["#166534", "#16a34a", "#65a30d"]
    };

    let selectedPreset = "minimalist";
    let logoPalette = null;
    let uploadedLogo = null;

    companyInput.addEventListener("input", () => {
      // Removed: brandTitle update on input
    });

    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        selectedPreset = btn.dataset.palette;
        logoPalette = null;
        renderPalettePreview(presetPalettes[selectedPreset]);
      });
    });

    logoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG).');
        event.target.value = '';
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      const brandLogo = document.querySelector('.brand img');
      reader.onload = () => {
        logoPreview.src = reader.result;
        uploadedLogo = reader.result;
        extractPalette(reader.result);
      };
      reader.onerror = () => {
        alert('Error reading the file. Please try again.');
        event.target.value = '';
        logoPreview.src = '';
        uploadedLogo = null;
        brandLogo.src = 'logo.png';
      };
      reader.readAsDataURL(file);
    });

    function extractPalette(dataUrl) {
      const image = new Image();
      image.onload = () => {
        try {
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(image, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          const buckets = new Map();
          const step = 10;
          for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
            buckets.set(key, (buckets.get(key) || 0) + 1);
          }
          const ranked = Array.from(buckets.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([key]) => {
              const [r, g, b] = key.split("-").map((n) => parseInt(n, 10) * 32);
              return toHex(r, g, b);
            });
          logoPalette = ranked.length ? ranked : null;
          renderPalettePreview(ranked);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing the image. Please try a different image.');
          logoPalette = null;
          renderPalettePreview(presetPalettes[selectedPreset]);
        }
      };
      image.onerror = () => {
        alert('Error loading the image. Please try a different image.');
        logoPalette = null;
        renderPalettePreview(presetPalettes[selectedPreset]);
      };
      image.src = dataUrl;
    }

    function renderPalettePreview(colors) {
      palettePreview.innerHTML = "";
      colors.forEach((color) => {
        const swatch = document.createElement("span");
        swatch.className = "paletteSwatch";
        swatch.style.background = color;
        palettePreview.appendChild(swatch);
      });
    }

    function toHex(r, g, b) {
      const toChannel = (c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0");
      return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
    }
    function mix(colorA, colorB, ratio) {
      const a = hexToRgb(colorA);
      const b = hexToRgb(colorB);
      if (!a || !b) return colorA;
      const mixChannel = (c1, c2) => Math.round(c1 + (c2 - c1) * ratio);
      return toHex(mixChannel(a.r, b.r), mixChannel(a.g, b.g), mixChannel(a.b, b.b));
    }

    function hexToRgb(hex) {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) return null;
      const num = parseInt(clean, 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    function rgba(hex, alpha) {
      const rgb = hexToRgb(hex);
      if (!rgb) return `rgba(12,12,12,${alpha})`;
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    function textColorFor(bg) {
      const rgb = hexToRgb(bg);
      if (!rgb) return "#0c0c0c";
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      return lum > 0.6 ? "#0c0c0c" : "#f8fafc";
    }

    function applyPalette(colors) {
      const [primary, secondary, accent] = colors;
      const bg = mix(primary, "#ffffff", 0.86);
      const ink = textColorFor(bg);
      const muted = mix(ink, bg, 0.6);
      const surface = mix(secondary, "#ffffff", 0.88);
      const surfaceStrong = mix(secondary, "#ffffff", 0.75);
      const surfaceSoft = mix(secondary, "#ffffff", 0.94);

      const root = document.documentElement.style;
      root.setProperty("--primary", primary);
      root.setProperty("--secondary", secondary);
      root.setProperty("--accent", accent || primary);
      root.setProperty("--bg", bg);
      root.setProperty("--ink", ink);
      root.setProperty("--muted", muted);
      root.setProperty("--soft", rgba(ink, 0.08));
      root.setProperty("--soft2", rgba(ink, 0.12));
      root.setProperty("--surface", surface);
      root.setProperty("--surface-strong", surfaceStrong);
      root.setProperty("--surface-soft", surfaceSoft);
    }

    function triggerAnimation() {
      document.body.classList.remove("theme-animate");
      void document.body.offsetWidth;
      document.body.classList.add("theme-animate");
    }

    generateBtn.addEventListener("click", () => {
      const palette = logoPalette && logoPalette.length >= 3
        ? logoPalette
        : presetPalettes[selectedPreset];
      applyPalette(palette);
      triggerAnimation();
      // Update brand title on generate
      const company = companyInput.value.trim().toUpperCase() || "LUMOS STUDIO";
      brandTitle.textContent = company;
      // Update brand logo on generate if uploaded
      if (uploadedLogo) {
        const brandLogo = document.querySelector('.brand img');
        brandLogo.src = uploadedLogo;
      }
      // Update product names
      document.getElementById('product1').textContent = company + " Product 1";
      document.getElementById('product2').textContent = company + " Product 2";
      document.getElementById('product3').textContent = company + " Product 3";
      // Hide hero, show products
      document.querySelector('header').style.display = 'none';
      productSection.style.display = 'block';
    });

    renderPalettePreview(presetPalettes[selectedPreset]);

    // Pyramid canvas
    const pyramidCanvas = document.getElementById("pyramidCanvas");
    const stage = document.getElementById("stage");
    const pyramidCtx = pyramidCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let canvasWidth = 0;
    let canvasHeight = 0;

    let size = 0;
    let basePoints = [];
    let apex = {x: 0, y: 0, z: 0};

    let rotationY = 0;
    let rotationX = 0;
    let rotationZ = 0;
    let paused = false;
    let lastInteraction = performance.now();
    const resetDelay = 2200;
    const resetEase = 0.06;

    function resizePyramid() {
      const rect = stage.getBoundingClientRect();
      canvasWidth = Math.max(1, rect.width);
      canvasHeight = Math.max(1, rect.height);
      pyramidCanvas.width = Math.floor(canvasWidth * dpr);
      pyramidCanvas.height = Math.floor(canvasHeight * dpr);
      pyramidCanvas.style.width = `${canvasWidth}px`;
      pyramidCanvas.style.height = `${canvasHeight}px`;
      pyramidCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      size = Math.min(canvasWidth, canvasHeight) / 6;
      basePoints = [
        {x: -size, y: 0, z: -size},
        {x: size, y: 0, z: -size},
        {x: size, y: 0, z: size},
        {x: -size, y: 0, z: size}
      ];
      apex = {x: 0, y: -size * 2, z: 0};
    }

    resizePyramid();
    window.addEventListener("resize", resizePyramid);

    function rotateY(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos
      };
    }

    function rotateX(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos
      };
    }

    function rotateZ(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.y * sin,
        y: point.x * sin + point.y * cos,
        z: point.z
      };
    }

    function rotatePoint(point) {
      let rotated = rotateY(point, rotationY);
      rotated = rotateX(rotated, rotationX);
      return rotated;
    }

    function project(point) {
      const scale = 400 / (400 + point.z);
      return {
        x: point.x * scale,
        y: point.y * scale
      };
    }

    function createStripePattern() {
      const patternCanvas = document.createElement('canvas');
      const stripeSize = 8;
      patternCanvas.width = 20;
      patternCanvas.height = stripeSize * 2;
      const pctx = patternCanvas.getContext('2d');
      pctx.fillStyle = '#000000';
      pctx.fillRect(0, stripeSize, patternCanvas.width, stripeSize); // bottom half black, top half transparent
      return pyramidCtx.createPattern(patternCanvas, 'repeat');
    }

    const stripePattern = createStripePattern();

    function drawPyramid() {
      pyramidCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      pyramidCtx.save();
      const rotatedBase = basePoints.map(rotatePoint);
      const rotatedApex = rotatePoint(apex);
      const projectedBase = rotatedBase.map(project);
      const projectedApex = project(rotatedApex);
      const allPoints = projectedBase.concat(projectedApex);
      const minX = Math.min(...allPoints.map((p) => p.x));
      const maxX = Math.max(...allPoints.map((p) => p.x));
      const minY = Math.min(...allPoints.map((p) => p.y));
      const maxY = Math.max(...allPoints.map((p) => p.y));
      const offsetX = (canvasWidth * 0.5) - ((minX + maxX) * 0.5);
      const offsetY = (canvasHeight * 0.5) - ((minY + maxY) * 0.5);

      // Draw base
      pyramidCtx.beginPath();
      projectedBase.forEach((p, i) => {
        const x = p.x + offsetX;
        const y = p.y + offsetY;
        if (i === 0) pyramidCtx.moveTo(x, y);
        else pyramidCtx.lineTo(x, y);
      });
      pyramidCtx.closePath();
      pyramidCtx.fillStyle = '#000000';
      pyramidCtx.fill();

      // Draw front face
      pyramidCtx.beginPath();
      pyramidCtx.moveTo(projectedBase[0].x + offsetX, projectedBase[0].y + offsetY);
      pyramidCtx.lineTo(projectedBase[1].x + offsetX, projectedBase[1].y + offsetY);
      pyramidCtx.lineTo(projectedApex.x + offsetX, projectedApex.y + offsetY);
      pyramidCtx.closePath();
      pyramidCtx.fillStyle = stripePattern;
      pyramidCtx.fill();

      // Draw right face
      pyramidCtx.beginPath();
      pyramidCtx.moveTo(projectedBase[1].x + offsetX, projectedBase[1].y + offsetY);
      pyramidCtx.lineTo(projectedBase[2].x + offsetX, projectedBase[2].y + offsetY);
      pyramidCtx.lineTo(projectedApex.x + offsetX, projectedApex.y + offsetY);
      pyramidCtx.closePath();
      pyramidCtx.fillStyle = stripePattern;
      pyramidCtx.fill();

      // Draw back face
      pyramidCtx.beginPath();
      pyramidCtx.moveTo(projectedBase[2].x + offsetX, projectedBase[2].y + offsetY);
      pyramidCtx.lineTo(projectedBase[3].x + offsetX, projectedBase[3].y + offsetY);
      pyramidCtx.lineTo(projectedApex.x + offsetX, projectedApex.y + offsetY);
      pyramidCtx.closePath();
      pyramidCtx.fillStyle = stripePattern;
      pyramidCtx.fill();

      // Draw left face
      pyramidCtx.beginPath();
      pyramidCtx.moveTo(projectedBase[3].x + offsetX, projectedBase[3].y + offsetY);
      pyramidCtx.lineTo(projectedBase[0].x + offsetX, projectedBase[0].y + offsetY);
      pyramidCtx.lineTo(projectedApex.x + offsetX, projectedApex.y + offsetY);
      pyramidCtx.closePath();
      pyramidCtx.fillStyle = stripePattern;
      pyramidCtx.fill();

      pyramidCtx.restore();
    }

    function animate() {
      if (!paused) {
        rotationY += 0.01;
        const now = performance.now();
        if (now - lastInteraction > resetDelay) {
          rotationX += (0 - rotationX) * resetEase;
          rotationZ += (0 - rotationZ) * resetEase;
        }
      }
      drawPyramid();
      requestAnimationFrame(animate);
    }

    animate();

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let didDrag = false;
    let wasPaused = false;

    pyramidCanvas.addEventListener("pointerdown", (event) => {
      pyramidCanvas.setPointerCapture(event.pointerId);
      isDragging = true;
      didDrag = false;
      lastX = event.clientX;
      lastY = event.clientY;
      wasPaused = paused;
      paused = true;
      lastInteraction = performance.now();
    });

    pyramidCanvas.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        didDrag = true;
      }
      const rotSpeed = 0.006;
      rotationY += dx * rotSpeed;
      rotationX += dy * rotSpeed;
      rotationX = Math.max(-1.2, Math.min(1.2, rotationX));
      lastX = event.clientX;
      lastY = event.clientY;
      lastInteraction = performance.now();
    });

    function endDrag(event) {
      if (!isDragging) return;
      isDragging = false;
      pyramidCanvas.releasePointerCapture(event.pointerId);
      if (!didDrag) {
        paused = !wasPaused;
      } else {
        paused = wasPaused;
      }
    }

    pyramidCanvas.addEventListener("pointerup", endDrag);
    pyramidCanvas.addEventListener("pointercancel", endDrag);
    pyramidCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

    // Product section
    const productSection = document.getElementById('productSection');
    const backBtn = document.getElementById('backBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const track = document.querySelector('.carousel-track');
    let currentIndex = 0;

    function updateTransform() {
      const offset = -currentIndex * 278; // 260 + 18
      track.style.transform = `translateX(${offset}px)`;
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateTransform();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = Math.min(2, currentIndex + 1);
      updateTransform();
    });

    backBtn.addEventListener('click', () => {
      document.querySelector('header').style.display = 'block';
      productSection.style.display = 'none';
      // Reset
      brandTitle.textContent = "LUMOS STUDIO";
      const brandLogo = document.querySelector('.brand img');
      brandLogo.src = "logo.png";
      selectedPreset = "minimalist";
      logoPalette = null;
      uploadedLogo = null;
      companyInput.value = "";
      logoInput.value = "";
      logoPreview.src = "";
      // Reset preset buttons
      presetButtons.forEach(btn => btn.setAttribute("aria-pressed", "false"));
      document.querySelector('[data-palette="minimalist"]').setAttribute("aria-pressed", "true");
      // Reset palette to primary
      applyPalette(presetPalettes["minimalist"]);
    });
