# API Reference

Base URL: `/api/v1`

Responses use the existing `{ success, data }` shape for successful requests and `{ success: false, error: { code, message, details? } }` for errors.

## Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Refresh cookie |
| POST | `/auth/logout` | Refresh cookie |
| POST | `/auth/verify-email` | Public token |
| POST | `/auth/resend-verification` | Public, rate limited |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public token |
| GET | `/auth/me` | Authenticated |

Access tokens are sent as `Authorization: Bearer <token>`. Refresh tokens are HTTP-only cookies.

## Users

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/users/me` | Authenticated |
| PATCH | `/users/me` | Authenticated |
| PATCH | `/users/me/password` | Authenticated |
| DELETE | `/users/me` | Authenticated |

## Reports and discovery

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/reports/options` | Public |
| GET | `/reports` | Public/optional authentication |
| GET | `/reports/:reportId` | Public/optional authentication |
| POST | `/reports` | Verified student |
| PATCH | `/reports/:reportId` | Owner or moderator/admin |
| DELETE | `/reports/:reportId` | Owner or moderator/admin |
| POST | `/reports/upload-signature` | Authenticated |
| POST | `/reports/:reportId/archive` | Owner or moderator/admin |
| POST | `/reports/:reportId/resolve` | Owner or moderator/admin |
| PATCH | `/reports/:reportId/status` | Moderator/admin |
| GET | `/reports/:reportId/matches` | Verified authenticated user |
| GET | `/reports/:reportId/similar` | Verified authenticated user |
| GET | `/matches` | Verified authenticated user |

Report listing supports keyword, type, category, location, date range, status, owner (`mine=true`), page, limit, and sort filters.

## Claims and recovery

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/claims` | Verified student |
| GET | `/claims/my` | Authenticated |
| GET | `/claims/:claimId` | Claimant, finder, moderator/admin |
| PATCH | `/claims/:claimId` | Claimant during information request |
| GET | `/reports/:reportId/claims` | Finder, moderator/admin |
| GET | `/claims` | Moderator/admin |
| POST | `/claims/:claimId/approve` | Finder, moderator/admin |
| POST | `/claims/:claimId/reject` | Finder, moderator/admin |
| POST | `/claims/:claimId/request-information` | Finder, moderator/admin |

Approval recovers the report, rejects competing active claims, creates notifications, and writes audit history. Transactions are used when MongoDB supports them; the service has a guarded conditional fallback for standalone MongoDB development environments.

## Notifications

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/notifications` | Authenticated owner |
| GET | `/notifications/unread-count` | Authenticated owner |
| PATCH | `/notifications/read-all` | Authenticated owner |
| PATCH | `/notifications/:notificationId/read` | Authenticated owner |
| DELETE | `/notifications/:notificationId` | Authenticated owner |

## Administration

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/admin/dashboard` | Admin |
| GET | `/admin/activity` | Moderator/admin |
| GET | `/admin/reports` | Moderator/admin |
| POST | `/admin/reports/:reportId/moderate` | Moderator/admin |
| GET | `/admin/users` | Admin |
| PATCH | `/admin/users/:userId/status` | Admin |
| PATCH | `/admin/users/:userId/role` | Admin |

## Health

```text
GET /api/v1/health
```

Returns API status, environment, and database readiness.
