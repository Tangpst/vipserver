const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const wpsService = require('./wps'); 

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static(path.join(__dirname, '../public')));

// ================= 配置区域 (请在这里填入你的字段ID) =================

const WPS_CONFIG = {
  // 场景1：查询我的邀请名单 (对应 sid=3)
  // 逻辑：在表3中，查找“邀请人手机号”等于“我的手机号”的记录
  inviteList: {
    sid: 3,
    fid: "邀请人电话" // 【请修改】表3中，存储“邀请人手机号”的那一列的 Field ID
  },

  // 场景2：查询被邀请人的资金 (对应 sid=4)
  // 逻辑：在表4中，查找“用户手机号”等于“被点击人手机号”的记录
  memberFund: {
    sid: 4,
    fid: "被邀请人电话" // 【请修改】表4中，存储“用户手机号”的那一列的 Field ID
  }
};

// ===================================================================

/**
 * API 1: 通用信息查询接口 (对应 /api/user-info)
 */
app.get('/api/user-info', async (req, res) => {
  const phone = req.query.phone;
  const mode = req.query.mode;

  if (!phone) return res.status(400).json({ error: '需要手机号' });

  try {
    let targetSid, targetFid;

    if (mode === 'member_fund') {
      // 模式：查被邀请人的资金情况
      console.log(`[API] Mode: Member Fund (SID=${WPS_CONFIG.memberFund.sid})`);
      targetSid = WPS_CONFIG.memberFund.sid;
      targetFid = WPS_CONFIG.memberFund.fid;
    } else {
      // 默认模式：查我的邀请名单
      console.log(`[API] Mode: Invite List (SID=${WPS_CONFIG.inviteList.sid})`);
      targetSid = WPS_CONFIG.inviteList.sid;
      targetFid = WPS_CONFIG.inviteList.fid;
    }

    // 调用 WPS，只传 sid, fid, val
    const data = await wpsService.queryData(targetSid, targetFid, phone);
    
    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * API 2: 资金明细列表
 */
app.get('/api/fund-details', async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: '需要手机号' });

  try {
    // 这个接口比较特殊，WPS脚本只需要手机号
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