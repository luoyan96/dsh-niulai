# 牛来（Niulai）

牛来是一个独立的 DSH Web 背景皮肤。它保留 DSH 原生界面颜色，只在工作区叠加低不透明度背景图，并提供可拖动的透明角色挂件。

## 特性

- 独立包名、Cordis wiring：`dsh-niulai` / `ui-skin-niulai`
- 独立存储键：`dsh-niulai-theme`
- 三套严格配对的主题：`huabao`（默认）、`niulai`、`niulaima`；每套均使用同名 PNG 背景与 `-renwu.jpg` 宠物。
- 已安装 `dsh-better-sidebar` 时仅检测兼容状态，绝不加载旧 Aion 文件面板或旧 Git 图谱客户端；未安装时使用原生 DSH UI 回退
- 背景和宠物都不可交互；宠物仅在对话输入框下方出现，设置、菜单、终端/无输入框和窄屏时自动避让
- 完整 disposer：恢复属性、样式、标题、DOM、监听器、observer 和 timer

## 开发

```bash
pnpm install
pnpm run typecheck
pnpm test
pnpm run build
pnpm run pack:check
```

未发布 npm 包、未推送 tag，也未创建 GitHub Release。

## 本地安装

先在本仓库生成安装包：

```bash
pnpm pack
```

随后在任意目录的 PowerShell 中安装：

```powershell
dsh plugin --profile web add "D:\deepseek-agent\dsh-niulai\dsh-niulai-0.1.6.tgz"
dsh web
```

如果 profile 曾安装 Catnap Studio，请先移除它，再启用牛来。两个皮肤都属于顶层 UI 皮肤，不建议同时启用：

```powershell
dsh plugin --profile web remove dsh-catnap-plugins
```

如果 pnpm 提示 `node-pty` 的构建被拦截，请进入 profile 目录执行
`pnpm approve-builds`，批准 `node-pty` 后重试安装。

### 兼容性

牛来不会注册任务看板、实时统计、Git 图谱或旧 Aion 文件面板。这样可以避免和已安装的工作台插件重复注册；检测到 `dsh-better-sidebar` 时仅设置兼容状态，不会加载任何旧版侧栏模块。未安装 Better Sidebar 时，DSH 的原生侧栏和原生工作区照常工作。

在 DSH 设置中打开外观页后，可切换 `花豹原野`、`牛来晴野` 与 `牛来暮野`。每个主题会同步使用同名 PNG 背景与 `-renwu.jpg` 宠物；宠物只在对话输入框下方显示，并在菜单、设置弹层、窄屏和无输入框的工作区自动隐藏。

## 素材与权利

`assets/` 中的图像由仓库所有者提供，仅用于本插件。请在再分发前确认你拥有相应权利。牛来的代码使用 MIT 许可证；DSH 与可选工作台模块遵循各自的上游许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
