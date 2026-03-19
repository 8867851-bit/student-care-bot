// ================= CONFIG =================
const GAS_URL = "https://script.google.com/macros/s/AKfycbwBcroUViA_w7mq1-PI1EetJGG7X-de6zXTqrtj-sjLSczoBT2HgeGCSRzMbjHIOZkzmA/exec";
const CHANNEL_ACCESS_TOKEN = process.env.4lUD0827K5XXnRyI9tJn9nXncbC9DHUuCSHMSOu01/UYrDLxnQGUKMGSWqoFoc+obKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEsaEgehAEIT0BfXujeuCcQ7maJoTCh/VH11mA3l7NbUbQdB04t89/1O/w1cDnyilFU=;

// ================= SESSION (simple) =================
const sessions = {}; // { userId: { q1,q2,q3,q4,q5 } }

// ================= MAIN =================
export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).send("OK");
    if (!req.body || !req.body.events) return res.status(200).send("OK");

    for (const event of req.body.events) {
      if (event.type === "message") {
        await handleMessage(event);
      }
      if (event.type === "postback") {
        await handlePostback(event);
      }
    }
  } catch (err) {
    console.log("ERROR:", err);
  }

  return res.status(200).send("OK");
}

// ================= MESSAGE =================
async function handleMessage(event) {
  const userId = event.source.userId;

  // เริ่มต้น → แสดงเมนู
  if (!sessions[userId]) {
    return sendMainMenu(event.replyToken);
  }

  // ถ้าอยู่ใน flow → กันพิมพ์มั่ว
  return replyText(event.replyToken, "กรุณาเลือกจากปุ่มด้านบน 👆");
}

// ================= MAIN MENU =================
async function sendMainMenu(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: "💛 Student Care TU", weight: "bold" },
        { type: "text", text: "วันนี้คุณอยากทำอะไร?" },

        { type: "button", action: { type: "postback", label: "คุยเรื่องที่หนักใจ", data: "menu_talk" }},
        { type: "button", action: { type: "postback", label: "รวมข้อมูล", data: "menu_resource" }},
        { type: "button", action: { type: "postback", label: "กิจกรรม / โครงการ", data: "menu_activity" }},
        { type: "button", action: { type: "postback", label: "เหตุการณ์เร่งด่วน", data: "menu_urgent" }}
      ]
    }
  });
}

// ================= QUESTIONS =================
async function sendQ1(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ", weight: "bold" },
        { type: "text", text: "ตอนนี้คุณอยากคุยเกี่ยวกับอะไร?" },

        { type: "button", action: { type: "postback", label: "ความเครียด", data: "q1_stress" }},
        { type: "button", action: { type: "postback", label: "เรื่องเรียน", data: "q1_academic" }},
        { type: "button", action: { type: "postback", label: "ความสัมพันธ์", data: "q1_relationship" }},
        { type: "button", action: { type: "postback", label: "ความรู้สึกตัวเอง", data: "q1_self" }}
      ]
    }
  });
}

async function sendQ2(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว?", weight: "bold" },

        { type: "button", action: { type: "postback", label: "เพิ่งเกิด", data: "q2_short" }},
        { type: "button", action: { type: "postback", label: "สักพักแล้ว", data: "q2_medium" }},
        { type: "button", action: { type: "postback", label: "นานแล้ว", data: "q2_long" }}
      ]
    }
  });
}

async function sendQ3(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "เรื่องนี้ส่งผลกับชีวิตคุณแค่ไหน?", weight: "bold" },

        { type: "button", action: { type: "postback", label: "นิดหน่อย", data: "q3_low" }},
        { type: "button", action: { type: "postback", label: "พอสมควร", data: "q3_medium" }},
        { type: "button", action: { type: "postback", label: "มาก", data: "q3_high" }}
      ]
    }
  });
}

async function sendQ4(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "ตอนนี้คุณมีใครคุยเรื่องนี้อยู่ไหม?", weight: "bold" },

        { type: "button", action: { type: "postback", label: "ยังไม่มี", data: "q4_none" }},
        { type: "button", action: { type: "postback", label: "มีเพื่อน", data: "q4_friend" }},
        { type: "button", action: { type: "postback", label: "มีครู/ผู้ใหญ่", data: "q4_adult" }}
      ]
    }
  });
}

async function sendQ5(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "ตอนนี้คุณอยากได้ความช่วยเหลือแบบไหน?", weight: "bold" },

        { type: "button", action: { type: "postback", label: "คุยกับพี่นักเรียน", data: "q5_peer" }},
        { type: "button", action: { type: "postback", label: "คุยกับครู", data: "q5_teacher" }},
        { type: "button", action: { type: "postback", label: "แค่อยากระบาย", data: "q5_listen" }}
      ]
    }
  });
}

// ================= CLASSIFY =================
function classify(s) {
  let score = 0;
  if (s.q2 === "q2_long") score += 2;
  if (s.q2 === "q2_medium") score += 1;
  if (s.q3 === "q3_high") score += 3;
  if (s.q3 === "q3_medium") score += 2;
  if (s.q4 === "q4_none") score += 2;

  if (score >= 5) return "red";
  if (score >= 3) return "yellow";
  return "green";
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  if (data === "menu_talk") {
    sessions[userId] = {};
    return sendQ1(replyToken);
  }

  if (!sessions[userId]) return sendMainMenu(replyToken);

  if (data.startsWith("q1_")) {
    sessions[userId].q1 = data;
    return sendQ2(replyToken);
  }

  if (data.startsWith("q2_")) {
    sessions[userId].q2 = data;
    return sendQ3(replyToken);
  }

  if (data.startsWith("q3_")) {
    sessions[userId].q3 = data;
    return sendQ4(replyToken);
  }

  if (data.startsWith("q4_")) {
    sessions[userId].q4 = data;
    return sendQ5(replyToken);
  }

  if (data.startsWith("q5_")) {
    sessions[userId].q5 = data;

    const result = classify(sessions[userId]);

    const payload = {
      caseId: Date.now(),
      userId,
      ...sessions[userId],
      level: result
    };

    delete sessions[userId];

    await sendToSheet(payload);

    if (result === "red") {
      return replyText(replyToken,
        "💛 เรื่องนี้ดูหนักมากเลยนะ\nทีมจะช่วยประสานผู้ใหญ่ให้คุณทันทีนะ"
      );
    }

    if (result === "yellow") {
      return replyText(replyToken,
        "💛 ขอบคุณที่เล่าให้เราฟังนะ\nเดี๋ยวเราจะหาพี่ไปคุยกับคุณนะ"
      );
    }

    return replyText(replyToken,
      "🌿 ขอบคุณที่เปิดใจนะ\nลองเริ่มจาก resource หรือเล่าต่อได้เลยนะ"
    );
  }
}

// ================= SEND =================
async function sendToSheet(data) {
  await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

// ================= REPLY =================
async function replyFlex(replyToken, bubble) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "flex", altText: "question", contents: bubble }]
    })
  });
}

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
