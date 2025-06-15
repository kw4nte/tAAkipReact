// lib/supa.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // EKLENDİ

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    // createClient'e üçüncü bir parametre olarak aşağıdaki obje eklendi
    {
        auth: {
            storage: AsyncStorage, // Supabase'e depolama alanı olarak AsyncStorage'ı kullanmasını söylüyoruz
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);