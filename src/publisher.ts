import { IClientOptions, IClientPublishOptions } from "mqtt"
import MQTT, { AsyncMqttClient } from 'async-mqtt'
import { MqttConfig } from "./config"

export class Publisher {

    mqttClient: AsyncMqttClient;

    constructor(private config: MqttConfig) {
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
            console.log("Connected to MQTT broker")
            this.publishOnline()
        })

        this.mqttClient.on("disconnect", () => {
            console.log("Disconnected from MQTT broker")
        })
    }

    private async publishOnline(): Promise<any> {
        // There is one device for SIA2MQTT we call this sia2mqtt_alarmpanel
        // All of the entities belong to this device
        let device = {
            identifiers: ["sia2mqtt4ha_alarmpanel"],
            name: "AlarmPanel",
            manufacturer: "SIA2MQTT4HA",
            model: "SIA2MQTT4HA App",
            sw_version: "0.1",
            via_device: "sia2mqtt4ha_bridge1"
        }

        // These are the standard entities: set_status, alarm_status, comms_test and event
        // all which will appear in HA under $baseTopic and will have JSON formatted messages
        // published to them.
        let entities = [
            {
                type: "sensor",
                name: "Set Status",
                device_id: "sia2mqtt4ha_alarmpanel",
                short_name: "set_status",
                unique_id: "sia2mqtt4ha_alarmpanel_set_status",
                value_template: '{{ value_json.status }}',
                icon: "mdi:security"
            },
            {
                type: "sensor",
                name: "Alarm Status",
                device_id: "sia2mqtt4ha_alarmpanel",
                short_name: "alarm_status",
                unique_id: "sia2mqtt4ha_alarmpanel_alarm_status",
                value_template: '{{ value_json.status }}',
                icon: "mdi:bell"
            },
            {
                type: "sensor",
                name: "Comms Status",
                device_id: "sia2mqtt4ha_alarmpanel",
                short_name: "comms_test",
                unique_id: "sia2mqtt4ha_alarmpanel_comms_test",
                value_template: '{{ value_json.status }}',
                icon: "mdi:check-network"
            },
            {
                type: "sensor",
                name: "Event",
                device_id: "sia2mqtt4ha_alarmpanel",
                short_name: "event",
                unique_id: "sia2mqtt4ha_alarmpanel_event",
                value_template: '{{ value_json.code }}',
                icon: "mdi:flag"
            }
        ]

        try {
            // Set our availability to online
            await this.mqttClient.publish(`${this.config.baseTopic}/bridge/availability`,
                'online',
                { retain: true } as IClientPublishOptions)

            // Advertise the presence of all entities so they can be discovered
            for (let entity in entities) {
                let thisEntity = entities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.device_id}/${thisEntity.short_name}/config`
                let entityData = {
                    availability_topic: `${this.config.baseTopic}/bridge/availability`,
                    device: device,
                    name: thisEntity.name,
                    state_topic: `${this.config.baseTopic}/${thisEntity.short_name}`,
                    unique_id: thisEntity.unique_id,
                    icon: thisEntity.icon,
                    json_attributes_topic: `${this.config.baseTopic}/${thisEntity.short_name}`,
                    value_template: thisEntity.value_template
                }

                //await this.mqttClient.publish(entityDiscoveryTopic, entityData, { retain: true } as IClientPublishOptions)
                await this.publishJSON(entityDiscoveryTopic, entityData, true)
            }

            // Set initial statuses
            await this.publishJSON("alarm_status", {status: "None yet", time: "00:00"}, true)
            await this.publishJSON("set_status", {status: "None yet", time: "00:00"}, true)
            await this.publishJSON("comms_test", {status: "None yet", time: "00:00"}, true)

        } catch (ex) {
            console.log(ex)
        }
    }

    public async publish(subTopic: string, data: string, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify({status: data}),
                {retain: retain||false} as IClientPublishOptions)
            console.log("Published: " + `${this.config.baseTopic}/${subTopic}/${data}`)
        } catch (error) {
            console.log(error)
        }
    }

    public async publishJSON(subTopic: string, data: object, retain?: boolean) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data),
                {retain: retain||false} as IClientPublishOptions)
            console.log("Published: " + `${this.config.baseTopic}/${subTopic}/${JSON.stringify(data)}`)
        } catch (error) {
            console.log(error)
        }
    }
}
