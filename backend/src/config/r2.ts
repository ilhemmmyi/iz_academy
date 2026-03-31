import { createClient } from '@supabase/supabase-js';
import { config } from './index';

// Re-exported as supabaseStorage for clarity; imported as r2Client in legacy code
export const supabaseStorage = createClient(config.supabase.url, config.supabase.serviceKey);

/** @deprecated use supabaseStorage directly */
export const r2Client = supabaseStorage;
