# Entity Examples

## Comms Status entity

name sensor.alarmpanel_comms_status

state: Ok

attributes:
```
status: Ok
time: "16:37"
ok: true
```

## Last Event entity

name sensor.alarmpanel_last_event

state: Automatic Test

attributes:
```
status: Automatic Test
time: "16:37"
```

## Set Status entity

name sensor.alarmpanel_set_status

state: Unset

attributes:
```
status: Unset
time: "05:01"
unSet: true
fullSet: false
partSet: false
```

## Triggered entity

name binary_sensor.alarmpanel_triggered

state: off

attributes:
```
time: "06:51"
```

## Event entity

name  sensor.alarmpanel_event

state: RP

attributes:
```
accountId: "1234"
time: "16:32"
groupModifier: ""
peripheralModifier: ""
userModifier: ""
vaModifier: "0060"
code: RP
zone: ""
text: AUTOTEST REC.2-Ethernet
```