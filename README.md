A multi protocol listener which publishes devices changes through MQTT

Most code was taken originally from https://github.com/mozilla-iot

# Currently implemented

* Zigbee listener/published

# TODO

* Other protocol publisher/listener
* Improve patterns

* Test

You need to have a Digi Xbee device

Start service with
>  ./zigbee-listener.js --mqtt 192.168.1.9

Listen to device changes
> mosquitto_sub -h localhost -t "homie/#" -v


Set a device with
> mosquitto_pub -t 'homie/zb-286d970001068f6a/on/set' -m 'true'

# Note

I plan to add support for mozilla gateway and homebridge soon.
