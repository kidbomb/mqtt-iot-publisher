#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const SerialProber = require('./serial-prober-node/serial-prober');
const HomieEventListener = require('./homie-event-listener')

const PROBERS = [
  new SerialProber({
    name: 'deConz',
    baudRate: 38400,
    // deConz VERSION Command
    probeCmd: [
      0xc0,       // END - SLIP Framing
      0x0d,       // VERSION Command
      0x01,       // Sequence number
      0x00,       // Reserved - set to zero
      0x05, 0x00, // Frame length
      0xed, 0xff, // CRC
      0xc0,       // END - SLIP framing
    ],
    probeRsp: [
      0xc0,       // END - SLIP framing
      0x0d,       // VERSION Command
      0x01,       // Sequence NUmber
      0x00,       // Reserved
      0x09, 0x00, // Frame length
      // This would normally be followed a 4 byte version code, CRC, and END
      // but since we don't know what those will be we only match on the first
      // part of the response.
    ],
    filter: [
      {
        vendorId: /0403/i,
        productId: /6015/i,
      },
      {
        vendorId: /1cf1/i,
        productId: /0030/i,
      },
    ],
  }),
  new SerialProber({
    name: 'XBee',
    baudRate: 9600,
    // XBee Get API Mode Command
    probeCmd: [
      0x7e,       // Start of frame
      0x00, 0x04, // Payload Length
      0x08,       // AT Command Request
      0x01,       // Frame ID
      0x41, 0x50, // AP - API Enable
      0x65,       // Checksum
    ],
    probeRsp: [
      0x7e,       // Start of frame
      0x00, 0x06, // Payload length
      0x88,       // AT Command Response
      0x01,       // Frame ID
      0x41, 0x50, // AP
      // This would normally be followed by the current API mode, and a
      // checksum, but since we don't know those will be, we only match on
      // the first part of the response.
    ],
    filter: [
      {
        // The green Zigbee dongle from Digi has a manufacturer of 'Digi'
        // even though it uses the FTDI vendorId.
        //
        // Devices like the UartSBee, use a generic FTDI chip and with
        // an XBee S2 programmed with the right firmware can act like
        // a Zigbee coordinator.
        vendorId: /0403/i,
        productId: /6001/i,
      },
    ],
  }),
];

// Returns the probe that passed
async function probePort(portName) {
  for (const prober of PROBERS) {
    try {
      await prober.open(portName);
      return prober;
    } catch (err) {
      // Nothing do do - probe failed
    }
  }
}

const optionsDefs = [
  {name: 'debug', alias: 'd', type: Boolean, defaultValue: false},
  {name: 'list', alias: 'l', type: Boolean},
  {name: 'sleep', type: Number},
  {name: 'port', type: String, defaultOption: true},
  {name: 'mqtt', type: String}
];
const options = commandLineArgs(optionsDefs);
SerialProber.debug(options.debug);

var config = {};

var listener = new HomieEventListener(options.mqtt);

if (options.list) {
  SerialProber.listAll().then(() => {
    console.log('End of serial port list');
  }).catch((err) => {
    console.log('Error:', err);
  });
} else if (options.port) {
  probePort(options.port).then((prober) => {
    console.log('Port', options.port, 'looks like', prober.param.name);
    if (options.sleep) {
      console.log(`Sleeping for ${options.sleep} seconds`);
      setTimeout(() => {
        prober.close();
      }, options.sleep * 1000);
    } else {
      prober.close();
    }
  }).catch(() => {
    console.log('Done all probes - nothing matched');
  });
} else {
  SerialProber.probeAll(PROBERS).then((matches) => {
    if (matches.length == 0) {
      console.log('Nothing found');
    } else {
	console.log("About to start drivers")
        // We put the driver requires here rather than at the top of
        // the file so that the debug config gets initialized before we
        // import the driver class.
        const XBeeDriver = require('./zigbee-adapter/xbee-driver');
        //add deconz
        const driver = {
          [PROBERS[1].param.name]: XBeeDriver,
        };
        for (const match of matches) {
          new driver[match.prober.param.name](listener,
		  			  config,
                                          match.port.comName,
                                          match.serialPort);
        }
    }
  }).catch((err) => {
    console.error(`${err}`);
    console.log('Done all probes - nothing matched');
  });
}


