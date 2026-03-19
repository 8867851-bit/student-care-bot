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
  return sendMainMenu(event.replyToken);
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
          { type: "text", text: "💛 Student Care TU", weight: "bold" },
          { type: "text", text: "วันนี้คุณอยากทำอะไร" },

          {
            type: "button",
            action: { type: "postback", label: "คุยเรื่องที่หนักใจ", data: "menu_talk" }
          },
          {
            type: "button",
            action: { type: "postback", label: "รวมข้อมูล", data: "menu_resource" }
          },
          {
            type: "button",
            action: { type: "postback", label: "กิจกรรม / โครงการ", data: "menu_activity" }
          },
          {
            type: "button",
            action: { type: "postback", label: "เหตุการณ์เร่งด่วน", data: "menu_urgent" }
          }
        ]
      }
    }
  };

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({ replyToken, messages: [flex] })
  });
}

// ================= Q1 =================
async function sendQ1(replyToken) {
  const flex = {
    type: "flex",
    altText: "เลือกเรื่อง",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ", weight: "bold" },
          { type: "text", text: "ตอนนี้คุณอยากคุยเกี่ยวกับอะไร" },

          { type: "button", action: { type: "postback", label: "ความเครียด", data: "q1_stress" }},
          { type: "button", action: { type: "postback", label: "เรื่องเรียน", data: "q1_academic" }},
          { type: "button", action: { type: "postback", label: "ความสัมพันธ์", data: "q1_relationship" }},
          { type: "button", action: { type: "postback", label: "ความรู้สึกตัวเอง", data: "q1_self" }}
        ]
      }
    }
  };

  return replyFlex(replyToken, flex);
}

// ================= Q2 =================
async function sendQ2(replyToken) {
  const flex = {
    type: "flex",
    altText: "ระยะเวลา",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว", weight: "bold" },

          { type: "button", action: { type: "postback", label: "เพิ่งเกิด", data: "q2_short" }},
          { type: "button", action: { type: "postback", label: "สักพักแล้ว", data: "q2_medium" }},
          { type: "button", action: { type: "postback", label: "นานแล้ว", data: "q2_long" }}
        ]
      }
    }
  };

  return replyFlex(replyToken, flex);
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // MENU
  if (data === "menu_talk") return sendQ1(replyToken);
  if (data === "menu_resource") return replyText(replyToken, "📚 รวมข้อมูล");
  if (data === "menu_activity") return replyText(replyToken, "🎯 กิจกรรม");
  if (data === "menu_urgent") return replyText(replyToken, "🚨 เหตุการณ์เร่งด่วน");

  // Q1 → Q2
  if (data.startsWith("q1_")) {
    sessions[userId] = { q1: data };
    return sendQ2(replyToken);
  }

  // Q2 (แค่ test ก่อน)
  if (data.startsWith("q2_")) {
    sessions[userId].q2 = data;
    return replyText(replyToken, "✅ ได้ข้อมูลแล้ว (เดี๋ยวไป Q3 ต่อ)");
  }
}

// ================= UTIL =================
async function replyFlex(replyToken, flex) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
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
