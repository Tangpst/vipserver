const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken'); // 新增
const wpsService = require('./wps'); 
const smsService = require('./smsService'); // 新增

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static(path.join(__dirname, '../public')));

// --- 简单的内存存储验证码 (生产环境建议用 Redis) ---
const OTP_CACHE = {}; 

// ================= 配置区域 =================
const WPS_CONFIG = {
  inviteList: { sid: 3, fid: "邀请人电话" },
  memberFund: { sid: 4, fid: "被邀请人电话" }
};
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// ================= 鉴权接口 =================

/**
 * 接口 1: 发送验证码
 */
app.post('/api/send-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: '请输入手机号' });

  // 生成6位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 存入缓存 (5分钟有效)
    OTP_CACHE[phone] = { code, expire: Date.now() + 5 * 60 * 1000 };
    
    // 发送短信
    await smsService.sendVerifyCode(phone, code);
    
    // 如果是测试模式，把验证码返回给前端方便填入
    if (process.env.MOCK_SMS_MODE === 'true') {
        return res.json({ success: true, msg: '验证码已发送(测试)', mockCode: code });
    }

    res.json({ success: true, msg: '验证码已发送' });
  } catch (error) {
    res.status(500).json({ error: '短信发送失败: ' + error.message });
  }
});

/**
 * 接口 2: 登录校验
 */
app.post('/api/login', (req, res) => {
  const { phone, code } = req.body;
  
  const cached = OTP_CACHE[phone];
  
  // 校验验证码
  if (!cached) return res.status(400).json({ error: '请先获取验证码' });
  if (Date.now() > cached.expire) return res.status(400).json({ error: '验证码已过期' });
  if (cached.code !== code) return res.status(400).json({ error: '验证码错误' });

  // 验证通过，生成 Token
  // 这里的 token 包含了用户的手机号信息
  const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' }); // 7天过期

  // 清除验证码
  delete OTP_CACHE[phone];

  res.json({ success: true, token, phone });
});


// ================= 业务接口 (增加鉴权中间件) =================

// 简单的鉴权中间件函数
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // 格式: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: '未登录' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token无效或过期' });
    req.user = user; // 把解析出来的 user (包含 phone) 挂载到 req 上
    next();
  });
}

/**
 * API 3: 通用信息查询 (现在可以从 Token 里取手机号了，更安全)
 */
app.get('/api/user-info', authenticateToken, async (req, res) => {
  // 优先使用 URL 传参，如果没有，则使用登录用户的手机号
  const phone = req.query.phone || req.user.phone; 
  
  if (!phone) return res.status(400).json({ error: '无法获取手机号' });

  try {
    const data = await wpsService.queryData(
        WPS_CONFIG.inviteList.sid, 
        WPS_CONFIG.inviteList.fid, 
        phone
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * API 4: 资金明细列表
 */
app.get('/api/fund-details', authenticateToken, async (req, res) => {
  const phone = req.query.phone || req.user.phone;
  
  if (!phone) return res.status(400).json({ error: '无法获取手机号' });

  try {
    const data = await wpsService.queryFundSimple(phone);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '查询失败' });
  }
});

const port = 9000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});