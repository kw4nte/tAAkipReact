import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create a Supabase client with the user's auth token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Get the user from the auth token
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('User not found. Make sure you are logged in.');

        // Get the user's profile from the database
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('weight_kg, height_cm, date_of_birth, gender, activity_level')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;
        if (!profile.weight_kg || !profile.height_cm || !profile.date_of_birth || !profile.gender || !profile.activity_level) {
            throw new Error('Profile is missing required information for calculation (weight, height, birthday, gender, or activity level).');
        }

        // --- CALCULATION LOGIC ---
        const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
        const { weight_kg, height_cm, gender } = profile;

        // 1. Basal Metabolic Rate (BMR) using Mifflin-St Jeor
        let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);
        if (gender.toLowerCase() === 'male') {
            bmr += 5;
        } else if (gender.toLowerCase() === 'female') {
            bmr -= 161;
        }

        // 2. Activity Multiplier
        const activityMultipliers: { [key: string]: number } = {
            'sedentary': 1.2,       // Masa başı / Hareketsiz
            'light': 1.375,         // Az hareketli
            'moderate': 1.55,       // Orta
            'active': 1.725,        // Çok aktif
            'extra_active': 1.9     // Ekstra aktif
        };
        const multiplier = activityMultipliers[profile.activity_level] || 1.2; // Default to sedentary

        // 3. Daily Calorie Needs
        const daily_calorie_goal = Math.round(bmr * multiplier);

        // Update the user's profile with the calculated goal
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ daily_calorie_goal })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ message: 'Success', daily_calorie_goal }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});