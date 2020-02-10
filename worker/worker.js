'use strict';

// Call the packages we need
const fs       = require('fs');
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// Validation array
var category    = [ 'hotel', 'alternative', 'hostel', 'lodge', 'resort', 'guesthouse' ]

// NATS connection
var uri         = process.env.NATS_URI
const NATS      = require('nats')
const nc        = NATS.connect(uri,{ json: true })

// Configure app to use bodyParser() this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8081;        // set our port

// Routes for API
var router = express.Router();

nc.on('connect', () => {
  nc.on('error', (err) => {
    console.log(err)
  })

  // Subscribe to 'list' to return the accomodation
  nc.subscribe('list', (msg, reply) => {
        let rawdata      = fs.readFileSync('accomodation.json');
        let accomodation = JSON.parse(rawdata);
		nc.publish(reply, accomodation)
  })
  
  // Subscribe to 'create' to create new accomodation
  nc.subscribe('create', (msg, post_reply) => {
	  
			// Validation of Name ,Category and Image url.
            if ( msg.name.includes("Free") || msg.name.includes("Offer") || msg.name.includes("Book") || msg.name.includes("Website")) {
                    console.log('A hotel name cannot contain the words "Free", "Offer", "Book", "Website"');
            }else if ( !(category.indexOf(msg.category) > -1) ){
                    console.log('Category should be from hotel, alternative, hostel, lodge, resort, guesthouse')
            }else if( msg.name === null || msg.name === "null" || msg.name.length < 11 ) {
                    console.log('A hotel name should be longer than 10 characters')
            }else if ( msg.image.match(/\.(jpeg|jpg|gif|png)$/) == null) {
                   console.log('Image URL is not valid')
		    }
			else{
				let new_data = JSON.stringify(msg, null, 2);
				
				// Check if accomodation data already exist & append it exist.
                fs.stat('accomodation.json', function(err, stat) {
                        if(err == null) {
                            console.log('Database file exists');
                            fs.readFile('accomodation.json', function (err, existing_data) {
                                    if(err) console.log('error', err);
                                    var json = JSON.parse(existing_data)
                                    json.push(new_data)

                                    fs.writeFile("accomodation.json", JSON.stringify(json) , (err) => {
                                    if (err) throw err;
									});
                            });
                        }else if(err.code === 'ENOENT') {
                            console.log('Database file does not exists');
                            fs.writeFile('accomodation.json', '[' + new_data + ']', (err) => {
                                if (err) throw err;
								});
                            }else{
									console.log('Some other error: ', err.code);
								 }
                });
			}
        })
})

router.get('/', function(req, res) {
	res.json("Worker");
});

// All of our routes will be prefixed with /api
app.use('/api', router);

// Start the server
// =============================================================================
app.listen(port);
console.log('Worker service started on port ' + port);
