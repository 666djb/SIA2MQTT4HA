import { Event } from "../events/Event"
import { Publisher } from "../publisher"
import { Zones } from "../config"

const stateMap: { [code: string]: { state: boolean }}={
    "RO": {
        state: true,
    },
    "RC": {
        state: false
    }
}

export async function handleZoneEvent(event: Event, zones: Zones, publisher: Publisher): Promise<any> {
    let message={}

    // Get zone name
    if (!zones[parseInt(event.zone)]) {
        console.log(`${Date().toLocaleString()} Zone does not exist in config`)
        return
    // Check if code is sane
    } else if (!stateMap[event.code]){
        console.log(`${Date().toLocaleString()} Invalid state`)
        return
    } else {
        switch(zones[parseInt(event.zone)].type.toUpperCase()){
            case "PIR":
                message={occupancy: stateMap[event.code].state} // , time: event.time
                break
            case "DOOR":
                message={contact: stateMap[event.code].state} // , time: event.time
                break
            default:
                console.log(`${Date().toLocaleString()} Type is unknown`)
                return
        }
    }
    console.log(`${Date().toLocaleString()} ZoneEvent: ${event.zone} ${stateMap[event.code].state}`)
    return await publisher.publishJSON(`zone_${event.zone}`, message)
}
