import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Mevcut Tipleriniz (Değişiklik yok) ---
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

// --- YENİ EKLENEN KAYIT FORMU TİPİ ---
// Kayıt adımları boyunca toplanacak verilerin tip tanımı.
type RegistrationFormState = {
    firstName: string;
    lastName:string;
    gender: 'male' | 'female' | 'other' | ''; // Seçenekli yapı
    dateOfBirth: string; // YYYY-MM-DD formatında
    weight: string;
    height: string;
    goal: string;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | ''; // Seçenekli yapı
    email: string;
    password: string;
};

// --- Ana AppState Arayüzünü Güncelleme ---
interface AppState {
    // Mevcut state'ler
    isAuth: boolean;
    profile: Profile;
    feedPosts: FeedPost[];
    calorieEntries: CalorieEntry[];

    // YENİ EKLENEN KAYIT FORMU STATE'İ
    registrationForm: RegistrationFormState;

    // Mevcut aksiyonlar
    login: () => void;
    logout: () => void;
    updateProfile: (p: Partial<Profile>) => void;
    addPost: (post: FeedPost) => void;
    addCalorie: (entry: CalorieEntry) => void;
    removeCalorie: (id: string) => void;

    // YENİ EKLENEN KAYIT FORMU AKSİYONLARI
    setRegistrationFormField: <K extends keyof RegistrationFormState>(field: K, value: RegistrationFormState[K]) => void;
    resetRegistrationForm: () => void;
}

// --- YENİ EKLENEN KAYIT FORMU İÇİN BAŞLANGIÇ DEĞERLERİ ---
const initialFormState: RegistrationFormState = {
    firstName: '',
    lastName: '',
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
        (set) => ({
            // --- Mevcut state ve aksiyonlarınız ---
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

            // --- YENİ EKLENENLER ---
            // Kayıt formu state'ini ve başlangıç değerini ekliyoruz.
            registrationForm: initialFormState,

            // Kayıt formunun bir alanını güncellemek için aksiyon.
            setRegistrationFormField: (field, value) =>
                set((state) => ({
                    registrationForm: { ...state.registrationForm, [field]: value },
                })),

            // Kayıt işlemi bitince veya iptal edilince formu temizlemek için aksiyon.
            resetRegistrationForm: () => set({ registrationForm: initialFormState }),
        }),
        {
            name: 'taakip-storage', // Mevcut depolama adınız
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);