#!/usr/bin/env node

/**
 * Post-Deployment JWT Analysis Hook
 *
 * This script runs after deployment to analyze JWT token status.
 * Can be called manually or as part of CI/CD pipeline.
 */

console.log('🚀 Post-Deployment Analysis Starting...');
console.log('📡 Environment:', process.env.NODE_ENV || 'development');
console.log('🌐 Server URL:', process.env.RENDER_EXTERNAL_URL || 'Local');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('');

// Import and run the JWT analysis
require('./analyze-jwt-tokens.js');
