'use strict'

da.segment.onpreprocess = function (trigger, args) {
    da.startSegment(trigger, args)
}

da.segment.onstart = function (trigger, args) {
    console.log('onstart', { trigger: trigger, args: args })
    da.getSegmentConfig({
        onsuccess: function (config) {
            console.log('getSegmentConfig succeeded', config)
            ifttt(config)
        },
        onerror: function (error) {
            console.log('getSegmentConfig failed')
        }
    })
}

function ifttt(config) {
    var url = da.getString('apiFormat', config)
    var body = { value1: config.value1, value2: config.value2, value3: config.value3 }

    var xhr = da.getXhr()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                speak('done')
            } else {
                speak('failed')
            }
        }
    }
    xhr.send(JSON.stringify(body))
}

function speak(text, stop = true) {
    var synthesis = da.SpeechSynthesis.getInstance()
    synthesis.speak(text, {
        onstart: function () {
            console.log('speak start')
        },
        onend: function () {
            console.log('speak onend')
            if (stop) da.stopSegment()
        },
        onerror: function (error) {
            console.log('speak cancel: ' + error.messsage)
            if (stop) da.stopSegment()
        }
    })
}