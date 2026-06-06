import { LlmProviderRouter } from './llm-router.provider';

const config = (key?: string) => ({ get: jest.fn().mockReturnValue(key) }) as never;
const cacheOf = (value: unknown) => ({ get: jest.fn().mockResolvedValue(value) }) as never;
const stub = () => ({ resolveIntent: jest.fn().mockResolvedValue({ tool: 'my_sales_count' }) });
const gemini = () => ({ resolveIntent: jest.fn().mockResolvedValue({ tool: 'my_commission' }) });

describe('LlmProviderRouter', () => {
  it('delegates to Gemini when active + provider gemini + key present', async () => {
    const s = stub();
    const g = gemini();
    const router = new LlmProviderRouter(
      config('k'),
      cacheOf({ is_active: true, provider: 'gemini', model: 'm' }),
      s as never,
      g as never,
    );

    await expect(router.resolveIntent('x')).resolves.toEqual({ tool: 'my_commission' });
    expect(g.resolveIntent).toHaveBeenCalledTimes(1);
    expect(s.resolveIntent).not.toHaveBeenCalled();
  });

  it('uses the stub when the config is inactive', async () => {
    const s = stub();
    const g = gemini();
    const router = new LlmProviderRouter(
      config('k'),
      cacheOf({ is_active: false, provider: 'gemini', model: 'm' }),
      s as never,
      g as never,
    );

    await router.resolveIntent('x');
    expect(s.resolveIntent).toHaveBeenCalledTimes(1);
    expect(g.resolveIntent).not.toHaveBeenCalled();
  });

  it('uses the stub when no API key is set', async () => {
    const s = stub();
    const g = gemini();
    const router = new LlmProviderRouter(
      config(undefined),
      cacheOf({ is_active: true, provider: 'gemini', model: 'm' }),
      s as never,
      g as never,
    );

    await router.resolveIntent('x');
    expect(s.resolveIntent).toHaveBeenCalledTimes(1);
    expect(g.resolveIntent).not.toHaveBeenCalled();
  });

  it('uses the stub when the provider is not gemini', async () => {
    const s = stub();
    const g = gemini();
    const router = new LlmProviderRouter(
      config('k'),
      cacheOf({ is_active: true, provider: 'other', model: 'm' }),
      s as never,
      g as never,
    );

    await router.resolveIntent('x');
    expect(s.resolveIntent).toHaveBeenCalledTimes(1);
    expect(g.resolveIntent).not.toHaveBeenCalled();
  });

  it('falls back to the stub when the config read fails', async () => {
    const s = stub();
    const g = gemini();
    const cacheThrows = { get: jest.fn().mockRejectedValue(new Error('db')) } as never;
    const router = new LlmProviderRouter(config('k'), cacheThrows, s as never, g as never);

    await router.resolveIntent('x');
    expect(s.resolveIntent).toHaveBeenCalledTimes(1);
    expect(g.resolveIntent).not.toHaveBeenCalled();
  });
});
