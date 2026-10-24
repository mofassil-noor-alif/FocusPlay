# FocusPlay 🎬

> Automatically restore keyboard focus to web media players so Spacebar, Arrow keys, and playback shortcuts always work.

Have you ever hit the **Spacebar** to pause a video, only for the page to jump all the way to the bottom? Or switched to the next episode of a show and found your volume or seek hotkeys completely dead until you manually clicked the video container?

**FocusPlay** is a lightweight Chrome extension that automatically detects HTML5 video players—including those embedded inside `<iframe>` elements—and returns keyboard focus to the player.

---

## ✨ Features

- 🎯 **Seamless Hotkeys:** Keeps media shortcuts (Play/Pause with `Space`, Seek with `←`/`→`, Volume with `↑`/`↓`) working without manual clicking.
- 📺 **Episode & SPA Detection:** Automatically re-acquires player focus when navigating between episodes or changing videos in single-page apps.
- 🖼️ **Iframe & Embed Support:** Injects into embedded media iframes across popular streaming hosts.
- 🌐 **Domain Whitelist:** Full control over where FocusPlay runs. Add or remove websites with one click via the extension popup.
- ⚡ **Master Toggle:** Instantly enable or disable the extension globally with a single switch.
- 🔒 **Privacy-First & Lightweight:** No external tracking, no telemetry, built with modern Chrome Manifest V3.

---

## 🚀 How to Install (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/focusplay.git
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the folder containing `manifest.json`.

---

## 🛠️ How to Use

1. Click the **FocusPlay** icon in your Chrome toolbar.
2. Enter the domain of the website you want to enable (e.g., `sflix.to`, `youtube.com`) into the input box and click **Add**.
3. Enjoy uninterrupted playback without having to repeatedly click on the player.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
