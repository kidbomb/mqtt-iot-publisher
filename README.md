A multi protocol listener which publishes devices changes through MQTT

# Currently implemented

* Zigbee listener/published

# TODO

* Other protocol publisher/listener
* Improve patterns

* Test

You need to have a Digispark Xbee device

Start service with
> node zigbee-listener.js

Listen to device changes
> mosquitto_sub -h localhost -t "homie/+/+" -v


Set a device with
> mosquitto_pub -t 'homie/zb-286d970001068f6a/on/set' -m 'true'
