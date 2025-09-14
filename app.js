import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, addDoc, onSnapshot, collection, setLogLevel, serverTimestamp, query, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// --- Database Path Constants ---
const USER_DOC_PATH = (uid) => `users/${uid}`;
const PUBLIC_FEED_PATH = 'publicFeed';
const PUBLIC_MUSIC_FILES_PATH = 'publicMusicFiles';
const USER_MUSIC_FILES_PATH = (uid) => `users/${uid}/myLibrary`;
const PUBLIC_CHAT_PATH = 'publicChat';

// --- API Configuration ---
const YOUTUBE_API_KEY = 'AIzaSyD7bRJRc2tN7wbmXAdDEoOlAkmUuRNbH1M';

// --- YouTube IFrame Player ---
let youtubePlayer;
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtubePlayer', {
        height: '360',
        width: '100%',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
        },
        events: {
            'onReady': onPlayerReady,
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player is ready.');
}

// --- All App Logic Inside a Single DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Queries (ALL TOGETHER AT THE TOP) ---
    const landingPage = document.getElementById('landing-page');
    const backgroundVideo = document.getElementById('backgroundVideo');
    const ctaGetStartedBtn = document.getElementById('cta-get-started');
    const mainAppView = document.getElementById('mainAppView');
    const userIdDisplay = document.getElementById('userIdDisplay');
    const messageInput = document.getElementById('messageInput');
    const postMessageBtn = document.getElementById('postMessageBtn');
    const publicFileInput = document.getElementById('publicFileInput');
    const publicUploadBtn = document.getElementById('publicUploadBtn');
    const contentList = document.getElementById('contentList');
    const playerContainer = document.getElementById('playerContainer');
    const nowPlayingTitle = document.getElementById('nowPlayingTitle');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const publicFeedTab = document.getElementById('publicFeedTab');
    const profileTab = document.getElementById('profileTab');
    const chatTab = document.getElementById('chatTab');
    const publicFeedView = document.getElementById('publicFeedView');
    const profileView = document.getElementById('profileView');
    const chatView = document.getElementById('chatView');
    const avatar = document.getElementById('avatar');
    const avatarInput = document.getElementById('avatarInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const libraryFileInput = document.getElementById('libraryFileInput');
    const libraryUploadBtn = document.getElementById('libraryUploadBtn');
    const myLibraryList = document.getElementById('myLibraryList');
    const authModal = document.getElementById('authModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const signupForm = document.getElementById('signupForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginForm = document.getElementById('loginForm');
    const signOutBtn = document.getElementById('signOutBtn');
    const authBtn = document.getElementById('authBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const youtubeSearchInput = document.getElementById('youtubeSearchInput');
    const youtubeSearchBtn = document.getElementById('youtubeSearchBtn');
    const youtubeResults = document.getElementById('youtubeResults');
    const youtubePlayerDiv = document.getElementById('youtubePlayer');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');

    // --- Firebase Initialization ---
    const firebaseConfig = typeof window.__firebase_config !== 'undefined' ? JSON.parse(window.__firebase_config) : null;
    let app, auth, db, storage, userId;

    if (firebaseConfig) {
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            storage = getStorage(app);
            setLogLevel('debug');
            console.log("Firebase initialized successfully.");
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            userIdDisplay.textContent = 'Config Error';
        }
    } else {
        userIdDisplay.textContent = 'Config Error';
        console.error("Firebase configuration is missing.");
    }

    // --- Core Functions ---
    function showView(view) {
        // Hide all views first
        [publicFeedView, profileView, chatView].forEach(v => v.style.display = 'none');
        // Remove active class from all tabs
        [publicFeedTab, profileTab, chatTab].forEach(t => t.classList.remove('active'));

        // Show the selected view and set the active tab
        if (view === 'feed') {
            publicFeedView.style.display = 'block';
            publicFeedTab.classList.add('active');
        } else if (view === 'profile') {
            profileView.style.display = 'block';
            profileTab.classList.add('active');
        } else if (view === 'chat') {
            chatView.style.display = 'block';
            chatTab.classList.add('active');
        }
    }

    const showModal = () => {
        authModal.classList.add('show');
    };

    const hideModal = () => {
        authModal.classList.remove('show');
    };

    function switchAuthTab(tab) {
        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            loginTab.classList.add('bg-yellow-400', 'text-gray-900');
            loginTab.classList.remove('bg-gray-700', 'text-gray-400');
            signupTab.classList.add('bg-gray-700', 'text-gray-400');
            signupTab.classList.remove('bg-yellow-400', 'text-gray-900');
        } else {
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            signupTab.classList.add('bg-yellow-400', 'text-gray-900');
            signupTab.classList.remove('bg-gray-700', 'text-gray-400');
            loginTab.classList.add('bg-gray-700', 'text-gray-400');
            loginTab.classList.remove('bg-yellow-400', 'text-gray-900');
        }
    }

    function renderPublicContent(contentArray) {
        contentList.innerHTML = '';
        if (contentArray.length === 0) {
            contentList.innerHTML = '<p>No content found.</p>';
            return;
        }

        contentArray.forEach(async (contentDoc) => {
            const contentData = contentDoc.data();
            const contentId = contentDoc.id;
            let likes = contentData.likes || [];
            const isLiked = userId && likes.includes(userId);
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content-item';
            contentDiv.dataset.docId = contentId;
            contentDiv.innerHTML = `
                <div class="content-title">${contentData.title}</div>
                <div class="content-author">Uploaded by: ${contentData.authorId.substring(0, 8)}...</div>
                <div class="social-buttons">
                    <button class="play-btn" data-url="${contentData.url}" data-type="${contentData.fileType}">Play</button>
                    <button class="like-btn" data-doc-id="${contentId}" ${!userId ? 'disabled' : ''}>${isLiked ? 'Liked' : 'Like'} (<span class="like-count">${likes.length}</span>)</button>
                </div>
                <div class="comments-section" id="comments-section-${contentId}">
                    <h4>Comments</h4>
                    <div class="comment-list"></div>
                    <div class="comment-form">
                        <input type="text" placeholder="Add a comment..." data-doc-id="${contentId}">
                        <button class="comment-btn" ${!userId ? 'disabled' : ''}>Post</button>
                    </div>
                </div>
            `;
            contentList.prepend(contentDiv);

            onSnapshot(collection(db, PUBLIC_MUSIC_FILES_PATH, contentId, 'comments'), (commentSnapshot) => {
                const commentListDiv = document.querySelector(`#comments-section-${contentId} .comment-list`);
                if (commentListDiv) {
                    commentListDiv.innerHTML = '';
                    commentSnapshot.forEach((commentDoc) => {
                        const commentData = commentDoc.data();
                        const commentDiv = document.createElement('div');
                        commentDiv.className = 'comment-item';
                        commentDiv.innerHTML = `
                            <span class="comment-author">${commentData.authorId.substring(0, 8)}...:</span>
                            ${commentData.content}
                        `;
                        commentListDiv.prepend(commentDiv);
                    });
                }
            });
        });
    }

    // --- Main Authentication State Listener ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            userIdDisplay.textContent = userId;
            authBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
            landingPage.style.display = 'none';
            mainAppView.style.display = 'flex';

            if (backgroundVideo) {
                backgroundVideo.pause();
            }

            console.log("User signed in with ID:", userId);
            showView('feed');

            const userDocRef = doc(db, USER_DOC_PATH(userId));
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().avatarUrl) {
                avatar.src = userDocSnap.data().avatarUrl;
            } else {
                avatar.src = 'https://i.ibb.co/Ctnz36D/avatar-placeholder.png';
            }

            publicUploadBtn.disabled = false;
            postMessageBtn.disabled = false;
            libraryUploadBtn.disabled = false;
            changeAvatarBtn.disabled = false;
            sendChatBtn.disabled = false;

            onSnapshot(collection(db, USER_MUSIC_FILES_PATH(userId)), (querySnapshot) => {
                myLibraryList.innerHTML = '';
                if (querySnapshot.empty) {
                    myLibraryList.innerHTML = '<p>Your library is empty. Upload some content!</p>';
                }
                querySnapshot.forEach(async (contentDoc) => {
                    const contentData = contentDoc.data();
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'content-item';
                    contentDiv.innerHTML = `
                        <div class="content-title">${contentData.title}</div>
                        <div class="content-author">Uploaded by: You</div>
                        <div class="social-buttons">
                            <button class="play-btn" data-url="${contentData.url}" data-type="${contentData.fileType}">Play</button>
                        </div>
                    `;
                    myLibraryList.prepend(contentDiv);
                });
            }, (error) => {
                console.error("Error listening to user's library:", error);
            });
        } else {
            userId = null;
            userIdDisplay.textContent = 'Guest';
            authBtn.style.display = 'block';
            signOutBtn.style.display = 'none';
            landingPage.style.display = 'flex';
            mainAppView.style.display = 'none';
            if (backgroundVideo) {
                backgroundVideo.play();
            }

            publicUploadBtn.disabled = true;
            postMessageBtn.disabled = true;
            libraryUploadBtn.disabled = true;
            changeAvatarBtn.disabled = true;
            sendChatBtn.disabled = true;
            myLibraryList.innerHTML = '<p>Login to see your private content library.</p>';
        }

        // --- Public Feed & Chat Listeners (always active) ---
        onSnapshot(collection(db, PUBLIC_FEED_PATH), (querySnapshot) => {
            const messageList = document.getElementById('messageList');
            messageList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const messageData = doc.data();
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                messageDiv.innerHTML = `
                    <div class="message-author">${messageData.authorId.substring(0, 8)}...</div>
                    <div class="message-content">${messageData.content}</div>
                `;
                messageList.prepend(messageDiv);
            });
        }, (error) => {
            console.error("Error listening to public feed:", error);
        });

        onSnapshot(collection(db, PUBLIC_MUSIC_FILES_PATH), (querySnapshot) => {
            renderPublicContent(querySnapshot.docs);
        }, (error) => {
            console.error("Error listening to public content feed:", error);
        });

        onSnapshot(collection(db, PUBLIC_CHAT_PATH), (querySnapshot) => {
            chatMessages.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const messageData = doc.data();
                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message';
                messageDiv.innerHTML = `
                    <span class="chat-author">${messageData.authorId.substring(0, 8)}...:</span>
                    <span class="chat-content">${messageData.content}</span>
                `;
                chatMessages.prepend(messageDiv);
            });
        }, (error) => {
            console.error("Error listening to public chat:", error);
        });
    });

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
            backgroundVideo.play();
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
    
    // --- All Event Listeners ---
    if (ctaGetStartedBtn) {
        ctaGetStartedBtn.addEventListener('click', async () => {
            if (!auth) {
                console.error("Firebase is not initialized. Check your configuration.");
                return;
            }
            try {
                await signInAnonymously(auth);
                console.log("Signed in anonymously.");
            } catch (error) {
                console.error("Authentication failed:", error);
                showModal();
            }
        });
    }

    if (authBtn) authBtn.addEventListener('click', showModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (window) window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            hideModal();
        }
    });
    
    if (loginTab) loginTab.addEventListener('click', () => switchAuthTab('login'));
    if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!auth) return;
            const email = signupEmailInput.value;
            const password = signupPasswordInput.value;
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                hideModal();
            } catch (error) {
                console.error('Signup failed:', error);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!auth) return;
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                hideModal();
            } catch (error) {
                console.error('Login failed:', error);
            }
        });
    }
    
    if (signOutBtn) signOutBtn.addEventListener('click', async () => {
        if (!auth) return;
        await signOut(auth);
    });

    if (publicFeedTab) publicFeedTab.addEventListener('click', () => showView('feed'));
    if (profileTab) profileTab.addEventListener('click', () => showView('profile'));
    if (chatTab) chatTab.addEventListener('click', () => showView('chat'));

    if (postMessageBtn) {
        postMessageBtn.addEventListener('click', async () => {
            if (!userId) return;
            const message = messageInput.value.trim();
            if (message.length > 0) {
                try {
                    await addDoc(collection(db, PUBLIC_FEED_PATH), {
                        authorId: userId,
                        content: message,
                        createdAt: serverTimestamp()
                    });
                    messageInput.value = '';
                } catch (e) {
                    console.error("Error adding message:", e);
                }
            }
        });
    }

    if (publicUploadBtn) {
        publicUploadBtn.addEventListener('click', async () => {
            if (!userId) return;
            const file = publicFileInput.files[0];
            if (!file) return;

            publicUploadBtn.disabled = true;
            const storageRef = ref(storage, `${PUBLIC_MUSIC_FILES_PATH}/${userId}/${file.name}`);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                await addDoc(collection(db, PUBLIC_MUSIC_FILES_PATH), {
                    title: file.name,
                    url: downloadURL,
                    fileType: file.type.split('/')[0],
                    authorId: userId,
                    likes: [],
                    createdAt: serverTimestamp()
                });
                console.log('File uploaded and metadata saved to Firestore!');
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                publicUploadBtn.disabled = false;
            }
        });
    }

    if (contentList) {
        contentList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('play-btn')) {
                const url = e.target.dataset.url;
                const type = e.target.dataset.type;
                const title = e.target.closest('.content-item').querySelector('.content-title').textContent;

                nowPlayingTitle.textContent = `Now Playing: ${title}`;
                playerContainer.style.display = 'block';
                youtubePlayerDiv.style.display = 'none';

                if (type === 'audio') {
                    audioPlayer.src = url;
                    videoPlayer.style.display = 'none';
                    audioPlayer.style.display = 'block';
                    audioPlayer.play();
                } else if (type === 'video') {
                    videoPlayer.src = url;
                    audioPlayer.style.display = 'none';
                    videoPlayer.style.display = 'block';
                    videoPlayer.play();
                }
            }

            if (e.target.classList.contains('like-btn')) {
                if (!userId) return;
                const docId = e.target.dataset.docId;
                const docRef = doc(db, PUBLIC_MUSIC_FILES_PATH, docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const likes = docSnap.data().likes || [];
                    if (likes.includes(userId)) {
                        await updateDoc(docRef, { likes: arrayRemove(userId) });
                    } else {
                        await updateDoc(docRef, { likes: arrayUnion(userId) });
                    }
                }
            }

            if (e.target.classList.contains('comment-btn')) {
                if (!userId) return;
                const commentInput = e.target.closest('.comment-form').querySelector('input');
                const docId = commentInput.dataset.docId;
                const commentText = commentInput.value.trim();

                if (commentText) {
                    try {
                        await addDoc(collection(db, PUBLIC_MUSIC_FILES_PATH, docId, 'comments'), {
                            authorId: userId,
                            content: commentText,
                            createdAt: serverTimestamp()
                        });
                        commentInput.value = '';
                    } catch (e) {
                        console.error("Error adding comment:", e);
                    }
                }
            }
        });
    }

    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            if (!userId) return;
            const file = e.target.files[0];
            if (!file) return;

            const storageRef = ref(storage, `avatars/${userId}`);

            try {
                await uploadBytes(storageRef, file);
                const avatarUrl = await getDownloadURL(storageRef);
                const userDocRef = doc(db, USER_DOC_PATH(userId));
                await setDoc(userDocRef, { avatarUrl: avatarUrl }, { merge: true });
                avatar.src = avatarUrl;
                console.log("Avatar updated successfully.");
            } catch (error) {
                console.error("Failed to upload avatar:", error);
            }
        });
    }

    if (libraryUploadBtn) {
        libraryUploadBtn.addEventListener('click', async () => {
            if (!userId) return;
            const file = libraryFileInput.files[0];
            if (!file) return;

            libraryUploadBtn.disabled = true;
            const storageRef = ref(storage, `${USER_MUSIC_FILES_PATH(userId)}/${file.name}`);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                await addDoc(collection(db, USER_MUSIC_FILES_PATH(userId)), {
                    title: file.name,
                    url: downloadURL,
                    fileType: file.type.split('/')[0],
                    authorId: userId,
                    createdAt: serverTimestamp()
                });
                console.log('File uploaded to library and metadata saved to Firestore!');
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                libraryUploadBtn.disabled = false;
            }
        });
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', async () => {
            if (!userId) return;
            const message = chatInput.value.trim();
            if (message) {
                try {
                    await addDoc(collection(db, PUBLIC_CHAT_PATH), {
                        authorId: userId,
                        content: message,
                        createdAt: serverTimestamp()
                    });
                    chatInput.value = '';
                } catch (e) {
                    console.error("Error sending chat message:", e);
                }
            }
        });
    }

    if (youtubeSearchBtn) {
        youtubeSearchBtn.addEventListener('click', async () => {
            const query = youtubeSearchInput.value.trim();
            if (!query) return;
            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=10`);
                if (!response.ok) {
                    throw new Error(`YouTube API request failed with status: ${response.status}`);
                }
                const data = await response.json();
                youtubeResults.innerHTML = '';
                data.items.forEach(item => {
                    const videoId = item.id.videoId;
                    const title = item.snippet.title;
                    const thumbnail = item.snippet.thumbnails.default.url;
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'search-result-item';
                    resultDiv.dataset.videoId = videoId;
                    resultDiv.innerHTML = `
                        <img src="${thumbnail}" alt="Video thumbnail">
                        <div class="search-result-info">
                            <div class="search-result-title">${title}</div>
                            <div class="search-result-author">Channel: ${item.snippet.channelTitle}</div>
                        </div>
                    `;
                    youtubeResults.appendChild(resultDiv);
                });
            } catch (e) {
                console.error("YouTube search failed:", e);
                youtubeResults.innerHTML = '<p>Error searching YouTube. Please check your API key and network connection.</p>';
            }
        });
    }
    
    if (youtubeResults) {
        youtubeResults.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                const videoId = item.dataset.videoId;
                const title = item.querySelector('.search-result-title').textContent;
                playerContainer.style.display = 'none';
                youtubePlayerDiv.style.display = 'block';
                nowPlayingTitle.textContent = `Now Playing: ${title}`;
                if (youtubePlayer && youtubePlayer.loadVideoById) {
                    youtubePlayer.loadVideoById(videoId);
                } else {
                    console.error('YouTube player is not ready or has no loadVideoById method.');
                }
            }
        });
    }
});