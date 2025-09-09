#!/usr/bin/env node

const emailService = require('./email-service');

// Test email configuration and send test email
async function testEmailService() {
  console.log('📧 Testing Email Service Configuration\n');

  // Test configuration
  console.log('1. Testing email configuration...');
  const configTest = await emailService.testConfiguration();

  if (configTest.success) {
    console.log('✅ Email configuration is valid');
  } else {
    console.log('❌ Email configuration error:', configTest.error);
    if (!emailService.isConfigured()) {
      console.log('💡 Email service will use test account (Ethereal Email)');
    }
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const testEmail = args.find((arg) => arg.startsWith('--email='))?.split('=')[1];

  if (!testEmail) {
    console.log('\n📝 Usage: node test-email.js --email=test@example.com');
    console.log('   This will send a test invitation email to the specified address');
    process.exit(0);
  }

  // Send test invitation email
  console.log(`\n2. Sending test invitation email to ${testEmail}...`);

  try {
    const testUserData = {
      username: 'test_invitation',
      email: testEmail,
      password: 'TestPassword123!',
      temporaryPassword: true,
    };

    const result = await emailService.sendInvitationEmail(testUserData);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);

      if (result.previewUrl) {
        console.log(`\n📧 Preview URL: ${result.previewUrl}`);
        console.log('   Note: This is a test email - open the preview URL to see how it looks');
      }
    }
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);

    if (error.message.includes('authentication')) {
      console.log('\n💡 Email authentication tips:');
      console.log('   - For Gmail: Use an "App Password" instead of your regular password');
      console.log('   - Generate App Password: https://support.google.com/accounts/answer/185833');
      console.log('   - Make sure 2-factor authentication is enabled');
    }

    process.exit(1);
  }
}

// Show email configuration status
function showEmailStatus() {
  console.log('📧 Email Service Status\n');

  console.log('Configuration:');
  console.log(`   Service: ${process.env.EMAIL_SERVICE || 'Test Account (Ethereal)'}`);
  console.log(`   User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`   Host: ${process.env.EMAIL_HOST || 'smtp.ethereal.email (test)'}`);
  console.log(`   Port: ${process.env.EMAIL_PORT || '587'}`);
  console.log(`   Secure: ${process.env.EMAIL_SECURE || 'false'}`);

  console.log(`\nStatus: ${emailService.isConfigured() ? '✅ Ready' : '❌ Not configured'}`);

  if (!process.env.EMAIL_USER) {
    console.log('\n💡 To configure email service:');
    console.log('   1. Copy .env.template to .env');
    console.log('   2. Configure EMAIL_* variables');
    console.log('   3. Restart the application');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
📧 100K Tracker - Email Service Tester

Usage:
  node test-email.js [options]

Options:
  --email=<email>    Send test invitation email to specified address
  --status          Show email configuration status
  --help            Show this help message

Examples:
  node test-email.js --email=test@example.com     # Send test email
  node test-email.js --status                     # Show configuration
  
Notes:
  - Test emails use Ethereal Email if no real email service is configured
  - Ethereal emails can be viewed at https://ethereal.email/
  - For production, configure real email service in .env file
  `);
  process.exit(0);
}

if (args.includes('--status')) {
  showEmailStatus();
  process.exit(0);
}

// Run email test
testEmailService();
