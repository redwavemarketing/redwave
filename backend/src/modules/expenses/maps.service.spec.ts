import { MapsService } from './maps.service';

const realStops = [
  { lat: '49.8951', lng: '-97.1384' },
  { lat: '49.8339', lng: '-97.1526' },
];

function make(key?: string) {
  const config = { get: jest.fn().mockReturnValue(key) };
  return { maps: new MapsService(config as never), config };
}

describe('MapsService (server-authoritative route distance, env-gated)', () => {
  afterEach(() => {
    // @ts-expect-error reset the mocked global fetch between tests
    global.fetch = undefined;
  });

  it('returns null (graceful) when no GOOGLE_MAPS_API_KEY is configured', async () => {
    const { maps } = make(undefined);
    expect(maps.isConfigured()).toBe(false);
    expect(await maps.routeDistanceKm(realStops)).toBeNull();
  });

  it('returns null for fewer than two stops', async () => {
    const { maps } = make('KEY');
    expect(await maps.routeDistanceKm([realStops[0]])).toBeNull();
  });

  it('returns null for stubbed all-zero coordinates (no-geocoder fallback)', async () => {
    const { maps } = make('KEY');
    const zero = [
      { lat: '0', lng: '0' },
      { lat: '0', lng: '0' },
    ];
    expect(await maps.routeDistanceKm(zero)).toBeNull();
  });

  it('sums the Directions legs (meters → km, exact decimal) when configured', async () => {
    const { maps } = make('KEY');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', routes: [{ legs: [{ distance: { value: 12500 } }, { distance: { value: 7500 } }] }] }),
    }) as never;
    const km = await maps.routeDistanceKm(realStops);
    expect(km?.toFixed(2)).toBe('20.00'); // (12500 + 7500) m = 20 km
  });

  it('returns null on a non-OK Directions status (graceful fallback)', async () => {
    const { maps } = make('KEY');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ZERO_RESULTS' }) }) as never;
    expect(await maps.routeDistanceKm(realStops)).toBeNull();
  });

  it('returns null on a thrown fetch (network error) — never blocks the claim', async () => {
    const { maps } = make('KEY');
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as never;
    expect(await maps.routeDistanceKm(realStops)).toBeNull();
  });
});

describe('MapsService — ROUND trips measure the closed loop (return to the first stop) — SRS EXP-004', () => {
  const A = { lat: '49.8951', lng: '-97.1384' };
  const B = { lat: '49.8339', lng: '-97.1526' };

  /** Mock fetch, capture the requested Directions URL, return one 10 km leg per route leg requested. */
  function mockDirections(legMeters: number[]) {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', routes: [{ legs: legMeters.map((value) => ({ distance: { value } })) }] }),
    });
    global.fetch = fetchMock as never;
    return { url: () => new URL(fetchMock.mock.calls[0][0] as string) };
  }

  it('round over A→B requests A→B→A — total includes the return leg (out + back)', async () => {
    const { maps } = make('KEY');
    const { url } = mockDirections([12500, 7500]); // A→B + B→A
    const km = await maps.routeDistanceKm([A, B], { roundTrip: true });

    const params = url().searchParams;
    expect(params.get('origin')).toBe('49.8951,-97.1384');
    expect(params.get('destination')).toBe('49.8951,-97.1384'); // back to the FIRST stop
    expect(params.get('waypoints')).toBe('49.8339,-97.1526'); // the entered last stop becomes a waypoint
    expect(km?.toFixed(2)).toBe('20.00'); // distance(A→B) + distance(B→A)
  });

  it('single over A→B is UNCHANGED (origin A, destination B, no waypoints)', async () => {
    const { maps } = make('KEY');
    const { url } = mockDirections([12500]);
    const km = await maps.routeDistanceKm([A, B], { roundTrip: false });

    const params = url().searchParams;
    expect(params.get('origin')).toBe('49.8951,-97.1384');
    expect(params.get('destination')).toBe('49.8339,-97.1526');
    expect(params.get('waypoints')).toBeNull();
    expect(km?.toFixed(2)).toBe('12.50');
  });

  it('EDGE: the rep already re-entered the first stop as the literal last stop → no double-append', async () => {
    const { maps } = make('KEY');
    const { url } = mockDirections([12500, 7500]); // A→B→A as entered — already closed
    await maps.routeDistanceKm([A, B, A], { roundTrip: true });

    const params = url().searchParams;
    expect(params.get('destination')).toBe('49.8951,-97.1384');
    expect(params.get('waypoints')).toBe('49.8339,-97.1526'); // ONLY B — A was not appended again
  });

  it('EDGE: identical coordinates with different STRING forms (49.10 vs 49.1) still count as the same place', async () => {
    const { maps } = make('KEY');
    const { url } = mockDirections([100, 100]);
    const A2 = { lat: '49.89510', lng: '-97.13840' }; // numerically equal to A
    await maps.routeDistanceKm([A, B, A2], { roundTrip: true });
    expect(url().searchParams.get('waypoints')).toBe('49.8339,-97.1526'); // not double-appended
  });
});
