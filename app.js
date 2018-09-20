//required
const express = require('express')
const fs = require('fs');
const app = express()
const path = require("path");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var ROS_DIR = "/home/robot/catkin_ws/src/hdt_cub/hdt_cub_navigation/gps_files/";

/* ************************************************** */
/*                                                    */
/*                     ROS                            */
/*                                                    */
/* ************************************************** */
// Require rosnodejs itself
const rosnodejs = require('rosnodejs');
// Requires the std_msgs message package
//const odomMsg = rosnodejs.require('nav_msgs').msg.Odometry;
const logMsg = rosnodejs.require('rosgraph_msgs').msg.Log;
const gpsMsg = rosnodejs.require('sensor_msgs').msg.NavSatFix;

rosnodejs.initNode('/rosnode_js_node');
const nh = rosnodejs.nh;

var veh_lat, veh_lng, ros_string;
var received_data = "false";

function gpsCB(msg) {
    veh_lat = msg.latitude;
    veh_lng = msg.longitude;
    received_data = "true";
}

function logCB(msg) {
    ros_string = msg.msg;
}

//const odom_sub = nh.subscribe('/odom', odomMsg, odomCB);
const gps_sub = nh.subscribe('/fix', gpsMsg, gpsCB);
const log_sub = nh.subscribe('/rosout', logMsg, logCB);

/* ************************************************** */
/*                                                    */
/*               GET FUNCTIONS                        */
/*                                                    */
/* ************************************************** */
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/helpers.js',function(req,res){
  res.sendFile(path.join(__dirname+'/helpers.js'));
});


app.get('/ros_data', function (req, res) {
    var text = '{"lat":'+ veh_lat  +', "lon":'+ veh_lng +', "info":'+ JSON.stringify(ros_string)  +'}'
    ros_string = "";
    res.send(text);
});

app.get('/start', function (req, res) {
    res.send(received_data);
});

app.get('/maps', function (req, res) {
    fs.readFile("maps/maps.txt", 'utf8', function(err, data) {
	if (err) throw err;
	res.send(data);
    });
});


app.post('/run_custom_map', function (req, res) {
    //delete maps already there
    if(fs.existsSync('maps/final_map.txt')) {
	fs.unlink('maps/final_map.txt', (err) => {if (err) throw err;});
    }
    if(fs.existsSync('maps/event_file.txt')) {
	fs.unlink('maps/event_file.txt', (err) => {if (err) throw err;});
    }
    
    console.log(req.body);
    var map_logger = fs.createWriteStream('maps/final_map.txt', {flags: 'a'})
    var event_logger = fs.createWriteStream('maps/event_file.txt', {flags: 'a'})

    var num_points = req.body.lats.length;
    for (i = 0; i < num_points; i++) {
	map_logger.write(req.body.lats[i] + '\n');
	map_logger.write(req.body.lngs[i] + '\n');

	if(req.body.evns[i] == "yes") {
	    event_logger.write((i + 1) + '\n');
	    event_logger.write(req.body.durs[i] + '\n');
	}
    }
    map_logger.close();
    event_logger.close();
    //transfer the file to the right directory
    fs.rename('maps/final_map.txt', ROS_DIR + 'final_map.txt', function(err) {if(err) throw err;});
    fs.rename('maps/event_file.txt', ROS_DIR + 'event_file.txt', function(err) {if(err) throw err;});
    
    nh.setParam("/start_navigation", true);
});

app.post('/set_map', function (req, res) {
    var title = 'maps/' + req.body.map;
    fs.readFile(title, 'utf8', function(err, data) {
	if (err) throw err;
	res.send(data);
    });
});

app.post('/run_set_map', function (req, res) {
    if(fs.existsSync('maps/final_map.txt')) {
	fs.unlink('maps/final_map.txt', (err) => {if (err) throw err;});
    }
    
    var title = 'maps/' + req.body.map;
    var map_logger = fs.createWriteStream('./maps/final_map.txt', {flags: 'a'})
    
    fs.readFile(title, 'utf8', function(err, data) {
	if (err) throw err;
	map_logger.write(data);
	map_logger.close();
    });

    // transfer the file to the right directory
    fs.rename('maps/final_map.txt', ROS_DIR + 'final_map.txt', function(err) {if(err) throw err;});

    nh.setParam("/start_navigation", true);
});


app.listen(3000, () => console.log('app listening on port 3000!'))
