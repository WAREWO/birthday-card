(() => {
  const root = document.documentElement;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('main');
  const viewer = document.getElementById('photo-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerStage = viewer.querySelector('.viewer-stage');
  const viewerTitle = document.getElementById('photo-viewer-title');
  let lastPhotoButton;

  // Add photo controls only when this enhancement is available.
  main.querySelectorAll('.photo-image, .oval-portrait').forEach(frame => {
    const image = frame.querySelector('img');
    if (!image) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-open';
    button.setAttribute('aria-label', `Perbesar foto: ${image.alt || 'foto bareng Mamah'}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = '<span aria-hidden="true">⤢</span>';
    frame.appendChild(button);
  });

  function fitPhoto() {
    if (!viewer.open || !viewerImage.naturalWidth) return;
    const sideways = viewerImage.classList.contains('is-sideways');
    const width = sideways ? viewerImage.naturalHeight : viewerImage.naturalWidth;
    const height = sideways ? viewerImage.naturalWidth : viewerImage.naturalHeight;
    const scale = Math.min(viewerStage.clientWidth / width, viewerStage.clientHeight / height, 1);
    viewerImage.style.width = `${viewerImage.naturalWidth * scale}px`;
    viewerImage.style.height = `${viewerImage.naturalHeight * scale}px`;
  }

  main.addEventListener('click', event => {
    const button = event.target.closest('.photo-open');
    if (!button) return;
    const image = button.parentElement.querySelector('img');
    lastPhotoButton = button;
    viewerImage.removeAttribute('style');
    viewerImage.classList.toggle('is-sideways', image.classList.contains('turn-photo'));
    viewerImage.alt = image.alt;
    viewerTitle.textContent = image.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
    viewerImage.onload = fitPhoto;
    viewerImage.src = image.currentSrc || image.src;
    viewer.showModal();
    root.classList.add('photo-is-open');
    requestAnimationFrame(fitPhoto);
  });
  document.getElementById('close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    // A click on the backdrop has coordinates outside the dialog rectangle.
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
    if (event.target === viewerStage) viewer.close();
  });
  viewer.addEventListener('close', () => {
    root.classList.remove('photo-is-open');
    lastPhotoButton?.focus({ preventScroll: true });
  });
  window.addEventListener('resize', fitPhoto);

  // Existing collage rotations stay in place; translate/scale add a separate layer.
  const reveals = [...main.querySelectorAll('.photo, .oval-portrait, .birthday-card, .memory-note, .wall-note, .wish-paper, .together-heading, .letter-page h2, .handwritten-letter p, .signature, .closing h2, .closing-signature')];
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${index % 3 * 75}ms`);
      revealObserver.observe(element);
    });
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('motion-active', entry.isIntersecting));
    }, { threshold: 0 });
    main.querySelectorAll('section, .closing').forEach(section => sectionObserver.observe(section));
    root.classList.add('motion-ready');
  }

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  let scrollFrame;
  function updateProgress() {
    scrollFrame = null;
    const available = root.scrollHeight - innerHeight;
    progress.style.setProperty('--progress', available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 1);
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  const petals = document.createElement('div');
  petals.className = 'ambient-petals';
  petals.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 6; i++) {
    const petal = document.createElement('span');
    petal.textContent = i % 2 ? '♡' : '✿';
    petal.style.cssText = `--left:${7 + i * 17}%;--duration:${17 + i % 3 * 3}s;--delay:${-i * 4}s;--drift:${i % 2 ? -35 : 35}px;`;
    petals.appendChild(petal);
  }
  document.body.appendChild(petals);
  function pauseMotion() { root.classList.toggle('motion-paused', document.hidden || viewer.open); }
  document.addEventListener('visibilitychange', pauseMotion);
  viewer.addEventListener('close', pauseMotion);
  viewer.addEventListener('toggle', pauseMotion);
  // Pause the decoration while a photo is open even on browsers without toggle events.
  new MutationObserver(pauseMotion).observe(viewer, { attributes: true, attributeFilter: ['open'] });
  pauseMotion();

  const loveButton = document.getElementById('send-love');
  const loveMessage = document.getElementById('love-message');
  loveButton.closest('.love-surprise').hidden = false;
  const burstLayer = document.createElement('div');
  burstLayer.className = 'love-bursts';
  burstLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(burstLayer);
  loveButton.addEventListener('click', () => {
    loveMessage.hidden = false;
    loveButton.setAttribute('aria-expanded', 'true');
    loveButton.innerHTML = 'Peluk lagi <span aria-hidden="true">♡</span>';
    if (motionPreference.matches || !Element.prototype.animate) return;
    const rect = loveButton.getBoundingClientRect();
    // Keep repeated taps bounded, particularly on phones.
    while (burstLayer.children.length > 24) burstLayer.firstElementChild.remove();
    for (let i = 0; i < 12; i++) {
      const heart = document.createElement('span');
      heart.textContent = i % 3 ? '♥' : '✿';
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top + rect.height / 2}px`;
      heart.style.color = ['#b74673', '#dd81a5', '#8c9d59'][i % 3];
      burstLayer.appendChild(heart);
      const x = (Math.random() - .5) * Math.min(innerWidth * .7, 420);
      const animation = heart.animate([
        { transform: 'translate(-50%, -50%) scale(.5)', opacity: 0 },
        { opacity: 1, offset: .15 },
        { transform: `translate(calc(-50% + ${x}px), -180px) rotate(${x / 3}deg) scale(1.15)`, opacity: 0 },
      ], { duration: 1350 + Math.random() * 400, easing: 'cubic-bezier(.15,.65,.4,1)', fill: 'forwards' });
      animation.finished.then(() => heart.remove(), () => heart.remove());
    }
  });

  // Background song, starting at 0:51. Browsers may block sound until the first tap, click or key press,
  // so the song also starts on that first interaction.
  const music = document.getElementById('bg-music');
  const SONG_START = 51;
  // Scrolling is tried too, though most browsers only allow sound after a tap, click or key press.
  const startEvents = ['pointerdown', 'click', 'touchstart', 'touchend', 'keydown', 'wheel', 'scroll'];
  function jumpToStart() { if (music.currentTime < SONG_START) music.currentTime = SONG_START; }
  function playMusic() {
    if (music.readyState >= 1) jumpToStart();
    return music.play().catch(() => {});
  }
  function startOnFirstTouch() {
    if (!music.paused) return;
    playMusic().then(() => {
      if (!music.paused) startEvents.forEach(type => removeEventListener(type, startOnFirstTouch, { capture: true }));
    });
  }
  music.addEventListener('loadedmetadata', jumpToStart);
  music.addEventListener('ended', () => { music.currentTime = SONG_START; music.play().catch(() => {}); });
  startEvents.forEach(type => addEventListener(type, startOnFirstTouch, { capture: true, passive: true }));
  playMusic();
})();
