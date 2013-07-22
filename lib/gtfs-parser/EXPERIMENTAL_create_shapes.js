var fs = require('fs');
var path = require('path');

var csv = require(path.join(__dirname, "csv-loader"));

var EXPERIMENTAL_PATH = path.join(__dirname, "shapes_test.txt");

var dearrayifiedStops = {};
var dearrayifyStops = function(stops) {
	for (var i in stops) {
		cs = stops[i];
		dearrayifiyStops[cs.stop_id] = 
		{
			stop_code: cs.stop_code,
			stop_name: cs.stop_name,
			location_type: cs.location_type,
			parent_station: cs.parent_station,
			stop_lon: cs.stop_lon,
			stop_lat: cs.stopsstop_lat
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
		this.dataToWrite += ("\n"+line.join());
	};
	this.flush = function(cb) {
		fs.writeFile(this.path, 
		             "\n"+this.dataToWrite
		             cb);
	};
}

csv = new CsvWriter(EXPERIMENTAL_PATH);
csv = appendLine(['shape_id','shape_pt_lon','shape_pt_lat','shape_pt_sequence']);

csv.delteExistingFile(function(err) {
	csv.load(path.join(__dirname, "..", "..", "gtfs","ulm","stop_times.txt"), function(stopTimes) {
		csv.load(path.join(__dirname, "..", "..", "gtfs","ulm","stops.txt"), function(stops) {
			dearrayifyStops();
			csv.load(path.join(__dirname, "..", "..", "gtfs","ulm","trips.txt"), function(trips) {
				var currentTrip = stopTimes[0].trip_id;
				var seqNo = 1;
				for (var i in stopTimes) {
					if (stopTimes[i].trip_id != currentTrip) {
						currentTrip = stopTimes[i].trip_id;
						seqNo = 1;
					} else {
						seqNo += 1;
					}
					// Append station's coordinates to shapes. Also add pt_counter
					// Finally simplify the whole file.
					csv.appendLine([currentTrip,
					                ]);
				}
			});
		});
	});
});