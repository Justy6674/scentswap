# Security Best Practices

## Environment Variables

All secrets and API keys are stored in environment variables, never hardcoded in the codebase.

### Required Environment Variables

See `.env.example` for a complete list of required environment variables.

### Loading Environment Variables

**Node.js Scripts:**
- Import scripts automatically load `.env` files using `dotenv` (if installed)
- If `dotenv` is not installed, scripts will use system environment variables
- Install with: `npm install dotenv`

**Python Scripts:**
- Python scripts use `python-dotenv` to load `.env` files (if installed)
- Install with: `pip install python-dotenv`

**Expo/React Native:**
- Uses `EXPO_PUBLIC_*` prefix for client-side variables
- Loaded automatically via `expo-constants`

## Files Never Committed to Git

The following files are in `.gitignore` and should NEVER be committed:

- `.env` - Contains actual secrets
- `.env.local` - Local overrides
- `*.pem` - Private keys
- `secrets/` - Secret files directory

## Security Checklist

Before committing code:

- [ ] No hardcoded API keys or secrets
- [ ] All secrets use environment variables
- [ ] `.env` file is not tracked in git
- [ ] `.env.example` is up to date (with placeholder values only)
- [ ] No secrets in documentation (use placeholders)
- [ ] No secrets in commit messages

## Rotating Compromised Secrets

If secrets are accidentally committed:

1. **Immediately rotate the compromised keys:**
   - Supabase: Regenerate keys in project settings
   - OpenAI/Gemini/DeepSeek: Regenerate API keys
   - Outseta: Regenerate webhook secrets

2. **Remove from git history:**
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```

3. **Update all environments** with new keys

4. **Review access logs** for unauthorized usage

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Contact the repository maintainer directly
3. Provide details of the vulnerability

