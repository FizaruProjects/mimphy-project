import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pdzyxzywfrkiqpedarmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkenl4enl3ZnJraXFwZWRhcm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDA2NDMsImV4cCI6MjA4ODUxNjY0M30.h02ujo2Pz__UymRGmmuHId_qp_GY_sNCbuyxVlL2N8Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Profiles:");
    const { data: p } = await supabase.from('profiles').select('*').limit(1);
    console.log(p);
    
    console.log("Questions:");
    const { data: q } = await supabase.from('questions').select('*').limit(1);
    console.log(q);
    
    console.log("Packets:");
    const { data: pack } = await supabase.from('packets').select('*').limit(1);
    console.log(pack);
    
    console.log("Results:");
    const { data: r } = await supabase.from('results').select('*').limit(1);
    console.log(r);
}

test();
