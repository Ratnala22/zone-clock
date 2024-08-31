'use strict';

//updates time in popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    chrome.alarms.create('updateTimerAlarm', { periodInMinutes: 0.1 });
  }
});
