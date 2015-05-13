// Copyright (c) 2015 Jan Baykara. All rights reserved.
// Use of this source code is governed by the GNU GPL v2.0 license that can be
// found in the LICENSE.md file.
var app = app || {}

app.config = {
    // prevent repeat HTTP requests for urls with this query token
    ignoreToken: "ignore_request"

    // extension unpacked => !update_url :. debug mode
  , debug: typeof chrome.runtime.getManifest().update_url === 'undefined'

    // debug, production
  , pollRate: [5, 12.5]

    // API details
  , api: "https://www.yammer.com/api/v1"

    // Duration of notifications (-2 to 2)
    // https://developer.chrome.com/apps/richNotifications#behave
  , priority: 2

    // Properties to sync to Chrome user
  , sessionProperties: [
        'yammer_uid'
      , 'lastMsgId'
      , 'lastURL'
      , 'disabled'
    ]
}