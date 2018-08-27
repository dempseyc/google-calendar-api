const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const request = require('request');

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

// request takes 3 query params: calid, timespan, startdate, calid is required
app.get('/cal', function (req,res) {

    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    // let calID = "hhc1mfvhcajj77n5jcte1gq50s";
    let calID = req.query.calid;

    if (!calID) { res.send('please supply calid in query'); }

    let timeSpan = req.query.timespan || '4m' ;
    let startDate = req.query.startdate || date ;
    requestCalendar(calID)
      .then(function(GoogleResponse){
        let fGoogleResponse = {
            "id": calID,
            "timespan": timeSpan,
            "startdate": startDate,
            "status": GoogleResponse.statusCode,
            "message": GoogleResponse.statusMessage,
            "ics": GoogleResponse.body
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
