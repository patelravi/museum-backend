require('./config')

// Initialize express app
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require("cors")({
    origin: true,
    credentials: true
}));

// Register routes
app.use('/', require('./routes/open.routes'));

let port = process.env.PORT || 7071;
app.listen(port);

console.log('server environment ==>', process.env.NODE_ENV);
console.log('server started at ==>', port);
