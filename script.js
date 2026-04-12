document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const uploadArea = document.getElementById('upload-area');
    const jsonUpload = document.getElementById('json-upload');
    const selectedPathEl = document.getElementById('selected-path');
    const startScanBtn = document.getElementById('start-scan-btn');
    const thresholdInput = document.getElementById('threshold');
    const thresholdVal = document.getElementById('threshold-val');
    const autoRemoveToggle = document.getElementById('auto-remove');
    
    // Stats Elements
    const statScanned = document.getElementById('stat-scanned');
    const statGroups = document.getElementById('stat-groups');
    const statRedundant = document.getElementById('stat-redundant');
    
    // Results
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    
    // Modal
    const mediaModal = document.getElementById('media-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('close-modal');

    // Help Center Elements
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');

    // Chatbot Elements
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChatbot = document.getElementById('close-chatbot');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Theme Elements
    const themeBtn = document.getElementById('theme-toggle-btn');

    let selectedDirectory = null;

    // --- Event Listeners ---
    
    // Theme logic
    const themes = [
        { class: '', label: 'Cyber Blue' },
        { class: 'theme-ruby', label: 'Midnight Ruby' },
        { class: 'theme-light', label: 'Pearl White' },
        { class: 'theme-emerald', label: 'Emerald Forest' }
    ];
    let currentThemeIndex = 0;
    const themeLabel = document.getElementById('theme-label');

    themeBtn.addEventListener('click', () => {
        if (themes[currentThemeIndex].class) {
            document.body.classList.remove(themes[currentThemeIndex].class);
        }
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        if (themes[currentThemeIndex].class) {
            document.body.classList.add(themes[currentThemeIndex].class);
        }
        if (themeLabel) themeLabel.textContent = `Current: ${themes[currentThemeIndex].label}`;
    });

    // Threshold Slider
    thresholdInput.addEventListener('input', (e) => {
        thresholdVal.textContent = `${e.target.value}%`;
    });

    // Drag and Drop JSON Upload Logic
    let loadedScanData = null;

    uploadArea.addEventListener('click', () => {
        jsonUpload.click();
    });

    jsonUpload.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            const file = e.target.files[0];
            selectedDirectory = file.name;
            selectedPathEl.textContent = `Loaded JSON: ${file.name}`;
            selectedPathEl.classList.remove('hidden');
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    loadedScanData = JSON.parse(event.target.result);
                    showToast("Results mapping loaded! Click 'Start Scan' to view.");
                } catch(err) {
                    showToast("Error reading valid JSON file.", true);
                }
            };
            reader.readAsText(file);
        }
    });

    // Start Scan Real Processor
    startScanBtn.addEventListener('click', () => {
        if (!loadedScanData) {
            showToast("Auto-loading backend results...", false);
            fetch('../scan_results.json')
                .then(response => {
                    if(!response.ok) throw new Error("JSON not found locally");
                    return response.json();
                })
                .then(data => {
                    loadedScanData = data;
                    selectedPathEl.textContent = "Loaded JSON: scan_results.json (Auto)";
                    selectedPathEl.classList.remove('hidden');
                    processScanRender();
                })
                .catch(err => {
                    showToast("Please tap 'Load scan_results.json' to upload manually", true);
                });
            return;
        }
        
        processScanRender();
    });
    
    function processScanRender() {
        // Simulate rendering delay
        startScanBtn.textContent = 'Rendering...';
        startScanBtn.classList.remove('pulse');
        startScanBtn.style.opacity = '0.7';
        startScanBtn.disabled = true;
        
        resultsSection.classList.add('hidden');
        
        setTimeout(() => {
            renderScanResults(loadedScanData);
        }, 1200);
    }

    function renderScanResults(groups) {
        startScanBtn.textContent = 'Results Loaded!';
        
        // Update Stats based on actual json array
        let totalScanned = 0;
        let redundantCount = 0;
        groups.forEach(group => {
            totalScanned += group.files.length;
            redundantCount += (group.files.length - 1);
        });

        animateValue(statScanned, 0, totalScanned, 1000);
        animateValue(statGroups, 0, groups.length, 1000);
        animateValue(statRedundant, 0, redundantCount, 1000);

        resultsGrid.innerHTML = '';
        const isAutoRemove = autoRemoveToggle.checked;
        
        if (groups.length === 0) {
            resultsGrid.innerHTML = '<p style="color: var(--success); font-size:1.2rem;">Congratulations, no duplicates found!</p>';
            resultsSection.classList.remove('hidden');
            return;
        }

        groups.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'duplicate-group fade-in';
            
            let html = `
                <div class="group-header">
                    <h3>Match Group #${group.id}</h3>
                    <span class="text-gradient">Similarity: ${group.similarity}</span>
                </div>
                <div class="media-grid">
            `;

            group.files.forEach(file => {
                const badgeClass = file.keep ? 'badge-keep' : 'badge-delete';
                const badgeText = file.keep ? 'KEEP' : (isAutoRemove ? 'DELETED' : 'DUPLICATE');
                
                let adjustedPath = file.path;
                // If it looks like a local relative path, prepend ../ if opening index.html from frontend/
                if (!adjustedPath.startsWith('http') && !adjustedPath.startsWith('/')) {
                    adjustedPath = '../' + adjustedPath;
                }

                const isVideo = file.name.toLowerCase().endsWith('.mp4');
                const mediaTag = isVideo 
                    ? `<video src="${adjustedPath}" autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>`
                    : `<img src="${adjustedPath}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover;">`;

                html += `
                    <div class="media-item">
                        <div class="media-badge ${badgeClass}">${badgeText}</div>
                        ${mediaTag}
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; font-size: 0.75rem; padding: 6px; text-align: center; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            ${file.name}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
            groupEl.innerHTML = html;
            resultsGrid.appendChild(groupEl);
        });

        resultsSection.classList.remove('hidden');

        setTimeout(() => {
            startScanBtn.textContent = 'Load New File';
            startScanBtn.classList.add('pulse');
            startScanBtn.style.opacity = '1';
            startScanBtn.disabled = false;
        }, 1500);
        
        showToast(isAutoRemove ? "Scan complete. Duplicates automatically removed!" : "Scan complete. Review duplicates below.");
    }

    // --- Lightbox Modal Logic ---
    resultsGrid.addEventListener('click', (e) => {
        const clickedMedia = e.target.closest('img, video');
        if (!clickedMedia) return;

        // Clone the media element to show in modal
        const clone = clickedMedia.cloneNode(true);
        if (clone.tagName === 'VIDEO') {
            clone.controls = true; // Add interactive controls
            clone.loop = true;
            clone.muted = false; // Unmute explicitly so user can hear audio while fullscreen
        }

        modalContent.innerHTML = '';
        modalContent.appendChild(clone);
        mediaModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        mediaModal.classList.add('hidden');
        modalContent.innerHTML = ''; // Clears the inner HTML, which stops any playing video!
    });

    // Close on clicking the shadowy background outside the image
    mediaModal.addEventListener('click', (e) => {
        if (e.target === mediaModal || e.target === modalContent) {
            mediaModal.classList.add('hidden');
            modalContent.innerHTML = '';
        }
    });

    // --- Help Center Logic ---
    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    closeHelp.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

    // --- Chatbot Logic ---
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
    });

    closeChatbot.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    function botReply(userInput) {
        let reply = "I'm sorry, I am a simple assistant. Try asking 'how to scan' or 'what is threshold?'.";
        const lowerInput = userInput.toLowerCase();
        
        if (lowerInput.includes('scan') || lowerInput.includes('start') || lowerInput.includes('how') || lowerInput.includes('use')) {
            reply = "To start a scan, simply click the drag-and-drop box in the middle of the screen to select a folder, then click the 'Start Scan' button on the left!";
        } else if (lowerInput.includes('threshold')) {
            reply = "The threshold slider controls strictness. A higher value (99%) means images must match exactly pixel-for-pixel. Lower values find 'near-duplicates' that are visually similar.";
        } else if (lowerInput.includes('delete') || lowerInput.includes('remove') || lowerInput.includes('keep')) {
            reply = "If you check 'Auto-Remove', the AI will safely delete all duplicates, but it automatically guarantees that your first original file is kept totally safe and untouched.";
        } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            reply = "Hello! I am ready to help you clean up your duplicate media. Let me know if you get stuck.";
        }
        
        setTimeout(() => {
            appendMessage('bot', reply);
        }, 600); // Small typing delay for realism
    }

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.textContent = text;
        chatbotMessages.appendChild(msgDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Auto-scroll to bottom
    }

    function handleChatSend() {
        const text = chatbotInput.value.trim();
        if (!text) return;
        
        appendMessage('user', text);
        chatbotInput.value = '';
        botReply(text);
    }

    chatbotSend.addEventListener('click', handleChatSend);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // --- Helpers ---
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.borderLeftColor = isError ? 'var(--danger)' : 'var(--accent)';
        toast.classList.remove('hidden');
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
