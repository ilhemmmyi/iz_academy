import { createClient } from '@supabase/supabase-js';
import { config } from './index';

export const supabaseStorage = createClient(config.supabase.url, config.supabase.serviceKey);




