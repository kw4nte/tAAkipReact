import * as LocalAuth from 'expo-local-authentication';

export const canBiometric = async () => {
  const hasHardware = await LocalAuth.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuth.isEnrolledAsync();
};

export const askBiometric = () =>
  LocalAuth.authenticateAsync({ promptMessage:'Giriş', cancelLabel:'İptal' })
           .then(r => r.success);
