# TMetric Timer — Raycast Extension

Start and stop TMetric timers from Raycast.

## Prerequisites

- [Raycast](https://raycast.com/) installed
- [TMetric Desktop](https://tmetric.com/download) installed (launched automatically if not running)
- A TMetric API token

### Getting a TMetric API Token

1. Log in to [TMetric Web](https://app.tmetric.com)
2. Go to **My Profile** → **API Token**
3. Generate and copy the token

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/riadafridishibly/raycast-tmetric-extension/dev/install.sh | bash
```

Then import into Raycast: **Extensions** (⌘ ,) → **+** → **Add Script Directory** → select `~/.local/share/raycast-extensions/tmetric`.

To update, re-run the same command. To uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/riadafridishibly/raycast-tmetric-extension/dev/install.sh | bash -s -- --uninstall
```

### Development mode

```bash
git clone https://github.com/riadafridishibly/raycast-tmetric-extension.git
cd raycast-tmetric-extension
npm install
npm run dev
```

This opens the extension in Raycast in development mode. Raycast will prompt you to configure the **API Token** preference on first use.

## Commands

| Command | Mode | Description |
|---------|------|-------------|
| **Start Timer** | List view | Pick a description, then a project, and start a timer |
| **Stop Timer** | No-view | Stops the running timer and shows a HUD confirmation |
| **Timer Status** | List view | Shows the current timer with elapsed time and a stop action |

## Preferences

| Name | Type | Description |
|------|------|-------------|
| API Token | Password | Your TMetric API token (required) |
| Use Mock API | Checkbox | Use a fake in-memory API for testing (default: off) |

## Development

### Run tests

```bash
npm test
```

### Lint

```bash
npm run lint
npm run fix-lint
```

### Project structure

```
src/
├── types/index.ts              # TypeScript interfaces
├── api/
│   ├── tmetric-api.ts          # ITMetricApi interface
│   ├── tmetric-http-client.ts  # Real HTTP implementation
│   ├── tmetric-api-mock.ts     # In-memory mock (for dev/testing)
│   └── api-factory.ts          # DI factory
├── services/
│   ├── timer-service.ts        # Business logic
│   └── app-launcher.ts         # Detect & launch TMetric Desktop
├── lib/
│   └── preferences.ts          # Raycast preference helper
├── start-timer.tsx             # Start Timer command
├── stop-timer.tsx              # Stop Timer command
└── timer-status.tsx            # Timer Status command
tests/
├── mock/tmetric-api-mock.ts    # Stateful mock with call tracking
├── fixtures/api-responses.ts   # Canned response data
└── timer-service.test.ts       # Unit tests
```
