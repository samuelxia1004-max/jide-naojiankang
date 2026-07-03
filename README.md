# 记得中文脑健康网站

这个仓库采用 GitHub-only 更新方式。

- `app/` 是完整 Vite + React + TypeScript 源码。
- GitHub Pages 由 Actions 直接发布 `app/dist`，不再依赖阿里云 OSS。
- 修改网站内容时，只改 `app/` 里的源码并推送到 `main`。
- GitHub Actions 会自动测试、构建，并把新版静态文件发布到 GitHub Pages。
- 阿里云只保留域名解析和续费，不再上传网站文件。

正式网址：

- http://www.jide-naojiankang.cn/
- http://jide-naojiankang.cn/

本地开发常用命令：

```bash
cd app
pnpm install
pnpm test
pnpm build:pages
```
