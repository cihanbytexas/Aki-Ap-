import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://intlxvlmtjbxryvxketo.supabase.co'

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludGx4dmxtdGpieHJ5dnhrZXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzQ1NDQsImV4cCI6MjEwMzk1MDU0NH0.26Dl6FzSWGlol8e_Hf9oSCi3LgSoncwSVfqkB03A2Lc'

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
)

export default supabase
