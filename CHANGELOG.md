# Changelog

## 0.1.11 - 0.1.12

- Fixed Home Assistant discovery topic.
- Added HA discovery of Zones (these need to be set in the HA config file).
- Added zone event handler.
  - This now sets the state of PIR and DOOR zones in HA.
  - To use this, zones need to be set as CUSTOM-A or CUSTOM-B and then in Assemble Zones, these (A and B) need to be set to log 24 hrs to pass events in unset condition to sia2mqttha.

## 0.1.12 - 0.1.13

- Fixed logic that determines whether an event is a ZoneEvent ensuring non-confirmed Intruder events trigger SystemEvents