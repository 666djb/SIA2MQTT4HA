import { Event } from "../events/Event"
import { Publisher } from "../publisher"

const set = "set_status"
const alarm = "alarm_status"
const comms = "comms_test"
const json_attributes_topic = "event_json"

const stateMap: { [state: string]: [string, string] } = {
    "CA": ["Full Set", set],
    "CL": ["Full Set", set],
    "CG": ["Part Set", set],
    "OA": ["Unset", set],
    "OG": ["Unset", set],
    "BA": ["Alarm", alarm],
    "BF": ["Alarm", alarm],
    "BL": ["Alarm", alarm],
    "BV": ["Alarm Confirm", alarm],
    "FA": ["Fire", alarm],
    "FV": ["Fire Confirm", alarm],
    "PA": ["Panic", alarm],
    "TA": ["Tamper", alarm],
    "OR": ["None", alarm],
    "RP": ["Automatic Test", comms],
    "RX": ["Manual Test", comms]
}

export async function handleSystemEvent(event: Event, publisher: Publisher): Promise<any> {
    let state = stateMap[event.code]

    if (state) {
        // If this is an unset (or manual test) event then we assert that the alarm condition is none
        if(event.code == "OA" || event.code == "OG" || event.code == "RX") {
            //await publisher.publish(alarm, "None")
            await publisher.publishJSON(alarm, {status: "None", time: event.time})
        }
        //await publisher.publish(`${state[1]}`, state[0])
        await publisher.publishJSON(`${state[1]}`, {status: state[0], time: event.time})
        return 
    } else {
        console.log("handleSystemEvent() no code match for:", event.code)
    }
}
