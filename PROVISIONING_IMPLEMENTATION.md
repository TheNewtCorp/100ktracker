# Account Provisioning System Implementation

## Implementation Progress

### Phase 1: Database Enhancements

- [ ] Add general admin user creation
- [ ] Add transaction support for rollback
- [ ] Add audit logging for provisioning
- [ ] Enhance user status tracking

### Phase 2: Authentication System

- [ ] Create general admin authentication middleware
- [ ] Add general admin user to database initialization
- [ ] Separate admin permissions system

### Phase 3: Provisioning API

- [ ] Create comprehensive provision-account endpoint
- [ ] Add step-by-step validation and rollback
- [ ] Implement 2-attempt email retry logic
- [ ] Add subscription tier assignment

### Phase 4: Promo Integration

- [ ] Enhance promo create-account button
- [ ] Auto-assign operandi tier for promo signups
- [ ] Update promo admin dashboard

### Phase 5: Admin Dashboard

- [ ] Create general admin interface
- [ ] Add individual action buttons (resend email, etc.)
- [ ] Account management functionality

## Authentication Structure

### Promo Admin

- Username: `100ktrackeradmin`
- Access: Promo signups dashboard only
- Endpoint: `/admin/promo-signups`

### General Admin

- Username: `100ktrackeradmin-general`
- Password: `Nn03241929$&@Gen`
- Access: Account provisioning and management
- Endpoints: `/api/admin/provision-account`, `/api/admin/users/*`

## API Endpoints

### Provisioning Endpoint

```
POST /api/admin/provision-account
Authorization: Bearer <general-admin-jwt>
```

### Individual Actions

```
POST /api/admin/users/resend-invitation
POST /api/admin/users/update-subscription
POST /api/admin/users/reset-password
```

## Subscription Tiers

- `free` - Basic tier
- `platinum` - Premium features
- `operandi` - Special Operandi Challenge tier (auto-assigned for promo signups)

## Rollback Strategy

1. Attempt account creation
2. If successful, attempt subscription assignment
3. If successful, attempt email sending (2 attempts)
4. If email fails twice, rollback account and subscription
5. Log detailed error for manual intervention
