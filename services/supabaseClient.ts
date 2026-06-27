
import { createClient } from '@supabase/supabase-js';

// Replace these with your own Supabase project credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdzyxzywfrkiqpedarmj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkenl4enl3ZnJraXFwZWRhcm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDA2NDMsImV4cCI6MjA4ODUxNjY0M30.h02ujo2Pz__UymRGmmuHId_qp_GY_sNCbuyxVlL2N8Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
