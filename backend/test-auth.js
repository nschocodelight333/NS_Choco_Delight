const mongoose = require('mongoose');
const password = '31Kgcv5ElAZfPF66';
const cluster = 'cluster0.aio16sr.mongodb.net';
const usernames = ['sksha', 'admin', 'root', 'chaco', 'delight', 'chaco-delight', 'ns_chaco_delight', 'user', 'test', 'sksharma'];

async function testAuth() {
  for (const user of usernames) {
    const uri = 'mongodb+srv://' + user + ':' + password + '@' + cluster + '/choco-delight?retryWrites=true&w=majority&appName=Cluster0';
    try {
      console.log('Testing:', user);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ SUCCESS WITH USERNAME:', user);
      process.exit(0);
    } catch (e) {
      console.log('❌ Failed:', user);
    }
  }
  console.log('All guesses failed.');
  process.exit(1);
}

testAuth();
