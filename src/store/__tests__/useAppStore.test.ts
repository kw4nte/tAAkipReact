import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-hooks';
import { useAppStore } from '../useAppStore';

describe('useAppStore store davranışı', () => {
  beforeEach(async () => {
    // AsyncStorage mock’ını sıfırlayalım
    await AsyncStorage.clear();
  });

  it('login() çağrıldığında isAuth true olmalı', () => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.login();
    });
    expect(result.current.isAuth).toBe(true);
  });

  it('logout() çağrıldığında isAuth false kalmalı', () => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.login();
      result.current.logout();
    });
    expect(result.current.isAuth).toBe(false);
  });

  it('addCalorie, removeCalorie doğru ekleme/çıkarma yapmalı', () => {
    const { result } = renderHook(() => useAppStore());
    const dummyEntry = {
      id: '1',
      foodName: 'Elma',
      calories: 52,
      protein: 0,
      carbs: 14,
      fat: 0,
      quantity: 100,
      unit: 'g' as const,
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addCalorie(dummyEntry);
    });
    expect(result.current.calorieEntries).toHaveLength(1);

    act(() => {
      result.current.removeCalorie(dummyEntry.id);
    });
    expect(result.current.calorieEntries).toHaveLength(0);
  });
});
