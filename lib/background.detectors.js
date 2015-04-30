// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

// Methods for detecting Yammer data
app.detectors = {
    // METHOD (A)
    // Essentially subscribe to new Yammer API http requests, in open Yammer pages
    // Look for /message_feeds/ requests
    lookForHTTPRequests: function(onMessageDetected) {
        chrome.webRequest.onCompleted.addListener(function receiveHTTPRequest(req) {
            if (
                req.method === "GET" &&
                req.url.indexOf("https://www.yammer.com/api/v1/message_feeds") > -1 &&
                req.url.indexOf(app.config.ignoreToken) === -1 &&
                app.session.lastURL !== req.url
            ) {
                $.get(req.url+"&ignoreToken="+app.config.ignoreToken, function analyseHTTPRequest(res) {
                    onMessageDetected(res)
                })
            } else if(app.config.debug) { // Error messages
                if(app.session.lastURL === req.url)
                    console.warn("URL already looked at ("+req.url+")")
            }

            if(req.url.indexOf(app.config.ignoreToken) === -1)
                app.session.set("lastURL",req.url)

        }, {urls: ["*://*.yammer.com/*"]})
    },

    // METHOD (B)
    // Poll the API for messages, regardless of whether a Yammer page is up and running
    pollYammerAPI: function(onMessageDetected) {
        setInterval(function callAPI() {
           $.ajax({
                method: "GET",
                url: "https://www.yammer.com/api/v1/messages/private.json",
                data: {
                    "newer_than": app.session.lastMsgId,
                    "limit": 1,
                    "ignoreToken": app.config.ignoreToken
                },
                dataType: "json",
                success: function(res) {
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