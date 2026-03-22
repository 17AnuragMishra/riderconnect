import express from 'express';
import RouteCache from '../models/RouteCache.js';
import { geocode } from '../utils/geocode.js';

const router = express.Router();

const ROUTE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

router.get('/geocode', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (!q) {
    return res.status(400).json({ error: 'q is required' });
  }

  try {
    const result = await geocode(q);
    if (!result) {
      return res.status(404).json({ error: 'No results for query' });
    }
    return res.json({ lat: result.lat, lng: result.lng });
  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, profile } = req.query;

  const fl = parseFloat(fromLat);
  const fng = parseFloat(fromLng);
  const tl = parseFloat(toLat);
  const tng = parseFloat(toLng);

  if (![fl, fng, tl, tng].every((v) => Number.isFinite(v))) {
    return res.status(400).json({
      error: 'fromLat, fromLng, toLat, toLng are required numbers',
    });
  }

  const requestedProfile = (profile || 'driving').toString().trim().toLowerCase();
  const normalizedProfile =
    requestedProfile === 'car'
      ? 'driving'
      : requestedProfile === 'bike'
      ? 'cycling'
      : requestedProfile === 'foot'
      ? 'walking'
      : requestedProfile;

  const allowedProfiles = new Set(['driving', 'cycling', 'walking']);
  if (!allowedProfiles.has(normalizedProfile)) {
    return res.status(400).json({
      error: 'profile must be one of driving, cycling, walking (or aliases car, bike, foot)',
    });
  }

  const key = `${normalizedProfile}:${fl},${fng}-${tl},${tng}`;

  try {
    const cached = await RouteCache.findOne({ key });

    if (cached && Date.now() - cached.updatedAt.getTime() < ROUTE_TTL_MS) {
      return res.json(cached.data);
    }

    const url = `https://router.project-osrm.org/route/v1/${normalizedProfile}/${fng},${fl};${tng},${tl}?overview=full&geometries=geojson&alternatives=true&steps=false`;
    const response = await fetch(url);

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: 'Failed to fetch from routing service' });
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.routes) || data.routes.length === 0) {
      return res.status(502).json({ error: 'No route found' });
    }

    const primary = data.routes[0];
    const alternatives = data.routes.slice(1).map((route) => ({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
    }));

    const payload = {
      distance: primary.distance,
      duration: primary.duration,
      geometry: primary.geometry,
      alternatives,
    };

    await RouteCache.findOneAndUpdate(
      { key },
      { key, data: payload },
      { upsert: true, new: true }
    );

    return res.json(payload);
  } catch (err) {
    console.error('Route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

