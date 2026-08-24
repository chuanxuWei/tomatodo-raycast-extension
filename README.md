# Tomato ToDo for Raycast

Turn a small task list into focused work without leaving Raycast. Tomato ToDo links every completed focus session to a task, keeps the countdown visible in the menu bar, and shows lightweight daily and weekly progress.

![Tomato ToDo icon](assets/icon.png)

## Features

- Create, edit, complete, reopen, search, and delete local tasks.
- Estimate each task in tomatoes and compare the estimate with completed focuses.
- Start, pause, resume, or stop one global focus timer.
- Keep the timer visible and controllable from the macOS menu bar.
- Use configurable focus, short-break, long-break, and cycle durations.
- Review today's and this week's completed focuses and minutes.
- Keep all tasks and session history in Raycast's extension-scoped encrypted LocalStorage.

## Install for Development

Requirements:

- macOS with Raycast installed and signed in
- Node.js 22.22.2 or newer
- npm 7 or newer

```bash
git clone https://github.com/chuanxuWei/tomatodo-raycast-extension.git
cd tomatodo-raycast-extension
npm ci
npm run dev
```

Raycast imports the development extension automatically. Search for `Manage Tasks`, `Quick Add Task`, or `Tomato Timer` in Root Search.

## How to Use

1. Open `Manage Tasks` and create a concrete next step.
2. Select an active task and choose `Start Focus`.
3. Pause, resume, or stop from the task list or menu bar.
4. When the phase ends, choose whether to start the recommended break or focus. Tomato ToDo never advances automatically.
5. Open `View Focus Summary` from the Action Panel to review recent work.

`Quick Add Task` accepts a required title and an optional estimate from Root Search. Estimates must be whole numbers from 1 to 99.

## Timer Accuracy

Raycast commands are not long-running processes. The timer derives its state from timestamps and the menu-bar command refreshes in the background every 10 seconds. macOS may delay a background launch slightly to save energy, so completion alerts can be a few seconds late. Starting a timer activates the menu-bar command, and opening any Tomato ToDo command reconciles an expired timer.

If background refresh is disabled for `Tomato Timer` in Raycast Settings, the timer is reconciled the next time a Tomato ToDo command opens.

## Preferences

Open Raycast Settings → Extensions → Tomato ToDo to configure:

- Focus duration: 25 minutes by default
- Short break: 5 minutes by default
- Long break: 15 minutes by default
- Focuses before a long break: 4 by default

Each duration also includes a one-minute option for testing.

## Privacy and Data

Tomato ToDo makes no network requests and includes no analytics. Tasks, timer state, and completed sessions stay in Raycast's encrypted, extension-scoped LocalStorage. Deleting a task preserves its completed session history using a title snapshot. Uninstalling the extension can remove its local data.

## Development Checks

```bash
npm test
npm run lint
npm run build
```

The timer and statistics domain logic use an injectable clock and storage adapter. Unit tests cover validation, pause/resume behavior, idempotent completion, task-history preservation, long-break recommendations, and local Monday-based weekly statistics.

---

# Tomato ToDo Raycast 扩展

Tomato ToDo 把轻量任务清单和番茄钟放进 Raycast：为任务设置预计番茄数，直接从任务启动专注，在菜单栏查看倒计时，并回顾今日与本周的专注记录。

## 功能

- 创建、编辑、完成、重新打开、搜索和删除本地任务。
- 为任务设置预计番茄数，并显示实际完成数。
- 全局只运行一个计时器，可开始、暂停、继续或停止。
- 从 macOS 菜单栏查看并控制计时器。
- 自定义专注、短休息、长休息时长以及长休息阈值。
- 查看今日、本周的番茄数、专注分钟和最近记录。
- 所有数据保存在 Raycast 为本扩展提供的加密 LocalStorage 中。

## 本地安装

需要 macOS、已安装且已登录的 Raycast、Node.js 22.22.2 或更高版本。

```bash
git clone https://github.com/chuanxuWei/tomatodo-raycast-extension.git
cd tomatodo-raycast-extension
npm ci
npm run dev
```

开发模式启动后，Raycast 会自动导入扩展。可以从 Root Search 搜索：

- `Manage Tasks`：管理任务、开始专注、查看摘要。
- `Quick Add Task`：用标题和可选预计番茄数快速添加任务。
- `Tomato Timer`：启用并控制菜单栏计时器。

## 使用方式

1. 在 `Manage Tasks` 中创建一个具体的下一步任务。
2. 选择任务并执行 `Start Focus`。
3. 从任务列表或菜单栏暂停、继续或停止。
4. 阶段结束时手动选择是否开始推荐的休息或下一轮专注；扩展不会自动切换。
5. 从 Action Panel 打开 `View Focus Summary` 查看今日、本周和最近记录。

## 计时说明

Raycast 命令不是常驻进程。扩展通过时间戳计算剩余时间，菜单栏命令每 10 秒请求一次后台刷新。macOS 可能为了节能延迟几秒，因此完成提醒不保证秒级准时。开始计时会主动激活菜单栏命令；打开任意 Tomato ToDo 命令也会补做过期结算。

如果你在 Raycast Settings 中关闭 `Tomato Timer` 的 Background Refresh，计时器会在下次打开 Tomato ToDo 命令时结算。

## 隐私

扩展不发送网络请求，不包含统计分析。任务、计时状态和历史记录只保存在 Raycast 为当前扩展提供的加密本地存储中。删除任务不会删除已完成的历史记录；卸载扩展可能清除其本地数据。

## 开发验证

```bash
npm test
npm run lint
npm run build
```

测试覆盖任务校验、暂停/继续、计时幂等结算、删除任务后保留历史、长休息推荐，以及按本地时区和周一计算的本周统计。
