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
        // Sensor fault events
        case "BT":
            parsedEvent.text = "Sensor Fault"
            break
        case "BJ":
            parsedEvent.text = "Sensor Restored"
            break
        // Mains fault events
        case "AT":
            parsedEvent.text = "Mains Fault"
            break
        case "AR":
            parsedEvent.text = "Mains Restored"
            break
        // Battery fault events
        case "YT":
            parsedEvent.text = "Battery Fault"
            break
        case "YR":
            parsedEvent.text = "Battery Restored"
            break
        // Fire alarm events
        case "FA":
            parsedEvent.text = "Fire Alarm Triggered"
            parsedEvent.alarmState = true
            break
        case "FV":
            parsedEvent.text = "Fire Alarm Confirmed"
            parsedEvent.alarmState = true
            break
        // Comms fault events
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
        // Tamper fault events
        case "TA":
            parsedEvent.text = "Tamper Fault"
            break
        // Comms test events
        case "RX":
            parsedEvent.text = "Manual Comms Test"
            parsedEvent.commsState = true
            break
        case "RP":
            parsedEvent.text = "Automatic Comms Test"
            parsedEvent.commsState = true
            break
        // Engineer events
        case "LB":
            parsedEvent.text = "Engineer Access"
            break
        case "LX":
            parsedEvent.text = "Engineer Exit"
            break
        // Remote (e.g. RSS) events
        case "RS":
            parsedEvent.text = "Remote Access"
            break
        // Ignore these events
        case "BR":
        case "CR":
            return undefined
        default:
            parsedEvent.text = "Unknown Event"
    }
    return parsedEvent
}

export async function handleSystemEvent(rawEvent: Event, publisher: Publisher): Promise<any> {
    let event=parseSystemEvent(rawEvent)

    // Ignore ignored events
    if(event==undefined){
        return
    }
    
    // If an event has triggered the alarm
    if(event.alarmState){
        await publisher.publishJSON(subTopics.TRIGGERED, {
            state: event.alarmState,
            time: event.time
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
    await publisher.publishJSON(subTopics.LASTEVENT,
        {
            status: event.text,
            time: event.time
        })
}

export async function sendInitialSystemEventState(publisher: Publisher): Promise<any> {
    await publisher.publishJSON(subTopics.LASTEVENT,
        {
            status: "Waiting",
            time: "00:00"
        })
    await publisher.publishJSON(subTopics.COMMS,
        {
            status: "Waiting",
            time: "00:00",
            ok: true
        })
    await publisher.publishJSON(subTopics.SET,
        {
            status: "Waiting",
            time: "00:00",
            fullSet: false,
            partSet: false
        })
    await publisher.publishJSON(subTopics.TRIGGERED,
        {
            state: false,
            time: "00:00"
        })
}