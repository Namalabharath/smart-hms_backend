const express = require('express');
const app = express();

console.log('Starting simple server...');

app.get('/', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`✓ Simple server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Error:', err);
});
