import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supa';

// --- Mevcut Tipleriniz (Değişiklik yok) ---
type FeedPost = {
    id: string;
    user: string;
    text: string;
    createdAt: string;
};

type Profile = {
    id: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
    date_of_birth: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    goal: string | null;
    activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | '';
    daily_calorie_goal: number | null;
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


// --- YENİ EKLENEN KAYIT FORMU TİPİ ---
// Kayıt adımları boyunca toplanacak verilerin tip tanımı.
type RegistrationFormState = {
    firstName: string;
    lastName: string;
    username: string; // <-- EKLENDİ
    gender: 'male' | 'female' | 'other' | '';
    dateOfBirth: string;
    weight: string;
    height: string;
    goal: string;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | '';
    email: string;
    password: string;
};

// --- Ana AppState Arayüzünü Güncelleme ---
interface AppState {
    isAuth: boolean;
    userProfile: Profile | null;
    feedPosts: FeedPost[];
    calorieEntries: CalorieEntry[];
    registrationForm: RegistrationFormState;
    selectedDate: string;

    // Aksiyonlar
    login: () => void;
    logout: () => void;
    fetchUserProfile: () => Promise<void>;
    setSelectedDate: (date: string) => void;
    addPost: (post: FeedPost) => void;
    addCalorie: (entry: CalorieEntry) => void;
    removeCalorie: (id: string) => void;
    setRegistrationFormField: <K extends keyof RegistrationFormState>(field: K, value: RegistrationFormState[K]) => void;
    resetRegistrationForm: () => void;
}

// --- YENİ EKLENEN KAYIT FORMU İÇİN BAŞLANGIÇ DEĞERLERİ ---
const initialFormState: RegistrationFormState = {
    firstName: '',
    lastName: '',
    username: '', // <-- EKLENDİ
    gender: '',
    dateOfBirth: '',
    weight: '',
    height: '',
    goal: '',
    activityLevel: '',
    email: '',
    password: '',
};


export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            isAuth: false,
            userProfile: null,
            feedPosts: [],
            calorieEntries: [],
            registrationForm: initialFormState,
            selectedDate: new Date().toISOString().split('T')[0],

            // AKSİYONLAR
            login: () => set({ isAuth: true }),
            logout: () => set({ isAuth: false, userProfile: null }),

            fetchUserProfile: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                        if (error) throw error;
                        set({ userProfile: data });
                    } else {
                        set({ userProfile: null });
                    }
                } catch (error) {
                    console.error('Error fetching user profile in store:', error);
                    set({ userProfile: null });
                }
            },

            setSelectedDate: (date) => set({ selectedDate: date }),
            addPost: (post) => set((state) => ({ feedPosts: [post, ...state.feedPosts] })),
            addCalorie: (entry) => set((state) => ({ calorieEntries: [entry, ...state.calorieEntries] })),
            removeCalorie: (id) => set((state) => ({ calorieEntries: state.calorieEntries.filter((e) => e.id !== id) })),
            setRegistrationFormField: (field, value) => set((state) => ({ registrationForm: { ...state.registrationForm, [field]: value } })),
            resetRegistrationForm: () => set({ registrationForm: initialFormState }),
        }),
        {
            name: 'taakip-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // İYİLEŞTİRME: Sadece verileri depola, fonksiyonları dışarıda bırak.
            partialize: (state) => ({
                isAuth: state.isAuth,
                userProfile: state.userProfile,
                selectedDate: state.selectedDate,
            }),
        }
    )
);