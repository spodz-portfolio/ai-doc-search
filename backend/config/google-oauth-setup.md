# Google OAuth 2.0 Setup (Alternative to Service Account)

## When to use OAuth vs Service Account:

### Service Account (Current Implementation)
- ✅ Server-to-server authentication
- ✅ No user login required
- ✅ Can access specific shared documents
- ❌ Requires manual sharing of documents
- ❌ Can't access all user's documents automatically

### OAuth 2.0 (User Authentication)
- ✅ User grants access to their entire Google account
- ✅ Can access all user's documents automatically
- ✅ More user-friendly experience
- ❌ Requires user to log in and grant permissions
- ❌ More complex implementation

## OAuth 2.0 Setup Steps:

1. **Create OAuth 2.0 Credentials**:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs: `http://localhost:3001/auth/google/callback`

2. **Add to .env**:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URL=http://localhost:3001/auth/google/callback
   ```

3. **Frontend Integration**:
   - Add Google Sign-In button
   - Handle OAuth flow
   - Store access tokens

4. **Backend Changes**:
   - Add OAuth routes
   - Handle token refresh
   - Use user tokens instead of service account

## Recommendation:
For development and personal use, **Service Account** is simpler and sufficient.
For production with multiple users, **OAuth 2.0** provides better user experience.