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
		//var uniqueLines = removeDuplicatedFromArray(emptyLinesData);
		return {
			"emptyLines": averageEmptyLines,
			"buses": emptyLinesData,
			"numberOfJsonsInData": data.length,
			"total": calculateTotalBuses(data)
		};
	}

	var calculatesAverageNumber = function(array, jsonArray) {
		return parseFloat(array.length / (jsonArray.length)).toFixed(2);
	}

	var calculateTotalBuses = function (jsonArray) {
		var total = 0;
		jsonArray.map(function(data) {
			total += data.DATA.length;
		});
		return parseFloat(total/ jsonArray.length).toFixed(2);

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


	var stoppedInArea = function(data, lat, lng, r, minvelocity) {
		data = analysesData(data);
		var stopped = [];
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
					// stopped.push(bus);
					stopped = stopped.concat([bus]);
			}
		});
		var average = calculatesAverageNumber(stopped, data);
		//var uniqueStopped = removeDuplicatedFromArray(stopped);
		var averagePercentual = calculatesAveragePercentual(stopped, data);
		return {
			"totalstopped": average,
			"buses": stopped,
			"numberOfJsonsInData": data.length,
			"total": calculateTotalBuses(data)
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
		//var uniqueOutDated = removeDuplicatedFromArray(outDatedBuses);
		var averagePercentual = calculatesAveragePercentual(outDatedBuses, data);

		return {
			"totalOutDated": average,
			"buses": outDatedBuses,
			"numberOfJsonsInData": data.length,
			"total": calculateTotalBuses(data)
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
			"total": calculateTotalBuses(data)
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
			"buses": in_range_buses,
			"numberOfJsonsInData": data.length,
			"total": calculateTotalBuses(data)
		};

		return output;
	}

	function contains(array, obj) {
		var l = array.length;

		for (var i = 0; i < l; i++) {
			if (array[i] == obj) {
				return true;
			}
		}

		return false;
	}

	function getCollectDates(data) {
		data = analysesData(data);

		var datesArray = [];

		data.map(function(data) {
			var lastUpdate = data.LASTUPDATE;
			datesArray.push(lastUpdate);
		});

		return datesArray;
	}

	function busLinesFromJSON(data) {
		data = analysesData(data);
      	
      	var busLinesSet = {}; //creating a JavaScript Object, that is nothing more than a Set (does not allow duplicates!)

      	data.map(function(data) {
      		var buses = data.DATA;
      		var lastUpdate = data.LASTUPDATE;

      		var l = buses.length;
      		for (var i=0; i < l; i++) {
      			var bus = buses[i];
        		var busLine = ("" + bus[2]).trim(); // trimming whitespaces to normalize keys
        		
        		if (!busLinesSet[busLine]) {
        			busLinesSet[busLine] = [lastUpdate];
        		}else {
        			if (!contains(busLinesSet[busLine], lastUpdate)) {
        				busLinesSet[busLine].push(lastUpdate);
        			}
        		}
      		}
      	});

      	return busLinesSet;
    }

    function busLinesFromSpreadsheet() {
    	var santaCruzConsortium = "388,750,752,754,756,759,857,858,870,871,872,873,881,892,2303,2304,2307,2308,2309,2331,SN870,SP870,SV858,SV870,364,365,367,379,383,389,394,395,739,741,742,743,744,751,767,777,794,801,933,936,SN741,SN744,SN777,SP383,SV367,SV379,SV389,SV394,SV395,SV777,369,370,392,393,396,397,923,2310,SN392,SN393,SN397,SR393,SR397,366,387,398,770,771,804,807,813,821,822,824,825,830,833,839,840,841,842,849,850,868,869,878,882,885,891,893,895,896,897,898,2335,2336,2337,2802,SN398,SN839,SN840,SN841,SN850,SN882,SN898,SP850,SR398,SV2336,SV841,391,684,730,731,737,740,745,746,784,790,798,803,811,812,819,820,926,SN737,SN745,SN803,SP746,SV745,SV790,SV819,SN803,801,803,769,802,814,834,835,836,837,838,843,845,851,852,853,854,855,864,866,867,876,877,879,883,884,918,2332,2334,2338,2381,2801,SE867,SN838,SN854,SN867,SV2334,SV2381,SV843,SV853,SV854,SV866,358,689,738,786,828,846,847,848,894,937,SN689,SN786,SN846,SV358,";
      	var interSulConsortium = "201,202,204,401,411,413,415,426,626,423,425,434,435,436,464,2005,2014,2015,2017,2019,122,124,125,217,409,416,602,2203,158,169,176,186,521,522,523,524,546,590,591,592,593,220,226,229,448,603,604,608,210,441,445,461,472,473,474,475,476,503,209,107,177,110,111,120,121,123,126,127,128,129,132,170,172,173,178,181,190,440,442,443,444,460,462,463,119,133,136,154,155,161,162,180,183,184,503,511,512,513,569,570,573,574,580,583,584,6,7,10,11,14,410,422,503,507,SE006,SE14,SN006,157,222,420,421,432,433,438,439,605,";
      	var transCariocaConsortium = "607,667,686,774,775,940,363,651,652,678,SV363,337,340,380,390,600,601,611,690,700,701,800,815,816,817,818,823,826,827,859,880,SE614,SV390,371,723,2018,2918,306,331,332,339,348,352,353,368,525,610,613,614,636,691,692,693,810,829,844,861,862,863,887,958,2110,2111,2112,2114,2115,SE614,301,302,303,304,305,333,345,805,2330,691,693,338,341,732,748,766,888,889,SP341,SV748,2346,343,346,354,465,550,555,556,557,734,753,765,860,875,886,SP465,2345,SV2345,360,361,382,504,505,525,2329,2333,309,315,316,317,318,525,955,957,736,747,749,757,758,760,761,762,763,764,780,806,808,831,832,856,865,875,952,SE831,SE832,SV758,308,314,315,501,502,709,712,721,781,782,783,";
      	var interNorteConsortium = "254,277,456,457,458,459,650,372,373,374,376,377,665,SV376,SVA665,SVB665,725,639,905,950,951,SV639,SVA905,SVB905,SVC905,261,375,381,384,385,386,399,404,405,480,481,483,484,485,486,497,498,906,945,947,2295,2302,SP386,SP404,SP498,SPA261,SPA384,SPA484,SPB261,SPB384,SPB484,SPC484,SR385,SV385,SV498,653,711,,334,335,919,920,942,SP334,SR335,SV335,SV920,SV942,334,335,919,920,942,SP334,SR335,SV335,SV920,SV942,321,324,325,326,329,330,616,663,969,925,935,2343,2344,SP326,SVA324,SVA326,SVA696,SVB324,SVB326 ,SVB696 ,312,313,621,622,623,625,628,661,662,679,SP312,298,307,344,349,355,673,SPA298,SPA349,SPA355,SPB298,SPB349,SPB355,SPC298,SPC355,SR349,SR355,232,249,606,2251,SE232,SPA232,SPB232,SV606,624,917,SV917,320,322,323,327,328,634,635,901,910,911,913,914,915,922,924,934,2342,SP322,SP910,SV322,SV328,SV901,296,307,342,615,687,688,727,779,793,795,944,946,2305,SP687,SPA342,SPB342,SPC342,SR342,SV779,SV944,630,627,680,2101,2145,307,350,351,629,685,950,951,SP350,SR350,SVA685,SVB685,609,638,676,956,238,239,247,454,SP455,455,362,378,669,727,773,778,908,SP378,SPA362,SPB362,SPC362,SR362,SR378,SV669,SV908";

      	var busLinesFromSpreadsheet = santaCruzConsortium + interSulConsortium + transCariocaConsortium + interNorteConsortium;
      
      	return busLinesFromSpreadsheet.split(',');
    }
    
    function busLinesWithNoBusesRunning(data) {
    	var busLinesArrayFromSpreadsheet = busLinesFromSpreadsheet();
    	var busLinesSetFromJSON = busLinesFromJSON(data);
      
      	var busLinesWithNoBusesSet = {};
      	var l = busLinesArrayFromSpreadsheet.length;

      	for (var i=0; i < l; i++) {
      		var busLine = busLinesArrayFromSpreadsheet[i];

       		if (!busLinesSetFromJSON[busLine]) {	//check if the bus line from SpreadSheet isn't present in JSON file.
   				busLinesWithNoBusesSet[busLine] = "";	//Add to Set the bus line as a key and an empty string as the value of the key.
       		}
   		}

   		//Preparing output:
   		var busLinesArray = [];

   		for (var busLine in busLinesWithNoBusesSet) {
   			busLinesArray.push(busLine);
   		}

      	var output = {
      		"lines": busLinesArray,
      		"dates": getCollectDates(data),
        	"numberOfJsonsInData": data.length,
        	"linesWithNoBuses": busLinesArray.length,
        	"total": busLinesArrayFromSpreadsheet.length
      	};

      	return output;
    }


	var result;

	$(document).on('click', '#button', function() {
		startLoadingAnimation();
		var selected = $('input[name="report"]:checked').val();
		var dateNow = $("#dateNow");
		var initialDate = $("#initialDate").val();
		var finalDate = $("#finalDate").val();
		var url;

		if (dateNow.is(":checked") == true) {
			url = "http://rest.riob.us:81/all?callback=?";
		}
		else {
			//converting to correct format, from datetime input, using moment js
			if (initialDate.length == 0 && finalDate.length == 0 ){
				alert("Por favor, preencha as datas, ou marque a opção 'Obter dados em tempo real'. ")

			}
			else {
				initialDate = moment(initialDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
				finalDate = moment(finalDate,"DD/MM/YYYY - HH").format("YYYYMMDDHH");
				url = "http://rest.riob.us:81/api/" + initialDate + "/" + finalDate + "?callback=?";
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
				case "lines-with-no-buses":
					result = busLinesWithNoBusesRunning(data);
					break;
				case "stopped":
					var lat = $('#lat').val(),
						lng = $('#lng').val(),
						r = $('#r').val(),
						minv = $('#minv').val();
					result = stoppedInArea(data, lat, lng, r, minv);
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

	$(document).on('click', '#csv-button', function() {
		if(result.buses != undefined) {
			var csv = "DATAHORA,ORDEM,LINHA,LATITUDE,LONGITUDE,VELOCIDADE,DIRECAO\n";
			result.buses.map(function(bus) {
				csv += bus[0] + "," + bus[1] + "," + bus[2] + "," + bus[3] + "," + bus[4] + "," + bus[5] + "," + bus[6] + "\n";
			});
      var encodedUri = encodeURI(csv);
			document.location.href = "data:text/csv;charset=utf-8,"+ encodeURI(csv).replace("\n", "%0A");
		}
		if(result.lines != undefined) {
			var csv = "LINHAS\n";
			result.lines.map(function(line) {
				csv += line + "\n";
			});
      var encodedUri = encodeURI(csv);
			document.location.href = "data:text/csv;charset=utf-8,"+ encodeURI(csv).replace("\n", "%0A");
		}
	});
}


$(function(){
	endLoadingAnimation();
	$('.checkbox').hide();

	$(function () {
	  $('[data-toggle="popover"]').popover()
	})

	$('ul[role=menu] a').click(function(event) {
		//When the user clicks on a report, the page animates and show related fields
		var inputName = $(this).data('input-id');
		var infoText;
		switch (inputName) {
			case "empty-lines":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra os ônibus sem linha estabelecida no gps.";
				break;
			case "lines-with-no-buses":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra as linhas de ônibus que não que não possuem nenhum ônibus circulando.";
				break;
			case "stopped":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra os ônibus com a velocidade máxima passada (zero para parados) ao redor de uma área.";
				break;
			case "outdated-gps":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra os ônibus com dados do gps desatualizados de acordo com o número passado.";
				break;
			case "line-counter-by-bus":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra as linhas de ônibus que tem o número de carros rodando dentro da faixa passada.";
				break;
			case "buses-by-speed":
				infoText = "Relatório gerado a partir das datas selecionadas que mostra os ônibus dentro da faixa de velocidade passada.";
				break;
			default:
				infoText = "";
		}

		showForm(inputName, infoText);
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
	var dateInputDisabled = true;

	$('input[name=dateNow]').on('change',function(event) {
		event.preventDefault();
		//when the dateNow checkbox changes, the fields become available or no
		dateInputDisabled = !dateInputDisabled;
		$('[id*=Date]').prop('disabled', dateInputDisabled);
	});
})

function startLoadingAnimation(){
	// Starts the loading animation
	$('#main-container').fadeTo("fast",0.1,function(){
		$('#dvLoading').fadeIn("fast");
	});
}

function endLoadingAnimation(){
	// Finishes the loading animation
	$('#dvLoading').fadeOut("fast", function() {
		$('#main-container').fadeTo("fast",1);
	});
}

function showForm(form, infoText){
	//Making fade transition to hide previous report and show the other

	var formTitle = $('a[data-input-id='+form+']').html();
	$('.dropdown-toggle').html( formTitle + '<span class="caret"/>');
	$('h1').html(formTitle);
	$('[data-form-name]:visible').fadeOut('fast', function() {
		$('[data-form-name='+form+']').fadeIn('fast',function() {
			$('input[value='+form+']').trigger('click')
		});
	});
	$('#info_btn').attr('data-content', infoText);
	$('#resposta').hide();
	$('#csv-button').hide();
	$('#dataRioOut').hide();
	$('#dados-analisados').hide();
	
	if (form == 'show-map' || form == 'show-graph1'){
		$('.radio-inline').fadeOut('fast');
		$('#button').fadeOut('fast');
		$('#final-date-container').fadeOut('fast');
		$('#initial-date-container').fadeOut('fast');
	}
	else if ($('#initial-date-container').css('display') == 'none'){
		$('.radio-inline').fadeIn('fast');
		$('#button').fadeIn('fast');
		$('#final-date-container').fadeIn('fast');
		$('#initial-date-container').fadeIn('fast');
	}
}

function generateTable(answerArray,report){
	//placing server's answer on a better format for the user...
	endLoadingAnimation();
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
			$('#resposta > h2').append('Média de ônibus sem linha - ' + answerArray.emptyLines + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.emptyLines/answerArray.total*100).toFixed(2) + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código do ônibus </th>');
			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('DD/MM/YYYY HH:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
				$('#resposta > table > tbody').append(linha);

			}
			$('#resposta').show();
		}
		break;
	case "lines-with-no-buses":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.linesWithNoBuses == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Número de linhas sem ônibus circulando - ' + answerArray.linesWithNoBuses + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.linesWithNoBuses/answerArray.total*100).toFixed(2) + '% do total)');
			$('#resposta > table > thead').append('<th> Linha de ônibus </th>');
			for (var i in answerArray.lines){
				var linha = $('<tr>');
				linha.append('<td>' + answerArray.lines[i] + ' </td>');
				$('#resposta > table > tbody').append(linha);
			}
			$('#resposta').show();
		}
		break;
	case "stopped":
		$('#resposta > h2').html('');
		$('#resposta > table > thead').html('');
		$('#resposta > table > tbody').html('');
		if (answerArray.totalstopped == 0){
			$('#resposta > h2').append('Nenhum resultado encontrado');	
		}
		else {
			$('#resposta > h2').append('Média de ônibus sem linha - ' + answerArray.totalstopped + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.totalstopped/answerArray.total*100).toFixed(2) + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código do ônibus </th>');
			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('DD/MM/YYYY HH:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
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
			$('#resposta > h2').append('Média de ônibus atrasados - ' + answerArray.totalOutDated + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.totalOutDated/answerArray.total*100).toFixed(2) + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código do ônibus </th>');
			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('DD/MM/YYYY HH:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
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
			$('#resposta > h2').append('Total de linhas - ' + answerArray.numberOfLines + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.numberOfLines/answerArray.total*100).toFixed(2) + '% do total)');
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
			$('#resposta > h2').append('Média de ônibus dentro da faixa de velocidade - ' + answerArray.numberOfBuses + ' do total de ' + answerArray.total + ' (' + parseFloat(answerArray.numberOfBuses/answerArray.total*100).toFixed(2) + '% do total)');
			$('#resposta > table > thead').append('<th> Hora </th>');
			$('#resposta > table > thead').append('<th> Código do ônibus </th>');
			$('#resposta > table > thead').append('<th> Velocidade Instantânea </th>');

			for (var i in answerArray.buses){
				var linha = $('<tr>');
				linha.append('<td>' + moment(answerArray.buses[i][0]).format('DD/MM/YYYY HH:mm')  + ' </td>');
				linha.append('<td>' + answerArray.buses[i][1] + ' </td>');
				linha.append('<td>' + answerArray.buses[i][5] + ' Km/h' + ' </td>');

				$('#resposta > table > tbody').append(linha);
			}
			$('#resposta').show();
		}
		break;
	}
	$('#csv-button').show();
}
