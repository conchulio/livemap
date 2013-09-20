module.exports = function(db, cb) {
	var Agency = db.define("agency", {
		agency_id: String,
		agency_name: String,
		agency_url: String,
		agency_timezone: String,
		agency_lang: String,
		agency_phone: String,
		agency_fare_url: String
	}, {
    id: 'agency_id'
	});
	var Calendar = db.define("calendar", {
		service_id: String,
		monday: String,
		tuesday: String,
		wednesday: String,
		thursday: String,
		friday: String,
		saturday: String,
		sunday: String,
		start_date: String, // ?
		end_date: String // ?
	}, {
		id: 'calendar_id'
	});
	var Calendar_date = db.define("calendar_date", {
		service_id: String,
		date: String, // ?
		exception_type: String
	}, {
		id: 'calendar_date_id'
	});
	// Berlin uses the attributes commented out here in routes.txt
	var Route = db.define("route", {
		route_id: String,
		agency_id: String,
		route_short_name: String,
		route_long_name: String,
		// route_desc: String,
		route_type: String,
		// route_url: String,
		route_color: String,
		route_text_color: String,
	}, {
		id: 'route_id'
	});
	var Shape = db.define("shape", {
		shape_id: String,
		shape_pt_lon: Number,
		shape_pt_lat: Number,
		shape_pt_sequence: Number
	}, {
		id: 'shape_pk' // Because 'shape_id' is not unique...
	});
	var Stop_time = db.define("stop_time", {
		trip_id: String,
		arrival_time: String, // ?
		departure_time: String, // ?
		stop_id: String,
		stop_sequence: Number,
		stop_headsign: String,
		pickup_type: String,
		drop_off_type: String,
		shape_dist_traveled: String
	}, {
		id: 'stop_time_id'
	});
	var Stop = db.define("stop", {
		stop_id: String,
		stop_code: String,
		stop_name: String,
		stop_desc: String,
		stop_lat: Number,
		stop_lon: Number,
		zone_id: String,
		stop_url: String,
		location_type: String,
		parent_station: String
	}, {
		id: 'stop_id'
	});
	var Transfer = db.define("transfer", {
		from_stop_id: String,
		to_stop_id: String,
		transfer_type: String,
		min_transfer_time: Number,
		from_trip_id: String,
		to_trip_id: String
	}, {
		id: 'transfer_id'
	});
	var Trip = db.define("trip", {
		route_id: String,
		service_id: String,
		trip_id: String,
		trip_headsign: String,
		trip_short_name: String,
		direction_id: String,
		block_id: String,
		shape_id: String
	}, {
		id: 'trip_id'
	});

	return cb();
};