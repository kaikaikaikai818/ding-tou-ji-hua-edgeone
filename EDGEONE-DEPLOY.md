# EdgeOne Makers 部署配置

- Git 分支：`edgeone-migration`
- 构建命令：`npm run build`
- 输出目录：`out`
- KV 命名空间：`ding-tou-ji-hua-data`
- KV 变量名：`APP_DATA`

部署后，`/api/state` 通过 EdgeOne KV 保存账户、备用金、定投设置和记录；
`/api/market` 与 `/api/index-search` 由 Edge Functions 提供行情与指数搜索。
