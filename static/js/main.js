// =========================================================================
// CarInfo main script
// Original JS from the reference HTML, adapted to load data injected by
// Django (json_script) and to sync favorites/reminders/profile with the
// backend for authenticated users.
// =========================================================================

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function postJson(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken') || ''
    },
    body: JSON.stringify(payload || {})
  }).then((res) => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  });
}

// =========================================================================
// 1. Core Data Sets (injected by Django from the database)
// =========================================================================
const carinfoData = (() => {
  const el = document.getElementById('carinfo-data');
  if (!el) return {};
  try { return JSON.parse(el.textContent); } catch (err) { return {}; }
})();

const serverUserState = (() => {
  const el = document.getElementById('carinfo-user-state');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch (err) { return null; }
})();

const carPartsData = carinfoData.parts || [];
const warningLightsData = carinfoData.warningLights || [];
const glossaryData = carinfoData.glossary || [];
const obdCodesData = carinfoData.obdCodes || {};
const quizQuestions = carinfoData.quizQuestions || [];
const categoryNames = carinfoData.categories || [];

const simulatorStages = [
  {
    name: 'مرحله ۱: مکش (Intake)',
    title: 'زمان مکش — ورود مخلوط سوخت و هوا',
    desc: 'سوپاپ ورودی باز است و پیستون از نقطه مرگ بالا به سمت پایین حرکت می‌کند تا مخلوط هوا و سوخت وارد سیلندر شود.',
    tech: 'سوپاپ هوا: باز | سوپاپ دود: بسته | حرکت پیستون: به پایین',
    pressure: 'فشار: 0.8 Bar',
    temp: 'دما: 25°C',
    pistonY: 36, intakeOpen: true, exhaustOpen: false, spark: 0, color: '#38bdf8'
  },
  {
    name: 'مرحله ۲: تراکم (Compression)',
    title: 'زمان تراکم — فشرده‌سازی مخلوط',
    desc: 'هر دو سوپاپ بسته می‌شوند و پیستون به سمت بالا حرکت می‌کند تا فشار و دمای مخلوط سوخت و هوا افزایش یابد.',
    tech: 'سوپاپ هوا: بسته | سوپاپ دود: بسته | حرکت پیستون: به بالا',
    pressure: 'فشار: 12.0 Bar',
    temp: 'دما: 350°C',
    pistonY: 0, intakeOpen: false, exhaustOpen: false, spark: 0, color: '#0ea5e9'
  },
  {
    name: 'مرحله ۳: احتراق و قدرت (Power)',
    title: 'زمان احتراق — جرقه شمع و تولید نیرو',
    desc: 'شمع جرقه می‌زند، مخلوط متراکم مشتعل می‌شود و انبساط گازها پیستون را با قدرت به پایین می‌راند.',
    tech: 'جرقه شمع: فعال | تولید گشتاور روی میل‌لنگ',
    pressure: 'فشار: 45.0 Bar',
    temp: 'دما: 1800°C',
    pistonY: 42, intakeOpen: false, exhaustOpen: false, spark: 1, color: '#f97316'
  },
  {
    name: 'مرحله ۴: تخلیه (Exhaust)',
    title: 'زمان تخلیه — خروج گازهای سوخته',
    desc: 'سوپاپ دود باز می‌شود و پیستون به سمت بالا حرکت می‌کند تا گازهای حاصل از احتراق از مسیر اگزوز خارج شوند.',
    tech: 'سوپاپ هوا: بسته | سوپاپ دود: باز | حرکت پیستون: به بالا',
    pressure: 'فشار: 2.5 Bar',
    temp: 'دما: 400°C',
    pistonY: 2, intakeOpen: false, exhaustOpen: true, spark: 0, color: '#94a3b8'
  }
];

// =========================================================================
// 2. Real Photo Renderer (Parts & Warning Lights)
// =========================================================================
const partBackupImages = {
  'engine-block': 'https://commons.wikimedia.org/wiki/Special:FilePath/Piston.jpg?width=800',
  'alternator': 'https://commons.wikimedia.org/wiki/Special:FilePath/Alternator.jpg?width=800',
  'radiator': 'https://commons.wikimedia.org/wiki/Special:FilePath/Automobile_radiator.jpg?width=800',
  'brake-disc': 'https://commons.wikimedia.org/wiki/Special:FilePath/Automobile_brake_pad.jpg?width=800',
  'suspension': 'https://commons.wikimedia.org/wiki/Special:FilePath/Close-up_of_a_car_mechanic_holding_a_shock_absorber.jpg?width=800',
  'battery': 'https://commons.wikimedia.org/wiki/Special:FilePath/Photo-CarBattery.jpg?width=800',
  'ecu': 'https://commons.wikimedia.org/wiki/Special:FilePath/Engine_control_unit.jpg?width=800',
  'catalytic': 'https://commons.wikimedia.org/wiki/Special:FilePath/Catalytic_Converter.JPG?width=800'
};

function getPartVisualSvg(partId) {
  const part = carPartsData.find(p => p.id === partId) || carPartsData[0] || {};
  const secondaryUrl = partBackupImages[part.id] || part.image;
  const fallbackUrl = `https://placehold.co/600x360/060d1b/38bdf8?text=${encodeURIComponent(part.enName || 'Part')}`;
  if (!part.image) {
    return `<div class="w-full h-full flex items-center justify-center text-cyan-400/70 text-xs font-bold">تصویر در دسترس نیست</div>`;
  }
  return `
    <img
      src="${part.image}"
      alt="${part.name}"
      loading="lazy"
      data-backup-src="${secondaryUrl}"
      data-fallback-src="${fallbackUrl}"
      onerror="if(!this.dataset.triedBackup){this.dataset.triedBackup='1';this.src=this.dataset.backupSrc;}else if(!this.dataset.triedFallback){this.dataset.triedFallback='1';this.src=this.dataset.fallbackSrc;}else{this.onerror=null;}"
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  `;
}

function getWarningLightSvg(id, isRed) {
  const strokeColor = isRed ? '#fb7185' : '#fbbf24';
  const paths = {
    oil: `<path d="M4 15h10l3-3 3 2-2 3H8l-2 2H4v-4zm5-4V8h5v2h2l2 2" stroke="${strokeColor}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="18" r="1.5" fill="${strokeColor}"/>`,
    temp: `<path d="M12 4v10m0 0a3 3 0 100 6 3 3 0 000-6zm5-6c1.5 1.5 1.5 4.5 0 6M7 8c-1.5 1.5-1.5 4.5 0 6" stroke="${strokeColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    brake: `<circle cx="12" cy="12" r="8" stroke="${strokeColor}" stroke-width="2" fill="none"/><path d="M12 8v5m0 3h.01" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round"/>`,
    cel: `<path d="M7 11h2l1.5-3h3L15 11h2v6h-2l-1 2h-4l-1-2H7v-6z" stroke="${strokeColor}" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
    abs: `<circle cx="12" cy="12" r="8" stroke="${strokeColor}" stroke-width="2" fill="none"/><text x="12" y="14.5" text-anchor="middle" font-size="6.5" font-weight="bold" fill="${strokeColor}">ABS</text>`,
    tpms: `<path d="M6 17c-1.5-2-1.5-8 0-10m12 0c1.5 2 1.5 8 0 10M12 8v5m0 3h.01" stroke="${strokeColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`
  };
  return `
    <div class="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-700/70 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" class="w-7 h-7">${paths[id] || paths.cel}</svg>
    </div>
  `;
}

// =========================================================================
// 3. Persistent State & Helpers
// =========================================================================
let state = {
  favorites: [],
  reminders: [],
  profile: { name: 'کاربر CarInfo', car: 'پژو ۲۰۷ / TU5', km: 45000 },
  warningSeverity: 'all',
  showAllWarnings: false,
  simStage: 0,
  simPlaying: false,
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  xrayShellTransparent: false,
  activeStageTab: 'xray'
};

const isAuthenticated = !!(serverUserState && serverUserState.is_authenticated);
const apiUrls = (serverUserState && serverUserState.urls) || {};

function loadPersistentState() {
  if (serverUserState && serverUserState.is_authenticated) {
    state.favorites = Array.isArray(serverUserState.favorites) ? serverUserState.favorites : [];
    state.reminders = Array.isArray(serverUserState.reminders) ? serverUserState.reminders : [];
    if (serverUserState.profile) state.profile = serverUserState.profile;
    updateProfileUI();
    updateBadgesUI();
    renderFavoritesDrawer();
    renderNotificationsDrawer();
    return;
  }
  try {
    const savedFavs = localStorage.getItem('carinfo_favorites');
    const savedRem = localStorage.getItem('carinfo_reminders');
    const savedProf = localStorage.getItem('carinfo_profile');
    if (savedFavs) {
      const parsedFavs = JSON.parse(savedFavs);
      if (Array.isArray(parsedFavs)) state.favorites = parsedFavs;
    }
    if (savedRem) {
      const parsedRem = JSON.parse(savedRem);
      if (Array.isArray(parsedRem)) state.reminders = parsedRem;
    }
    if (savedProf && typeof JSON.parse(savedProf) === 'object') {
      state.profile = { ...state.profile, ...JSON.parse(savedProf) };
    }
  } catch (err) {
    console.warn('Error loading persistent state:', err);
  }
  updateProfileUI();
  updateBadgesUI();
  renderFavoritesDrawer();
  renderNotificationsDrawer();
}

function savePersistentState() {
  if (isAuthenticated) return;
  try {
    localStorage.setItem('carinfo_favorites', JSON.stringify(state.favorites));
    localStorage.setItem('carinfo_reminders', JSON.stringify(state.reminders));
    localStorage.setItem('carinfo_profile', JSON.stringify(state.profile));
  } catch (err) {
    console.warn('Error saving persistent state:', err);
  }
  updateProfileUI();
  updateBadgesUI();
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'glass-panel rounded-2xl px-4 py-2.5 border border-cyan-400/40 text-xs font-bold text-white shadow-xl pointer-events-auto transition-opacity duration-300';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function applySavedTheme() {
  try {
    const savedTheme = localStorage.getItem('carinfo_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (err) {
    document.documentElement.classList.add('dark');
  }
}

function toggleThemeMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('carinfo_theme', isDark ? 'dark' : 'light');
  } catch (err) {
    console.warn('Theme save error:', err);
  }
}

function toggleDrawer(drawerId, open) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const shouldOpen = typeof open === 'boolean' ? open : drawer.classList.contains('hidden');
  drawer.classList.toggle('hidden', !shouldOpen);
}

function handleAuthClick() {
  if (isAuthenticated) {
    window.location.href = apiUrls.profile || '/profile/';
    return;
  }
  toggleAuthModal(true);
}

function toggleAuthModal(open) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  const shouldOpen = typeof open === 'boolean' ? open : modal.classList.contains('hidden');
  if (shouldOpen) {
    const nameInput = document.getElementById('profileNameInput');
    const carInput = document.getElementById('profileCarInput');
    const kmInput = document.getElementById('profileKmInput');
    if (nameInput) nameInput.value = state.profile.name || '';
    if (carInput) carInput.value = state.profile.car || '';
    if (kmInput) kmInput.value = String(state.profile.km ?? 0);
  }
  modal.classList.toggle('hidden', !shouldOpen);
  modal.classList.toggle('flex', shouldOpen);
}

function startClock() {
  const updateClocks = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR');
    const dateStr = now.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    const clockEl = document.getElementById('persianClock');
    const dateEl = document.getElementById('persianDate');
    const mobileClockEl = document.getElementById('mobileDrawerClock');
    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
    if (mobileClockEl) mobileClockEl.textContent = `${dateStr} • ${timeStr}`;
  };
  updateClocks();
  setInterval(updateClocks, 1000);
}

function initScrollSpyAndProgress() {
  const progressBar = document.getElementById('scrollProgressBar');
  const navLinks = document.querySelectorAll('#desktopNav .nav-link');
  const sections = Array.from(navLinks)
    .map(link => document.getElementById(link.getAttribute('data-section')))
    .filter(Boolean);

  const onScroll = () => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    if (progressBar) progressBar.style.width = `${(ratio * 100).toFixed(1)}%`;

    let activeId = sections[0]?.id || '';
    for (const sec of sections) {
      if (window.scrollY >= sec.offsetTop - 140) {
        activeId = sec.id;
      }
    }
    navLinks.forEach(link => {
      const isActive = link.getAttribute('data-section') === activeId;
      link.classList.toggle('nav-active-pill', isActive);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

let simAnimFrame = null;
let simAngle = 45;
let simSpeed = 1;
let simLastTimestamp = null;

function computeSimulatorStateFromAngle(rawAngle) {
  const normalizedAngle = ((rawAngle % 720) + 720) % 720;
  const stageIdx = Math.min(simulatorStages.length - 1, Math.floor(normalizedAngle / 180));
  const stageInfo = simulatorStages[stageIdx] || simulatorStages[0];

  const rad = (normalizedAngle * Math.PI) / 180;
  const crankCenterX = 130;
  const crankCenterY = 274;
  const crankRadius = 24;
  const crankX = crankCenterX + Math.sin(rad) * crankRadius;
  const crankY = crankCenterY - Math.cos(rad) * crankRadius;

  const maxStroke = 48;
  const pistonShiftY = ((1 - Math.cos(rad)) / 2) * maxStroke;
  const wristPinY = 104 + pistonShiftY;

  const intakeOpen = normalizedAngle >= 15 && normalizedAngle <= 165;
  const exhaustOpen = normalizedAngle >= 555 && normalizedAngle <= 705;
  const sparkActive = normalizedAngle >= 354 && normalizedAngle <= 376;

  return {
    normalizedAngle,
    stageIdx,
    stageInfo,
    crankCenterX,
    crankCenterY,
    crankX,
    crankY,
    pistonShiftY,
    wristPinY,
    intakeOpen,
    exhaustOpen,
    sparkActive
  };
}

function applySimulatorDomState(simState) {
  const {
    stageIdx,
    stageInfo,
    crankCenterX,
    crankCenterY,
    crankX,
    crankY,
    pistonShiftY,
    wristPinY,
    intakeOpen,
    exhaustOpen,
    sparkActive
  } = simState;

  state.simStage = stageIdx;

  const stageBadge = document.getElementById('simStageBadge');
  const stageTitle = document.getElementById('simStageTitle');
  const stageDesc = document.getElementById('simStageDesc');
  const stageTech = document.getElementById('simStageTech');
  const pressureText = document.getElementById('simPressureText');
  const tempText = document.getElementById('simTempText');

  if (stageBadge) stageBadge.textContent = stageInfo.name;
  if (stageTitle) stageTitle.textContent = stageInfo.title;
  if (stageDesc) stageDesc.textContent = stageInfo.desc;
  if (stageTech) stageTech.textContent = stageInfo.tech;
  if (pressureText) pressureText.textContent = stageInfo.pressure;
  if (tempText) tempText.textContent = stageInfo.temp;

  const piston = document.getElementById('simPistonGroup');
  const chamber = document.getElementById('simChamberFill');
  const connRod = document.getElementById('simConnRod');
  const intakeValve = document.getElementById('simIntakeValve');
  const exhaustValve = document.getElementById('simExhaustValve');
  const spark = document.getElementById('simSparkFlash');
  const crankArm = document.getElementById('simCrankArm');
  const crankDot = document.getElementById('simCrankDot');

  if (piston) piston.setAttribute('transform', `translate(0, ${pistonShiftY.toFixed(2)})`);
  if (chamber) {
    const chamberTop = 52;
    const chamberHeight = Math.max(20, (80 + pistonShiftY) - chamberTop);
    chamber.setAttribute('fill', stageInfo.color);
    chamber.setAttribute('height', chamberHeight.toFixed(2));
  }
  if (connRod) {
    connRod.setAttribute('x1', String(crankCenterX));
    connRod.setAttribute('y1', wristPinY.toFixed(2));
    connRod.setAttribute('x2', crankX.toFixed(2));
    connRod.setAttribute('y2', crankY.toFixed(2));
  }
  if (intakeValve) {
    intakeValve.setAttribute('transform', `translate(0, ${intakeOpen ? '8' : '0'})`);
  }
  if (exhaustValve) {
    exhaustValve.setAttribute('transform', `translate(0, ${exhaustOpen ? '8' : '0'})`);
  }
  if (spark) {
    spark.setAttribute('opacity', sparkActive ? '0.95' : '0');
  }
  if (crankArm) {
    crankArm.setAttribute('x2', crankX.toFixed(2));
    crankArm.setAttribute('y2', crankY.toFixed(2));
  }
  if (crankDot) {
    crankDot.setAttribute('cx', crankX.toFixed(2));
    crankDot.setAttribute('cy', crankY.toFixed(2));
  }

  document.querySelectorAll('.sim-stage-btn').forEach((btn, idx) => {
    btn.className = idx === stageIdx
      ? 'sim-stage-btn p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs'
      : 'sim-stage-btn p-2.5 rounded-xl glass-panel border border-cyan-500/20 font-bold text-xs';
  });
}

function renderSimulatorStage() {
  applySimulatorDomState(computeSimulatorStateFromAngle(simAngle));
}

function stepSimulatorLoop(timestamp) {
  if (!state.simPlaying) {
    simLastTimestamp = null;
    return;
  }
  if (simLastTimestamp === null) {
    simLastTimestamp = timestamp;
  }
  const deltaSec = Math.min(0.05, Math.max(0, (timestamp - simLastTimestamp) / 1000));
  simLastTimestamp = timestamp;

  const degPerSec = 135 * simSpeed;
  simAngle = (simAngle + degPerSec * deltaSec) % 720;
  renderSimulatorStage();
  simAnimFrame = requestAnimationFrame(stepSimulatorLoop);
}

function setSimulatorStage(idx) {
  state.simPlaying = false;
  simLastTimestamp = null;
  if (simAnimFrame) {
    cancelAnimationFrame(simAnimFrame);
    simAnimFrame = null;
  }
  const btn = document.getElementById('simPlayBtn');
  if (btn) btn.textContent = 'پخش خودکار';

  const targetIdx = ((idx % simulatorStages.length) + simulatorStages.length) % simulatorStages.length;
  simAngle = targetIdx * 180 + 90;
  renderSimulatorStage();
}

function setSimulatorSpeed(val) {
  const parsed = Number(val);
  simSpeed = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function stepSimulatorStage() {
  setSimulatorStage(state.simStage + 1);
}

function toggleSimulatorPlay() {
  state.simPlaying = !state.simPlaying;
  simLastTimestamp = null;
  const btn = document.getElementById('simPlayBtn');
  if (btn) btn.textContent = state.simPlaying ? 'توقف پخش' : 'پخش خودکار';
  if (simAnimFrame) {
    cancelAnimationFrame(simAnimFrame);
    simAnimFrame = null;
  }
  if (state.simPlaying) {
    simAnimFrame = requestAnimationFrame(stepSimulatorLoop);
  }
}

function saveUserProfile(e) {
  e.preventDefault();
  const nextProfile = {
    name: document.getElementById('profileNameInput').value.trim() || 'کاربر CarInfo',
    car: document.getElementById('profileCarInput').value.trim() || 'پژو ۲۰۷ / TU5',
    km: Number(document.getElementById('profileKmInput').value) || 0
  };
  if (isAuthenticated) {
    const carLabel = nextProfile.car.split('/');
    postJson(apiUrls.save_profile, {
      owner_name: nextProfile.name,
      car_name: (carLabel[0] || '').trim(),
      car_model: (carLabel[1] || '').trim(),
      current_kilometer: nextProfile.km
    })
      .then((data) => {
        if (data.profile) state.profile = data.profile;
        toggleAuthModal(false);
        showToast('پروفایل خودرو با موفقیت ذخیره شد.');
      })
      .catch(() => {
        state.profile = nextProfile;
        savePersistentState();
        toggleAuthModal(false);
        showToast('پروفایل خودرو ذخیره شد (حالت آفلاین).');
      });
    return;
  }
  state.profile = nextProfile;
  savePersistentState();
  toggleAuthModal(false);
  showToast('پروفایل خودرو با موفقیت ذخیره شد.');
}

function updateProfileUI() {
  const nameEl = document.getElementById('drawerVehicleName');
  const kmEl = document.getElementById('drawerVehicleKm');
  const authBtn = document.getElementById('headerAuthBtn');
  if (nameEl) nameEl.textContent = `${state.profile.car || 'بدون خودرو'} (${state.profile.name || 'کاربر'})`;
  if (kmEl) kmEl.textContent = `کارکرد: ${Number(state.profile.km || 0).toLocaleString('fa-IR')} km`;
  if (authBtn) {
    if (isAuthenticated) {
      const username = (serverUserState && serverUserState.username) || 'حساب من';
      authBtn.textContent = username;
    } else {
      authBtn.textContent = 'حساب خودرو';
    }
  }
}

function updateBadgesUI() {
  const favBadge = document.getElementById('favoritesCountBadge');
  const notifBadge = document.getElementById('notificationsCountBadge');
  if (favBadge) favBadge.textContent = String(state.favorites.length);
  if (notifBadge) notifBadge.textContent = String(state.reminders.length);
}

// =========================================================================
// 4. Navigation, X-Ray Map, Parts Grid & Favorites
// =========================================================================
function navigateToView(viewName) {
  const homeView = document.getElementById('homeView');
  const detailView = document.getElementById('partDetailView');
  if (!homeView || !detailView) return;

  if (viewName === 'detail') {
    homeView.classList.add('hidden');
    detailView.classList.remove('hidden');
  } else {
    detailView.classList.add('hidden');
    homeView.classList.remove('hidden');
  }
}

function toggleFavoritePart(partId, event) {
  if (event) event.stopPropagation();
  if (!partId) return;

  const exists = state.favorites.includes(partId);
  if (isAuthenticated) {
    postJson(apiUrls.toggle_favorite, { part_slug: partId })
      .then((data) => {
        if (data.favorited) {
          if (!state.favorites.includes(partId)) state.favorites.push(partId);
          showToast('به لیست نشان‌شده‌ها اضافه شد.');
        } else {
          state.favorites = state.favorites.filter(id => id !== partId);
          showToast('از لیست نشان‌شده‌ها حذف شد.');
        }
        updateBadgesUI();
        renderFavoritesDrawer();
        renderPartsGrid();
        if (document.getElementById('partDetailView') && !document.getElementById('partDetailView').classList.contains('hidden')) {
          openPartDetailView(partId);
        }
      })
      .catch(() => {
        if (exists) {
          state.favorites = state.favorites.filter(id => id !== partId);
          showToast('از لیست نشان‌شده‌ها حذف شد.');
        } else {
          state.favorites.push(partId);
          showToast('به لیست نشان‌شده‌ها اضافه شد.');
        }
        savePersistentState();
        renderFavoritesDrawer();
        renderPartsGrid();
      });
    return;
  }

  if (exists) {
    state.favorites = state.favorites.filter(id => id !== partId);
    showToast('از لیست نشان‌شده‌ها حذف شد.');
  } else {
    state.favorites.push(partId);
    showToast('به لیست نشان‌شده‌ها اضافه شد.');
  }

  savePersistentState();
  renderFavoritesDrawer();
  renderPartsGrid();
  if (document.getElementById('partDetailView') && !document.getElementById('partDetailView').classList.contains('hidden')) {
    openPartDetailView(partId);
  }
}

function renderFavoritesDrawer() {
  const container = document.getElementById('favoritesListContainer');
  if (!container) return;

  if (!state.favorites.length) {
    container.innerHTML = `<div class="text-center py-8 text-slate-400">هنوز قطعه‌ای را نشان نکرده‌اید.</div>`;
    return;
  }

  container.innerHTML = state.favorites.map(id => {
    const part = carPartsData.find(p => p.id === id);
    if (!part) return '';
    return `
      <div onclick="toggleDrawer('favoritesDrawer', false); openPartDetailView('${part.id}');" class="p-3 rounded-2xl bg-slate-900/75 border border-cyan-500/20 flex items-center justify-between gap-2 cursor-pointer hover:border-cyan-400 transition">
        <div>
          <div class="font-bold text-white">${part.name}</div>
          <div class="text-[11px] text-slate-400">${part.category}</div>
        </div>
        <button type="button" onclick="toggleFavoritePart('${part.id}', event)" class="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-[11px] font-bold">حذف</button>
      </div>
    `;
  }).join('');
}

function openPartDetailView(partId) {
  const part = carPartsData.find(p => p.id === partId) || carPartsData[0];
  const container = document.getElementById('partDetailContainer');
  if (!part || !container) return;

  const isFav = state.favorites.includes(part.id);
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12">
      <div class="md:col-span-5 h-64 md:h-auto bg-slate-950 relative overflow-hidden">
        ${getPartVisualSvg(part.id)}
      </div>
      <div class="md:col-span-7 p-6 sm:p-8 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-bold">${part.category}</span>
          <span class="text-xs font-mono text-amber-300 font-bold">${part.lifespan}</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-white">${part.name}</h1>
        <div class="text-xs font-mono text-slate-400" dir="ltr">${part.enName}</div>
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">${part.fullDesc}</p>
        <div class="text-xs text-slate-400"><strong>محل قرارگیری:</strong> ${part.location}</div>
        <div class="space-y-1.5 pt-1">
          <div class="text-xs font-extrabold text-rose-400">علائم رایج خرابی:</div>
          <ul class="text-xs sm:text-sm text-slate-300 space-y-1">
            ${(part.symptoms || []).map(s => `<li>• ${s}</li>`).join('')}
          </ul>
        </div>
        <div class="pt-3 flex flex-wrap gap-2.5">
          <button type="button" onclick="toggleFavoritePart('${part.id}')" class="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs hover:bg-cyan-400 transition">
            ${isFav ? 'حذف از نشان‌شده‌ها' : 'نشان کردن قطعه'}
          </button>
          <button type="button" onclick="toggleAiChat(true)" class="px-4 py-2.5 rounded-xl glass-panel border border-cyan-500/30 text-xs font-bold">
            پرسش از مکانیک AI
          </button>
        </div>
      </div>
    </div>
  `;

  navigateToView('detail');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPartsGrid() {
  const grid = document.getElementById('partsGrid');
  const catFilter = document.getElementById('partCategoryFilter')?.value || 'all';
  if (!grid) return;

  const filtered = carPartsData.filter(p => catFilter === 'all' || p.category === catFilter);
  grid.innerHTML = filtered.map(part => {
    const isFav = state.favorites.includes(part.id);
    return `
      <article onclick="openPartDetailView('${part.id}')" class="glass-panel glass-hover-item rounded-2xl overflow-hidden flex flex-col cursor-pointer group relative">
        <button type="button" onclick="toggleFavoritePart('${part.id}', event)" aria-label="نشان کردن" class="absolute top-3 left-3 z-10 w-8 h-8 rounded-xl bg-slate-950/80 border border-white/15 flex items-center justify-center text-xs hover:scale-105 transition">
          <span class="${isFav ? 'text-rose-500' : 'text-slate-300'}">${isFav ? '♥' : '♡'}</span>
        </button>
        <div class="h-44 bg-slate-950 overflow-hidden border-b border-cyan-500/15">
          ${getPartVisualSvg(part.id)}
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <span class="text-[10px] font-bold text-cyan-400">${part.category}</span>
            <h3 class="font-extrabold text-sm mt-0.5 group-hover:text-cyan-400 transition">${part.name}</h3>
            <p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">${part.shortDesc}</p>
          </div>
          <div class="pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
            <span class="text-amber-300 font-bold">${part.lifespan}</span>
            <span class="text-cyan-400 font-extrabold">جزئیات ←</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function toggleXrayBodyShell() {
  state.xrayShellTransparent = !state.xrayShellTransparent;
  const shell = document.getElementById('xrayBodyShell');
  const btn = document.getElementById('toggleShellBtn');
  if (shell) shell.style.opacity = state.xrayShellTransparent ? '0.16' : '1';
  if (btn) btn.textContent = state.xrayShellTransparent ? 'بازگرداندن بدنه خودرو' : 'شفاف‌سازی بدنه (X-Ray کامل)';
}

function initXrayHotspots() {
  const tooltip = document.getElementById('pointerTooltip');
  const tooltipTitle = document.getElementById('pointerTooltipTitle');
  const tooltipSub = document.getElementById('pointerTooltipSub');
  const pillsContainer = document.getElementById('xrayQuickPills');

  const hideTooltip = () => {
    if (tooltip) tooltip.classList.add('hidden');
  };

  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('touchmove', hideTooltip, { passive: true });
  window.addEventListener('resize', hideTooltip, { passive: true });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.xray-hotspot')) hideTooltip();
  });

  document.querySelectorAll('.xray-hotspot').forEach(node => {
    const partId = node.getAttribute('data-part-id');
    const part = carPartsData.find(p => p.id === partId);
    if (!part) return;

    node.addEventListener('mouseenter', () => {
      if (!tooltip || !tooltipTitle || !tooltipSub) return;
      tooltipTitle.textContent = part.name;
      tooltipSub.textContent = `${part.category} • عمر: ${part.lifespan}`;
      tooltip.classList.remove('hidden');
    });

    node.addEventListener('mousemove', (e) => {
      if (!tooltip) return;
      const x = Math.min(e.clientX + 14, window.innerWidth - 250);
      const y = Math.min(e.clientY + 14, window.innerHeight - 75);
      tooltip.style.left = `${Math.max(8, x)}px`;
      tooltip.style.top = `${Math.max(8, y)}px`;
    });

    node.addEventListener('mouseleave', hideTooltip);
    node.addEventListener('click', () => {
      hideTooltip();
      openPartDetailView(part.id);
    });
  });

  if (pillsContainer) {
    pillsContainer.innerHTML = carPartsData.map(part => `
      <button type="button" onclick="openPartDetailView('${part.id}')" class="px-3 py-1 rounded-xl bg-slate-900/75 hover:bg-cyan-500/20 border border-cyan-500/20 text-[11px] font-bold text-slate-200 hover:text-cyan-300 transition">
        ${part.name.split('(')[0].trim()}
      </button>
    `).join('');
  }
}

// =========================================================================
// 5. Three.js Procedural 3D Exploded Engine Viewer
// =========================================================================
let engine3d = {
  initialized: false,
  scene: null,
  camera: null,
  renderer: null,
  animId: null,
  parts: [],
  selectedPartId: 'engine-block',
  explosionTarget: 0.45,
  explosionCurrent: 0.45,
  isDragging: false,
  prevX: 0,
  prevY: 0,
  theta: 0.68,
  phi: 1.05,
  radius: 7.4,
  raycaster: null,
  pointerNdc: null
};

const engine3dSpecs = [
  {
    id: 'engine-block',
    label: 'بلوک سیلندر',
    title: 'بلوک سیلندر (Engine Block)',
    desc: 'بدنه اصلی موتور با استوانه‌های چهارگانه، پره‌های تقویت و مجاری گردش آب و روغن.',
    explodedOffset: [0, 0, 0]
  },
  {
    id: 'pistons-rods',
    label: 'پیستون و شاتون',
    title: 'مجموعه ۴ پیستون و شاتون (Pistons & Connecting Rods)',
    desc: 'پیستون‌های آلومینیومی با رینگ‌های آب‌بندی و شاتون‌های متصل به میل‌لنگ که فشار احتراق را منتقل می‌کنند.',
    explodedOffset: [0, 2.25, 0]
  },
  {
    id: 'crankshaft',
    label: 'میل‌لنگ',
    title: 'میل‌لنگ و وزنه‌های تعادل (Crankshaft)',
    desc: 'محور اصلی تبدیل حرکت رفت‌و‌برگشتی پیستون‌ها و شاتون‌ها به گشتاور چرخشی در پایین موتور.',
    explodedOffset: [0, -1.55, 0.35]
  },
  {
    id: 'oil-pan',
    label: 'کارتل روغن',
    title: 'کارتل روغن زیرین (Oil Pan)',
    desc: 'مخزن نگهداری روغن موتور در زیر بلوک و میل‌لنگ برای روانکاری مداوم قطعات متحرک.',
    explodedOffset: [0, -2.55, 0]
  },
  {
    id: 'cylinder-head',
    label: 'سرسیلندر',
    title: 'سرسیلندر و محفظه احتراق (Cylinder Head)',
    desc: 'پوشش بالایی بلوک سیلندر که محفظه احتراق، سوپاپ‌ها و مجاری ورودی و خروجی گازها را در بر دارد.',
    explodedOffset: [0, 1.35, 0]
  },
  {
    id: 'valve-cover',
    label: 'قالپاق سوپاپ و شمع‌ها',
    title: 'قالپاق سوپاپ و کوئل/شمع‌ها (Valve Cover & Ignition)',
    desc: 'محافظ بالایی سرسیلندر به همراه مجموعه شمع‌ها و کوئل‌ها برای پاشش جرقه در بالای سیلندرها.',
    explodedOffset: [0, 3.15, 0]
  },
  {
    id: 'intake-manifold',
    label: 'منیفولد ورودی',
    title: 'منیفولد هوای ورودی (Intake Manifold)',
    desc: 'لوله‌های هدایت هوای تمیز به سمت سیلندرها برای تشکیل مخلوط یکنواخت سوخت و هوا.',
    explodedOffset: [2.35, 1.25, 0]
  },
  {
    id: 'timing-pulleys',
    label: 'فولی و تسمه تایم',
    title: 'فولی‌ها و تسمه تایم جلو (Timing Pulleys & Belt)',
    desc: 'هماهنگ‌کننده دقیق چرخش میل‌لنگ و میل‌سوپاپ در جلوی پیشرانه.',
    explodedOffset: [0, 0.2, 2.55]
  },
  {
    id: 'alternator',
    label: 'دینام',
    title: 'دینام تولید برق (Alternator)',
    desc: 'تبدیل نیروی چرخشی موتور به جریان برق جهت شارژ باتری و تامین برق تجهیزات.',
    explodedOffset: [-2.25, 0.45, 1.35]
  },
  {
    id: 'catalytic',
    label: 'منیفولد دود و کاتالیزور',
    title: 'منیفولد اگزوز و کاتالیزور (Exhaust & Catalyst)',
    desc: 'جمع‌آوری و پالایش گازهای خروجی احتراق از سمت خروجی سرسیلندر.',
    explodedOffset: [-2.35, 0.45, -1.1]
  }
];

function init3dEngineViewer() {
  if (engine3d.initialized || typeof THREE === 'undefined') return;
  const canvas = document.getElementById('engine3dCanvas');
  const viewport = document.getElementById('engine3dViewport');
  if (!canvas || !viewport) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030712);

  const width = Math.max(280, viewport.clientWidth);
  const height = Math.max(260, viewport.clientHeight);
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.8);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
  keyLight.position.set(6, 10, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.7);
  rimLight.position.set(-7, -4, -6);
  scene.add(rimLight);

  const coolFillLight = new THREE.PointLight(0x22d3ee, 1.15, 16);
  coolFillLight.position.set(0, 3.8, 3.2);
  scene.add(coolFillLight);

  const warmBackLight = new THREE.PointLight(0xfb923c, 0.9, 16);
  warmBackLight.position.set(-3.8, 1.2, -3.5);
  scene.add(warmBackLight);

  scene.fog = new THREE.FogExp2(0x030712, 0.032);

  const gridHelper = new THREE.GridHelper(13, 13, 0x0ea5e9, 0x1e293b);
  gridHelper.position.y = -2.45;
  scene.add(gridHelper);

  const createEngineBlockAssembly = () => {
    const group = new THREE.Group();
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x3b495e, metalness: 0.78, roughness: 0.3 });
    const darkRecessMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.65, roughness: 0.45 });
    const boreMat = new THREE.MeshStandardMaterial({ color: 0x050811, metalness: 0.88, roughness: 0.22 });
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 });

    const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.15, 2.48), blockMat);
    group.add(mainBlock);

    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.075, 0.11), blockMat);
      rib.position.set(0, 0.2, i * 0.48);
      group.add(rib);

      const lowerRib = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.06, 0.1), darkRecessMat);
      lowerRib.position.set(0, -0.22, i * 0.48);
      group.add(lowerRib);
    }

    const deckLip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.05, 2.54), boltMat);
    deckLip.position.set(0, 0.58, 0);
    group.add(deckLip);

    for (let c = 0; c < 4; c++) {
      const zPos = -0.84 + c * 0.56;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 1.19, 26, 1, true), boltMat);
      sleeve.position.set(0, 0.02, zPos);
      group.add(sleeve);

      const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.18, 26), boreMat);
      bore.position.set(0, 0.02, zPos);
      group.add(bore);
    }

    return group;
  };

  const createPistonsRodsAssembly = () => {
    const group = new THREE.Group();
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.92, roughness: 0.16 });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.28 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.75, roughness: 0.25 });
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.84, roughness: 0.26 });

    const phases = [0, Math.PI, Math.PI, 0];
    for (let i = 0; i < 4; i++) {
      const zPos = -0.84 + i * 0.56;
      const yOffset = Math.cos(phases[i]) * 0.12;

      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.26, 26), pistonMat);
      piston.position.set(0, yOffset + 0.12, zPos);
      group.add(piston);

      const crownDish = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.02, 24), crownMat);
      crownDish.position.set(0, yOffset + 0.255, zPos);
      group.add(crownDish);

      const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.197, 0.197, 0.024, 26), ringMat);
      ring1.position.set(0, yOffset + 0.19, zPos);
      group.add(ring1);

      const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.197, 0.197, 0.024, 26), ringMat);
      ring2.position.set(0, yOffset + 0.12, zPos);
      group.add(ring2);

      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.58, 0.105), rodMat);
      rod.position.set(0, yOffset - 0.26, zPos);
      group.add(rod);

      const bigEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.115, 20), rodMat);
      bigEnd.rotation.x = Math.PI / 2;
      bigEnd.position.set(0, yOffset - 0.53, zPos);
      group.add(bigEnd);
    }
    return group;
  };

  const createCrankshaftAssembly = () => {
    const group = new THREE.Group();
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.22 });
    const webMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

    const mainJournal = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.75, 20), shaftMat);
    mainJournal.rotation.x = Math.PI / 2;
    group.add(mainJournal);

    for (let i = 0; i < 4; i++) {
      const zPos = -0.84 + i * 0.56;
      const web1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.09), webMat);
      web1.position.set(0, 0.05, zPos - 0.13);
      group.add(web1);

      const web2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.09), webMat);
      web2.position.set(0, 0.05, zPos + 0.13);
      group.add(web2);
    }
    return group;
  };

  const createOilPanAssembly = () => {
    const group = new THREE.Group();
    const panMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.62, roughness: 0.42 });
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });

    const pan = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.36, 2.24), panMat);
    group.add(pan);

    const drainBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), boltMat);
    drainBolt.rotation.z = Math.PI / 2;
    drainBolt.position.set(0.73, -0.06, 0.4);
    group.add(drainBolt);

    return group;
  };

  const createCylinderHeadAssembly = () => {
    const group = new THREE.Group();
    const headMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.82, roughness: 0.24 });
    const valveMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.88, roughness: 0.18 });
    const camMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    const casting = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.38, 2.52), headMat);
    group.add(casting);

    const cam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.46, 18), camMat);
    cam1.rotation.x = Math.PI / 2;
    cam1.position.set(-0.34, 0.22, 0);
    group.add(cam1);

    const cam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.46, 18), camMat);
    cam2.rotation.x = Math.PI / 2;
    cam2.position.set(0.34, 0.22, 0);
    group.add(cam2);

    for (let i = 0; i < 4; i++) {
      const zPos = -0.84 + i * 0.56;
      const v1 = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.18, 16), valveMat);
      v1.position.set(-0.24, -0.21, zPos);
      group.add(v1);

      const v2 = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.18, 16), valveMat);
      v2.position.set(0.24, -0.21, zPos);
      group.add(v2);

      const lobe1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), camMat);
      lobe1.position.set(-0.34, 0.24, zPos);
      group.add(lobe1);

      const lobe2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), camMat);
      lobe2.position.set(0.34, 0.24, zPos);
      group.add(lobe2);
    }
    return group;
  };

  const createValveCoverAssembly = () => {
    const group = new THREE.Group();
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.55, roughness: 0.24 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.88, roughness: 0.2 });
    const coilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.45, roughness: 0.38 });

    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.24, 2.34), coverMat);
    group.add(cover);

    const centerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 2.18), trimMat);
    centerTrim.position.set(0, 0.13, 0);
    group.add(centerTrim);

    for (let i = 0; i < 4; i++) {
      const zPos = -0.84 + i * 0.56;
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.26), coilMat);
      coil.position.set(0, 0.19, zPos);
      group.add(coil);

      const coilCap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.28), trimMat);
      coilCap.position.set(0, 0.28, zPos);
      group.add(coilCap);
    }
    return group;
  };

  const createIntakeManifoldAssembly = () => {
    const group = new THREE.Group();
    const plenumMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.45 });
    const runnerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.55, roughness: 0.35 });

    const plenum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.1, 20), plenumMat);
    plenum.rotation.x = Math.PI / 2;
    plenum.position.set(0.55, 0.12, 0);
    group.add(plenum);

    for (let i = 0; i < 4; i++) {
      const zPos = -0.84 + i * 0.56;
      const runner = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.62, 14), runnerMat);
      runner.rotation.z = Math.PI / 2.4;
      runner.position.set(0.22, -0.02, zPos);
      group.add(runner);
    }
    return group;
  };

  const createTimingPulleysAssembly = () => {
    const group = new THREE.Group();
    const pulleyMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.22 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.75 });

    const crankPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 24), pulleyMat);
    crankPulley.rotation.x = Math.PI / 2;
    crankPulley.position.set(0, -0.45, 0);
    group.add(crankPulley);

    const camPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 24), pulleyMat);
    camPulley.rotation.x = Math.PI / 2;
    camPulley.position.set(0, 0.45, 0);
    group.add(camPulley);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.11), beltMat);
    belt.position.set(0, 0, -0.02);
    group.add(belt);

    return group;
  };

  const createAlternatorAssembly = () => {
    const group = new THREE.Group();
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.82, roughness: 0.28 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.78, roughness: 0.32 });

    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.58, 24), housingMat);
    housing.rotation.z = Math.PI / 2;
    group.add(housing);

    const winding = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.075, 12, 24), copperMat);
    winding.rotation.y = Math.PI / 2;
    group.add(winding);

    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 20), housingMat);
    pulley.rotation.z = Math.PI / 2;
    pulley.position.x = 0.34;
    group.add(pulley);

    return group;
  };

  const createCatalyticAssembly = () => {
    const group = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.22 });
    const heatShieldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.72, roughness: 0.32 });

    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.1, 26), steelMat);
    chamber.rotation.z = Math.PI / 2;
    group.add(chamber);

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.78, 26, 1, true, 0, Math.PI), heatShieldMat);
    shield.rotation.z = Math.PI / 2;
    shield.position.y = 0.04;
    group.add(shield);

    const frontCone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.32, 26), steelMat);
    frontCone.rotation.z = Math.PI / 2;
    frontCone.position.x = 0.7;
    group.add(frontCone);

    const rearCone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.32, 26), steelMat);
    rearCone.rotation.z = -Math.PI / 2;
    rearCone.position.x = -0.7;
    group.add(rearCone);

    return group;
  };

  const assemblyBuilders = {
    'engine-block': createEngineBlockAssembly,
    'pistons-rods': createPistonsRodsAssembly,
    'crankshaft': createCrankshaftAssembly,
    'oil-pan': createOilPanAssembly,
    'cylinder-head': createCylinderHeadAssembly,
    'valve-cover': createValveCoverAssembly,
    'intake-manifold': createIntakeManifoldAssembly,
    'timing-pulleys': createTimingPulleysAssembly,
    'alternator': createAlternatorAssembly,
    'catalytic': createCatalyticAssembly
  };

  const basePositions = {
    'engine-block': [0, 0, 0],
    'pistons-rods': [0, 0.18, 0],
    'crankshaft': [0, -0.65, 0],
    'oil-pan': [0, -0.78, 0],
    'cylinder-head': [0, 0.76, 0],
    'valve-cover': [0, 1.06, 0],
    'intake-manifold': [0.95, 0.55, 0],
    'timing-pulleys': [0, 0.1, 1.33],
    'alternator': [-1.05, 0.15, 0.85],
    'catalytic': [-1.05, 0.35, -0.45]
  };

  const partMeshes = [];
  engine3dSpecs.forEach((spec) => {
    const builder = assemblyBuilders[spec.id] || createEngineBlockAssembly;
    const group = builder();
    const base = basePositions[spec.id] || [0, 0, 0];
    group.position.set(base[0], base[1], base[2]);

    const hitTargets = [];
    group.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.baseEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
        child.userData.partId = spec.id;
        hitTargets.push(child);
      }
    });

    group.userData = {
      partId: spec.id,
      basePos: new THREE.Vector3(base[0], base[1], base[2]),
      explodeVec: new THREE.Vector3(spec.explodedOffset[0], spec.explodedOffset[1], spec.explodedOffset[2]),
      hitTargets
    };
    scene.add(group);
    partMeshes.push(group);
  });

  engine3d.scene = scene;
  engine3d.camera = camera;
  engine3d.renderer = renderer;
  engine3d.parts = partMeshes;
  engine3d.raycaster = new THREE.Raycaster();
  engine3d.pointerNdc = new THREE.Vector2();
  engine3d.initialized = true;

  setExplosionAmount(engine3d.explosionTarget);
  render3dPartButtons();
  select3dPart('engine-block');
  bind3dInteractions(canvas, viewport);
  start3dRenderLoop();
}

function render3dPartButtons() {
  const container = document.getElementById('engine3dPartButtons');
  if (!container) return;
  container.innerHTML = engine3dSpecs.map(spec => `
    <button type="button" id="part3dBtn-${spec.id}" onclick="select3dPart('${spec.id}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800/80 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 transition">
      ${spec.label}
    </button>
  `).join('');
}

function select3dPart(partId) {
  engine3d.selectedPartId = partId;
  const spec = engine3dSpecs.find(s => s.id === partId) || engine3dSpecs[0];
  const titleEl = document.getElementById('engine3dPartTitle');
  const descEl = document.getElementById('engine3dPartDesc');
  if (titleEl) titleEl.textContent = spec.title;
  if (descEl) descEl.textContent = spec.desc;

  engine3dSpecs.forEach(s => {
    const btn = document.getElementById(`part3dBtn-${s.id}`);
    if (!btn) return;
    btn.className = s.id === partId
      ? 'px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-cyan-500 text-slate-950 transition'
      : 'px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800/80 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-cyan-500/20 transition';
  });
}

function setExplosionAmount(ratio) {
  const clamped = Math.min(1, Math.max(0, Number(ratio) || 0));
  engine3d.explosionTarget = clamped;
  const pct = Math.round(clamped * 100);
  const slider = document.getElementById('explosionRange');
  const label = document.getElementById('explosionPercentLabel');
  const btn = document.getElementById('explodeToggleBtn');
  if (slider && Number(slider.value) !== pct) slider.value = String(pct);
  if (label) label.textContent = `${pct}%`;
  if (btn) btn.textContent = pct > 50 ? 'جمع کردن قطعات موتور' : 'باز کردن قطعات موتور';
}

function toggleEngineExplosion() {
  const next = engine3d.explosionTarget > 0.5 ? 0 : 1;
  setExplosionAmount(next);
}

function reset3dCamera() {
  engine3d.theta = 0.65;
  engine3d.phi = 1.08;
  engine3d.radius = 8.5;
}

function bind3dInteractions(canvas, viewport) {
  const hoverLabel = document.getElementById('engine3dHoverLabel');
  const getAllHitMeshes = () => engine3d.parts.flatMap(group => group.userData?.hitTargets || [group]);

  canvas.addEventListener('pointerdown', (e) => {
    engine3d.isDragging = true;
    engine3d.prevX = e.clientX;
    engine3d.prevY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      engine3d.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      engine3d.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    if (engine3d.isDragging) {
      const dx = e.clientX - engine3d.prevX;
      const dy = e.clientY - engine3d.prevY;
      engine3d.prevX = e.clientX;
      engine3d.prevY = e.clientY;
      engine3d.theta -= dx * 0.008;
      engine3d.phi = Math.min(Math.PI - 0.15, Math.max(0.2, engine3d.phi - dy * 0.008));
      return;
    }

    if (engine3d.raycaster && engine3d.camera) {
      engine3d.raycaster.setFromCamera(engine3d.pointerNdc, engine3d.camera);
      const hits = engine3d.raycaster.intersectObjects(getAllHitMeshes(), false);
      const hoveredPartId = hits.length > 0 ? hits[0].object.userData?.partId : null;

      engine3d.parts.forEach(group => {
        const isHit = group.userData.partId === hoveredPartId;
        const isSelected = group.userData.partId === engine3d.selectedPartId;
        (group.userData.hitTargets || []).forEach(mesh => {
          if (mesh.material?.emissive) {
            mesh.material.emissive.setHex(isHit ? 0x0ea5e9 : (isSelected ? 0x0369a1 : 0x000000));
            mesh.material.emissiveIntensity = isHit ? 0.45 : (isSelected ? 0.22 : 0);
          }
        });
      });

      if (hoverLabel) {
        if (hoveredPartId) {
          const spec = engine3dSpecs.find(s => s.id === hoveredPartId);
          hoverLabel.textContent = spec ? spec.label : '';
          hoverLabel.classList.remove('hidden');
        } else {
          hoverLabel.classList.add('hidden');
        }
      }
    }
  });

  const endDrag = (e) => {
    if (!engine3d.isDragging) return;
    engine3d.isDragging = false;
    if (e && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('click', () => {
    if (!engine3d.raycaster || !engine3d.camera) return;
    engine3d.raycaster.setFromCamera(engine3d.pointerNdc, engine3d.camera);
    const hits = engine3d.raycaster.intersectObjects(getAllHitMeshes(), false);
    if (hits.length > 0 && hits[0].object.userData?.partId) {
      select3dPart(hits[0].object.userData.partId);
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    engine3d.radius = Math.min(14, Math.max(4.5, engine3d.radius + e.deltaY * 0.005));
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (!engine3d.initialized || !engine3d.renderer || !engine3d.camera) return;
    const w = Math.max(280, viewport.clientWidth);
    const h = Math.max(260, viewport.clientHeight);
    engine3d.camera.aspect = w / h;
    engine3d.camera.updateProjectionMatrix();
    engine3d.renderer.setSize(w, h);
  });
}

function start3dRenderLoop() {
  if (engine3d.animId) cancelAnimationFrame(engine3d.animId);

  const tick = () => {
    engine3d.animId = requestAnimationFrame(tick);
    if (!engine3d.initialized || !engine3d.renderer || !engine3d.scene || !engine3d.camera) return;

    engine3d.explosionCurrent += (engine3d.explosionTarget - engine3d.explosionCurrent) * 0.1;

    engine3d.parts.forEach(mesh => {
      const { basePos, explodeVec, partId } = mesh.userData;
      mesh.position.set(
        basePos.x + explodeVec.x * engine3d.explosionCurrent,
        basePos.y + explodeVec.y * engine3d.explosionCurrent,
        basePos.z + explodeVec.z * engine3d.explosionCurrent
      );
      if (partId === 'alternator') {
        mesh.rotation.y += 0.015;
      } else if (partId === 'timing-pulleys') {
        mesh.rotation.z -= 0.012 * (0.35 + engine3d.explosionCurrent);
      } else if (partId === 'crankshaft') {
        mesh.rotation.z += 0.018 * (0.25 + engine3d.explosionCurrent);
      }
    });

    const sinPhi = Math.sin(engine3d.phi);
    engine3d.camera.position.set(
      engine3d.radius * sinPhi * Math.sin(engine3d.theta),
      engine3d.radius * Math.cos(engine3d.phi),
      engine3d.radius * sinPhi * Math.cos(engine3d.theta)
    );
    engine3d.camera.lookAt(0, 0, 0);
    engine3d.renderer.render(engine3d.scene, engine3d.camera);
  };

  tick();
}

function switchHeroStageTab(tab) {
  const panelXray = document.getElementById('stagePanelXray');
  const panel3d = document.getElementById('stagePanel3d');
  const btnXray = document.getElementById('tabBtnXray');
  const btn3d = document.getElementById('tabBtn3d');
  if (!panelXray || !panel3d || !btnXray || !btn3d) return;

  const is3d = tab === '3d';
  state.activeStageTab = is3d ? '3d' : 'xray';

  panelXray.classList.toggle('hidden', is3d);
  panel3d.classList.toggle('hidden', !is3d);

  btnXray.className = !is3d
    ? 'px-4 py-2 rounded-xl text-xs font-extrabold bg-cyan-500 text-slate-950 shadow transition'
    : 'px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-cyan-300 transition';

  btn3d.className = is3d
    ? 'px-4 py-2 rounded-xl text-xs font-extrabold bg-cyan-500 text-slate-950 shadow transition'
    : 'px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-cyan-300 transition';

  if (is3d) {
    init3dEngineViewer();
    const viewport = document.getElementById('engine3dViewport');
    if (viewport && engine3d.renderer && engine3d.camera) {
      const w = Math.max(280, viewport.clientWidth);
      const h = Math.max(260, viewport.clientHeight);
      engine3d.camera.aspect = w / h;
      engine3d.camera.updateProjectionMatrix();
      engine3d.renderer.setSize(w, h);
    }
  }
}

// =========================================================================
// 6. Warning Lights & Quiz & Comparison & Glossary & OBD
// =========================================================================
function setWarningSeverity(sev) {
  state.warningSeverity = sev;
  ['all', 'red', 'yellow'].forEach(key => {
    const btn = document.getElementById(`wlBtn${key.charAt(0).toUpperCase() + key.slice(1)}`);
    if (!btn) return;
    btn.className = key === sev
      ? 'px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-extrabold'
      : 'px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800/60';
  });
  renderWarningLights();
}

function toggleShowAllWarningLights() {
  state.showAllWarnings = !state.showAllWarnings;
  renderWarningLights();
}

function renderWarningLights() {
  const grid = document.getElementById('warningLightsGrid');
  const toggleBtn = document.getElementById('toggleAllWarningLightsBtn');
  if (!grid) return;

  const filtered = warningLightsData.filter(w => state.warningSeverity === 'all' || w.severity === state.warningSeverity);
  const items = state.showAllWarnings ? filtered : filtered.slice(0, 3);

  grid.innerHTML = items.map(w => {
    const isRed = w.severity === 'red';
    return `
      <div class="glass-panel rounded-2xl p-4 space-y-2.5 border-r-4 ${isRed ? 'border-r-rose-500' : 'border-r-amber-400'}">
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${isRed ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-400/15 text-amber-300'}">
            ${isRed ? 'هشدار قرمز (توقف)' : 'هشدار زرد (بررسی)'}
          </span>
          ${getWarningLightSvg(w.id, isRed)}
        </div>
        <h3 class="font-extrabold text-sm">${w.title}</h3>
        <p class="text-xs text-slate-400 leading-relaxed">${w.meaning}</p>
        <div class="pt-2 border-t border-slate-700/40 text-[11px] font-bold text-cyan-300">
          اقدام: ${w.action}
        </div>
      </div>
    `;
  }).join('');

  if (toggleBtn) {
    toggleBtn.textContent = state.showAllWarnings
      ? 'نمایش خلاصه (۳ مورد اول)'
      : `مشاهده همه چراغ‌های پشت آمپر (${filtered.length} مورد)`;
  }
}

function renderQuizQuestion() {
  const box = document.getElementById('quizStageBox');
  const scoreEl = document.getElementById('quizScoreText');
  const totalEl = document.getElementById('quizTotalText');
  if (!box) return;

  if (scoreEl) scoreEl.textContent = String(state.quizScore);
  if (totalEl) totalEl.textContent = String(quizQuestions.length);

  if (state.quizIndex >= quizQuestions.length) {
    box.innerHTML = `
      <div class="md:col-span-12 text-center py-6 space-y-3">
        <div class="text-xl font-black text-cyan-400">امتیاز نهایی شما: ${state.quizScore} از ${quizQuestions.length}</div>
        <p class="text-xs sm:text-sm text-slate-300">آزمون تصویری شناخت قطعات CarInfo به پایان رسید.</p>
        <button type="button" onclick="restartQuiz()" class="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs">
          شروع مجدد آزمون
        </button>
      </div>
    `;
    return;
  }

  const q = quizQuestions[state.quizIndex];
  state.quizAnswered = false;

  box.innerHTML = `
    <div class="md:col-span-5 h-52 rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/20">
      ${getPartVisualSvg(q.partId)}
    </div>
    <div class="md:col-span-7 space-y-3">
      <div class="text-xs text-amber-300 font-bold">سوال ${state.quizIndex + 1} از ${quizQuestions.length}</div>
      <h3 class="font-extrabold text-sm sm:text-base leading-relaxed">${q.question}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${q.options.map((opt, i) => `
          <button type="button" onclick="submitQuizAnswer(${i})" class="quiz-opt-btn text-right px-3.5 py-2.5 rounded-xl bg-slate-900/70 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-bold transition">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="quizFeedbackBox" class="hidden p-3 rounded-xl text-xs leading-relaxed"></div>
    </div>
  `;
}

function submitQuizAnswer(selectedIdx) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  const q = quizQuestions[state.quizIndex];
  const feedback = document.getElementById('quizFeedbackBox');
  const isCorrect = selectedIdx === q.correct;
  if (isCorrect) state.quizScore += 1;
  const scoreEl = document.getElementById('quizScoreText');
  if (scoreEl) scoreEl.textContent = String(state.quizScore);

  if (feedback) {
    feedback.classList.remove('hidden');
    feedback.className = `p-3 rounded-xl text-xs leading-relaxed ${isCorrect ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`;
    feedback.innerHTML = `
      <div>${isCorrect ? '✓ پاسخ صحیح بود!' : `✕ پاسخ درست: ${q.options[q.correct]}`}</div>
      <div class="mt-1 text-slate-200">${q.reason}</div>
      <button type="button" onclick="state.quizIndex += 1; renderQuizQuestion();" class="mt-2.5 px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-extrabold">
        ${state.quizIndex + 1 < quizQuestions.length ? 'سوال بعدی ←' : 'مشاهده نتیجه'}
      </button>
    `;
  }
}

function restartQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  renderQuizQuestion();
}

function initComparisonSelects() {
  const selA = document.getElementById('compareSelectA');
  const selB = document.getElementById('compareSelectB');
  if (!selA || !selB) return;

  selA.innerHTML = carPartsData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  selB.innerHTML = carPartsData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  selA.value = carPartsData[2] ? carPartsData[2].id : '';
  selB.value = carPartsData[1] ? carPartsData[1].id : '';
  renderComparisonStudio();
}

function renderComparisonStudio() {
  const idA = document.getElementById('compareSelectA')?.value || (carPartsData[2] ? carPartsData[2].id : '');
  const idB = document.getElementById('compareSelectB')?.value || (carPartsData[1] ? carPartsData[1].id : '');
  const partA = carPartsData.find(p => p.id === idA) || carPartsData[0];
  const partB = carPartsData.find(p => p.id === idB) || carPartsData[1];

  const grid = document.getElementById('comparisonCardsGrid');
  const summary = document.getElementById('comparisonSummaryBox');
  if (!grid || !partA || !partB) return;

  grid.innerHTML = [partA, partB].map(p => `
    <div class="glass-panel rounded-3xl p-5 space-y-3">
      <div class="h-40 rounded-2xl overflow-hidden bg-slate-950">
        ${getPartVisualSvg(p.id)}
      </div>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-black text-base">${p.name}</h3>
        <span class="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold">${p.category}</span>
      </div>
      <p class="text-xs text-slate-300 leading-relaxed">${p.shortDesc}</p>
      <div class="text-xs text-amber-300 font-bold">طول عمر استاندارد: ${p.lifespan}</div>
      <div class="text-xs text-slate-400">محل قرارگیری: ${p.location}</div>
    </div>
  `).join('');

  if (summary) {
    summary.innerHTML = `<strong class="text-cyan-400">جمع‌بندی مقایسه:</strong> قطعه <strong>${partA.name}</strong> در بخش «${partA.category}» با طول عمر تخمینی ${partA.lifespan} در برابر <strong>${partB.name}</strong> در بخش «${partB.category}» با طول عمر ${partB.lifespan} قرار دارد. بررسی دوره‌ای هر دو قطعه از بروز توقف‌های ناگهانی جلوگیری می‌کند.`;
  }
}

function renderGlossaryGrid() {
  const grid = document.getElementById('glossaryGrid');
  const query = (document.getElementById('glossarySearchInput')?.value || '').trim().toLowerCase();
  if (!grid) return;

  const list = glossaryData.filter(g =>
    !query || g.term.toLowerCase().includes(query) || g.en.toLowerCase().includes(query) || g.desc.toLowerCase().includes(query)
  );

  grid.innerHTML = list.map(item => `
    <div class="glass-panel rounded-2xl p-4 space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="font-black text-sm text-cyan-400">${item.term}</span>
        <span class="text-[11px] font-mono text-slate-400" dir="ltr">${item.en}</span>
      </div>
      <p class="text-xs text-slate-300 leading-relaxed">${item.desc}</p>
    </div>
  `).join('');
}

function lookupObdCode() {
  const input = document.getElementById('obdInput');
  const box = document.getElementById('obdResultBox');
  if (!input || !box) return;
  const code = input.value.trim().toUpperCase();
  box.classList.remove('hidden');

  if (!code) {
    box.innerHTML = `<span class="text-amber-300">لطفاً یک کد خطا مانند P0300 وارد کنید.</span>`;
    return;
  }

  const found = obdCodesData[code];
  if (found) {
    const causes = found.possibleCauses ? `<div class="mt-2 text-slate-300"><strong>علل احتمالی:</strong> ${found.possibleCauses}</div>` : '';
    box.innerHTML = `<div class="font-black text-cyan-400 font-mono">${code} — ${found.title}</div><div class="mt-1 text-slate-200">${found.detail}</div>${causes}`;
  } else {
    box.innerHTML = `<div class="font-bold text-amber-300">کد ${code} در فهرست ثبت نشده است.</div><div class="mt-1 text-slate-300">در صورت روشن بودن چراغ چک، بررسی دقیق با دستگاه دیاگ و دفترچه سازنده توصیه می‌شود.</div>`;
  }
}

// =========================================================================
// 7. Service Reminders & AI Mechanic Chat
// =========================================================================
function populateReminderPartSelect() {
  const sel = document.getElementById('reminderPartSelect');
  if (!sel) return;
  sel.innerHTML = carPartsData.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function populateCategoryFilter() {
  const sel = document.getElementById('partCategoryFilter');
  if (!sel) return;
  sel.innerHTML = `<option value="all">همه دسته‌ها</option>` +
    categoryNames.map(name => `<option value="${name}">${name}</option>`).join('');
}

function addServiceReminder(e) {
  e.preventDefault();
  const partId = document.getElementById('reminderPartSelect')?.value;
  const interval = Number(document.getElementById('reminderIntervalInput')?.value) || 10000;
  const part = carPartsData.find(p => p.id === partId) || carPartsData[0];

  if (isAuthenticated && part) {
    postJson(apiUrls.add_reminder, { part_slug: part.id, interval: interval })
      .then((data) => {
        if (Array.isArray(data.reminders)) state.reminders = data.reminders;
        renderRemindersBoard();
        renderNotificationsDrawer();
        updateBadgesUI();
        showToast('یادآور سرویس جدید ثبت شد.');
      })
      .catch(() => showToast('خطا در ثبت یادآور روی سرور.'));
    return;
  }

  state.reminders.unshift({
    id: Date.now(),
    partId: part ? part.id : '',
    partName: part ? part.name : 'قطعه',
    targetKm: Number(state.profile.km || 0) + interval
  });
  savePersistentState();
  renderRemindersBoard();
  renderNotificationsDrawer();
  showToast('یادآور سرویس جدید ثبت شد.');
}

function deleteServiceReminder(id) {
  if (isAuthenticated) {
    postJson(apiUrls.delete_reminder.replace('0', String(id)), {})
      .then((data) => {
        if (Array.isArray(data.reminders)) state.reminders = data.reminders;
        renderRemindersBoard();
        renderNotificationsDrawer();
        updateBadgesUI();
        showToast('یادآور حذف شد.');
      })
      .catch(() => showToast('خطا در حذف یادآور.'));
    return;
  }
  state.reminders = state.reminders.filter(r => r.id !== id);
  savePersistentState();
  renderRemindersBoard();
  renderNotificationsDrawer();
}

function renderRemindersBoard() {
  const board = document.getElementById('remindersBoard');
  if (!board) return;
  if (!state.reminders.length) {
    board.innerHTML = `<div class="text-slate-400 py-4">یادآور فعالی ثبت نشده است.</div>`;
    return;
  }
  board.innerHTML = state.reminders.map(r => `
    <div class="p-3.5 rounded-2xl bg-slate-900/75 border border-cyan-500/15 flex items-center justify-between gap-3">
      <div>
        <div class="font-bold text-white">${r.partName || r.title || 'یادآور'}</div>
        <div class="text-[11px] text-cyan-300 font-mono mt-0.5">موعد بررسی/تعویض: ${Number(r.targetKm || 0).toLocaleString('fa-IR')} km</div>
      </div>
      <button type="button" onclick="deleteServiceReminder(${r.id})" class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-[11px] font-bold">حذف</button>
    </div>
  `).join('');
}

function renderNotificationsDrawer() {
  const box = document.getElementById('notificationsListContainer');
  if (!box) return;
  if (!state.reminders.length) {
    box.innerHTML = `<div class="text-center py-8 text-slate-400">اعلانی وجود ندارد.</div>`;
    return;
  }
  box.innerHTML = state.reminders.map(r => `
    <div class="p-3 rounded-2xl bg-slate-900/75 border border-cyan-500/15 space-y-1">
      <div class="font-bold text-cyan-300">${r.partName || r.title || 'یادآور'}</div>
      <div class="text-[11px] text-slate-300 font-mono">کیلومتر هدف: ${Number(r.targetKm || 0).toLocaleString('fa-IR')}</div>
    </div>
  `).join('');
}

function toggleAiChat(open) {
  const widget = document.getElementById('aiChatWidget');
  if (!widget) return;
  const shouldOpen = typeof open === 'boolean' ? open : widget.classList.contains('hidden');
  widget.classList.toggle('hidden', !shouldOpen);
}

function sendAiMessage(e) {
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const log = document.getElementById('aiChatLog');
  if (!input || !log) return;

  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  log.innerHTML += `<div class="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-200 font-bold text-left">${text}</div>`;

  let reply = 'برای بررسی دقیق‌تر، بررسی کد خطا با دیاگ، سطح مایعات و وضعیت باتری/ترمز توصیه می‌شود.';
  if (text.includes('ترمز') || text.includes('لنت')) {
    reply = 'اگر صدای سوت یا لرزش در ترمزگیری دارید، ضخامت لنت و سطح دیسک ترمز را در اولویت بررسی کنید.';
  } else if (text.includes('داغ') || text.includes('آب') || text.includes('رادیاتور')) {
    reply = 'در افزایش دمای موتور، سطح مایع خنک‌کننده، سلامت ترموستات و عملکرد فن رادیاتور را کنترل کنید.';
  } else if (text.includes('باتری') || text.includes('دینام') || text.includes('استارت')) {
    reply = 'ولتاژ باتری و عملکرد دینام را بررسی کنید و از تمیز بودن قطب‌ها اطمینان حاصل نمایید.';
  }

  log.innerHTML += `<div class="p-3 rounded-2xl bg-slate-900/85 text-slate-200 leading-relaxed">${reply}</div>`;
  log.scrollTop = log.scrollHeight;
}

// =========================================================================
// 8. App Initialization
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  loadPersistentState();
  startClock();
  initScrollSpyAndProgress();
  initXrayHotspots();
  populateCategoryFilter();
  renderPartsGrid();
  renderWarningLights();
  renderSimulatorStage();
  renderQuizQuestion();
  initComparisonSelects();
  renderGlossaryGrid();
  populateReminderPartSelect();
  renderRemindersBoard();
});
