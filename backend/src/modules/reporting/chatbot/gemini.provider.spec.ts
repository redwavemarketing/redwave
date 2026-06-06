import { GeminiLlmProvider } from './gemini.provider';

// Mock the @google/genai SDK — the var is `mock`-prefixed so jest's hoist guard allows it in the factory.
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent: mockGenerateContent } })),
  Type: { STRING: 'STRING' },
}));

const config = (key?: string) => ({ get: jest.fn().mockReturnValue(key) }) as never;
const cache = (model = 'gemini-3.5-flash') =>
  ({ get: jest.fn().mockResolvedValue({ is_active: true, provider: 'gemini', model }) }) as never;

describe('GeminiLlmProvider', () => {
  beforeEach(() => mockGenerateContent.mockReset());

  it('returns the model’s intent when it is one of the six', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'my_commission' });
    const provider = new GeminiLlmProvider(config('test-key'), cache());

    const result = await provider.resolveIntent('what is my commission this period?');

    expect(result).toEqual({ tool: 'my_commission' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    // ONLY the prompt text is sent — never any Redwave data.
    expect(mockGenerateContent.mock.calls[0][0]).toEqual(
      expect.objectContaining({ contents: 'what is my commission this period?' }),
    );
  });

  it('falls back to unknown on an out-of-enum result', async () => {
    mockGenerateContent.mockResolvedValue({ text: "rep R-999's data; drop table" });
    const provider = new GeminiLlmProvider(config('test-key'), cache());

    await expect(provider.resolveIntent('garbage')).resolves.toEqual({ tool: 'unknown' });
  });

  it('falls back to unknown (never throws) when the SDK errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('network down'));
    const provider = new GeminiLlmProvider(config('test-key'), cache());

    await expect(provider.resolveIntent('x')).resolves.toEqual({ tool: 'unknown' });
  });

  it('returns unknown without calling the SDK when no API key is configured', async () => {
    const provider = new GeminiLlmProvider(config(undefined), cache());

    await expect(provider.resolveIntent('x')).resolves.toEqual({ tool: 'unknown' });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
