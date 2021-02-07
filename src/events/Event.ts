//const regex = /^ti(?<time>[0-9]{2}:[0-9]{2})\/(?<id>[a-z,0-9]{5})\/(?<code>[A-Z]{2})$/mg
//const regex = /^ti(?<time>[0-9]{2}:[0-9]{2})\/|(?<group>ri[0-9]{3})?(?:\/)?|(?<peripheral>pi[0-9]{3})?|(?<user>id[0-9]{3})?(?:\/)?(?<code>[A-Z]{2}(?<zone>[0-9]{4})?)?/mg
//
// ti13:30/id249/RX

export class Event {

    //AaccountId: string
    // static accountId: string
    // static time: string
    // static groupModifier: string
    // static peripheralModifier: string
    // static userModifier: string
    // static vaModifier: string
    // static code: string
    // static zone: string
    // static text: string

    constructor(
        public accountId: string = "",
        public time: string = "",
        public groupModifier = "",
        public peripheralModifier = "",
        public userModifier = "",
        public vaModifier = "", // What is va?
        public code: string = "",
        public zone: string = "",
        public text: string = ""
    ) {
        // this.accountId=accountId
        // this.time=time
        // this.groupModifier=groupModifier
        // this.peripheralModifier=peripheralModifier
        // this.userModifier=userModifier
        // this.vaModifier=vaModifier
        // this.code=code
        // this.zone=zone
        // this.text=text
    }

    // public toJSON() : Object {
    //     return {
    //         accountId: this.accountId,
    //         time: this.time,
    //         groupModifier: this.groupModifier,
    //         peripheralModifier: this.peripheralModifier,
    //         userModifier: this.userModifier,
    //         vaModifier: this.vaModifier,
    //         code: this.code,
    //         zone: this.zone,
    //         text: this.text
    //     }
    // }

    static parse(eventData: string): Event {
        console.log("eventData:", eventData)

        let event = new Event()

        let split = eventData.split("/")

        //console.log("split:", split)

        // Must have time and code
        // May have time, group, peripheral, user, code, zone
        if (split.length < 2 || split[0].slice(0, 2) != "ti" || split[0].length != 7) {
            console.log("No time or code")
            return
        } else {
            event.time = split[0].slice(2, 7)
        }

        // For each modifier (there may be one or more)
        for (let i = 1; i < (split.length) - 1; i++) {
            switch (split[i].slice(0, 2)) { // This can be group, peripheral or user
                case "pi":
                    event.peripheralModifier = split[i].slice(2)
                    break
                case "ri":
                    event.groupModifier = split[i].slice(2)
                    break
                case "id":
                    event.userModifier = split[i].slice(2)
                    break
                case "va":
                    event.vaModifier = split[i].slice(2)
                    break
                default:
                    console.log("Error: unknown modifier")
                    return null
            }
        }

        // For the code and optional zone
        if (split[split.length - 1].length < 2) {
            console.log("Error: node code")
            return null
        } else {
            let thisSplit = split[split.length - 1].slice(0, 2)
            if (thisSplit === thisSplit.toUpperCase()) {
                event.code = thisSplit
                if (split[split.length - 1].length == 6) {
                    event.zone = split[split.length - 1].slice(2)
                }
            } else {
                console.log("Error: code")
                return null
            }
        }
        return event
    }
}