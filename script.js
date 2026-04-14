document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scan-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const directoryInput = document.getElementById('directory-path');
    const thresholdInput = document.getElementById('threshold');
    const thresholdVal = document.getElementById('threshold-val');
    const themeToggle = document.getElementById('theme-toggle');
    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const emptyState = document.getElementById('empty-state');
    const summaryText = document.getElementById('summary-text');
    const scanStats = document.getElementById('scan-stats');
    const scannedCount = document.getElementById('scanned-count');
    const duplicateCount = document.getElementById('duplicate-count');
    const originalCount = document.getElementById('original-count');
    const scannedSection = document.getElementById('scanned-section');
    const scannedGrid = document.getElementById('scanned-grid');
    const toast = document.getElementById('status-toast');
    const API_BASE = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';

    // Upload elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-upload');

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.textContent = isLight ? 'Light' : 'Dark';
        themeToggle.style.background = isLight ? '#4338ca' : '#ec4899';
    });

    let duplicateData = [];
    let scannedFiles = [];

    // Drag and Drop Logic
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        handleFileUpload(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
    });

    async function handleFileUpload(files) {
        if (files.length === 0) return;

        // Reset UI
        emptyState.style.display = 'none';
        resultsSection.style.display = 'none';
        loader.style.display = 'block';
        scanBtn.disabled = true;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('threshold', thresholdInput.value);

        try {
            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload Error (${response.status}): ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            duplicateData = data.results;
            scannedFiles = data.scanned_files || [];
            renderResults();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            loader.style.display = 'none';
            scanBtn.disabled = false;
        }
    }

    // Sync threshold value display
    thresholdInput.addEventListener('input', (e) => {
        thresholdVal.textContent = e.target.value;
    });

    // Main Scan Action
    scanBtn.addEventListener('click', async () => {
        const directory = directoryInput.value.trim();
        if (!directory) {
            showToast('Please enter a directory path', true);
            return;
        }

        // Reset UI
        emptyState.style.display = 'none';
        resultsSection.style.display = 'none';
        loader.style.display = 'block';
        scanBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    directory: directory,
                    threshold: thresholdInput.value
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            duplicateData = data.results;
            scannedFiles = data.scanned_files || [];
            renderResults();
        } catch (err) {
            showToast(err.message, true);
        } finally {
            loader.style.display = 'none';
            scanBtn.disabled = false;
        }
    });

    const renderResults = () => {
        resultsGrid.innerHTML = '';
        scannedGrid.innerHTML = '';

        const scannedTotal = scannedFiles.length;
        const duplicateTotal = duplicateData.reduce((sum, group) => sum + group.duplicates.length, 0);
        const originalTotal = duplicateData.length;

        scannedCount.textContent = scannedTotal;
        duplicateCount.textContent = duplicateTotal;
        originalCount.textContent = originalTotal;
        scanStats.style.display = scannedTotal > 0 ? 'grid' : 'none';

        if (scannedFiles.length > 0) {
            scannedSection.style.display = 'block';
            scannedFiles.forEach((path) => {
                scannedGrid.appendChild(createMediaItem(path, false));
            });
            emptyState.style.display = 'none';
        } else {
            scannedSection.style.display = 'none';
        }

        if (duplicateData.length === 0) {
            if (scannedFiles.length === 0) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = '<h3>No duplicates found!</h3><p>Your media library is clean.</p>';
                resultsSection.style.display = 'none';
                return;
            }

            resultsSection.style.display = 'block';
            summaryText.textContent = 'No duplicate groups found';
            resultsGrid.innerHTML = '<div class="no-results-card"><p>No duplicate groups were detected for this scan.</p></div>';
            return;
        }

        resultsSection.style.display = 'block';
        summaryText.textContent = `${duplicateData.length} Duplicate Groups Found`;

        duplicateData.forEach((group, index) => {
            const card = document.createElement('div');
            card.className = 'group-card';

            const header = document.createElement('div');
            header.className = 'group-info';
            header.innerHTML = `
                <div>
                    <strong>Group #${index + 1}</strong>
                    <span style="color: var(--text-muted); font-size: 0.8rem; margin-left:10px;">
                        ${group.size} visually similar items
                    </span>
                </div>
            `;
            card.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'media-grid';
            grid.appendChild(createMediaItem(group.original, false));
            group.duplicates.forEach((path) => {
                grid.appendChild(createMediaItem(path, true));
            });

            card.appendChild(grid);
            resultsGrid.appendChild(card);
        });
    };

    const addMediaErrorPlaceholder = (container, message) => {
        container.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = 'media-error';
        msg.textContent = message;
        container.appendChild(msg);
    };

    const createMediaItem = (path, isDuplicate) => {
        const item = document.createElement('div');
        item.className = 'media-item';

        const ext = path.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'avi', 'mov', 'mkv'].includes(ext);
        const mediaUrl = `${API_BASE}/media?path=${encodeURIComponent(path)}`;

        if (isVideo) {
            const video = document.createElement('video');
            video.src = mediaUrl;
            video.controls = true;
            video.muted = true;
            video.loop = true;
            video.preload = 'metadata';
            video.addEventListener('error', () => addMediaErrorPlaceholder(item, 'Video unavailable'));
            item.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = mediaUrl;
            img.loading = 'lazy';
            img.addEventListener('error', () => addMediaErrorPlaceholder(item, 'Image unavailable'));
            item.appendChild(img);
        }

        const label = document.createElement('div');
        label.className = 'media-label';
        label.textContent = path.split(/[\\\/]/).pop();
        item.appendChild(label);

        if (isDuplicate) {
            const badge = document.createElement('div');
            badge.className = 'delete-flag';
            badge.innerHTML = '✕';
            badge.title = 'Marked for deletion';
            item.appendChild(badge);
        } else {
            const badge = document.createElement('div');
            badge.className = 'delete-flag';
            badge.style.background = 'var(--accent)';
            badge.innerHTML = '✓';
            badge.title = 'Original (to keep)';
            item.appendChild(badge);
        }

        return item;
    };

    deleteAllBtn.addEventListener('click', async () => {
        const allDuplicates = [];
        duplicateData.forEach((group) => {
            allDuplicates.push(...group.duplicates);
        });

        if (allDuplicates.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${allDuplicates.length} duplicate files forever?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: allDuplicates })
            });

            const result = await response.json();
            showToast(`Successfully removed ${result.deleted_count} duplicates`);
            duplicateData = [];
            renderResults();
        } catch (err) {
            showToast('Error during deletion', true);
        }
    });

    const showToast = (msg, isError = false) => {
        toast.textContent = msg;
        toast.style.background = isError ? '#ef4444' : 'var(--primary)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };
});
