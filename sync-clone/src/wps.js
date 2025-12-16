const process = require('process');

const { 
  USER_AIR_URL, 
  TRAN_AIR_URL, 
  AIRSCRIPT_TOKEN 
} = process.env;

/**
 * 基础请求发送函数
 */
async function sendToWps(url, payload) {
  if (!url) throw new Error('WPS URL未配置');

  // 【核心修复】严格参考官方文档结构
  // 参数必须包裹在 Context.argv 中
  const bodyData = {
    Context: {
      argv: {
        sid: payload.sid,
        fid: payload.fid,
        val: payload.val
      }
    }
  };

  try {
    console.log(`[WPS] POST Request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 官方文档要求的 Header
        'AirScript-Token': AIRSCRIPT_TOKEN 
      },
      body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
      const errorText = await response.text(); 
      console.error(`[WPS Error] Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`WPS API Error: ${response.status} - ${errorText}`);
    }
    
    // WPS 可能会返回 {"result": ...} 或直接返回数据
    // 这里直接返回解析后的 JSON
    return await response.json();

  } catch (error) {
    console.error('[WPS Request Failed]', error);
    return { error: error.message };
  }
}

// --- 业务方法 ---

exports.queryData = async (sid, fid, val) => {
  return await sendToWps(USER_AIR_URL, {
    sid: sid,
    fid: fid,
    val: val
  });
};

exports.queryFundSimple = async (phone) => {
  return await sendToWps(TRAN_AIR_URL, {
    val: phone
  });
};