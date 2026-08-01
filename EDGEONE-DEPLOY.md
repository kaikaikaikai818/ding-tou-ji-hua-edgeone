# EdgeOne Makers 部署配置

- Git 分支：`main`
- 构建命令：`npm run build`
- 输出目录：`out`

账户、备用金、定投设置和记录保存在每位使用者自己的手机或浏览器中，
不需要申请 KV，也不需要填写 `APP_DATA` 环境变量。每个人的数据彼此独立。

`/api/market` 与 `/api/index-search` 仍由 Edge Functions 提供行情与指数搜索。
首次打开后可添加到手机主屏幕；离线时可查看和修改本机数据，行情刷新需要联网。
