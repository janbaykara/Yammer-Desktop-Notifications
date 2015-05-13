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
                $.get(req.url + "&ignoreToken=" + app.config.ignoreToken, function analyseHTTPRequest(res) {
                    if (typeof onMessageDetected === 'function') onMessageDetected(res)
                })
            }

            // ----
            // Don't repeatedly look at the same URL
            if (req.url.indexOf(app.config.ignoreToken) === -1) {
                app.session.set("lastURL", req.url)
            }

            // ----
            // Error messages
            if (app.config.debug) {
                if (app.session.lastURL === req.url)
                    console.warn("URL already looked at (" + req.url + ")")
            }

        }, { urls: [ app.config.api + "*" + "message_feeds" + "*" ] })
    },

    // METHOD (B)
    // Poll the API for messages, regardless of whether a Yammer page is up and running
    pollYammerAPI: function(onMessageDetected) {

        var apiURL = app.config.api + "/messages/private.json"

        var queryData = {
            "ignoreToken": app.config.ignoreToken,
            "newer_than": app.session.lastMsgId,
            "limit": 1
        }

        function callAPI() {
            console.group("--- Polling")
            $.ajax({
                url: apiURL,
                data: queryData,
                success: receiveAPIdata,
                method: "GET",
                dataType: "json"
            })
        }

        function receiveAPIdata(res) {
            console.log("Polling Yammer API (" + res.messages.length + " new)")
            if (res.messages.length > 0) {
                res.data = res
                onMessageDetected(res)
            }
            console.groupEnd()
        }

        setInterval(callAPI, app.config.pollRate)
    }
}
