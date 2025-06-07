# 🔐 Supabase Authentication Setup

This guide will help you set up Supabase authentication with magic links for your AI Chess Coach application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: AI Chess Coach (or your preferred name)
   - **Database Password**: Generate a secure password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys") - Keep this secret!

## 3. Configure Environment Variables

Create a `.env.local` file in your project root and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important**: Replace the placeholder values with your actual Supabase credentials.

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your domain:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## 5. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the "Magic Link" template if desired
3. You can add your branding and customize the email content

## 6. Test the Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign Up" or "Sign In"
4. Enter your email address
5. Check your email for the magic link
6. Click the link to authenticate

## 7. Production Deployment

When deploying to production:

1. Update your environment variables with production URLs
2. Add your production domain to Supabase settings
3. Update the `NEXT_PUBLIC_SITE_URL` environment variable

## Authentication Flow

The magic link authentication flow works as follows:

1. **User enters email** → Supabase sends magic link email
2. **User clicks link** → Redirected to `/auth/callback`
3. **Callback processes** → User is authenticated and redirected to dashboard
4. **Session management** → Automatic session refresh via middleware

## Security Features

- **No passwords**: Users authenticate via secure email links
- **Session management**: Automatic token refresh
- **Secure cookies**: HTTP-only cookies for session storage
- **CSRF protection**: Built-in protection against cross-site attacks

## Troubleshooting

### Magic link not working?
- Check that your Site URL and Redirect URLs are correctly configured
- Verify your environment variables are set correctly
- Check the browser console for any errors

### Email not arriving?
- Check spam/junk folder
- Verify the email address is correct
- Check Supabase logs in the dashboard

### Authentication errors?
- Check the browser console for detailed error messages
- Verify your API keys are correct
- Check that your Supabase project is active

## Next Steps

- Customize the email templates in Supabase
- Add user profiles and additional user data
- Implement role-based access control if needed
- Set up analytics and monitoring

For more information, visit the [Supabase documentation](https://supabase.com/docs/guides/auth). 