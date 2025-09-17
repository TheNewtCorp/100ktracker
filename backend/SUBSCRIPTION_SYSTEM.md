# Subscription System Documentation

## Overview

The 100K Tracker now includes a comprehensive subscription management system with three tiers:

- **Platinum Tracker** ($98/month) - Full-featured premium tier
- **Operandi Challenge Tracker** ($80/month) - Mid-tier with enhanced tracking
- **Free Tier** ($0/month) - Basic functionality

## Architecture

### Database Schema

The subscription system adds 6 new columns to the existing `users` table:

```sql
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_price REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN subscription_start_date TEXT;
ALTER TABLE users ADD COLUMN subscription_end_date TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
```

### Backend API Endpoints

#### User Subscription Management

- `GET /api/account/subscription` - Get user's subscription details
- `PUT /api/account/subscription` - Update user's subscription preferences

#### Admin Management

- `POST /api/admin/set-subscription` - Set subscription for any user (admin only)

### Frontend Integration

New subscription management tab in `AccountSettingsPage.tsx` includes:

- **Plan Overview**: Current tier, status, and pricing
- **Billing Information**: Cycle, amount, and next billing date
- **Feature Comparison**: Tier-specific feature lists
- **Stripe Configuration**: API key management for payment processing
- **Support Contact**: Direct access to support and billing management

## CLI Management Tools

### 1. Set Subscription (`set-subscription-prod.js`)

Manage individual user subscriptions:

```bash
# Set user to Platinum for 12 months
node set-subscription-prod.js john_doe platinum 12

# Set user to Operandi for 6 months
node set-subscription-prod.js jane_smith operandi 6

# Set user to free tier
node set-subscription-prod.js test_user free

# Show help
node set-subscription-prod.js --help
```

**Features:**

- Automatic database backup before changes
- User validation and confirmation prompts
- Comprehensive error handling
- Detailed success/failure reporting

### 2. List Subscriptions (`list-subscriptions.js`)

View and filter subscription status:

```bash
# List all users
node list-subscriptions.js

# Filter by tier
node list-subscriptions.js --tier platinum

# Filter by status
node list-subscriptions.js --status active

# Show only expired subscriptions
node list-subscriptions.js --expired

# Show only active paid subscriptions
node list-subscriptions.js --active
```

**Features:**

- Comprehensive statistics dashboard
- Flexible filtering options
- Revenue calculations
- Tabular display with sorting

### 3. Migration Tool (`migrate-users-subscriptions.js`)

Migrate existing users to subscription tiers:

```bash
# Preview migration without changes
node migrate-users-subscriptions.js preview

# Assign all users to free tier
node migrate-users-subscriptions.js free-all

# Assign based on usage patterns
node migrate-users-subscriptions.js usage-based

# Import from CSV file
node migrate-users-subscriptions.js csv-import subscriptions.csv
```

**Migration Strategies:**

1. **Free All**: Safe default - assigns everyone to free tier
2. **Usage-Based**: Analyzes watch collections and suggests tiers:
   - Platinum: 20+ watches OR $50k+ total value OR $5k+ average value
   - Operandi: 5+ watches OR $10k+ total value OR $2k+ average value
   - Free: Lower usage or new users
3. **CSV Import**: Import specific assignments from CSV file
4. **Payment Analysis**: Placeholder for future payment history analysis

**CSV Format:**

```csv
username,tier,duration_months
john_doe,platinum,12
jane_smith,operandi,6
free_user,free,0
```

## Database Functions

### Migration Functions

- `migrateSubscriptionColumns()` - Adds subscription columns to existing databases
- `getAllUsers()` - Returns all users for admin operations
- `getUserByUsername(username)` - Finds user by username

### Subscription Management

- `getUserSubscription(userId)` - Get user's subscription details
- `updateUserSubscription(userId, subscriptionData)` - Update user subscription
- `setUserSubscriptionByUsername(username, tier, status, price, startDate, endDate, stripeId)` - Set subscription by username
- `getSubscriptionTierInfo(tier)` - Get tier pricing and feature information

## Tier Configuration

### Platinum Tracker ($98/month)

- Unlimited watch tracking
- Advanced analytics & reports
- Invoice management
- Priority support
- Gold badge styling

### Operandi Challenge Tracker ($80/month)

- Enhanced watch tracking
- Challenge tracking tools
- Basic analytics
- Standard support
- Silver badge styling

### Free Tier ($0/month)

- Basic watch tracking
- Limited storage
- Community support
- Muted badge styling

## Frontend Components

### AccountSettingsPage Subscription Tab

The subscription management interface includes:

**Plan Overview Cards:**

- Current tier badge with tier-specific colors
- Subscription status indicator
- Pricing and billing cycle information
- Start and end dates

**Billing Information:**

- Monthly billing cycle display
- Current amount due
- Next billing date calculation
- Payment method integration preparation

**Feature Comparison:**

- Tier-specific feature lists
- Visual feature availability indicators
- Upgrade/downgrade guidance

**Stripe Configuration:**

- Publishable key input
- Secret key input (masked)
- Configuration validation
- Setup instructions

**Support Contact:**

- Direct email contact for subscription support
- Billing management access
- Help documentation links

## Security Considerations

### API Endpoints

- User authentication required for all subscription endpoints
- Admin authentication required for admin endpoints
- Input validation on all subscription data
- SQL injection prevention

### CLI Scripts

- Database backup creation before modifications
- Confirmation prompts for destructive operations
- Comprehensive error handling
- Graceful interruption handling (Ctrl+C)

### Frontend

- Sensitive data masking (Stripe secret keys)
- Status-based UI rendering
- Secure API communication
- Input validation and sanitization

## Installation and Setup

### 1. Database Migration

For existing installations, run the migration:

```bash
cd backend
node -e "require('./db').migrateSubscriptionColumns().then(() => console.log('Migration complete'))"
```

### 2. Environment Variables

Add Stripe configuration to `.env`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Frontend Dependencies

Ensure required dependencies are installed:

```bash
npm install lucide-react framer-motion
```

## Usage Examples

### Setting Up New User Subscriptions

```bash
# Admin workflow for new premium user
node set-subscription-prod.js premium_user platinum 12
node list-subscriptions.js --tier platinum
```

### Migrating Existing Users

```bash
# Preview migration strategy
node migrate-users-subscriptions.js preview

# Execute usage-based migration
node migrate-users-subscriptions.js usage-based
```

### Monitoring Subscription Status

```bash
# Check revenue and active subscriptions
node list-subscriptions.js --active

# Check for expiring subscriptions
node list-subscriptions.js --expired
```

## Development Notes

### Adding New Tiers

1. Update `TIER_INFO` in CLI scripts
2. Add tier configuration to `getSubscriptionTierInfo()` function
3. Update frontend tier selection and display logic
4. Add appropriate styling classes

### Extending Features

The subscription system is designed to be extensible:

- Feature flags can be added to control tier-specific functionality
- Payment webhook integration can be added for Stripe automation
- Usage analytics can be enhanced for better tier recommendations
- Additional CLI tools can be created using existing database functions

### Testing

- Use preview mode for safe testing: `node migrate-users-subscriptions.js preview`
- Test CLI scripts with non-production data first
- Verify database backups are created before modifications
- Test frontend integration with different subscription states

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure database path is correct
   - Check file permissions
   - Verify database initialization

2. **Migration Failures**
   - Check existing column constraints
   - Ensure database backup space is available
   - Verify user permissions

3. **Frontend API Errors**
   - Check backend server is running
   - Verify API endpoint URLs
   - Check authentication status

### Support

For technical support with the subscription system:

- Email: support@100ktracker.com
- Subject: Subscription System Support
- Include relevant error messages and reproduction steps
