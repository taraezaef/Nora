import { observable } from '@legendapp/state';
import { supabaseAuth } from '@/lib/supabase/client';
export const auth$ = observable({
    loaded: false,
    userId: undefined,
    userEmail: undefined,
    user: undefined,
    accessToken: '',
    plan: undefined,
});
supabaseAuth.onAuthStateChange((event, session) => {
    auth$.assign({
        loaded: true,
        userId: session?.user.id,
        userEmail: session?.user.email,
        user: session?.user.user_metadata,
        accessToken: session?.access_token,
    });
});
