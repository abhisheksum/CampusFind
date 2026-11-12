# Testing and QA Record

## Automated checks executed

| Check | Result |
| --- | --- |
| Backend `node --check` across `src/**/*.js` | Passed |
| Backend application load | Passed |
| Frontend `npm run build` | Passed |
| Notification ownership/read/delete workflows | Passed |
| Possible-match notification creation | Passed |
| Admin dashboard aggregation | Passed |
| Report moderation permission and audit behavior | Passed |
| User role/status controls | Passed |
| Sensitive admin response field exclusion | Passed |
| Self-role and self-deactivation protection | Passed |
| Last-active-admin protection | Passed |

## Functional coverage

Covered workflows include authentication, report CRUD, report filtering, matching exclusions, claims, claim review, recovery, notifications, moderation, and user administration. Temporary test records were removed after integration checks.

## Security cases

- Duplicate registration is rejected.
- Malformed email addresses are rejected.
- Gmail, college, and other valid email domains are accepted.
- Email addresses are normalized to lowercase before duplicate checks.
- API/network failures show an actionable connection message instead of a generic fallback.
- Passwords and reset/verification tokens are not stored in plain text.
- Expired or revoked sessions are rejected.
- Unverified users cannot use restricted workflows.
- Notification reads and deletes are ownership-scoped.
- Student users cannot access administrator endpoints.
- Moderators cannot manage users.
- Users cannot change their own role or deactivate themselves.
- The last active administrator cannot be removed.

## Manual/browser validation status

The production frontend build was verified. Browser automation and device emulation were not run in this QA pass, so visual behavior on every desktop/tablet/mobile viewport remains a demonstration-time check.

Recommended manual smoke test:

1. Open `/`, `/login`, and `/register`.
2. Register two isolated student accounts.
3. Verify both accounts and log in.
4. Create a lost report and a found report.
5. Inspect browse, item details, matches, claim submission, and notifications.
6. Review the claim as the finder.
7. Log in as an admin and inspect dashboard, moderation, users, and activity.
8. Test invalid forms, expired sessions, and image upload failure.

## Known limitations

- Real SMTP delivery requires production SMTP credentials.
- Real image upload requires Cloudinary credentials.
- A dedicated abuse-report schema is not present; moderation uses report status and reason fields.
- No browser/E2E test runner is currently included.
