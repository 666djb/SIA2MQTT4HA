# SIA2MQTT HA
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

# Docker 

docker run sia2mqtt -p 10500:10500 -v /config.yml:/config.yml
