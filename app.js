/**
 * Phone-First Birthday Cake & Candle Interactive Experience
 * Dynamic Background Photo Gallery, Ken-Burns Transitions, Floating Memory Cards,
 * Story Showcase & Instant Mic Blow Detection
 */

// ==========================================================================
// 📸 CURATED BIRTHDAY & MEMORY PHOTOS (Default library)
// Users can customize/upload more via the Photo Manager or photos/ folder!
// ==========================================================================
const DEFAULT_BIRTHDAY_PHOTOS = [
  {
    url: 'photos/photo1.jpg',
    caption: '✨ Happy Birthday to the sweetest soul! 🥂',
    quote: '"Here\'s to you — the one who lights up every room and makes every moment magical. Wishing you a birthday as beautiful as you are! 🎂✨"'
  },
  {
    url: 'photos/photo2.jpg',
    caption: '🎈 Cheers to endless adventures & laughter! 🎉',
    quote: '"Every adventure is better with you in it. May this year bring you a thousand new stories, laughs, and unforgettable memories! 🌟🎈"'
  },
  {
    url: 'photos/photo3.jpg',
    caption: '💖 May all your sweetest dreams come true! 🎂',
    quote: '"You deserve every good thing life has to offer — mountains of joy, rivers of laughter, and a heart full of love. Happy Birthday! 💖🎂"'
  },
  {
    url: 'photos/photo4.jpg',
    caption: '🌟 Shine bright like the star you are! ✨',
    quote: '"You have this incredible ability to make the world a little brighter just by being in it. Never stop shining, superstar! 🌟✨"'
  },
  {
    url: 'photos/photo5.jpg',
    caption: '🥂 Celebrating our most favorite human! 💖',
    quote: '"Cheers to the most wonderful, hilarious, caring, and irreplaceable person I know. The world is a genuinely better place with you in it! 🥂💫"'
  },
  {
    url: 'photos/photo6.jpg',
    caption: '🎉 Wishing you the most magical year ahead! 🌈',
    quote: '"May this new year of your life be filled with open doors, brand new dreams coming true, and every happiness you\'ve ever imagined! 🎉🌈"'
  },
  {
    url: 'photos/photo7.jpg',
    caption: '🎈 Never stop smiling & shining! ✨',
    quote: '"Your smile is one of the most beautiful things in the world. Promise me you\'ll keep sharing it — because it makes everything better! 😊🎈"'
  },
  {
    url: 'photos/photo8.jpg',
    caption: '💖 Forever grateful for every memory together! 📸',
    quote: '"Thank you for every laugh, every memory, every moment we\'ve shared. Grateful doesn\'t even begin to cover it. Here\'s to many more! 💖📸"'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Cake & Stage
  const cakeElement = document.getElementById('cakeElement');
  const candleFlame = document.getElementById('candleFlame');
  const ambientGlow = document.getElementById('ambientGlow');
  const particleCanvas = document.getElementById('particleCanvas');
  const heroName = document.getElementById('heroName');
  const headerNameTag = document.getElementById('headerNameTag');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const blowBtn = document.getElementById('blowBtn');
  const micStatusPill = document.getElementById('micStatusPill');
  const micStatusText = document.getElementById('micStatusText');
  const micPulseDot = document.getElementById('micPulseDot');
  const micMeterFill = document.getElementById('micMeterFill');
  const hintText = document.getElementById('hintText');

  // Story Pop-up Modal Elements
  const storyOverlay = document.getElementById('storyOverlay');
  const storyCard = document.getElementById('storyCard');
  const closeStoryBtn = document.getElementById('closeStoryBtn');
  const relightBtn = document.getElementById('relightBtn');
  const storyFriendName = document.getElementById('storyFriendName');
  const storyPhotoImg = document.getElementById('storyPhotoImg');
  const storyPhotoCaption = document.getElementById('storyPhotoCaption');
  const storyProgress = document.getElementById('storyProgress');
  const touchPrev = document.getElementById('touchPrev');
  const touchNext = document.getElementById('touchNext');
  const photoWrapper = document.getElementById('photoWrapper');

  // Background Photo Layers & Modals
  const bgPhotosContainer = document.getElementById('bgPhotosContainer');
  const bgSlideA = document.getElementById('bgSlideA');
  const bgSlideB = document.getElementById('bgSlideB');
  const floatingPhotosCloud = document.getElementById('floatingPhotosCloud');
  const photoCustomizerBtn = document.getElementById('photoCustomizerBtn');

  // Lightbox Elements
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');

  // Manager Elements
  const managerOverlay = document.getElementById('managerOverlay');
  const closeManagerBtn = document.getElementById('closeManagerBtn');
  const saveManagerBtn = document.getElementById('saveManagerBtn');
  const uploadDropzone = document.getElementById('uploadDropzone');
  const photoFileInput = document.getElementById('photoFileInput');
  const photoUrlInput = document.getElementById('photoUrlInput');
  const addUrlPhotoBtn = document.getElementById('addUrlPhotoBtn');
  const managerPhotosGrid = document.getElementById('managerPhotosGrid');
  const photoCountBadge = document.getElementById('photoCountBadge');
  const resetPhotosBtn = document.getElementById('resetPhotosBtn');

  // Initialize Engines
  const particles = new ParticleEngine(particleCanvas);
  const audio = window.audioEngine;

  // State
  let isLit = true;
  let isCelebrating = false;
  let isMicActive = false;
  let currentStoryIndex = 0;
  let currentLightboxIndex = 0;
  let storyTimer = null;

  // Configuration
  const config = {
    name: 'Bestie',
    message: 'Wishing you a day filled with laughter, delicious cake, love, and all your biggest dreams coming true! Happy Birthday! 💖✨',
    photos: loadSavedPhotos()
  };

  /**
   * Load photos from LocalStorage or Default
   */
  function loadSavedPhotos() {
    try {
      const saved = localStorage.getItem('birthday_custom_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return [...DEFAULT_BIRTHDAY_PHOTOS];
  }

  /**
   * Save photos to LocalStorage
   */
  function savePhotosToStorage() {
    try {
      localStorage.setItem('birthday_custom_photos', JSON.stringify(config.photos));
    } catch (e) { }
  }

  /**
   * Parse URL Query / Hash for custom name & message
   */
  function parseUrlParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const getParam = (key) => urlParams.get(key) || hashParams.get(key);

      if (getParam('name')) config.name = decodeURIComponent(getParam('name'));
      if (getParam('msg')) config.message = decodeURIComponent(getParam('msg'));

      const photoParam = getParam('photos');
      if (photoParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(photoParam));
          if (Array.isArray(parsed) && parsed.length > 0) {
            config.photos = parsed.map((p, idx) => typeof p === 'string' ? { url: p, caption: `Memory #${idx + 1} with ${config.name} 💖` } : p);
          }
        } catch (e) { }
      }
    } catch (e) { }
  }

  /**
   * ==========================================================================
   * 🌟 BACKGROUND PHOTO ENGINE: CINEMATIC SLIDESHOW & FLOATING MEMORIES
   * ==========================================================================
   */
  class BackgroundPhotoEngine {
    constructor() {
      this.slotsCount = 6;
      this.cards = [];
      this.activeSlideIsA = true;
      this.currentBgIndex = 0;
      this.cardIndices = [];
      this.slideTimer = null;
      this.cardTransitionTimer = null;
      this.nextCardSlotToUpdate = 0;
      this.mouseParallaxX = 0;
      this.mouseParallaxY = 0;

      this.init();
    }

    init() {
      this.setupBackdrop();
      this.setupFloatingCards();
      this.startBackdropLoop();
      this.startCardTransitionLoop();
      this.setupParallaxListeners();
    }

    /**
     * Setup Dual-layer Backdrop for smooth Ken-Burns crossfades
     */
    setupBackdrop() {
      if (!config.photos || config.photos.length === 0) return;
      bgSlideA.style.backgroundImage = `url("${config.photos[0].url}")`;
      bgSlideA.classList.add('active');
      bgSlideB.classList.remove('active');
      if (config.photos.length > 1) {
        bgSlideB.style.backgroundImage = `url("${config.photos[1].url}")`;
      }
    }

    /**
     * Start continuous background slideshow crossfade
     */
    startBackdropLoop() {
      if (this.slideTimer) clearInterval(this.slideTimer);
      if (config.photos.length <= 1) return;

      this.slideTimer = setInterval(() => {
        this.currentBgIndex = (this.currentBgIndex + 1) % config.photos.length;
        const nextPhoto = config.photos[this.currentBgIndex];

        if (this.activeSlideIsA) {
          bgSlideB.style.backgroundImage = `url("${nextPhoto.url}")`;
          bgSlideB.classList.add('active');
          bgSlideA.classList.remove('active');
        } else {
          bgSlideA.style.backgroundImage = `url("${nextPhoto.url}")`;
          bgSlideA.classList.add('active');
          bgSlideB.classList.remove('active');
        }
        this.activeSlideIsA = !this.activeSlideIsA;
      }, 10000);
    }

    /**
     * Create floating Polaroid memory cards around the cake
     */
    setupFloatingCards() {
      floatingPhotosCloud.innerHTML = '';
      this.cards = [];
      this.cardIndices = [];

      const totalPhotos = config.photos.length;
      if (totalPhotos === 0) return;

      for (let i = 0; i < this.slotsCount; i++) {
        const photoIndex = i % totalPhotos;
        this.cardIndices.push(photoIndex);
        const photo = config.photos[photoIndex];

        const card = document.createElement('div');
        card.className = `floating-card slot-${i}`;
        card.dataset.slotIndex = i;
        card.dataset.photoIndex = photoIndex;

        // Tape accent variety (tape / pin)
        let accentHtml = '';
        if (i % 3 === 0) {
          accentHtml = `<div class="card-tape tape-left"></div>`;
        } else if (i % 3 === 1) {
          accentHtml = `<div class="card-tape tape-right"></div>`;
        } else {
          accentHtml = `<div class="card-pin">📌</div>`;
        }

        card.innerHTML = `
          ${accentHtml}
          <div class="card-img-wrap">
            <img class="card-img" src="${photo.url}" alt="${photo.caption || 'Memory'}" loading="lazy">
          </div>
          <p class="card-caption">${photo.caption || `Memory ✨`}</p>
        `;

        // Click opens full preview in lightbox
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          audio.init();
          audio.playPop();
          openLightbox(this.cardIndices[i]);
        });

        floatingPhotosCloud.appendChild(card);
        this.cards.push(card);
      }
    }

    /**
     * Staggered dynamic transitions: one-by-one card photo flips & fades
     */
    startCardTransitionLoop() {
      if (this.cardTransitionTimer) clearInterval(this.cardTransitionTimer);
      if (config.photos.length <= 1) return;

      this.cardTransitionTimer = setInterval(() => {
        if (this.cards.length === 0) return;

        const slotIndex = this.nextCardSlotToUpdate % this.cards.length;
        this.nextCardSlotToUpdate++;

        const card = this.cards[slotIndex];
        if (!card) return;

        // Pick next photo in pool
        const currentIdx = this.cardIndices[slotIndex];
        const nextIdx = (currentIdx + this.slotsCount) % config.photos.length;
        this.cardIndices[slotIndex] = nextIdx;
        const nextPhoto = config.photos[nextIdx];

        // Randomize transition style: 3D Flip or Smooth Zoom-Fade
        const useFlip = (slotIndex % 2 === 0);

        if (useFlip) {
          card.classList.add('flip-transition');
          setTimeout(() => {
            const img = card.querySelector('.card-img');
            const caption = card.querySelector('.card-caption');
            if (img) img.src = nextPhoto.url;
            if (caption) caption.textContent = nextPhoto.caption || 'Memory ✨';
          }, 350);

          setTimeout(() => {
            card.classList.remove('flip-transition');
          }, 800);
        } else {
          card.classList.add('fade-transition');
          setTimeout(() => {
            const img = card.querySelector('.card-img');
            const caption = card.querySelector('.card-caption');
            if (img) img.src = nextPhoto.url;
            if (caption) caption.textContent = nextPhoto.caption || 'Memory ✨';
          }, 320);

          setTimeout(() => {
            card.classList.remove('fade-transition');
          }, 700);
        }

      }, 10000); // Trigger transition every 10s across alternating slots
    }

    /**
     * Refresh photos engine when user adds/deletes photos
     */
    refresh() {
      this.setupBackdrop();
      this.setupFloatingCards();
      this.startBackdropLoop();
      this.startCardTransitionLoop();
    }

    /**
     * 3D Parallax with mouse movement / device tilt
     */
    setupParallaxListeners() {
      let ticking = false;

      window.addEventListener('pointermove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        this.mouseParallaxX = (e.clientX - cx) / cx;
        this.mouseParallaxY = (e.clientY - cy) / cy;

        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (floatingPhotosCloud) {
              const moveX = this.mouseParallaxX * 16;
              const moveY = this.mouseParallaxY * 14;
              const rotX = -this.mouseParallaxY * 5;
              const rotY = this.mouseParallaxX * 6;
              floatingPhotosCloud.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // Initialize Background Photo Engine
  const bgPhotoEngine = new BackgroundPhotoEngine();

  /**
   * ==========================================================================
   * 🔍 PHOTO LIGHTBOX PREVIEW MODAL
   * ==========================================================================
   */
  function openLightbox(index) {
    if (!config.photos || config.photos.length === 0) return;
    currentLightboxIndex = (index + config.photos.length) % config.photos.length;
    const photo = config.photos[currentLightboxIndex];

    lightboxImg.src = photo.url;
    lightboxCaption.textContent = photo.caption || `Memory with ${config.name} 💖`;
    lightboxOverlay.classList.add('active');
  }

  function closeLightbox() {
    lightboxOverlay.classList.remove('active');
    audio.playClick();
  }

  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });

  lightboxPrevBtn.addEventListener('click', () => {
    audio.playClick();
    openLightbox(currentLightboxIndex - 1);
  });

  lightboxNextBtn.addEventListener('click', () => {
    audio.playClick();
    openLightbox(currentLightboxIndex + 1);
  });

  /**
   * ==========================================================================
   * 📁 PHOTO MANAGER & UPLOADER MODAL
   * ==========================================================================
   */
  function openPhotoManager() {
    audio.init();
    audio.playPop();
    renderManagerPhotosList();
    managerOverlay.classList.add('active');
  }

  function closePhotoManager() {
    managerOverlay.classList.remove('active');
    audio.playClick();
  }

  function renderManagerPhotosList() {
    photoCountBadge.textContent = config.photos.length;
    managerPhotosGrid.innerHTML = '';

    config.photos.forEach((photo, idx) => {
      const item = document.createElement('div');
      item.className = 'manager-photo-item';
      item.innerHTML = `
        <img src="${photo.url}" alt="${photo.caption || 'Photo'}">
        <button class="manager-delete-btn" data-delete-idx="${idx}" title="Delete Photo">✕</button>
      `;

      const delBtn = item.querySelector('.manager-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playPop();
        config.photos.splice(idx, 1);
        savePhotosToStorage();
        renderManagerPhotosList();
        bgPhotoEngine.refresh();
        applyConfig();
      });

      managerPhotosGrid.appendChild(item);
    });
  }

  // Open & Close manager
  if (photoCustomizerBtn) photoCustomizerBtn.addEventListener('click', openPhotoManager);
  if (closeManagerBtn) closeManagerBtn.addEventListener('click', closePhotoManager);
  if (saveManagerBtn) saveManagerBtn.addEventListener('click', closePhotoManager);
  managerOverlay.addEventListener('click', (e) => {
    if (e.target === managerOverlay) closePhotoManager();
  });

  // Reset to default presets
  resetPhotosBtn.addEventListener('click', () => {
    audio.playClick();
    config.photos = [...DEFAULT_BIRTHDAY_PHOTOS];
    savePhotosToStorage();
    renderManagerPhotosList();
    bgPhotoEngine.refresh();
    applyConfig();
  });

  // Add photo by URL
  function addPhotoFromInput() {
    const url = photoUrlInput.value.trim();
    if (!url) return;
    config.photos.push({
      url: url,
      caption: `✨ Special memory with ${config.name}! 💖`
    });
    photoUrlInput.value = '';
    savePhotosToStorage();
    renderManagerPhotosList();
    bgPhotoEngine.refresh();
    applyConfig();
    audio.playPop();
  }

  addUrlPhotoBtn.addEventListener('click', addPhotoFromInput);
  photoUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPhotoFromInput();
  });

  // Drag & drop / File input upload
  uploadDropzone.addEventListener('click', () => photoFileInput.click());

  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.classList.add('drag-over');
  });

  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('drag-over');
  });

  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  });

  photoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFiles(e.target.files);
      photoFileInput.value = '';
    }
  });

  function handleImageFiles(files) {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          config.photos.unshift({
            url: loadEvent.target.result,
            caption: `✨ Photo memory with ${config.name}! 💖`
          });
          savePhotosToStorage();
          renderManagerPhotosList();
          bgPhotoEngine.refresh();
          applyConfig();
        };
        reader.readAsDataURL(file);
      }
    });
    audio.playPop();
  }

  /**
   * ==========================================================================
   * 🎂 APP CONFIGURATION & STORY SHOWCASE
   * ==========================================================================
   */
  function applyConfig() {
    heroName.textContent = config.name;
    headerNameTag.textContent = `${config.name}'s Birthday 🎂`;
    storyFriendName.textContent = config.name;

    setupStoryProgressBars();
    updateStoryPhoto(0);
  }

  /**
   * Story Progress Indicators (Instagram / Story style segments)
   */
  function setupStoryProgressBars() {
    storyProgress.innerHTML = '';
    config.photos.forEach((_, idx) => {
      const seg = document.createElement('div');
      seg.className = `progress-segment ${idx === 0 ? 'active' : ''}`;
      seg.addEventListener('click', () => {
        currentStoryIndex = idx;
        updateStoryPhoto(idx);
        restartStoryTimer();
      });
      storyProgress.appendChild(seg);
    });
  }

  /**
   * Update Story Photo with Smooth Fade Transition
   */
  function updateStoryPhoto(index) {
    if (!config.photos || config.photos.length === 0) return;

    if (index >= config.photos.length) currentStoryIndex = 0;
    else if (index < 0) currentStoryIndex = config.photos.length - 1;
    else currentStoryIndex = index;

    const current = config.photos[currentStoryIndex];
    const storyNote = document.getElementById('storyNote');

    // Fade out photo + quote together
    storyPhotoImg.classList.add('fade-out');
    if (storyNote) storyNote.classList.add('story-note-fade-out');

    setTimeout(() => {
      // Swap photo
      storyPhotoImg.src = current.url;
      storyPhotoCaption.textContent = current.caption || `✨ Memory with ${config.name} 💖`;
      storyPhotoImg.classList.remove('fade-out');

      // Swap quote — use photo's own quote, fall back to config.message, then a generic one
      if (storyNote) {
        storyNote.textContent = current.quote || `"${config.message}"`;
        storyNote.classList.remove('story-note-fade-out');
      }
    }, 180);

    // Update Progress Segments
    const segments = storyProgress.querySelectorAll('.progress-segment');
    segments.forEach((seg, idx) => {
      seg.classList.toggle('active', idx === currentStoryIndex);
    });
  }

  /**
   * Auto Advance Story Slideshow
   */
  function startStoryTimer() {
    stopStoryTimer();
    if (config.photos.length > 1) {
      storyTimer = setInterval(() => {
        if (storyOverlay.classList.contains('active')) {
          currentStoryIndex = (currentStoryIndex + 1) % config.photos.length;
          updateStoryPhoto(currentStoryIndex);
        }
      }, 10000);
    }
  }

  function stopStoryTimer() {
    if (storyTimer) {
      clearInterval(storyTimer);
      storyTimer = null;
    }
  }

  function restartStoryTimer() {
    stopStoryTimer();
    startStoryTimer();
  }

  // Tap left / right navigation on story modal photo
  touchPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.playClick();
    updateStoryPhoto(currentStoryIndex - 1);
    restartStoryTimer();
  });

  touchNext.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.playClick();
    updateStoryPhoto(currentStoryIndex + 1);
    restartStoryTimer();
  });

  // Touch Swipe Gesture Detection for Mobile Story
  let touchStartX = 0;
  let touchEndX = 0;

  photoWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  photoWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) updateStoryPhoto(currentStoryIndex - 1);
      else updateStoryPhoto(currentStoryIndex + 1);
      restartStoryTimer();
    }
  }, { passive: true });

  /**
   * Get pixel coordinates of candle wick
   */
  function getCandleWickCoordinates() {
    const wick = document.querySelector('.candle-wick');
    if (!wick) return [{ x: window.innerWidth / 2, y: window.innerHeight * 0.45 }];
    const rect = wick.getBoundingClientRect();
    return [{
      x: rect.left + rect.width / 2,
      y: rect.top + 2
    }];
  }

  /**
   * Extinguish Candle & Trigger Grand Celebration Story Pop-up
   */
  function extinguishCandles() {
    if (!isLit) return;
    isLit = false;
    isCelebrating = true;

    const candleItem = document.querySelector('.candle-item');
    const flame = candleFlame || document.querySelector('.candle-flame');

    // Visual flame extinguish
    if (candleItem) candleItem.classList.add('extinguished');
    if (flame) {
      flame.classList.add('flame-extinguishing', 'extinguished');
      flame.style.display = 'none';
      flame.style.opacity = '0';
      flame.style.visibility = 'hidden';
      flame.style.transform = 'scale(0.01) translateY(-15px)';
    }

    document.body.classList.add('blown-out');

    if (blowBtn) {
      blowBtn.disabled = true;
      blowBtn.classList.add('blown');
      blowBtn.innerHTML = '<span class="btn-icon">🎉</span><span class="btn-text">Candle Blown!</span>';
    }

    // SFX
    audio.playExtinguish();

    // Realistic smoke wisps from wick
    const wickCoords = getCandleWickCoordinates();
    particles.startSmoke(wickCoords, 4000);

    heroSubtitle.textContent = '🎉 Happy Birthday! Celebration time! ✨';
    micStatusText.textContent = '💨 Candle Blown Out!';
    if (micMeterFill) micMeterFill.style.width = '0%';

    // Celebration phase
    setTimeout(() => {
      document.body.classList.add('celebration-mode');

      // Fanfare & Confetti
      audio.playHappyBirthdayFanfare();
      audio.playPop();

      particles.launchConfettiBlast(220);
      particles.launchBalloons(16);

      setTimeout(() => particles.launchConfettiBlast(140), 700);

      // Open mobile celebration story pop-up
      setTimeout(() => {
        storyOverlay.classList.add('active');
        startStoryTimer();
      }, 750);

    }, 350);
  }

  /**
   * Relight candles
   */
  function relightCandles() {
    isLit = true;
    isCelebrating = false;
    stopStoryTimer();

    document.body.classList.remove('blown-out', 'celebration-mode');
    storyOverlay.classList.remove('active');

    const candleItem = document.querySelector('.candle-item');
    if (candleItem) candleItem.classList.remove('extinguished');

    const flame = candleFlame || document.querySelector('.candle-flame');
    if (flame) {
      flame.classList.remove('flame-extinguishing', 'extinguished');
      flame.style.display = '';
      flame.style.opacity = '';
      flame.style.visibility = '';
      flame.style.transform = '';
    }

    if (blowBtn) {
      blowBtn.disabled = false;
      blowBtn.classList.remove('blown');
      blowBtn.innerHTML = '<span class="btn-icon">💨</span><span class="btn-text">Tap to Blow Out</span>';
    }

    audio.playRelight();

    heroSubtitle.textContent = 'Blow into your mic or tap the flame 🕯️';
    if (isMicActive) {
      micStatusText.textContent = '🎙️ Mic listening • Blow into mic! 💨';
    } else {
      micStatusText.textContent = '🎙️ Enable Mic to Blow • Or Tap 💨';
    }
  }

  /**
   * Ultra-Sensitive Blow Detector
   */
  const blowDetector = new BlowDetector({
    threshold: 12,
    onBlowIntensity: (intensity, score) => {
      const flame = candleFlame || document.querySelector('.candle-flame');

      if (!isLit) {
        if (flame) {
          flame.style.display = 'none';
          flame.style.opacity = '0';
          flame.style.visibility = 'hidden';
        }
        if (micMeterFill) micMeterFill.style.width = '0%';
        return;
      }

      if (flame) {
        if (intensity > 0.02) {
          const bendAngle = (Math.random() - 0.5) * 8 + (intensity * 38);
          const stretchScale = Math.max(0.25, 1 - intensity * 0.6);
          const squishScale = 1 + intensity * 0.45;
          flame.style.transform = `rotate(${bendAngle}deg) scaleY(${stretchScale}) scaleX(${squishScale})`;
          flame.style.opacity = `${Math.max(0.25, 1 - intensity * 0.75)}`;
        } else {
          flame.style.transform = '';
          flame.style.opacity = '';
        }
      }

      if (micMeterFill) {
        micMeterFill.style.width = `${Math.min(100, Math.round(intensity * 100))}%`;
      }
    },
    onBlowDetected: () => {
      if (isLit) {
        extinguishCandles();
      }
    },
    onStatusChange: (status) => {
      if (status === 'listening') {
        isMicActive = true;
        micStatusText.textContent = '🎙️ Mic Active • Blow into mic! 💨';
        if (micPulseDot) micPulseDot.className = 'pulse-dot active';
        if (micStatusPill) micStatusPill.classList.add('mic-active');
      } else if (status === 'requesting') {
        micStatusText.textContent = '⏳ Requesting microphone...';
        if (micPulseDot) micPulseDot.className = 'pulse-dot requesting';
      } else if (status === 'denied') {
        isMicActive = false;
        micStatusText.textContent = '👆 Mic blocked • Tap flame or cake to blow 🕯️';
        if (micPulseDot) micPulseDot.className = 'pulse-dot denied';
        if (micStatusPill) micStatusPill.classList.remove('mic-active');
      } else if (status === 'unsupported') {
        isMicActive = false;
        micStatusText.textContent = '👆 Tap flame or button to blow 🕯️';
        if (micPulseDot) micPulseDot.className = 'pulse-dot denied';
        if (micStatusPill) micStatusPill.classList.remove('mic-active');
      }
    }
  });

  /**
   * Pointer hover near candle flame
   */
  document.addEventListener('pointermove', (e) => {
    if (!isLit || isMicActive) return;
    const flame = candleFlame || document.querySelector('.candle-flame');
    if (!flame) return;
    const rect = flame.getBoundingClientRect();
    const distX = e.clientX - (rect.left + rect.width / 2);
    const distY = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(distX * distX + distY * distY);

    if (dist < 160) {
      const factor = (160 - dist) / 160;
      const angle = (-distX / 160) * 22 * factor;
      flame.style.transform = `rotate(${angle}deg) scaleY(${1 - factor * 0.15})`;
    } else {
      flame.style.transform = '';
    }
  });

  /**
   * Activate Microphone & Web Audio Engine
   */
  async function activateMic() {
    audio.init();
    await blowDetector.resume();
    if (!isMicActive) {
      return await blowDetector.requestMicrophone();
    }
    return true;
  }

  // Auto-attempt activation
  activateMic().catch(() => { });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.init();
    const muted = audio.toggleMute();
    soundIcon.textContent = muted ? '🔇' : '🔊';
  });

  // Tap Cake or Flame to Blow
  cakeElement.addEventListener('click', (e) => {
    if (isLit) {
      audio.init();
      audio.playWhoosh(0.75);
      blowDetector.triggerManualBlow(500);
    }
  });

  // Dedicated Blow Button
  if (blowBtn) {
    blowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isLit) {
        audio.init();
        audio.playWhoosh(0.85);
        blowDetector.triggerManualBlow(500);
      }
    });
  }

  // Click Mic Status Pill to request mic or trigger test blow
  if (micStatusPill) {
    micStatusPill.addEventListener('click', async (e) => {
      e.stopPropagation();
      audio.init();
      await blowDetector.resume();
      if (!isMicActive) {
        await activateMic();
      } else if (isLit) {
        audio.playWhoosh(0.7);
        blowDetector.triggerManualBlow(500);
      }
    });
  }

  // Keyboard support: Space / B / Enter blows candle
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === 'b' || e.key === 'B' || e.code === 'Enter') {
      if (isLit && !storyOverlay.classList.contains('active') && !lightboxOverlay.classList.contains('active') && !managerOverlay.classList.contains('active')) {
        e.preventDefault();
        audio.init();
        audio.playWhoosh(0.85);
        blowDetector.triggerManualBlow(500);
      }
    }
  });

  // Story action buttons
  relightBtn.addEventListener('click', relightCandles);
  closeStoryBtn.addEventListener('click', () => {
    stopStoryTimer();
    storyOverlay.classList.remove('active');
    audio.playClick();
  });

  // Unlock audio & mic on first gesture anywhere
  const onFirstInteraction = () => {
    activateMic().catch(() => { });
    window.removeEventListener('pointerdown', onFirstInteraction);
    window.removeEventListener('keydown', onFirstInteraction);
  };
  window.addEventListener('pointerdown', onFirstInteraction, { once: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true });

  // Init
  parseUrlParams();
  applyConfig();
});
