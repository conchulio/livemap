var fs = require('fs');
var path = require('path');

var csv = require(path.join(__dirname, "csv-loader"));

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

		this.deleteExistingFile = function(cb) {
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

	var generate = function(city) {
		shapesPath = path.join(__dirname, "..", "..", "gtfs",city,"shapes.txt");
		csvw = new CsvWriter(shapesPath);
		csvw.appendLine(['shape_id','shape_pt_lon','shape_pt_lat','shape_pt_sequence']);

		csvw.deleteExistingFile(function(err) {
			csv.load(path.join(__dirname, "..", "..", "gtfs",city,"stop_times.txt"), function(stopTimes) {
				csv.load(path.join(__dirname, "..", "..", "gtfs",city,"stops.txt"), function(stops) {
					dearrayifyStops(stops);
					var currentTrip = stopTimes[0].trip_id;
					var seqNo = 0;
					for (var i in stopTimes) {
						var currentStopTime = stopTimes[i];
						if (stopTimes[i].trip_id != currentTrip) {
							currentTrip = currentStopTime.trip_id;
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
	};

	return {
		generate: generate
	};
})();

module.exports.generate('berlin');