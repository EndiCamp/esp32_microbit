
/**
* Utilice este archivo para definir funciones y bloques personalizados.
* Lea más en https://makecode.microbit.org/blocks/custom
*/
let thingspeak_connected = false



namespace Esp32 {
    
    /**
  * Return true if the internet time is updated successfully.
  */
    //% subcategory="Thingspeak"
    //% weight=21
    //% blockGap=8
    //% block="Upload data to ThingSpeak|URL/IP = %ip|Write API key = %write_api_key|Field 1 = %n1|Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7|Field 8 = %n8"
    //% ip.defl=api.thingspeak.com
    //% write_api_key.defl=your_write_api_key
    export function connectThingSpeak(ip: string, write_api_key: string, n1: number, n2: number, n3: number, n4: number, n5: number, n6: number, n7: number, n8: number) {
        if (Esp32.isWifiConnected && write_api_key != "") {
            thingspeak_connected = false
            Esp32.sendCommand("AT+CIPSTART=\"TCP\",\"" + ip + "\",80") // connect to website server
            let conectada = Esp32.getResponse("OK",1000) 
            basic.pause(100)
            if (conectada=="OK") {
                let last_upload_successful = ""
                let str: string = "GET /update?api_key=" + write_api_key + "&field1=" + n1 + "&field2=" + n2 + "&field3=" + n3 + "&field4=" + n4 + "&field5=" + n5 + "&field6=" + n6 + "&field7=" + n7 + "&field8=" + n8
                Esp32.sendCommand("AT+CIPSEND=" + (str.length + 2))
                Esp32.sendCommand(str) // upload data
                last_upload_successful = Esp32.getResponse("OK", 1000)
                basic.pause(100)
            }
        }
    }
}
