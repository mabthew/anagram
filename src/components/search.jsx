import React, { Component } from 'react'
import './search.css';

var http = require("http");

export default class Search extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
          anagrams: [],
          value: '',
          selectedMode: 'strict',
          searchModes: [],
          selectedLimit: 'unlimited',
          limitValues: []
        };

        this.handleChange = this.handleChange.bind(this);
        this.fetchAnagrams = this.fetchAnagrams.bind(this);
        this.buildQuery = this.buildQuery.bind(this);
        this.getWords = this.getWords.bind(this);
        this.addToCurrentAnagrams = this.addToCurrentAnagrams.bind(this);
    }

    // update page with anagrams whenever text input is changed
    handleChange (e) {
        this.fetchAnagrams(e.target.value);
        this.setState({value: e.target.value});
    }

    // determine query elements for request
    buildQuery() {
        let query = "";

        if (this.state.selectedMode === "proper") {
            query = "?proper";
        } else if (this.state.selectedMode === "scrabble") {
            query = "?scrabble";
        }

        if (this.state.selectedLimit !== "unlimited") {
            if (query === "") {
                query = "?limit=" + this.state.selectedLimit;
            } else {
                query += "&limit=" + this.state.selectedLimit;
            }
        }
        return query;
    }

    // get array of words to fetch anagrams for
    getWords(word) {
        if (this.state.selectedMode !== "scrabble") {
            return [word];
        }
        
        let words = substrings(word);
        return words;
    }

    // union set of current and new anagrams
    addToCurrentAnagrams(additions) {
        let wordSet = new Set();

        let size = Number.MAX_VALUE;
        if (this.state.selectedLimit !== "unlimited") {
            size = this.state.selectedLimit;
        }

        for (let i = 0; i < this.state.anagrams.length && wordSet.size < size; i++) {
            wordSet.add(this.state.anagrams[i]);
        }
        for (let i = 0; i < additions.length && wordSet.size < size; i++) {
            wordSet.add(additions[i]);
        }

        let anagrams = Array.from(wordSet);
        console.log(anagrams);
        // sort by length then alphabetically
        anagrams.sort(function(a, b){return a.length - b.length ||  a.localeCompare(b);   });

        this.setState({anagrams});
    }

    // request list of anagrams
    fetchAnagrams(word) {
        if (word ==='' || word.length === 1) {
            this.setState({anagrams: []});
            return;
        }

        let query = this.buildQuery();
        let words = this.getWords(word);

        let anagrams = [];
        this.setState({anagrams})

        for (let i = 0; i < words.length; i++) {
            let url = 'http://localhost:3000/anagrams/' + words[i] + '.json' + query;
            console.log(url);

            // request
            http.get(url, (res) => {
                const { statusCode } = res;
                const contentType = res.headers['content-type'];
                
                // validate respose
                let error;
                if (statusCode !== 200) {
                    error = new Error('Request Failed.\n' +
                                    `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' +
                                    `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.error(error.message);
                    // consume response data to free up memory
                    res.resume();
                    return;
                }
    
                res.setEncoding('utf8');
                let rawData = '';
                
                res.on('data', (chunk) => { rawData += chunk; });

                // parse response and update current anagrams
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        console.log(parsedData);
                        this.addToCurrentAnagrams(parsedData["anagrams"]);        
                        
                    } catch (e) {
                        console.error(e.message);
                    }
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
            });
        }
        
    }

    componentDidMount() {
        this.populateDropdown();
    }

    populateDropdown() {
        // dropdown values for different search modes
        let searchModes = []
        searchModes.push({value: 'strict', display: 'Strict'});
        searchModes.push({value: "proper", display: "Proper"})
        searchModes.push({value: 'scrabble', display: 'Scrabble'});

        // dropdown values for result limits
        let range = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'unlimited'];
        let limitValues = [];
        range.map(v => {
            limitValues.push({values: v, display: v});
        });
        this.setState({ searchModes, limitValues });
    }

    // update search mode
    changeMode(mode) {
        this.setState({selectedMode: mode},
            () => this.fetchAnagrams(this.state.value)
        );
    }

    // update result limit
    changeLimit(newLimit) {
        this.setState({selectedLimit: newLimit},
            () => this.fetchAnagrams(this.state.value)
        );
    }
      
    render() {
        return (
            <div>
                <div  id="img-container" style={{backgroundImage: 'url(images/logo.png', backgroundRepeat: "no-repeat", backgroundPositionX: "-5%"}}>
                    <div id="header"><h1>Welcome to the Anagram Finder!</h1></div>
                    <div className="row" style={{height: "45vh"}}>
                    <div className="column-thin">
                    </div>
                    <div className="column-wide" id="info" style={{fontSize: "large", textAlign: "left", paddingLeft: "10px", paddingTop: "15px"}}>
                        <p>
                            An anagram is a word, phrase, or name formed by rearranging the letters of another, such as <i>cinema</i>, formed from <i>iceman</i>.
                        </p>
                        <div>
                            This app allows for 3 different types of searches: <br/><br/>
                            <ul id="about">
                                <li>
                                    <strong>Strict</strong> will return words that match exactly the provided letters.
                                </li>
                                <li>
                                    <strong>Proper</strong> will return the same list as strict as well as proper nouns.
                                </li>
                                <li>
                                    <strong>Scrabble</strong> will return words that are an anagram of any subset of the provided letters.
                                </li>
                                
                            </ul>
                        </div>
                        
                    </div>
                    </div>
                </div>

                <div >
                    <div className="dropdown">
                        Search mode: 	&nbsp;
                        <select selected={this.state.selectedMode} onChange={(e) => this.changeMode(e.target.value)}>
                            {this.state.searchModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.display}</option>)}
                        </select>
                        &nbsp;&nbsp;&nbsp;&nbsp;

                        Result limit: 	&nbsp;
                        <select value={this.state.selectedLimit} onChange={(e) => this.changeLimit(e.target.value)}>
                            {this.state.limitValues.map((limit) => <option key={limit.value} value={limit.value}>{limit.display}</option>)}
                        </select>
                        </div>
                    <div>
                        <form onSubmit={() => this.fetchAnagrams(this.state.value)} id="search" autoComplete="off">
                            <label>Enter a word:</label>
                            <input type="text" name="name" placeholder={this.state.value} onChange={this.handleChange}/>    
                        </form>
                    </div>

                    <div>
                        <ul>
                            {this.state.anagrams.map((item, i) => {
                                return <li className="results">{item}</li>;
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}

// generate all combinations of substrings
function substrings(str1) {
    let result = [];
    let arr = [];

    for (let x = 0, y=1; x < str1.length; x++,y++) {
      arr[x] = str1.substring(x, y);
    }
    let temp= "";
    let slent = Math.pow(2, arr.length);
  
    for (let i = 0; i < slent ; i++) {
      temp= "";
      for (let j = 0; j < arr.length; j++) {
        if ((i & Math.pow(2,j))){ 
            temp += arr[j];
        }
      }
      if (temp !== "" && temp.length > 1) {
          result.push(temp);
      }
    }
    return result;
}
  