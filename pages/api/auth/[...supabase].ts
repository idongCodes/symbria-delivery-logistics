import { handleAuth } from '@supabase/auth-helpers-nextjs';

// This pages-route simply delegates auth requests to Supabase and
// sets the appropriate HttpOnly cookies for server-side authentication.
// After installing dependencies run: `npm install`.

export default handleAuth();
