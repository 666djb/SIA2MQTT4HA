
import yaml from 'js-yaml';
import fs from 'fs';

export interface Config {
    mqtt: MqttConfig
    sia: SiaServerConfig
    zones: { [zoneId: string] : ZoneConfig; };
}

export interface SiaServerConfig {
    port: number
}

export interface MqttConfig {
    brokerUrl: string
    baseTopic: string
    username: string
    password: string
    discoveryTopic: string
}

export interface ZoneConfig {
    name: string;
    handler: string;
}

export function getConfig() : Config {
    return yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'));
}
