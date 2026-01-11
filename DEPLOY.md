# 部署指南 (Deployment Guide)

## 1. 部署到 GitHub

您现在的项目已经是一个本地 Git 仓库了。

1.  在 GitHub 上创建一个新的 **空仓库** (New Repository)，名字例如 `dkb-ymm-web`。
2.  确保不要勾选 "Initialize with README" 或添加 .gitignore，因为我们已经有了。
3.  复制 GitHub 提供的 HTTPS 或 SSH 链接 (例如 `https://github.com/your-name/dkb-ymm-web.git`)。
4.  在终端执行以下命令将本地代码推送到 GitHub (请替换 URL)：

```bash
git remote add origin https://github.com/your-name/dkb-ymm-web.git
git branch -M main
git push -u origin main
```

## 2. 部署到 Zeabur

Zeabur 可以直接从 GitHub 自动部署 Next.js 项目。

1.  登录 [Zeabur Dashboard](https://dash.zeabur.com).
2.  创建一个新项目 (Project)。
3.  点击 **"部署新服务" (New Service)** -> 选择 **"GitHub"**。
4.  选择您刚刚推送的仓库 `dkb-ymm-web`。
5.  Zeabur 会自动检测到这是一个 Next.js 项目，并开始构建。
    *   **重要**: 您需要在 Zeabur 的 "Variable" (环境变量) 页面配置 API Key，否则上线后无法对话。
    *   添加变量 `GEMINI_API_KEY`，值填入您的 Key。
    *   添加变量 `GEMINI_BASE_URL`，值填入 `https://yinli.one/v1`。
6.  等待部署完成，点击 Zeabur 生成的域名即可访问。

## 3. PWA & Logo 说明

我们已经为您配置好了所有图标和元数据：

*   **分享卡片 (Open Graph)**: 当您把链接发给微信/朋友圈时，会自动显示"咩总"的头像。
*   **手机桌面图标**:
    *   在 Safari 中打开网页 -> 点击"分享" -> "添加到主屏幕"。
    *   桌面会自动出现一个名为 "咩总" 的 APP 图标（就是咩总的头像）。
    *   点击图标即可以全屏 APP 模式运行。
