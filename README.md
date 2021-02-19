# SIA2MQTT4HA
Galaxy Flex SIA to MQTT server for Home Assistant

This package is based on work from https://github.com/dklemm/FlexSIA2MQTT.git

I have modified the FlexSIA2MQTT package to better suit my needs:
* It can be installed as an add-on in Home Assistant or run standalone
* It is auto discoverable by Home Assistant
* It creates one device - the "AlarmPanel" which has four top level entities
* The four top level entities are:
  * "set_status" to which JSON is published with status and time attributes where status can be Set, Part Set, Unset
  * "alarm_status" to which JSON is published with status and time attributes where status can be Intruder, Intruder Confirm, Fire, Fire Confirm, Tamper, Panic
  * "comms_test" to which JSON is published with status and time attributes where status can be Automatic Test, Manual Test
  * "event" to which JSON is published containing the raw event

I have only tested with:
* Galaxy Flex 100+ with v3 firmware and Ethernet Module A083-00-02

It should work with:
* Galaxy Flex 20, 50 or 100 with v3 Firmware
* Galaxy Flex Ethernet Module A083-00-02

https://www.security.honeywell.com/uk/All-Categories/intruder-detection-systems/control-panels/galaxy-flex-series

# Running stand alone without Docker

First convert the Typescript to Javascript: "tsc -p ./src"
Then run: "npm start"

# Docker

Build from the command line (e.g. not in Home Assistant): "docker build -t sia2mqtt4ha:latest --build-arg BUILD_FROM=alpine ."

Run: "docker run -v /config.yml:/config.yml -p 10002:10002 sia2mqtt4ha"

* Change the -p to reflect the port number you have configured in your Galaxy Flex panel

# To do

* Fix configuration for when sia2mqttt4ha is run stand alone (at present you need to put config in /data/options.json or redefine the CONFIG_FILE constant in server.ts)
* Describe Lovelace entities panel
* Look at implementing encrypted event reporting from the panel
* Look at SIA level 4 reporting to enable zone activations to be reported. Whilst the config.json (for HA) allows zones to be defined, these are NOT used right now.
