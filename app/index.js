'use strict'

var key
var words

da.segment.onpreprocess = function (trigger, args) {
    console.log('[onpreprocess]', { trigger: trigger, args: args })
    da.startSegment(trigger, args)
}

da.segment.onstart = function (trigger, args) {
    console.log('[onstart]', { trigger: trigger, args: args })
    da.getSegmentConfig({
        onsuccess: function (config) {
            console.log('[getSegmentConfig: onsuccess]', config)
            if (config.key) {
                key = config.key
                da.segment.onresume()
            } else {
                speak('Please configure your IFTTT key in the app.')
            }
        },

        onerror: function (error) {
            console.log('getSegmentConfig failed')
            speak('Failed to get the segment configuration.')
        }
    })
}

da.segment.onresume = function () {
    console.log('[onresume]')

    if (words === undefined) {
        var speechToText = new da.SpeechToText()
        speechToText.startSpeechToText(stt)
        return
    }

    var dataIndex = words.length
    for (var i = 1; i < words.length - 2; i++) {  // Has to have at least one word before and one word after phrase 'with data'
        if (words[i] === 'with' && words[i + 1] === 'data') {
            dataIndex = i
            break
        }
    }

    var event = words.slice(0, dataIndex).join('_').toLowerCase()
    var commands = words.slice(dataIndex + 2)
    var value1 = commands[0]
    var value2 = commands[1]
    var value3 = commands[2]

    ifttt(key, event, value1, value2, value3)
}

var stt = {
    onsuccess: function (results) {
        console.log('[startSpeechToText: onsuccess]', results)
        words = results
    },

    onerror: function (error) {
        console.log('[startSpeechToText: onerror]', error)
        speak(error.messsage)
    }
}

function ifttt(key, event, value1, value2, value3) {
    var url = da.getString('apiFormat', { key: key, event: event })
    var body = { value1: value1, value2: value2, value3: value3 }

    var xhr = da.getXhr()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                speak('Command has been sent.')
            } else {
                speak('Failed to send command.')
            }
        }
    }
    xhr.send(JSON.stringify(body))
}

function speak(text, stop = true) {
    var synthesis = da.SpeechSynthesis.getInstance()
    synthesis.speak(text, {
        onstart: function () {
            console.log('[speak: onstart]')
        },
        onend: function () {
            console.log('[speak: onend]')
            if (stop) da.stopSegment()
        },
        onerror: function (error) {
            console.log('[speak: onerror]', error)
            da.stopSegment()
        }
    })
}