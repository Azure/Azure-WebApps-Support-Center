# copy-html-to-clipboard [![Build Status](https://travis-ci.org/ukrbublik/copy-html-to-clipboard.svg?branch=master)](https://travis-ci.org/ukrbublik/copy-html-to-clipboard)

Simple module exposing `copy` function that will try to use [execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#) with fallback to IE-specific `clipboardData` interface and finally, resort to usual `prompt` with proper text content and message.

Forked from [copy-to-clipboard](https://npm.im/copy-to-clipboard) to add html support.


# Example

```js
import copy from 'copy-html-to-clipboard';

copy('Text');

// Copy with options
copy('Text', {
  debug: true,
  message: 'Press #{key} to copy',
});

// Copy html
copy('<b>i am bold</b>', {
  asHtml: true,
});
```

# API

`copy(text: string, options: object): boolean` &mdash; tries to copy text to clipboard. Returns `true` if no additional keystrokes were required from user (so, `execCommand`, IE's `clipboardData` worked) or `false`.

|Value |Default |Notes|
|------|--------|-----|
|options.debug  |false| `Boolean`. Optional. Enable output to console. |
|options.asHtml  |false| `Boolean`. True - use param `text` as html. |
|options.onlyHtml  |false| `Boolean`. True - if can't copy html to clipboard, don't try to copy text with alternative ways. |
|options.canUsePrompt  |true| `Boolean`. True - try alternative ugly prompt-way. |
|options.message|Copy to clipboard: `#{key}`, Enter| `String`. Optional. Prompt message. `*` |

`*` all occurrences of `#{key}` are replaced with `⌘+C` for macOS/iOS users, and `Ctrl+C` otherwise.

# [Browser support](http://caniuse.com/#feat=document-execcommand)

Works everywhere where `prompt`* is available. Works best (i.e. without additional keystrokes) in Chrome, FF, Safari 10+, and, supposedly, IE/Edge.

Note: **does not work on some older iOS devices.**  
`*` – even though **Safari 8** has `prompt`, you cannot specify prefilled content for prompt modal – thus it **doesn't work** as expected.

# Installation

+ Can be used as npm package and then leveraged using commonjs bundler/loader:
```
npm i --save copy-html-to-clipboard
```
+ Can be utilized using [wzrd.in](https://wzrd.in/). Add following script to your page:
```html
<script src="https://wzrd.in/standalone/copy-html-to-clipboard@latest" async></script>
```
You will have `window.copyToClipboard` exposed for you to use.

# UI components based on this package:
+ [react-copy-html-to-clipboard](https://github.com/ukrbublik/react-copy-html-to-clipboard)
+ [react-copy-to-clipboard](https://github.com/nkbt/react-copy-to-clipboard)
+ [copy-button](https://github.com/sudodoki/copy-button)

# See also:
+ [clipboard-copy](https://github.com/feross/clipboard-copy) by [@feross](https://github.com/feross)
+ [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#Browser_Compatibility)
+ [April 2015 update on Cut and Copy Commands](http://updates.html5rocks.com/2015/04/cut-and-copy-commands)

# Running Tests
This project has some automated tests, that will run using [nightwatch](nightwatchjs.org) on top of [selenium](http://www.seleniumhq.org/).

```
npm i
npm test
```
