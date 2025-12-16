const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // 引入 path 模块用于处理文件路径

const app = express();

// 配置解析器
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 9000;

// 【关键步骤】设置静态文件目录
// path.join(__dirname, '../public') 表示：当前文件所在目录的上级目录下的 public 文件夹
// 这样用户访问 http://你的域名/ 时，Express 会自动寻找 public/index.html
app.use(express.static(path.join(__dirname, '../public')));


// --- 下面是 API 接口区域 ---

// 示例：将来你可以用这个接口获取 WPS 里的数据
app.get('/api/user-info', (req, res) => {
  // 模拟返回数据
  res.json({
    name: "陈大明",
    balance: 1250.00,
    list: []
  });
});

// 示例：接收前端提交的数据
app.post('/api/submit', (req, res) => {
  console.log(req.body);
  res.send({ status: 'success' });
});


// 启动服务
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`Static files served from: ${path.join(__dirname, '../public')}`);
});