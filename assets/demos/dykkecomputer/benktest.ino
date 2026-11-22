// Bench test for the dive computer's breadboard build (ESP32-S3), Arduino.
// Runs in Cirkit Designer's ESP32-S3 simulator and on the real DevKitC-1.
// Pins are the same as main/board.h in the firmware. Open the serial monitor at 115200.
//
// What it checks:
//   - I2C: scans the main bus and the two depth-sensor channels behind the TCA9548A,
//     and names every expected device that answers or is missing
//   - buttons UP/SELECT/DOWN (to ground, internal pull-up)
//   - buzzer: 4 kHz PWM pulse on every button press (the final piezo needs PWM)
//   - vibration motor: short PWM pulse on SELECT
//   - backlight PWM follows UP/DOWN
//   - wet contact: touch channel 3, prints the raw value and WET/DRY
#include <Wire.h>

const int PIN_SDA = 8, PIN_SCL = 9;
const int PIN_BTN_UP = 39, PIN_BTN_SEL = 41, PIN_BTN_DN = 42;
const int PIN_BUZZER = 40, PIN_VIB = 47, PIN_LCD_BL = 16, PIN_WET = 3;
const uint8_t MUX = 0x70;

struct Dev { uint8_t addr; const char *name; };
const Dev MAIN_BUS[] = {
  {0x10, "VEML7700 light"}, {0x30, "MMC5603 magnetometer"}, {0x36, "MAX17048 fuel gauge"},
  {0x50, "MB85RC256 FRAM"}, {0x51, "PCF85063A RTC"}, {0x68, "DS3231 RTC (breadboard)"},
  {0x6A, "QMI8658 IMU (SA0=1)"}, {0x6B, "QMI8658 IMU (SA0=0)"}, {0x70, "TCA9548A mux"},
  {0x22, "TMAG5273B1 button"}, {0x35, "TMAG5273A1 button"}, {0x78, "TMAG5273C1 button"},
};

int bl = 128;
uint32_t wetDry = 0;

bool present(uint8_t a) { Wire.beginTransmission(a); return Wire.endTransmission() == 0; }

void muxSelect(int ch) {            // ch < 0: all channels off
  Wire.beginTransmission(MUX);
  Wire.write(ch < 0 ? 0 : (1 << ch));
  Wire.endTransmission();
}

void scan() {
  Serial.println("\n-- main I2C bus --");
  for (auto &d : MAIN_BUS) Serial.printf("0x%02X %-26s %s\n", d.addr, d.name, present(d.addr) ? "OK" : "missing");
  if (present(MUX)) {
    for (int ch = 0; ch < 2; ch++) {
      muxSelect(ch);
      Serial.printf("mux ch%d: MS5837 depth sensor %c at 0x76 %s\n", ch, 'A' + ch, present(0x76) ? "OK" : "missing");
    }
    muxSelect(-1);                   // release channel 1 for the safety MCU
  }
}

void beep(int ms) { ledcWriteTone(PIN_BUZZER, 4000); delay(ms); ledcWriteTone(PIN_BUZZER, 0); }

void setup() {
  Serial.begin(115200);
  delay(500);
  Wire.begin(PIN_SDA, PIN_SCL, 400000);
  pinMode(PIN_BTN_UP, INPUT_PULLUP); pinMode(PIN_BTN_SEL, INPUT_PULLUP); pinMode(PIN_BTN_DN, INPUT_PULLUP);
  ledcAttach(PIN_BUZZER, 4000, 8);
  ledcAttach(PIN_VIB, 20000, 8);
  ledcAttach(PIN_LCD_BL, 5000, 8);
  ledcWrite(PIN_LCD_BL, bl);
  wetDry = touchRead(PIN_WET);       // dry baseline at power-on, as in the firmware
  Serial.println("Dive computer bench test. Pins as main/board.h.");
  scan();
  beep(80);
}

void loop() {
  static uint32_t last = 0;
  bool up = !digitalRead(PIN_BTN_UP), sel = !digitalRead(PIN_BTN_SEL), dn = !digitalRead(PIN_BTN_DN);
  if (up)  { bl = min(255, bl + 32); ledcWrite(PIN_LCD_BL, bl); beep(30); Serial.printf("UP   backlight %d%%\n", bl * 100 / 255); delay(200); }
  if (dn)  { bl = max(0, bl - 32);   ledcWrite(PIN_LCD_BL, bl); beep(30); Serial.printf("DOWN backlight %d%%\n", bl * 100 / 255); delay(200); }
  if (sel) { ledcWrite(PIN_VIB, 180); beep(150); ledcWrite(PIN_VIB, 0); Serial.println("SELECT: buzzer + vibration, rescanning"); scan(); delay(200); }
  if (millis() - last > 2000) {
    last = millis();
    uint32_t t = touchRead(PIN_WET);
    // On the ESP32-S3 the touch reading rises when the pad is touched or wet.
    Serial.printf("wet contact: raw %lu (dry %lu) -> %s\n", (unsigned long)t, (unsigned long)wetDry, t > wetDry * 13 / 10 ? "WET" : "DRY");
  }
}
