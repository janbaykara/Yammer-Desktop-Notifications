// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.

console.log("Yammer Notifier is go")

var lastURL
  , ignoreToken = "ignore_request"
  , debug = true
  , pollRate = debug ? 5 : 20

if(debug) chrome.storage.sync.clear() // debug

// Method for simultaneously pushing/retrieving from foreign chrome.sync and local object.
var Storage = function() {
    this.set = function(property,value,cb) {
        this[property] = value
        chrome.storage.sync.set(
            {property: value},
            function sentToStorage(storage) {
                console.log("Set new "+property+" = "+value)
                if(typeof cb === 'function') cb()
            }
        )
        return this[property]
    }
    this.update = function(property,cb) {
        chrome.storage.sync.get(property, function receivedPropertyFromStorage(storage) {
            console.log("New "+property+" = "+storage[property])
            if(typeof cb === 'function') cb(storage[property])
        })
        return this[property]
    }
}
var Session = new Storage();

(function syncFromAbroad() {
    Session.update('yammer_uid')
    Session.update('lastMsgId')
})();

// METHOD (A)
// Essentially subscribe to new Yammer API http requests, in open Yammer pages
// Look for /message_feeds/ requests
(function lookForHTTPRequests() {
    chrome.webRequest.onCompleted.addListener(function receiveHTTPRequest(req) {
        if (
            req.method === "GET" &&
            req.url.indexOf("https://www.yammer.com/api/v1/message_feeds") > -1 &&
            req.url.indexOf(ignoreToken) < 0 &&
            lastURL !== req.url
        ) {
            $.get(req.url+"&"+ignoreToken, function analyseHTTPRequest(res) {
                initiateNotificationPipeline(res)
            })
        }
        lastURL = req.url
    }, {urls: ["*://*.yammer.com/*"]})
})();

// METHOD (B)
// Poll the API for messages, regardless of whether a Yammer page is up and running
(function pollYammerAPI() {
   setTimeout(function() {
       $.ajax({
            method: "GET",
            url: "https://www.yammer.com/api/v1/messages/private.json",
            data: {
                "newer_than": Session.lastMsgId,
                "limit": 1
            },
            dataType: "json",
            complete: pollYammerAPI,
            success: function(res) {
                console.log("Polling Yammer API - new messages found: "+res.messages.length)
                if(res.messages.length > 0) {
                    res.data = res
                    initiateNotificationPipeline(res)
                }
            }
        })
    }, pollRate * 1000)
})()

// Make sure those requests deal in private chats
// And make sure the new private message is relevant to the user
function initiateNotificationPipeline(res) {
    if(typeof Session.yammer_uid === 'undefined') {
        Session.set("yammer_uid",res.data.meta.current_user_id)
    }
    prepareMessageData(res)
}

function prepareMessageData(res) {
    var message = res.data.messages[0]
    if (
        message.message_type === 'chat' &&
        // typeof yammer_uid !== 'undefined' &&
        (message.sender_id !== Session.yammer_uid || debug) &&
        (message.id !== Session.lastMsgId)
    ) {
        Session.set("lastMsgId",message.id)
        buildNotification(res)
    } else if (message.id === Session.lastMsgId) {
        console.log("Already notified for "+message.id)
    }
}

function buildNotification(res) {
    var message = res.data.messages[0]
    var imgSize = 180
    var sender = {
        type: message.sender_type,
        id: message.sender_id
    }
    message.person = _.where(res.data.references, sender)[0]
    message.person.mugshot_url_template = message.person.mugshot_url_template.replace("{height}", imgSize)
    message.person.mugshot_url_template = message.person.mugshot_url_template.replace("{width}", imgSize)
    message.person.img_url = message.person.mugshot_url_template
    message.unix_time = Date.parse(message.created_at)
    message.date_object = new Date(message.unix_time)

    message.notification_id = "boom-yammer-osx-" + _.uniqueId()
    if(typeof Session.lastMsgId !== 'undefined')
        sendNotification(message)
}

function sendNotification(message) {
    console.log("Sending notification for message "+message.id)

    chrome.notifications.create(
        message.notification_id,
        {
            type: "basic",
            iconUrl: message.person.img_url,
            contextMessage: message.date_object.toLocaleTimeString(),
            title: message.person.full_name + " yammer'd you",
            message: message.body.plain
        },
        function callback(notificationId) {
            handleNotificationEvents(notificationId, message)
        }
    )
}

function handleNotificationEvents(notificationId,message) {
    // Go to message
    chrome.notifications.onClicked.addListener(function(id) {
        if (id === notificationId) onNotificationClicked(message)
    })
}

function onNotificationClicked(message) {
    // Look for existing Yammer tabs
    chrome.windows.getCurrent({}, function(w) {
        chrome.tabs.query({
            windowId: w.id,
            url: "*://*.yammer.com/*"
        }, function getYammerTabs(tabs) {
            takeMeToYourLeader((tabs || []),message)
        })
    })
}

function takeMeToYourLeader(yammerTabs,message) {
    // If any yammer pages found, direct user to first one
    if(typeof yammerTabs !== 'undefined' && yammerTabs.length > 0) {
        var chosenTab = yammerTabs[0]
        chrome.tabs.highlight({tabs:chosenTab.index}, function(){
            console.log("Highlighting tab "+chosenTab.windowId+":"+chosenTab.id)
        })
    } else {
        chrome.tabs.create({
            url: message.web_url,
            selected: true
        })
        console.log("Creating new Yammer page")
    }
}