import { createServer, Server, Socket } from 'net'
import { SiaServerConfig } from "../config"
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "../functionCodes"
import { Event } from "../events/Event"
import * as events from "events"
//import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants'

const ACK_SIA_BLOCK = new SIABlock(FunctionCodes.acknoledge, "")

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
        let accountId = ""
        let eventText = ""
        let event = new Event()

        const handleData = function (data: Buffer) {
            // Break down the received data in to a block with funcCode and data properties
            const block = SIABlock.fromBuffer(data)

            // The function code will decide what we do next
            // We expect to receive the following sequence of funcCodes: account_id, new_event_data, end_of_data when a new reportable event occurs
            // If we don't get this sequence, we don't emit the event
            switch (block.funcCode) {
                case FunctionCodes.account_id:
                    accountId = block.data
                    break
                case FunctionCodes.new_event:
                    event = Event.parse(block.data)
                    break
                case FunctionCodes.ascii:
                    eventText = block.data
                    break
                case FunctionCodes.end_of_data:
                    if (event != null && accountId != "" && event.time != "" && event.code != "" && eventText != "") {
                        event.accountId = accountId
                        event.text = eventText

                        // Is this a zone event or a system event?
                        if (event.zone.length > 0) {
                            emitter.emit("ZoneEvent", event)
                        } else {
                            emitter.emit("SystemEvent", event)
                        }

                        // Emit the raw event too
                        emitter.emit("Event", event)
                    } else {
                        console.log("Could not parse event, discarding")
                    }
                    // Reset the event object
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
