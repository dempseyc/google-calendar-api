const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const http = require('http');

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
    res.header('Content-Type', 'application/json');
    next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

let data = {
    alal: "00112244DD",
    jdjd: "99338855CC"
};

let json = JSON.stringify(data);

app.get('/crazy', function (req, res) {
    res.send(json);
});


function requestCalendar (calID) {
    return new Promise(function(resolve,reject) {
        http.get("http://www.google.com/index.html", function(res) {
            resolve(res);
        });
    });
}

app.get('/cal', function (req,res) {
    let calID = "022";
    requestCalendar(calID)
    .then(function(data){
        let fdata = {
            "status": data.statusCode,
            "message": data.statusMessage
        }
        let json = JSON.stringify(fdata);
        res.send(json);
    })
    .catch(function(reason){
        res.send(reason);
    });
});

const server = app.listen(port, function () {
    console.log('listening on port 3000')
});
