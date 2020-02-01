Anagram Finder
=========

# Description

The Anagram Finder is an API that allows fast searches for anagrams. It uses a text file containing every word in the English dictionary as its resource and allows different search settings such as including/excluding proper nouns, and scrabble mode to find anagrams for all substrings of a given input.

The API exposes the following endpoints: 

- `POST /words.json`: Takes a JSON array of English-language words and adds them to the corpus (data store).
- `GET /anagrams/:word.json`:
  - Returns a JSON array of English-language words that are anagrams of the word passed in the URL.
  - Supports 2 optional query params:
    - limit (int) indicates the maximum number of results to return.
    - proper (bool) determines whether proper nouns should be included in the results.
- `DELETE /words/:word.json`: Deletes a single word from the data store.
- `DELETE /anagrams/:word.json`: Deletes a word *and all of its anagrams*.
- `DELETE /words.json`: Deletes all contents of the data store.

# Running Locally

In order to run this project locally, you must have Redis installed and running (port 6379). [https://redis.io/topics/quickstart] 

Clone the repo and run `npm install`. Once all dependencies have been installed, you're ready to go.

To get everything going, run the command `npm run dev` and you should see the interface running on `http://localhost:3001`.


# Examples

Example (assuming the API is being served on localhost port 3000):

```{bash}
# Adding words to the corpus
$ curl -i -X POST -d '{ "words": ["read", "dear", "dare"] }' http://localhost:3000/words.json
HTTP/1.1 201 Created
...

# Fetching anagrams
$ curl -i http://localhost:3000/anagrams/read.json
HTTP/1.1 200 OK
...
{
  anagrams: [
    "dear",
    "dare"
  ]
}

# Specifying maximum number of anagrams
$ curl -i http://localhost:3000/anagrams/read.json?limit=1
HTTP/1.1 200 OK
...
{
  anagrams: [
    "dare"
  ]
}

# Fetching anagrams including proper nouns
$ curl -i http://localhost:3000/anagrams/read.json?proper
HTTP/1.1 200 OK
...
{
  anagrams: [
    "dare",
    "Dear"
  ]
}

# Delete single word
$ curl -i -X DELETE http://localhost:3000/words/read.json
HTTP/1.1 204 No Content
...

# Delete a word and all of its anagrams
$ curl -i -X DELETE http://localhost:3000/anagrams/:word.json
HTTP/1.1 204 No Content
...

# Delete all words
$ curl -i -X DELETE http://localhost:3000/words.json
HTTP/1.1 204 No Content
...
```

Note that a word is not considered to be its own anagram.

## Implementation details

This API was made using Node.js and Express with a Redis data store on the backend, and React for the frontend. 

### Redis and data structure

I chose to use Redis to store the dictionary for it's performance. Reads and writes are extremely quick because Redis stores all data in RAM. I thought the large size of the corpus (~230,000 words) may be an issue, but performance generally didn't seem to be a problem and the writeup allows for any amount of data to be stored in memory.

Upon running, the corpus is built from `dictionary.txt`. The words are made lower case, split, sorted, and re-joined to create a normalized Redis key that correspond to a set of anagrams. This allows for all anagrams of a given word to be fetched by a universal key. This structure may have contributed to a slight performance struggle in one case that was beyond the scope of the requirements: scrabble mode with many letters (explained below). 

### Scrabble mode

*Scrabble mode* is a setting that is used to find more than just anagrams.  When search mode is set to Scrabble, searching returns anagrams for all possible combinations of substrings. In the future I plan to change the dictionary to the accepted Scrabble dictionary and deploy the app to become a force to be reckoned with in my roommate Scrabble games.

I did note a performance drop off when scrabble mode is turned on and many letters are typed into the search box. This makes sense due to the massive number of operations going on behind the scenes when a large scrabble search is made (finding all combinations of substrings, making many API requests, sorting the results, re-rendering the page). With more time, I would optimize this feature, maybe by altering the initial data structure to be better suited for scrabble search, or by changing the order of those steps in a way that requires less rendering. I'm submitting this knowing that performance drawback, but scrabble mode is outside of the scope of the project so I figure it's better to turn it in now and optimize down the road.

### Frontend

I am far from a React expert, but I'm always looking to learn something new. For this reason I made a simple interface to show the functionality of the API. I probably spent more time than I should've making the Anagram Finder logo, but the page was pretty empty so I wanted to add a little personal touch.

### Looking ahead

I plan to deploy this app to either GCP or AWS in the near future. I wanted to get a working project back quickly so I am sending it over to be run locally, but I am already looking into deploying and will have something once I do a little more research into the various cloud platforms.