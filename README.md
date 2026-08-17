# 牛来（Niulai）

牛来是一个独立的 DSH Web 主题皮肤。它以奶油色界面、田野绿和低不透明度的背景图营造安静、易读的工作区；所有 DSH 界面颜色通过 `--dsw-alias-*` token 接入。

## 特性

- 独立包名、Cordis wiring：`dsh-niulai` / `ui-skin-niulai`
- 独立存储键：`dsh-niulai-theme`
- 两个内建配色：`pasture`（默认）与 `dusk`
- 已安装 `dsh-better-sidebar` 时不加载旧 Aion 文件面板及旧 Git 图谱客户端
- 主题仅添加一个不可交互的低层背景装饰；设置、菜单、输入区、终端和窄屏时会自动避让
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

## 素材与权利

`assets/` 中的图像由仓库所有者提供，仅用于本插件。请在再分发前确认你拥有相应权利。牛来的代码使用 MIT 许可证；DSH 与可选工作台模块遵循各自的上游许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
