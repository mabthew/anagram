var fs = require('fs');
const redis = require('redis');

// Create Redis Client
let client = redis.createClient();

client.on('connect', function(){
  console.log('Connected to Redis...');
  console.log("Adding words Redis...")
    var textByLine = fs.readFileSync('dictionary.txt').toString().split("\n");
    textByLine.forEach(word => {
        let key =  word.split('').sort().join('');
        client.SADD(key, word);
    });
    console.log("Words added to Redis.")
});

