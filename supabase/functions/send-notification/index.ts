// supabase/functions/send-notification/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Farklı bildirim türleri için hazır mesajlar
const NOTIFICATION_MESSAGES = {
    new_comment: (actorName: string) => `${actorName} gönderine yorum yaptı.`,
    new_like: (actorName:string) => `${actorName} gönderini beğendi.`,
    new_follower: (actorName: string) => `${actorName} seni takip etmeye başladı.`,
};

Deno.serve(async (req) => {
    try {
        const { table, record } = await req.json();

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        let targetUserId: string | null = null;
        let notificationBody = '';
        let notificationTitle = 'Yeni bir etkileşim!';
        let dataPayload = {};

        // Eylemi yapan kullanıcının adını ve soyadını alıyoruz
        const { data: actorProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name') // DEĞİŞİKLİK BURADA
            .eq('id', record.user_id)
            .single();

        // Gelen ad ve soyadı birleştirip, eksikse "Birisi" diyoruz
        const actorName = [actorProfile?.first_name, actorProfile?.last_name]
                .filter(Boolean)
                .join(' ')
            || 'Birisi'; // DEĞİŞİKLİK BURADA

        // === GELEN OLAYIN TÜRÜNE GÖRE BİLDİRİMİ HAZIRLA ===
        if (table === 'comments') {
            const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
            targetUserId = post?.user_id;
            notificationTitle = "Yeni Yorum 💬";
            notificationBody = NOTIFICATION_MESSAGES.new_comment(actorName);
            dataPayload = { screen: 'PostDetail', id: record.post_id };
        }
        else if (table === 'likes') {
            const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
            targetUserId = post?.user_id;
            notificationTitle = "Yeni Beğeni ❤️";
            notificationBody = NOTIFICATION_MESSAGES.new_like(actorName);
            dataPayload = { screen: 'PostDetail', id: record.post_id };
        }
        else if (table === 'followers') {
            targetUserId = record.followed_id;
            notificationTitle = "Yeni Takipçin Var! ✨";
            notificationBody = NOTIFICATION_MESSAGES.new_follower(actorName);
            dataPayload = { screen: 'Profile', id: record.follower_id };
        }

        // === BİLDİRİM GÖNDERME İŞLEMİ ===
        if (!targetUserId || targetUserId === record.user_id) {
            return new Response(JSON.stringify({ message: "Notification not sent (self-action or no target)." }), { status: 200 });
        }

        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', targetUserId)
            .single();
        const pushToken = targetProfile?.push_token;

        if (!pushToken) {
            return new Response(JSON.stringify({ error: "Target user has no push token." }), { status: 404 });
        }

        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: pushToken,
                sound: 'default',
                title: notificationTitle,
                body: notificationBody,
                data: dataPayload,
            }),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error('Function Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});