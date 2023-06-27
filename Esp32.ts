/*******************************************************************************
 * MakeCode extension for esp32 Wifi module.
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

/**
 * Blocks for esp32 WiFi module.
 */
//% weight=10 color=#ff8000 icon="\uf1eb" block="Esp32 WiFi"
namespace Esp32 {

    let thingspeak_connected = false
    // Flag to indicate whether the esp32 was initialized successfully.
    let esp32Initialized = false

    // Buffer for data received from UART.
    let rxData = ""

    // Flag to indicate whether the SNTP time is initialized.
    let internetTimeInitialized = false

    // Flag to indicate whether the SNTP time is updated successfully.
    let internetTimeUpdated = false
    
    // Time and date.
    let year = 0, month = 0, day = 0, weekday = 0, hour = 0, minute = 0, second = 0

    /**
     * Send AT command and wait for response.
     * Return true if expected response is received.
     * @param command The AT command without the CRLF.
     * @param expected_response Wait for this response.
     * @param timeout Timeout in milliseconds.
     */
    //% blockHidden=true
    //% blockId=esp32_send_command
    export function sendCommand(command: string, expected_response: string = null, timeout: number = 100): boolean {
        // Wait a while from previous command.
        basic.pause(10)

        // Flush the Rx buffer.
        serial.readString()
        rxData = ""

        // Send the command and end with "\r\n".
        serial.writeString(command + "\r\n")

        // Don't check if expected response is not specified.
        if (expected_response == null) {
            return true
        }

        // Wait and verify the response.
        let result = false
        let timestamp = input.runningTime()
        while (true) {
            // Timeout.
            if (input.runningTime() - timestamp > timeout) {
                result = false
                break
            }

            // Read until the end of the line.
            rxData += serial.readString()
            if (rxData.includes("\r\n")) {
                // Check if expected response received.
                if (rxData.slice(0, rxData.indexOf("\r\n")).includes(expected_response)) {
                    result = true
                    break
                }

                // If we expected "OK" but "ERROR" is received, do not wait for timeout.
                if (expected_response == "OK") {
                    if (rxData.slice(0, rxData.indexOf("\r\n")).includes("ERROR")) {
                        result = false
                        break
                    }
                }

                // Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
            }
        }

        return result
    }



    /**
     * Get the specific response from esp32.
     * Return the line start with the specific response.
     * @param command The specific response we want to get.
     * @param timeout Timeout in milliseconds.
     */
    //% blockHidden=true
    //% blockId=esp32_get_response
    export function getResponse(response: string, timeout: number = 200): string {
        let responseLine = ""
        let timestamp = input.runningTime()
        while (true) {
            // Timeout.
            if (input.runningTime() - timestamp > timeout) {
                // Check if expected response received in case no CRLF received.
                if (rxData.includes(response)) {
                    responseLine = rxData
                }
                
                break
            }

            // Read until the end of the line.
            rxData += serial.readString()
            if (rxData.includes("\r\n")) {
                // Check if expected response received.
                if (rxData.slice(0, rxData.indexOf("\r\n")).includes(response)) {
                    responseLine = rxData.slice(0, rxData.indexOf("\r\n"))

                    // Trim the Rx data for next call.
                    rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
                    break
                }

                // Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.indexOf("\r\n") + 2)
            }
        }

        return responseLine
    }



    /**
     * Format the encoding of special characters in the url.
     * @param url The url that we want to format.
     */
    //% blockHidden=true
    //% blockId=esp32_format_url
    export function formatUrl(url: string): string {
        url = url.replaceAll("%", "%25")
        url = url.replaceAll(" ", "%20")
        url = url.replaceAll("!", "%21")
        url = url.replaceAll("\"", "%22")
        url = url.replaceAll("#", "%23")
        url = url.replaceAll("$", "%24")
        url = url.replaceAll("&", "%26")
        url = url.replaceAll("'", "%27")
        url = url.replaceAll("(", "%28")
        url = url.replaceAll(")", "%29")
        url = url.replaceAll("*", "%2A")
        url = url.replaceAll("+", "%2B")
        url = url.replaceAll(",", "%2C")
        url = url.replaceAll("-", "%2D")
        url = url.replaceAll(".", "%2E")
        url = url.replaceAll("/", "%2F")
        url = url.replaceAll(":", "%3A")
        url = url.replaceAll(";", "%3B")
        url = url.replaceAll("<", "%3C")
        url = url.replaceAll("=", "%3D")
        url = url.replaceAll(">", "%3E")
        url = url.replaceAll("?", "%3F")
        url = url.replaceAll("@", "%40")
        url = url.replaceAll("[", "%5B")
        url = url.replaceAll("\\", "%5C")
        url = url.replaceAll("]", "%5D")
        url = url.replaceAll("^", "%5E")
        url = url.replaceAll("_", "%5F")
        url = url.replaceAll("`", "%60")
        url = url.replaceAll("{", "%7B")
        url = url.replaceAll("|", "%7C")
        url = url.replaceAll("}", "%7D")
        url = url.replaceAll("~", "%7E")
        return url
    }



    /**
     * Return true if the esp32 is already initialized.
     */
    //% weight=30
    //% blockGap=8
    //% blockId=esp32_is_esp32_initialized
    //% block="esp32 initialized"
    export function isesp32Initialized(): boolean {
        return esp32Initialized
    }

    ////////////////////////////////
    //            RTC             //
    ////////////////////////////////

    /**
     * Alarm repeat type
     */

    /**
     * Initialize the esp32.
     * @param tx Tx pin of micro:bit. eg: SerialPin.P16
     * @param rx Rx pin of micro:bit. eg: SerialPin.P15
     * @param baudrate UART baudrate. eg: BaudRate.BaudRate115200
     * 
     */
    //% weight=29
    //% blockGap=40
    //% blockId=esp32_init
    //% block="initialize esp32: Tx %tx Rx %rx Baudrate %baudrate"
    export function init(tx: SerialPin, rx: SerialPin, baudrate: BaudRate) {
        // Redirect the serial port.
        serial.redirect(tx, rx, baudrate)
        serial.setTxBufferSize(128)
        serial.setRxBufferSize(128)

        // Reset the flag.
        esp32Initialized = false

        // Restore the esp32 factory settings.
        if (sendCommand("AT+RESTORE", "ready", 5000) == false) {
            esp32Initialized = false
            return
            }

        // Turn off echo.
        if (sendCommand("ATE0", "OK") == false) {
            esp32Initialized = false
            return
        }


        // Initialized successfully.
        // Set the flag.
        esp32Initialized = true
    }



    /**
     * Return true if the esp32 is connected to WiFi router.
     */
    //% weight=28
    //% blockGap=8
    //% blockId=esp32_is_wifi_connected
    //% block="WiFi connected"
    export function isWifiConnected(): boolean {
        // Get the connection status.
        sendCommand("AT+CIPSTATUS")
        let status = getResponse("STATUS:", 1000)

        // Wait until OK is received.
        getResponse("OK")

        // Return the WiFi status.
        if ((status == "") || status.includes("STATUS:5")) {
            return false
        }
        else {
            return true
        }
    }



    /**
     * Connect to WiFi router.
     * @param ssid Your WiFi SSID.
     * @param password Your WiFi password.
     */
    //% weight=27
    //% blockGap=8
    //% blockId=esp32_connect_wifi
    //% block="connect to WiFi: SSID %ssid Password %password"
    export function connectWiFi(ssid: string, password: string) {
        // Set to station mode.
        sendCommand("AT+CWMODE=1", "OK")

        // Connect to WiFi router.
        sendCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", "OK", 20000)
    }


        /**
     * Return the year.
     */
    //% subcategory="Internet Time"
    //% weight=30
    //% blockGap=8
    //% blockId=esp32_get_year
    //% block="year"
    export function getYear(): number {
        return year
    }

    /**
     * Return the month.
     */
    //% subcategory="Internet Time"
    //% weight=29
    //% blockGap=8
    //% blockId=esp32_get_month
    //% block="month"
    export function getMonth(): number {
        return month
    }

    /**
     * Return the day.
     */
    //% subcategory="Internet Time"
    //% weight=28
    //% blockGap=8
    //% blockId=esp32_get_day
    //% block="day"
    export function getDay(): number {
        return day
    }

    /**
     * Return the day of week.
     */
    //% subcategory="Internet Time"
    //% weight=27
    //% blockGap=8
    //% blockId=esp32_get_weekday
    //% block="day of week"
    export function getWeekday(): number {
        return weekday
    }

    /**
     * Return the hour.
     */
    //% subcategory="Internet Time"
    //% weight=26
    //% blockGap=8
    //% blockId=esp32_get_hour
    //% block="hour"
    export function getHour(): number {
        return hour
    }

    /**
     * Return the minute.
     */
    //% subcategory="Internet Time"
    //% weight=25
    //% blockGap=8
    //% blockId=esp32_get_minute
    //% block="minute"
    export function getMinute(): number {
        return minute
    }

    /**
     * Return the second.
     */
    //% subcategory="Internet Time"
    //% weight=24
    //% blockGap=40
    //% blockId=esp32_get_second
    //% block="second"
    export function getSecond(): number {
        return second
    }



    /**
     * Return true if the internet time is initialzed successfully.
     */
    //% subcategory="Internet Time"
    //% weight=23
    //% blockGap=8
    //% blockId=esp32_is_internet_time_initialized
    //% block="internet time initialized"
    export function isInternetTimeInitialized(): boolean {
        return internetTimeInitialized
    }



    /**
     * Initialize the internet time.
     * @param timezone Timezone. eg: 8
     */
    //% subcategory="Internet Time"
    //% weight=22
    //% blockGap=40
    //% blockId=esp32_init_internet_time
    //% block="initialize internet time at timezone %timezone ntp pool %ntp "
    //% ntp.defl=0.europe.pool.ntp.org
    //% timezone.min=-11 timezone.max=13
    export function initInternetTime(timezone: number, ntp: string) {
        // Reset the flags.
        internetTimeInitialized = false
        internetTimeUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        // Enable the SNTP and set the timezone. Return if failed.
        if (sendCommand("AT+CIPSNTPCFG=1," + timezone + ",\"" + ntp + "\"", "OK", 500) == false) return

        internetTimeInitialized = true
        return
    }



    /**
     * Return true if the internet time is updated successfully.
     */
    //% subcategory="Internet Time"
    //% weight=21
    //% blockGap=8
    //% blockId=esp32_is_internet_time_updated
    //% block="internet time updated"
    export function isInternetTimeUpdated(): boolean {
        return internetTimeUpdated
    }



    /**
     * Update the internet time.
     * @param timezone Timezone. eg: 8
     */
    //% subcategory="Internet Time"
    //% weight=20
    //% blockGap=8
    //% blockId=esp32_update_internet_time
    //% block="update internet time"
    export function updateInternetTime() {
        // Reset the flag.
        internetTimeUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        // Make sure it's initialized.
        if (internetTimeInitialized == false) return

        // Wait until we get a valid time update.
        let responseArray
        let timestamp = input.runningTime()
        while (true) {
            // Timeout after 10 seconds.
            if (input.runningTime() - timestamp > 20000) {
                return
            }

            // Get the time.
            sendCommand("AT+CIPSNTPTIME?")
            let response = getResponse("+CIPSNTPTIME:", 2000)
            if (response == "") return

            // Fill up the time and date accordingly.
            response = response.slice(response.indexOf(":") + 1)
            responseArray = response.split(" ")

            // Remove the preceeding " " for each field.
            while (responseArray.removeElement(""));

            // If the year is still 1970, means it's not updated yet.
            if (responseArray[4] != "1970") {
                break
            }

            basic.pause(100)
        }

        // Day of week.
        switch (responseArray[0]) {
            case "Mon": weekday = 1; break
            case "Tue": weekday = 2; break
            case "Wed": weekday = 3; break
            case "Thu": weekday = 4; break
            case "Fri": weekday = 5; break
            case "Sat": weekday = 6; break
            case "Sun": weekday = 7; break
        }

        // Month.
        switch (responseArray[1]) {
            case "Jan": month = 1; break
            case "Feb": month = 2; break
            case "Mar": month = 3; break
            case "Apr": month = 4; break
            case "May": month = 5; break
            case "Jun": month = 6; break
            case "Jul": month = 7; break
            case "Aug": month = 8; break
            case "Sep": month = 9; break
            case "Oct": month = 10; break
            case "Nov": month = 11; break
            case "Dec": month = 12; break
        }

        // Day.
        day = parseInt(responseArray[2])

        // Time.
        let timeArray = responseArray[3].split(":")
        hour = parseInt(timeArray[0])
        minute = parseInt(timeArray[1])
        second = parseInt(timeArray[2])

        // Year.
        year = parseInt(responseArray[4])



        // Wait until OK is received.
        if (getResponse("OK") == "") return


        internetTimeUpdated = true
        return
    }
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
