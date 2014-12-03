window.onload = function() {

	// 'data' é uma variavel ja definida no outro arquivo javascript. vc precisa manipular essa variavel 'data'.

	var emptyLines = function(data) {
		var l = data.DATA.length;
		var busesByLine = {};
		for (var i = l - 1; i >= 0; i--) {
			var bus = data.DATA[i];
			var key = ("" + bus[2]).trim(); // trimming whitespaces to normalize keys
			if (busesByLine[key])
				busesByLine[key].push(bus);
			else
				busesByLine[key] = [bus];
		}
		var emptyLinesData = busesByLine[""]; // empty lines is represented by empty strings
		return {
			"emptyLines": emptyLinesData.length,
			"emptyLinesBuses": emptyLinesData
		};
	}


	var stopedInArea = function(data, lat, lng, r, minvelocity) {
		minvelocity = minvelocity || 0; // if minvelocity is set, check if bus is at most at this velocity
		var l = data.DATA.length;
		var center = new google.maps.LatLng(lat, lng);
		var stoped = [];
		for (var i = l - 1; i >= 0; i--) {
			var bus = data.DATA[i];
			// making use of googles magical function to calculate if point given is inside of circle
			// because lat and lng are not equally spaced (our planet is a (almost) sphere)
			if (google.maps.geometry.spherical.computeDistanceBetween(center, new google.maps.LatLng(bus[3], bus[4])) < r &&
				bus[5] <= minvelocity)
				stoped.push(bus);
		}
		return {
			"totalStoped": stoped.length,
			"stopedBuses": stoped,
		};
	}

	// GPS outdated
	function busesWithGPSoutDated(hour, data) {
		var buses = data.DATA;
		var outDatedBuses = [];

		var dateTimeBoundary = getDateTimeBoundary(hour);
		var bus;

		for (var i = 0; i < buses.length; i++) {
			bus = buses[i];

			if (toDateTime(bus[0]) <= dateTimeBoundary)
				outDatedBuses.push(bus);
		}

		return outDatedBuses;
	}

	function getDateTimeBoundary(hour) {
		var now = new Date();
		var offset = hour * 60 * 60 * 1000;

		return new Date(now.getTime() - offset);
	}

	function toDateTime(dateTimeString) {
		var dateBR = dateTimeString.substring(3, 6) + dateTimeString.substring(0, 2) + dateTimeString.substring(5);

		return new Date(Date.parse(dateBR));
	}

	// lines by buses count
	function line_counter_by_bus_range(min_limit, max_limit, data) {
		var busArray = data["DATA"];
		var bus_lines = [];
		var output_list = [];

		// sort each bus to it's respective line
		for (var i = busArray.length - 1; i >= 0; i--) {
			var bus = busArray[i];
			var key = "" + bus[2];
			if (bus_lines[key]) { // if key already exists in data structure.
				bus_lines[key].push(bus); // add this bus to this key (add bus to its respective line).
			} else { // if key doesn't exist.
				bus_lines[key] = [bus]; // instantiate an array in the key with this bus inside it.
			}
		}

		// check if bus line is in bus counter range
		for (var i = bus_lines.length - 1; i >= 0; i--) {
			if (bus_lines[i]) { // check if bus line exists
				var bus_counter = bus_lines[i].length;
				if (bus_counter <= max_limit && bus_counter >= min_limit) {
					output_list.push(i);
				}
			}
		}

		// prepare output
		var output = {
			"number of lines": output_list.length,
			"lines": output_list
		};

		return output;
	}


	function buses_in_speed_range(min_speed, max_speed, data, lines) {

		lines = lines || []; // default: no lines to validate
		var busArray = data["DATA"];
		var in_range_buses = [];
		var skip_line_validator = true;

		// checks if should validate lines
		if (lines.length != 0) {
			skip_line_validator = false;
		}

		// find buses in speed range
		for (var i = busArray.length - 1; i >= 0; i--) {
			var speed = busArray[i][5];
			if ((speed <= max_speed && speed >= min_speed) // checks speed range
				&& (skip_line_validator || (lines.indexOf("" + busArray[i][2]) > -1))) // checks whether should validate lines and bus lines array
			{
				in_range_buses.push(busArray[i]);
			}
		}

		// prepare output
		var output = {
			"number of buses": in_range_buses.length,
			"buses": in_range_buses
		};

		return output;
	}

	function getData() {

	};
	$(document).on('click', '#button', function() {
		var selected = $('input[name="report"]:checked').val();
		$.getJSON('http://192.168.1.128:8080/all?callback=?', function(data, status) {
			switch (selected) {
				case "empty-lines":
					result = emptyLines(data)
					break;
				case "stoped":
					var lat = $('#lat').val(),
						lng = $('#lng').val(),
						r = $('#r').val(),
						minv = $('#minv').val();
					result = stopedInArea(data, lat, lng, r, minv);
					break;
				case "outdated-gps":
					var hour = $('#hour').val();
					result = busesWithGPSoutDated(hour, data);
					break;
				case "line-counter-by-bus":
					var minq = $('#minq').val(),
						maxq = $('#maxq').val();
					result = line_counter_by_bus_range(minq, maxq, data);
					break;
				case "buses-by-speed":
					var mins = $('#mins').val(),
						maxs = $('#maxs').val(),
						lines = $('#lines').val();
					if (lines)
						lines = lines.split(/\s*,\s*/g);
					result = buses_in_speed_range(mins, maxs, data, lines);
					break;
			}
			document.getElementById("resposta").innerHTML = JSON.stringify(result);
		});
	});
}
$(function(){
	$('.checkbox').hide();
	$('ul[role=menu] a').click(function(event) {
		var inputName = $(this).data('input-id');
		showForm(inputName);
		
	});
	$('ul[role=menu] a').first().trigger('click')

})
function showForm(form){
	var formTitle = $('a[data-input-id='+form+']').html();
	$('.dropdown-toggle').html( formTitle + '<span class="caret"/>');
	$('h1').html(formTitle);
	$('[data-form-name]:visible').fadeOut('fast', function() {
		$('[data-form-name='+form+']').fadeIn('fast',function() {
			$('input[value='+form+']').trigger('click')
		});	
	});
}