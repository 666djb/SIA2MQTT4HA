import {Publisher} from "./publisher";
import {ZoneEvent} from "./events/ZoneEvent";
import {getConfig} from "./config";
import {SIAServer} from "./sia/siaServer";
import {getZoneEventHandler} from "./handlers/ZoneEventHandler";
import {Event} from "./events/Event"

const config = getConfig();
const publisher = new Publisher(config.mqtt);
const siaServer = new SIAServer(config.sia);

siaServer.on('Ready', async function () {
    await publisher.publishOnline();
});

siaServer.on('ZoneEvent', async function (event: ZoneEvent) {

    const zoneConfig = config.zones[event.zone];
    const handler = getZoneEventHandler(zoneConfig);

    await handler.handleZoneEvent(event, publisher);
});

siaServer.on('Event', async function (event: Event) {
    console.log("On Event:",event);
    await publisher.publish("event",event)
});
