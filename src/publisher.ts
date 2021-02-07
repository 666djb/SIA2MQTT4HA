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
            clientId: "SIA2MQTT"
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

    public async publishOnline(): Promise<any> {

        let entities = [
            {
                type: "sensor",
                name: "Set Status",
                device_id: "sia2mqtt_alarmpanel",
                short_name: "set_status",
                unique_id: "sia2mqtt_alarmpanel_set_status",
                json_attributes_topic: "",
                value_template: '{{ value_json.status }}',
                initial_state: "Unset",
                icon: "mdi:security",
                device: {
                    identifiers: ["sia2mqtt_alarmpanel1"],
                    name: "AlarmPanel",
                    via_device: "sia2mqtt_bridge1"
                }
            },
            {
                type: "sensor",
                name: "Alarm Status",
                device_id: "sia2mqtt_alarmpanel",
                short_name: "alarm_status",
                unique_id: "sia2mqtt_alarmpanel_alarm_status",
                json_attributes_topic: "",
                value_template: '{{ value_json.status }}',
                initial_state: "None",
                icon: "mdi:bell",
                device: {
                    identifiers: ["sia2mqtt_alarmpanel1"],
                    name: "AlarmPanel",
                    via_device: "sia2mqtt_bridge1"
                }
            },
            {
                type: "sensor",
                name: "Comms Status",
                device_id: "sia2mqtt_alarmpanel",
                short_name: "comms_test",
                unique_id: "sia2mqtt_alarmpanel_comms_test",
                json_attributes_topic: "",
                value_template: '{{ value_json.status }}',
                initial_state: "None",
                icon: "mdi:check-network",
                device: {
                    identifiers: ["sia2mqtt_alarmpanel1"],
                    name: "AlarmPanel",
                    via_device: "sia2mqtt_bridge1"
                }
            },
            {
                type: "sensor",
                name: "Event",
                device_id: "sia2mqtt_alarmpanel",
                short_name: "event",
                unique_id: "sia2mqtt_alarmpanel_event",
                json_attributes_topic: "event_json",
                value_template: '{{ value_json.status }}',
                device: {
                    identifiers: ["sia2mqtt_alarmpanel1"],
                    name: "AlarmPanel",
                    via_device: "sia2mqtt_bridge1"
                }
            }
        ]

        try {
            // Set our availability to online
            await this.mqttClient.publish(`${this.config.baseTopic}/bridge/availability`,
                'online',
                { retain: true } as IClientPublishOptions)

            // Advertise our presence so we can be discovered
            // going to need to do this for all things: set/unset alarm zones that we want discovered
            for (let entity in entities) {
                let thisEntity = entities[entity]
                let entityDiscoveryTopic = `${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.device_id}/${thisEntity.short_name}/config`
                let entityData = JSON.stringify({
                    availability_topic: `${this.config.baseTopic}/bridge/availability`,
                    device: thisEntity.device,
                    name: thisEntity.name,
                    state_topic: `${this.config.baseTopic}/${thisEntity.short_name}`,
                    unique_id: thisEntity.unique_id,
                    icon: thisEntity.icon,
                    json_attributes_topic: thisEntity.json_attributes_topic,
                    value_template: thisEntity.value_template
                })

                await this.mqttClient.publish(entityDiscoveryTopic, entityData)
            }

            // Set initial statuses
            await this.mqttClient.publish(`${this.config.baseTopic}/alarm_status`, "None yet", { retain: true } as IClientPublishOptions)
            await this.mqttClient.publish(`${this.config.baseTopic}/set_status`, "None yet", { retain: true } as IClientPublishOptions)
            await this.mqttClient.publish(`${this.config.baseTopic}/comms_test`, "None yet", { retain: true } as IClientPublishOptions)

        } catch (ex) {
            console.log(ex)
        }
    }

    public async publish(subTopic: string, data: string, retain?: boolean) {
        console.log("retain:", retain||false)
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, data, {retain: retain||false} as IClientPublishOptions)
            console.log("Published: " + `${this.config.baseTopic}/${subTopic}/${data}`)
        } catch (error) {
            console.log(error)
        }
    }

    public async publishJSON(subTopic: string, data: object) {
        try {
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data))
            console.log("Published: " + `${this.config.baseTopic}/${subTopic}/${JSON.stringify(data)}`)
        } catch (error) {
            console.log(error)
        }
    }
}
