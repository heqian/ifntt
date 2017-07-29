'use strict'

var key = ''
var sentences = []
var seperator = ' with parameters '

if (!da.outputLog) {
    da.outputLog = function (message) {
        console.log.apply(console, [message])
    }
}

da.segment.onpreprocess = function (trigger, args) {
    da.outputLog('[onpreprocess]', { trigger: trigger, args: args })
    da.startSegment(trigger, args)
}

da.segment.onstart = function (trigger, args) {
    da.outputLog('[onstart]', { trigger: trigger, args: args })
    da.getSegmentConfig({
        onsuccess: function (config) {
            da.outputLog('[getSegmentConfig: onsuccess]', config)
            if (config.key) {
                key = config.key
                da.segment.onresume()
            } else {
                speak('Please configure your IFTTT key in the app.')
            }
        },

        onerror: function (error) {
            da.outputLog('getSegmentConfig failed')
            speak('Failed to get the segment configuration.')
        }
    })
}

da.segment.onresume = function () {
    da.outputLog('[onresume]')

    if (sentences.length === 0) {
        var speechToText = new da.SpeechToText()
        speechToText.startSpeechToText(stt)
        return
    }

    // Only use the one with the highest confidence
    // e.g., ["turn on light", "turn on night"]
    // e.g., ["buy stock with parameters Sony one hundred"]
    var sentence = sentences[0]
    var sIndex = sentence.indexOf(seperator)

    if (sIndex < 1) sIndex = sentence.length
    var event = sentence.slice(0, sIndex).split(' ').join('_')
    var content = sentence.slice(sIndex + seperator.length)

    ifttt(key, event, content, sentence, seperator)
}

var stt = {
    onsuccess: function (results) {
        da.outputLog('[startSpeechToText: onsuccess]', results)
        sentences = results
    },

    onerror: function (error) {
        da.outputLog('[startSpeechToText: onerror]', error)
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
                speak('Sent: ' + sentences[0])
            } else {
                speak('Failed to send command.')
            }
        }
    }
    xhr.send(JSON.stringify(body))
}

function speak(text, stop) {
    if (stop === undefined) stop = true

    var synthesis = da.SpeechSynthesis.getInstance()
    synthesis.speak(text, {
        onstart: function () {
            da.outputLog('[speak: onstart]')
        },
        onend: function () {
            da.outputLog('[speak: onend]')
            if (stop) da.stopSegment()
        },
        onerror: function (error) {
            da.outputLog('[speak: onerror]', error)
            da.stopSegment()
        }
    })
}