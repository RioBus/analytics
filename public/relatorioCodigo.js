window.onload = function() {

	// 'data' é uma variavel ja definida no outro arquivo javascript. vc precisa manipular essa variavel 'data'.

	// remove empty jsons of data
	var analysesData = function(data) {
		var newData = [];
		data.map(function(data) {
			if(JSON.stringify(data) != "{}") {
				newData.push(data);
			}
		});
		return newData;
	}

	var emptyLines = function(data) {
		data = analysesData(data);
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
		var averageEmptyLinesPercentual = calculatesAveragePercentual(emptyLinesData, data);
		averageEmptyLines = calculatesAverageNumber(emptyLinesData, data);
		var uniqueLines = removeDuplicatedFromArray(emptyLinesData);
		return {
			"emptyLines": averageEmptyLines,
			"emptyLinesBuses": uniqueLines,
			"numberOfJsonsInData": data.length,
			"percentual": averageEmptyLinesPercentual
		};
	}

	var calculatesAverageNumber = function(array, jsonArray) {
		return parseInt(array.length / (jsonArray.length));
	}

	var calculatesAveragePercentual = function(array, jsonArray) {
		var totalCounter = 0;
		jsonArray.map(function(data) {
			totalCounter += data.DATA.length;
		});
		return parseFloat(((array.length / totalCounter) / jsonArray.length) * 100).toFixed(2);
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
		data = analysesData(data);
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
		var averagePercentual = calculatesAveragePercentual(stoped, data);
		return {
			"totalStoped": average,
			"stopedBuses": uniqueStopped,
			"numberOfJsonsInData": data.length,
			"percentual": averagePercentual
		};
	}

	// GPS outdated
	function busesWithGPSoutDated(hour, data) {
		data = analysesData(data);
		var outDatedBuses = [];
		
		data.map(function(data) {
			var buses = data.DATA;

			var dateTimeBoundary = getDateTimeBoundary(hour, data.LASTUPDATE);
			var bus;

			for (var i = 0; i < buses.length; i++) {
				bus = buses[i];

				if (toDateTime(bus[0]) <= dateTimeBoundary)
					outDatedBuses.push(bus);
			}
		});
		var average = calculatesAverageNumber(outDatedBuses, data);
		var uniqueOutDated = removeDuplicatedFromArray(outDatedBuses);
		var averagePercentual = calculatesAveragePercentual(outDatedBuses, data);

		return {
			"totalOutDated": average,
			"outDatedBuses": uniqueOutDated,
			"numberOfJsonsInData": data.length,
			"percentual": averagePercentual
		};
	}

	function getDateTimeBoundary(hour, lastUpdate) {
		if(typeof lastUpdate == 'undefined') {
			lastUpdate = new Date();
		} else {
			lastUpdate = toDateTime(lastUpdate);
		}
		var now = lastUpdate;
		var offset = hour * 60 * 60 * 1000;

		return new Date(now.getTime() - offset);
	}

	function toDateTime(dateTimeString) {
		return new Date(dateTimeString);		
	}

	// lines by buses count
	function lineCounterByBusRange(min_limit, max_limit, data) {
		data = analysesData(data);
		var output_list = [];
		var allLines = [];
		
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

					allLines.push(i);
				}
			}
		});

		// prepare output
		var uniqueLines = [];
		// cant use removeDuplicatedFromArray because it is not a bus array
		$.each(output_list, function(i, el){
		  if($.inArray(el, uniqueLines) === -1) uniqueLines.push(el);
		});
		var uniqueAllLines = [];
		$.each(allLines, function(i, el){
		  if($.inArray(el, uniqueAllLines) === -1) uniqueAllLines.push(el);
		});

		var percentual = parseFloat((uniqueLines.length / uniqueAllLines.length) * 100).toFixed(2);
		var output = {
			"numberOfLines": calculatesAverageNumber(output_list, data),
			"lines": uniqueLines,
			"numberOfJsonsInData": data.length,
			"percentual": percentual
		};

		return output;
	}


	function busesInSpeedRange(min_speed, max_speed, data, lines) {
		data = analysesData(data);
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
		});

		// prepare output
		var output = {
			"numberOfBuses": calculatesAverageNumber(in_range_buses, data),
			"buses": removeDuplicatedFromArray(in_range_buses),
			"numberOfJsonsInData": data.length,
			"percentual": calculatesAveragePercentual(in_range_buses, data)
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
			//converting to correct format, from datetime input, using moment js
			if (initialDate.length == 0 && finalDate.length == 0 ){
				alert("Por favor, preencha as datas, ou marque a opção 'Obter dados em tempo real'. ")

			}
			else {
				initialDate = moment(initialDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
				finalDate = moment(finalDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
				url = "http://localhost:3002/api/" + initialDate + "/" + finalDate + "?callback=?";
			}
		}

		$.getJSON(url, function(data, status) {			
			if (dateNow.is(":checked")) {
				data = [data];
				if(toDateTime(data[0].LASTUPDATE) < getDateTimeBoundary(1)) {
					$('#dataRioOut').append(data[0].LASTUPDATE);
					$('#dataRioOut').show();
				} else{
					$('#dataRioOut').hide();
				}
			} else {
				$('#dataRioOut').hide();
			}
			switch (selected) {
				case "empty-lines":
				console.log(data);
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
					result = lineCounterByBusRange(minq, maxq, data);
					break;
				case "buses-by-speed":
					var mins = $('#mins').val(),
						maxs = $('#maxs').val(),
						lines = $('#lines').val();
					if (lines)
						lines = lines.split(/\s*,\s*/g);
					result = busesInSpeedRange(mins, maxs, data, lines);
					break;
			}
			generateTable(result,selected);
		});
	});
}

$(function(){
	$('.checkbox').hide();

	$('ul[role=menu] a').click(function(event) {
		//When the user clicks on a report, the page animates and show related fields
		var inputName = $(this).data('input-id');
		showForm(inputName);
	});

	$('ul[role=menu] a').first().trigger('click');

	 //generating datetimepicker for initialDate and finalDate
	$('[id*=Date]').datetimepicker({
		useMinutes: false,
    	useSeconds: false
	});

	$("#initialDate").on("dp.change",function (e) {
		//The final date must have as minimun value the initial date
       $('#finalDate').data("DateTimePicker").setMinDate(e.date);
    });
	// when the page loads, the initial and final date must be disabled
	$('[id*=Date]').prop('disabled', true);

	$('#dateNow').on('change',function(event) {
		event.preventDefault();
		//when the dateNow checkbox changes, the fields become available or no
		$('[id*=Date]').prop('disabled', $(this).prop('checked') );
	});
})
function showForm(form){
	//Making fade transition to hide previous report and show the other
	var formTitle = $('a[data-input-id='+form+']').html();
	$('.dropdown-toggle').html( formTitle + '<span class="caret"/>');
	$('h1').html(formTitle);
	$('[data-form-name]:visible').fadeOut('fast', function() {
		$('[data-form-name='+form+']').fadeIn('fast',function() {
			$('input[value='+form+']').trigger('click')
		});
	});
}

function generateTable(answerArray,report){
	//placing server's answer on a better format for the user...
	if (answerArray.length > 1){}
		$('#dados-analisados').html('');
		$('#dados-analisados').append('Levamos em consideração ' + answerArray.numberOfJsonsInData + ' captura(s) de dado(s) distinta(s).');
		$('#dados-analisados').show();
	switch (report) {
	case "empty-lines":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.emptyLines == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de ônibus sem linha - ' + answerArray.emptyLines + ' (' + answerArray.percentual + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.emptyLinesBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.emptyLinesBuses[i][0]).format('DD/MM/YYYY hh:mm')  + ' </td>');
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
			$('#resposta > h2').append('Total de ônibus sem linha - ' + answerArray.totalStoped + ' (' + answerArray.percentual + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.stopedBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.stopedBuses[i][0]).format('DD/MM/YYYY hh:mm')  + ' </td>');
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
			$('#resposta > h2').append('Total de ônibus atrasados - ' + answerArray.totalOutDated + ' (' + answerArray.percentual + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			for (var i in answerArray.outDatedBuses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.outDatedBuses[i][0]).format('DD/MM/YYYY hh:mm')  + ' </td>');
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
		if (answerArray['numberOfLines'] == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Total de linhas - ' + answerArray['numberOfLines'] + ' (' + answerArray.percentual + '% do total)');
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
		if (answerArray['numberOfBuses'] == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else { 
			$('#resposta > h2').append('Total de ônibus dentro da faixa de velocidade - ' + answerArray['numberOfBuses'] + ' (' + answerArray.percentual + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código da Linha </th>');
			$('#resposta > table > thead').append('<th> Velocidade Instantânea </th>');

			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('DD/MM/YYYY hh:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
				linha.append('<td>' + answerArray.buses[i][5] + ' Km/h' + ' </td>');

				$('#resposta > table > tbody').append(linha);
			}
			$('#resposta').show();
		}
		break;
	}
}
