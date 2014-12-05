window.onload = function() {

	// 'data' é uma variavel ja definida no outro arquivo javascript. vc precisa manipular essa variavel 'data'.

	var emptyLines = function(data) {
		var emptyLinesData = [];
		var averageEmptyLines = 0;
		data.map(function(data) {
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
			emptyLinesData = emptyLinesData.concat(busesByLine[""]); // empty lines is represented by empty strings
		});
		averageEmptyLines = calculatesAverageNumber(emptyLinesData, data);
		var uniqueLines = removeDuplicatedFromArray(emptyLinesData);
		return {
			"emptyLines": averageEmptyLines,
			"emptyLinesBuses": uniqueLines
		};
	}

	var calculatesAverageNumber = function(array, jsonArray) {
		return parseInt(array.length / (jsonArray.length + 1));
	}

	var removeDuplicatedFromArray = function(array) {
		var uniqueArray = [];
		uniqueArray.push(array[0]);
		$.each(array, function(i, el){
	    // if(el[1] ) uniqueLines.push(el);
	    for (var j = uniqueArray.length - 1; j >= 0; j--) {
	     	if(uniqueArray[j][1] === el[1]) break;
	     	if(j === 0) uniqueArray.push(el);
	    }; 
		});
		return uniqueArray;
	}


	var stopedInArea = function(data, lat, lng, r, minvelocity) {
		var stoped = [];
		minvelocity = minvelocity || 0; // if minvelocity is set, check if bus is at most at this velocity
		var center = new google.maps.LatLng(lat, lng);

		data.map(function(data) {
			var l = data.DATA.length;
			for (var i = l - 1; i >= 0; i--) {
				var bus = data.DATA[i];
				// making use of googles magical function to calculate if point given is inside of circle
				// because lat and lng are not equally spaced (our planet is a (almost) sphere)
				if (google.maps.geometry.spherical.computeDistanceBetween(center, new google.maps.LatLng(bus[3], bus[4])) < r &&
					bus[5] <= minvelocity)
					// stoped.push(bus);
					stoped = stoped.concat([bus]);
			}
		});
		var average = calculatesAverageNumber(stoped, data);
		var uniqueStopped = removeDuplicatedFromArray(stoped);
		return {
			"totalStoped": average,
			"stopedBuses": uniqueStopped,
		};
	}

	// GPS outdated
	function busesWithGPSoutDated(hour, data) {
		var outDatedBuses = [];
		
		data.map(function(data) {
			var buses = data.DATA;

			var dateTimeBoundary = getDateTimeBoundary(hour);
			var bus;

			for (var i = 0; i < buses.length; i++) {
				bus = buses[i];

				if (toDateTime(bus[0]) <= dateTimeBoundary)
					outDatedBuses.push(bus);
			}
		});
		var average = calculatesAverageNumber(outDatedBuses, data);
		var uniqueOutDated = removeDuplicatedFromArray(outDatedBuses);

		return {
			"totalOutDated": average,
			"outDatedBuses": uniqueOutDated,
		};
	}

	function getDateTimeBoundary(hour) {
		var now = new Date();
		var offset = hour * 60 * 60 * 1000;

		return new Date(now.getTime() - offset);
	}

	function toDateTime(dateTimeString) {
		return new Date(dateTimeString);		
	}

	// lines by buses count
	function line_counter_by_bus_range(min_limit, max_limit, data) {
		var output_list = [];
		
		data.map(function(data) {
			var busArray = data["DATA"];
			var bus_lines = [];

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
		});

		// prepare output
		var uniqueLines = [];
		// cant use removeDuplicatedFromArray because it is not a bus array
		$.each(output_list, function(i, el){
		  if($.inArray(el, uniqueLines) === -1) uniqueLines.push(el);
		});
		var output = {
			"number of lines": calculatesAverageNumber(output_list, data),
			"lines": uniqueLines
		};

		return output;
	}


	function buses_in_speed_range(min_speed, max_speed, data, lines) {
		var in_range_buses = [];
		lines = lines || []; // default: no lines to validate
		var skip_line_validator = true;

		// checks if should validate lines
		if (lines.length != 0) {
			skip_line_validator = false;
		}

		data.map(function(data) {
			var busArray = data["DATA"];

			// find buses in speed range
			for (var i = busArray.length - 1; i >= 0; i--) {
				var speed = busArray[i][5];
				if ((speed <= max_speed && speed >= min_speed) // checks speed range
					&& (skip_line_validator || (lines.indexOf( busArray[i][2]) > -1))) // checks whether should validate lines and bus lines array
				{
					in_range_buses.push(busArray[i]);
				}
			}
			console.log(in_range_buses);
		});

		// prepare output
		var output = {
			"number of buses": calculatesAverageNumber(in_range_buses, data),
			"buses": removeDuplicatedFromArray(in_range_buses)
		};

		return output;
	}

	$(document).on('click', '#button', function() {
		var selected = $('input[name="report"]:checked').val();
		var dateNow = $("#dateNow");
		var initialDate = $("#initialDate").val();
		var finalDate = $("#finalDate").val();
		var url;

		if (dateNow.is(":checked") == true) {
			url = "http://rest.riob.us/all?callback=?";
		}
		else {
			url = "http://localhost:3002/api/" + initialDate + "/" + finalDate;
		}

		$.getJSON(url, function(data, status) {
			
			if (dateNow.is(":checked")) {
				data = [data];
			}
			switch (selected) {
				case "empty-lines":
					result = emptyLines(data)
					break;
				case "stopped":
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
			//document.getElementById("resposta").innerHTML = JSON.stringify(result);
			generateTable(result,selected);
		});
	});
}

$(function(){
	$('.checkbox').hide();
	if (window.location.href.indexOf('report') > 0){

	}
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
var t ;
function generateTable(answerArray,report){
	t = answerArray;
	if (answerArray.length > 1){}
	switch (report) {
	case "empty-lines":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.emptyLines == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de ônibus sem linha - ' + answerArray.emptyLines);
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.emptyLinesBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.emptyLinesBuses[i][0]).format('MM/DD/YYYY hh:mm')  + ' </td>');
				linha.append('<td>' + answerArray.emptyLinesBuses[i][1] + ' </td>');
				$('#resposta > table > tbody').append(linha);

			}
			$('#resposta').show();
		}
		break;
	case "stopped":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.totalStoped == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de ônibus sem linha - ' + answerArray.totalStoped);
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.stopedBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.stopedBuses[i][0]).format('MM/DD/YYYY hh:mm')  + ' </td>');
				linha.append('<td>' + answerArray.stopedBuses[i][1] + ' </td>');
				$('#resposta > table > tbody').append(linha);

			}
			$('#resposta').show();
		}
		break;
	case "outdated-gps":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.totalOutDated == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de ônibus atrasados - ' + answerArray.totalOutDated);
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.outDatedBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.outDatedBuses[i][0]).format('MM/DD/YYYY hh:mm')  + ' </td>');
				linha.append('<td>' + answerArray.outDatedBuses[i][1] + ' </td>');
				$('#resposta > table > tbody').append(linha);

			}
			$('#resposta').show();
		}
		break;

	case "line-counter-by-bus":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray['number of lines'] == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de linhas - ' + answerArray['number of lines']);
			$('#resposta > table ').css('width','40%');
			$('#resposta > table > thead').append('<th> Número da Linha </th>');
			for (var i in answerArray.lines){
				var linha = $('<tr>');
				linha.append('<td>' + answerArray.lines[i] + ' </td>');
				$('#resposta > table > tbody').append(linha);
			}
			$('#resposta').show();
		}
		break;

	case "buses-by-speed":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray['number of buses'] == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else { 
			$('#resposta > h2').append('Total de ônibus dentro da faixa de velocidade - ' + answerArray['number of buses']);
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			$('#resposta > table > thead').append('<th> Velocidade Instantânea </th>');

			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('MM/DD/YYYY hh:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
				linha.append('<td>' + answerArray.buses[i][5] + ' Km/h' + ' </td>');

				$('#resposta > table > tbody').append(linha);
			}
			$('#resposta').show();
		}
		break;
	}
}
