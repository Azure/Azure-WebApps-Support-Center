(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.copyToClipboard = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var deselectCurrent = require('toggle-selection');

var defaultMessage = 'Copy to clipboard: #{key}, Enter';

function format(message) {
  var copyKey = (/mac os x/i.test(navigator.userAgent) ? '⌘' : 'Ctrl') + '+C';
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

function stripHtml(html)
{
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function createMarkElForText(text) {
  var mark;
  mark = document.createElement('span');
  mark.textContent = text;
  // reset user styles for span element
  mark.style.all = 'unset';
  // prevents scrolling to the end of the page
  mark.style.position = 'fixed';
  mark.style.top = 0;
  mark.style.clip = 'rect(0, 0, 0, 0)';
  // used to preserve spaces and line breaks
  mark.style.whiteSpace = 'pre';
  // do not inherit user-select (it may be `none`)
  mark.style.webkitUserSelect = 'text';
  mark.style.MozUserSelect = 'text';
  mark.style.msUserSelect = 'text';
  mark.style.userSelect = 'text';
  return mark;
}

function createMarkElForHtml(html) {
  var mark;
  mark = document.createElement('div');
  mark.style.fontSize = '12pt'; // Prevent zooming on iOS
  // Reset box model
  mark.style.border = '0';
  mark.style.padding = '0';
  mark.style.margin = '0';
  // Move element out of screen 
  mark.style.position = 'fixed';
  mark.style['right'] = '-9999px';
  mark.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
  // more hiding
  mark.setAttribute('readonly', '');
  mark.style.opacity = 0;
  mark.style.pointerEvents = 'none';
  mark.style.zIndex = -1;
  mark.setAttribute('tabindex', '0'); // so it can be focused
  mark.innerHTML = html;
  return mark;
}

function copy(textOrHtml, options) {
  var debug, message, reselectPrevious, range, selection, mark, success = false;
  if (!options) { options = {}; }
  debug = options.debug || false;
  options.onlyHtml = options.onlyHtml && options.asHtml;
  options.canUsePrompt = options.canUsePrompt != undefined ? options.canUsePrompt : true;
  try {
    reselectPrevious = deselectCurrent();

    range = document.createRange();
    selection = document.getSelection();

    var html, text;
    if (options.asHtml) {
        html = textOrHtml;
        text = stripHtml(html);
    } else {
        text = textOrHtml;
    }
    mark = options.asHtml ? createMarkElForHtml(html) : createMarkElForText(text);

    document.body.appendChild(mark);

    //range.setStartBefore(mark.firstChild);
    //range.setEndAfter(mark.lastChild);
    range.selectNode(mark);

    selection.removeAllRanges();
    selection.addRange(range);

    var successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('copy command was unsuccessful');
    }
    success = true;
  } catch (err) {
    debug && console.error('unable to copy using execCommand: ', err);
    if (!options.onlyHtml) {
      debug && console.warn('trying IE specific stuff');
      try {
        //html is not supported in IE
        //https://msdn.microsoft.com/en-us/library/ms536744(v=VS.85).aspx
        window.clipboardData.setData('text', text);
        success = true;
      } catch (err) {
        debug && console.error('unable to copy using clipboardData: ', err);
        if (options.canUsePrompt) {
          debug && console.error('falling back to prompt');
          message = format('message' in options ? options.message : defaultMessage);
          window.prompt(message, text);
        }
      }
    }
  } finally {
    if (selection) {
      if (typeof selection.removeRange == 'function') {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark) {
      document.body.removeChild(mark);
    }
    reselectPrevious();
  }

  return success;
}

module.exports = copy;

},{"toggle-selection":2}],2:[function(require,module,exports){

module.exports = function () {
  var selection = document.getSelection();
  if (!selection.rangeCount) {
    return function () {};
  }
  var active = document.activeElement;

  var ranges = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
    case 'INPUT':
    case 'TEXTAREA':
      active.blur();
      break;

    default:
      active = null;
      break;
  }

  selection.removeAllRanges();
  return function () {
    selection.type === 'Caret' &&
    selection.removeAllRanges();

    if (!selection.rangeCount) {
      ranges.forEach(function(range) {
        selection.addRange(range);
      });
    }

    active &&
    active.focus();
  };
};

},{}]},{},[1])(1)
});