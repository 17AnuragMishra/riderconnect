export function parseCoordinatesFromLocationInput(
  value: string
): { lat: number; lng: number } | null {
  const input = value.trim();
  if (!input) return null;

  const bracketMatch = input.match(
    /\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/
  );
  if (bracketMatch) {
    const lat = Number.parseFloat(bracketMatch[1]);
    const lng = Number.parseFloat(bracketMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const directMatch = input.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );
  if (directMatch) {
    const lat = Number.parseFloat(directMatch[1]);
    const lng = Number.parseFloat(directMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

export function formatLocationWithCoordinates(
  lat: number,
  lng: number,
  label?: string
): string {
  if (label && label.trim()) {
    return label.trim();
  }

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}