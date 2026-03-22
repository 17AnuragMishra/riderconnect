import GeoCache from '../models/GeoCache.js';

const GEO_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Resolve a place query to { lat, lng }. Uses GeoCache then Nominatim.
 * @param {string} q - Place query (address or name)
 * @returns {Promise<{ lat: number; lng: number } | null>}
 */
export async function geocode(q) {
  const query = (q || '').toString().trim();
  if (!query) return null;

  const normalized = query.toLowerCase();

  try {
    const cached = await GeoCache.findOne({ query: normalized });
    if (cached && Date.now() - cached.updatedAt.getTime() < GEO_TTL_MS) {
      return { lat: cached.lat, lng: cached.lng };
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RiderConnect/1.0 (contact@riderconnect.local)' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    await GeoCache.findOneAndUpdate(
      { query: normalized },
      { query: normalized, lat, lng },
      { upsert: true, new: true }
    );

    return { lat, lng };
  } catch (err) {
    console.error('Geocode error:', err);
    return null;
  }
}
