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

## Supabase OAuth Configuration (Apple)

To enable "Continue with Apple":

1. **Apple Developer Portal:**
   - Create an App ID with "Sign In with Apple" capability enabled.
   - Create a Service ID (Identifier) for your web app.
     - Enable "Sign In with Apple" for this Service ID.
     - Configure the Return URLs (Redirect URIs):
       - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - Create a Private Key for "Sign In with Apple". Download the `.p8` file.

2. **Supabase Dashboard:**
   - Go to Authentication -> Providers -> Apple.
   - Enable Apple provider.
   - **Service ID**: The identifier you created above (e.g., `com.example.app.service`).
   - **Team ID**: Your Apple Developer Team ID (found in top right of developer portal).
   - **Key ID**: The ID of the private key you created (e.g., `ABC1234567`).
   - **Private Key**: Paste the contents of the `.p8` file.
   - **Redirect URL**: Ensure your Replit URL is whitelisted in Supabase Authentication -> URL Configuration.
