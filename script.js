
const firebaseConfig = {
    apiKey: "AIzaSyDa2YAkgDSAW3CtYswRKrnt6e01g6PlGZw",
    authDomain: "nayanarchive-854cc.firebaseapp.com",
    databaseURL: "https://nayanarchive-854cc-default-rtdb.firebaseio.com",
    projectId: "nayanarchive-854cc",
    storageBucket: "nayanarchive-854cc.firebasestorage.app",
    messagingSenderId: "2058736416",
    appId: "1:2058736416:web:afcdf732ced703d78a7d45"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database(); 


const TOTAL_BOUQUETS = 33; 
let currentSelection = 1;
let selectedFont = 'Alex Brush'; 
let selectedTheme = 'ivory';


window.onload = async () => {
    loadDraft(); 
    
    const customMessageInput = document.getElementById('custom-message');
    if (customMessageInput) {
        customMessageInput.addEventListener('input', function() {
            document.getElementById('char-count').innerText = `${this.value.length}/300`;
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id'); 
    
    if (docId) {
        document.getElementById('edit-mode').style.display = 'none';
        document.getElementById('loading-screen').classList.remove('hidden'); 
        
        try {
            const snapshot = await db.ref("bouquets/" + docId).get();
            if (snapshot.exists()) {
                const payload = snapshot.val();
                preloadImageAndRender(payload); 
            } else {
                alert("Oops! This bouquet envelope couldn't be found in the cloud.");
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('edit-mode').style.display = 'block';
            }
        } catch(e) {
            console.error(e);
            alert("Error connecting to the delivery servers.");
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('edit-mode').style.display = 'block';
        }
    }
};


function saveDraft() {
    const draft = {
        m: document.getElementById('custom-message').value,
        s: document.getElementById('sender-name').value,
        r: document.getElementById('recipient-name').value,
        d: document.getElementById('memory-date').value
    };
    localStorage.setItem('digiBouquetDraft', JSON.stringify(draft));
}

function loadDraft() {
    const draft = JSON.parse(localStorage.getItem('digiBouquetDraft'));
    if (draft) {
        document.getElementById('custom-message').value = draft.m || '';
        document.getElementById('sender-name').value = draft.s || '';
        document.getElementById('recipient-name').value = draft.r || '';
        document.getElementById('memory-date').value = draft.d || ''; 
        document.getElementById('char-count').innerText = `${(draft.m || '').length}/300`;
    }
}


function goToStep(stepNumber) {
    document.querySelectorAll('.step-container').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
    window.scrollTo(0,0);
}

function validateAndProceed() {
    const rec = document.getElementById('recipient-name');
    const msg = document.getElementById('custom-message');
    let isValid = true;

    if (!rec.value.trim()) { rec.classList.add('error-shake'); isValid = false; }
    if (!msg.value.trim()) { msg.classList.add('error-shake'); isValid = false; }
    
    setTimeout(() => { rec.classList.remove('error-shake'); msg.classList.remove('error-shake'); }, 400);

    if (isValid) goToStep(3);
    else alert("Please fill in the recipient's name and a sweet note! 🤍");
}


function updateCarousel() {
    document.getElementById('current-bouquet-img').src = `assets/${currentSelection}.jpg`;
    document.getElementById('bouquet-counter').innerText = currentSelection;
}
function nextBouquet() { currentSelection++; if (currentSelection > TOTAL_BOUQUETS) currentSelection = 1; updateCarousel(); }
function prevBouquet() { currentSelection--; if (currentSelection < 1) currentSelection = TOTAL_BOUQUETS; updateCarousel(); }

function changeFont(btnElement, fontName) {
    selectedFont = fontName;
    document.querySelectorAll('.font-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    const isSerif = fontName === 'Playfair Display' ? 'serif' : 'cursive';
    document.getElementById('custom-message').style.fontFamily = `'${fontName}', ${isSerif}`;
}

function changeTheme(btnElement, themeName) {
    selectedTheme = themeName;
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    document.body.className = `theme-${themeName}`;
}


async function generateLink() {
    const btn = document.getElementById('generate-btn');
    const originalText = btn.innerText;
    
    const msg = document.getElementById('custom-message').value;
    const sig = document.getElementById('sender-name').value;
    const rec = document.getElementById('recipient-name').value;
    const memoryDate = document.getElementById('memory-date').value;
    
    const payload = { 
        i: currentSelection, m: msg, f: selectedFont, s: sig, t: selectedTheme, 
        r: rec, d: memoryDate, 
        createdAt: firebase.database.ServerValue.TIMESTAMP 
    };
    

    Object.keys(payload).forEach(key => { if (!payload[key]) delete payload[key]; });
    
    btn.innerText = "Sealing Envelope... ⏳";
    btn.disabled = true;

    try {
        const newRef = db.ref("bouquets").push();
        await newRef.set(payload);
        
        const link = `${window.location.origin}${window.location.pathname}?id=${newRef.key}`;
        
        document.getElementById('share-link-container').classList.remove('hidden');
        document.getElementById('share-link').value = link;
        btn.innerText = "Success! ✨";
    } catch (error) {
        console.error("Firebase Error: ", error);
        alert("Failed to create link. Please make sure your Realtime Database Rules are set to true!");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function copyLink() {
    const linkInput = document.getElementById('share-link').value;
    const copyBtn = document.querySelector('.copy-btn');

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(linkInput).then(() => {
            copyBtn.innerText = 'Copied!';
            setTimeout(() => { copyBtn.innerText = 'Copy Link'; }, 2000);
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = linkInput;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        copyBtn.innerText = 'Copied!';
        setTimeout(() => { copyBtn.innerText = 'Copy Link'; }, 2000);
    }
}

// --- RECIPIENT VIEW, PRELOADER & TEXT SCALING ---
function preloadImageAndRender(payload) {
    const img = new Image();
    img.onload = () => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('envelope-screen').classList.remove('hidden');
        renderShared(payload);
    };
    img.onerror = () => { alert("Could not load the bouquet image."); };
    img.src = `assets/${payload.i}.jpg`;
}

function previewCard() {
    const msg = document.getElementById('custom-message').value;
    const sig = document.getElementById('sender-name').value;
    const rec = document.getElementById('recipient-name').value || "Someone Special";
    const memoryDate = document.getElementById('memory-date').value;
    
    document.getElementById('edit-mode').classList.add('hidden');
    document.getElementById('envelope-screen').classList.remove('hidden');
    document.getElementById('reply-btn').classList.add('hidden');
    document.getElementById('close-preview-btn').classList.remove('hidden');
    
    renderShared({ i: currentSelection, m: msg, f: selectedFont, s: sig, t: selectedTheme, r: rec, d: memoryDate });
}

function closePreview() {
    document.getElementById('view-mode').classList.add('hidden');
    document.getElementById('envelope-screen').classList.add('hidden');
    document.getElementById('edit-mode').classList.remove('hidden');
    document.getElementById('magic-container').innerHTML = '';
}

function renderShared(payload) {
    document.getElementById('shared-bouquet-img').src = `assets/${payload.i}.jpg`;
    if (payload.t) document.body.className = `theme-${payload.t}`;
    
    document.getElementById('envelope-name').innerText = payload.r || "Someone Special";
    
    if (payload.m) {
        const msgElement = document.getElementById('shared-message');
        msgElement.innerText = payload.m;
        const fontName = payload.f || 'Alex Brush';
        const isSerif = fontName === 'Playfair Display' ? 'serif' : 'cursive';
        msgElement.style.fontFamily = `'${fontName}', ${isSerif}`;
    }
    
    const sigElement = document.getElementById('shared-signature');
    sigElement.innerText = payload.s ? payload.s : "";

    // VINTAGE STAMP LOGIC
    const stampEl = document.getElementById('vintage-stamp');
    const stampDateEl = document.getElementById('stamp-date-text');
    if (payload.d) {
        const dateObj = new Date(payload.d);
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        stampDateEl.innerText = formattedDate;
        stampEl.classList.remove('hidden');
    } else {
        stampEl.classList.add('hidden');
    }
    
    setTimeout(autoScaleText, 50);
}

function autoScaleText() {
    const overlayBox = document.getElementById('text-overlay-box');
    const msgEl = document.getElementById('shared-message');
    const sigEl = document.getElementById('shared-signature');
    
    if (!overlayBox || !msgEl) return;

    let fontSize = 1.6; 
    msgEl.style.fontSize = fontSize + 'rem';
    
    if (sigEl.innerText !== "") {
        sigEl.style.fontSize = (fontSize * 0.7) + 'rem';
        sigEl.style.marginTop = '8px';
    }
    
    let attempts = 0; 
    while (overlayBox.scrollHeight > overlayBox.clientHeight && fontSize > 0.6 && attempts < 50) {
        fontSize -= 0.05; 
        msgEl.style.fontSize = fontSize + 'rem';
        if (sigEl.innerText !== "") sigEl.style.fontSize = (fontSize * 0.7) + 'rem';
        attempts++;
    }
}

function openEnvelope() {
    const envelope = document.getElementById('envelope-screen');
    const viewMode = document.getElementById('view-mode');
    
    envelope.style.opacity = '0';
    setTimeout(() => {
        envelope.classList.add('hidden');
        envelope.style.opacity = '1'; 
        viewMode.classList.remove('hidden');
        document.getElementById('skip-scratch-btn').classList.remove('hidden');
        
        const oldCanvas = document.getElementById('scratch-card');
        if (oldCanvas) oldCanvas.remove();
        
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'scratch-card';
        viewMode.insertBefore(newCanvas, viewMode.firstChild);
        
        document.getElementById('revealed-content').classList.remove('unlocked');
        setTimeout(() => { initScratchCard(viewMode); }, 100);
    }, 800);
}

// --- THE SCRATCH ENGINE ---
let globalCheckReveal; 
function forceReveal() { if (globalCheckReveal) globalCheckReveal(true); }

function startRevealEffect() {
    const container = document.getElementById('magic-container');
    container.innerHTML = ''; 
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const dust = document.createElement('div');
            dust.classList.add('luxury-dust');
            const size = Math.random() * 4 + 2;
            dust.style.width = size + 'px'; dust.style.height = size + 'px';
            dust.style.left = Math.random() * 100 + 'vw';
            dust.style.animationDuration = (Math.random() * 4 + 4) + 's, 3s'; 
            container.appendChild(dust);
            setTimeout(() => { dust.remove(); }, 8000);
        }, i * 100); 
    }
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const orb = document.createElement('div');
            orb.classList.add('bokeh-orb');
            const size = Math.random() * 40 + 20;
            orb.style.width = size + 'px'; orb.style.height = size + 'px';
            orb.style.left = Math.random() * 100 + 'vw';
            orb.style.animationDuration = (Math.random() * 6 + 6) + 's'; 
            container.appendChild(orb);
            setTimeout(() => { orb.remove(); }, 12000);
        }, i * 300);
    }
}

function initScratchCard(container) {
    const canvas = document.getElementById('scratch-card');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.fillStyle = '#E5C3C7'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 1.5rem 'Cormorant Garamond'";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("Scratch to reveal...", canvas.width / 2, canvas.height / 2);

    let isDrawing = false;
    let isRevealed = false;
    let lastCheckTime = 0; 
    const brushRadius = 65; 

    function getCoordinates(e) {
        const bounds = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - bounds.left, y: clientY - bounds.top };
    }

    function scratch(e) {
        if (!isDrawing || isRevealed) return;
        if (e.cancelable) e.preventDefault(); 
        
        if (navigator.vibrate) { navigator.vibrate(5); }

        const { x, y } = getCoordinates(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
        ctx.fill();
        
        const now = Date.now();
        if (now - lastCheckTime > 150) {
            checkReveal(false);
            lastCheckTime = now;
        }
    }

    globalCheckReveal = checkReveal;

    function checkReveal(force = false) {
        if (isRevealed) return;
        
        let clearedPercentage = 0;
        if (!force) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let clearPixels = 0;
            for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] < 50) clearPixels++; }
            clearedPercentage = (clearPixels / (pixels.length / 4)) * 100;
        }

        if (clearedPercentage > 35 || force) {
            isRevealed = true;
            canvas.style.transition = "opacity 1.2s ease";
            canvas.style.opacity = "0";
            document.getElementById('revealed-content').classList.add('unlocked');
            document.getElementById('skip-scratch-btn').classList.add('hidden');
            
            startRevealEffect();
            setTimeout(() => canvas.style.display = 'none', 1200); 
        }
    }

    function stopScratch() { if(isDrawing) { isDrawing = false; checkReveal(false); } }

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopScratch);
    canvas.addEventListener('mouseleave', stopScratch);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, { passive: false });
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('touchend', stopScratch);
}
