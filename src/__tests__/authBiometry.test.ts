import * as LocalAuth from 'expo-local-authentication';
import { canBiometric, askBiometric } from '../authBiometry';

jest.mock('expo-local-authentication');
const mocked = LocalAuth as jest.Mocked<typeof LocalAuth>;

describe('canBiometric', () => {
  it('returns false when hardware not available', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(false as any);
    const result = await canBiometric();
    expect(result).toBe(false);
  });

  it('returns false when not enrolled', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(true as any);
    mocked.isEnrolledAsync.mockResolvedValueOnce(false as any);
    const result = await canBiometric();
    expect(result).toBe(false);
  });

  it('returns true when hardware and enrolled', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(true as any);
    mocked.isEnrolledAsync.mockResolvedValueOnce(true as any);
    const result = await canBiometric();
    expect(result).toBe(true);
  });
});

describe('askBiometric', () => {
  it('resolves true on success', async () => {
    mocked.authenticateAsync.mockResolvedValueOnce({ success: true } as any);
    await expect(askBiometric()).resolves.toBe(true);
  });

  it('resolves false on failure', async () => {
    mocked.authenticateAsync.mockResolvedValueOnce({ success: false } as any);
    await expect(askBiometric()).resolves.toBe(false);
  });
});
