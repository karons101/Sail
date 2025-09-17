// --- ALL IMPORTS AT THE VERY TOP OF THE FILE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Your Firebase Configuration ---
// Paste your unique firebaseConfig object here.
const firebaseConfig = {
    apiKey: "AIzaSyDE5CLei6LxQ3vupIdQcRq2aBp2xLypgyY",
    authDomain: "yellowsail-app.firebaseapp.com",
    projectId: "yellowsail-app",
    storageBucket: "yellowsail-app.firebasestorage.app",
    messagingSenderId: "1:434797371517:web:87238d47fe3761d0761114",
    appId: "YOUR_APP_ID"
};

// --- Initialize Firebase objects ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// --- All logic inside ONE DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM queries (ALL TOGETHER AT THE TOP) ---
    const landingPage = document.getElementById('landing-page');
    const backgroundVideo = document.getElementById('backgroundVideo');
    const ctaGetStartedBtn = document.getElementById('cta-get-started');
    const mainAppView = document.getElementById('mainAppView');
    const authModal = document.getElementById('authModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const anonymousSignInBtn = document.getElementById('anonymousSignInBtn');
    const publicFeedTab = document.getElementById('publicFeedTab');
    const profileTab = document.getElementById('profileTab');
    const chatTab = document.getElementById('chatTab');
    const publicFeedView = document.getElementById('publicFeedView');
    const profileView = document.getElementById('profileView');
    const chatView = document.getElementById('chatView');

    // Elements for the Profile page and file uploads
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const uploadMediaBtn = document.getElementById('upload-media-btn');
    const mediaUploadInput = document.getElementById('media-upload-input');
    const profileActionsContainer = profileView.querySelector('.profile-actions');

    // --- Video Playlist Logic ---
    const videoPlaylist = [
        'assets/beauty_nature.mp4',
        'assets/nature.mp4',
        'assets/music_video.mp4'
    ];
    let currentVideoIndex = 0;

    function playNextVideo() {
        if (backgroundVideo && videoPlaylist.length > 0) {
            backgroundVideo.src = videoPlaylist[currentVideoIndex];
            backgroundVideo.load();
            backgroundVideo.play().catch(e => {
                console.error("Video autoplay failed:", e);
            });
        }
    }

    if (backgroundVideo) {
        backgroundVideo.addEventListener('ended', () => {
            currentVideoIndex++;
            if (currentVideoIndex >= videoPlaylist.length) {
                currentVideoIndex = 0;
            }
            playNextVideo();
        });
        playNextVideo();
    }

    // --- Modal Logic ---
    const showModal = () => {
        authModal.classList.remove('hidden');
    };

    const hideModal = () => {
        authModal.classList.add('hidden');
    };

    // --- Tab Switching Logic for Auth Modal ---
    const switchAuthTab = (tab) => {
        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
        } else {
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
        }
    };

    // --- User Management & UI Logic ---
    const showMainApp = (user) => {
        landingPage.classList.add('hidden');
        mainAppView.classList.remove('hidden');
        if (backgroundVideo) {
            backgroundVideo.pause();
        }
        hideModal();
        updateUserProfileUI(user);
    };
    
    const updateUserProfileUI = (user) => {
        if (user) {
            userName.textContent = user.isAnonymous ? "Hello, Anonymous!" : `Hello, ${user.email.split('@')[0]}!`;
            
            const signOutBtn = document.createElement('button');
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.classList.add('action-btn');
            signOutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    console.log('User signed out.');
                    window.location.reload(); 
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            });

            const existingSignOutBtn = profileActionsContainer.querySelector('.action-btn.sign-out-btn');
            if (existingSignOutBtn) {
                existingSignOutBtn.remove();
            }
            profileActionsContainer.appendChild(signOutBtn);
        }
    };

    const hideMainApp = () => {
        landingPage.classList.remove('hidden');
        mainAppView.classList.add('hidden');
        if (backgroundVideo) {
            backgroundVideo.play().catch(e => console.error("Video autoplay failed:", e));
        }
    };

    // --- Firebase Authentication Listener ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User signed in:', user.uid);
            showMainApp(user);
        } else {
            console.log('User is signed out.');
            hideMainApp();
        }
    });

    // --- Event Listeners ---
    if (ctaGetStartedBtn) {
        ctaGetStartedBtn.addEventListener('click', showModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideModal);
    }

    if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
    if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));

    // Firebase Login and Signup functions
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['loginEmail'].value;
        const password = loginForm['loginPassword'].value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful!");
        } catch (error) {
            console.error("Login failed:", error.message);
            alert("Login failed. " + error.message);
        }
    });

    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupForm['signupEmail'].value;
        const password = signupForm['signupPassword'].value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Signup successful!");
        } catch (error) {
            console.error("Signup failed:", error.message);
            alert("Signup failed. " + error.message);
        }
    });

    if (anonymousSignInBtn) anonymousSignInBtn.addEventListener('click', async () => {
        try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        } catch (error) {
            console.error("Anonymous sign-in failed:", error.message);
            alert("Anonymous sign-in failed. " + error.message);
        }
    });

    if (uploadMediaBtn) {
        uploadMediaBtn.addEventListener('click', () => {
            mediaUploadInput.click();
        });
    }

    if (mediaUploadInput) {
        mediaUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log(`Ready to upload file: ${file.name}`);
                alert(`File selected: ${file.name}. Upload functionality coming soon!`);
            }
        });
    }

    // --- Main App Tab Switching Logic ---
    function switchMainTab(viewId) {
        const tabs = {
            'publicFeedView': publicFeedTab,
            'profileView': profileTab,
            'chatView': chatTab
        };

        const views = [publicFeedView, profileView, chatView];
        views.forEach(view => {
            view.classList.add('hidden');
        });

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }

        for (const id in tabs) {
            if (tabs[id]) {
                tabs[id].classList.remove('active');
            }
        }
        
        if (tabs[viewId]) {
            tabs[viewId].classList.add('active');
        }
    }

    if (publicFeedTab) publicFeedTab.addEventListener('click', () => switchMainTab('publicFeedView'));
    if (profileTab) profileTab.addEventListener('click', () => switchMainTab('profileView'));
    if (chatTab) chatTab.addEventListener('click', () => switchMainTab('chatView'));
    
    // Initial tab setup
    switchMainTab('publicFeedView');
});