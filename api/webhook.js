const CHANNEL_ACCESS_TOKEN = "ใส่ของเธอ";

// ================= MAIN =================
export default async function handler(req, res) {
  try {

    if (req.method !== "POST") {
      return res.status(200).send("OK");
    }

    const body = req.body;

    if (!body || !body.events) {
      return res.status(200).send("OK");
    }

    for (const event of body.events) {

      if (event.type === "message") {
        await handleMessage(event);
      }

      if (event.type === "postback") {
        await handlePostback(event);
      }
    }

  } catch (err) {
    console.error(err);
  }

  return res.status(200).send("OK");
}

// ================= MESSAGE =================
async function handleMessage(event) {
  const text = event.message.text;
  const userId = event.source.userId;

  if (text.startsWith("done_")) {
    const caseId = text.replace("done_", "");
    await markDone(caseId);
    return replyText(event.replyToken, "✅ ปิดเคสเรียบร้อย");
  }

  const answers = {
    q1: text,
    q2: "-",
    q3: "-",
    q4: "-",
    q5: "-"
  };

  return processResult(event.replyToken, userId, answers);
}

// ================= PROCESS =================
async function processResult(replyToken, userId, answers) {
  const level = classify(answers);
  const caseId = Date.now();

  // 🔥 ตอนนี้ยังไม่ต่อ Google Sheet (เดี๋ยวเราค่อยต่อทีหลัง)
  // await saveToSheet(...)

  if (level === "red") {
    return replyText(replyToken,
      "💛 สิ่งที่คุณกำลังเผชิญมันดูหนักมากเลยนะ\n" +
      "คุณไม่จำเป็นต้องรับมือกับมันคนเดียว\n\n" +
      "ทีมของเราจะช่วยประสานให้คุณได้คุยกับผู้ใหญ่ที่สามารถช่วยคุณได้\n" +
      "และเราจะอยู่ข้างคุณในขั้นตอนนี้นะ"
    );

  } else if (level === "yellow") {
    return replyText(replyToken,
      "💛 ขอบคุณที่เล่าให้เราฟังนะ\n" +
      "เดี๋ยวเราจะหาพี่นักเรียนที่ผ่านการเทรนแล้ว\n" +
      "มาคุยและอยู่เป็นเพื่อนคุณนะ"
    );

  } else {
    return replyText(replyToken,
      "🌿 ขอบคุณที่เปิดใจนะ\n" +
      "ถ้าคุณอยาก ลองเริ่มจากการดูข้อมูลหรือเครื่องมือช่วยเหลือเบื้องต้นก่อนได้\n" +
      "หรือจะเล่าให้เราฟังเพิ่มเติมก็ได้เสมอเลยนะ"
    );
  }
}

// ================= CLASSIFY =================
function classify(answers) {
  return "yellow"; // เดี๋ยวเราทำ scoring จริงทีหลัง
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;

  if (data.startsWith("accept_")) {
    const caseId = data.replace("accept_", "");
    return replyText(event.replyToken, "✅ รับเคสแล้ว");
  }
}

// ================= DONE =================
async function markDone(caseId) {
  // placeholder
}

// ================= UTIL =================
async function replyText(replyToken, text) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });
}
