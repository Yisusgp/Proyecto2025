import { createClient } from '@supabase/supabase-js'

// URL de su proyecto
const supabaseUrl = "https://yuoogyrxrazbjzvdjfws.supabase.co"; 

// Clave pública anónima (CORREGIDA: Eliminado el símbolo '!' del segmento 'ref' en el payload JWT)
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b29neXJ4cmF6Ymp6dmRqZndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTcyMTMsImV4cCI6MjA3OTc3MzIxM30.g00YYiC4od3kZrOmWRcio5eRNnxqz3DkY3mSM0ou6a0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
