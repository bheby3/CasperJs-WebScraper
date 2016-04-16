/******************************
 * grab local listings for Macbook pro within a $800 - $1000 price range
 with at least 256 GB of HD space.
 * write it to a local file
 * have a cron job executing it every hour to keep updated on new listings.
 *******************************/

var casper = require('casper').create({
    verbose: true,
    logLevel: 'error',
    pageSettings: {
        loadImages: false,
        loadPlugins: false,
        userAgent: ' Mozilla/5.0 (Macintosh; Intel Mac OS X)'
    },
    clientScripts: ["./jquery.min.js", "./lodash.js"]
});

var fs = require('fs');
/*var x = require('casper').selectXPath;*/

var links = [];
var listingDetails = [];
var notTheMacImLookingFor = [];
var hd256 = [];
var hd500 = [];
var hd750 = [];
var hd1tb = [];
var i = 0;
/*var output = [];*/

///////// get links form page/////////
function getListingLinks() {
    var links = $('.adTitle a');
    return _.map(links, function (e) {
        return e.getAttribute('href');
    });
}

////////// click link, wait, get data, put into array ///////////
function getLinkData(link) {
    casper.open(link).then(function () {
        casper.thenClick('a[href=' + '"' + link + '"' + ']');
        casper.waitForSelector('.productContentText', function () {
            var details = this.fetchText('.productContentText');
            var contactPhone = this.fetchText('.productContactPhone');
            var moreDetails = this.fetchText('.productMoreInfo');
            var combineDetails = contactPhone + " " + details + " " + moreDetails;
            listingDetails.push(combineDetails);
            console.log(listingDetails);
        })
    });
    this.then(function () {
        this.back();
    });
}

///////// Loop through links until i reaches the length of "links" array//////////
function loopThroughLinks() {
    if (i < links.length) {
        this.echo('link #' + i + ': ' + links[i]);
        getLinkData.call(this, links[i]);
        i++;
        this.then(loopThroughLinks);
    }
    else {
        this.echo('done looping');
    }
}

////// call function to get links and loop through links //////////
function linkData() {
    links = this.evaluate(getListingLinks);
    this.then(loopThroughLinks);
}

//////// wait for page to load, call linkData///////
var processPage = function () {
    this.wait(2000, function () {
        this.then(linkData);
    });
};

///////// Enter Website /////////

casper.start('http://www.ksl.com/?nid=13', function () {
    this.echo('on your ksl.com')
});
//////// Wait for page to load ///////
casper.wait(2000, function () {
    this.echo('waiting for ksl to load');
});

//////// Insert Data into Search Form ///////////
casper.then(function () {
    this.echo('filling out your search form');
    this.fill('form.searchForm', {
        'search': 'Macbook pro',
        'zip': '84004',
        'distance': '25',
        'min_price': '800',
        'max_price': '1000'
    }, true);
});

/////// Specify Number of Search Results & Sorting //////
casper.waitForSelector('.listingFeatured', function () {
    console.log('listings are loaded');
    this.fill('form.search_form', {
        'viewNumResults': '48',
        'sort': '1' //sort by newest listings
    }, true);
});

/////// Start processing page //////////
casper.then(processPage);

/////// Sort by hard drive space & add formatting to HTML for viewing ////////
casper.then(function () {
    console.log("sorting");
    function sorter(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (/windows|lenovo|thinkpad|surface pro/gi.test(arr[i])) {
                notTheMacImLookingFor.push(arr[i])
            } else if (/\b[2-4][0-9][0-9]gb|\b[2-4][0-9][0-9] gb|\b[2-4][0-9][0-9]gigabyte|\b[2-4][0-9][0-9]ssd|\b[2-4][0-9][0-9]? ssd/gi.test(arr[i])) {
                hd256.push("<div class='title256'>" + "250-499GB Link #:" + i + '</div>' + "<div class='newListing256'>" + arr[i] + '</div>');
            } else if (/\b[5-6][0-9][0-9]gb|\b[5-6][0-9][0-9] gb|\b[5-6][0-9][0-9]gigabyte|\b[5-6][0-9][0-9]ssd|\b[5-6][0-9][0-9]? ssd/gi.test(arr[i])) {
                hd500.push("<div class='title500'>" + "500-699GB Link #:" + i + '</div>' + "<div class='newListing500'>" + arr[i] + '</div>');
            } else if (/\b[7-9][0-9][0-9]gb|\b[7-9][0-9][0-9] gb|\b[7-9][0-9][0-9]gigabyte|\b[7-9][0-9][0-9]ssd|\b[7-9][0-9][0-9]? ssd/gi.test(arr[i])) {
                hd750.push("<div class='title700'>" + "700-999GB Link #:" + i + '</div>' + "<div class='newListing700'>" + arr[i] + '</div>')
            } else if (/\d+(\.\d{1,2})?tb|\d+(\.\d{1,2})? tb|\dtb\b|\d tb\b|\d+(\.\d{1,2})?terabyte|\d+(\.\d{1,2})? terabyte|\d terabyte\b|\dterabyte\b/gi.test(arr[i])) {
                hd1tb.push("<div class='title1tb'>" + "1TB + Link #:" + i + '</div>' + "<div class='newListing1tb'>" + arr[i] + '</div>');
            }
        }
    }
    sorter(listingDetails);
});

/////////// HTML output //////////
function generateTable() {
    var data;
    return data = " <td>" + hd256 + "</td>\n  <td>" + hd500 + "</td>\n  <td>" + hd750 + "</td>\n  <td>" + hd1tb + "</td>\n";
}

///////// JSON output //////////
/*function outputJSON() {
 /!*output.push({
 // link: links,
 details: listingDetails
 });
 return JSON.stringify(output);*!/
 };*/

/////////// Generate HTML /////////////
casper.run(function () {
    var html;
    html = '<link rel="stylesheet" href="./styles.css">';
    html = html + generateTable();
    html += '</table>';
    fs.write('listing.html', html, 'w');
    this.echo("\n Execution terminated").exit();
    /*var data = outputJSON();
     fs.write('data.json', data, 'w');
     this.echo("\n Execution terminated").exit();*/
});