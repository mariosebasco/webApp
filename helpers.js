
//Set up map 
// var map = L.map('mapid').setView([32.3710, -84.8082], 17);
// var map = L.map('mapid').setView([42.0484, -87.6974], 17);
var map = L.map('mapid').setView([38.26407, -77.46217], 18);

var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
//var googleLayer = new L.Google('SATELLITE');
var googleLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});
var baseMaps = {
    "OpenStreetMap": osm,
    "Google": googleLayer
};

var overlays =  {//add any overlays here
    };

L.control.layers(baseMaps,overlays, {position: 'bottomleft'}).addTo(map);
map.addLayer(googleLayer);

var vehicle_circle = L.circleMarker([0, 0], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 10
});

var des_circle = L.circleMarker([0, 0], {
    color: 'blue',
    fillColor: '#fff',
    fillOpacity: 1.0,
    radius: 5
});

var marker_array = new Array();
var event_marker;
map.on('click', onMapClick);

function onMapClick(e) {
    if(creating_map) {
	var marker = L.marker(e.latlng, {title: (marker_array.length).toString(), draggable: true, opacity: 0.75});
	marker.bindPopup('<button onclick="deleteMarker()">Delete</button> <button onclick="handleEvent()">Event Point</button>');
	marker.on('click', function(e) {
	    marker.openPopup();
	    event_marker = marker;
	});
	marker.on('moveend', function() {
	    updateTable();
	});
	marker_array.push(marker);
	markerGroup.addLayer(marker);
	updateTable();
    }
    else {
	var popup = L.popup();
	popup
    	    .setLatLng(e.latlng)
    	    .setContent(e.latlng.toString())
    	    .openOn(map);
    }
}

function deleteMarker() {
    delete marker_array[Number(event_marker.options.title)];
    map.removeLayer(event_marker);
    updateTable();
}

var event_dict = new Object();
function handleEvent() {
    if(event_marker.options.opacity == 1.0) {event_marker.setOpacity(0.75);}
    else {
	event_marker.setOpacity(1.0);
	duration = prompt("Please enter video duration", 0);
	event_dict[event_marker.options.title] = duration;
    }
    updateTable();
}

var lineLayerGroup = L.layerGroup([]).addTo(map);
var markerGroup = L.layerGroup([]).addTo(map);
function updateTable() {
    var table = document.getElementById("marker_table");
    var table_body = document.getElementById("marker_table_body");
    
    var new_tbody = document.createElement('tbody');
    new_tbody.id = 'marker_table_body';
    
    var count = 0;
    var prev_marker;
    lineLayerGroup.clearLayers();
    for(i = 0; i < marker_array.length; i++) {
	if(marker_array[i] != undefined) {
	    if(i > 0  && prev_marker != undefined) {
		var latlngs = [
		    [prev_marker.getLatLng().lat, prev_marker.getLatLng().lng],
		    [marker_array[i].getLatLng().lat, marker_array[i].getLatLng().lng]
		];
		var polyLine = L.polyline(latlngs, {color: 'red'});
		lineLayerGroup.addLayer(polyLine);
	    }
	    
	    var row = new_tbody.insertRow(count);
	    var id_cell = row.insertCell(0);
	    var lat_cell = row.insertCell(1);
	    var lon_cell = row.insertCell(2);
	    var event_cell = row.insertCell(3);
	    var duration_cell = row.insertCell(4);
	    
	    id_cell.innerHTML = count + 1;
	    lat_cell.innerHTML = marker_array[i].getLatLng().lat.toFixed(5);
	    lon_cell.innerHTML = marker_array[i].getLatLng().lng.toFixed(5);
	    if(marker_array[i].options.opacity == 1.0) {
		event_cell.innerHTML = "yes";
		duration_cell.innerHTML = event_dict[marker_array[i].options.title];
	    }
	    else {
		event_cell.innerHTML = "no";
		duration_cell.innerHTML = "N/A";
	    }
	    count ++;
	    prev_marker = marker_array[i];
	}
    }
    table.replaceChild(new_tbody, table_body);

}


function drawMap(data) {
    var points = data.split("\n");

    if(points[points.length - 1] == "") points.pop();
    for(i = 0; i < (points.length - 2); i+=2) {
    	var latlngs = [
    	    [parseFloat(points[i]), parseFloat(points[i+1])],
    	    [parseFloat(points[i+2]), parseFloat(points[i+3])]
    	];
    	var polyLine = L.polyline(latlngs, {color: 'red'});
    	lineLayerGroup.addLayer(polyLine);
    }
    map.fitBounds([
	[parseFloat(points[0]), parseFloat(points[1])],
	[parseFloat(points[points.length - 2]), parseFloat(points[points.length - 1])]
    ]);
}

var set_map;
function writeFile() {
    if(creating_map) {
	handlePostUser("run_custom_map", '');
    }
    else {
	handlePostUser("run_set_map", set_map);
    }
}

function stopVehicle() {
    handlePostUser("run_stop_vehicle", '');
}

function iopOn() {
    handleGetUser("iop_on");
}

function iopOff() {
    handlePostUser("iop_off", '');
}

//XMLHttpRequest
var should_start = false;
var creating_map = false;
var send_string = "start";

function handlePostUser(url, input_data) {
    switch(url) {
    case "run_custom_map":
	var xhr_post = new XMLHttpRequest();
	
	var table = document.getElementById("marker_table");
	var lats = new Array();
	var lngs = new Array();
	var evns = new Array();
	var durs = new Array();
	
	for(i = 0; i < table.rows.length - 1; i++) {
	    lats.push(table.rows[i+1].cells[1].innerHTML);
	    lngs.push(table.rows[i+1].cells[2].innerHTML);
	    evns.push(table.rows[i+1].cells[3].innerHTML);
	    durs.push(table.rows[i+1].cells[4].innerHTML);
	}
	var data = new Object();
	data["lats"] = lats;
	data["lngs"] = lngs;
	data["evns"] = evns;
	data["durs"] = durs;
	console.log(data);
	
	xhr_post.open("POST", url, true);
	xhr_post.setRequestHeader("Content-Type", "application/json");
	xhr_post.send(JSON.stringify(data));

	break;
    case "set_map":
	var xhr_post = new XMLHttpRequest();
	
	xhr_post.open("POST", url, true);
	xhr_post.setRequestHeader("Content-Type", "application/json");
	var data = new Object();
	data["map"] = input_data;
	xhr_post.send(JSON.stringify(data));

	xhr_post.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		var response = xhr_post.responseText;
		drawMap(response);
	    }
	    set_map = input_data;
	};
	
	break;
    case "run_set_map":
	var xhr_post = new XMLHttpRequest();
	
	xhr_post.open("POST", url, true);
	xhr_post.setRequestHeader("Content-Type", "application/json");
	var data = new Object();
	data["map"] = input_data;
	xhr_post.send(JSON.stringify(data));
	
	break;

    case "run_stop_vehicle":
	var xhr_post = new XMLHttpRequest();
	
	xhr_post.open("POST", url, true);
	xhr_post.setRequestHeader("Content-Type", "application/json");
	xhr_post.send();
	
	break;
    // case "iop_on":
    // 	var xhr_post = new XMLHttpRequest();
	
    // 	xhr_post.open("POST", url, true);
    // 	xhr_post.setRequestHeader("Content-Type", "application/json");
    // 	xhr_post.send();
	
    // 	break;
    case "iop_off":
	var xhr_post = new XMLHttpRequest();
	
	xhr_post.open("POST", url, true);
	xhr_post.setRequestHeader("Content-Type", "application/json");
	xhr_post.send();
	
	break;
	
    default:
	break;
    }
}


function handleGetUser(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
    
    switch(url) {
    case "start":
	xhr.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		var response = xhr.responseText;
		if (response == "true") {
		    var info_list = document.getElementById('ros_list');
		    var entry = document.createElement('li');
		    entry.className = "list-group-item";
		    
		    document.getElementById("jumbo_display").innerHTML = "Connected To Vehicle!";
		    should_start = true;
		    send_string = "ros_data"
		    entry.appendChild(document.createTextNode("Connected To Vehicle"));
		    info_list.appendChild(entry);		
		}
	    }
	};
	break;

    case "ros_data":
	xhr.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		var response = xhr.responseText;
		var data = JSON.parse(response);

		//update vehicle location on map
		vehicle_circle.setLatLng([data.lat, data.lon]).addTo(map);
		des_circle.setLatLng([data.des_lat, data.des_lon]).addTo(map);
		
		//update info list
		if(data.info != "") {
		    var info_list = document.getElementById('ros_list');
		    var entry = document.createElement('li');
		    entry.className = "list-group-item";
		    entry.appendChild(document.createTextNode(data.info));
		    info_list.appendChild(entry);
		    var list_items = document.getElementById('ros_list').getElementsByTagName("li").length;
		    if(list_items > 20) {info_list.removeChild(info_list.childNodes[0]);}
		}
	    }
	};
	break;
	
    case "maps":
	xhr.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		var response = xhr.responseText;

		var parsed = response.split("\n");
		var table = document.getElementById("load_map_table");
		var table_body = document.getElementById("load_map_body");

		for(i = 0; i < parsed.length; i++) {
		    if(parsed[i] == "") continue;
		    var row = table_body.insertRow(i);
		    var map_name = row.insertCell(0);
		    
		    var btn = document.createElement("BUTTON");
		    var text = document.createTextNode(parsed[i]);
		    btn.appendChild(text);
		    btn.className = "btn-link";
		    
		    btn.addEventListener("click", function() {
			markerGroup.clearLayers();
			lineLayerGroup.clearLayers();
			handlePostUser("set_map", this.innerHTML);
		    });
		    
		    map_name.appendChild(btn);
		}
	    }
	};	
	break;
	
    default:
	break;
    }
}

//return video stream
function handleVideo() {
    //window.open("http://192.168.1.203/en/player/mjpeg_hd.asp", "Video Stream", "height=500,width=800");
    window.open("http://localhost:8080/stream?topic=/front_camera/image_raw/compressed", "Video Stream", "height=500,width=800");   
}

function handleCreateNewMap() {
    creating_map = !creating_map;
    markerGroup.clearLayers();
    lineLayerGroup.clearLayers();
    marker_array.length = 0;
    for (var member in event_dict) delete event_dict[member];
}

var maps_loaded = false;
function handleLoadMap() {
    creating_map = false;
    markerGroup.clearLayers();
    lineLayerGroup.clearLayers();
    marker_array.length = 0;
    for (var member in event_dict) delete event_dict[member];
    
    if (!maps_loaded) {
	send_string = "maps";
	maps_loaded = true;
    }
}


//set interval to get data
window.setInterval(function(){
    handleGetUser(send_string);
    if(should_start) send_string = "ros_data";
    else send_string = "start";
}, 100);
    
