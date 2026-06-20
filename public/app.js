import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    setDoc, 
    getDoc, 
    query, 
    where, 
    onSnapshot, 
    serverTimestamp, 
    Timestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========================================================================
// FIREBASE INIT
// ========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDB1USn766hm8km0DT4Oab6rDKbCsKb3yI",
  authDomain: "food-b6b0e.firebaseapp.com",
  projectId: "food-b6b0e",
  storageBucket: "food-b6b0e.firebasestorage.app",
  messagingSenderId: "114668619413",
  appId: "1:114668619413:web:1aea74bb7741b913d9fd9c",
  measurementId: "G-7P271QZVKQ"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ========================================================================
// GLOBAL STATE
// ========================================================================
let currentUser = null;
let userRole = null;
let isUserVerified = false;
let unsubscribeDonations = null;
let unsubscribeAdminNGOs = null;
let unsubscribeAdminDonations = null;
let unsubscribeUser = null;
let ngoNeighborhoodFilter = 'all';
let ngoCategoryFilter = 'all';
let ngoDonationsCache = [];
let adminDonationsCache = [];
let countdownIntervals = [];
let leafletMap = null;
let mapMarkers = [];

// Category config
const CATEGORIES = {
    'veg': { emoji: '🥬', label: 'Vegetarian' },
    'non-veg': { emoji: '🍗', label: 'Non-Veg' },
    'cooked': { emoji: '🍛', label: 'Cooked' },
    'raw': { emoji: '🥕', label: 'Raw' },
    'bakery': { emoji: '🍞', label: 'Bakery' },
    'beverages': { emoji: '🥤', label: 'Beverages' }
};

// Neighborhood coordinates (Bangalore)
const NEIGHBORHOOD_COORDS = {
    'Koramangala': [12.9352, 77.6245],
    'Indiranagar': [12.9784, 77.6408],
    'Whitefield': [12.9698, 77.7500],
    'HSR Layout': [12.9116, 77.6389],
    'Jayanagar': [12.9308, 77.5838]
};

// Badge definitions
const BADGES = [
    { id: 'first', emoji: '🌱', name: 'First Donation', threshold: 1, field: 'total' },
    { id: 'five', emoji: '⭐', name: '5 Donations', threshold: 5, field: 'total' },
    { id: 'ten', emoji: '🏅', name: '10 Donations', threshold: 10, field: 'total' },
    { id: 'kg50', emoji: '💪', name: '50 Kg Saved', threshold: 50, field: 'kg' },
    { id: 'kg100', emoji: '🦸', name: '100 Kg Hero', threshold: 100, field: 'kg' },
    { id: 'streak', emoji: '🔥', name: '5 Completed', threshold: 5, field: 'completed' }
];

// ========================================================================
// SAFE DOM HELPER — prevents null reference crashes
// ========================================================================
function $(id) { return document.getElementById(id); }

function safeOn(el, event, handler) {
    if (el) el.addEventListener(event, handler);
}

// ========================================================================
// DOM ELEMENTS
// ========================================================================
const els = {
    authContainer: $('auth-container'),
    donorDashboard: $('donor-dashboard'),
    ngoDashboard: $('ngo-dashboard'),
    adminDashboard: $('admin-dashboard'),
    userInfo: $('user-info'),
    userEmailDisplay: $('user-email-display'),
    userAvatar: $('user-avatar'),
    logoutBtn: $('logout-btn'),
    profileBtn: $('profile-btn'),
    profileModal: $('profile-modal'),
    closeProfileBtn: $('close-profile-btn'),
    profileForm: $('profile-form'),
    profilePhone: $('profile-phone'),
    forgotPasswordLink: $('forgot-password-link'),
    toastContainer: $('toast-container'),
    themeToggle: $('theme-toggle'),
    footer: $('app-footer'),
    
    tabLogin: $('tab-login'),
    tabRegister: $('tab-register'),
    loginForm: $('login-form'),
    registerForm: $('register-form'),
    authError: $('auth-error'),

    showDonationFormBtn: $('show-donation-form-btn'),
    donationFormContainer: $('donation-form-container'),
    cancelDonationBtn: $('cancel-donation-btn'),
    donationForm: $('donation-form'),
    myDonationsList: $('my-donations-list'),
    myHistoryList: $('my-history-list'),
    tabActiveDonations: $('tab-active-donations'),
    tabHistoryDonations: $('tab-history-donations'),
    donorLoading: $('donor-loading'),
    donorStatTotal: $('donor-stat-total'),
    donorStatActive: $('donor-stat-active'),
    donorStatCompleted: $('donor-stat-completed'),
    donorStatKg: $('donor-stat-kg'),
    impactMeals: $('impact-meals'),
    impactCo2: $('impact-co2'),
    donorBadges: $('donor-badges'),

    activeDonationsList: $('active-donations-list'),
    ngoStatusMsg: $('ngo-status-msg'),
    claimModal: $('claim-modal'),
    modalDonorContact: $('modal-donor-contact'),
    closeModalBtn: $('close-modal-btn'),
    ngoVerificationBanner: $('ngo-verification-banner'),
    ngoNeighborhoodFilter: $('ngo-neighborhood-filter'),
    ngoCategoryFilter: $('ngo-category-filter'),
    ngoLoading: $('ngo-loading'),
    viewGridBtn: $('view-grid-btn'),
    viewMapBtn: $('view-map-btn'),
    mapView: $('map-view'),

    adminNgoList: $('admin-ngo-list'),
    adminNgoStatusMsg: $('admin-ngo-status-msg'),
    adminDonationsList: $('admin-donations-list'),
    metricTotalDonations: $('metric-total-donations'),
    metricPendingNgos: $('metric-pending-ngos'),
    metricClaimedDonations: $('metric-claimed-donations'),
    adminAllNgoList: $('admin-all-ngo-list'),
    exportCsvBtn: $('export-csv-btn'),

    pwaInstallBanner: $('pwa-install-banner'),
    pwaInstallBtn: $('pwa-install-btn'),
    pwaDismissBtn: $('pwa-dismiss-btn')
};

// ========================================================================
// DARK MODE
// ========================================================================
function initTheme() {
    try {
        const saved = localStorage.getItem('sharefood-theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (e) { /* localStorage might be blocked */ }
}
initTheme();

safeOn(els.themeToggle, 'click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('sharefood-theme', next); } catch(e) {}
    if (leafletMap) leafletMap.invalidateSize();
});

// ========================================================================
// PWA
// ========================================================================
try {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
} catch(e) {}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        try {
            if (!localStorage.getItem('sharefood-pwa-dismissed') && els.pwaInstallBanner) {
                els.pwaInstallBanner.classList.add('show');
            }
        } catch(e) {}
    }, 3000);
});

safeOn(els.pwaInstallBtn, 'click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    }
    if (els.pwaInstallBanner) els.pwaInstallBanner.classList.remove('show');
});

safeOn(els.pwaDismissBtn, 'click', () => {
    if (els.pwaInstallBanner) els.pwaInstallBanner.classList.remove('show');
    try { localStorage.setItem('sharefood-pwa-dismissed', 'true'); } catch(e) {}
});

// ========================================================================
// TOAST NOTIFICATIONS
// ========================================================================
function showToast(message, type = 'success') {
    if (!els.toastContainer) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.success}</span><span>${message}</span>`;
    els.toastContainer.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ========================================================================
// ANIMATED COUNTER
// ========================================================================
function animateCounter(element, targetValue) {
    if (!element) return;
    const current = parseInt(element.textContent) || 0;
    if (current === targetValue) return;
    const duration = 600;
    const startTime = performance.now();
    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(current + (targetValue - current) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ========================================================================
// COUNTDOWN TIMER
// ========================================================================
function clearAllCountdowns() {
    countdownIntervals.forEach(id => clearInterval(id));
    countdownIntervals = [];
}

function formatCountdown(ms) {
    if (ms <= 0) return { text: 'Expired', urgency: 'critical' };
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    let text = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    let urgency = '';
    if (hours === 0 && minutes < 30) urgency = 'critical';
    else if (hours === 0) urgency = 'warning';
    return { text, urgency };
}

function startCountdown(elementId, expiryTimestamp) {
    if (!expiryTimestamp) return;
    const expiry = expiryTimestamp.toDate().getTime();
    function update() {
        const el = document.getElementById(elementId);
        if (!el) return;
        const remaining = expiry - Date.now();
        const { text, urgency } = formatCountdown(remaining);
        el.textContent = text;
        el.className = `countdown-text ${urgency}`;
        if (remaining <= 0) clearInterval(intervalId);
    }
    update();
    const intervalId = setInterval(update, 1000);
    countdownIntervals.push(intervalId);
}

// ========================================================================
// EXPIRY BAR
// ========================================================================
function getExpiryInfo(expiryTimestamp, createdAt) {
    if (!expiryTimestamp) return { percentage: 100, urgency: '' };
    const now = new Date();
    const expiry = expiryTimestamp.toDate();
    const created = createdAt ? createdAt.toDate() : new Date(expiry.getTime() - 6 * 3600000);
    const totalMs = expiry.getTime() - created.getTime();
    const remainingMs = expiry.getTime() - now.getTime();
    if (remainingMs <= 0) return { percentage: 0, urgency: 'critical' };
    const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
    let urgency = percentage < 20 ? 'critical' : percentage < 50 ? 'warning' : '';
    return { percentage, urgency };
}

function renderExpiryBar(expiryTimestamp, createdAt, countdownId) {
    const info = getExpiryInfo(expiryTimestamp, createdAt);
    return `<div class="expiry-bar-container"><div class="expiry-bar-label"><span>Time Remaining</span><span class="countdown-text" id="${countdownId}">—</span></div><div class="expiry-bar"><div class="expiry-bar-fill ${info.urgency}" style="width: ${info.percentage}%"></div></div></div>`;
}

// ========================================================================
// CATEGORY TAG
// ========================================================================
function renderCategoryTag(category) {
    const cat = CATEGORIES[category];
    if (!cat) return '';
    return `<span class="category-tag ${category}">${cat.emoji} ${cat.label}</span>`;
}

// ========================================================================
// SKELETON HELPERS
// ========================================================================
function hideSkeletonShowContent(skeletonEl, contentEl) {
    if (skeletonEl) skeletonEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'grid';
}

// ========================================================================
// BADGES
// ========================================================================
function renderBadges(totalCount, completedCount, kgSaved) {
    if (!els.donorBadges) return;
    els.donorBadges.innerHTML = '';
    BADGES.forEach(badge => {
        let value = badge.field === 'total' ? totalCount : badge.field === 'completed' ? completedCount : kgSaved;
        const earned = value >= badge.threshold;
        const div = document.createElement('div');
        div.className = `badge-item ${earned ? 'earned' : 'locked'}`;
        div.innerHTML = `<span class="badge-emoji">${badge.emoji}</span><span class="badge-name">${badge.name}</span>`;
        div.title = earned ? `Earned! (${value}/${badge.threshold})` : `${value}/${badge.threshold} to unlock`;
        els.donorBadges.appendChild(div);
    });
}

// ========================================================================
// MAP
// ========================================================================
function initMap() {
    if (leafletMap) return;
    if (typeof L === 'undefined') { console.warn('Leaflet not loaded'); return; }
    leafletMap = L.map('donation-map').setView([12.9352, 77.6245], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(leafletMap);
}

function updateMapMarkers(donations) {
    if (!leafletMap) return;
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];
    donations.forEach(item => {
        const { data, id } = item;
        const coords = NEIGHBORHOOD_COORDS[data.neighborhood];
        if (!coords) return;
        const lat = coords[0] + (Math.random() - 0.5) * 0.008;
        const lng = coords[1] + (Math.random() - 0.5) * 0.008;
        const cat = CATEGORIES[data.category] || { emoji: '📦', label: 'Food' };
        const marker = L.marker([lat, lng]).addTo(leafletMap);
        marker.bindPopup(`<div style="font-family:Inter,sans-serif;min-width:180px;"><strong>${data.foodItem}</strong><br><span style="color:#666;">${cat.emoji} ${cat.label} · ${data.quantityKg} Kg<br>📍 ${data.neighborhood}</span></div>`);
        mapMarkers.push(marker);
    });
    if (mapMarkers.length > 0) {
        leafletMap.fitBounds(L.featureGroup(mapMarkers).getBounds().pad(0.2));
    }
}

// ========================================================================
// CSV EXPORT
// ========================================================================
function exportDonationsCSV(donations) {
    const headers = ['Food Item', 'Category', 'Quantity (Kg)', 'Neighborhood', 'Status', 'Created At'];
    const rows = donations.map(d => [
        `"${(d.foodItem || '').replace(/"/g, '""')}"`,
        `"${(CATEGORIES[d.category] || {}).label || 'N/A'}"`,
        d.quantityKg || '',
        `"${d.neighborhood || ''}"`,
        d.status || '',
        d.createdAt ? d.createdAt.toDate().toISOString() : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sharefood-donations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV exported! 📥', 'success');
}

// ========================================================================
// AUTHENTICATION
// ========================================================================
onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            currentUser = user;
            
            if (user.email === 'admin@food.com') {
                userRole = 'Admin';
                isUserVerified = true;
                if (els.userEmailDisplay) els.userEmailDisplay.textContent = `${user.email} (Admin)`;
                if (els.userAvatar) els.userAvatar.textContent = 'A';
                if (els.userInfo) els.userInfo.style.display = 'flex';
                showDashboard(userRole);
                return;
            }

            const userDocRef = doc(db, 'users', user.uid);
            if (unsubscribeUser) unsubscribeUser();
            
            unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
                try {
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const wasVerified = isUserVerified;
                        userRole = userData.role;
                        isUserVerified = userData.isVerified === true;
                        if (els.userEmailDisplay) els.userEmailDisplay.textContent = `${user.email} (${userRole})`;
                        if (els.userAvatar) els.userAvatar.textContent = user.email.charAt(0).toUpperCase();
                        if (els.userInfo) els.userInfo.style.display = 'flex';
                        showDashboard(userRole);
                        if (userRole === 'NGO' && wasVerified !== isUserVerified) {
                            setupNGODashboard();
                        }
                    } else {
                        signOut(auth);
                    }
                } catch(err) { console.error('Auth snapshot error:', err); }
            }, (error) => console.error("Error fetching user role:", error));
        } else {
            currentUser = null;
            userRole = null;
            isUserVerified = false;
            if (els.userInfo) els.userInfo.style.display = 'none';
            clearAllCountdowns();
            showAuth();
            if (unsubscribeDonations) { unsubscribeDonations(); unsubscribeDonations = null; }
            if (unsubscribeAdminNGOs) { unsubscribeAdminNGOs(); unsubscribeAdminNGOs = null; }
            if (unsubscribeAdminDonations) { unsubscribeAdminDonations(); unsubscribeAdminDonations = null; }
            if (unsubscribeUser) { unsubscribeUser(); unsubscribeUser = null; }
        }
    } catch(err) { console.error('Auth state error:', err); }
});

function showAuth() {
    if (els.authContainer) els.authContainer.style.display = 'block';
    if (els.donorDashboard) els.donorDashboard.style.display = 'none';
    if (els.ngoDashboard) els.ngoDashboard.style.display = 'none';
    if (els.adminDashboard) els.adminDashboard.style.display = 'none';
    if (els.footer) els.footer.style.display = 'block';
    if (els.authError) els.authError.textContent = '';
}

function showDashboard(role) {
    if (els.authContainer) els.authContainer.style.display = 'none';
    if (els.donorDashboard) els.donorDashboard.style.display = 'none';
    if (els.ngoDashboard) els.ngoDashboard.style.display = 'none';
    if (els.adminDashboard) els.adminDashboard.style.display = 'none';
    if (els.footer) els.footer.style.display = 'block';

    if (role === 'Donor' || role === 'Individual') {
        if (els.donorDashboard) els.donorDashboard.style.display = 'block';
        setupDonorDashboard();
    } else if (role === 'NGO') {
        if (els.ngoDashboard) els.ngoDashboard.style.display = 'block';
        setupNGODashboard();
    } else if (role === 'Admin') {
        if (els.adminDashboard) els.adminDashboard.style.display = 'block';
        setupAdminDashboard();
    }
}

// ========================================================================
// AUTH UI
// ========================================================================
safeOn(els.tabLogin, 'click', () => {
    if (els.tabLogin) els.tabLogin.classList.add('active');
    if (els.tabRegister) els.tabRegister.classList.remove('active');
    if (els.loginForm) els.loginForm.style.display = 'block';
    if (els.registerForm) els.registerForm.style.display = 'none';
    if (els.authError) els.authError.textContent = '';
});

safeOn(els.tabRegister, 'click', () => {
    if (els.tabRegister) els.tabRegister.classList.add('active');
    if (els.tabLogin) els.tabLogin.classList.remove('active');
    if (els.registerForm) els.registerForm.style.display = 'block';
    if (els.loginForm) els.loginForm.style.display = 'none';
    if (els.authError) els.authError.textContent = '';
});

// Login
safeOn(els.loginForm, 'submit', async (e) => {
    e.preventDefault();
    const email = $('login-email')?.value;
    const password = $('login-password')?.value;
    if (!email || !password) return;
    const btn = els.loginForm.querySelector('button[type="submit"]');
    if (els.authError) els.authError.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (els.authError) els.authError.textContent = error.message;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
    }
});

// Register
safeOn(els.registerForm, 'submit', async (e) => {
    e.preventDefault();
    const email = $('register-email')?.value;
    const password = $('register-password')?.value;
    const phone = $('register-phone')?.value;
    const role = $('register-role')?.value;
    if (!email || !password) return;
    const btn = els.registerForm.querySelector('button[type="submit"]');
    if (els.authError) els.authError.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Creating Account...'; }
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData = { email, phone: phone || '', role: role || 'Individual', createdAt: serverTimestamp() };
        if (role === 'NGO') userData.isVerified = false;
        else userData.isVerified = true;
        await setDoc(doc(db, 'users', cred.user.uid), userData);
        showToast('Account created! 🎉', 'success');
    } catch (error) {
        if (els.authError) els.authError.textContent = error.message;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
    }
});

// Logout
safeOn(els.logoutBtn, 'click', () => signOut(auth));

// Forgot Password
safeOn(els.forgotPasswordLink, 'click', async (e) => {
    e.preventDefault();
    const email = $('login-email')?.value;
    if (!email) { if (els.authError) els.authError.textContent = "Enter your email first."; return; }
    try { await sendPasswordResetEmail(auth, email); showToast("Reset email sent!", "success"); }
    catch (error) { if (els.authError) els.authError.textContent = error.message; }
});

// Profile
safeOn(els.profileBtn, 'click', async () => {
    if (els.profileModal) els.profileModal.style.display = 'flex';
    try {
        if (currentUser) {
            const snap = await getDoc(doc(db, 'users', currentUser.uid));
            if (snap.exists() && els.profilePhone) els.profilePhone.value = snap.data().phone || '';
        }
    } catch(err) { console.error(err); }
});

safeOn(els.closeProfileBtn, 'click', () => { if (els.profileModal) els.profileModal.style.display = 'none'; });
safeOn(els.profileModal, 'click', (e) => { if (e.target === els.profileModal) els.profileModal.style.display = 'none'; });

safeOn(els.profileForm, 'submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !els.profilePhone) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid), { phone: els.profilePhone.value }, { merge: true });
        showToast("Profile updated!");
        if (els.profileModal) els.profileModal.style.display = 'none';
    } catch(err) { showToast("Error updating profile", "error"); }
});

// ========================================================================
// DONOR DASHBOARD
// ========================================================================
function setupDonorDashboard() {
    if (els.donorLoading) els.donorLoading.style.display = 'grid';
    if (els.myDonationsList) els.myDonationsList.style.display = 'none';
    clearAllCountdowns();

    const q = query(collection(db, "donations"), where("donorId", "==", currentUser.uid));
    if (unsubscribeDonations) unsubscribeDonations();
    
    unsubscribeDonations = onSnapshot(q, (snapshot) => {
        try {
            hideSkeletonShowContent(els.donorLoading, els.myDonationsList);
            clearAllCountdowns();
            if (els.myDonationsList) els.myDonationsList.innerHTML = '';
            if (els.myHistoryList) els.myHistoryList.innerHTML = '';
            
            let totalCount = 0, activeCount = 0, completedCount = 0, kgSaved = 0;
            let hasActive = false, hasHistory = false;

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                totalCount++;
                if (data.status === 'completed') { completedCount++; kgSaved += (data.quantityKg || 0); }
                
                const el = document.createElement('div');
                let badgeClass = 'badge-active', statusText = 'Active', statusClass = 'status-active';
                if (data.status === 'claimed') { badgeClass = 'badge-claimed'; statusText = 'Claimed'; statusClass = 'status-claimed'; }
                if (data.status === 'completed') { badgeClass = 'badge-completed'; statusText = 'Completed'; statusClass = 'status-completed'; }
                if (data.status === 'cancelled') { badgeClass = 'badge-cancelled'; statusText = 'Cancelled'; statusClass = 'status-cancelled'; }
                if (data.status === 'active' || data.status === 'claimed') activeCount++;
                
                el.className = `donation-card ${statusClass}`;
                const countdownId = `dc-${docSnap.id}`;
                const showExpiry = data.status === 'active' || data.status === 'claimed';
                const catHtml = data.category ? `<div class="category-tags">${renderCategoryTag(data.category)}</div>` : '';

                el.innerHTML = `
                    <div class="donation-badge ${badgeClass}">${statusText}</div>
                    <div class="donation-title">${data.foodItem}</div>
                    ${catHtml}
                    <div class="donation-detail"><span class="detail-icon">📍</span> ${data.neighborhood}</div>
                    <div class="donation-detail"><span class="detail-icon">⚖️</span> ${data.quantityKg} Kg</div>
                    ${showExpiry ? renderExpiryBar(data.expiryTimestamp, data.createdAt, countdownId) : ''}
                `;

                if (showExpiry) {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'donation-actions';
                    actionsDiv.innerHTML = `
                        <button class="btn btn-secondary btn-sm cancel-btn" data-id="${docSnap.id}">Cancel</button>
                        ${data.status === 'claimed' ? `<button class="btn btn-success btn-sm complete-btn" data-id="${docSnap.id}">✓ Completed</button>` : ''}
                    `;
                    el.appendChild(actionsDiv);
                    if (els.myDonationsList) els.myDonationsList.appendChild(el);
                    hasActive = true;
                    setTimeout(() => startCountdown(countdownId, data.expiryTimestamp), 50);
                } else {
                    if (els.myHistoryList) els.myHistoryList.appendChild(el);
                    hasHistory = true;
                }
            });

            animateCounter(els.donorStatTotal, totalCount);
            animateCounter(els.donorStatActive, activeCount);
            animateCounter(els.donorStatCompleted, completedCount);
            animateCounter(els.donorStatKg, Math.round(kgSaved));
            animateCounter(els.impactMeals, Math.round(kgSaved * 2));
            animateCounter(els.impactCo2, Math.round(kgSaved * 2.5));
            renderBadges(totalCount, completedCount, kgSaved);

            if (!hasActive && els.myDonationsList) {
                els.myDonationsList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="empty-state-icon">📭</span><div class="empty-state-title">No active donations</div><div class="empty-state-text">Click "New Donation" to share food.</div></div>`;
            }
            if (!hasHistory && els.myHistoryList) {
                els.myHistoryList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="empty-state-icon">📋</span><div class="empty-state-title">No history yet</div><div class="empty-state-text">Completed and cancelled donations appear here.</div></div>`;
            }

            document.querySelectorAll('.cancel-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Cancel this donation?')) {
                        await setDoc(doc(db, 'donations', e.target.getAttribute('data-id')), { status: 'cancelled' }, { merge: true });
                        showToast('Cancelled', 'info');
                    }
                });
            });
            document.querySelectorAll('.complete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Mark as picked up?')) {
                        await setDoc(doc(db, 'donations', e.target.getAttribute('data-id')), { status: 'completed' }, { merge: true });
                        showToast('Completed! 🎉', 'success');
                    }
                });
            });
        } catch(err) { console.error('Donor snapshot error:', err); }
    }, (error) => {
        console.error("Donor donations error:", error);
        hideSkeletonShowContent(els.donorLoading, els.myDonationsList);
    });
}

// Donor Tabs
safeOn(els.tabActiveDonations, 'click', () => {
    if (els.tabActiveDonations) els.tabActiveDonations.classList.add('active');
    if (els.tabHistoryDonations) els.tabHistoryDonations.classList.remove('active');
    if (els.myDonationsList) els.myDonationsList.style.display = 'grid';
    if (els.myHistoryList) els.myHistoryList.style.display = 'none';
});
safeOn(els.tabHistoryDonations, 'click', () => {
    if (els.tabHistoryDonations) els.tabHistoryDonations.classList.add('active');
    if (els.tabActiveDonations) els.tabActiveDonations.classList.remove('active');
    if (els.myHistoryList) els.myHistoryList.style.display = 'grid';
    if (els.myDonationsList) els.myDonationsList.style.display = 'none';
});

// Donation Form
safeOn(els.showDonationFormBtn, 'click', () => {
    if (els.donationFormContainer) els.donationFormContainer.style.display = 'block';
    if (els.showDonationFormBtn) els.showDonationFormBtn.style.display = 'none';
});
safeOn(els.cancelDonationBtn, 'click', () => {
    if (els.donationFormContainer) els.donationFormContainer.style.display = 'none';
    if (els.showDonationFormBtn) els.showDonationFormBtn.style.display = 'inline-flex';
    if (els.donationForm) els.donationForm.reset();
});

safeOn(els.donationForm, 'submit', async (e) => {
    e.preventDefault();
    const foodItem = $('food-item')?.value;
    const category = $('food-category')?.value || 'cooked';
    const quantityKg = parseFloat($('quantity')?.value) || 0;
    const neighborhood = $('neighborhood')?.value;
    const hoursValid = parseInt($('hours-valid')?.value) || 4;
    if (!foodItem || !neighborhood) return;
    
    const btn = els.donationForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }
    
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hoursValid);

    try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const phone = snap.exists() ? snap.data().phone : "No phone";
        await addDoc(collection(db, "donations"), {
            donorId: currentUser.uid, donorContact: phone, foodItem, category,
            quantityKg, neighborhood, expiryTimestamp: Timestamp.fromDate(expiryDate),
            status: 'active', claimedBy: null, createdAt: serverTimestamp()
        });
        if (els.donationForm) els.donationForm.reset();
        if (els.donationFormContainer) els.donationFormContainer.style.display = 'none';
        if (els.showDonationFormBtn) els.showDonationFormBtn.style.display = 'inline-flex';
        showToast("Donation posted! 🎉", "success");
    } catch (error) {
        showToast("Error: " + error.message, "error");
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Post Donation'; }
    }
});

// ========================================================================
// NGO DASHBOARD
// ========================================================================
function renderNGOVerificationBanner() {
    if (!els.ngoVerificationBanner) return;
    if (!isUserVerified) {
        els.ngoVerificationBanner.style.display = 'flex';
        els.ngoVerificationBanner.className = 'verification-banner';
        els.ngoVerificationBanner.innerHTML = `<span class="banner-icon">⏳</span><div class="banner-text"><strong>Verification Pending</strong> — Awaiting admin approval. You can browse but not claim.</div>`;
    } else {
        els.ngoVerificationBanner.style.display = 'flex';
        els.ngoVerificationBanner.className = 'verification-banner approved';
        els.ngoVerificationBanner.innerHTML = `<span class="banner-icon">✅</span><div class="banner-text"><strong>Verified NGO</strong> — You're approved to claim donations!</div>`;
        setTimeout(() => { if (els.ngoVerificationBanner) els.ngoVerificationBanner.style.display = 'none'; }, 5000);
    }
}

function getFilteredNGODonations() {
    const now = new Date();
    return ngoDonationsCache.filter(item => {
        if (item.data.expiryTimestamp && item.data.expiryTimestamp.toDate() < now) return false;
        if (ngoNeighborhoodFilter !== 'all' && item.data.neighborhood !== ngoNeighborhoodFilter) return false;
        if (ngoCategoryFilter !== 'all' && item.data.category !== ngoCategoryFilter) return false;
        return true;
    });
}

function renderNGODonations() {
    clearAllCountdowns();
    if (!els.activeDonationsList) return;
    els.activeDonationsList.innerHTML = '';
    if (els.ngoStatusMsg) els.ngoStatusMsg.textContent = '';
    
    const filtered = getFilteredNGODonations();
    updateMapMarkers(filtered);
    
    if (filtered.length === 0) {
        const filterMsg = ngoNeighborhoodFilter !== 'all' ? ` in ${ngoNeighborhoodFilter}` : '';
        els.activeDonationsList.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="empty-state-icon">🍽️</span><div class="empty-state-title">No donations${filterMsg}</div><div class="empty-state-text">New donations appear in real-time.</div></div>`;
        return;
    }
    
    filtered.forEach((item, index) => {
        const { data, id } = item;
        const el = document.createElement('div');
        el.className = 'donation-card status-active';
        el.style.animationDelay = `${index * 0.06}s`;
        const countdownId = `nc-${id}`;
        const catHtml = data.category ? `<div class="category-tags">${renderCategoryTag(data.category)}</div>` : '';
        
        el.innerHTML = `
            <div class="donation-badge badge-active">Available</div>
            <div class="donation-title">${data.foodItem}</div>
            ${catHtml}
            <div class="donation-detail"><span class="detail-icon">📍</span> ${data.neighborhood}</div>
            <div class="donation-detail"><span class="detail-icon">⚖️</span> ${data.quantityKg} Kg</div>
            ${renderExpiryBar(data.expiryTimestamp, data.createdAt, countdownId)}
            <div class="donation-actions">
                ${isUserVerified 
                    ? `<button class="btn btn-primary w-100 claim-btn" data-id="${id}">Claim Donation</button>`
                    : `<button class="btn btn-secondary w-100" disabled>⏳ Pending Verification</button>`}
            </div>
        `;
        els.activeDonationsList.appendChild(el);
        setTimeout(() => startCountdown(countdownId, data.expiryTimestamp), 50);
    });
    
    if (isUserVerified) {
        document.querySelectorAll('.claim-btn').forEach(btn => btn.addEventListener('click', handleClaimDonation));
    }
}

function setupNGODashboard() {
    renderNGOVerificationBanner();
    if (els.ngoLoading) els.ngoLoading.style.display = 'grid';
    if (els.activeDonationsList) els.activeDonationsList.style.display = 'none';
    
    const q = query(collection(db, "donations"), where("status", "==", "active"));
    if (unsubscribeDonations) unsubscribeDonations();
    
    unsubscribeDonations = onSnapshot(q, (snapshot) => {
        try {
            hideSkeletonShowContent(els.ngoLoading, els.activeDonationsList);
            ngoDonationsCache = [];
            snapshot.forEach((docSnap) => ngoDonationsCache.push({ id: docSnap.id, data: docSnap.data() }));
            renderNGODonations();
        } catch(err) { console.error('NGO snapshot error:', err); }
    }, (error) => {
        console.error("NGO donations error:", error);
        hideSkeletonShowContent(els.ngoLoading, els.activeDonationsList);
    });
}

// NGO Filters
safeOn(els.ngoNeighborhoodFilter, 'change', (e) => { ngoNeighborhoodFilter = e.target.value; renderNGODonations(); });
safeOn(els.ngoCategoryFilter, 'change', (e) => { ngoCategoryFilter = e.target.value; renderNGODonations(); });

// Map / Grid toggle
safeOn(els.viewGridBtn, 'click', () => {
    if (els.viewGridBtn) els.viewGridBtn.classList.add('active');
    if (els.viewMapBtn) els.viewMapBtn.classList.remove('active');
    if (els.mapView) els.mapView.style.display = 'none';
    if (els.activeDonationsList) els.activeDonationsList.style.display = 'grid';
});

safeOn(els.viewMapBtn, 'click', () => {
    if (els.viewMapBtn) els.viewMapBtn.classList.add('active');
    if (els.viewGridBtn) els.viewGridBtn.classList.remove('active');
    if (els.mapView) els.mapView.style.display = 'block';
    if (els.activeDonationsList) els.activeDonationsList.style.display = 'none';
    initMap();
    setTimeout(() => {
        if (leafletMap) leafletMap.invalidateSize();
        updateMapMarkers(getFilteredNGODonations());
    }, 150);
});

// Claim
async function handleClaimDonation(e) {
    const donationId = e.target.getAttribute('data-id');
    const donationRef = doc(db, 'donations', donationId);
    e.target.disabled = true;
    e.target.textContent = "Claiming...";
    try {
        const contactInfo = await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(donationRef);
            if (!docSnap.exists()) throw "Not found!";
            const data = docSnap.data();
            if (data.status !== 'active') throw "Already claimed by someone else.";
            if (data.expiryTimestamp && data.expiryTimestamp.toDate() < new Date()) throw "This donation has expired.";
            transaction.update(donationRef, { status: 'claimed', claimedBy: currentUser.uid, claimedAt: serverTimestamp() });
            return data.donorContact;
        });
        if (els.modalDonorContact) els.modalDonorContact.textContent = contactInfo;
        if (els.claimModal) els.claimModal.style.display = 'flex';
        showToast("Claimed! 🎉", "success");
    } catch (error) {
        showToast(String(error), "error");
        e.target.disabled = false;
        e.target.textContent = "Claim Donation";
    }
}

safeOn(els.closeModalBtn, 'click', () => { if (els.claimModal) els.claimModal.style.display = 'none'; });
safeOn(els.claimModal, 'click', (e) => { if (e.target === els.claimModal) els.claimModal.style.display = 'none'; });

// ========================================================================
// ADMIN DASHBOARD
// ========================================================================
function setupAdminDashboard() {
    const ngoQuery = query(collection(db, 'users'), where('role', '==', 'NGO'));
    if (unsubscribeAdminNGOs) unsubscribeAdminNGOs();
    
    unsubscribeAdminNGOs = onSnapshot(ngoQuery, (snapshot) => {
        try {
            if (els.adminNgoList) els.adminNgoList.innerHTML = '';
            if (els.adminAllNgoList) els.adminAllNgoList.innerHTML = '';
            let pendingDocs = [], allDocs = [];
            snapshot.forEach((docSnap) => {
                allDocs.push(docSnap);
                if (docSnap.data().isVerified === false) pendingDocs.push(docSnap);
            });
            animateCounter(els.metricPendingNgos, pendingDocs.length);

            if (pendingDocs.length === 0) {
                if (els.adminNgoStatusMsg) els.adminNgoStatusMsg.textContent = "No pending verifications ✨";
            } else {
                if (els.adminNgoStatusMsg) els.adminNgoStatusMsg.textContent = "";
                pendingDocs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${data.email}</td><td>${data.phone || 'N/A'}</td><td><button class="btn btn-primary btn-sm approve-ngo-btn" data-id="${docSnap.id}">✓ Approve</button> <button class="btn btn-danger btn-sm reject-ngo-btn" data-id="${docSnap.id}">✕ Reject</button></td>`;
                    if (els.adminNgoList) els.adminNgoList.appendChild(tr);
                });
            }

            if (els.adminAllNgoList) {
                allDocs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const tr = document.createElement('tr');
                    let statusText = 'Pending', statusClass = 'pending';
                    if (data.isVerified === true) { statusText = 'Approved'; statusClass = 'approved'; }
                    else if (data.isVerified === 'rejected') { statusText = 'Rejected'; statusClass = 'rejected'; }
                    let actionHtml = data.isVerified === true
                        ? `<button class="btn btn-secondary btn-sm revoke-ngo-btn" data-id="${docSnap.id}">Revoke</button>`
                        : data.isVerified === 'rejected'
                        ? `<button class="btn btn-primary btn-sm reverify-ngo-btn" data-id="${docSnap.id}">Re-verify</button>`
                        : `<button class="btn btn-primary btn-sm approve-ngo-btn" data-id="${docSnap.id}">✓ Approve</button> <button class="btn btn-danger btn-sm reject-ngo-btn" data-id="${docSnap.id}">✕ Reject</button>`;
                    tr.innerHTML = `<td>${data.email}</td><td>${data.phone || 'N/A'}</td><td><span class="status-pill ${statusClass}">${statusText}</span></td><td>${actionHtml}</td>`;
                    els.adminAllNgoList.appendChild(tr);
                });
            }

            // Admin NGO action handlers
            document.querySelectorAll('.approve-ngo-btn').forEach(btn => btn.addEventListener('click', async (e) => {
                try { await setDoc(doc(db, 'users', e.target.getAttribute('data-id')), { isVerified: true }, { merge: true }); showToast("NGO verified! ✅"); }
                catch(err) { showToast("Failed to verify.", "error"); }
            }));
            document.querySelectorAll('.reject-ngo-btn').forEach(btn => btn.addEventListener('click', async (e) => {
                if (!confirm("Reject this NGO?")) return;
                try { await setDoc(doc(db, 'users', e.target.getAttribute('data-id')), { isVerified: 'rejected' }, { merge: true }); showToast("NGO rejected.", "warning"); }
                catch(err) { showToast("Failed.", "error"); }
            }));
            document.querySelectorAll('.revoke-ngo-btn').forEach(btn => btn.addEventListener('click', async (e) => {
                if (!confirm("Revoke access?")) return;
                try { await setDoc(doc(db, 'users', e.target.getAttribute('data-id')), { isVerified: false }, { merge: true }); showToast("Access revoked.", "info"); }
                catch(err) { showToast("Failed.", "error"); }
            }));
            document.querySelectorAll('.reverify-ngo-btn').forEach(btn => btn.addEventListener('click', async (e) => {
                if (!confirm("Re-verify?")) return;
                try { await setDoc(doc(db, 'users', e.target.getAttribute('data-id')), { isVerified: true }, { merge: true }); showToast("Re-verified! ✅"); }
                catch(err) { showToast("Failed.", "error"); }
            }));
        } catch(err) { console.error('Admin NGO error:', err); }
    }, (error) => { console.error("NGO query error:", error); });

    // Donations
    const donationsQuery = query(collection(db, 'donations'));
    if (unsubscribeAdminDonations) unsubscribeAdminDonations();
    
    unsubscribeAdminDonations = onSnapshot(donationsQuery, (snapshot) => {
        try {
            if (els.adminDonationsList) els.adminDonationsList.innerHTML = '';
            animateCounter(els.metricTotalDonations, snapshot.size);
            let claimedCount = 0;
            adminDonationsCache = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                adminDonationsCache.push({ id: docSnap.id, ...data });
                if (data.status === 'claimed' || data.status === 'completed') claimedCount++;
            });
            animateCounter(els.metricClaimedDonations, claimedCount);
            adminDonationsCache.sort((a, b) => ((b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));

            adminDonationsCache.forEach(data => {
                const tr = document.createElement('tr');
                const cat = CATEGORIES[data.category] || { emoji: '📦', label: 'N/A' };
                const statusClass = data.status || 'active';
                const statusLabel = data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Active';
                tr.innerHTML = `
                    <td>${data.foodItem}</td>
                    <td><span class="category-tag ${data.category || ''}">${cat.emoji} ${cat.label}</span></td>
                    <td>${data.neighborhood}</td>
                    <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                    <td>${(data.status === 'claimed' || data.status === 'completed') ? 'NGO' : '—'}</td>
                `;
                if (els.adminDonationsList) els.adminDonationsList.appendChild(tr);
            });
        } catch(err) { console.error('Admin donations error:', err); }
    });
}

// CSV Export
safeOn(els.exportCsvBtn, 'click', () => {
    if (adminDonationsCache.length === 0) { showToast("No data to export.", "warning"); return; }
    exportDonationsCSV(adminDonationsCache);
});

console.log('ShareFood app loaded successfully ✅');
