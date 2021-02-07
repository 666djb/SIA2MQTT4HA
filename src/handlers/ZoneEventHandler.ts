import { Event } from "../events/Event"
import { Publisher } from "../publisher"
import { DoorZoneEventHandler } from "./DoorZoneEventHandler"
import { ZoneConfig } from "../config"
import { PirZoneEventHandler } from "./PirZoneEventHandler"

export function getZoneEventHandler(zoneConfig: ZoneConfig): ZoneEventHandler {
    console.log("getZoneHandlder handler:", zoneConfig.handler)
    switch (zoneConfig.handler) {
        case "door": return new DoorZoneEventHandler(zoneConfig)
        case "pir": return new PirZoneEventHandler(zoneConfig)
    }
}

export interface ZoneEventHandler {
    handleZoneEvent(event: Event, publisher: Publisher): Promise<any>
}
