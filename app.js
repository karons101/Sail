// --- ALL IMPORTS AT THE VERY TOP OF THE FILE ---
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
    
    // New DOM elements for this update
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const uploadMediaBtn = document.getElementById('upload-media-btn');
    const mediaUploadInput = document.getElementById('media-upload-input');
    
    // --- Initialize Firebase objects ---
    const auth = getAuth();
    const storage = getStorage();
    
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
            // Set user name and avatar based on the user object
            userName.textContent = user.isAnonymous ? "Hello, Anonymous!" : `Hello, ${user.email.split('@')[0]}!`;
            // Add a sign-out button
            const signOutBtn = document.createElement('button');
            signOutBtn.textContent = 'Sign Out';
            signOutBtn.classList.add('sign-out-btn');
            signOutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    console.log('User signed out.');
                    // Reload the page to go back to the landing view
                    window.location.reload();
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            });
    
            // Remove any existing sign out button before adding the new one
            const existingSignOutBtn = document.querySelector('.sign-out-btn');
            if (existingSignOutBtn) {
                existingSignOutBtn.remove();
            }
            // Append the sign out button to the profile view
            profileView.querySelector('.profile-actions').appendChild(signOutBtn);
        }
    };
    
    const hideMainApp = () => {
        landingPage.classList.remove('hidden');
        mainAppView.classList.add('hidden');
        if (backgroundVideo) {
            backgroundVideo.play().catch(e => console.error("Video autoplay failed:", e));
        }
    };
    
    // --- Firebase Authentication Listeners ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in. Let's show the main app.
            console.log('User signed in:', user.uid);
            showMainApp(user);
        } else {
            // User is signed out. Hide the main app.
            console.log('User is signed out.');
            hideMainApp();
        }
    });

    // --- Event Listeners ---
    // Change this listener to always show the modal, regardless of auth state
    if (ctaGetStartedBtn) {
        ctaGetStartedBtn.addEventListener('click', showModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideModal);
    }
    
    if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
    if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));
    
    // Firebase Authentication Functions
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['loginEmail'].value;
        const password = loginForm['loginPassword'].value;
    
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful!");
            // The onAuthStateChanged listener will handle the UI update
        } catch (error) {
            console.error("Login failed:", error.message);
            alert("Login failed. Please check your email and password.");
        }
    });
    
    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupForm['signupEmail'].value;
        const password = signupForm['signupPassword'].value;
    
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Signup successful!");
            // The onAuthStateChanged listener will handle the UI update
        } catch (error) {
            console.error("Signup failed:", error.message);
            alert("Signup failed. " + error.message);
        }
    });
    
    if (anonymousSignInBtn) anonymousSignInBtn.addEventListener('click', async () => {
        try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
            // The onAuthStateChanged listener will handle the UI update
        } catch (error) {
            console.error("Anonymous sign-in failed:", error.message);
            alert("Anonymous sign-in failed. " + error.message);
        }
    });
    
    // Temporary upload button logic - we'll connect this to storage next
    if (uploadMediaBtn) {
        uploadMediaBtn.addEventListener('click', () => {
            // Trigger the hidden file input
            mediaUploadInput.click();
        });
    }

    if (mediaUploadInput) {
        mediaUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log(`Ready to upload file: ${file.name}`);
                alert(`File selected: ${file.name}. Upload functionality is next!`);
                // We will add the Firebase Storage upload logic here later
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