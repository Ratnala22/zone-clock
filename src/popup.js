import { getLocalInfo } from "phone-number-to-timezone";

let phoneDataList = [];
const save = document.querySelector("#saveBtn");

function initializeData() {
  // chrome.runtime.sendMessage({"action":"startTimer"})
  chrome.alarms.create('updateTimerAlarm',{periodInMinutes:1});

  chrome.storage.local.get('phoneDataList', function(result) {
    phoneDataList = result.phoneDataList || [];
    displayPhoneData(); // Display data when the popup loads
    // startUpdatingTimes(); // Start the timer to update times every minute
  });
}

save.addEventListener("click", function() {
  const contactNameInput = document.getElementById('contactNameInput');
  const phoneNumberInput = document.getElementById('phoneNumberInput');
  const contact = contactNameInput.value.trim();
  const phone = phoneNumberInput.value.trim();
  
  if (!contact || !phone) {
    alert('Please enter both contact name and phone number.');
    return;
  }
  
  try {
    const phoneInfo = getLocalInfo(phone);
    const zoned = phoneInfo.time.zone;
    const offsetString = zoned.replace("GMT", ""); 
    const offset = parseFloat(offsetString);
    
    phoneDataList.push({ contact, phone, offset });
    
    // Save updated list to storage
    chrome.storage.local.set({ phoneDataList: phoneDataList }, function() {
      console.log('Contact data updated.');
      contactNameInput.value = ''; // Clear input field
      phoneNumberInput.value = ''; // Clear input field
      displayPhoneData(); // Refresh display
    });
  } catch (error) {
    console.error('Error getting phone info:', error);
  }
});

function convertGMTToLocal(offsetHours) {
  const gmtDate = new Date();
  const localDate = new Date(gmtDate.getTime() + offsetHours * 60 * 60 * 1000);
  let localHours = localDate.getUTCHours();
  const localMinutes = localDate.getUTCMinutes();
  const localSeconds = localDate.getUTCSeconds()
  const localPeriod = localHours >= 12 ? 'PM' : 'AM';
  localHours = localHours % 12 || 12; 
  const formattedMinutes = localMinutes < 10 ? '0' + localMinutes : localMinutes; 
  return `${localHours}:${formattedMinutes} ${localPeriod}`;
}

function displayPhoneData() {
  const phoneDataContainer = document.getElementById('phoneDataList');
  phoneDataContainer.innerHTML = '';
  
  if (phoneDataList.length > 0) {
    phoneDataList.forEach(function(data) {
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
  // setInterval(function() {
  //   phoneDataList.forEach(function(data) {
  //     const updatedLocalTime = convertGMTToLocal(data.offset);
  //     data.localTime = updatedLocalTime; // Update the local time directly in the object
  //   });
    
  //   // Update the display every minute
  //   displayPhoneData();
  // }, 60000); // 60000ms = 1 minute
  phoneDataList.forEach(function(data) {
        const updatedLocalTime = convertGMTToLocal(data.offset);
        data.localTime = updatedLocalTime; // Update the local time directly in the object
      } )

  displayPhoneData()
}

const resetBtn = document.querySelector("#clearBtn");
resetBtn.addEventListener("click", function() {
  phoneDataList = [];
  document.getElementById('phoneDataList').innerHTML = 'No contact data stored.';
  chrome.storage.local.remove('phoneDataList', function() {
    console.log('Phone data cleared from storage.');
  });
});

document.addEventListener('DOMContentLoaded', initializeData);


chrome.alarms.onAlarm.addListener((alarm)=>{
  if(alarm.name==="updateTimerAlarm"){
    console.log("Alarm Triggered");
    updateTimes()
  }

  
});