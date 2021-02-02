import {IClientOptions, IClientPublishOptions} from "mqtt";
import MQTT, {AsyncMqttClient} from 'async-mqtt';
import {MqttConfig} from "./config";

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
        } as IClientOptions;

        this.mqttClient = MQTT.connect(config.brokerUrl, options);

        this.mqttClient.on("connect", () => {
            console.log("Connected to MQTT broker")
        })

        this.mqttClient.on("disconnect", () => {
            console.log("Disconnected from MQTT broker")
        })
    }

    public async publishOnline() : Promise<any> {

        let entities = [
                // {
                //     type: "sensor",
                //     name: "sia2mqtt Bridge",
                //     device_id: "sia2mqtt",
                //     short_name: "bridge",
                //     unique_id: "sia2mqtt_bridge",
                //     initial_state: "on",
                //     device: {
                //         identifiers: ["sia2mqtt_bridge1"],
                //         name: "SIA2MQTT Bridge"
                //     }
                // },
                {
                    type: "sensor",
                    name: "Alarm Panel Set Status",
                    device_id: "sia2mqtt_alarmpanel",
                    short_name: "set_status",
                    unique_id: "sia2mqtt_alarmpanel_set_status",
                    device: {
                        identifiers: ["sia2mqtt_alarmpanel1"],
                        name: "AlarmPanel",
                        via_device: "sia2mqtt_bridge1"
                    }
                },
                {
                    type: "sensor",
                    name: "Alarm Panel Alarm Status",
                    device_id: "sia2mqtt_alarmpanel",
                    short_name: "alarm_status",
                    unique_id: "sia2mqtt_alarmpanel_alarm_status",
                    device: {
                        identifiers: ["sia2mqtt_alarmpanel1"],
                        name: "AlarmPanel",
                        via_device: "sia2mqtt_bridge1"
                    }
                },
                {
                    type: "binary_sensor",
                    name: "Landing PIR",
                    device_id: "sia2mqtt_zone1021",
                    short_name: "zone1021",
                    unique_id: "sia2mqtt_zone1021_zone1021",
                    device_class: "motion",
                    initial_state: "off",
                    device: {
                        identifiers: ["sia2mqtt_zone1021"],
                        name: "PIR zone1021",
                        via_device: "sia2mqtt_bridge1"
                    }
                },
            ]

        try {
            // Advertise our presence so we can be discovered
            // going to need to do this for all things: set/unset alarm zones that we want discovered
            for(let entity in entities){
                let thisEntity=entities[entity]
                let entityDiscoveryTopic=`${this.config.discoveryTopic}/${thisEntity.type}/${thisEntity.device_id}/${thisEntity.short_name}/config`
                let entityData=JSON.stringify({
                    availability_topic: `${this.config.baseTopic}/bridge/availability`,
                    device: thisEntity.device,
                    name: thisEntity.name,
                    state_topic: `${this.config.baseTopic}/${thisEntity.short_name}`,
                    unique_id: thisEntity.unique_id
                })

                //console.log("discovery topic:", entityDiscoveryTopic)
                //console.log("data:", entityData)

                await this.mqttClient.publish(entityDiscoveryTopic, entityData)
            }

            await this.mqttClient.publish(`${this.config.baseTopic}/bridge/availability`,
                'online',
                { retain : true } as IClientPublishOptions);

            // Testing: set the alarm status
            await this.mqttClient.publish(`${this.config.baseTopic}/alarm_status`, "ALARM")

            // Testing: set the alarm set status
            await this.mqttClient.publish(`${this.config.baseTopic}/set_status`, "FULL SET")

        } catch(ex) {
            console.log(ex);
        }
    }

    public async publish(subTopic: string, data: object) {
        console.log("Publishing to MQTT")
        try{
            await this.mqttClient.publish(`${this.config.baseTopic}/${subTopic}`, JSON.stringify(data))
        } catch(error){
            console.log(error)
        }
    }
}
