// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzbOgGGwOGwwSrt_Mht8dzA6n4ed-MzINv2T_dig8wrw39M1mzqI3uK55Jtl86IFbs_kQ/exec";
const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5";

// ================= SESSION =================
const sessions = {};

// ================= FLOW =================
const flows = {
  talk: {
    steps: [
      {
        key: "q1",
        text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ\nตอนนี้คุณอยากคุยเกี่ยวกับอะไร?",
        options: [
          { label: "ความเครียด", value: "stress" },
          { label: "เรื่องเรียน", value: "academic" },
          { label: "ความสัมพันธ์", value: "relationship" },
          { label: "ความรู้สึกตัวเอง", value: "self" }
        ]
      },
      {
        key: "q2",
        text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว?",
        options: [
          { label: "เพิ่งเกิด", value: "short" },
          { label: "สักพักแล้ว", value: "medium" },
          { label: "นานแล้ว", value: "long" }
        ]
      },
      {
        key: "q3",
        text: "เรื่องนี้ส่งผลกับชีวิตคุณแค่ไหน?",
        options: [
          { label: "นิดหน่อย", value: "low" },
          { label: "พอสมควร", value: "medium" },
          { label: "มาก", value: "high" }
        ]
      },
      {
        key: "q4",
        text: "ตอนนี้คุณมีใครคุยเรื่องนี้อยู่ไหม?",
        options: [
          { label: "ยังไม่มี", value: "none" },
          { label: "มีเพื่อน", value: "friend" },
          { label: "มีครู/ผู้ใหญ่", value: "adult" }
        ]
      },
      {
        key: "q5",
        text: "ตอนนี้คุณอยากได้ความช่วยเหลือแบบไหน?",
        options: [
          { label: "คุยกับพี่นักเรียน", value: "peer" },
          { label: "คุยกับครู", value: "teacher" },
          { label: "แค่ระบาย", value: "listen" }
        ]
      }
    ]
  }
};

// ================= MAIN =================
module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).send("OK");

  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  console.log("BODY:", JSON.stringify(body, null, 2)); // 👈 ใส่ตรงนี้

  const events = body?.events || [];

  for (const event of events) {
    if (event.type === "message") await handleMessage(event);
    if (event.type === "postback") await handlePostback(event);
  }

  return res.status(200).send("OK");
}

// ================= MESSAGE =================
async function handleMessage(event) {
  const text = event.message.text;
  const type = event.source.type;

  if (type === "user") return sendMainMenu(event.replyToken);
  if (type === "group" && text === "start") return sendMainMenu(event.replyToken);
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;

  if (data.startsWith("accept_")) {
    const caseId = data.replace("accept_", "");
    return acceptCase(caseId, userId, event.replyToken);
  }

  if (data.startsWith("start_")) {
    sessions[userId] = { flow: "talk", step: 0, answers: {} };
    return sendStep(userId, event.replyToken);
  }

  const s = sessions[userId];
  const flow = flows[s.flow];
  const step = flow.steps[s.step];

  s.answers[step.key] = data;
  s.step++;

  if (s.step < flow.steps.length) {
    return sendStep(userId, event.replyToken);
  }

  const level = classify(s.answers);
  const caseId = Date.now();

  await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", caseId, userId, ...s.answers, level })
  });

  await notifyTeam(level, caseId, s.answers);

  delete sessions[userId];

  return replyText(event.replyToken, "ส่งเรื่องเรียบร้อย 💛");
}

// ================= STEP =================
async function sendStep(userId, replyToken) {
  const s = sessions[userId];
  const step = flows[s.flow].steps[s.step];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: step.text, wrap: true },
        ...step.options.map(o => ({
          type: "button",
          action: { type: "postback", label: o.label, data: o.value }
        }))
      ]
    }
  });
}

// ================= CLASSIFY =================
function classify(s) {
  let score = 0;
  if (s.q2 === "long") score += 2;
  if (s.q3 === "high") score += 3;
  if (s.q4 === "none") score += 2;

  if (score >= 5) return "red";
  if (score >= 3) return "yellow";
  return "green";
}
// ================= MENU =================
async function sendMainMenu(replyToken) {
  return replyFlex(replyToken, {
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
          size: "lg"
        },
        {
          type: "text",
          text: "วันนี้คุณอยากทำอะไร?"
        },
        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "คุยเรื่องที่หนักใจ",
            data: "start_talk"
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
            label: "กิจกรรม",
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
  });
}
// ================= ACCEPT =================
async function acceptCase(caseId, userId, replyToken) {
  const name = await getUserName(userId);
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ action:"accept", caseId, userId, name })
  });

  const txt = await res.text();

  if (txt === "OK") return replyText(replyToken, "✅ รับเคสแล้ว");
  if (txt === "TAKEN") return replyText(replyToken, "❌ เคสเต็มแล้ว");

  return replyText(replyToken, "⚠️ error");
}
// ================= NOTIFY =================
async function notifyTeam(level, caseId, answers) {
  if (!GROUP_ID) return;

  const flex = {
    type: "flex",
    altText: "📌 มีเคสใหม่",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📌 เคสใหม่", weight: "bold" },
          { type: "text", text: "Level: " + level },
          { type: "text", text: "Need: " + answers.q5 },
          { type: "text", text: answers.q1, wrap: true }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",   // 👈 เพิ่มบรรทัดนี้
        contents: [{
          type: "button",
          action: {
            type: "postback",
            label: "รับเคส",
            data: "accept_" + caseId
          }
        }]
      }
    }
  };

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      to: GROUP_ID,
      messages: [flex]
    })
  });

// 👇 เพิ่มตรงนี้เท่านั้น
const text = await res.text();
console.log("STATUS:", res.status);
console.log("RESPONSE:", text);

}
//====== ดึงชื่อ ========
async function getUserName(userId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/profile/${userId}`,
    {
      headers: {
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
      }
    }
  );

  const data = await res.json();
  return data.displayName;
}
// ================= REPLY =================
async function replyText(token, text) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken: token,
      messages:[{ type:"text", text }]
    })
  });
}

async function replyFlex(replyToken, bubble) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [{
        type: "flex",
        altText: "menu",
        contents: bubble
      }]
    })
  });
}
