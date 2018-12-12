const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const request = require('request');
const ical2json = require('ical2json');
const ipfilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;
const rrulestr = require('rrule').rrulestr;
const CALMAKER = require('./calMaker');

app.use(express.static(__dirname + '/public'));

// Whitelist the following IPs
var ips = ['127.0.0.1'];
app.use(ipfilter(ips, {mode: 'allow'}));

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    console.log('Error handler', err);
    if(err instanceof IpDeniedError){
      res.status(401);
    }else{
      res.status(err.status || 500);
    }

    res.render('error', {
      message: 'You shall not pass',
      error: err
    });
    next();
  });
}

// // not sure this is necessary
// app.use(function (req, res, next) {
//     res.header('Content-Type', 'application/json');
//     next();
// });

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

function requestCalendar (calID) {

    let url = "http://calendar.google.com/calendar/ical/"+calID+"%40group.calendar.google.com/public/basic.ics";
    
    return new Promise(function(resolve,reject) {
        request({ 
            method: 'GET',
            uri: url,
            gzip: true
        }, function (error, response, body) {
        resolve(response)
        });
    });
}

let prependZero = (numStr) => {
    return numStr<10 ? '0'+String(numStr) : String(numStr);
};

let parseYYYYMMDD = (yyyymmdd) => {
    let y = yyyymmdd.slice(0,4);
    let m = yyyymmdd.slice(4,6);
    let d = yyyymmdd.slice(6);
    let date = new Date(Date.UTC(y,m,d));
    return date;
}

// let setLatestDateFilter = (earliestdatefilter,tSpan) => {
//     // not implemented
//     // tSpan is obj with properties 'unit' and 'number'  like '4M'
//     return earliestdatefilter;
// };

let extractRRULEobj = (rrule, eventdate) => {
    let rruleObj = rrulestr(`${eventdate}\n${rrule}`);
    return rruleObj;
};

let currItemsRRextracted = (items, eventdate) => {
    let rrextracted = items.map( (item) => {
        if (item.RRULE) {
            item.RRULE = extractRRULE(item.RRULE, eventdate);
        }
        return item;
    })
    return rrextracted;
};

let filterByEarliest = (veventData, earliestdatefilter, now, latestdatefilter, returnCount) => {
    // console.log(items, "in fd");
    let currItems = veventData.filter( (item) => {
        if(!item.RRULE && earliestdatefilter<=now) {
            return false;
        } else {
            return true;
        }
    });
    return currItems;
};  // end filterByEarliest

let processData = (JSONdata) => {
    let items = JSONdata.VCALENDAR[0].VEVENT; // should be array
    //filter by earliest
    //extrapolate from rrrules
    //set up buckets by # limit
    //return first bucket
    let newVeventList = filterByEarliest(items);
    JSONdata.VCALENDAR[0].VEVENT = newVeventList;
    return JSONdata;
};

// http://127.0.0.1:3000/cal?calid=hhc1mfvhcajj77n5jcte1gq50s

// request takes 4 query params: calid(required), earliestdatefilter (default today), 
// timespan (default '4m'), countlimit * not yet implemented
app.get('/cal', function (req,res) {
    // let calID = "hhc1mfvhcajj77n5jcte1gq50s";

    let today = new Date();
    let todayStr = today.toISOString();
    let calID = req.query.calid;

    if (!calID) { res.send('please supply calid in query'); }

    let earliestdatefilter = req.query.earliestdatefilter ? parseYYYYMMDD(req.query.earliestdatefilter) : today;
    let timeSpan = req.query.timespan || '4m' ;
    let tSpan = {
        unit: timeSpan.charAt(timeSpan.length-1),
        number: Number(timeSpan.slice(0,timeSpan.length-1))
    };
    // let latestdatefilter = setLatestDateFilter(earliestdatefilter,tSpan);

    requestCalendar(calID)

      .then(function(GoogleResponse){
        let rawJSONdata = ical2json.convert(GoogleResponse.body);
        let processedJSONdata = CALMAKER.processData(rawJSONdata);
        let fGoogleResponse = {
            "id": calID,
            "now": todayStr,
            "timespan": tSpan,
            "earliestdatefilter": earliestdatefilter.toISOString(),
            "status": GoogleResponse.statusCode,
            "message": GoogleResponse.statusMessage,
            "calData": processedJSONdata
        }
        let json = JSON.stringify(fGoogleResponse);
        res.send(json);
    })
      .catch(function(reason){
        console.log(reason);
        res.send(reason);
    });
});

const server = app.listen(port, function () {
    console.log('listening on port 3000')
});
