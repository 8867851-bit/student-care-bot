export default async function handler(req, res) {
  try {
    // 🔥 ต้องตอบ 200 สำหรับทุก method
    if (req.method === 'POST') {
      return res.status(200).json({ message: 'OK' });
    }

    // GET ก็ให้ผ่าน
    return res.status(200).send('OK');

  } catch (e) {
    return res.status(200).send('OK');
  }
}
