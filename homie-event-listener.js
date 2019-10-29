
const mqtt = require('mqtt')

var garageState = ''
var connected = false

class HomieEventListener {
    constructor(mqttServer) {
    	this.devices = {};
		this.rootTopic = "homie/"
		this.client = mqtt.connect("mqtt://" + mqttServer);
		this.client.on('message', (topic, message) => {
	    if(topic.startsWith(this.rootTopic)) {
	        var deviceId = topic.substring(this.rootTopic.length, this.rootTopic.length + 19);
			 console.log("Received message for " + deviceId)
			 if(this.devices.hasOwnProperty(deviceId)) {
			     var device = this.devices[deviceId];
			     var propertyName = topic.substring(this.rootTopic.length + 20, topic.length - 4);
			     console.log("TOPIC: "+ topic);
			     if(device.properties.has(propertyName)) {
			         console.log("Setting property "+ propertyName);
				 var newValue;
				 switch(device.properties.get(propertyName).type) {
				    case 'boolean':
				        newValue = this.parseBoolean(message.toString());
					break;
				    case 'number':
					newValue = parseInt(message.toString())
					break;
				    case 'string':
					newValue = message.toString()
					break;
				    default:
					console.log('ERROR: unknown type ');
					break;
				 }
				 if(newValue != undefined) {
				     device.properties.get(propertyName).setValue(newValue);
				 } else {
				     console.log("ERROR: message is not boolean: "+ message.toString());
				 }
			     } else {
			         console.log("ERROR: could not find property " + property)
		             }
		         }
	            }
		});
	
    }
    deviceAdded(device) {
        console.log("ADAPTER: Device added!");
    	this.devices[device.id] = device;

	var topicName = this.getTopicName(device.id)

	this.client.publish(topicName + '/$name', device.modelId);

        var topicName = this.getTopicName(device.id);

        device.properties.forEach((property, propertyName) => {
	    if(!property.readOnly) {
	        property.getValue().then((value) => {
		    var propertyValue = ""
		    if(property.value != null) {
		        propertyValue = property.value.toString();
		    }
		    this.client.subscribe(topicName + '/' + propertyName + '/set')
            	    this.client.publish(topicName + '/' + propertyName, propertyValue);
	        });
	    }
        });
    }
    propertyChanged(property) {
	if(!property.readOnly) {
	    var topicName = this.getTopicName(property.device.id);
	    this.client.publish(topicName + '/' + property.name, property.value.toString());
	}
    }
    getTopicName(deviceId) {
        return this.rootTopic + deviceId;
    }
    parseBoolean(s) {
        if(s === 'true') {
	    return true;
	} else if(s === 'false') {
	    return false;
	} else {
	    return undefined;
	}
    }
};

module.exports = EventListener;
