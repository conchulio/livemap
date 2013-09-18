var path = require('path');
var http = require('http');
var fs = require('fs');
var pg = require('pg');

//var nko = require('nko')('R8N+nroFbZPS6D4n');
var express = require('express');
var orm = require('orm');

var dbName = "postgres://postgres@localhost/livemaps";

var gtfsdir = "ulm";
var fullGtfsPath = path.join(__dirname,"gtfs",gtfsdir);
// Create shapes if they don't exist for 'gtfsdir'
if (!fs.existsSync(path.join(__dirname,"gtfs",gtfsdir,"shapes.txt"))) {
  console.log("Didn't find shapes file for this city, creating a new one. This can take a while...");
  require(path.join(__dirname, "lib", "gtfs-parser", "create-shapes")).generate(gtfsdir, connectToDb);
  console.log("Finished creating shapes.")
} else {
  connectToDb();
}

// Connect with ORM to define the scheme
function connectToDb() {
  orm.connect(dbName, function (err, db) {
    if (err) throw err;

    db.load("./models", function(err) {
      var Agency = db.models.agency;
      var Calendar = db.models.calendar;
      var Calendar_date = db.models.calendar_date;
      var Route = db.models.route;
      var Shape = db.models.shape;
      var Stop_time = db.models.stop_time;
      var Stop = db.models.stop;
      var Transfer = db.models.transfer;
      var Trip = db.models.trip;
      db.sync(function (err) {
        if (err) {
          console.log(err);
        }

        // Connect with pg to copy the data from the csvs
        var client = new pg.Client(dbName);
        client.connect(function (err) {
          if (err) {
            return console.error('Could not connect to postgres', err);
          }

          var fileNames = fs.readdirSync(fullGtfsPath);
          fileNames = fileNames.filter(function(d){return d.match(/\.txt$/);})
                               .map(function(d){return {path: path.join(fullGtfsPath, d),
                                                        tableName: d.replace(/s?\.txt$/, "")};});
          checkIfExisting = function(d) {
            var counter = 0;
            var existQuery = "SELECT * FROM "+d.tableName+";";
            client.query(existQuery, function(err, res) {
              // console.log(res);
              if (err) {
                console.error("Error occured when reading from the database, I tried the query "+existQuery, err);
                return;
              }
              console.log('before copying');
              if (res.rowCount === 0) {
                console.log('while copying');
                var copyQuery = "COPY "+d.tableName+" FROM '"+d.path+"' DELIMITER ',' CSV HEADER;";
                client.query(copyQuery, function (err, res) {
                  if (err) {
                    console.log("Path/Table:"+JSON.stringify(d));
                    throw err;
                  }
                  counter += 1;
                  if (counter === fileNames.length) {
                    codeForServer();
                  }
                });
                console.log('after copying');
              } else {
                counter += 1;
              }
            });
          };

          fileNames.map(checkIfExisting);
        });

      });
    });
  });
}

function codeForServer() {
    //var events = require(path.join(__dirname,"lib","event-simulator","event-simulator.js"));
    var gtfsEvents = require(path.join(__dirname,"lib","gtfs-parser","gtfs-timetable-parser.js"));
    var mapDataGenerator = require(path.join(__dirname,"lib","map-data-generator","map-data-generator.js"));
    var PathNormalizer = require(path.join(__dirname,"lib","path-normalizer","path-normalizer.js"));
    var Gtfs = require(path.join(__dirname, "lib", "gtfs-parser", "gtfs-loader"));

    var app = express();

    var server = http.createServer(app)
    var io = require('socket.io').listen(server);

    app.configure(function() {
      app.use(express.static(__dirname + '/public'));
      app.use(express.logger());
      app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
      app.set('views', __dirname + '/views');
      app.engine('.html', require('ejs').__express);
    //  app.register('.html', ejs);
    app.set('view engine', 'html');
  });

    var gtfs = Gtfs(process.env.GTFS_PATH || path.join(__dirname,"gtfs",gtfsdir), function(gtfsData){

      mapDataGenerator.gen(gtfsData, process.env.GTFS_PATH || fullGtfsPath, function(mapData) {

            //calculate normalized shapes
            var pathNormalizer = PathNormalizer(mapData.getShapes());

            console.dir(mapData.getTrips());

            require(path.join(__dirname, '/routes/site'))(app, mapData.getStops(), mapData.getShapes(), mapData.getTrips());

            io.sockets.on('connection', function (socket) {
            });

            /* event simulator, throws an event every 10 secs. */
            gtfsEvents.init(gtfsData, 10000, function(data) {

              var trips = data.trips;

              var pushData = {};

              for (var i in trips){
                if (trips.hasOwnProperty(i)) {
                  var delta = (trips[i].progressThen - trips[i].progressNow) / 10;
                        //console.log(delta);
                        var pointList = [];

                        var shapeId = mapData.getShapeIdFromTripId(i);
                        if (!shapeId) continue;

                        for (var j = 0; j<10; j++) {
                          var idx = Math.floor((trips[i].progressNow + j*delta)*1000);
                          if(idx === 1000 || idx ===0){
                            pointList.push([0,0]);
                          }
                          else {
                            pointList.push(pathNormalizer.getNormalizedPath(shapeId)[idx]);
                          }
                        }
                        pushData[i] = pointList;
                      }
                    }

                /*
                var p = Math.floor(step.progress * 10);

                step['pointList'] = [];
                step['foo'] = p;
                for(var i = 0;i<10;i++){
                    step['pointList'].push(pathNormalizer.getNormalizedPath("87001")[p+i]);

                }
                */
                io.sockets.emit('event', pushData);
              });

server.listen(process.env.PORT || 3000);
            //var appServer = app.listen(parseInt(process.env.PORT) || 3000);
            console.log('Listening on ' + server.address().port);

          });


});
}