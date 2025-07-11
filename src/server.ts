import { Publisher } from "./publisher"
import { getConfig, parseZones } from "./config"
import { SIAServer } from "./sia/siaServer"
import { handleZoneEvent } from "./handlers/ZoneEventHandler"
import { Event } from "./events/Event"
import { handleSystemEvent, sendInitialSystemEventState } from "./handlers/SystemEventHandler"

console.log(`${Date().toLocaleString()} Starting SIA2MQTT4HA`)

const CONFIG_FILE = "/data/options.json"

const config = getConfig(CONFIG_FILE)

// Parse zones once
let zones = parseZones(config)
if (zones == null) {
    console.log(`${Date().toLocaleString()} Couldn't parse zones, maybe there are none`)
}

const publisher = new Publisher(config.mqtt, zones)
const siaServer = new SIAServer(config.sia)

// Publish initial values
sendInitialStates(publisher)

// This is used only for events that contain zone details
// it publishes to MQTT %baseTopic/zone
siaServer.on("ZoneEvent", async function (event: Event) {
    if (zones) {
        await handleZoneEvent(event, zones, publisher)
    }
})

// This is used when there is a non-zone event
// it publishes to MQTT $baseTopic/set|alarm|comms
siaServer.on("SystemEvent", async function (event: Event) {
    await handleSystemEvent(event, publisher)
})

// This is used for all events
// it publishes all raw event data to MQTT $baseTopic/event
siaServer.on("Event", async function (event: Event) {
    await publisher.publishJSON("event", event)
})

async function sendInitialStates(publisher: Publisher){
    try{
        await sendInitialSystemEventState(publisher)
    } catch (error) {
        console.log(`Error publishing initial states`)
    }
}