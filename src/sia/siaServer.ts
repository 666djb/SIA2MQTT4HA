import {createServer, Server, Socket} from 'net';
import {SiaServerConfig} from "../config";
import {SIABlock} from "./siaBlock";
import {FunctionCodes} from "../functionCodes";
import {ZoneEvent} from "../events/ZoneEvent";
import {Event} from "../events/Event"
import * as events from "events";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const ACK_SIA_BLOCK = new SIABlock(FunctionCodes.acknoledge, "");

export declare type OnZoneEventCallback = (zoneEvent: ZoneEvent) => void

export class SIAServer extends events.EventEmitter {

    server : Server;

    constructor(config: SiaServerConfig) {
        super();
        this.server = createServer();
        this.server.on('connection', (socket: Socket) => this.handleConnection(socket));
        this.server.listen(config.port, () => this.listening());
    }

    listening() {
        console.log('SIA server listening');
        this.emit("Ready");
    }

    handleConnection(socket: Socket) {
        const emitter = this;
        let accountId=""
        let eventText=""
        let event=new Event()

        const handleData = function (data: Buffer) {

            // Break down the received data in to a block with funcCode and data properties
            const block = SIABlock.fromBuffer(data);

            console.log("Got data:",block.data)

            // The function code will decide what we do next
            // We expect to receive the following sequence of funcCodes: account_id, new_event_data, end_of_data when a new reportable event occurs
            // If we don't get this sequence, we don't emit the event
            
            switch(block.funcCode){
                case FunctionCodes.account_id:
                    console.log("Got accountId")
                    accountId=block.data
                    break
                case FunctionCodes.new_event:
                    console.log("Got newEvent")
                    event=Event.parse(block.data)
                    break
                case FunctionCodes.ascii:
                    console.log("Got ascii")
                    eventText=block.data
                    break
                case FunctionCodes.end_of_data:
                    console.log("Got endOfData")
                    if(event!=null && accountId!="" && event.time!="" && event.code!="" && eventText!=""){
                        event.accountId=accountId
                        event.text=eventText
                        console.log("Emitting event")
                        emitter.emit("Event", event);
                    }else{
                        console.log("Could not parse event, discarding")
                    }
                    // Reset the event object
                    event = new Event()
                    break;
                default:
                    console.log("Unhandled funcCode:", FunctionCodes[block.funcCode])
                    break

            }
            
            //let zoneEvent=ZoneEvent.tryParse(block.data);
            // if(zoneEvent==null){
            //     eventString=eventString+" zoneEvent=null";
            // }else{
            //     eventString=eventString+" "+zoneEvent.time+" "+zoneEvent.zone+" "+zoneEvent.state;
            // }
            //eventString=eventString+" funcCode:"+block.funcCode;

            socket.write(ACK_SIA_BLOCK.toBuffer());
        };

        socket.on('data', handleData);
    }
}
