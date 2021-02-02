//const regex = /^ti(?<time>[0-9]{2}:[0-9]{2})\/((?<group>ri[0-9]{3})(?:\/)|(?<peripheral>pi[0-9]{3})(?:\/)|(?<user>id[0-9]{3})(?:\/))|(?<code>[A-Z]{2})/
//const regex = /^ti(?<time>[0-9]{2}:[0-9]{2}\/)(?<group>ri[0-9]{3}\/)?(?<peripheral>pi[0-9]{3}\/)?(?<code>[A-Z]{2})/g
//const regex = /^ti(?<time>[0-9]{2}:[0-9]{2}\/).*(?<group>ri[0-9]{3}\/)?.*(?<code>[A-Z]{2})/g


let input="ti21:15/pi000/ri000/id000/LX0000"
//let input="ti21:15/pipipipipipipi"


let split=input.split("/")

console.log("split:",split)

// Must have time and code
// May have time, group, peripheral, user, code, zone
if(split.length<2 || split[0].slice(0,2)!="ti" || split[0].length!=7){
    console.log("No time or code")
    return
}else{
    ti=split[0].slice(2,7)
}

// For each modifiers
for(let i=1; i<(split.length)-1; i++){
    switch (split[i].slice(0,2)){ // This can be group, peripheral or user
        case "pi":
            pi=split[i].slice(2)
            break
        case "ri":
            ri=split[i].slice(2)
            break
        case "id":
            id=split[i].slice(2)
            break
        default:
            console.log("Error: unknown modifier")
     }
}

// For the code and optional zone
if(split[split.length-1].length<2){
    console.log("Error: node code")
    return
}else{
    let thisSplit=split[split.length-1].slice(0,2)
    if(thisSplit===thisSplit.toUpperCase()){
        code=thisSplit
        if(split[split.length-1].length==6){
            zone=split[split.length-1].slice(2)
        }
    }else{
        console.log("Error: code")
        return
    }
    
}

let output={
    ti: ti,
    pi: pi,
    ri: ri,
    id: id,
    code: code,
    zone: zone
}

console.log(output)


