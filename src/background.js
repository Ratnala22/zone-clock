'use strict';

// import { startUpdatingTimes } from "./popup";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'GREETINGS') {
//     const message = `Hi ${
//       sender.tab ? 'Con' : 'Pop'
//     }, my name is Bac. I am from Background. It's great to hear from you.`;

//     // Log message coming from the `request` parameter
//     console.log(request.payload.message);
//     // Send a response message
//     sendResponse({
//       message,
//     });
//   }
// });

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message.action==="startTimer"){
    chrome.alarms.create('updateTimerAlarm',{periodInMinutes:0.1});
    console.log("Alarm set for 6 secs");
  }
});

// chrome.alarms.onAlarm.addListener((alarm)=>{
//   if(alarm.name==="popupAlarm"){
//     console.log("Alarm Triggered");
//     startUpdatingTimes()
//   }
// });