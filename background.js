// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.

console.log("Yammer Notifier is go.")
var lastURL
var lastMsg
var ignoreToken = "ignore_request"
var yammer_uid
getUserID()

chrome.webRequest.onCompleted.addListener(function(req) {
    if (
        req.method === "GET" &&
        req.url.indexOf("https://www.yammer.com/api/v1/message_feeds") > -1 &&
        req.url.indexOf(ignoreToken) < 0 &&
        lastURL !== req.url
    ) {
        $.get(req.url+"&"+ignoreToken, function(res) {
            if (
                res.type === "message" &&
                res.data.messages[0].id !== lastMsg &&
                res.data.messages[0].sender_id != yammer_uid
            ) {
                messageHandler(res)
                lastMsg = res.data.messages[0].id
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

    message.notification_id = "boom-yammer-osx-" + _.uniqueId()
    notificationHandler(message)
}

function notificationHandler(message) {

    var buttonsArr = [
        { title: "Read & reply" }
    ]
    if(yammer_uid < 3) {
        buttonsArr.push({ title: "Don't notify me about myself!" })
    }

    chrome.notifications.create(
        // notificationId
        message.notification_id,
        // NotificationOptions
        {
            type: "basic",
            iconUrl: message.person.img_url,
            contextMessage: "Message received "+message.created_at,
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
    console.log("You got mail!")
    chrome.notifications.onButtonClicked.addListener(function(id, btn) {
        if (id === notificationId && btn === 0) {
            chrome.tabs.create({
                url: message.web_url,
                selected: true
            })
        } else if(btn === 1) {
            me = message.person.id
            chrome.storage.sync.set({"yammer_uid":me}, getUserID)
        }
    })
}

function getUserID() {
    chrome.storage.sync.get('yammer_uid', function(storage) {
        yammer_uid = storage.yammer_uid || 2
    })
    chrome.storage.sync.clear()
}