#!/usr/bin/env node

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://onezerozeroktrackerbackend.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const module = url.startsWith('https:') ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = module.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: `Failed to parse JSON: ${e.message}`, rawData: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoints() {
  console.log('��� Testing Admin Endpoints\n');

  // Test Local
  console.log('��� LOCAL ENVIRONMENT:');
  try {
    const localResponse = await makeRequest(`${LOCAL_URL}/api/admin/user-stats`);
    if (localResponse.success) {
      console.log(`✅ Total users: ${localResponse.stats.total_users}`);
      console.log(`✅ Active users: ${localResponse.stats.active_users}`);
      console.log(`✅ Invited users: ${localResponse.stats.invited_users}`);
    } else {
      console.log('❌ Local request failed:', localResponse);
    }
  } catch (error) {
    console.log('❌ Local connection error:', error.message);
  }

  console.log('\n��� PRODUCTION ENVIRONMENT:');
  try {
    const prodResponse = await makeRequest(`${PRODUCTION_URL}/api/admin/user-stats`);
    if (prodResponse.success) {
      console.log(`✅ Total users: ${prodResponse.stats.total_users}`);
      console.log(`✅ Active users: ${prodResponse.stats.active_users}`);
      console.log(`✅ Invited users: ${prodResponse.stats.invited_users}`);
    } else {
      console.log('❌ Production request failed:', prodResponse);
    }
  } catch (error) {
    console.log('❌ Production connection error:', error.message);
  }
}

testEndpoints().catch(console.error);
