// --- START script.js ---

// Wrap entire script in a try...catch for global error handling
try {

    document.addEventListener('DOMContentLoaded', () => {
        console.log("SCRIPT.JS: DOM fully loaded and parsed.");

        // --- Element Selections (with immediate checks) ---
        function getElement(id, required = true) {
            const element = document.getElementById(id);
            if (!element && required) {
                console.error(`SCRIPT.JS: FATAL - Required element with ID "${id}" not found!`);
            } else if (!element) {
                console.warn(`SCRIPT.JS: Optional element with ID "${id}" not found.`);
            }
            // console.log(`SCRIPT.JS: Element selected: ${id}`, element ? 'Found' : 'NOT Found'); // Verbose logging
            return element;
        }

        // Page Structure
        const logoutButton = getElement('logout-button');
        const navLinks = document.querySelectorAll('.navbar li[data-category]'); // Select only category links

        // User Profile
        const userInitialBox = getElement('user-initial-box');
        const userProfileClickable = getElement('user-profile-clickable');
        const userDropdown = getElement('user-dropdown');
        const dropdownUsernameDisplay = getElement('dropdown-username-display');
        const menuItemChangeUsername = getElement('menu-item-change-username');
        const menuItemChangePassword = getElement('menu-item-change-password');

        // Change Username Modal
        const changeUsernamePopup = getElement('change-username-popup');
        const closeUsernameModalButton = changeUsernamePopup?.querySelector('.close-modal');
        const popupNewUsernameInput = getElement('popup-new-username-input');
        const popupChangeUsernameButton = getElement('popup-change-username-button');
        const popupChangeUsernameMessage = getElement('popup-change-username-message');

        // Change Password Modal
        const changePasswordPopup = getElement('change-password-popup');
        const closePasswordModalButton = changePasswordPopup?.querySelector('.close-modal');
        const popupCurrentPasswordInput = getElement('popup-current-password-input');
        const popupNewPasswordInput = getElement('popup-new-password-input');
        const popupConfirmNewPasswordInput = getElement('popup-confirm-new-password-input');
        const popupChangePasswordButton = getElement('popup-change-password-button');
        const popupChangePasswordMessage = getElement('popup-change-password-message');

        // Song List
        const songListContainer = getElement('song-list-container');
        const songList = getElement('song-list');

        // Music Player Popup
        const popupPlayer = getElement('popup-player');
        const closePopup = popupPlayer?.querySelector('.close-popup');
        const audioPlayer = getElement('popup-audio');
        const popupAlbumArt = getElement('popup-album-art');
        const popupSongTitle = getElement('popup-song-title');
        const popupArtist = getElement('popup-artist');
        const playButton = getElement('popup-play');
        const playButtonIcon = playButton?.querySelector('i'); // Get the icon inside the play button
        const nextButton = getElement('popup-next');
        const prevButton = getElement('popup-prev');
        const progressContainer = popupPlayer?.querySelector('.progress-container');
        const progressDiv = popupPlayer?.querySelector('.progress');
        const currentTimeDisplay = getElement('current-time');
        const durationDisplay = getElement('duration');
        const popupLyricsContent = getElement('popup-lyrics-content');

        // Playlists - CRITICAL FOR DEBUGGING
        const createPlaylistButton = getElement('create-playlist-button');
        const playlistPopup = getElement('playlist-popup');
        const closePlaylistPopup = playlistPopup?.querySelector('.close-playlist-popup');
        const createPlaylistConfirmButton = getElement('create-playlist-confirm');
        const playlistNameInput = getElement('playlist-name-input');
        const playlistContainer = getElement('playlist-container'); // Playlist bar area
        const playlistAreaPlaceholder = getElement('playlist-area-placeholder');

        // Add to Playlist Popup
        const addToPlaylistPopup = getElement('add-to-playlist-popup');
        const closeAddToPlaylistPopup = addToPlaylistPopup?.querySelector('.close-add-to-playlist-popup');
        const addToPlaylistSongName = getElement('add-to-playlist-song-name');
        const playlistOptions = getElement('playlist-options');
        const addToPlaylistMessage = getElement('add-to-playlist-message');

         // Display Playlist Songs Area
        const playlistSongsDisplay = getElement('playlist-songs-display');
        const playlistSongsList = getElement('playlist-songs-list');
        const playlistDisplayTitle = getElement('playlist-display-title');
        const closePlaylistDisplayButton = playlistSongsDisplay?.querySelector('.close-playlist-display');

        console.log("SCRIPT.JS: Element selection complete.");

        // --- Global Variables & Configuration ---
        const MAX_PLAYLISTS = 10; // Allow more playlists
        const songs = [ // Ensure paths are correct relative to the root where server runs
            { title: 'Friend Like me', artist: 'Will Smith', file: '/music/FriendLikeme.mp3', image: '/images/aladdin.jpg', category: 'pop', lyrics: `"Well Ali Baba had them forty thieves\nScheherazade had a thousand tales\nBut master you're in luck 'cause up your sleeves\nYou got a brand of magic never fails..."` },
            { title: 'What Makes You Beautiful', artist: 'One Direction', file: '/music/whatmakesyoubeautiful.mp3', image: '/images/modern.jpg', category: 'pop', lyrics: `"You're insecure, don't know what for\nYou're turning heads when you walk through the door..."` },
            { title: 'Mocking Bird', artist: 'Eminem', file: '/music/m.mp3', image: '/images/eminem.jpg', category: 'rock', lyrics: `"Yeah\nI know sometimes things may not always make sense to you right now\nBut hey, what daddy always tell you?"` },
            { title: 'Bohemian Rhapsody', artist: 'Queen', file: '/music/queen.mp3', image: '/images/bohemian.jpg', category: 'rock', lyrics: `"Is this the real life? Is this just fantasy?\nCaught in a landslide, no escape from reality..."` },
            { title: 'APT.', artist:'Rose, Bruno Mars', file: '/music/Rose_ft_Bruno_Mars_-_APT.mp3', image:'/images/Apt..jpg', category: 'pop'},
            { title: 'L Theme', artist:'ost', file: '/music/Death Note - Ls Theme.mp3', image:'/images/L.jpg', category: 'Instrumental'},
            { title: 'Real Slim Shady', artist:'Eminem', file: '/music/Slimshady.mp3', image:'/images/icon.jpg', category: 'pop'}
            // Add more songs as needed
        ];

        // State variables
        let currentSongIndex = 0; // Index within the *currently playing list* (main songs or playlist)
        let currentPlayingList = songs; // Reference to the list being played (songs or playlist.songs)
        let isPlayerDragging = false;
        let playerOffsetX = 0;
        let playerOffsetY = 0;
        let playlists = []; // Load from localStorage
        let selectedSongForPlaylist = null; // Store the *song object* to add
        let activePlaylist = null; // Reference to the playlist object being displayed/played
        let singleClickTimeout = null; // For differentiating single/double clicks

        // --- Functions ---

        // Load/Save Playlists from Local Storage
        function loadPlaylists() {
            console.log("SCRIPT.JS: Loading playlists from localStorage...");
            const storedPlaylists = localStorage.getItem('musicPlayerPlaylists');
            if (storedPlaylists) {
                try {
                    playlists = JSON.parse(storedPlaylists);
                    if (!Array.isArray(playlists)) {
                         console.warn("SCRIPT.JS: localStorage playlists data was not an array, resetting.");
                         playlists = [];
                    }
                    // Basic validation of playlist structure (optional but good)
                    playlists = playlists.filter(p => p && typeof p.name === 'string' && Array.isArray(p.songs));
                    console.log(`SCRIPT.JS: Successfully loaded ${playlists.length} playlists.`);
                } catch (e) {
                    console.error("SCRIPT.JS: Error parsing playlists from localStorage:", e);
                    playlists = [];
                }
            } else {
                console.log("SCRIPT.JS: No playlists found in localStorage.");
                playlists = [];
            }
            displayPlaylistBars(); // Display loaded playlists AFTER loading
        }

        function savePlaylists() {
            try {
                localStorage.setItem('musicPlayerPlaylists', JSON.stringify(playlists));
                console.log("SCRIPT.JS: Playlists saved to localStorage.");
            } catch (e) {
                console.error("SCRIPT.JS: Error saving playlists to localStorage:", e);
                alert("Could not save playlist changes. Local storage might be full or unavailable.");
            }
        }

        // Format time helper (seconds -> MM:SS)
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Update Player UI (Title, Artist, Art, Lyrics)
        function updatePlayerUI(song) {
            // ... (keep implementation from previous version) ...
             if (!song) {
                console.warn("SCRIPT.JS: updatePlayerUI called with invalid song.");
                if (popupSongTitle) popupSongTitle.textContent = "No Song Loaded";
                if (popupArtist) popupArtist.textContent = "---";
                if (popupAlbumArt) popupAlbumArt.src = '/images/place_icon.jpg';
                if (popupLyricsContent) popupLyricsContent.innerText = "---";
                if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
                if (durationDisplay) durationDisplay.textContent = "0:00";
                if (progressDiv) progressDiv.style.width = '0%';
                return;
            }
            //console.log(`SCRIPT.JS: Updating player UI for: ${song.title}`);
            if (popupSongTitle) popupSongTitle.textContent = song.title || "Unknown Title";
            if (popupArtist) popupArtist.textContent = song.artist || "Unknown Artist";
            if (popupAlbumArt) popupAlbumArt.src = song.image || '/images/place_icon.jpg';
            if (popupPlayer && song.image) { popupPlayer.style.backgroundImage = `url('${song.image}')`; }
            else if (popupPlayer) { popupPlayer.style.backgroundImage = 'none'; }
            const lyricsText = song.lyrics || "Lyrics not available for this song.";
            if (popupLyricsContent) popupLyricsContent.innerText = lyricsText;
            if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
            if (durationDisplay) durationDisplay.textContent = "0:00";
            if (progressDiv) progressDiv.style.width = '0%';
        }


        // Load song into audio element and update UI
        function loadSong(song) {
             // ... (keep implementation from previous version) ...
            if (!song || !song.file) {
                console.error("SCRIPT.JS: loadSong: Invalid song object or missing file path.", song);
                updatePlayerUI(null);
                if (audioPlayer) audioPlayer.src = "";
                return;
            }
            //console.log(`SCRIPT.JS: Loading song src: ${song.file}`);
            updatePlayerUI(song);
            if (audioPlayer) { audioPlayer.src = song.file; audioPlayer.load(); }
            else { console.error("SCRIPT.JS: Audio player element not found!"); }
        }

        // Play current song
        function playSong() {
             // ... (keep implementation from previous version) ...
             if (!audioPlayer || !audioPlayer.src || audioPlayer.src === window.location.href) {
                 console.warn("SCRIPT.JS: Cannot play: Audio source not set or invalid.");
                 if (currentPlayingList && currentPlayingList[currentSongIndex]) {
                     loadSong(currentPlayingList[currentSongIndex]);
                     audioPlayer?.addEventListener('canplay', playSong, { once: true }); // Use optional chaining
                 }
                 return;
             }
            audioPlayer.play()
                .then(() => {
                    if (playButtonIcon) playButtonIcon.classList.replace('fa-play', 'fa-pause');
                    if (popupPlayer?.classList.contains('hidden')) { // Use optional chaining
                         popupPlayer.classList.remove('hidden');
                         console.log("SCRIPT.JS: Player shown on play.");
                     }
                    //console.log("SCRIPT.JS: Playback started.");
                })
                .catch(error => {
                    console.error("SCRIPT.JS: Audio play error:", error);
                    if (playButtonIcon) playButtonIcon.classList.replace('fa-pause', 'fa-play');
                    alert(`Could not play audio: ${error.message}. User interaction might be required.`);
                });
        }

        // Pause current song
        function pauseSong() {
             // ... (keep implementation from previous version) ...
            if (!audioPlayer) return;
            audioPlayer.pause();
            if (playButtonIcon) playButtonIcon.classList.replace('fa-pause', 'fa-play');
            //console.log("SCRIPT.JS: Playback paused.");
        }

         // Toggle play/pause
        function togglePlayPause() {
             // ... (keep implementation from previous version) ...
             if (!audioPlayer) return;
            if (audioPlayer.paused) { playSong(); } else { pauseSong(); }
        }

         // Play song at a specific index from a specific list
        function playSongFromList(list, index) {
             // ... (keep implementation from previous version) ...
            if (!list || index < 0 || index >= list.length || !list[index]) {
                console.error("SCRIPT.JS: Invalid list or index for playback:", list, index);
                return;
            }
            currentPlayingList = list;
            currentSongIndex = index;
            console.log(`SCRIPT.JS: Setting current song index to ${currentSongIndex} in ${list === songs ? 'main list' : 'playlist'}`);
            loadSong(list[currentSongIndex]);
            playSong();
        }

         // Handle Next/Previous button clicks
        function changeSong(direction) { // direction: 1 for next, -1 for previous
             // ... (keep implementation from previous version) ...
             if (!currentPlayingList || currentPlayingList.length === 0) {
                console.log("SCRIPT.JS: No song list available to change song.");
                return;
            }
            const listSize = currentPlayingList.length;
            currentSongIndex = (currentSongIndex + direction + listSize) % listSize;
            console.log(`SCRIPT.JS: Changing song: Direction ${direction}, New Index ${currentSongIndex}`);
            loadSong(currentPlayingList[currentSongIndex]);
            playSong();
        }


        // Display Songs in the Main List Area
        function displaySongs(category = 'all') {
             // ... (keep implementation from previous version, ensure empty message style exists) ...
            if (!songList) { console.error("SCRIPT.JS: Song list element missing."); return; }
            songList.innerHTML = '';
            console.log(`SCRIPT.JS: Displaying songs for category: ${category}`);

            const filteredSongs = (category === 'all' || !category)
                ? songs
                : songs.filter(song => song && song.category && song.category.toLowerCase() === category.toLowerCase());

            if (filteredSongs.length === 0) {
                songList.innerHTML = '<li class="song-list-empty">No songs found in this category.</li>'; // Use class for styling
                return;
            }

            filteredSongs.forEach((song) => {
                 if (!song) return;
                const listItem = document.createElement('li');
                listItem.textContent = `${song.title} - ${song.artist}`;
                listItem.title = `Single click to play, double click to add to playlist`;
                const originalIndex = songs.findIndex(s => s && s.file === song.file);
                if (originalIndex === -1) { console.warn("SCRIPT.JS: Cannot find original index for song:", song.title); return; }

                listItem.addEventListener('click', () => {
                    if (singleClickTimeout) { clearTimeout(singleClickTimeout); singleClickTimeout = null; return; }
                    singleClickTimeout = setTimeout(() => {
                        //console.log(`SCRIPT.JS: Single click detected for song index ${originalIndex}`);
                        playSongFromList(songs, originalIndex);
                        if (popupPlayer) popupPlayer.classList.remove('hidden');
                        singleClickTimeout = null;
                         closePlaylistSongsDisplay(); // Close playlist view when playing from main list
                    }, 250);
                });
                listItem.addEventListener('dblclick', () => {
                    clearTimeout(singleClickTimeout); singleClickTimeout = null;
                    //console.log(`SCRIPT.JS: Double click detected for song index ${originalIndex}`);
                    selectedSongForPlaylist = songs[originalIndex];
                    showAddToPlaylistPopup();
                });
                songList.appendChild(listItem);
            });

            navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.navbar li[data-category="${category}"]`);
            if (activeLink) activeLink.classList.add('active');
        }


        // Display Playlist Bars
        function displayPlaylistBars() {
             // ... (keep implementation from previous version) ...
            if (!playlistContainer) return;
            playlistContainer.innerHTML = '';
            if (playlists.length === 0) {
                if (playlistAreaPlaceholder) playlistAreaPlaceholder.style.display = 'block';
            } else {
                if (playlistAreaPlaceholder) playlistAreaPlaceholder.style.display = 'none';
                playlists.forEach((playlist, index) => {
                    if (!playlist || typeof playlist.name !== 'string') return;
                    const playlistBar = document.createElement('div');
                    playlistBar.classList.add('playlist-bar');
                    playlistBar.textContent = playlist.name;
                    playlistBar.title = `Click to view songs in "${playlist.name}"`;
                    playlistBar.dataset.playlistIndex = index;
                    playlistBar.addEventListener('click', () => {
                         //console.log(`SCRIPT.JS: Clicked playlist bar: ${playlist.name} (Index: ${index})`);
                         displayPlaylistSongs(playlist); // Pass object
                    });
                    playlistContainer.appendChild(playlistBar);
                });
            }
        }

        // Display Songs within a Specific Playlist
        function displayPlaylistSongs(playlist) {
             // ... (keep implementation from previous version, ensure empty message style exists) ...
            if (!playlist || !playlistSongsDisplay || !playlistSongsList || !playlistDisplayTitle) {
                console.error("SCRIPT.JS: Playlist display elements missing or invalid playlist provided.");
                return;
            }
            if (!Array.isArray(playlist.songs)) { playlist.songs = []; }

            //console.log(`SCRIPT.JS: Displaying songs for playlist: ${playlist.name}`);
            activePlaylist = playlist;
            playlistDisplayTitle.textContent = `Playlist: ${playlist.name}`;
            playlistSongsList.innerHTML = '';

            if (playlist.songs.length === 0) {
                playlistSongsList.innerHTML = '<li class="playlist-empty-message">This playlist is empty. Double-click songs to add them.</li>';
            } else {
                playlist.songs.forEach((song, index) => {
                    if (!song) return;
                    const item = document.createElement('li');
                    item.textContent = `${song.title} - ${song.artist}`;
                    item.title = `Click to play "${song.title}" from this playlist`;
                    item.addEventListener('click', () => {
                        //console.log(`SCRIPT.JS: Playing song index ${index} from playlist "${playlist.name}"`);
                        playSongFromList(playlist.songs, index);
                         if (popupPlayer) popupPlayer.classList.remove('hidden');
                    });
                    playlistSongsList.appendChild(item);
                });
            }
            playlistSongsDisplay.classList.remove('hidden');
        }

        // Close the playlist songs display area
        function closePlaylistSongsDisplay() {
            if (playlistSongsDisplay && !playlistSongsDisplay.classList.contains('hidden')) {
                playlistSongsDisplay.classList.add('hidden');
                activePlaylist = null;
                console.log("SCRIPT.JS: Playlist display closed.");
            }
        }

        // Show 'Add to Playlist' Popup
        function showAddToPlaylistPopup() {
             // ... (keep implementation from previous version) ...
            if (!selectedSongForPlaylist) { console.warn("SCRIPT.JS: No song selected to add to playlist."); return; }
            if (!playlistOptions || !addToPlaylistPopup || !addToPlaylistSongName || !addToPlaylistMessage) { console.error("SCRIPT.JS: Add to playlist popup elements missing."); return; }

            //console.log(`SCRIPT.JS: Showing 'Add to Playlist' popup for song: ${selectedSongForPlaylist.title}`);
            addToPlaylistSongName.textContent = `Add "${selectedSongForPlaylist.title}" to:`;
            playlistOptions.innerHTML = '';
            setMessage(addToPlaylistMessage, ''); // Clear message

            if (playlists.length === 0) {
                playlistOptions.innerHTML = '<li class="playlist-options-empty">No playlists created yet.</li>'; // Use class
            } else {
                playlists.forEach((playlist, index) => {
                    if (!playlist || typeof playlist.name !== 'string') return;
                    const item = document.createElement('li');
                    item.textContent = playlist.name;
                    item.addEventListener('click', () => {
                        addSongToPlaylist(index, selectedSongForPlaylist);
                    });
                    playlistOptions.appendChild(item);
                });
            }
            addToPlaylistPopup.classList.remove('hidden');
        }

        // Add Selected Song to a Playlist by Index
        function addSongToPlaylist(playlistIndex, songToAdd) {
            // ... (keep implementation from previous version) ...
            if (playlistIndex < 0 || playlistIndex >= playlists.length || !songToAdd) {
                console.warn("SCRIPT.JS: Invalid index or song for addSongToPlaylist:", playlistIndex, songToAdd);
                setMessage(addToPlaylistMessage, "Invalid selection.", true); return;
            }
            const targetPlaylist = playlists[playlistIndex];
            if (!Array.isArray(targetPlaylist.songs)) targetPlaylist.songs = [];
            const alreadyExists = targetPlaylist.songs.some(s => s && s.file === songToAdd.file);

            if (!alreadyExists) {
                targetPlaylist.songs.push(songToAdd);
                console.log(`SCRIPT.JS: Added "${songToAdd.title}" to "${targetPlaylist.name}"`);
                savePlaylists();
                setMessage(addToPlaylistMessage, `Added to "${targetPlaylist.name}"!`, false);
                if (activePlaylist === targetPlaylist && !playlistSongsDisplay.classList.contains('hidden')) {
                    displayPlaylistSongs(targetPlaylist); // Refresh view if open
                }
            } else {
                //console.log(`SCRIPT.JS: "${songToAdd.title}" already exists in "${targetPlaylist.name}"`);
                setMessage(addToPlaylistMessage, `Already in "${targetPlaylist.name}".`, true);
            }
            setTimeout(closeAddToPlaylistPopupFunc, 1500);
        }

        // Close the 'Add to Playlist' Popup
        function closeAddToPlaylistPopupFunc() {
            if (addToPlaylistPopup) {
                addToPlaylistPopup.classList.add('hidden');
                selectedSongForPlaylist = null;
            }
        }

        // Function to close the main user dropdown
        function closeUserDropdown() {
             // ... (keep implementation from previous version) ...
            if (userDropdown?.classList.contains('visible')) { // Use optional chaining
                userDropdown.classList.add('hidden');
                userDropdown.classList.remove('visible');
                //console.log("SCRIPT.JS: User dropdown closed.");
            }
        }

        // Function to close a specific modal
        function closeModal(modalElement) {
             // ... (keep implementation from previous version) ...
            if (modalElement) {
                modalElement.classList.add('hidden');
                console.log(`SCRIPT.JS: Modal closed: ${modalElement.id}`);
                const inputs = modalElement.querySelectorAll('input');
                const messageDiv = modalElement.querySelector('.modal-message');
                inputs.forEach(input => input.value = '');
                if (messageDiv) { setMessage(messageDiv, ''); } // Use helper to clear
            }
        }

        // Helper to set messages in popups/modals
        function setMessage(element, text, isError = false) {
            if (element) {
                element.textContent = text;
                element.classList.remove('success', 'error');
                if (text) {
                    element.classList.add(isError ? 'error' : 'success');
                }
            } else {
                console.warn("SCRIPT.JS: Attempted to set message on a non-existent element.");
            }
        }

        // --- User Profile and Auth Logic ---
        function initializeUserProfile() {
            const loggedInUser = sessionStorage.getItem('loggedInUser');
            //console.log("SCRIPT.JS: Initializing User Profile - User from session:", loggedInUser);
            if (!loggedInUser) {
                console.log("SCRIPT.JS: No user logged in, redirecting to login page.");
                window.location.href = '/'; // Redirect to login if not logged in
                return false; // Stop further initialization
            }
            if (userInitialBox) userInitialBox.textContent = loggedInUser.charAt(0).toUpperCase();
            if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = loggedInUser;
            console.log(`SCRIPT.JS: User profile initialized for: ${loggedInUser}`);
            return true; // Indicate success
        }

        function handleLogout() {
             // ... (keep implementation from previous version) ...
             console.log("SCRIPT.JS: Logging out user...");
            sessionStorage.removeItem('loggedInUser');
            localStorage.removeItem('musicPlayerPlaylists');
            window.location.href = '/';
        }


        // --- Event Listeners Setup ---
        console.log("SCRIPT.JS: Setting up event listeners...");

        // User Profile Icon Click Listener (Toggle Dropdown)
        if (userProfileClickable && userDropdown) {
             //console.log('SCRIPT.JS: Attaching user profile click listener.');
            userProfileClickable.addEventListener('click', (event) => {
                event.stopPropagation();
                const isVisible = userDropdown.classList.contains('visible');
                userDropdown.classList.toggle('visible', !isVisible);
                userDropdown.classList.toggle('hidden', isVisible);
                //console.log(`SCRIPT.JS: User dropdown toggled: ${!isVisible ? 'Visible' : 'Hidden'}`);
            });
        } else { console.error("SCRIPT.JS: User profile clickable area or dropdown menu missing."); }

        // Dropdown Menu Item Click Listeners
        if (menuItemChangeUsername && changeUsernamePopup) {
             //console.log('SCRIPT.JS: Attaching change username menu listener.');
            menuItemChangeUsername.addEventListener('click', () => {
                closeUserDropdown();
                changeUsernamePopup.classList.remove('hidden');
                popupNewUsernameInput?.focus();
                console.log("SCRIPT.JS: Change Username modal opened via menu.");
            });
        } else { console.warn("SCRIPT.JS: Change Username menu item or popup missing."); }

        if (menuItemChangePassword && changePasswordPopup) {
            //console.log('SCRIPT.JS: Attaching change password menu listener.');
            menuItemChangePassword.addEventListener('click', () => {
                closeUserDropdown();
                changePasswordPopup.classList.remove('hidden');
                popupCurrentPasswordInput?.focus();
                console.log("SCRIPT.JS: Change Password modal opened via menu.");
            });
        } else { console.warn("SCRIPT.JS: Change Password menu item or popup missing."); }

        // Modal Close Button Listeners
        if (closeUsernameModalButton) {
            closeUsernameModalButton.addEventListener('click', () => closeModal(changeUsernamePopup));
        }
        if (closePasswordModalButton) {
            closePasswordModalButton.addEventListener('click', () => closeModal(changePasswordPopup));
        }

        // --- Modal Form Submission Listeners ---
        // ... (keep change username/password implementations from previous version) ...
         if (popupChangeUsernameButton && popupNewUsernameInput && popupChangeUsernameMessage) {
            popupChangeUsernameButton.addEventListener('click', async () => {
                const currentUsername = sessionStorage.getItem('loggedInUser'); const newUsername = popupNewUsernameInput.value.trim();
                setMessage(popupChangeUsernameMessage, '');
                if (!newUsername) { setMessage(popupChangeUsernameMessage, 'New username cannot be empty.', true); return; }
                const usernameRegex = /^[a-zA-Z0-9_.-]+$/; if (!usernameRegex.test(newUsername) || newUsername.length < 3) { setMessage(popupChangeUsernameMessage, 'Invalid username format (min 3 chars, letters, numbers, _, ., -).', true); return; } if (newUsername.toLowerCase() === currentUsername?.toLowerCase()) { setMessage(popupChangeUsernameMessage, 'New username is the same as the current one.', true); return; } if (!currentUsername) { setMessage(popupChangeUsernameMessage, 'Error: Cannot identify current user.', true); return; }
                console.log(`SCRIPT.JS: Attempting to change username from ${currentUsername} to ${newUsername}`);
                try {
                    const response = await fetch('/api/change-username', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUsername, newUsername }) }); const result = await response.json();
                    if (response.ok && result.success) {
                        setMessage(popupChangeUsernameMessage, 'Username updated successfully!', false); sessionStorage.setItem('loggedInUser', newUsername); if (userInitialBox) userInitialBox.textContent = newUsername.charAt(0).toUpperCase(); if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = newUsername; popupNewUsernameInput.value = ''; setTimeout(() => closeModal(changeUsernamePopup), 1500);
                    } else { setMessage(popupChangeUsernameMessage, result.message || 'Failed to update username.', true); }
                } catch (error) { console.error('SCRIPT.JS: Change username fetch error:', error); setMessage(popupChangeUsernameMessage, 'A network error occurred. Please try again.', true); }
            });
        } else { console.warn("SCRIPT.JS: Change username modal elements missing."); }
        if (popupChangePasswordButton && popupCurrentPasswordInput && popupNewPasswordInput && popupConfirmNewPasswordInput && popupChangePasswordMessage) {
            popupChangePasswordButton.addEventListener('click', async () => {
                const currentPassword = popupCurrentPasswordInput.value; const newPassword = popupNewPasswordInput.value; const confirmNewPassword = popupConfirmNewPasswordInput.value; const currentUsername = sessionStorage.getItem('loggedInUser');
                setMessage(popupChangePasswordMessage, '');
                if (!currentPassword || !newPassword || !confirmNewPassword) { setMessage(popupChangePasswordMessage, 'All password fields are required.', true); return; } if (newPassword.length < 6) { setMessage(popupChangePasswordMessage, 'New password must be at least 6 characters long.', true); return; } if (newPassword !== confirmNewPassword) { setMessage(popupChangePasswordMessage, 'New passwords do not match.', true); return; } if (newPassword === currentPassword) { setMessage(popupChangePasswordMessage, 'New password cannot be the same as the current one.', true); return; } if (!currentUsername) { setMessage(popupChangePasswordMessage, 'Error: Cannot identify current user.', true); return; }
                console.log(`SCRIPT.JS: Attempting to change password for ${currentUsername}`);
                try {
                    const response = await fetch('/api/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUsername, currentPassword, newPassword }) }); const result = await response.json();
                    if (response.ok && result.success) {
                        setMessage(popupChangePasswordMessage, 'Password updated successfully!', false); popupCurrentPasswordInput.value = ''; popupNewPasswordInput.value = ''; popupConfirmNewPasswordInput.value = ''; setTimeout(() => closeModal(changePasswordPopup), 1500);
                    } else { setMessage(popupChangePasswordMessage, result.message || 'Failed to update password.', true); popupCurrentPasswordInput.value = ''; popupCurrentPasswordInput.focus(); }
                } catch (error) { console.error('SCRIPT.JS: Change password fetch error:', error); setMessage(popupChangePasswordMessage, 'A network error occurred. Please try again.', true); }
            });
        } else { console.warn("SCRIPT.JS: Change password modal elements missing."); }

        // General Click Listener (Close Dropdown/Modals on Outside Click)
        document.body.addEventListener('click', (event) => {
            // Close main user dropdown
            if (userDropdown?.classList.contains('visible') && !userProfileClickable?.contains(event.target) && !userDropdown?.contains(event.target)) { closeUserDropdown(); }
            // Close modals on backdrop click
            if (!changeUsernamePopup?.classList.contains('hidden') && event.target === changeUsernamePopup) { closeModal(changeUsernamePopup); }
            if (!changePasswordPopup?.classList.contains('hidden') && event.target === changePasswordPopup) { closeModal(changePasswordPopup); }
            // Close Playlist popups on backdrop click
             if (!playlistPopup?.classList.contains('hidden') && event.target === playlistPopup) {
                 playlistPopup.classList.add('hidden'); if (playlistNameInput) playlistNameInput.value = '';
             }
             if (!addToPlaylistPopup?.classList.contains('hidden') && event.target === addToPlaylistPopup) { closeAddToPlaylistPopupFunc(); }

        }, false);

        // Logout Button Listener
        if (logoutButton) {
            //console.log('SCRIPT.JS: Attaching logout listener.');
            logoutButton.addEventListener('click', handleLogout);
        } else { console.warn("SCRIPT.JS: Logout button missing."); }

        // --- Music Player Event Listeners ---
        // ... (keep player control listeners: closePopup, playButton, nextButton, prevButton, audio events, progress bar) ...
        if (closePopup && popupPlayer) { closePopup.addEventListener('click', () => { popupPlayer.classList.add('hidden'); pauseSong(); }); }
        if (playButton) { playButton.addEventListener('click', togglePlayPause); }
        if (nextButton) { nextButton.addEventListener('click', () => changeSong(1)); }
        if (prevButton) { prevButton.addEventListener('click', () => changeSong(-1)); }
        if (audioPlayer) {
            audioPlayer.addEventListener('ended', () => changeSong(1));
            audioPlayer.addEventListener('timeupdate', () => { if (audioPlayer.duration && isFinite(audioPlayer.duration) && audioPlayer.duration > 0) { const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100; if (progressDiv) progressDiv.style.width = `${progressPercent}%`; if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime); } else { if (progressDiv) progressDiv.style.width = '0%'; if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00"; } });
            audioPlayer.addEventListener('loadedmetadata', () => { if (audioPlayer.duration && isFinite(audioPlayer.duration)) { if (durationDisplay) durationDisplay.textContent = formatTime(audioPlayer.duration); } else { if (durationDisplay) durationDisplay.textContent = "0:00"; } });
            audioPlayer.addEventListener('error', (e) => { console.error("SCRIPT.JS: Audio Loading Error:", e); updatePlayerUI(null); alert(`Error loading audio file: ${audioPlayer.src}.`); if (playButtonIcon) playButtonIcon.classList.replace('fa-pause', 'fa-play'); });
            audioPlayer.addEventListener('stalled', () => console.warn("SCRIPT.JS: Audio playback stalled."));
            audioPlayer.addEventListener('waiting', () => console.log("SCRIPT.JS: Audio playback waiting (buffering)..."));
            audioPlayer.addEventListener('playing', () => console.log("SCRIPT.JS: Audio resumed playing."));
        } else { console.error("SCRIPT.JS: Audio player element missing."); }
        if (progressContainer && audioPlayer) { progressContainer.addEventListener('click', (e) => { if (audioPlayer.duration && isFinite(audioPlayer.duration) && audioPlayer.duration > 0) { const rect = progressContainer.getBoundingClientRect(); const clickX = e.clientX - rect.left; const seekTime = (clickX / progressContainer.clientWidth) * audioPlayer.duration; audioPlayer.currentTime = seekTime; } else { console.warn("SCRIPT.JS: Cannot seek: Audio duration unavailable."); } }); }
        else { console.warn("SCRIPT.JS: Progress bar or audio player missing for seek listener."); }

        // --- Navbar Category Filter Listeners ---
        if (navLinks.length > 0) {
            //console.log('SCRIPT.JS: Attaching navbar category listeners.');
             navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const category = e.currentTarget.dataset?.category;
                    if (category) {
                        //console.log(`SCRIPT.JS: Navbar category clicked: ${category}`);
                        displaySongs(category);
                        closePlaylistSongsDisplay();
                    }
                });
            });
        } else { console.warn("SCRIPT.JS: No navbar category links found."); }


        // --- Draggable Player Logic ---
        // ... (keep draggable player implementation from previous version) ...
         if (popupPlayer) {
            popupPlayer.addEventListener('mousedown', (e) => {
                const isInteractive = e.target.closest('button, .progress-container, .close-popup, .popup-lyrics-display'); if (e.button !== 0 || isInteractive) { isPlayerDragging = false; return; } isPlayerDragging = true; playerOffsetX = e.clientX - popupPlayer.offsetLeft; playerOffsetY = e.clientY - popupPlayer.offsetTop; popupPlayer.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
            });
        }
        document.addEventListener('mouseup', () => { if (isPlayerDragging) { isPlayerDragging = false; if (popupPlayer) popupPlayer.style.cursor = 'grab'; document.body.style.userSelect = ''; } });
        document.addEventListener('mousemove', (e) => { if (!isPlayerDragging || !popupPlayer) return; e.preventDefault(); let x = e.clientX - playerOffsetX; let y = e.clientY - playerOffsetY; const maxX = window.innerWidth - popupPlayer.offsetWidth; const maxY = window.innerHeight - popupPlayer.offsetHeight; x = Math.max(0, Math.min(x, maxX)); y = Math.max(0, Math.min(y, maxY)); popupPlayer.style.left = `${x}px`; popupPlayer.style.top = `${y}px`; popupPlayer.style.bottom = 'auto'; popupPlayer.style.right = 'auto'; });


        // --- Playlist Creation Listeners ---
        // <<< --- THIS IS THE SECTION TO FOCUS ON --- >>>
        if (createPlaylistButton && playlistPopup && playlistNameInput) { // Check all involved elements
            console.log('SCRIPT.JS: Attaching create playlist button listener.');
            createPlaylistButton.addEventListener('click', () => {
                // Log state *inside* the click handler
                console.log(`SCRIPT.JS: 'Create Playlist' button clicked. Current playlists: ${playlists.length}, Max: ${MAX_PLAYLISTS}`);

                 // Double-check the popup element still exists
                 if (!playlistPopup) {
                    console.error("SCRIPT.JS: Playlist popup element became null unexpectedly!");
                    return;
                 }

                if (playlists.length < MAX_PLAYLISTS) {
                    console.log("SCRIPT.JS: Playlist limit not reached. Attempting to show popup.");
                    playlistPopup.classList.remove('hidden'); // <<< THE KEY ACTION
                    console.log("SCRIPT.JS: 'hidden' class removed. Popup classList:", playlistPopup.classList); // Check classes
                     // Try focusing after a tiny delay to ensure popup is rendered
                     setTimeout(() => {
                         playlistNameInput.focus();
                         console.log("SCRIPT.JS: Focused playlist name input.");
                     }, 50);
                    console.log("SCRIPT.JS: Create playlist popup should be visible.");
                } else {
                    console.warn(`SCRIPT.JS: Max playlists (${MAX_PLAYLISTS}) reached. Alerting user.`);
                    alert(`Maximum number of playlists (${MAX_PLAYLISTS}) reached.`);
                }
            });
        } else {
            // Be very explicit if elements are missing
            console.error(`SCRIPT.JS: ERROR - Cannot attach 'Create Playlist' listener. Button found: ${!!createPlaylistButton}, Popup found: ${!!playlistPopup}, Input found: ${!!playlistNameInput}`);
        }

        // Listener for the close button *inside* the playlist popup
        if (closePlaylistPopup && playlistPopup) {
             //console.log('SCRIPT.JS: Attaching close playlist popup listener.');
            closePlaylistPopup.addEventListener('click', () => {
                console.log('SCRIPT.JS: Close playlist popup button clicked.');
                playlistPopup.classList.add('hidden');
                if (playlistNameInput) playlistNameInput.value = '';
            });
        } else {
             console.warn("SCRIPT.JS: Close playlist popup button or main popup missing!");
        }

        // Listener for the confirm button *inside* the playlist popup
        if (createPlaylistConfirmButton && playlistNameInput && playlistPopup) {
            //console.log('SCRIPT.JS: Attaching create playlist confirm listener.');
            const handleCreatePlaylist = () => {
                 const name = playlistNameInput.value.trim();
                if (!name) { alert("Please enter a playlist name."); return; }
                 if (name.length > 50) { alert("Playlist name is too long (max 50 characters)."); return; }
                const nameExists = playlists.some(p => p.name.toLowerCase() === name.toLowerCase());

                if (nameExists) {
                    alert(`A playlist named "${name}" already exists. Please choose a different name.`);
                    playlistNameInput.focus();
                } else if (playlists.length >= MAX_PLAYLISTS) {
                    alert(`Maximum number of playlists (${MAX_PLAYLISTS}) reached.`);
                    playlistPopup.classList.add('hidden'); playlistNameInput.value = '';
                } else {
                    playlists.push({ name: name, songs: [] });
                    console.log(`SCRIPT.JS: Playlist created: ${name}`);
                    savePlaylists();
                    displayPlaylistBars();
                    playlistPopup.classList.add('hidden');
                    playlistNameInput.value = '';
                }
            };
            createPlaylistConfirmButton.addEventListener('click', handleCreatePlaylist);
            playlistNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreatePlaylist(); } });
        } else { console.warn("SCRIPT.JS: Create playlist confirm button, input, or popup missing!"); }
         // <<< --- END OF PLAYLIST CREATION SECTION --- >>>


        // Add to Playlist Popup Listener
        if (closeAddToPlaylistPopup) {
            closeAddToPlaylistPopup.addEventListener('click', closeAddToPlaylistPopupFunc);
        } else { console.warn("SCRIPT.JS: Close Add-to-Playlist button missing."); }


        // Close Playlist Display Button
         if(closePlaylistDisplayButton) {
             //console.log('SCRIPT.JS: Attaching close playlist display listener.');
             closePlaylistDisplayButton.addEventListener('click', closePlaylistSongsDisplay);
         } else { console.warn("SCRIPT.JS: Close playlist display button missing."); }


        // --- Initial Setup Calls ---
        console.log("SCRIPT.JS: Starting initial setup...");
        const userProfileInitialized = initializeUserProfile(); // Checks login first

        if (userProfileInitialized) {
            console.log("SCRIPT.JS: User authenticated, proceeding with app initialization.");
            loadPlaylists(); // Load playlists from storage FIRST
            displaySongs('all'); // Display all songs initially

            if (songs.length > 0) {
                console.log("SCRIPT.JS: Songs available, updating player UI with first song.");
                updatePlayerUI(songs[0]);
                 if (popupPlayer) popupPlayer.classList.add('hidden');
            } else {
                console.warn("SCRIPT.JS: No songs available in the 'songs' array.");
                updatePlayerUI(null);
                if (songList) songList.innerHTML = '<li class="song-list-empty">No songs loaded.</li>';
                [playButton, prevButton, nextButton].forEach(btn => { if(btn) btn.disabled = true; });
            }
        } else {
             console.log("SCRIPT.JS: Initialization halted: User not authenticated.");
        }
        console.log("SCRIPT.JS: Initial setup complete.");
        // --- END Initial Setup Calls ---

    }); // End DOMContentLoaded

} catch (error) {
    console.error("SCRIPT.JS: A critical error occurred in the main script execution:", error);
    // Optionally display a message to the user indicating a fatal error
    alert("A critical error occurred. Please reload the page or contact support.");
}
// --- END script.js ---