const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const request = require('request');
const ical2json = require('ical2json');

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
    res.header('Content-Type', 'application/json');
    next();
});

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

let setEndDate = (startDate,tSpan) => {

    return startDate;
};

function processData(data, startDate, endDate) {
    let events = data.ics.VCALENDAR.VEVENT;
    
    // convert dates from data to js Dates with Date(Date.utc)
    // function for that

    //-< is or isn't recurring
    //-< is or isn't after start date
    //-< break out recurring ? is before end date
    //-- add to queue
    // convert dates to iso format

    return data;
}

// request takes 3 query params: calid, timespan, startdate, calid is required
app.get('/cal', function (req,res) {
    // let calID = "hhc1mfvhcajj77n5jcte1gq50s";

    let today = new Date();
    let todayStr = today.toISOString();
    let calID = req.query.calid;
    if (!calID) { res.send('please supply calid in query'); }
    let startDate = req.query.startdate ? parseYYYYMMDD(req.query.startdate) : today;
    let timeSpan = req.query.timespan || '4m' ;
    let tSpan = {
        unit: timeSpan.charAt(timeSpan.length-1),
        number: Number(timeSpan.slice(0,timeSpan.length-1))
    };
    let endDate = setEndDate(startDate,tSpan);

    requestCalendar(calID)
      .then(function(GoogleResponse){
        let rawJSONdata = ical2json.convert(GoogleResponse.body);
        let processedData = processData(rawJSONdata);
        let fGoogleResponse = {
            "id": calID,
            "now": todayStr,
            "timespan": timeSpan,
            "startdate": startDate.toISOString(),
            "status": GoogleResponse.statusCode,
            "message": GoogleResponse.statusMessage,
            "ics": processedData
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
