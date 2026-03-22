export type AccurateLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type GetBestLocationOptions = {
  desiredAccuracy?: number;
  maxWaitMs?: number;
  minimumSamples?: number;
  maximumAge?: number;
};

function toAccurateLocation(position: GeolocationPosition): AccurateLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

function isBetterCandidate(
  candidate: AccurateLocation,
  currentBest: AccurateLocation | null
): boolean {
  if (!currentBest) return true;

  const candidateAccuracy = Number.isFinite(candidate.accuracy)
    ? candidate.accuracy
    : Number.POSITIVE_INFINITY;
  const bestAccuracy = Number.isFinite(currentBest.accuracy)
    ? currentBest.accuracy
    : Number.POSITIVE_INFINITY;

  if (candidateAccuracy + 5 < bestAccuracy) return true;
  if (Math.abs(candidateAccuracy - bestAccuracy) <= 5) {
    return candidate.timestamp > currentBest.timestamp;
  }

  return false;
}

export function isAcceptableAccuracy(
  accuracy: number,
  maxAccuracyMeters: number = 120
): boolean {
  return Number.isFinite(accuracy) && accuracy <= maxAccuracyMeters;
}

export async function getBestCurrentLocation(
  options: GetBestLocationOptions = {}
): Promise<AccurateLocation> {
  const {
    desiredAccuracy = 40,
    maxWaitMs = 12000,
    minimumSamples = 2,
    maximumAge = 0,
  } = options;

  if (typeof window === "undefined" || !navigator?.geolocation) {
    throw new Error("Geolocation is not supported in this browser");
  }

  return new Promise((resolve, reject) => {
    let bestLocation: AccurateLocation | null = null;
    let sampleCount = 0;
    let settled = false;

    const finalize = (action: () => void) => {
      if (settled) return;
      settled = true;
      action();
    };

    const fallbackSingleFix = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const singleFix = toAccurateLocation(position);
          if (bestLocation && isBetterCandidate(bestLocation, singleFix)) {
            finalize(() => resolve(bestLocation!));
            return;
          }
          finalize(() => resolve(singleFix));
        },
        (error) => {
          if (bestLocation) {
            finalize(() => resolve(bestLocation!));
            return;
          }
          finalize(() => reject(error));
        },
        {
          enableHighAccuracy: true,
          timeout: Math.min(maxWaitMs, 8000),
          maximumAge,
        }
      );
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const candidate = toAccurateLocation(position);
        sampleCount += 1;

        if (isBetterCandidate(candidate, bestLocation)) {
          bestLocation = candidate;
        }

        if (
          bestLocation &&
          bestLocation.accuracy <= desiredAccuracy &&
          sampleCount >= minimumSamples
        ) {
          navigator.geolocation.clearWatch(watchId);
          finalize(() => resolve(bestLocation!));
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          navigator.geolocation.clearWatch(watchId);
          finalize(() => reject(error));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge,
      }
    );

    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);

      if (bestLocation && sampleCount > 0) {
        finalize(() => resolve(bestLocation!));
        return;
      }

      fallbackSingleFix();
    }, maxWaitMs);
  });
}