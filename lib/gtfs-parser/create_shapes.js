var fs = require('fs');
var path = require('path');

var csv = require(path.join(__dirname, "csv-loader"));

var EXPERIMENTAL_PATH = path.join(__dirname, "shapes_test.txt");

module.exports = (function() {
	var dearrayifiedStops = {};
	var dearrayifyStops = function(stops) {
		for (var i in stops) {
			cs = stops[i];
			dearrayifiedStops[cs.stop_id] = 
			{
				stop_code: cs.stop_code,
				stop_name: cs.stop_name,
				location_type: cs.location_type,
				parent_station: cs.parent_station,
				stop_lon: cs.stop_lon,
				stop_lat: cs.stop_lat
			};
		}
	}

	var CsvWriter = function(path) {
		this.path = path;
		this.dataToWrite = "";

		this.delteExistingFile = function(cb) {
			fs.unlink(this.path, cb);
		}

		this.appendLine = function(line) {
			this.dataToWrite += (line.join()+"\n");
		};
		this.flush = function(cb) {
			fs.writeFile(this.path, 
			             this.dataToWrite,
			             cb);
		};
	}

	var generate = function(path, city) {
		csvw = new CsvWriter(path);
		csvw.appendLine(['shape_id','shape_pt_lon','shape_pt_lat','shape_pt_sequence']);

		csvw.delteExistingFile(function(err) {
			csv.load(path.join(__dirname, "..", "..", "gtfs","city","stop_times.txt"), function(stopTimes) {
				csv.load(path.join(__dirname, "..", "..", "gtfs","city","stops.txt"), function(stops) {
					dearrayifyStops(stops);
					csv.load(path.join(__dirname, "..", "..", "gtfs","city","trips.txt"), function(trips) {
						var currentTrip = stopTimes[0].trip_id;
						var seqNo = 1;
						for (var i in stopTimes) {
							var currentStopTime = stopTimes[i];
							if (stopTimes[i].trip_id != currentTrip) {
								currentTrip = stopTimes[i].trip_id;
								seqNo = 1;
							} else {
								seqNo += 1;
							}
							// Append station's coordinates to shapes. Also add pt_counter
							// Finally simplify the whole file.
							var currentStop = dearrayifiedStops[currentStopTime.stop_id];
							csvw.appendLine([currentTrip,
							                currentStop.stop_lon,
							                currentStop.stop_lat,
							                seqNo]);
						}

						csvw.flush();
					});
				});
			});
		});
	};

	return {
		generate: generate
	};
})();