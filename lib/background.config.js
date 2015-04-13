// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

app.config = {
    ignoreToken: "ignore_request"
  , debug: true
  , pollRate: [5, 12.5] // debug, production
  , sessionProperties: [
        'yammer_uid'
      , 'lastMsgId'
      , 'lastURL'
    ]
}

// Utility storage class
app.session = new function() {
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
        var that = this
        chrome.storage.sync.get(property, function receivedPropertyFromStorage(storage) {
            console.log("New "+property+" = "+storage[property])
            that[property] = storage[property]
            if(typeof cb === 'function') cb(that[property])
        })
    }
}