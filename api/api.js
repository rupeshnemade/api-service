'use strict';

// Call the packages we need
const fs       = require('fs');
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

var uri        = process.env.NATS_URI
const NATS     = require('nats')
const nc       = NATS.connect(uri,{ json: true })


// Configure app to use bodyParser() this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// Routes for API
var router = express.Router();

// Publish 'list' event to worker service
router.get('/', function(req, res) {
    nc.request('list', (msg) => {
                res.json(msg);
			})
});

// Publish 'create' event to worker service
router.route('/create').post(function(req, res) {
    res.json({ message: 'Your accomodation create request is received' });
    nc.publish('create', req.body)
});


// All of our routes will be prefixed with /api
app.use('/api', router);

// Start the server
// =============================================================================
app.listen(port);
console.log('Worker service started on port ' + port);
