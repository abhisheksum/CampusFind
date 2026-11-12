# System Architecture

## Runtime architecture

```mermaid
flowchart LR
  Browser[React + Vite + Tailwind] -->|HTTPS REST + cookies| API[Express API /api/v1]
  API --> Auth[JWT Auth Middleware]
  API --> Services[Domain Services]
  Services --> Mongo[(MongoDB Atlas)]
  Services --> Mail[Nodemailer SMTP]
  Browser -->|Signed upload| Cloudinary[Cloudinary]
  Services -->|Signature| Browser
```

The frontend never receives JWT refresh tokens or Cloudinary API secrets. The backend signs Cloudinary uploads and controls authorization.

## Backend layers

```text
Route
  -> validation middleware
  -> authentication/role middleware
  -> controller
  -> service
  -> Mongoose model
  -> notification/audit side effects
```

Important services:

- `auth.service.js`: registration, verification, JWT sessions, password lifecycle.
- `report.service.js`: report lifecycle, ownership, moderation, image references.
- `matching.service.js`: transparent weighted lost/found matching.
- `claim.service.js`: claim transitions and recovery.
- `notification.service.js`: ownership-scoped notification operations.
- `admin.service.js`: dashboard aggregation, moderation, user administration.

## Domain relationships

```mermaid
erDiagram
  USER ||--o{ ITEM_REPORT : owns
  USER ||--o{ RECOVERY_CLAIM : submits
  ITEM_REPORT ||--o{ RECOVERY_CLAIM : receives
  USER ||--o{ RECOVERY_CLAIM : reviews
  ITEM_REPORT ||--o{ NOTIFICATION : relates
  RECOVERY_CLAIM ||--o{ NOTIFICATION : relates
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUDIT_LOG : acts
  CATEGORY ||--o{ ITEM_REPORT : classifies
  CAMPUS_LOCATION ||--o{ ITEM_REPORT : locates
```

## Recovery workflow

```mermaid
sequenceDiagram
  participant Student
  participant API
  participant Finder
  participant DB
  Student->>API: Submit claim with explanation/evidence
  API->>DB: Store submitted claim
  API-->>Finder: New claim notification
  Finder->>API: Approve, reject, or request information
  API->>DB: Validate transition and authorization
  alt approved
    API->>DB: Accept one claim and recover report
    API->>DB: Reject competing active claims
  else rejected or more information
    API->>DB: Record decision and reason
  end
  API-->>Student: Status notification
```

## Deployment architecture

```mermaid
flowchart LR
  User[Student/Admin Browser] --> Vercel[Vercel: React static app]
  Vercel --> Render[Render: Express API]
  Render --> Atlas[MongoDB Atlas]
  Render --> SMTP[SMTP Provider]
  Browser --> Cloudinary[Cloudinary]
```

## Roles

- `student`: create reports and claims, manage own resources.
- `moderator`: review reports and claims, inspect platform activity.
- `admin`: all moderator actions plus user management and dashboard access.
