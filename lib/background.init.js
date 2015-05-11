// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

app.init = function() {
    console.log("Yammer Notifier is go")

    // Debug settings
    console.log("Debug mode: "+app.config.debug.toString().toUpperCase()+" [update_url: "+chrome.runtime.getManifest().update_url+"]")
    if(app.config.debug) {
        console.log("Clearing synced data")
        chrome.storage.sync.clear()
    }
    app.config.pollRate = (app.config.debug ? app.config.pollRate[0] : app.config.pollRate[1]) * 1000

    // Sync session properties from Chrome user settings cloud
    console.group("--- Loading chrome sync")
    _.each(app.config.sessionProperties, function(prop,i) {
        app.session.get(prop)
        if(i >= app.config.sessionProperties.length - 1) {
            console.groupEnd()
        }
    })

    // Toggle icons for `disabled`
    app.session.after.disabled = function(disabled) {
        chrome.browserAction.setIcon({
            path: disabled ? 'img/icon-disabled128.png' : 'img/icon128.png'
        })
        chrome.browserAction.setTitle({
            title: disabled ? 'Enable notifications' : 'Disable notifications'
        })
    }

    // Spark off message detectors
    console.group("--- Running message detectors")
    _.each(app.detectors, function(listener,listenerMethodName) {
        console.log("    init -> "+listenerMethodName)
        listener(function onMessageDetected(res) {
            res.detector = listenerMethodName
            app.messenger.initiateNotification(res)
        })
    })
    console.groupEnd()
}

app.init()

/* -----
| Extension UI event listeners
*/
chrome.browserAction.onClicked.addListener(function(tab) {
    app.session.set('disabled',!app.session.disabled)
})