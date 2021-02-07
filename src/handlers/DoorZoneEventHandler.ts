import { ZoneEventHandler } from "./ZoneEventHandler"
import { Event } from "../events/Event"
import { Publisher } from "../publisher"
import { ZoneConfig } from "../config"

const stateMap: { [state: string]: string } = {
    "RO": "open",
    "RC": "closed"
}

export class DoorZoneEventHandler implements ZoneEventHandler {

    constructor(private zoneConfig: ZoneConfig) { }

    async handleZoneEvent(event: Event, publisher: Publisher): Promise<any> {
        let state = stateMap[event.code]

        if (state) {
            return await publisher.publish(`${this.zoneConfig.name}`, state)
        } else {
            console.log("handZoneEvent_door(): no code match for:", state)
        }
    }
}
