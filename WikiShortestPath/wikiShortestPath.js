
module.exports = shortestPath;

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

var WebScraper = require('./WebScraper');
var URLObject = WebScraper.URLObject;
var URLStack = WebScraper.URLStack;

//shortestPath('Fire', 'Toothpaste'); // 2 clicks
//shortestPath('Hentai', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Education', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Toothpaste', 'Coefficient'); // 2 clicks
//shortestPath('Atomic Bomb', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Bubble', 'Marilyn Monroe'); // 2 clicks
//shortestPath('Allegory', 'Bill Clinton'); // 3 clicks
//shortestPath('Labour Party (UK)', 'Productivity') // 2 clicks
//shortestPath('Fallout (series)', 'Noam Chomsky'); // 2 clicks
//shortestPath('P versus NP problem', 'Adolf Hitler'); // 2 clicks
//shortestPath('The Last Airbender', 'Somalia'); // 3 clicks
//shortestPath('Dylan', 'Bacon'); // 3 clicks
//shortestPath('Aaron', 'Autism'); // 3 clicks
//shortestPath('BDSM', 'Giraffe'); // 3 clicks

//shortestPath('Tomato', 'Neuschwanstein Castle'); // 3 clicks
//shortestPath('Tomato', 'NATO'); // 2 clicks
//shortestPath('NATO', 'Tomato'); // 2 clicks
//shortestPath('Dylan', 'Fried Chicken'); // 4 clicks
//shortestPath('Pencil', 'Hamburger') // 3 clicks
//shortestPath('Orangutang', 'Amorphism'); // Unknown

//shortestPath('Poland Spring', 'Lint') // Never, 5+ clicks possible

//shortestPath('Commando', 'Tornado'); // 3 clicks
//shortestPath('Hooker', 'Iced tea'); // 4 clicks
//shortestPath('Diner', 'Iced tea'); // 3 clicks
//shortestPath('Northern United States', 'Sweet tea'); // 3 clicks
//shortestPath('United States', 'Deez Nuts (politician)'); // Unknown

//shortestPath('United States', 'MIT');
//shortestPath('Chair', '1000 (number)'); // Unknown
//shortestPath('Ron Rivest', 'Dictatorship of the proletariat'); // 3 clicks
//shortestPath('Shivani', 'Dictatorship of the proletariat'); // 3 clicks
//shortestPath('Space', 'Dole Food Company'); // 3 clicks
//shortestPath('Dictatorship of the proletariat', 'CIA');
//shortestPath('Copyright Directive', 'Serial Killer') // 3 clicks
//shortestPath('MIT', 'Caltech')
//shortestPath('Banana', 'NATO'); // 2 clicks

//shortestPath('Michael', 'Genius');

//shortestPath('Pasteurellosis', 'Sarzeh Shamil') // 4 clicks

//shortestPath('Solitary practitioner', 'List of books banned by governments'); // 3 clicks
//shortestPath('Piperidylthiambutene', 'Cat'); // 2 clicks
//shortestPath('Piperidylthiambutene', 'United Nations Security Council Resolution 2042'); // 4 clicks
//shortestPath('Directional Infrared Counter Measures', 'Thioridazine'); // 3 clicks
//shortestPath('1704 in architecture', '1971 in art'); // 3 clicks

//shortestPath('Promiscuity', 'Chair'); // 3 clicks
//shortestPath('Promiscuity', 'Keyboard'); // 

//shortestPath('My Little Pony: Friendship Is Magic', 'Adolf Hitler'); // 2 clicks
//shortestPath('Postmodernism', 'Cat'); // 2 clicks

//shortestPath('Ryan', 'Genius'); // 4 clicks
//shortestPath('Ryan', 'Idiot'); // 4 clicks

//shortestPath('', 'Idiot');

//shortestPath('Boot camp', 'Highway');

//shortestPath('Donald Trump', 'Misogyny') // Unknown

function shortestPath(start, goal, callback) {
	if (!(start && goal)) {
		if (callback) {
			callback({
				start: start,
				goal: goal,
				success: false,
				elapsed: 0,
				scrapedCount: 0,
				linkCount: 0,
				error: 'Must specify a ' + (!start ? 'start' : '') + (!(start || goal) ? ' and a ' : '') + (!goal ? 'goal' : '')
			});
		}
	}
	else {
		getWikiTitle(start, function(startTitle) {
			start = startTitle;
			getWikiTitle(goal, function(goalTitle) {
				goal = goalTitle;
				run(start, goal, callback);
			});
		});
	}
}

function run(start, goal, callback) {
	var scrapedCount = 0;
	var linksFound = 0;
	var startTime = new Date();
	var goalBody;
	
	WebScraper.scrape(wikiURL(goal), function(url, body) {
		goalBody = body.toLowerCase();
		
		scrapePages(new URLStackLight(wikiURL(start)), filter, 6, function(result) {	
			var elapsed = new Date().getTime() - startTime.getTime();
			if (result.success) {
				console.log();
		    	console.log(result.stack);
		    	console.log();
		    	var startStr = result.stack[0].title;
		    	var indent = startStr.length;
		    	for (var p = 1; p < result.stack.length; p++) {
		    		var str = result.stack[p].title;
		    		if (p === 1) {
		    			console.log(startStr + ' ==> ' + str);
		    		}
		    		else {
		    			var temp = '';
		    			for (var n = 0; n < indent + (p - 1)*2; n++) {
		    				temp += ' ';
		    			}
		    			console.log(temp + ' ==> ' + str);
		    		}
		    	}
		    	console.log();
		    	console.log('Found ' + goal + ' in ' + (result.stack.length - 1) + ' clicks');
		    	console.log();
			}
			else {
				console.log();
				console.log('Scraped ' + scrapedCount + ' sites');
				console.log('Found ' + linksFound + ' links');
				console.log('Failed to find ' + goal);
				console.log();
			}
			console.log(elapsed / 1000 + ' seconds elapsed');
			
			var finalResult;
			if (result.success) {
				finalResult = {
						start: start,
						goal: goal,
						success: result.success,
						elapsed: elapsed,
						scrapedCount: scrapedCount,
						linkCount: linksFound,
						stack: result.stack
				};
			}
			else {
				finalResult = {
						start: start,
						goal: goal,
						success: result.success,
						elapsed: elapsed,
						scrapedCount: scrapedCount,
						linkCount: linksFound
				};
			}
			
			//console.log();
			//console.log(finalResult);
			
			if (callback) {
				callback(finalResult);
			}
		});
		
	});

	function scrapePages(urlStacks, filter, depth, callback) {
		if (depth > 0) {
			var children = [];
			var found = {};
			var result;
			var count = 0;
			WebScraper.scrape(urlStacks, { timeout: 3000 }, function(urlStack, body, next) {
				count++;
				analyzePage(urlStack, body, function(c) {
					if (c.success) {
			    		result = c;
						next(false); // Stops the scraping process
					}
					else {
						if (c.length) {
							for (var j = 0; j < c.length; j++) {
								if (!found[c[j].current.title]) {
									found[c[j].current.title] = 1;
									children.push(c[j]);
								}
							}
							console.log(scrapedCount + '. [L: ' + linksFound + ', C: ' + children.length + ', D: ' + (urlStack.stack.length - 1) + ' (' + count + '/' + (Array.isArray(urlStacks) ? urlStacks.length : 1) + ')] ' + urlStack.current.title);
						}
						next(); // Continues on with scraping
					}
				});
			}, function() {
				if (!result) {
					console.log();
					console.log('Increasing depth');
					children = runHeuristic(children, goalBody);
					scrapePages(children, filter, depth - 1, callback);	
				}
				else {
					callback(result);
				}
			});		
		}
		else {
			if (callback) {
				callback({ success: false });
			}
		}
	}

	function analyzePage(urlStack, body, callback) {
		scrapedCount++;
		if (!body) {
			callback([]);
		}
		else {
		    var $ = cheerio.load(body);
		    var children = [];
		    var anchors = $('div#bodyContent a');
		    linksFound += anchors.length;
		    anchors.each(function() {
		    	var href = $(this).attr('href');
		    	if (href) {
		    		var urlObject = new URLObjectLight(urlStack.current.url, href);
		    		var newStack = new URLStackLight(urlObject, urlStack);
		    		if (!filter || filter(urlObject.url)) {
				    	children.push(newStack);
		    		}
				    if (urlObject.title === goal) {
				    	callback({ success: true, stack: newStack.stack });
				    }
		    	}
		    });
		    callback(children);
		}
	}
}

function runHeuristic(children, body) {
	console.log('Running heuristic on ' + children.length + ' children...');
    var countMap = {};
    var sorted = [];
    for (var i = 0; i < children.length; i++) {
    	var word = children[i].current.title.toLowerCase();
    	if (countMap[word] === undefined) {
	    	var occurrenceCount = countOccurrences(body, word.toLowerCase());
	    	countMap[word] = occurrenceCount;
	    	sorted.push({ stack: children[i], word: word });
    	}
    }
    sorted.sort(function(a, b) {
    	return countMap[b.word] - countMap[a.word];
    });
    children = [];
    for (var i = 0 ; i < sorted.length; i++) {
    	children.push(sorted[i].stack);
    	/*if (countMap[sorted[i].word]) {
    		console.log(countMap[sorted[i].word] + '\t' + sorted[i].word);
    	}*/
    }
    return children;
}

function URLObjectLight(url, href) {
	var urlObject = new URLObject(url, href);
	return {
		url: urlObject.url,
		title: deWikify(urlObject.pathname)
	};
}

function URLStackLight(url, parentStack) {
	if (typeof url === 'string') {
		url = new URLObjectLight(url);
	}
	this.stack = [];
	if (parentStack) {
		for (var i = 0; i < parentStack.stack.length; i++) {
			this.stack.push(parentStack.stack[i]);
		}	
		this.parent = parentStack.current;
	}
	this.stack.push(url);
	this.current = url;
}

function countOccurrences(body, word) {
	return body.split(word).length - 1;
}

function getWikiTitle(str, callback) {
	WebScraper.scrape(wikiURL(str), function(url, body) {
		var $ = cheerio.load(body);
		callback($('#firstHeading').text());
	});
}

function deWikify(str) {
	if (str.length && str[str.length - 1] === '/') {
		str = str.slice(0, -1);
	}
	return unescape(str).replace(/^\/wiki\//, '').replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ');
}

function deWikifyURL(url) {
	return deWikify(pathname(url));
}

function wikiURL(str) {
	return 'https://en.wikipedia.org/wiki/' + (str ? str : '');
}

function pathname(url) {
	var pathname = url.slice(url.slice(url.indexOf('//') + 2).indexOf('/') + url.indexOf('//') + 2);
	pathname = pathname.indexOf('#') !== -1 ? pathname.substr(0, pathname.indexOf('#')) : pathname;
	pathname = pathname.indexOf('?') !== -1 ? pathname.substr(0, pathname.indexOf('?')) : pathname;
	pathname = pathname.match('^.*/$') ? pathname : pathname + '/';
	return pathname;
}

function filter(url) {
	var path = pathname(url);
	if (path.match(':')) {
		return false;
	}
	var end = path.slice(0, -1)
	end = end.slice(end.lastIndexOf('/') + 1);
	//var extensions = ['asp','aspx','axd','asx','asmx','ashx','css','cfm','yaws','swf','html','htm','xhtml','jhtml','jsp','jspx','wss','do','action','js','pl','php','php4','php3','phtml','py','rb','rhtml','xml','rss','svg','cgi','dll'];
	var extensions = [];
	var match = false;
	for (var e = 0; e < extensions.length; e++) {
		if (end.match('\.' + extensions[e] + '$')) {
			match = true;
			break;
		}
	}
	if (!match) {
		if (!end.match('\\.')) {
			match = true;
		}
	}
	return match && url.match('^https://en.wikipedia.org');
}
