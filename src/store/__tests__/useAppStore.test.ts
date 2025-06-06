import { useAppStore } from '../useAppStore';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    setItem: async (key: string, value: string) => {
      store[key] = value;
    },
    getItem: async (key: string) => store[key] || null,
    removeItem: async (key: string) => {
      delete store[key];
    },
  };
});

describe('useAppStore actions', () => {
  beforeEach(() => {
    useAppStore.setState({
      isAuth: false,
      profile: { fullName: '', avatarUri: '', dailyGoal: 2000 },
      feedPosts: [],
      calorieEntries: [],
    });
  });

  it('toggles authentication status', () => {
    useAppStore.getState().login();
    expect(useAppStore.getState().isAuth).toBe(true);
    useAppStore.getState().logout();
    expect(useAppStore.getState().isAuth).toBe(false);
  });

  it('updates profile fields', () => {
    useAppStore.getState().updateProfile({ fullName: 'Test User' });
    expect(useAppStore.getState().profile.fullName).toBe('Test User');
  });

  it('adds and removes calorie entries', () => {
    const entry = {
      id: '1',
      foodName: 'Apple',
      calories: 100,
      protein: 0,
      carbs: 25,
      fat: 0,
      quantity: 1,
      unit: 'piece' as const,
      createdAt: 'now',
    };
    useAppStore.getState().addCalorie(entry);
    expect(useAppStore.getState().calorieEntries).toHaveLength(1);
    useAppStore.getState().removeCalorie('1');
    expect(useAppStore.getState().calorieEntries).toHaveLength(0);
  });

  it('adds feed posts', () => {
    const post = { id: '1', user: 'A', text: 'Hello', createdAt: 'now' };
    useAppStore.getState().addPost(post);
    expect(useAppStore.getState().feedPosts[0]).toEqual(post);
  });
});
