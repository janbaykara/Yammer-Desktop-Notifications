// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

// Meat and bone functions to produce a notification
app.messenger = function(res) {
    var Messenger = this

    // Make sure those requests deal in private chats
    // And make sure the new private message is relevant to the user
    Messenger.initiateNotification = function(res) {
        var message = res.data.messages[0]
        if (
            !app.session.disabled
         && (message.direct_message || message.privacy === "private" || message.message_type === 'chat')
         && (message.sender_id !== app.session.yammer_uid || app.config.debug)
         && (message.id !== app.session.lastMsgId)
        ) {
            app.session.set("lastMsgId",message.id)

            if(typeof app.session.yammer_uid === 'undefined')
                app.session.set("yammer_uid",res.data.meta.current_user_id)

            Messenger.buildNotification(res)

        } else if(app.config.debug) { // Error messages
            if (message.id === app.session.lastMsgId)
                console.warn("Already notified for "+message.id+" --- Too late: "+res.detector)
        }

        if(app.session.disabled) {
            console.groupCollapsed("Notifications are disabled")
            console.groupEnd()
        }
    },

    // Prepare the message notification content
    Messenger.buildNotification = function(res) {
        res.message = res.data.messages[0]

        // User
        var sender = {
            type: res.message.sender_type,
            id: res.message.sender_id
        }
        res.message.person = _.where(res.data.references, sender)[0]
        // Image
        var imgSize = 180
        res.message.person.mugshot_url_template = res.message.person.mugshot_url_template.replace("{height}", imgSize)
        res.message.person.mugshot_url_template = res.message.person.mugshot_url_template.replace("{width}", imgSize)
        res.message.person.img_url = res.message.person.mugshot_url_template
        // Date
        res.message.unix_time = Date.parse(res.message.created_at)
        res.message.date_object = new Date(res.message.unix_time)
        res.message.notification_id = _.uniqueId()

        if(typeof app.session.lastMsgId !== 'undefined')
            Messenger.sendNotification(res)
    },

    // Launch the message as a notification
    Messenger.sendNotification = function(res) {
        console.log("Notification for msg "+res.message.id+" (detector: "+res.detector+")")

        chrome.notifications.create(
            res.message.notification_id,
            {
                type: "basic",
                iconUrl: res.message.person.img_url,
                contextMessage: (app.config.debug ? res.detector : "Click to reply")+" · "+res.message.date_object.toLocaleTimeString(),
                title: res.message.person.full_name + " yammer'd you",
                message: res.message.body.plain,
                priority: app.config.priority
            }, function callback(notificationId) {
                app.ui(notificationId, res)
            }
        )
    }

    Messenger.initiateNotification(res)
}