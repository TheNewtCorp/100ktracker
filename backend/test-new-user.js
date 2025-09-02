const axios = require('axios');

async function testNewUser() {
  try {
    // Register a new user
    console.log('Registering test user...');
    const registerResponse = await axios.post('http://localhost:4000/api/register', {
      username: 'testuser',
      password: 'testpass123'
    });
    
    console.log('Registration response:', registerResponse.data);
    
    // Login with the new user
    console.log('\nLogging in with test user...');
    const loginResponse = await axios.post('http://localhost:4000/api/login', {
      username: 'testuser',
      password: 'testpass123'
    });
    
    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Check user's data
    console.log('\nChecking test user data...');
    
    // Check watches
    const watchesResponse = await axios.get('http://localhost:4000/api/watches', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Watches count:', watchesResponse.data.watches.length);
    console.log('Watches:', watchesResponse.data.watches);
    
    // Check contacts
    const contactsResponse = await axios.get('http://localhost:4000/api/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Contacts count:', contactsResponse.data.contacts.length);
    console.log('Contacts:', contactsResponse.data.contacts);
    
    // Check leads
    const leadsResponse = await axios.get('http://localhost:4000/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Leads count:', leadsResponse.data.leads.length);
    console.log('Leads:', leadsResponse.data.leads);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testNewUser();
