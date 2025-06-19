# WeChat Devtool

A Raycast extension for quickly managing and opening WeChat Mini Program projects using the official WeChat DevTools CLI. Supports multiple devices and projects, with a user-friendly configuration UI.

## Features

- Manage multiple WeChat DevTools CLI paths and projects per device
- Open any configured project in WeChat DevTools with one click
- Visual configuration UI for adding/removing devices and projects
- All configuration is stored locally in `~/.config/raycast-weapp.json`
- Designed for future expansion (preview, upload, cloud functions, etc.)

## Installation

1. Install [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) on your Mac.
2. Install this extension from the Raycast Store or clone this repo and run `npm install && npm run dev` in the extension directory.

## Configuration

1. Open the command: **Setup WeChat Projects**
2. For each device, set the CLI path (e.g. `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`)
3. Add projects with a name and directory path
4. Save your configuration

> The extension will auto-detect your current device name. You can add more devices if you sync your config across machines.

## Usage

- Use the **Open Mini Program Project** command to see your configured projects and open them in WeChat DevTools with one click.
- You can always update your configuration via the **Setup WeChat Projects** command.

## FAQ

**Q: Does this extension support preview, upload, or cloud functions?**
A: Not yet, but the codebase is designed for easy expansion. Contributions are welcome!

**Q: Does this extension support localization?**
A: No. Raycast extensions must use US English only, per store guidelines.

**Q: Where is my configuration stored?**
A: In `~/.config/raycast-weapp.json` on your local machine.

## Acknowledgements

- [WeChat DevTools CLI Documentation](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)
- [Raycast API Documentation](https://developers.raycast.com/)

---

This extension is not affiliated with or endorsed by Tencent or WeChat. For support, please open an issue on GitHub.
