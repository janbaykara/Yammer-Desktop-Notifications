// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license Session can be
// found in the LICENSE.md file.

// Utility chrome.sync() storage class
// TODO: Add array storage (for things like parsed URLs, msgIDs, settings, ignores)
// http://stackoverflow.com/questions/15717334/chrome-sync-storage-to-store-and-update-array
var Session = function(sessionProperties) {
    var Session = this

    Session.callbacks = {}

    /* ----
        Class methods
    */

    Session.set = function(property,value,cb) {
        var Session = this
        this[property] = value

        var keyValue = {}
        keyValue[property] = value

        chrome.storage.sync.set(
            keyValue,
            function sentToStorage() {
                console.log("SET Session."+property+" = "+value)
                if(typeof Session.callbacks[property] === 'function') Session.callbacks[property](value,"set")
                if(typeof cb === 'function') cb(value)
            }
        )
        return this[property]
    }
    Session.get = function(property,cb) {
        var Session = this
        chrome.storage.sync.get(property, function receivedPropertyFromStorage(storage) {
            console.log("GET Session."+property+" = "+storage[property])
            Session[property] = storage[property]
            if(typeof Session.callbacks[property] === 'function') Session.callbacks[property](Session[property],"get")
            if(typeof cb === 'function') cb(Session[property])
        })
    }

    Session.after = function(callbackObj) {
        var Session = this
        _.merge(Session.callbacks, callbackObj)
    }

    /* ----
        Constructor
    */
    console.group("--- Loading chrome sync")
    _.each(sessionProperties, function(prop,i) {
        Session.get(prop)
        if(i >= sessionProperties.length - 1) {
            console.groupEnd()
        }
    })
}