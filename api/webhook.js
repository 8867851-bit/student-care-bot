// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "ใส่ของเธอ";

// เก็บ session ชั่วคราว
const sessions = {};

// ================= MAIN =================
export default async function handler(req, res) {
  try {
    // 🔥 LINE VERIFY จะเป็น GET
    if (req.method === "GET") {
      return res.status(200).send("OK");
    }

    // 🔥 กัน request แปลก ๆ
    if (!req.body || !req.body.events) {
      return res.status(200).send("OK");
    }

    const events = req.body.events;

    for (const event of events) {

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
  const replyToken = event.replyToken;

  // 👉 เริ่ม flow = ส่ง Q1
  return sendQ1(replyToken);
}

// ================= Q1 FLEX =================
async function sendQ1(replyToken) {
  const url = "https://api.line.me/v2/bot/message/reply";

  const flex = {
    type: "flex",
    altText: "เลือกเรื่องที่อยากคุย",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ",
            weight: "bold",
            size: "md",
            wrap: true
          },
          {
            type: "text",
            text: "ตอนนี้คุณอยากคุยเกี่ยวกับอะไร",
            size: "sm",
            wrap: true
          },

          {
            type: "button",
            action: {
              type: "postback",
              label: "ความเครียด",
              data: "q1_stress"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "เรื่องเรียน",
              data: "q1_academic"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "ความสัมพันธ์",
              data: "q1_relationship"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "ความรู้สึกตัวเอง",
              data: "q1_self"
            }
          }
        ]
      }
    }
  };

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [flex]
    })
  });
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // 👉 เริ่ม session
  if (!sessions[userId]) {
    sessions[userId] = {};
  }

  // 👉 เก็บ Q1
  if (data.startsWith("q1_")) {
    sessions[userId].q1 = data;

    return replyText(replyToken, "📌 (ต่อไปเราจะถาม Q2)");
  }
}

// ================= REPLY TEXT =================
async function replyText(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [
        {
          type: "text",
          text: text
        }
      ]
    })
  });
}
