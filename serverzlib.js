const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const http = require('http');
const zlib = require("zlib");

app.use(express.static(__dirname + '/public'));

// app.use(function (req, res, next) {
//     res.header('Content-Type', 'application/json');
//     next();
// });

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
        let buffer = [];

        http.get(url, function(res) {
            var gunzip = zlib.createGunzip();            
            res.pipe(gunzip);

            gunzip.on('data', function(data) {
                // decompression chunk ready, add it to the buffer
                buffer.push(data.toString())

            }).on("end", function() {
                // response and decompression complete, join the buffer and return
                resolve(null, buffer.join("")); 

            }).on("error", function(e) {
                reject(e);
            })
        }).on('error', function(e) {
            reject(e)
        });
        
    });
}

app.get('/cal', function (req,res) {
    let calID = "hhc1mfvhcajj77n5jcte1gq50s";
    requestCalendar(calID)
      .then(function(GoogleResponse){
        // let fGoogleResponse = {
        //     "sanity": "sanity",
        //     "status": GoogleResponse.statusCode,
        //     "message": GoogleResponse.statusMessage,
        //     "ics": GoogleResponse.body
        // }
        // let json = JSON.stringify(fGoogleResponse);
        // res.send(json);
        res.send(GoogleResponse);
    })
      .catch(function(reason){
        // postman gives 200 OK
        console.log("rejected");
        console.log(reason);
        res.send(reason);
        // res.send(reason);
    });
});

const server = app.listen(port, function () {
    console.log('listening on port 3000')
});
