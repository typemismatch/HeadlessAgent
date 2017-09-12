var exec                = require('child_process').exec;
var fs                  = require('fs');
var async               = require('async');
var networkutils        = require("./networkUtils");
var ourIPAddress        = networkutils.getFirstAvailableNetworkAddress("eth0,wlan0");
var ourMACAddress       = networkutils.getFirstAvailableMACAddress("eth0,wlan0");
var deviceConfig        = JSON.parse(fs.readFileSync("device.config.json", 'utf8'));
var workingPath         = "/home/agent/HeadlessAgent/";

var awsIot = require('aws-iot-device-sdk');

var device = awsIot.device({
	"host": "data.iot.us-west-2.amazonaws.com",
	"port": 8883,
	"clientId": deviceConfig.thingName,
	"thingName": deviceConfig.thingName,
	"caPath": "/home/agent/HeadlessAgent/rootCA.pem",
	"certPath": "/home/agent/HeadlessAgent/certificate.pem",
	"keyPath": "/home/agent/HeadlessAgent/privateKey.pem",
  "region": "us-west-2"
});

function main()
{
  log("**");
  log("** Ratchet Discovery Agent");
  log("**");
  log("");
  log("");

  var bootTime = new Date().getTime();

  if ( ourIPAddress != "" )
  {
    async.forever(
      registerDevice.bind({bootTime:bootTime})
    );
  }
  else
  {
      log("No IP address available yet")
      log("Exiting with code 2");
      log("");
      process.exit(2);
  }
}

/*
	Check we have a valid JSON configuration file, if not - ask AWS IoT for an friendly identifier
*/
function checkValidConfig()
{
	if (deviceConfig.thingName != "RAT-0") return true;
	else {
		// We need to ask for a valid RAT #
		log("We aren't configured, fetching RAT ID");
		device.subscribe("/rat/configure");
		var configMe = {
			mac: ourMACAddress
		};
		setTimeout(()=>{
			device.publish("/rat/configure/me", JSON.stringify(configMe));
		}, 1000);
	}
}

function registerDevice(next)
{
  log(new Date());
	if (checkValidConfig()) {
	  log("Registering this Device -> " + ourIPAddress + " [" + ourMACAddress + "]");

	  var data =
	  {
	    "local-ip" : ourIPAddress,
	    "local-mac" : ourMACAddress,
	    "mqtt_topic" : deviceConfig.thingTopic,
	    "name" : deviceConfig.thingName,
	    "thing_name" : deviceConfig.thingName,
	    "last-seen" : new Date()
	  };

	  device.publish(deviceConfig.thingTopic, JSON.stringify(data));
	}
	setTimeout(()=>
        {
          next();
        }, 60000);
}

function log(message)
{
  console.log("ratchet-agent:: " + message);
}

device.on('message', function(topic,message) {

	// This might be triggered by lots of unknown devices
	// Verify the message is for us using our mac address
	console.log("Processing configure me data ...");
	console.log(message.toString());
	message = JSON.parse(message);
	try
	{
		if (message.mac == ourMACAddress) {
			// Write out our new configuration file
			// This also sets our globals to the new values and so the main loop should run
			deviceConfig.thingName = "RAT-" + message.rat;
			deviceConfig.thingTopic = "rat/discovery/RAT-" + message.rat;

			fs.writeFile(workingPath + "device.config.json", JSON.stringify(deviceConfig), 'utf8', function(err) {
				if (err) log("Unable to save new config file.");
				else log("Saved new config file.");
			});
		}
	}
	catch (err) {
		log("We had a problem parsing the configure response: " + err);
	}

});

device.on('connect', function() {
  console.log('Connected!');
  var message = {
    "agent-id": deviceConfig.thingName,
    "agent-status": "Online, waiting for IP discovery"
  };
  device.publish("nuc/agent", JSON.stringify(message));
  //subscribe to our shadow so we can run the reset agent
	//device.subscribe('$aws/things/' + deviceConfig.thingName + '/shadow/get/accepted');
	//device.publish('$aws/things/' + deviceConfig.thingName + '/shadow/get', "");
  setTimeout(()=>
        {
          console.log("Processing into main loop ...");
          main();
        }, 2000);
  console.log('Pushed awake message to gateway...');
});

main();
