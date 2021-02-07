import { Publisher } from "./publisher"
import { getConfig } from "./config"
import { SIAServer } from "./sia/siaServer"
import { getZoneEventHandler } from "./handlers/ZoneEventHandler"
import { Event } from "./events/Event"
import { handleSystemEvent } from "./handlers/SystemEventHandler"

const config = getConfig()
const publisher = new Publisher(config.mqtt)
const siaServer = new SIAServer(config.sia)

// This is used to publish updates to zone entities
// it publishes to $baseTopic/zone
siaServer.on('ZoneEvent', async function (event: Event) {
    const zoneConfig = config.zones[event.zone]
    const handler = getZoneEventHandler(zoneConfig)
    await handler.handleZoneEvent(event, publisher)
})

// This is used when there is a system event such as set/unset
// it publishes to $baseTopic/set|alarm|comms
siaServer.on('SystemEvent', async function (event: Event) {
    await handleSystemEvent(event, publisher)
})

// This is used to publish raw event data
// it publishes to $baseTopic/event
siaServer.on('Event', async function(event: Event) {
    await publisher.publishJSON("event", event, true)
})
