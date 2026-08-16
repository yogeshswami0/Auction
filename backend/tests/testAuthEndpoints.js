import fetch from 'node-fetch'; // wait, node-fetch might not be installed. We can use native fetch since Node.js 18+ has native fetch!

const testAuth = async () => {
  const username = `user_${Date.now()}`;
  const email = `${username}@example.com`;
  const password = 'password123';

  console.log(`Testing Registration with username: ${username}...`);

  try {
    const registerRes = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        role: 'Player'
      })
    });

    const registerData = await registerRes.json();
    console.log('Registration Response Status:', registerRes.status);
    console.log('Registration Response Data:', registerData);

    if (registerRes.status === 201) {
      console.log('✓ Registration endpoint works successfully!');
    } else {
      console.log('❌ Registration endpoint failed.');
      process.exit(1);
    }

    console.log('Testing Login...');
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: username,
        password
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response Data:', loginData);

    if (loginRes.status === 200) {
      console.log('✓ Login endpoint works successfully!');
    } else {
      console.log('❌ Login endpoint failed.');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Request failed:', err);
    process.exit(1);
  }
};

testAuth();
