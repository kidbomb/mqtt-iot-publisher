node.js class for probing serial ports.

A serial prober is created by instantiating the SerialProber class and
passing in a parameters object which contains the following keys:

```
{
  name: 'name of prober',
  baudRate: 9600, // baud rate used to talk to device in question
  probeCmd: [0xc0, 0x0d], // array of bytes to send as a probe
  probeRsp: [0xx0, 0d0d], // expected response
  filter: [               // array of filter objects
    {
      vendorId: /0403/i,
      productId: /6015/i,
    },
  ],
}
```
The `filter` key is expected to be an array of filter objects.
Each filter object will contain keys and regular expressions or
strings which will be compared against a serial port object
as returned by `SerialPort.list()`. If all of the keys in a
filter object match, then the matching serial port will be opened
and the probeCmd will be sent. If the probeRsp is received back
within 500 msec then the probe will have passed.

The `probeAll` method will return a promise containing an array
of opened serial ports which passed the filter and passed the
probe.

See the serial-test.js test program for an example which will
probe for deConz and/or Digi Zigbee dongles.
