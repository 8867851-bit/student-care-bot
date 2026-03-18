export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const body = req.body;

  if (!body.events) {
    return res.status(200).send('OK');
  }

  const event = body.events[0];

  if (event.type === 'message') {
    const replyToken = event.replyToken;

    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer x/mWpT0XYnCfleNji48WWFSVsh1OFgWihA1lT9RdoVL87mfvLeEJqTZJQNLpWSd+bKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEv2eRy6VhfBZObZleYNjur+J47h9oWE1Ta1U+HeMerm6wdB04t89/1O/w1cDnyilFU='
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: '💛 ระบบเชื่อมต่อสำเร็จแล้วนะ'
          }
        ]
      })
    });
  }

  return res.status(200).send('OK');
}
