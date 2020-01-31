const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const redis = require('redis');

// use to expose request body in req.body
app.use(bodyParser.json());

// allow cross-origin requests
let allowCrossDomain = function(req, res, next) {
     res.header('Access-Control-Allow-Origin', "*");
     res.header('Access-Control-Allow-Headers', "*");
     next();
   }
app.use(allowCrossDomain);

// create redis client
let client = redis.createClient();

// seed corpus
client.on('connect', function(){
     console.log('Connected to Redis...');
     console.log("Seeding Redis w/ dictionary...")

     var textByLine = fs.readFileSync(__dirname + '/dictionary.txt').toString().split("\n");
     textByLine.forEach(word => {
        let key =  word.split('').sort().join('');
        client.SADD(key, word);
     });

     console.log("Words added to Redis.")
});

app.get('/api/greeting', (req, res) => {
     const name = req.query.name || 'World';
     res.setHeader('Content-Type', 'application/json');
     res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
   });
   


// POST /words
// add a list of words to the corpus
app.post('/words.json', (req, res) => {

     if (req.body.words === undefined) {
          res.status(400).send("No content in request body.")
     }

     if (req.body.words.length == 0) {
          res.status(201).send("No new words: corpus unchanged.")
     }

     let words = req.body.words;

     words.forEach(word => {
          let key =  word.toLowerCase().split('').sort().join('');
          client.SADD(key, word);
     });
     
     res.status(201).send("Word(s) successfully added to corpus.");
     
});


// GET /anagrams/:word
// fetch a list of anagrams for a given word
app.get('/anagrams/:word.json', (req, res) => {
     let word = req.params.word;
     let key =  word.toLowerCase().split('').sort().join('');
     
     // only include proper nouns if specified in the query
     let includeProper = false;
     if (req.query.proper !== undefined) {
          includeProper = true;
     }

     // upper limit on number of anagrams to return
     let limit = req.query.limit || Number.MAX_SAFE_INTEGER; 

     // create return list respecting limit and proper nouns
     client.SMEMBERS(key, function(err,anagrams) {
          if (err) {
               throw err;
          } else {
               let result = [];
               let size = Math.min(limit, anagrams.length);
               let i = 0;
               while (result.length <= size && i < size) {
                    if (anagrams[i] !== word) {
                         if (includeProper) {
                              result.push(anagrams[i]);
                         } else if (anagrams[i][0] === anagrams[i][0].toLowerCase()){ 
                              result.push(anagrams[i]);
                         }
                    }
                    i++;
               }
               res.status(200).send({"anagrams": result});
          }
     });
     
});

// DELETE /words/:word
// delete a single word
app.delete('/words/:word.json', (req, res) => {
     let word = req.params.word;
     let key =  word.toLowerCase().split('').sort().join('');
     client.SMEMBERS(key, function(err,anagrams) {
          if (err) {
               throw err;
          } else {
               if (anagrams.length == 1) {
                    client.DEL(key);
               } else {
                    client.SREM(key, word);    
               }
               res.status(204).send();
          }
     });
});

// DELETE /anagrams/:word
// delete a word and all of its anagrams
app.delete('/anagrams/:word.json', (req, res) => {
     let word = req.params.word;
     let key =  word.toLowerCase().split('').sort().join('');
     client.SMEMBERS(key, function(err,anagrams) {
          if (err) {
               throw err;
          } else {
               client.DEL(key);
               res.status(204).send();
          }
     });
});

// DELETE /words.json
// delete all words
app.delete('/words.json', (req, res) => {
     client.FLUSHALL();
     res.status(204).send();
});

app.listen(port, () => console.log(`Listening on port ${port}...`));

