import * as LocalAuth from 'expo-local-authentication';

export const canBiometric = () =>
  LocalAuth.hasHardwareAsync().then(h => h && LocalAuth.isEnrolledAsync());

export const askBiometric = () =>
  LocalAuth.authenticateAsync({ promptMessage:'Giriş', cancelLabel:'İptal' })
           .then(r => r.success);
