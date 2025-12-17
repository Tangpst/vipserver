const Core = require('@alicloud/pop-core');

const {
  ALIBABA_CLOUD_ACCESS_KEY_ID,
  ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  SMS_SIGN_NAME,
  SMS_TEMPLATE_CODE,
  MOCK_SMS_MODE
} = process.env;

// 初始化阿里云客户端
const client = new Core({
  accessKeyId: ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25'
});

exports.sendVerifyCode = async (phone, code) => {
  // 1. 如果开启了测试模式，直接打印，不请求阿里云
  if (MOCK_SMS_MODE === 'true') {
    console.log(`[MOCK SMS] To: ${phone}, Code: ${phone}`);
    return { Code: 'OK', Message: 'Mock Success' };
  }

  // 2. 真实发送
  const params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phone,
    "SignName": SMS_SIGN_NAME,
    "TemplateCode": SMS_TEMPLATE_CODE,
    "TemplateParam": JSON.stringify({ code: code }) // 假设你的模板变量名是 code
  };

  const requestOption = {
    method: 'POST',
    formatParams: false,
  };

  try {
    const result = await client.request('SendSms', params, requestOption);
    return result;
  } catch (error) {
    console.error('SMS Send Failed:', error);
    throw error;
  }
};