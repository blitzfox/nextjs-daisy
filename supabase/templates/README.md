# 🎨 AI Chess Coach Email Templates

Beautiful, modern email templates that match your AI Chess Coach branding with glass morphism design elements.

## 📧 Available Templates

### 1. **Magic Link Email** (`magic_link.html`)
- **Purpose**: Sign in emails for existing users
- **Design**: Indigo-cyan gradient matching your login flow
- **Subject**: "AI Chess Coach - Your Magic Link"
- **Features**: 
  - Premium glass morphism design with advanced blur effects
  - Animated shimmer effects on hover
  - Prominent "Access AI Chess Coach Now" button
  - Alternative 6-digit verification code
  - Enhanced security messaging and professional branding
  - Mobile-responsive with touch-optimized interactions

### 2. **Signup Confirmation** (`confirmation.html`)
- **Purpose**: Account confirmation for new users
- **Design**: Purple-pink gradient with welcome elements
- **Features**:
  - Welcome badge and onboarding messaging
  - Feature highlights (coaching, analysis, progress tracking)
  - Account confirmation button + OTP code
  - Encouraging copy for new users

## 🚀 Setup Instructions

### For Production (Supabase Dashboard)

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication → Email Templates

2. **Update Magic Link Template**
   - Select "Magic Link" template
   - **Subject**: `AI Chess Coach - Your Magic Link`
   - Copy the contents of `magic_link.html`
   - Paste into the template editor
   - Save changes

3. **Update Signup Confirmation Template**
   - Select "Confirm signup" template  
   - Copy the contents of `confirmation.html`
   - Paste into the template editor
   - Save changes

### For Local Development

If you're running Supabase locally, add this to your `supabase/config.toml`:

```toml
[auth.email.template.magic_link]
subject = "AI Chess Coach - Your Magic Link"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.confirmation]
subject = "✨ Welcome to ChessCoach - Confirm your account"
content_path = "./supabase/templates/confirmation.html"
```

Then restart your local Supabase:
```bash
supabase stop && supabase start
```

## 🎨 Design Features

### Visual Elements
- **Premium Glass Morphism**: Multi-layered translucent backgrounds with advanced backdrop blur
- **Dynamic Gradients**: Indigo-cyan gradient matching your login flow
- **Animated Effects**: Shimmer animations and hover interactions
- **Modern Typography**: Inter font with 800 weight for headlines
- **Responsive Design**: Mobile-first approach with enhanced touch targets
- **Micro-interactions**: Smooth transitions and visual feedback

### Brand Consistency
- **AI Chess Coach Logo**: Enhanced sparkles icon with premium styling
- **Color Palette**: 
  - Magic Link: Blue (#3b82f6) to Indigo (#6366f1) to Purple (#8b5cf6) to Cyan (#06b6d4)
  - Signup: Purple (#8b5cf6) to Pink (#ec4899)
- **Consistent Spacing**: 8px grid system with enhanced padding
- **Professional Footer**: Enhanced branding with AI coaching messaging

### Security & UX
- **Clear CTAs**: Premium buttons with "Access AI Chess Coach Now" copy
- **Alternative Access**: Enhanced 6-digit verification codes
- **Security Messaging**: Clear 60-minute expiration warnings
- **Accessibility**: High contrast ratios and semantic HTML
- **Premium Feel**: Elevated design matching your modern onboarding flow

## 🔧 Customization

### Updating Brand Colors
To match your brand colors, update these CSS variables in both templates:

```css
/* Magic Link - Indigo/Cyan theme */
.header {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 25%, #8b5cf6 75%, #06b6d4 100%);
}

.magic-link-button {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 25%, #8b5cf6 75%, #06b6d4 100%);
}

/* Confirmation - Purple/Pink theme */
.confirm-button {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
}
```

### Updating Copy
- **Brand Name**: Replace "AI Chess Coach" with your app name
- **AI Messaging**: Update "AI-Powered Chess Mastery" subtitle
- **Features**: Update the feature list in `confirmation.html`
- **Footer Links**: Update URLs to match your site structure
- **Subject Lines**: Use "AI Chess Coach - Your Magic Link" for premium feel

### Adding Your Logo
Replace the SVG sparkles icon with your own logo:

```html
<div class="logo-icon">
    <!-- Replace this SVG with your logo -->
    <img src="your-logo-url" alt="Your Brand" class="logo-image" />
</div>
```

## 📱 Mobile Optimization

Both templates include comprehensive mobile optimizations:
- Responsive breakpoints at 600px
- Touch-friendly button sizes (minimum 44px)
- Readable font sizes on small screens
- Proper viewport meta tags
- Optimized padding and margins
- Enhanced touch interactions

## 🔍 Testing

### Preview Templates
1. **Local Testing**: Use Supabase local development to test
2. **Email Clients**: Test in major email clients (Gmail, Outlook, Apple Mail)
3. **Devices**: Test on mobile and desktop
4. **Dark Mode**: Templates work well in both light and dark email clients

### Common Issues
- **Gmail Clipping**: Keep emails under 102KB to avoid clipping
- **Outlook Support**: Templates use table-based layouts for better Outlook support
- **Image Loading**: All graphics are inline SVG for reliability

## 🎯 Best Practices

1. **Premium Feel**: Focus on elevated design matching your modern UI
2. **Clear Hierarchy**: Use typography and gradients to guide the user's eye
3. **Security First**: Always include security warnings and expiration info
4. **Brand Consistency**: Match your app's sophisticated visual design
5. **Mobile First**: Design for mobile, enhance for desktop
6. **AI Branding**: Emphasize the AI-powered nature of your coaching

## 🚨 Important Notes

- **Token Security**: Never modify the `{{ .ConfirmationURL }}` or `{{ .Token }}` variables
- **Link Expiration**: Default expiration is 60 minutes - communicate this clearly
- **Backup Methods**: Always provide verification codes as alternative access
- **Testing**: Test thoroughly before deploying to production
- **Subject Line**: Use "AI Chess Coach - Your Magic Link" for consistent branding

---

**Need help?** Check the [Supabase Email Templates documentation](https://supabase.com/docs/guides/auth/auth-email-templates) for more details. 