// ==UserScript==
// @name         MixDrop
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://mixdrop.co/*
// @match        *://*.mixdrop.co/*
// @icon         https://mixdrop.co/imgs/favicon-32x32.png
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-MixDrop/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-MixDrop/issues
// @downloadURL  https://github.com/warren-bank/crx-MixDrop/raw/webmonkey-userscript/es5/webmonkey-userscript/MixDrop.user.js
// @updateURL    https://github.com/warren-bank/crx-MixDrop/raw/webmonkey-userscript/es5/webmonkey-userscript/MixDrop.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "common": {
    "redirect_embedded_iframes":    true
  },
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var determine_video_type = function(video_url) {
  var video_url_regex_pattern = /^.*\.(mp4|mp4v|mpv|m1v|m4v|mpg|mpg2|mpeg|xvid|webm|3gp|avi|mov|mkv|ogv|ogm|m3u8|mpd|ism(?:[vc]|\/manifest)?)(?:[\?#].*)?$/i
  var matches, file_ext, video_type

  matches = video_url_regex_pattern.exec(video_url)

  if (matches && matches.length)
    file_ext = matches[1]

  if (file_ext) {
    switch (file_ext) {
      case "mp4":
      case "mp4v":
      case "m4v":
        video_type = "video/mp4"
        break
      case "mpv":
        video_type = "video/MPV"
        break
      case "m1v":
      case "mpg":
      case "mpg2":
      case "mpeg":
        video_type = "video/mpeg"
        break
      case "xvid":
        video_type = "video/x-xvid"
        break
      case "webm":
        video_type = "video/webm"
        break
      case "3gp":
        video_type = "video/3gpp"
        break
      case "avi":
        video_type = "video/x-msvideo"
        break
      case "mov":
        video_type = "video/quicktime"
        break
      case "mkv":
        video_type = "video/x-mkv"
        break
      case "ogg":
      case "ogv":
      case "ogm":
        video_type = "video/ogg"
        break
      case "m3u8":
        video_type = "application/x-mpegURL"
        break
      case "mpd":
        video_type = "application/dash+xml"
        break
      case "ism":
      case "ism/manifest":
      case "ismv":
      case "ismc":
        video_type = "application/vnd.ms-sstr+xml"
        break
    }
  }

  return video_type ? video_type.toLowerCase() : ""
}

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!video_url)
    return

  if (!referer_url)
    referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    if (!video_type)
      video_type = determine_video_type(video_url)

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

var process_mp4_url = function(mp4_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ mp4_url, /* video_type= */ 'video/mp4', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- process page: outer

var process_video_outer = function() {
  var iframe = unsafeWindow.document.querySelector('iframe[allowfullscreen][src]')
  if (!iframe) return

  var url = iframe.getAttribute('src')
  redirect_to_url(url)
}

// ----------------------------------------------------------------------------- process page: inner

var resolve_url = function(url) {
  if (url.substring(0, 4).toLowerCase() === 'http')
    return url

  if (url.substring(0, 2) === '//')
    return unsafeWindow.location.protocol + url

  if (url.substring(0, 1) === '/')
    return unsafeWindow.location.protocol + '//' + unsafeWindow.location.host + url

  return unsafeWindow.location.protocol + '//' + unsafeWindow.location.host + unsafeWindow.location.pathname.replace(/[^\/]+$/, '') + url
}

var process_video_inner = function() {
  var regex, scripts, script, video_url

  regex = {
    whitespace: /[\r\n\t]+/g,
    eval_code:  /^MDCore.*eval(\(function\(p,a,c,k,e,d\)\{.*\))$/,
    video_url:  /^.*[;\s]MDCore\.wurl\s*=\s*['"]([^'"]+)['"].*$/
  }

  scripts = unsafeWindow.document.querySelectorAll('script:not([src])')

  for (var i=0; i < scripts.length; i++) {
    script = scripts[i]
    script = script.innerHTML
    script = script.replace(regex.whitespace, ' ').trim()

    if (regex.eval_code.test(script)) {
      script = script.replace(regex.eval_code, '$1')

      try {
        script = eval(script)
        script = script.replace(regex.whitespace, ' ').trim()

        if (regex.video_url.test(script)) {
          video_url = script.replace(regex.video_url, '$1')
          video_url = resolve_url(video_url)
        }
      }
      catch(e) {}

      break
    }
  }

  if (video_url) {
    process_video_url(video_url)
  }
}

// ----------------------------------------------------------------------------- bootstrap

var is_video_outer = (unsafeWindow.location.pathname.indexOf('/f/') === 0)
var is_video_inner = (unsafeWindow.location.pathname.indexOf('/e/') === 0)

var should_process_page = function() {
  return is_video_outer || is_video_inner
}

var should_process_window = function() {
  var is_top = (unsafeWindow.window === unsafeWindow.top)

  return is_top || user_options.common.redirect_embedded_iframes
}

var should_init = function() {
  return should_process_page() && should_process_window()
}

var init = function() {
  if (is_video_outer)
    return process_video_outer()

  if (is_video_inner)
    return process_video_inner()
}

if (should_init())
  init()

// -----------------------------------------------------------------------------
