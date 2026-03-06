# 猜画画小游戏

前端画简笔画，由 **国内智谱 AI** 识别，适合展厅、内网等无法访问 Google 的环境。右侧为蜗壳小助手，气泡说话 + 定期 AI 小知识。

## 项目结构

- `index.html` - 页面入口
- `css/style.css` - 卡通风格样式
- `js/config.js` - 前端配置（API 地址）
- `js/app.js` - 画板、识别请求、蜗壳小助手气泡与姿势切换
- `images/mascot.png` - 蜗壳小助手待机图
- `images/mascot-think.png` - 思考姿势
- `images/mascot-wave.png` - 挥手姿势
- `server.py` - 后端（智谱视觉 API）
- `requirements.txt`、`.env.example`

## 本地运行

1. 创建虚拟环境：`python -m venv venv`，激活后 `pip install -r requirements.txt`
2. 复制 `.env.example` 为 `.env`，填入智谱 API Key（[开放平台](https://open.bigmodel.cn/usercenter/apikeys) 申请）
3. 运行：`python server.py`
4. 浏览器访问：http://localhost:5000

## 展厅部署

在能访问国内网络的机器上运行 `python server.py`，大屏访问 `http://本机IP:5000` 即可。
