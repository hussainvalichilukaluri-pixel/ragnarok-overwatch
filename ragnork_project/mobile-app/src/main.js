// ==========================================
// 1. ALL IMPORTS AT THE ABSOLUTE TOP
// ==========================================
import { registerPlugin, CapacitorHttp, Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

// ==========================================
// 2. CONSTANTS AND PLUGINS
// ==========================================
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
const WifiBridge = Capacitor.Plugins.WifiBridge; 

// ⚠️ YOUR FIREBASE CONFIG ⚠️
const firebaseConfig = {
  apiKey: XXXXXXXXXXXXX,
  authDomain: XXXXXXXXXXXXX",
  databaseURL: XXXXXXXXXXXXX",
  projectId: XXXXXXXXXXXXX",
  storageBucket: XXXXXXXXXXXXX,
  messagingSenderId:XXXXXXXXXXXXX",
  appId: XXXXXXXXXXXXX,
  measurementId: XXXXXXXXXXXXX
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let meterRef = null;
const btnScan = document.getElementById('btnScan');
const btnDetach = document.getElementById('btnDetach');
const uiMessage = document.getElementById('uiMessage');
const statusCard = document.getElementById('statusCard');
const qrOverlay = document.getElementById('qrOverlay');
const btnCancelScan = document.getElementById('btnCancelScan');

let currentMeterId = "";
let cachedDumpData = null; 

// ==========================================
// BACKGROUND GPS: LIVE TRACKING ONLY
// ==========================================
async function autoStartTracking() {
  await BackgroundGeolocation.addWatcher(
    { backgroundMessage: "Tracking Asset", requestPermissions: true, distanceFilter: 15 },
    (location, error) => {
      if (error || !meterRef) return; 
      
      // Updates the live status, but doesn't store permanent history
      update(meterRef, { 
        live_lat: location.latitude, 
        live_lng: location.longitude, 
        tracking_status: "EN_ROUTE",
        last_updated: Date.now()
      });
    }
  );
}
autoStartTracking();

// ==========================================
// PHASE 1: QR SCANNING & PAIRING
// ==========================================
btnScan.addEventListener('click', async () => {
  await BarcodeScanner.checkPermission({ force: true });
  BarcodeScanner.hideBackground();
  
  document.body.classList.add('qr-active');
  qrOverlay.style.display = 'flex';

  const result = await BarcodeScanner.startScan();

  if (result.hasContent) {
    document.body.classList.remove('qr-active');
    qrOverlay.style.display = 'none';
    
    currentMeterId = result.content; 
    meterRef = ref(db, 'meters/' + currentMeterId);
    
    uiMessage.innerHTML = "<strong style='color:#ffeb3b;'>CHECKING RADIO STATUS...</strong>";
    let isWifiOn = false;
    let hasPrompted = false;
    
    while (!isWifiOn) {
        const status = await WifiBridge.checkAndPromptWifi({ prompt: !hasPrompted });
        hasPrompted = true;
        
        if (status.wifiOn) {
            isWifiOn = true;
        } else {
            uiMessage.innerHTML = "<strong style='color:#ffeb3b;'>⚠️ RADIO OFFLINE</strong><br>1. Turn Wi-Fi ON.<br>2. <b>Swipe the panel down</b> to return.";
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        }
    }

    while (document.hidden) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    uiMessage.innerHTML = "<strong style='color:#00c6ff;'>RADIO ONLINE. SCANNING AIRWAVES...</strong>";
    await new Promise(resolve => setTimeout(resolve, 2000));

    uiMessage.innerHTML = "<strong style='color:#00c6ff;'>VERIFYING ASSET...</strong><br>Standby for native connection protocol.";
    
    try {
      await WifiBridge.connectToIoT({ ssid: "RAGNAROK_ESEAL", password: "12345678" });

      uiMessage.innerHTML = "<strong style='color:#00c6ff;'>ESTABLISHING HANDSHAKE...</strong><br>Pinging hardware.";
      const options = { url: 'http://192.168.4.1/handshake', connectTimeout: 2000 };
      const response = await CapacitorHttp.get(options);
      
      if (response.status === 200) {
        statusCard.style.borderColor = "#00c6ff";
        
        uiMessage.innerHTML = `<strong style='color:#00c6ff;'>✅ HANDSHAKE COMPLETE</strong><br><br>Asset <b>${currentMeterId}</b> verified.<br><br><b>System Armed. You may begin transit.</b>`;
        
        btnScan.style.display = 'none';
        btnDetach.style.display = 'flex';
        
        update(meterRef, { tracking_status: "PAIRED_SECURE", meter_id: currentMeterId });
      }
    } catch (error) {
       uiMessage.innerHTML = "<strong style='color:#ff3b30;'>⚠️ PAIRING FAILED</strong><br><br>Connection rejected or hardware unreachable.";
    }
  }
});

btnCancelScan.addEventListener('click', () => {
  BarcodeScanner.stopScan();
  document.body.classList.remove('qr-active');
  qrOverlay.style.display = 'none';
});

// ==========================================
// PHASE 2: DETACH & EXPLICIT CLOUD SYNC
// ==========================================
btnDetach.addEventListener('click', async () => {
  if (btnDetach.innerText.includes("Sync")) {
    try {
      uiMessage.innerHTML = "<strong style='color:#00c6ff;'>RELEASING NETWORK BIND...</strong><br>Switching to Cellular Uplink.";
      
      await WifiBridge.releaseNetwork();
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      uiMessage.innerHTML = "Uploading Payload to Command Center...";
      
      let formattedLogs = "Logs unavailable";
      if (cachedDumpData && Array.isArray(cachedDumpData.logs)) {
          formattedLogs = cachedDumpData.logs.map(log => `[${log.timestamp}] ${log.event}`).join(" -> ");
      }

      await update(meterRef, {
          eseal_tampered: cachedDumpData.tampered,
          eseal_unlocked: cachedDumpData.unlocked,
          hardware_audit_log: formattedLogs,
          tracking_status: "MISSION_COMPLETE",
          last_updated: Date.now()
      });

      meterRef = null; 

      statusCard.style.borderColor = "#00e676";
      uiMessage.innerHTML = "<strong style='color:#00e676;'>✅ MISSION COMPLETE</strong><br><br>Data successfully synced to Global Command.";
      btnDetach.style.display = 'none'; 
      
      setTimeout(() => {
          btnScan.style.display = 'flex'; 
          btnDetach.innerHTML = "🔓 Detach & Download Logs"; 
          btnDetach.style.background = "rgba(255, 59, 48, 0.1)"; 
          btnDetach.style.color = "#ff3b30";
          btnDetach.style.border = "1px solid rgba(255, 59, 48, 0.3)";
          
          uiMessage.innerHTML = "System Standby.<br>Ready to pair next asset.";
          statusCard.style.borderColor = "rgba(255,255,255,0.08)";
      }, 3000);

    } catch (error) {
      uiMessage.innerHTML = "<strong style='color:#ff3b30;'>⚠️ SYNC FAILED</strong><br><br>Check your 4G connection and try again.";
    }
    return;
  }

  try {
    uiMessage.innerHTML = "<strong style='color:#ffeb3b;'>CHECKING RADIO STATUS...</strong>";
    let isWifiOn = false;
    let hasPrompted = false;
    
    while (!isWifiOn) {
        const status = await WifiBridge.checkAndPromptWifi({ prompt: !hasPrompted });
        hasPrompted = true;
        if (status.wifiOn) {
            isWifiOn = true;
        } else {
            uiMessage.innerHTML = "<strong style='color:#ffeb3b;'>⚠️ RADIO OFFLINE</strong><br>1. Turn Wi-Fi ON.<br>2. <b>Swipe the panel down</b> to return.";
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        }
    }

    while (document.hidden) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    uiMessage.innerHTML = "<strong style='color:#00c6ff;'>RADIO ONLINE. SCANNING AIRWAVES...</strong>";
    await new Promise(resolve => setTimeout(resolve, 2000));

    uiMessage.innerHTML = "<strong style='color:#00c6ff;'>RE-ENGAGING HARDWARE...</strong><br>Standby for native connection.";
    await WifiBridge.connectToIoT({ ssid: "RAGNAROK_ESEAL", password: "12345678" });

    uiMessage.innerHTML = "Authorizing Detach & Downloading Logs...";
    const options = { url: 'http://192.168.4.1/detach?token=UNLOCK_1234', connectTimeout: 3000 };
    const response = await CapacitorHttp.get(options);
    
    cachedDumpData = response.data;

    statusCard.style.borderColor = "#ff9100";
    uiMessage.innerHTML = `<strong style='color:#ff9100;'>🔓 ASSET DETACHED</strong><br><br>Audit Logs secured in mobile memory.<br><br><b>Turn OFF Wi-Fi (return to 4G) and press Sync.</b>`;

    btnDetach.innerHTML = "☁️ Sync to Headquarters";
    btnDetach.style.background = "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)";
    btnDetach.style.color = "white";
    btnDetach.style.border = "none";

  } catch (error) {
    uiMessage.innerHTML = "<strong style='color:#ff3b30;'>⚠️ DETACH FAILED</strong><br><br>Could not re-establish link with the lock.";
  }
});
