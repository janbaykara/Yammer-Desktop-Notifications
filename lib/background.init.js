// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

app.init = function() {
    console.log("Yammer Notifier is go")

    // Debug settings
    console.log("Debug mode: "+app.config.debug.toString().toUpperCase()+" [update_url: "+chrome.runtime.getManifest().update_url+"]")
    if(app.config.debug) chrome.storage.sync.clear()
    app.config.pollRate = (app.config.debug ? app.config.pollRate[0] : app.config.pollRate[1]) * 1000

    // Sync session properties from Chrome user settings cloud
    _.each(app.config.sessionProperties, function(prop) {
        app.session.get(prop)
    })

    // Spark off message detectors
    _.each(app.detectors, function(listener,listenerMethodName) {
        listener(function onMessageDetected(res) {
            res.detector = listenerMethodName
            app.messenger.initiateNotification(res)
        })
    })
}

app.init()