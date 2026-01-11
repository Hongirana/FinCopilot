// const redis = require('redis');

// // Create Redis client
// const client = redis.createClient({
//   socket: {
//     host: 'localhost',  // or '127.0.0.1'
//     port: 6379
//   }
// });

// // Connect
// client.connect()
//   .then(() => {
//     console.log('✅ Connected to Redis!');
//     return client.set('test', 'Hello from Node.js');
//   })
//   .then(() => client.get('test'))
//   .then((value) => {
//     console.log('✅ Value:', value);
//     return client.quit();
//   })
//   .catch((err) => {
//     console.error('❌ Error:', err.message);
//   });


const { isRedisConnected } = require('./src/config/redisClient');

// After server starts
setTimeout(() => {
  console.log('Redis Status:', isRedisConnected() ? '✅ Connected' : '❌ Disconnected');
}, 2000);