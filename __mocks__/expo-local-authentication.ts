// __mocks__/expo-local-authentication.ts
// Jest, testlerde `jest.mock('expo-local-authentication')` dediğimizde
// bu dosyayı kullanacak ve gerçek paketi yüklemeyecek.

/** Her fonksiyonu jest.fn() ile stub’lıyoruz */
export const hasHardwareAsync = jest.fn<
    Promise<boolean>,
    []
>(() => Promise.resolve(false));

export const isEnrolledAsync = jest.fn<
    Promise<boolean>,
    []
>(() => Promise.resolve(false));

export const authenticateAsync = jest.fn<
    Promise<{ success: boolean }>,
    []
>(() => Promise.resolve({ success: false }));
