// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

// Methods for detecting Yammer data
app.detectors = {
    // METHOD (A)
    // Subscribe to new Yammer API requests by open tabs
    // Look for /message_feeds/ requests
    lookForHTTPRequests: function(onMessageDetected) {
        chrome.webRequest.onCompleted.addListener(function receiveHTTPRequest(req) {
            if (
                app.session.lastURL !== req.url
             && req.url.indexOf(app.config.ignoreToken) === -1
             && req.method === "GET"
            ) {
                $.get(req.url+"&ignoreToken="+app.config.ignoreToken, function analyseHTTPRequest(res) {
                    if(typeof onMessageDetected === 'function') onMessageDetected(res)
                })
            } else
            // Error messages
            if(app.config.debug) {
                if(app.session.lastURL === req.url)
                    console.warn("URL already looked at ("+req.url+")")
            }

            if(req.url.indexOf(app.config.ignoreToken) === -1)
                app.session.set("lastURL",req.url)

        }, {
            urls: [
                app.config.api + "*" + "message_feeds" + "*"
            ]
        })
    },

    // METHOD (B)
    // Poll the API for messages, regardless of whether a Yammer page is up and running
    pollYammerAPI: function(onMessageDetected) {
        setInterval(function callAPI() {
           $.ajax({
                method: "GET",
                url: app.config.api+"/messages/private.json",
                data: {
                    "newer_than": app.session.lastMsgId,
                    "limit": 1,
                    "ignoreToken": app.config.ignoreToken
                },
                dataType: "json",
                success: function receiveAPIdata(res) {
                    console.log("Polling Yammer API ("+res.messages.length+" new)")
                    if(res.messages.length > 0) {
                        res.data = res
                        onMessageDetected(res)
                    }
                }
            })
        }, app.config.pollRate)
    }
}