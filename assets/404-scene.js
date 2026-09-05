(() => {
  const canvas = document.querySelector('.camp-atmosphere');
  const figure = canvas?.closest('.cryptid-camp');
  const svg = figure?.querySelector('svg');
  if (!canvas || !figure || !svg) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionReduced = () => reducedMotion.matches || document.documentElement.dataset.motion === 'reduced';
  const restrained = navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  let renderBudget = window.portfolio404Renderer?.budget || Object.freeze({ fps:12, pixelRatio:.6 });
  let targetInterval = 1000 / renderBudget.fps;
  const atmosphereProfiles = Object.freeze({
    clear: Object.freeze({ stars: 1, fog: 1, fireflies: 1, embers: 1 }),
    cloudy: Object.freeze({ stars: .25, fog: 1.25, fireflies: .7, embers: .9 }),
    misty: Object.freeze({ stars: .18, fog: 1.8, fireflies: .45, embers: .7 }),
    overcast: Object.freeze({ stars: .1, fog: 1.45, fireflies: .35, embers: .72 }),
    rainy: Object.freeze({ stars: .08, fog: 1.4, fireflies: .25, embers: .18 }),
    thunderstorm: Object.freeze({ stars: 0, fog: 1.65, fireflies: 0, embers: .06 }),
    wet: Object.freeze({ stars: .7, fog: 1.2, fireflies: .8, embers: .85 }),
    dry: Object.freeze({ stars: .9, fog: .45, fireflies: 1.1, embers: 1 }),
    snowy: Object.freeze({ stars: .35, fog: 1.55, fireflies: .18, embers: .25 }),
    drought: Object.freeze({ stars: .7, fog: .08, fireflies: .55, embers: 0 }),
    windy: Object.freeze({ stars: .82, fog: .48, fireflies: .35, embers: .72 }),
  });
  const profileFor = (condition) => atmosphereProfiles[condition] || atmosphereProfiles.clear;
  const random = (() => {
    let state = 0x404cafe;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  })();
  const range = (low, high) => low + (high - low) * random();

  const stars = Array.from({ length: restrained ? 34 : 58 }, () => ({
    x: range(20, 1180), y: range(22, 248), radius: range(.35, 1.05), phase: range(0, Math.PI * 2), speed: range(.09, .19), alpha: range(.12, .34)
  })).filter(({ x, y }) => Math.hypot(x - 1002, y - 118) > 70);
  const fireflies = Array.from({ length: restrained ? 12 : 20 }, () => ({
    x: range(45, 1155), y: range(470, 625), radius: range(1.1, 2.1), phase: range(0, Math.PI * 2), speed: range(.22, .42), drift: range(2, 7)
  })).filter(({ x }) => Math.abs(x - 610) > 100);
  const embers = Array.from({ length: restrained ? 4 : 7 }, () => ({
    x: range(-15, 15), lift: range(14, 38), sway: range(-5, 5), radius: range(.55, 1.15), phase: range(0, 1)
  }));
  const grain = Array.from({ length: restrained ? 80 : 150 }, () => ({
    x: random(), y: random(), radius: range(.25, .75), alpha: range(.012, .038)
  }));
  const createGlowSprite = (size, colors) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = size;
    const spriteContext = sprite.getContext('2d');
    const gradient = spriteContext.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    colors.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, size, size);
    return sprite;
  };
  const fireflyGlow = createGlowSprite(32, [[0, 'rgba(225,251,137,1)'], [.25, 'rgba(204,235,111,.45)'], [1, 'rgba(190,225,100,0)']]);
  const grainLayer = document.createElement('canvas');
  const grainContext = grainLayer.getContext('2d');

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let view = { scale: 1, x: 0, y: 0 };
  let frameId = 0;
  let previousTime = 0;
  let visible = !document.hidden;
  let overlayActive = document.documentElement.classList.contains('ui-overlay-open');
  let parallaxFrame = 0;
  const parallaxValues = new Map();
  let marshmallowExposure = 0;
  let atmosphere = profileFor(window.portfolioWeather?.condition);
  let motionProfile = window.portfolioSceneMotion?.profile || Object.freeze({ tempo:1, drift:.7, lift:1, glow:1, activity:1, play:1, water:1, smoke:1 });
  const fireStrength = Object.freeze({ clear:1, cloudy:.9, misty:.8, overcast:.8, rainy:.45, wet:.95, dry:1.08, snowy:.65, drought:0, windy:1.06, thunderstorm:.2 });
  const updateMarshmallowCook = () => {
    if (!visible || overlayActive) return;
    marshmallowExposure = Math.min(180, marshmallowExposure + (fireStrength[window.portfolioWeather?.condition] ?? 1));
    const cooked = marshmallowExposure / 180;
    figure.style.setProperty('--marshmallow-cook-level', (.12 + cooked * .7).toFixed(3));
    figure.style.setProperty('--marshmallow-mark-level', Math.min(.9, cooked * 1.1).toFixed(3));
    figure.style.setProperty('--marshmallow-blister-level', Math.max(0, (cooked - .22) * 1.4).toFixed(3));
    figure.style.setProperty('--marshmallow-char-level', Math.max(0, (cooked - .62) * 1.8).toFixed(3));
    figure.style.setProperty('--marshmallow-glint-level', Math.max(.18, .72 - cooked * .5).toFixed(3));
    figure.dataset.marshmallowCookLevel = cooked.toFixed(3);
  };
  const marshmallowTimer = window.setInterval(updateMarshmallowCook, 1000);
  const timeProfiles = Object.freeze({
    day: Object.freeze({ stars: 0, fireflies: .08, embers: .78 }),
    night: Object.freeze({ stars: 1, fireflies: 1, embers: 1 }),
    morning: Object.freeze({ stars: .08, fireflies: .18, embers: .82 }),
    evening: Object.freeze({ stars: .18, fireflies: .65, embers: 1 }),
    twilight: Object.freeze({ stars: .58, fireflies: .88, embers: 1 }),
  });
  const profileForTime = (state = {}) => {
    if (state.cycle !== 'dynamic') return timeProfiles[state.time] || timeProfiles.night;
    const darkness = Math.min(1, Math.max(0, state.darkness ?? 1));
    return { stars: darkness, fireflies: .08 + darkness * .92, embers: .78 + darkness * .22 };
  };
  let timeProfile = profileForTime(window.portfolioSceneTime?.state);
  const densityForWidth = (viewportWidth) => viewportWidth <= 430 ? 'compact' : viewportWidth <= 760 ? 'reduced' : 'full';

  const stableParallaxPixel = (value) => (Math.round(value * 2) / 2).toFixed(2);
  const setParallaxProperty = (name, value) => {
    const next = `${stableParallaxPixel(value)}px`;
    if (parallaxValues.get(name) === next) return;
    parallaxValues.set(name, next);
    figure.style.setProperty(name, next);
  };
  const setParallax = (x = 0, y = 0) => {
    setParallaxProperty('--parallax-back-x', -x * .7);
    setParallaxProperty('--parallax-back-y', -y * .3);
    setParallaxProperty('--parallax-far-x', -x * 1.5);
    setParallaxProperty('--parallax-far-y', -y * .7);
    setParallaxProperty('--parallax-mid-x', x * 2.6);
    setParallaxProperty('--parallax-mid-y', y * 1.3);
    setParallaxProperty('--parallax-near-x', x * 5.2);
    setParallaxProperty('--parallax-near-y', y * 2.5);
  };

  figure.addEventListener('pointermove', (event) => {
    if (motionReduced() || overlayActive || event.pointerType === 'touch') return;
    figure.classList.add('is-parallax-tracking');
    const bounds = figure.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = requestAnimationFrame(() => setParallax(x, y));
  }, { passive: true });
  const resetParallax = () => {
    cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    figure.classList.remove('is-parallax-tracking');
    setParallax();
  };
  figure.addEventListener('pointerleave', resetParallax);
  figure.addEventListener('pointercancel', resetParallax);
  window.addEventListener('blur', resetParallax);

  const resize = () => {
    const bounds = figure.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    figure.dataset.sceneDensity = densityForWidth(width);
    pixelRatio = Math.min(devicePixelRatio || 1, renderBudget.pixelRatio);
    view = sceneTransform();
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    grainLayer.width = Math.round(width * pixelRatio);
    grainLayer.height = Math.round(height * pixelRatio);
    grainContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    grainContext.clearRect(0, 0, width, height);
    grainContext.fillStyle = 'rgb(202 218 207)';
    grain.forEach((speck) => {
      grainContext.globalAlpha = speck.alpha;
      grainContext.fillRect(speck.x * width, speck.y * height, speck.radius, speck.radius);
    });
    grainContext.globalAlpha = 1;
    draw(motionReduced() ? 7.25 : performance.now() / 1000);
  };

  const sceneTransform = () => {
    const figureBounds = figure.getBoundingClientRect();
    const svgBounds = svg.getBoundingClientRect();
    const scale = Math.max(svgBounds.width / 1200, svgBounds.height / 760);
    return {
      scale,
      x: svgBounds.left - figureBounds.left + (svgBounds.width - 1200 * scale) / 2,
      y: svgBounds.top - figureBounds.top + svgBounds.height - 760 * scale
    };
  };

  const paintGlow = (x, y, radius, stops) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const point = (x, y) => [view.x + x * view.scale, view.y + y * view.scale];

    context.save();
    context.globalCompositeOperation = 'screen';

    stars.forEach((star) => {
      const [x, y] = point(star.x, star.y);
      const luminance = star.alpha * atmosphere.stars * timeProfile.stars * (.72 + .28 * Math.sin(time * star.speed + star.phase));
      context.fillStyle = `rgba(218,236,232,${luminance})`;
      context.beginPath();
      context.arc(x, y, Math.max(.45, star.radius * view.scale), 0, Math.PI * 2);
      context.fill();
    });

    const fogTime = motionReduced() ? 0 : time * .018 / motionProfile.tempo;
    [[330, 492, 245, 25, .038], [865, 515, 295, 32, .045], [620, 575, 215, 22, .032]].forEach(([x, y, rx, ry, alpha], index) => {
      const [cx, cy] = point(x + Math.sin(fogTime + index * 1.8) * 13 * (.7 + motionProfile.drift * .12), y);
      const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, rx * view.scale);
      gradient.addColorStop(0, `rgba(184,207,199,${alpha * atmosphere.fog})`);
      gradient.addColorStop(.62, `rgba(128,166,157,${alpha * atmosphere.fog * .55})`);
      gradient.addColorStop(1, 'rgba(100,140,134,0)');
      context.save();
      context.translate(cx, cy);
      context.scale(1, ry / rx);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, rx * view.scale, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });

    const [fireX, fireY] = point(610, 656);
    const firePulse = motionReduced() ? 1 : .975 + .025 * motionProfile.activity * Math.sin(time * 2.4 / motionProfile.tempo) + .012 * motionProfile.play * Math.sin(time * 4.1 / motionProfile.tempo + 1.2);
    paintGlow(fireX, fireY, 176 * view.scale * firePulse * (.9 + motionProfile.glow * .1), [[0, `rgba(255,170,70,${.105 * motionProfile.glow})`], [.38, `rgba(242,103,48,${.052 * motionProfile.glow})`], [1, 'rgba(242,90,40,0)']]);

    fireflies.forEach((fly) => {
      const wave = .5 + .5 * Math.sin(time * fly.speed / motionProfile.tempo + fly.phase);
      const alpha = (.045 + .3 * wave * wave) * atmosphere.fireflies * timeProfile.fireflies * motionProfile.activity;
      const [x, y] = point(fly.x + Math.sin(time * .13 / motionProfile.tempo + fly.phase) * fly.drift * motionProfile.play, fly.y + Math.cos(time * .1 / motionProfile.tempo + fly.phase) * 2.5 * motionProfile.play);
      const glowSize = 16 * view.scale;
      context.globalAlpha = alpha;
      context.drawImage(fireflyGlow, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
      context.globalAlpha = 1;
      context.fillStyle = `rgba(234,255,159,${Math.min(.52, alpha + .12)})`;
      context.beginPath();
      context.arc(x, y, Math.max(.7, fly.radius * view.scale), 0, Math.PI * 2);
      context.fill();
    });

    embers.forEach((ember) => {
      const progress = (time * .1 / motionProfile.tempo + ember.phase) % 1;
      const alpha = Math.sin(progress * Math.PI) * .36 * atmosphere.embers * timeProfile.embers;
      const x = fireX + (ember.x + ember.sway * progress * motionProfile.play + Math.sin(time * .7 / motionProfile.tempo + ember.phase * 9) * 1.5 * motionProfile.drift) * view.scale;
      const y = fireY - (8 + ember.lift * progress * motionProfile.lift) * view.scale;
      context.fillStyle = `rgba(255,196,91,${alpha})`;
      context.beginPath();
      context.arc(x, y, Math.max(.6, ember.radius * view.scale * (1 - progress * .45)), 0, Math.PI * 2);
      context.fill();
    });

    context.globalCompositeOperation = 'soft-light';
    context.drawImage(grainLayer, 0, 0, grainLayer.width, grainLayer.height, 0, 0, width, height);
    context.restore();
  };

  const animate = (timestamp) => {
    if (!visible || motionReduced() || overlayActive) return;
    frameId = requestAnimationFrame(animate);
    if (timestamp - previousTime < targetInterval) return;
    previousTime = timestamp;
    draw(timestamp / 1000);
  };

  const updateMotion = () => {
    cancelAnimationFrame(frameId);
    if (motionReduced()) {
      draw(7.25);
    } else if (visible && !overlayActive) {
      previousTime = 0;
      frameId = requestAnimationFrame(animate);
    }
  };

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (!visible) resetParallax();
    updateMotion();
  });
  window.addEventListener('pagehide', () => window.clearInterval(marshmallowTimer), { once:true });
  window.addEventListener('ui-overlay-change', (event) => {
    overlayActive = Boolean(event.detail?.active);
    if (overlayActive) resetParallax();
    updateMotion();
  });
  window.addEventListener('portfolio-render-budget-change', (event) => {
    renderBudget = event.detail;
    targetInterval = 1000 / renderBudget.fps;
    resize();
    updateMotion();
  });
  reducedMotion.addEventListener?.('change', () => { resetParallax(); updateMotion(); });
  window.portfolioAppearance?.subscribe(() => { resetParallax(); updateMotion(); });
  window.portfolioWeather?.subscribe(({ condition }) => {
    atmosphere = profileFor(condition);
    figure.dataset.atmosphereCondition = condition;
    draw(motionReduced() ? 7.25 : performance.now() / 1000);
  });
  window.portfolioSceneTime?.subscribe((state) => {
    timeProfile = profileForTime(state);
    figure.dataset.atmosphereTime = state.time;
    figure.dataset.atmosphereCycle = state.cycle;
    draw(motionReduced() ? 7.25 : performance.now() / 1000);
  });
  window.portfolioSceneMotion?.subscribe((profile) => {
    motionProfile = profile;
    figure.dataset.atmosphereMotion = profile.signature;
    draw(motionReduced() ? 7.25 : performance.now() / 1000);
  });
  figure.dataset.atmosphereCondition = window.portfolioWeather?.condition || 'clear';
  figure.dataset.atmosphereTime = window.portfolioSceneTime?.time || 'night';
  figure.dataset.atmosphereCycle = window.portfolioSceneTime?.cycle || 'fixed';
  figure.dataset.atmosphereMotion = motionProfile.signature || 'night-clear';
  new ResizeObserver(resize).observe(figure);
  resize();
  figure.classList.add('hybrid-effects-ready');
  updateMotion();
})();
