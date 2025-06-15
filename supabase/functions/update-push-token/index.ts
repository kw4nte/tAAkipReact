// supabase/functions/update-push-token/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Gelen isteğin içinden push token'ı alıyoruz
    const { pushToken } = await req.json()
    if (!pushToken) {
      throw new Error('Push token is required.')
    }

    // Bu fonksiyonu çağıran kullanıcıyı alıyoruz
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      throw new Error('User not found.')
    }

    // RLS'i bypass etmek için YÖNETİCİ (SERVICE_ROLE) istemcisini oluşturuyoruz
    const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. ADIM: Bu token'a sahip OLABİLECEK diğer tüm kullanıcıları temizle
    const { error: clearError } = await adminClient
        .from('profiles')
        .update({ push_token: null })
        .eq('push_token', pushToken)

    if (clearError) throw clearError

    // 2. ADIM: Token'ı mevcut kullanıcıya ata
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({ push_token: pushToken })
        .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})