// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

// Listen for 'disable/enable' UI button click
chrome.browserAction.onClicked.addListener(function(tab) {
    app.session.set('disabled',!app.session.disabled)
})

// Listen for session property changes
// effect necessary UI changes
app.session.after({
    disabled: function(isDisabled) {
        chrome.browserAction.setIcon({
            path: isDisabled ? 'img/icon-disabled128.png' : 'img/icon128.png'
        })
        chrome.browserAction.setTitle({
            title: isDisabled ? 'Enable notifications' : 'Disable notifications'
        })
    }
})

app.ui = function(notificationId, res) {
    var UI = this

    // Go to message
    chrome.notifications.onClicked.addListener(function(id) {
        if (id === notificationId) app.messenger.onNotificationClicked(res.essage)
    })

    UI.onNotificationClicked = function(res) {
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

    UI.takeMeToYourLeader = function(yammerTabs,res) {
        // If any yammer tabs are open already, make active the first one
        if(typeof yammerTabs !== 'undefined' && yammerTabs.length > 0) {
            var chosenTab = yammerTabs[0]
            chrome.tabs.highlight({tabs:chosenTab.index}, function(){
                console.log("Highlighting tab "+chosenTab.windowId+":"+chosenTab.id)
            })
        }
        // Otherwise go ahead and make a Yammer tab
        else {
            chrome.tabs.create({
                url: res.message.web_url,
                selected: true
            })
            console.log("Creating new Yammer page")
        }
    }
}