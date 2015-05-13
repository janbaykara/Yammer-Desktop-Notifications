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