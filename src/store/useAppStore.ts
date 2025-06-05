import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type FeedPost = {
    id: string;
    user: string;
    text: string;
    createdAt: string;
};

type CalorieEntry = {
    id: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: 'g' | 'ml' | 'piece';
    createdAt: string;
};

interface Profile {
    fullName: string;
    avatarUri: string;
    dailyGoal: number;
}

interface AppState {
    isAuth: boolean;
    profile: Profile;
    feedPosts: FeedPost[];
    calorieEntries: CalorieEntry[];
    login: () => void;
    logout: () => void;
    updateProfile: (p: Partial<Profile>) => void;
    addPost: (post: FeedPost) => void;
    addCalorie: (entry: CalorieEntry) => void;
    removeCalorie: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            isAuth: false,
            profile: { fullName: '', avatarUri: '', dailyGoal: 2000 },
            feedPosts: [],
            calorieEntries: [],
            login: () => set({ isAuth: true }),
            logout: () => set({ isAuth: false }),
            updateProfile: (p) =>
                set((state) => ({ profile: { ...state.profile, ...p } })),
            addPost: (post) =>
                set((state) => ({ feedPosts: [post, ...state.feedPosts] })),
            addCalorie: (entry) =>
                set((state) => ({
                    calorieEntries: [entry, ...state.calorieEntries],
                })),
            removeCalorie: (id) =>
                set((state) => ({
                    calorieEntries: state.calorieEntries.filter((e) => e.id !== id),
                })),
        }),
        {
            name: 'taakip-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
