# 定投计划：只用 GitHub 的部署步骤

这个版本不再使用 EdgeOne。网页由 GitHub Pages 提供，账户、备用金和定投记录仍只保存在每台手机本机；GitHub Actions 在工作日约每 30 分钟更新一次行情文件。

## 第一次上传

1. 把本压缩包解压，将里面的全部内容上传到原仓库 `ding-tou-ji-hua-edgeone`，覆盖同名文件并提交。
2. 必须确保 `.github` 文件夹也上传成功；行情自动更新依赖其中的工作流。
3. GitHub 免费账户需要把仓库改为 **Public** 才能免费使用 GitHub Pages。App 中的个人金额和记录不会上传到仓库。

## 打开 GitHub Pages

1. 进入仓库的 **Settings**。
2. 左侧点击 **Pages**。
3. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
4. 回到仓库顶部的 **Actions**，打开“发布 App 并刷新行情”。
5. 点击 **Run workflow → Run workflow**，等待绿色对勾。
6. 回到 **Settings → Pages**，点击 **Visit site**。

固定地址格式为：

`https://你的GitHub用户名.github.io/ding-tou-ji-hua-edgeone/`

## 行情刷新规则

- 工作日每小时的第 17 分和第 47 分自动抓取一次行情，即约每 30 分钟更新。
- App 内点击“刷新最新行情”会立即读取 GitHub 上最近一次成功的数据。
- 每张行情卡片底部会显示行情时间和来源；这不是证券交易软件的逐秒行情。
- 某个来源暂时失败时会保留上一次成功数据，不会用空值覆盖。

## 安装到 iPhone

使用 Safari 打开固定地址，点击 **分享 → 添加到主屏幕 → 添加**。以后直接从桌面图标打开即可。

## 日常备份

个人数据只保存在当前设备。换手机或清理 Safari 前，请在 App 的“记录”页点击“下载数据备份”。
