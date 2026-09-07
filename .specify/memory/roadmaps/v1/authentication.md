# [x] Phase 2: Authentication

### [x] Step 2.1 — User registration endpoint

- Create `POST /api/v1/auth/register`.
- Accept: `email`, `password`, `display_name`, `user_role` (buyer or merchant).
- Hash the password with argon2, insert into `users` table.
- Return the created user (without password_hash).
- Write pytest tests for: success, duplicate email, missing fields.

### [x] Step 2.2 — User login endpoint

- Create `POST /api/v1/auth/login`.
- Accept: `email`, `password`.
- Verify password against stored hash.
- Issue a JWT token containing `user_id`, `user_role`, and `exp`.
- Return the JWT in the response body (frontend will set it as a cookie).
- Write pytest tests for: success, wrong password, non-existent user.

### [x] Step 2.3 — Auth dependency & current user

- Create a FastAPI dependency `get_current_user` that extracts and validates the JWT from the
  request (cookie or Authorization header).
- Create a `GET /api/v1/auth/me` endpoint that returns the current user's profile.
- Write tests for: valid token, expired token, missing token.

### [x] Step 2.4 — Frontend auth pages (Sign Up)

- Build the `/signup` page with a form: email, password, display name, role selector
  (Buyer/Merchant).
- Use Zod for client-side validation.
- On submit, call `POST /api/v1/auth/register`.
- On success, redirect to `/login`.
- Display validation errors inline.

### [x] Step 2.5 — Frontend auth pages (Log In)

- Build the `/login` page with a form: email, password.
- On submit, call `POST /api/v1/auth/login`.
- Store the returned JWT in an httpOnly cookie.
- Redirect to `/` on success.
- Display error messages for invalid credentials.

### [x] Step 2.6 — Auth context & middleware

- Create a React Context (`AuthContext`) that holds the current user state.
- On app mount, call `GET /api/v1/auth/me` to hydrate the user.
- Set up Next.js middleware to protect routes: `/cart`, `/checkout`, `/orders`, `/dashboard`,
  `/logistics`.
- Add a logout flow that clears the cookie and redirects to `/`.
