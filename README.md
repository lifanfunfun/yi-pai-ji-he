# 一拍即合

多感官数字音乐玩具，包含四个交互模块：舞（身体动作）、漾（空间连接）、织（节奏组合）、绘（图像表达）。

## 在线体验

[打开一拍即合](https://yi-pai-ji-he.netlify.app/)

当前网站通过 Netlify 发布包上线。GitHub 自动部署连接尚待完成仓库授权。

## 运行与构建

使用 Node.js 22 和 pnpm 10。

```sh
pnpm install --frozen-lockfile
pnpm exec vite --host 0.0.0.0 --config vite.deploy.config.js
pnpm exec vite build --config vite.deploy.config.js
node --test tests/*.test.js
```

## Netlify 发布

在 Netlify 导入本仓库。根目录 `netlify.toml` 已指定构建命令和 `dist` 发布目录。连接成功后，GitHub 推送会触发构建。

摄像头需要 HTTPS 或 localhost；浏览器首次请求权限时需用户授权。音乐需要点击开始互动激活音频。

## 当前边界

当前版本为浏览器 MVP。手势模型、WASM 和部分大提琴采样仍通过远程地址加载；尚未提供完整 PWA 离线缓存，不保证断网使用。手机与 iPad 的实际设备验收仍需进行。

示范画及第三方音源的权利归各自权利人所有，公开源码不等于对第三方素材重新授权。商业或比赛使用前应核对素材授权。
