import { createServer, Server, Socket } from 'net'
import { SiaServerConfig } from "../config"
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "../functionCodes"
import { Event } from "../events/Event"
import * as events from "events"

const ACK_SIA_BLOCK = new SIABlock(FunctionCodes.acknowledge, "")

export class SIAServer extends events.EventEmitter {

    server: Server

    constructor(config: SiaServerConfig) {
        super()
        this.server = createServer()
        this.server.on('connection', (socket: Socket) => this.handleConnection(socket))
        this.server.listen(config.port, () => this.listening())
    }

    listening() {
        console.log('SIA server listening')
        this.emit("Ready")
    }

    handleConnection(socket: Socket) {
        const emitter = this
        let eventText = ""
        let accountId = ""
        let event = new Event()

        const handleData = function (data: Buffer) {
            // Break down the received data in to a block with funcCode and data properties
            const block = SIABlock.fromBuffer(data)

            // Debugging:
            //console.log("block funcCode:",block.funcCode.toString(16))
            //console.log("block (ascii):",block.data)

            // The function code will decide what we do next
            // We expect to receive the following sequence of funcCodes on each connection from the alarm panel:
            // account_id, new_event_data, ascii for each message
            // end_of_data when all messages for this connection have been sent
            switch (block.funcCode) {
                case FunctionCodes.account_id:
                    accountId = block.data
                    break
                case FunctionCodes.new_event:
                    event = Event.parse(block.data)
                    break
                case FunctionCodes.ascii:
                    eventText = block.data
                    // Remove any leading space
                    eventText = eventText.replace(/^ /, "")
                    // Replace multiple spaces after first string with single space
                    eventText = eventText.replace(/ +/, " ")

                    // ASCII data is the last component of a message, so we check we've got all we need and emit the event message
                    if (event != null && accountId != "" && event.time != "" && event.code != "" && eventText != "") {
                        event.accountId = accountId
                        event.text = eventText

                        // Is this a zone event or a system event?
                        // RC and RO denote logged relay close and open events and with a Zone, they must be ZoneEvents
                        if ((event.code == "RC" || event.code == "RO") && event.zone.length > 0) {
                            emitter.emit("ZoneEvent", event)
                        } else {
                            emitter.emit("SystemEvent", event)
                            // Emit the raw event too
                            emitter.emit("Event", event)
                        }
                    } else {
                        console.log("Could not parse event, discarding")
                    }
                    break
                case FunctionCodes.end_of_data:
                    event = new Event()
                    break;
                default:
                    console.log("Unhandled funcCode:", FunctionCodes[block.funcCode])
                    break

            }
            socket.write(ACK_SIA_BLOCK.toBuffer())
        }
        socket.on('data', handleData)
    }
}
