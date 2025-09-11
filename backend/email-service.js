// Email service for 100K Tracker user management
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeAsync();
  }

  async initializeAsync() {
    await this.initializeTransporter();
  }

  async initializeTransporter() {
    // Check for email configuration
    const emailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, yahoo, etc.
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password for Gmail
      },
    };

    // If no email config, create a test account
    if (!emailConfig.auth.user) {
      console.log('⚠️  No email configuration found. Creating test account...');
      await this.createTestAccount();
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.initialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      await this.createTestAccount();
    }
  }

  async createTestAccount() {
    try {
      // Create a test account using Ethereal Email
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      this.initialized = true;
      console.log('📧 Test email account created:');
      console.log(`   User: ${testAccount.user}`);
      console.log(`   Pass: ${testAccount.pass}`);
      console.log('   Note: Emails will be captured at https://ethereal.email/');
    } catch (error) {
      console.error('❌ Failed to create test email account:', error.message);
    }
  }

  isConfigured() {
    return this.initialized && this.transporter;
  }

  // Generate invitation email template
  generateInvitationEmail(userData) {
    // Always use production URL for email links, never localhost
    const productionUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://100ktracker.com'
        : process.env.APP_URL || 'https://100ktracker.com';

    const { username, email, password, temporaryPassword, appUrl = productionUrl } = userData;

    const subject = 'Welcome to 100K Tracker - Your Account is Ready!';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                line-height: 1.6; 
                color: #E6E6E6; 
                max-width: 600px; 
                margin: 0 auto; 
                background: #0E0E0E;
                padding: 0;
            }
            .container { background: #0E0E0E; min-height: 100vh; }
            .header { 
                background: linear-gradient(135deg, #0E0E0E 0%, #1C1F24 100%); 
                color: #E6E6E6; 
                padding: 30px 20px; 
                text-align: center; 
                border-bottom: 2px solid #C8A97E;
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                color: #C8A97E; 
                margin-bottom: 8px;
                letter-spacing: 1px;
            }
            .tagline { 
                color: #E6E6E6; 
                opacity: 0.8; 
                font-size: 16px; 
                margin: 0;
            }
            .content { 
                padding: 30px 20px; 
                background: #1C1F24; 
                color: #E6E6E6;
            }
            .credentials { 
                background: #0E0E0E; 
                border-left: 4px solid #C8A97E; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 8px;
                border: 1px solid rgba(200, 169, 126, 0.2);
            }
            .credentials h3 { 
                color: #C8A97E; 
                margin: 0 0 15px 0; 
                font-size: 18px;
            }
            .credentials p { 
                margin: 8px 0; 
                font-family: 'Courier New', monospace;
                background: #1C1F24;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid rgba(200, 169, 126, 0.1);
            }
            .button { 
                display: inline-block; 
                background: #C8A97E; 
                color: #0E0E0E; 
                padding: 15px 35px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold; 
                margin: 25px 0; 
                transition: all 0.3s ease;
                font-size: 16px;
            }
            .button:hover { 
                background: #B8956E; 
                color: #0E0E0E; 
            }
            .warning { 
                background: rgba(231, 76, 60, 0.1); 
                border: 1px solid rgba(231, 76, 60, 0.3); 
                color: #E74C3C; 
                padding: 15px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            .features { 
                background: #0E0E0E; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 25px 0;
                border: 1px solid rgba(200, 169, 126, 0.1);
            }
            .features h3 { 
                color: #C8A97E; 
                margin: 0 0 15px 0; 
            }
            .features ul { 
                margin: 0; 
                padding-left: 20px; 
            }
            .features li { 
                margin: 8px 0; 
                color: #E6E6E6;
            }
            .steps { 
                background: #0E0E0E; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 25px 0;
                border: 1px solid rgba(200, 169, 126, 0.1);
            }
            .steps h3 { 
                color: #C8A97E; 
                margin: 0 0 15px 0; 
            }
            .steps ol { 
                margin: 0; 
                padding-left: 20px; 
            }
            .steps li { 
                margin: 10px 0; 
                color: #E6E6E6;
            }
            .footer { 
                padding: 25px 20px; 
                text-align: center; 
                font-size: 12px; 
                color: rgba(230, 230, 230, 0.6); 
                background: #0E0E0E;
                border-top: 1px solid rgba(200, 169, 126, 0.2);
            }
            .footer p { 
                margin: 5px 0; 
            }
            a { 
                color: #C8A97E; 
                text-decoration: none; 
            }
            a:hover { 
                color: #B8956E; 
            }
            strong { 
                color: #C8A97E; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">💎 100K Tracker</div>
                <p class="tagline">Luxury Watch Trading & Portfolio Management</p>
            </div>
            
            <div class="content">
                <h2 style="color: #C8A97E; margin-top: 0;">Welcome to 100K Tracker!</h2>
                
                <p>Your account has been created and you're now ready to start tracking your luxury watch portfolio, managing contacts, and creating professional invoices.</p>
                
                <div class="credentials">
                    <h3>🔐 Your Login Credentials</h3>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p><strong>Login URL:</strong> <a href="${appUrl}">${appUrl}</a></p>
                </div>
                
                ${
                  temporaryPassword
                    ? `
                <div class="warning">
                    <strong>⚠️ Important:</strong> This is a temporary password. You'll be required to change it on your first login for security.
                </div>
                `
                    : ''
                }
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}" class="button">Login to Your Account</a>
                </div>
                
                <div class="steps">
                    <h3>🚀 Getting Started</h3>
                    <ol>
                        <li><strong>Login</strong> using the credentials above</li>
                        <li><strong>Change your password</strong> ${temporaryPassword ? '(required)' : '(recommended)'}</li>
                        <li><strong>Configure Stripe API keys</strong> in Account Settings to enable invoicing</li>
                        <li><strong>Start tracking</strong> your watch portfolio and managing contacts</li>
                    </ol>
                </div>
                
                <div class="features">
                    <h3>✨ Features Available</h3>
                    <ul>
                        <li>📊 <strong>Watch Portfolio Tracking</strong> - Track purchases, sales, and valuations</li>
                        <li>👥 <strong>Contact Management</strong> - Manage buyers, sellers, and dealers</li>
                        <li>🎯 <strong>Lead Tracking</strong> - Monitor opportunities and follow-ups</li>
                        <li>💰 <strong>Professional Invoicing</strong> - Create and send invoices via Stripe</li>
                        <li>📈 <strong>Performance Analytics</strong> - Track your trading performance</li>
                    </ul>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
                
                <p style="margin-top: 30px;"><strong>Happy Trading!</strong><br>
                <span style="color: #C8A97E;">The 100K Tracker Team</span></p>
            </div>
            
            <div class="footer">
                <p>This email was sent because an account was created for you on 100K Tracker.</p>
                <p>If you didn't expect this email, please contact your administrator.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
Welcome to 100K Tracker!

Your account has been created and you're ready to start tracking your luxury watch portfolio.

Login Credentials:
Username: ${username}
Password: ${password}
Login URL: ${appUrl}

${temporaryPassword ? 'IMPORTANT: This is a temporary password. You must change it on your first login.\n' : ''}

Getting Started:
1. Login using the credentials above
2. Change your password ${temporaryPassword ? '(required)' : '(recommended)'}
3. Configure Stripe API keys in Account Settings to enable invoicing
4. Start tracking your watch portfolio and managing contacts

Features Available:
- Watch Portfolio Tracking
- Contact Management  
- Lead Tracking
- Professional Invoicing
- Performance Analytics

Happy Trading!
The 100K Tracker Team
    `;

    return { subject, html, text };
  }

  // Send invitation email
  async sendInvitationEmail(userData, adminEmail = 'admin@100ktracker.com') {
    // Ensure initialization is complete
    if (!this.initialized) {
      await this.initializeAsync();
    }

    if (!this.isConfigured()) {
      throw new Error('Email service not properly configured');
    }

    const { username, email } = userData;
    const emailTemplate = this.generateInvitationEmail(userData);

    const mailOptions = {
      from: `"100K Tracker" <${adminEmail}>`,
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Invitation email sent to ${email}`);

      // If using test account, show preview URL
      if (info.messageId && this.transporter.options.host === 'smtp.ethereal.email') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 Preview email: ${previewUrl}`);
        return { success: true, messageId: info.messageId, previewUrl };
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send invitation email to ${email}:`, error.message);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken, adminEmail = 'admin@100ktracker.com') {
    if (!this.isConfigured()) {
      throw new Error('Email service not properly configured');
    }

    // Always use production URL for email links
    const productionUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://100ktracker.com'
        : process.env.APP_URL || 'https://100ktracker.com';
    const resetUrl = `${productionUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"100K Tracker" <${adminEmail}>`,
      to: userEmail,
      subject: '100K Tracker - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #E6E6E6; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #0E0E0E;
                    padding: 0;
                }
                .container { background: #0E0E0E; min-height: 100vh; }
                .header { 
                    background: linear-gradient(135deg, #0E0E0E 0%, #1C1F24 100%); 
                    color: #E6E6E6; 
                    padding: 30px 20px; 
                    text-align: center; 
                    border-bottom: 2px solid #C8A97E;
                }
                .logo { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #C8A97E; 
                    margin-bottom: 8px;
                    letter-spacing: 1px;
                }
                .content { 
                    padding: 30px 20px; 
                    background: #1C1F24; 
                    color: #E6E6E6;
                }
                .button { 
                    display: inline-block; 
                    background: #C8A97E; 
                    color: #0E0E0E; 
                    padding: 15px 35px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    margin: 25px 0; 
                    transition: all 0.3s ease;
                    font-size: 16px;
                }
                .button:hover { 
                    background: #B8956E; 
                    color: #0E0E0E; 
                }
                .warning { 
                    background: rgba(58, 96, 115, 0.1); 
                    border: 1px solid rgba(58, 96, 115, 0.3); 
                    color: #3A6073; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                }
                .footer { 
                    padding: 25px 20px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: rgba(230, 230, 230, 0.6); 
                    background: #0E0E0E;
                    border-top: 1px solid rgba(200, 169, 126, 0.2);
                }
                a { 
                    color: #C8A97E; 
                    text-decoration: none; 
                }
                a:hover { 
                    color: #B8956E; 
                }
                strong { 
                    color: #C8A97E; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">💎 100K Tracker</div>
                    <p style="color: #E6E6E6; opacity: 0.8; font-size: 16px; margin: 0;">Password Reset Request</p>
                </div>
                
                <div class="content">
                    <h2 style="color: #C8A97E; margin-top: 0;">Password Reset Request</h2>
                    
                    <p>You requested a password reset for your 100K Tracker account.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" class="button">Reset Your Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
                    </div>
                    
                    <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                    
                    <p style="margin-top: 30px;">
                        <span style="color: #C8A97E;">The 100K Tracker Team</span>
                    </p>
                </div>
                
                <div class="footer">
                    <p>This email was sent because a password reset was requested for your 100K Tracker account.</p>
                    <p>If you didn't request this, please contact your administrator.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        You requested a password reset for your 100K Tracker account.
        
        Reset your password: ${resetUrl}
        
        This link will expire in 1 hour.
        If you didn't request this, please ignore this email.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${userEmail}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send password reset email:`, error.message);
      throw error;
    }
  }

  // Test email configuration
  async testConfiguration() {
    // Ensure initialization is complete
    if (!this.initialized) {
      await this.initializeAsync();
    }

    if (!this.isConfigured()) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
