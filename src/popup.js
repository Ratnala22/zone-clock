import { getLocalInfo } from 'phone-number-to-timezone';

let phoneDataList = [];
function initializeData() {
  chrome.alarms.create('updateTimerAlarm', { periodInMinutes: 1 });

  chrome.storage.local.get('phoneDataList', function (result) {
    phoneDataList = result.phoneDataList || [];
    displayPhoneData();
  });
}

function convertGMTToLocal(offsetHours) {
  const gmtDate = new Date();
  const localDate = new Date(gmtDate.getTime() + offsetHours * 60 * 60 * 1000);
  let localHours = localDate.getUTCHours();
  const localMinutes = localDate.getUTCMinutes();
  const localPeriod = localHours >= 12 ? 'PM' : 'AM';
  localHours = localHours % 12 || 12;
  const formattedMinutes =
    localMinutes < 10 ? '0' + localMinutes : localMinutes;
  return `${localHours}:${formattedMinutes} ${localPeriod}`;
}

function displayPhoneData() {
  const phoneDataContainer = document.getElementById('phoneDataList');
  phoneDataContainer.innerHTML = '';

  if (phoneDataList.length > 0) {
    phoneDataList.forEach(function (data) {
      const localTime = convertGMTToLocal(data.offset);
      const div = document.createElement('div');
      div.textContent = `Contact Name: ${data.contact}, Local Time: ${localTime}`;
      phoneDataContainer.appendChild(div);
    });
  } else {
    phoneDataContainer.textContent = 'No contact data stored.';
  }
}

function updateTimes() {
  phoneDataList.forEach(function (data) {
    const updatedLocalTime = convertGMTToLocal(data.offset);
    data.localTime = updatedLocalTime; // Updates the local time directly in the object
  });

  displayPhoneData();
}

document.addEventListener('DOMContentLoaded', initializeData);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateTimerAlarm') {
    console.log('Alarm Triggered');
    updateTimes();
  }
});
