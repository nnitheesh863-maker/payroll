import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imjkhnvnmbfnlxwqjsfy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ja0kLytBfCv6hlsNC07zlw_51e76n8U';

export const supabase = createClient(supabaseUrl, supabaseKey);
