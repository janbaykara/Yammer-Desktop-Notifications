// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

// Meat and bone functions to produce a notification
app.messenger = {
    // Make sure those requests deal in private chats
    // And make sure the new private message is relevant to the user
    initiateNotification: function(res) {
        var message = res.data.messages[0]
        if (
            message.message_type === 'chat' &&
            (message.sender_id !== app.session.yammer_uid || app.config.debug) &&
            (message.id !== app.session.lastMsgId)
        ) {
            app.session.set("lastMsgId",message.id)
            app.messenger.buildNotification(res)

            if(typeof app.session.yammer_uid === 'undefined')
                app.session.set("yammer_uid",res.data.meta.current_user_id)
        } else if(app.config.debug) { // Error messages
            if (message.id === app.session.lastMsgId)
                console.warn("Already notified for "+message.id)
        }
    },

    buildNotification: function(res) {
        res.message = res.data.messages[0]
        var imgSize = 180
        var sender = {
            type: res.message.sender_type,
            id: res.message.sender_id
        }
        res.message.person = _.where(res.data.references, sender)[0]
        res.message.person.mugshot_url_template = res.message.person.mugshot_url_template.replace("{height}", imgSize)
        res.message.person.mugshot_url_template = res.message.person.mugshot_url_template.replace("{width}", imgSize)
        res.message.person.img_url = res.message.person.mugshot_url_template
        res.message.unix_time = Date.parse(res.message.created_at)
        res.message.date_object = new Date(res.message.unix_time)

        res.message.notification_id = "boom-yammer-osx-" + _.uniqueId()
        if(typeof app.session.lastMsgId !== 'undefined')
            app.messenger.sendNotification(res)
    },

    sendNotification: function(res) {
        console.log("Notification for msg "+res.message.id+" (detector: "+res.detector+")")

        chrome.notifications.create(
            res.message.notification_id,
            {
                type: "basic",
                iconUrl: res.message.person.img_url,
                contextMessage: "Click to reply · "+res.message.date_object.toLocaleTimeString(),
                title: res.message.person.full_name + " yammer'd you",
                message: res.message.body.plain,
                priority: 1
            }, function callback(notificationId) {
                app.messenger.handleNotificationEvents(notificationId, res)
            }
        )
    },

    handleNotificationEvents: function(notificationId, res) {
        // Go to message
        chrome.notifications.onClicked.addListener(function(id) {
            if (id === notificationId) app.messenger.onNotificationClicked(res.essage)
        })
    },

    onNotificationClicked: function(res) {
        // Look for existing Yammer tabs
        chrome.windows.getCurrent({}, function(w) {
            chrome.tabs.query({
                windowId: w.id,
                url: "*://*.yammer.com/*"
            }, function getYammerTabs(tabs) {
                app.messenger.takeMeToYourLeader((tabs || []), res)
            })
        })
    },

    takeMeToYourLeader: function(yammerTabs,res) {
        // If any yammer pages found, direct user to first one
        if(typeof yammerTabs !== 'undefined' && yammerTabs.length > 0) {
            var chosenTab = yammerTabs[0]
            chrome.tabs.highlight({tabs:chosenTab.index}, function(){
                console.log("Highlighting tab "+chosenTab.windowId+":"+chosenTab.id)
            })
        } else {
            chrome.tabs.create({
                url: res.message.web_url,
                selected: true
            })
            console.log("Creating new Yammer page")
        }
    }
}