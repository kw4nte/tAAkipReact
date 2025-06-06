// src/__tests__/authBiometry.test.ts

import * as LocalAuth from 'expo-local-authentication';
import { canBiometric, askBiometric } from '../authBiometry';

jest.mock('expo-local-authentication'); // Jest, moduleNameMapper sayesinde bu satırla __mocks__/expo-local-authentication.ts'ı yükleyecek
const mocked = LocalAuth as jest.Mocked<typeof LocalAuth>;

describe('canBiometric', () => {
  it('returns false when hardware not available', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(false);
    const result = await canBiometric();
    expect(result).toBe(false);
  });

  it('returns false when not enrolled', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(true);
    mocked.isEnrolledAsync.mockResolvedValueOnce(false);
    const result = await canBiometric();
    expect(result).toBe(false);
  });

  it('returns true when hardware and enrolled', async () => {
    mocked.hasHardwareAsync.mockResolvedValueOnce(true);
    mocked.isEnrolledAsync.mockResolvedValueOnce(true);
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
    mocked.authenticateAsync.mockResolvedValueOnce(
        // LocalAuthenticationResult tipi gereği `error` alanı zorunlu
        { success: false, error: 'unknown' } as any
    );
    await expect(askBiometric()).resolves.toBe(false);
  });
});
