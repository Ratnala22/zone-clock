// chrome.storage.local.clear(function () {
//   console.log('All data cleared from storage.');
// });

'use strict';
import { getLocalInfo } from 'phone-number-to-timezone';

const CHAT_SELECTOR = '#main > header > div._amie > div > div > div';
const TAB_SELECTOR = '#main > header';
let lastInjectedName = ''; // Keep track of the last injected name
let phoneDataList = [];
let lastInjectedId = '';

function initializePhoneData() {
  chrome.storage.local.get('phoneDataList', function (result) {
    phoneDataList = result.phoneDataList || [];
    console.log('Phone data retrieved:', phoneDataList);
  });
}
initializePhoneData();
const observer = new MutationObserver(() => {
  try {
    const chatElem = document.querySelector(TAB_SELECTOR);

    if (chatElem) {
      dataInjection();
    }
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.warn('Extension context invalidated, stopping observer.');
      observer.disconnect();
    } else {
      console.error('Unexpected error:', error);
    }
  }
});

observer.observe(document, {
  subtree: true,
  childList: true,
});

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

function dataInjection() {
  let nameTag = document.querySelector(
    '#main > header > div._amie > div > div > div > span'
  );
  const nameHeader = nameTag.innerText.trim();
  if (nameHeader === lastInjectedName) {
    return;
  }
  let flag = false;
  chrome.storage.local.get(['phoneDataList'], function (result) {
    if (result.phoneDataList) {
      console.log('Phone Data List:', result.phoneDataList);
      result.phoneDataList.forEach((contact) => {
        if (contact.contact.trim() === nameHeader) {
          flag = true;
          function updateTimeInWA() {
            const localTime = convertGMTToLocal(contact.offset);
            const dataToInject = ` (Local Time: ${localTime})`;

            const targetElement = document.querySelector(CHAT_SELECTOR);
            if (
              targetElement &&
              !targetElement.textContent.includes(dataToInject)
            ) {
              const element = document.createElement('span');
              lastInjectedId = nameHeader + `${new Date().getTime()}`;
              element.setAttribute('id', lastInjectedId);
              element.style.fontSize = '12px';
              element.style.paddingLeft = '5px';
              element.innerText = dataToInject;

              targetElement.appendChild(element);

              lastInjectedName = nameHeader;
            }
            setInterval(() => {
              updateTime();
            }, 60000);
          }
          function updateTime() {
            const element = document.getElementById(lastInjectedId);
            const localTime = convertGMTToLocal(contact.offset);
            const dataToInject = ` (Local Time: ${localTime})`;
            element.innerText = dataToInject;
          }
          updateTimeInWA();
        } else {
          console.log(`No match for: ${contact.contact}`);
        }
      });
      if (!flag) {
        const targetElement = document.querySelector(CHAT_SELECTOR);
        if (
          targetElement &&
          !targetElement.textContent.includes('(click here)')
        ) {
          const element = document.createElement('span');
          element.style.fontSize = '12px';
          element.style.paddingLeft = '5px';
          element.innerText = '(click here)';
          targetElement.appendChild(element);
          lastInjectedName = '(click here)';
          element.addEventListener('click', () => {
            extractAndStoreContact();
            setInterval(() => {
              if (targetElement.contains(element)) {
                targetElement.removeChild(element);
                console.log('Element removed after click');
              }
              console.log('delaying...');
            }, 700);
          });

          lastInjectedName = '';
        }
      }
    } else {
      const targetElement = document.querySelector(CHAT_SELECTOR);
      if (
        targetElement &&
        !targetElement.textContent.includes('(click here)')
      ) {
        const element = document.createElement('span');
        element.style.fontSize = '12px';
        element.style.paddingLeft = '5px';
        element.innerText = '(click here)';
        targetElement.appendChild(element);
        lastInjectedName = '(click here)';
        element.addEventListener('click', () => {
          extractAndStoreContact();
          setInterval(() => {
            if (targetElement.contains(element)) {
              targetElement.removeChild(element);
            }
          }, 700);
        });

        lastInjectedName = '';
      }
      console.log('No contact data found.');
    }
  });
}
//TODO: update to observer implementation
function extractAndStoreContact() {
  const retryInterval = 500;
  const maxRetries = 10;
  let retries = 0;
  function tryToFindElement() {
    const path = document.querySelector(
      '#app > div > div.three._aigs > div._aigv._aig-._aohg > span > div > span > div > div > section > div.x13mwh8y.x1q3qbx4.x1wg5k15.xajqne3.x1n2onr6.x1c4vz4f.x2lah0s.xdl72j9.xyorhqc.x13x2ugz.x7sb2j6.x6x52a7.x1i2zvha.xxpdul3 > div.x1c4vz4f.xs83m0k.xdl72j9.x1g77sc7.x78zum5.xozqiw3.x1oa3qoh.x12fk4p8.xeuugli.x2lwn1j.x1nhvcw1.xdt5ytf.x6s0dn4'
    );

    if (path) {
      const details = path.querySelectorAll('span');
      let contact = details[0].innerText;
      let phone = details[1].innerText;
      try {
        const phoneInfo = getLocalInfo(phone);
        const zoned = phoneInfo.time.zone;
        const offsetString = zoned.replace('GMT', '');
        const offset = parseFloat(offsetString);
        phoneDataList.push({ contact, phone, offset });
        chrome.storage.local.set({ phoneDataList: phoneDataList }, function () {
          console.log('Contact data updated.');
        });
      } catch (error) {
        console.error('Error getting phone info:', error);
      }
    } else if (retries < maxRetries) {
      retries++;
      setTimeout(tryToFindElement, retryInterval);
    } else {
      console.log('h2 element not found after maximum retries.');
    }
  }

  tryToFindElement();
}
