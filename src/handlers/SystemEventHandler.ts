import { Event } from "../events/Event"
import { Publisher } from "../publisher"

// These are constants for the MQTT subtopics that events get published to
const SET = "set_status"
const ALARM = "alarm_status"
const COMMS = "comms_test"
const ARMED = "armed"
const TRIGGERED = "triggered"

const stateMap: { [state: string]: [string, string] } = {
    "CA": ["Full Set", SET],
    "CL": ["Full Set", SET],
    "CG": ["Part Set", SET],
    "OA": ["Unset", SET],
    "OG": ["Unset", SET],
    "OP": ["Unset", SET],
    "BA": ["Alarm", ALARM],
    "BF": ["Alarm", ALARM],
    "BL": ["Alarm", ALARM],
    "BV": ["Alarm Confirm", ALARM],
    "FA": ["Fire", ALARM],
    "FV": ["Fire Confirm", ALARM],
    "PA": ["Panic", ALARM],
    "TA": ["Tamper", ALARM],
    "OR": ["None", ALARM],
    "RP": ["Automatic Test", COMMS],
    "RX": ["Manual Test", COMMS]
}

export async function handleSystemEvent(event: Event, publisher: Publisher): Promise<any> {
    let state = stateMap[event.code]

    if (state) {
        // If this is an unset (or manual test) event then we assert that the alarm condition is none
        if (event.code == "OA" || event.code == "OG" || event.code == "OP" || event.code == "RX") {
            // Publish a status of None to the alarm subtopic
            await publisher.publishJSON(ALARM, { status: "None" })
        }
        // Publish the status to the relevant subtopic
        await publisher.publishJSON(`${state[1]}`, { status: state[0] })

        let subTopic = undefined
        let condition = undefined
        let partSet = undefined
        switch (state[0]) {
            case "Full Set":
                subTopic = ARMED
                condition = true
                partSet = false
                break
            case "Part Set":
                subTopic = ARMED
                condition = true
                partSet = true
                break
            case "Unset":
                subTopic = ARMED
                condition = false
                partSet = false
                break
            case "Alarm":
            case "Alarm Confirm":
            case "Fire":
            case "Fire Confirm":
            case "Panic":
            case "Tamper":
                subTopic = TRIGGERED
                condition = true
                break
            case "None":
                subTopic = TRIGGERED
                condition = false
                break
            default:
                break
        }

        // Publish the status to the relevant subtopic
        let message = (partSet != undefined) ? { state: condition, part: partSet } : { state: condition }
        console.log(`${Date().toLocaleString()} SystemEvent: ${state[0]}`)
        return await publisher.publishJSON(subTopic, message)
    }
    // If the state is not in the state map, just ignore it
}
