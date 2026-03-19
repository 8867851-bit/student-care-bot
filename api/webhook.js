// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "4lUD0827K5XXnRyI9tJn9nXncbC9DHUuCSHMSOu01/UYrDLxnQGUKMGSWqoFoc+obKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEsaEgehAEIT0BfXujeuCcQ7maJoTCh/VH11mA3l7NbUbQdB04t89/1O/w1cDnyilFU=";

// session
const sessions = {};

// ================= MAIN =================
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).send("OK");
    }

    if (!req.body || !req.body.events) {
      return res.status(200).send("OK");
    }

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
  const replyToken = event.replyToken;

  // 👉 ทุกครั้งเริ่ม = menu
  return sendMainMenu(replyToken);
}

// ================= MAIN MENU =================
async function sendMainMenu(replyToken) {
  const url = "https://api.line.me/v2/bot/message/reply";

  const flex = {
    type: "flex",
    altText: "เมนูหลัก",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "💛 Student Care TU",
            weight: "bold",
            size: "md"
          },
          {
            type: "text",
            text: "วันนี้คุณอยากทำอะไร",
            size: "sm"
          },

          {
            type: "button",
            action: {
              type: "postback",
              label: "คุยเรื่องที่หนักใจ",
              data: "menu_talk"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "รวมข้อมูล",
              data: "menu_resource"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "กิจกรรม / โครงการ",
              data: "menu_activity"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "เหตุการณ์เร่งด่วน",
              data: "menu_urgent"
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
      replyToken,
      messages: [flex]
    })
  });
}

// ================= Q1 =================
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
            weight: "bold"
          },
          {
            type: "text",
            text: "ตอนนี้คุณอยากคุยเกี่ยวกับอะไร",
            size: "sm"
          },

          {
            type: "button",
            action: { type: "postback", label: "ความเครียด", data: "q1_stress" }
          },
          {
            type: "button",
            action: { type: "postback", label: "เรื่องเรียน", data: "q1_academic" }
          },
          {
            type: "button",
            action: { type: "postback", label: "ความสัมพันธ์", data: "q1_relationship" }
          },
          {
            type: "button",
            action: { type: "postback", label: "ความรู้สึกตัวเอง", data: "q1_self" }
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
      replyToken,
      messages: [flex]
    })
  });
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  // 👉 กด menu
  if (data === "menu_talk") {
    return sendQ1(replyToken);
  }

  if (data === "menu_resource") {
    return replyText(replyToken, "📚 รวมข้อมูล (เดี๋ยวเราจะลิงก์เว็บให้)");
  }

  if (data === "menu_activity") {
    return replyText(replyToken, "🎯 กิจกรรม / โครงการ (เดี๋ยวเพิ่ม)");
  }

  if (data === "menu_urgent") {
    return replyText(replyToken, "🚨 เหตุการณ์เร่งด่วน กรุณาติดต่อครูทันที");
  }

  // 👉 Q1
  if (data.startsWith("q1_")) {
    sessions[userId] = { q1: data };
    return replyText(replyToken, "📌 ต่อไปเราจะถามคำถามต่อ");
  }
}

// ================= TEXT =================
async function replyText(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";

  await fetch(url, {
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
