import { Event } from "../events/Event"
import { Publisher } from "../publisher"

// These are the MQTT subtopics that events get published to
enum subTopics {
    SET = "set_status",
    LASTEVENT = "last_event",
    COMMS = "comms_test",
    TRIGGERED = "triggered"
}

enum setState {
    UNSET = "Unset",
    FULL = "Full",
    PART = "Part"
}

interface ParsedEvent {
    code: string,
    time: string,
    text: string,
    setState?: setState,
    alarmState?: boolean,
    commsState?: boolean
}

function parseSystemEvent(event: Event): ParsedEvent {
    let parsedEvent: ParsedEvent = {
        code: event.code,
        time: event.time,
        text: ""
    }

    switch (event.code) {
        // Unset events
        case "OA":
        case "OG":
        case "OP":
            parsedEvent.text = "Unset"
            parsedEvent.setState = setState.UNSET
            parsedEvent.alarmState = false
            break
        // Set events
        case "CA":
        case "CL":
            parsedEvent.text = "Full Set"
            parsedEvent.setState = setState.FULL
            parsedEvent.alarmState = false
            break
        case "CG":
            parsedEvent.text = "Part Set"
            parsedEvent.setState = setState.PART
            parsedEvent.alarmState = false
            break
        // Cancel / reset events
        case "BC":
        case "OR":
            parsedEvent.text = "Unset"
            parsedEvent.setState = setState.UNSET
            parsedEvent.alarmState = false
            break
        // Triggered events
        case "BV":
            parsedEvent.text = "Confirmed Alarm"
            parsedEvent.alarmState = true
            break
        // Intruder alarm events
        case "BA":
        case "BF":
        case "BL":
        case "CT": // Entry Timeout
            parsedEvent.text = "Alarm Triggered"
            parsedEvent.alarmState = true
            break
        // Sensor trouble
        case "BT":
            parsedEvent.text = "Sensor Fault"
            break
        // Sensor restore
        case "BJ":
            parsedEvent.text = "Sensor Restored"
            break
        case "AT":
            parsedEvent.text = "Mains Fault"
            break
        case "AR":
            parsedEvent.text = "Mains Restored"
            break
        case "YT":
            parsedEvent.text = "Battery Fault"
            break
        case "YR":
            parsedEvent.text = "Battery Restored"
            break
        case "FA":
            parsedEvent.text = "Fire Alarm Triggered"
            parsedEvent.alarmState = true
            break
        case "FV":
            parsedEvent.text = "Fire Alarm Confirmed"
            parsedEvent.alarmState = true
            break
        // Comms events
        case "LT":
        case "YC":
            parsedEvent.text = "Comms Fault"
            parsedEvent.commsState = false
            break
        case "LR":
        case "YK":
            parsedEvent.text = "Comms Restored"
            parsedEvent.commsState = true
            break
        // PA events
        case "PA":
            parsedEvent.text = "PA Triggered"
            parsedEvent.alarmState = true
            break
        case "PR":
            parsedEvent.text = "PA Restored"
            parsedEvent.alarmState = false
            break
        // System boot up
        case "RR":
            parsedEvent.text = "System Boot"
            parsedEvent.setState = setState.UNSET
            parsedEvent.alarmState = false
            break
        case "TA":
            parsedEvent.text = "Tamper Fault"
            break
        case "RX":
            parsedEvent.text = "Manual Comms Test"
            parsedEvent.commsState = true
            break
        case "RP":
            parsedEvent.text = "Automatic Comms Test"
            parsedEvent.commsState = true
            break
        case "LB":
            parsedEvent.text = "Engineer Access"
            break
        case "LX":
            parsedEvent.text = "Engineer Exit"
            break
        case "BR":
        case "CR":
            // Ignore these events
            return
        default:
            parsedEvent.text = "Unknown Event"
    }
    return parsedEvent
}

export async function handleSystemEvent(rawEvent: Event, publisher: Publisher): Promise<any> {
    let event=parseSystemEvent(rawEvent)
    
    // If an event has triggered the alarm
    if(event.alarmState){
        await publisher.publishJSON(subTopics.TRIGGERED, {
            state: event.alarmState,
            time: event.time,

        })
    }

    // If an event has set or unset the alarm
    if(event.setState){
        await publisher.publishJSON(subTopics.SET,
            {
                status: event.setState,
                time: event.time,
                fullSet: event.setState == setState.FULL,
                partSet: event.setState == setState.PART
            })
        // switch(event.setState){ // Set the extended value based topic
        //     case setState.UNSET:
        //         await publisher.publishJSON(subTopics.ARMED, { state: false })
        //         break
        //     case setState.FULL:
        //         await publisher.publishJSON(subTopics.ARMED, { state: true, part: false })
        //         break
        //     case setState.PART:
        //         await publisher.publishJSON(subTopics.ARMED, { state: true, part: true })
        //         break
        //     default:
        //         console.log(`${Date().toLocaleString()} Logic Error event.setState in handleSystemEvent()}`)
        // } 
    }

    // If an event is comms related
    if(event.commsState){
        await publisher.publishJSON(subTopics.COMMS,
            {
                status: event.commsState == true ? "Ok" : "Failed",
                time: event.time,
                ok: event.commsState
            })
    }

    // Publish each event to the last event topic
    await publisher.publishJSON(subTopics.LASTEVENT, { status: event.text })
}

export async function sendInitialSystemEventState(publisher: Publisher): Promise<any> {
    await publisher.publishJSON(subTopics.LASTEVENT, { status: "Waiting" })
    await publisher.publishJSON(subTopics.COMMS, { status: "Waiting" })
    await publisher.publishJSON(subTopics.SET, { status: "Waiting" })
    await publisher.publishJSON(subTopics.TRIGGERED, { state: false })
}