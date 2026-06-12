/**
 * MapsService — re-derives the AUTHORITATIVE route distance for a km claim from the stops' coordinates,
 * so the billable distance can't be tampered client-side. Env-gated + graceful: reads GOOGLE_MAPS_API_KEY
 * and calls the Google Directions API over fetch (no SDK); on a missing key, <2 stops, stub/zero
 * coordinates, a non-OK response, a timeout, or ANY error it returns null and the caller falls back to the
 * client-supplied total_km. Distance is an exact decimal (km), never a float (#1). — SRS §11 / CLAUDE §2
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from 'decimal.js';

const TIMEOUT_MS = 8_000;
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

export interface RouteStop {
  lat: string;
  lng: string;
}

interface DirectionsLeg {
  distance?: { value?: number };
}
interface DirectionsResponse {
  status?: string;
  routes?: { legs?: DirectionsLeg[] }[];
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(private readonly config: ConfigService) {}

  /** True when a server-side Maps key is configured (so distances are server-re-derived). */
  isConfigured(): boolean {
    return !!this.config.get<string>('GOOGLE_MAPS_API_KEY');
  }

  /**
   * Sum the route's leg distances (ordered stops: origin → waypoints → destination) → km, or null when
   * Maps is unavailable so the caller keeps the client-supplied value. Never throws.
   *
   * ROUND trips measure the CLOSED LOOP: the first stop is appended as the final destination, so the
   * return drive is included in total_km — the rep enters only the outbound stops. If the rep ALREADY
   * re-entered the first stop as the literal last stop (identical coordinates), nothing is appended (the
   * return leg is never double-counted). Distance derivation only — the −30/−60 deduction is km.logic's,
   * untouched. — BRD §6.3 / SRS EXP-004
   */
  async routeDistanceKm(stops: RouteStop[], opts: { roundTrip?: boolean } = {}): Promise<Decimal | null> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey || stops.length < 2 || !this.hasRealCoordinates(stops)) {
      return null;
    }
    try {
      const route =
        opts.roundTrip && !sameCoordinates(stops[0], stops[stops.length - 1]) ? [...stops, stops[0]] : stops;
      const last = route.length - 1;
      const params = new URLSearchParams({
        origin: `${route[0].lat},${route[0].lng}`,
        destination: `${route[last].lat},${route[last].lng}`,
        key: apiKey,
      });
      const waypoints = route.slice(1, last).map((s) => `${s.lat},${s.lng}`);
      if (waypoints.length) {
        params.set('waypoints', waypoints.join('|'));
      }

      const res = await withTimeout(fetch(`${DIRECTIONS_URL}?${params.toString()}`), TIMEOUT_MS);
      if (!res.ok) return null;
      const json = (await res.json()) as DirectionsResponse;
      if (json.status !== 'OK' || !json.routes?.length) {
        return null;
      }
      const meters = (json.routes[0].legs ?? []).reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
      if (meters <= 0) return null;
      return new Decimal(meters).div(1000).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    } catch (err) {
      // Best-effort: log server-side and fall back to the client value (never block the claim).
      this.logger.warn(`Directions lookup failed; falling back to client total_km: ${(err as Error).message}`);
      return null;
    }
  }

  /** Guard against stubbed '0' coordinates (the no-geocoder fallback) — treat them as "no coordinates". */
  private hasRealCoordinates(stops: RouteStop[]): boolean {
    return stops.every((s) => !new Decimal(s.lat).isZero() || !new Decimal(s.lng).isZero());
  }
}

/** Numeric (not string) equality, so '49.10' and '49.1' are the same place. */
function sameCoordinates(a: RouteStop, b: RouteStop): boolean {
  return new Decimal(a.lat).equals(new Decimal(b.lat)) && new Decimal(a.lng).equals(new Decimal(b.lng));
}

/** Reject after `ms` so a slow/hung Directions call can never block the request. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('directions-timeout')), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error as Error);
      },
    );
  });
}
