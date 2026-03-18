export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const body = req.body;

    if (!body.events || body.events.length === 0) {
      return res.status(200).send('OK');
    }

    const event = body.events[0];

    if (!event.replyToken) {
      return res.status(200).send('OK');
    }

    // ตอบกลับ LINE แบบถูก format
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer RsUsRvXIvffmLup/hOPRpL01dw8MehItJcON7RcTPAkEee9jvChHfM2kJTmlfct+bKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEtJMWYJiBrQZrHt62mohYXm0e8PRjLb5ncmXQX5t+9d9gdB04t89/1O/w1cDnyilFU='
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: '💛 ระบบเชื่อมต่อสำเร็จแล้ว'
          }
        ]
      })
    });

    return res.status(200).send('OK');

  } catch (err) {
    return res.status(200).send('OK');
  }
}
