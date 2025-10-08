const express = require('express');
const { client, SQUARE_CONFIG } = require('../square-config');
const router = express.Router();

/**
 * Test Square configuration and authentication
 * GET /api/square/test-config
 */
router.get('/test-config', async (req, res) => {
  try {
    console.log('Testing Square configuration...');

    // Test basic configuration
    const config = {
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasApplicationId: !!process.env.SQUARE_APPLICATION_ID,
      environment: SQUARE_CONFIG.environment,
      baseUrl: SQUARE_CONFIG.baseUrl,
    };

    if (!config.hasAccessToken || !config.hasApplicationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Square credentials',
        config: config,
        instructions: [
          'Add SQUARE_ACCESS_TOKEN to your .env file',
          'Add SQUARE_APPLICATION_ID to your .env file',
          'Restart the server after updating .env',
        ],
      });
    }

    // Test authentication with a simple API call
    try {
      const locationsApi = client.locations;
      const response = await locationsApi.list();

      const locations = response.data || [];

      return res.json({
        success: true,
        message: 'Square configuration is working!',
        config: config,
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          status: loc.status,
          currency: loc.currency,
        })),
        nextSteps:
          locations.length > 0
            ? [
                `Add SQUARE_LOCATION_ID=${locations[0].id} to your .env file`,
                'Restart the server',
                'Test the payment endpoints',
              ]
            : ['No locations found - check your Square account setup'],
      });
    } catch (authError) {
      console.error('Square authentication error:', authError);

      return res.status(401).json({
        success: false,
        error: 'Square authentication failed',
        config: config,
        authError: {
          code: authError.errors?.[0]?.code || 'UNKNOWN',
          category: authError.errors?.[0]?.category || 'UNKNOWN',
          detail: authError.errors?.[0]?.detail || authError.message,
        },
        instructions: [
          '🔧 Your Square access token is invalid or expired',
          '',
          '📋 To fix this:',
          '1. Go to https://developer.squareup.com/console',
          '2. Select your application',
          '3. Click on "Sandbox" environment',
          '4. Go to "Credentials" page',
          '5. Generate a new "Sandbox Access Token"',
          '6. Copy the token and update SQUARE_ACCESS_TOKEN in your .env file',
          '7. Restart the server',
          '',
          '💡 Tip: OAuth access tokens expire after 30 days',
          '💡 For testing, use sandbox access tokens from Developer Console',
        ],
      });
    }
  } catch (error) {
    console.error('Square config test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Square configuration',
      message: error.message,
    });
  }
});

module.exports = router;
