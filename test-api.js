const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

(async () => {
  try {
    console.log('Logging in as dr_rajesh...');
    const login = await request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'dr_rajesh', password: 'Doctor@123' });
    console.log('LOGIN STATUS:', login.statusCode);
    console.log('LOGIN BODY:', login.body);

    const token = login.body && login.body.token;
    if (!token) {
      console.error('No token returned from login. Aborting.');
      process.exit(1);
    }

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nCalling /api/dashboard-summary');
    const dash = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard-summary', method: 'GET', headers });
    console.log('DASHBOARD SUMMARY STATUS:', dash.statusCode);
    console.log('DASHBOARD SUMMARY BODY:', dash.body);

    console.log('\nCalling /api/doctor/my-patients');
    const myp = await request({ hostname: 'localhost', port: 5000, path: '/api/doctor/my-patients', method: 'GET', headers });
    console.log('MY PATIENTS STATUS:', myp.statusCode);
    console.log('MY PATIENTS BODY:', myp.body);

    console.log('\nCalling /api/doctor/appointments');
    const appts = await request({ hostname: 'localhost', port: 5000, path: '/api/doctor/appointments', method: 'GET', headers });
    console.log('APPOINTMENTS STATUS:', appts.statusCode);
    console.log('APPOINTMENTS BODY:', appts.body);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  }
})();
