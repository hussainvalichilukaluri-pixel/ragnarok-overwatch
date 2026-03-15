# 🛡️ Ragnarok Overwatch | Smart e-Seal Ecosystem

**An INSTINCT 4.0 Hackathon Finalist Project by Team Ragnarok.**

### 🌐 [Live Web Dashboard](INSERT_LINK_HERE) | 📱 [Download Android APK](./apk/Ragnarok_Overwatch_v1.apk) | 🎥 [Watch 3-Min Demo Video](INSERT_LINK_HERE)

> **The Problem:** 30% of supply chain cargo theft occurs at the "Last-Mile." Traditional plastic seals offer zero real-time visibility, no offline chain-of-custody, and are bypassed in seconds. 
> 
> **The Solution:** We give high-value cargo a voice. Ragnarok Overwatch replaces dumb plastic with an air-gapped IoT edge-node, a native Android gateway bridge, and live cloud telemetry.

---

## 🚀 The Architecture (The Triad)

Ragnarok Overwatch operates on a 3-part ecosystem designed to eliminate individual cellular OPEX costs while maintaining absolute chain of custody:

1. **The Edge Node (Hardware):** A physical lock that uses an ESP8266. It features a cryptographic local Wi-Fi handshake and a hardware-level "Black-Box" memory to timestamp tamper events even in dead zones.
2. **The Mobile Gateway (Driver App):** A Capacitor JS native Android app that acts as a bridge. It connects to the lock via local Wi-Fi, arms it, and then uses the driver's smartphone to push background GPS telemetry to the cloud via 4G.
3. **Global Command (Web Dashboard):** A real-time, dark-mode logistics UI built with Leaflet.js. It features a 15-meter spatial noise filter to eliminate GPS jitter and renders encrypted JSON audit logs the second a cargo breach is detected.

---

## 🛠️ Tech Stack

* **Hardware Edge:** NodeMCU ESP8266, C/C++, DS3231 RTC, Tactile Tamper Circuit.
* **Mobile App:** Capacitor JS, HTML/CSS/JS, Native BackgroundGeolocation API, Network Bridge APIs.
* **Cloud Infrastructure:** Firebase Realtime Database (NoSQL).
* **Command UI:** Vanilla JS, HTML5, Leaflet.js Mapping Engine.

---

## 📂 Repository Structure

* `/hardware` - Contains the Arduino/C++ sketch for the edge node microcontroller.
* `/mobile-app` - Contains the Capacitor JS source code for the Android Gateway bridge.
* `/web-dashboard` - Contains the HTML/JS for the global telemetry map and UI.
* `/apk` - Contains the compiled Android package for field deployment.

---

**Team Ragnarok** | Lead: Chilukaluri Hussainvali
*Securing the supply chain, one node at a time.*
