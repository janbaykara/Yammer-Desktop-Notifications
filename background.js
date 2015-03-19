// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.

console.log("Yammer Notifier is go.")
var lastURL
var lastMsg
var ignoreToken = "ignore_request"
var yammer_uid

// chrome.storage.sync.clear() // debug

function getUserID() {
    chrome.storage.sync.get('yammer_uid', function(storage) {
        yammer_uid = storage.yammer_uid
        console.log("User ID is "+yammer_uid)
    })
}
getUserID()

chrome.webRequest.onCompleted.addListener(function(req) {
    if (
        req.method === "GET" &&
        req.url.indexOf("https://www.yammer.com/api/v1/message_feeds") > -1 &&
        req.url.indexOf(ignoreToken) < 0 &&
        lastURL !== req.url
    ) {
        $.get(req.url+"&"+ignoreToken, function(res) {
            var msg = res.data.messages[0]
            if (
                res.type === "message" &&
                msg.id !== lastMsg &&
                msg.sender_id != yammer_uid &&
                // _.any(res.data.references,{'direct_message': true})
                msg.message_type === 'chat'
            ) {
                console.log(yammer_uid)
                messageHandler(res)
                lastMsg = msg.id
            }
        })
    }
    lastURL = req.url
}, {urls: ["https://www.yammer.com/*"]})

function messageHandler(res) {
    var message = res.data.messages[0]
    var sender = {
        type: message.sender_type,
        id: message.sender_id
    }
    var imgSize = 180
    message.person = _.where(res.data.references, sender)[0]
    message.person.mugshot_url_template = message.person.mugshot_url_template.replace("{height}", imgSize)
    message.person.mugshot_url_template = message.person.mugshot_url_template.replace("{width}", imgSize)
    message.person.img_url = message.person.mugshot_url_template
    message.unix_time = Date.parse(message.created_at)
    message.date_object = new Date(message.unix_time)

    message.notification_id = "boom-yammer-osx-" + _.uniqueId()
    notificationHandler(message)
}

function notificationHandler(message) {
    console.log("You got mail!")

    var buttonsArr = [
        { title: "Read & reply" }
    ]
    if(typeof yammer_uid === 'undefined') {
        buttonsArr.push({ title: "Don't notify me about myself!" })
    }

    chrome.notifications.create(
        // notificationId
        message.notification_id,
        // NotificationOptions
        {
            type: "basic",
            iconUrl: message.person.img_url,
            contextMessage: "at "+message.date_object.toLocaleTimeString(),
            title: message.person.full_name + " yammer'd you",
            message: message.body.plain,
            isClickable: true,
            buttons: buttonsArr
        },
        // Callback
        function callback(notificationId) {
            notificationButtonHandler(notificationId,message)
        }
    )
}

function notificationButtonHandler(notificationId,message) {
    chrome.notifications.onButtonClicked.addListener(function(id, btn) {
        if (id === notificationId && btn === 0) {
            chrome.tabs.create({
                url: message.web_url,
                selected: true
            })
        } else if(btn === 1) {
            chrome.storage.sync.set({"yammer_uid":message.person.id}, getUserID)
        }
    })
}