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
    // sanity check
    // let url = "http://www.google.com";
    // let url = "https://www.balbalbakdjfkj.com";

    let url = "http://calendar.google.com/calendar/ical/"+calID+"%40group.calendar.google.com/public/basic.ics";
    // let url = "https://calendar.google.com/calendar/ical/hhc1mfvhcajj77n5jcte1gq50s%40group.calendar.google.com/public/basic.ics";
    
    return new Promise(function(resolve,reject) {
        request({ 
            method: 'GET',
            uri: url,
            gzip: true
        }, function (error, response, body) {
        // body is the decompressed response body
        // console.log('server encoded the data as: ' + (response.headers['content-encoding'] || 'identity'))
        // console.log('the decoded data is: ' + body)
        resolve(response)
        });

    });
}

app.get('/cal', function (req,res) {
    let calID = "hhc1mfvhcajj77n5jcte1gq50s";
    requestCalendar(calID)
      .then(function(GoogleResponse){
        let fGoogleResponse = {
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
