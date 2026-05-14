# Tab Freeze Frame

A Chrome extension that automatically suspends idle tabs and displays visual snapshots, saving memory without losing your place.

## Features

- **Automatic Suspension** - Tabs idle for a specified duration are automatically suspended
- **Visual Snapshots** - Each suspended tab shows a screenshot preview
- **Instant Restore** - Click anywhere on the suspended page to instantly restore the original tab
- **URL Whitelist** - Regex patterns to exclude specific sites from suspension
- **Privacy First** - All data stored locally, nothing uploaded to any server
- **i18n Support** - English and Simplified Chinese

## Usage

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder
4. Click the extension icon to open popup
5. Configure timeout and whitelist in Options

## Build from Source

```bash
npm install
npm run build
```

Output is in the `dist` folder.

## Configuration

- **Suspend Timeout** - How long a tab must be idle before suspension (1-120 minutes)
- **URL Whitelist** - Regex patterns for URLs that should never be suspended (one per line)

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS 4
- Chrome Extension Manifest V3

## License

MIT
