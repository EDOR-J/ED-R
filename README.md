# EDØR - Place-Based Music & Culture

## Setup Instructions

This is a Rapid Prototype mockup. To transition to a full-stack application with real persistence, the following environment variables are required:

### Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL (found in Project Settings -> API)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous API key (found in Project Settings -> API)

### How to add them:
1. Open the **Secrets** tab in Replit.
2. Add a new secret with the key `SUPABASE_URL` and your URL as the value.
3. Add a new secret with the key `SUPABASE_ANON_KEY` and your key as the value.

*Note: In the current mockup mode, missing variables will trigger a helpful error screen which can be bypassed for demonstration purposes.*

## Supabase OAuth Configuration (Google)

To enable "Continue with Google":

1. Go to Authentication -> Providers -> Google in your Supabase dashboard.
2. Enable Google provider.
3. Configure the **Redirect URL** in Supabase to match your Replit deployment:
   - For local development/preview: `https://<your-replit-url>/auth/callback` (or simply the root URL if handling client-side)
   - Note: You must add the specific Replit domain (e.g., `https://edor-prototype.<username>.repl.co`) to the "Redirect URLs" whitelist in Authentication -> URL Configuration.
