// ============================================================
// COLLECTION.JS — Grid view with filters, sorting, and modal
// ============================================================

// --- STATE ---
let allSongs = [];
let activeMoods = new Set();
let activeStyle = 'all';
let activeSearch = '';
let activeSort = 'default';

// --- DOM REFERENCES ---
const grid = document.getElementById('grid');
const moodChips = document.getElementById('moodChips');
const styleSelect = document.getElementById('styleSelect');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearFilters');
const resultsCount = document.getElementById('resultsCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalInner = document.getElementById('modalInner');
const modalClose = document.getElementById('modalClose');

// --- INITIALIZE ---
async function init() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) throw new Error('Failed to fetch songs.json');
        allSongs = await response.json();

        buildMoodChips();
        buildStyleOptions();
        renderGrid();
        attachEvents();
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p class="empty-state">Could not load songs. Make sure <code>songs.json</code> is in the same folder and you are viewing this page through a local server.</p>`;
    }
}

// --- BUILD MOOD CHIPS (with counts) ---
function buildMoodChips() {
    const counts = {};
    allSongs.forEach(song => {
        counts[song.Mood] = (counts[song.Mood] || 0) + 1;
    });

    const sortedMoods = Object.keys(counts).sort();

    moodChips.innerHTML = '';
    sortedMoods.forEach(mood => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.dataset.mood = mood;
        chip.innerHTML = `${mood} <span class="chip-count">${counts[mood]}</span>`;
        chip.addEventListener('click', () => toggleMood(mood, chip));
        moodChips.appendChild(chip);
    });
}

// --- BUILD STYLE DROPDOWN ---
function buildStyleOptions() {
    // Extract the primary style word (e.g., "Pop Ballad" from "Pop Ballad (Inferred)")
    const styles = new Set();
    allSongs.forEach(song => {
        const base = song.Style_Category.split('(')[0].trim();
        styles.add(base);
    });

    const sortedStyles = Array.from(styles).sort();
    sortedStyles.forEach(style => {
        const opt = document.createElement('option');
        opt.value = style;
        opt.textContent = style;
        styleSelect.appendChild(opt);
    });
}

// --- TOGGLE MOOD ---
function toggleMood(mood, chipEl) {
    if (activeMoods.has(mood)) {
        activeMoods.delete(mood);
        chipEl.classList.remove('active');
    } else {
        activeMoods.add(mood);
        chipEl.classList.add('active');
    }
    renderGrid();
}

// --- FILTER + SORT ---
function getFilteredSongs() {
    let result = allSongs.slice();

    // Search filter
    if (activeSearch.trim()) {
        const q = activeSearch.toLowerCase();
        result = result.filter(song =>
            song.Song_Name_CN.toLowerCase().includes(q) ||
            song.Title_EN.toLowerCase().includes(q) ||
            song.Artist.toLowerCase().includes(q)
        );
    }

    // Mood filter (multi-select)
    if (activeMoods.size > 0) {
        result = result.filter(song => activeMoods.has(song.Mood));
    }

    // Style filter
    if (activeStyle !== 'all') {
        result = result.filter(song =>
            song.Style_Category.split('(')[0].trim() === activeStyle
        );
    }

    // Sorting
    switch (activeSort) {
        case 'title-asc':
            result.sort((a, b) => a.Title_EN.localeCompare(b.Title_EN));
            break;
        case 'title-desc':
            result.sort((a, b) => b.Title_EN.localeCompare(a.Title_EN));
            break;
        case 'artist-asc':
            result.sort((a, b) => a.Artist.localeCompare(b.Artist));
            break;
        case 'mood':
            result.sort((a, b) => a.Mood.localeCompare(b.Mood));
            break;
        default:
            // Keep original JSON order
            break;
    }

    return result;
}

// --- RENDER GRID ---
function renderGrid() {
    const filtered = getFilteredSongs();

    // Update count
    resultsCount.textContent = `${filtered.length} of ${allSongs.length} songs`;

    // Handle empty state
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="empty-state">No songs match your filters.</p>`;
        return;
    }

    // Build cards
    grid.innerHTML = '';
    filtered.forEach(song => {
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.innerHTML = `
            <img src="${song.path}" alt="${song.alttext || song.Title_EN}">
            <div class="overlay">
                <span class="cn-name">${song.Song_Name_CN}</span>
                <span class="en-name">${song.Title_EN}</span>
            </div>
        `;
        card.addEventListener('click', () => openModal(song));
        grid.appendChild(card);
    });
}

// --- MODAL ---
function openModal(song) {
    const spotifyLink = song.spotifyUrl
        ? `<a href="${song.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="spotify-link">
               Listen on Spotify →
           </a>`
        : '';

    modalInner.innerHTML = `
        <img class="modal-image" src="${song.path}" alt="${song.alttext || song.Title_EN}">
        <div class="modal-content">
            <h2 class="modal-cn">${song.Song_Name_CN}</h2>
            <p class="modal-en">${song.Title_EN}</p>
            <div class="modal-meta">
                <span class="tag mood">${song.Mood}</span>
                <span class="tag">${song.Style_Category}</span>
            </div>
            <p class="modal-artist">
                <strong>Artist</strong>
                ${song.Artist}
            </p>
            ${spotifyLink}
        </div>
    `;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// --- EVENT LISTENERS ---
function attachEvents() {
    searchInput.addEventListener('input', (e) => {
        activeSearch = e.target.value;
        renderGrid();
    });

    sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderGrid();
    });

    styleSelect.addEventListener('change', (e) => {
        activeStyle = e.target.value;
        renderGrid();
    });

    clearBtn.addEventListener('click', () => {
        activeMoods.clear();
        activeStyle = 'all';
        activeSearch = '';
        activeSort = 'default';
        searchInput.value = '';
        styleSelect.value = 'all';
        sortSelect.value = 'default';
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        renderGrid();
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
    });
}

// --- RUN ---
init();