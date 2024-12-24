import { IClientOptions, IClientPublishOptions } from "mqtt"
import MQTT, { AsyncMqttClient } from 'async-mqtt'
import { MqttConfig, Zones } from "./config"

export class Publisher {

    mqttClient: AsyncMqttClient;

    constructor(private config: MqttConfig, private zones: Zones) {
        const options = {
            will: {
                topic: `${config.baseTopic}/bridge/availability`,
                payload: 'offline',
                retain: true,
            },
            username: config.username,
            password: config.password,
            clientId: "SIA2MQTT4HA"
        } as IClientOptions

        this.mqttClient = MQTT.connect(config.brokerUrl, options)

        this.mqttClient.on("connect", () => {
            console.log(`${Date().toLocaleString()} Connected to MQTT broker`)
            this.publishOnline()
        })

        this.mqttClient.on("reconnect", () => {
            console.log(`${Date().toLocaleString()} Reconnecting to MQTT broker`)
        })

        this.mqttClient.on("disconnect", () => {
            console.log(`${Date().toLocaleString()} Disconnected from MQTT broker`)
        })
    }

    private async publishOnline(): Promise<any> {
        const availability=[
            {
                topic: `${this.config.baseTopic}/bridge/availability`
            }
        ]

        // There is one device for SIA2MQTT4HA we call this sia2mqtt4ha_alarmpanel
        // All of the entities belong to this device
        let device = {
            identifiers: ["sia2mqtt4ha_alarmpanel"],
            name: "AlarmPanel",
            manufacturer: "SIA2MQTT4HA",
            model: "SIA2MQTT4HA App",
            sw_version: "0.1"
        }

        // These are the standard entities: set_status, alarm_status, comms_test and event
        // all which will appear in HA under $baseTopic and will have JSON formatted messages
        // published to them.
        let statusEntities = [
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/set_status`,
                json_attributes_topic: `${this.config.baseTopic}/set_status`,
                name: "Set Status",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_set_status",
                value_template: '{{ value_json.status }}',
                icon: "mdi:security",
                platform: "sensor"
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/last_event`,
                json_attributes_topic: `${this.config.baseTopic}/last_event`,
                name: "Last Event",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_last_event",
                value_template: '{{ value_json.status }}',
                icon: "mdi:comment",
                platform: "sensor"
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/comms_test`,
                json_attributes_topic: `${this.config.baseTopic}/comms_test`,
                name: "Comms Status",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_comms_test",
                value_template: '{{ value_json.status }}',
                icon: "mdi:check-network",
                platform: "sensor",
                force_update: true
            },
            {
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/event`,
                json_attributes_topic: `${this.config.baseTopic}/event`,
                name: "Event",
                type: "sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_event",
                value_template: '{{ value_json.code }}',
                icon: "mdi:flag",
                platform: "sensor",
                entity_category: "diagnostic"
            }
        ]

        // Add the Zone entities (as defined in the config file)
        let zoneEntities=[]
        for(let i in this.zones){
            let device_class
            let template
            if(this.zones[i].type.toUpperCase()=="DOOR"){
                device_class="door"
                template="contact"
            }else{
                device_class="motion"
                template="occupancy"
            }

            let zoneEntity={
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/zone_${i}`,
                json_attributes_topic: `${this.config.baseTopic}/zone_${i}`,
                name: this.zones[i].name,
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_zone_" + i,
                value_template: `{{ value_json.${template} }}`,
                device_class: device_class,
                payload_off: false,
                payload_on: true,
                platform: "binary_sensor"
            }

            zoneEntities.push(zoneEntity)
        }

        let binaryEntities = [
            { // Entity representing system armed state (true, false)
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/armed`,
                json_attributes_topic: `${this.config.baseTopic}/armed`,
                name: "Armed",
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_armed",
                value_template: '{{ value_json.state }}',
                payload_off: false,
                payload_on: true,
                icon: "mdi:security",
                platform: "binary_sensor",
                entity_category: "diagnostic"
            },
            { // Entity representing part armed state (true, false)
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/armed`,
                json_attributes_topic: `${this.config.baseTopic}/armed`,
                name: "Part Armed",
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_part_armed",
                value_template: '{{ value_json.part }}',
                payload_off: false,
                payload_on: true,
                icon: "mdi:security",
                platform: "binary_sensor",
                entity_category: "diagnostic"
            },
            { // Entity representing alarm sounding state (true, false)
                availability: availability,
                device: device,
                state_topic: `${this.config.baseTopic}/triggered`,
                json_attributes_topic: `${this.config.baseTopic}/triggered`,
                name: "Triggered",
                type: "binary_sensor",
                unique_id: "sia2mqtt4ha_alarmpanel_triggered",
                value_template: '{{ value_json.state }}',
                payload_off: false,
                payload_on: true,
                icon: "mdi:bell",
                platform: "binary_sensor",
                entity_category: "diagnostic"
            }
        ]

        try {
            // Set our bridge availability to online
            await this.publish("bridge/availability", "online", true)

            // Advertise the presence of all standard entities so they can be discovered
            for (let entity in statusEntities) {
                let thisEntity = statusEntities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.unique_id}/config`
                await this.publishJSONdiscovery(entityDiscoveryTopic, statusEntities[entity], true)
            }

            // Advertise the presence of all zone entities so they can be discovered
            for (let entity in zoneEntities) {
                let thisEntity = zoneEntities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.unique_id}/config`
                await this.publishJSONdiscovery(entityDiscoveryTopic, zoneEntities[entity], true)
            }

            // Advertise the presence of all binary entities so they can be discovered
            for (let entity in binaryEntities) {
                let thisEntity = binaryEntities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.unique_id}/config`
                await this.publishJSONdiscovery(entityDiscoveryTopic, binaryEntities[entity], true)
            }

            // Set initial statuses for standard entities
            //await this.publishJSON("alarm_status", {status: "None yet"})
            //await this.publishJSON("set_status", {status: "None yet"})
            //await this.publishJSON("comms_test", {status: "None yet"})

            // Set initial statuses for binary entities
            //await this.publishJSON("armed", {state: false, part: false})
            //await this.publishJSON("alarm", {state: false})

        } catch (error) {
            console.log(`${Date().toLocaleString()} publishOnline() error: ${error}`)
        }
    }

    public async publish(subTopic: string, data: string, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, data,
                {retain: retain||false} as IClientPublishOptions)
        } catch (error) {
            throw `publish() error ${error}`
        }
    }

    public async publishJSON(subTopic: string, data: object, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data),
                {retain: retain||false} as IClientPublishOptions)
        } catch (error) {
            throw `publishJSON() error ${error}`
        }
    }

    public async publishJSONdiscovery(discoveryTopic: string, data: object, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${discoveryTopic}`, JSON.stringify(data),
                {retain: retain||false} as IClientPublishOptions)
        } catch (error) {
            throw `publishJSONdiscovery() error ${error}`
        }
    }
}
