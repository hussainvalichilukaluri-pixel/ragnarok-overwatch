#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char *ssid = "RAGNAROK_ESEAL";
const char *password = "12345678";

ESP8266WebServer server(80);

const int TAMPER_PIN = 4; // D2 on NodeMCU
bool isTampered = false;
bool isUnlocked = false;

void setup() {
  Serial.begin(115200);
  
  // Set up the internal pull-up resistor for your 4-pin switch
  pinMode(TAMPER_PIN, INPUT_PULLUP);

  // Start the Access Point
  WiFi.softAP(ssid, password);
  Serial.println("\n--- Ragnarok Edge Node Online ---");
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());

  // Define API Endpoints
  server.on("/handshake", HTTP_GET, []() {
    Serial.println("Handshake ping received from mobile device.");
    server.send(200, "application/json", "{\"meter_id\": \"MTR_001\", \"status\": \"secure\"}");
  });

  server.on("/detach", HTTP_GET, []() {
    String token = server.arg("token");
    if (token == "UNLOCK_1234") {
      isUnlocked = true;
      Serial.println("Valid detach token received. Disarming lock.");
      
      // Build the JSON Payload containing the black-box history
      String payload = "{";
      payload += "\"meter_id\": \"MTR_001\",";
      payload += "\"unlocked\": true,";
      payload += "\"tampered\": " + String(isTampered ? "true" : "false") + ",";
      payload += "\"logs\": [";
      payload += "{\"event\": \"System Armed\", \"timestamp\": \"Init\"}";
      if (isTampered) {
        payload += ",{\"event\": \"PROXIMITY_TAMPER_DETECTED\", \"timestamp\": \"Critical\"}";
      }
      payload += ",{\"event\": \"Authorized Detach\", \"timestamp\": \"Final\"}";
      payload += "]}";

      server.send(200, "application/json", payload);
    } else {
      server.send(401, "application/json", "{\"error\": \"Unauthorized\"}");
    }
  });

  server.begin();
}

void loop() {
  server.handleClient();

  // Watch for the physical tamper switch (If button is lifted, D2 goes HIGH)
  if (digitalRead(TAMPER_PIN) == HIGH && !isUnlocked && !isTampered) {
    Serial.println("🚨 CRITICAL: PROXIMITY TAMPER DETECTED! 🚨");
    isTampered = true;
    delay(500); // Debounce
  }
}