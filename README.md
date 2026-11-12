# Smart Campus Lost-and-Found Portal

Smart Campus Lost-and-Found Portal is a MERN application that helps students report lost and found items, discover possible matches, submit recovery claims, and communicate status changes through a secure campus workflow.

## Problem statement

Lost property on campus is often reported through disconnected messages and informal groups. This makes items difficult to search, ownership difficult to verify, and recovery difficult to track.

## Objectives

- Centralize lost and found item reports.
- Make reports searchable by item, category, location, date, and status.
- Suggest transparent rule-based matches between lost and found reports.
- Provide an evidence-based claim and recovery workflow.
- Give moderators and administrators auditable control over reports and accounts.

## Features

- Student registration, login, email verification, password reset, and JWT sessions.
- Lost and found report creation, editing, archiving, and recovery.
- Cloudinary signed uploads for report and claim evidence images.
- Search, filtering, sorting, and pagination.
- Configurable rule-based potential matching.
- Claim submission, review, information requests, approval, rejection, and recovery.
- Notification center with unread counts and related-resource navigation.
- Admin dashboard with live metrics, trends, category distribution, and activity.
- Report moderation and administrator-only user management.
- Audit logging for claims, moderation, and administrative changes.
- Responsive React/Tailwind interface.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express.js, CommonJS |
| Database | MongoDB with Mongoose |
| Authentication | bcryptjs, JWT access tokens, rotating HTTP-only refresh cookies |
| Email | Nodemailer |
| Images | Cloudinary signed uploads |
| Security | Helmet, CORS, express-rate-limit, express-mongo-sanitize, express-validator |

## Architecture

The browser communicates with the Express REST API under `/api/v1`. Controllers validate requests and delegate business rules to services. Services use Mongoose models and create notifications or audit entries for important workflow changes. Images are uploaded directly from the browser to Cloudinary using a short-lived backend-generated signature.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the component, data, and workflow diagrams.

## Project structure

```text
backend/
  src/
    config/          Environment and database configuration
    controllers/     HTTP request handlers
    middleware/      Authentication, validation, rate limits, errors
    models/          Mongoose schemas
    routes/          Versioned REST routes
    services/        Authentication, reports, claims, matching, admin, notifications
    validators/      express-validator request rules
    utils/           Shared domain and database helpers
    scripts/         Seed and database verification scripts
frontend/
  src/
    components/      Shared layouts, forms, cards, and UI
    context/         Authentication context
    pages/           Portal, claim, notification, and admin screens
    services/        API clients and Cloudinary upload helpers
docs/
  API.md
  ARCHITECTURE.md
  TESTING.md
  DEMO-PREP.md
```

## Installation

Requirements:

- Node.js 18 or newer
- MongoDB 6 or newer, local or MongoDB Atlas
- Cloudinary account for image uploads
- SMTP provider for production email verification and password reset

```bash
git clone <your-repository-url>
cd Lost-and-found
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the environment files with local values. Never commit `.env` files.

## Environment variables

### Backend

The complete template is in [backend/.env.example](backend/.env.example).

Required:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`

Production integrations:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Deployment/security:

- Set `NODE_ENV=production`.
- Set `FRONTEND_URL` and `CLIENT_URL` to the exact deployed frontend origin.
- Set `COOKIE_SECURE=true` when serving over HTTPS.
- Use `COOKIE_SAME_SITE=lax` for same-site deployments. For a cross-site frontend/API deployment, use `COOKIE_SAME_SITE=none` together with `COOKIE_SECURE=true`.

For Gmail SMTP, use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_REQUIRE_TLS=true`, your Gmail address as `SMTP_USER`, and a Google App Password as `SMTP_PASSWORD`. Do not use the normal Gmail account password.

### Frontend

Set `VITE_API_URL` in [frontend/.env.example](frontend/.env.example), for example:

```text
VITE_API_URL=https://your-api.onrender.com/api/v1
```

## Database setup

Start MongoDB, then verify the connection and seed reference data:

```bash
npm run db:verify --prefix backend
npm run db:seed --prefix backend
npm run mail:verify --prefix backend
```

The seed script creates categories and campus locations only. It never creates a default administrator.

## Running locally

Run both applications:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

Default URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:5001`
- Health check: `http://localhost:5001/api/v1/health`

## API documentation

See [docs/API.md](docs/API.md) for endpoint groups, authentication requirements, roles, and representative request flows.

## Deployment

### MongoDB Atlas

1. Create a production cluster.
2. Create a least-privilege database user.
3. Restrict network access to the deployment provider where practical.
4. Copy the SRV connection string into `MONGODB_URI`.
5. Run the database verification and seed commands from a controlled deployment shell.

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/v1/health`
- Add all backend environment variables in Render's environment settings.

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` pointing to the deployed Render API.
- Configure SPA fallback rewrites to serve `index.html` for client-side routes.

### Cloudinary

Add the Cloudinary credentials only to the backend deployment. The API returns signed upload parameters, while the browser uploads directly to Cloudinary. Cloudinary API secrets are never sent to the frontend.

Do not deploy until the production values, CORS origin, cookie settings, SMTP delivery, MongoDB access, and Cloudinary upload flow have been verified.

## Security

- Passwords are bcrypt-hashed.
- Access tokens are short-lived JWTs.
- Refresh tokens are rotated and stored in HTTP-only cookies.
- Verification and reset tokens are stored hashed.
- Login and registration are rate limited.
- Requests are validated and sanitized.
- CORS is restricted to the configured frontend origin.
- Helmet security headers are enabled.
- Role and ownership checks are enforced in backend middleware/services.
- Sensitive authentication fields are excluded from responses.
- Administrative and recovery decisions are audited.

## Screenshots

Add demonstration screenshots to `docs/screenshots/` before submission. Recommended captures:

1. Landing page and search.
2. Student dashboard and potential matches.
3. Report form with image preview.
4. Claim review and recovery status.
5. Notification center.
6. Admin dashboard and moderation table.

## Future enhancements

- Real-time notifications with WebSockets.
- Campus SSO integration.
- Semantic matching as an optional explainable service.
- In-app messaging and conversation history.
- Abuse-report workflow with dedicated moderation entities.
- Automated retention and privacy controls.

## License

This project is intended as a college project demonstration. Add the final project license before public distribution.
