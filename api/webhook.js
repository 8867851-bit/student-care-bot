// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyR0siRWKlScIozsxY1DCSFMdJ1BaGX49GJtdCQuGCfXT81ppnW8NliliRQ-pyCaHo0lQ/exec";
const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5";
const sessions = {};
if (!global.caseMap) global.caseMap = {};

// ================= MAIN =================
module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).send("OK");

  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  const events = body?.events || [];

  for (const event of events) {
    if (event.type === "message") await handleMessage(event);
    if (event.type === "postback") await handlePostback(event);
  }

  return res.status(200).send("OK");
};

// ================= MESSAGE =================
async function handleMessage(event) {
  const type = event.source.type;

  if (type === "user") return sendMainMenu(event.replyToken);
  if (type === "group") return;
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;

  if (data.startsWith("chooseRole_")) return handleChooseRole(event);
  if (data.startsWith("accept_")) return handleAccept(event);
  if (data.startsWith("slot_")) return handleSlot(event);
  if (data.startsWith("confirm_")) return handleConfirm(event);
  if (data.startsWith("start_")) return startFlow(event);

  return handleFlow(event);
}

// ================= HANDLERS =================

// ---- choose role ----
async function handleChooseRole(event) {
  const caseId = event.postback.data.replace("chooseRole_", "");

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "คุณเป็นใคร?" },
        {
          type: "button",
          action: {
            type: "postback",
            label: "นักเรียน",
            data: "accept_" + caseId + "_student"
          }
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "ครู",
            data: "accept_" + caseId + "_teacher"
          }
        }
      ]
    }
  });
}

// ---- accept ----
async function handleAccept(event) {
  const [_, caseId, role] = event.postback.data.split("_");
  const userId = event.source.userId;

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ action:"accept", caseId, userId, role })
  });

  const data = await res.json();

  if (data.status !== "OK") {
    return replyText(event.replyToken, "❌ รับเคสไม่ได้");
  }

  global.caseMap[caseId] = {
    userId: data.targetUserId,
    peerId: userId
  };

  await sendTimeSlots(userId, caseId);
  return replyText(event.replyToken, "✅ รับเคสแล้ว");
}

// ---- slot ----
async function handleSlot(event) {
  const parts = event.postback.data.split("_");
  const caseId = parts[1];
  const slot = parts.slice(2).join("_");

  const map = global.caseMap?.[caseId];
  if (!map) return replyText(event.replyToken, "❌ case not found");

  await pushToUser(map.userId, {
    type: "flex",
    altText: "เลือกเวลา",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "💛 พี่ว่างช่วงนี้นะ" },
          { type: "text", text: formatSlot(slot) },
          {
            type: "button",
            action: {
              type: "postback",
              label: "เลือกเวลานี้",
              data: "confirm_" + caseId + "_" + slot
            }
          }
        ]
      }
    }
  });

  return replyText(event.replyToken, "📤 ส่งเวลาให้ผู้ใช้แล้ว");
}

// ---- confirm ----
async function handleConfirm(event) {
  const parts = event.postback.data.split("_");
  const caseId = parts[1];
  const slot = parts.slice(2).join("_");

  const map = global.caseMap?.[caseId];
  if (!map) return replyText(event.replyToken, "❌ case not found");

  await pushToUser(map.userId, `✅ นัดแล้ว\n🕒 ${formatSlot(slot)}`);
  await pushToUser(map.peerId, `✅ นัดแล้ว\n🕒 ${formatSlot(slot)}`);

  return replyText(event.replyToken, "🎉 ยืนยันเรียบร้อย");
}

// ---- start flow ----
function startFlow(event) {
  const userId = event.source.userId;
  sessions[userId] = { step: 0, answers: {} };
  return sendStep(userId, event.replyToken);
}

// ---- flow ----
async function handleFlow(event) {
  const userId = event.source.userId;
  const s = sessions[userId];

  if (!s) return replyText(event.replyToken, "เริ่มใหม่อีกครั้งนะ");

  const step = flows.talk.steps[s.step];
  s.answers[step.key] = event.postback.data;
  s.step++;

  if (s.step < flows.talk.steps.length) {
    return sendStep(userId, event.replyToken);
  }

  const level = classify(s.answers);
  const caseId = Date.now().toString().slice(-6);

  await notifyTeam(level, caseId, s.answers, Date.now());
  await replyText(event.replyToken, "💛 เรารับเรื่องแล้วนะ");

  delete sessions[userId];
}

// ================= UI =================
async function sendStep(userId, replyToken) {
  const s = sessions[userId];
  const step = flows.talk.steps[s.step];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: step.text },
        ...step.options.map(o => ({
          type: "button",
          action: { type: "postback", label: o.label, data: o.value }
        }))
      ]
    }
  });
}

// ================= HELPERS =================
function classify(s) {
  let score = 0;
  if (s.q2 === "long") score += 2;
  if (s.q3 === "high") score += 3;
  if (s.q4 === "none") score += 2;
  if (score >= 5) return "red";
  if (score >= 3) return "yellow";
  return "green";
}

function formatSlot(slot) {
  return slot
    .replace("mon", "จันทร์")
    .replace("tue", "อังคาร")
    .replace("_", " ")
    .replace("1600", "16:00")
    .replace("1700", "17:00");
}

// ================= LINE API =================
async function replyText(token, text) {
  return fetch("https://api.line.me/v2/bot/message/reply", {
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

async function replyFlex(token, bubble) {
  return fetch("https://api.line.me/v2/bot/message/reply", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken: token,
      messages:[{ type:"flex", altText:"menu", contents: bubble }]
    })
  });
}

async function pushToUser(userId, message) {
  const msg = typeof message === "string"
    ? [{ type:"text", text: message }]
    : [message];

  return fetch("https://api.line.me/v2/bot/message/push", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      to: userId,
      messages: msg
    })
  });
}

async function sendTimeSlots(userId, caseId) {
  return pushToUser(userId, {
    type: "flex",
    altText: "เลือกเวลา",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "คุณว่างช่วงไหน?" },
          {
            type: "button",
            action: {
              type: "postback",
              label: "จันทร์ 16:00",
              data: "slot_" + caseId + "_mon_1600"
            }
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "อังคาร 17:00",
              data: "slot_" + caseId + "_tue_1700"
            }
          }
        ]
      }
    }
  });
}
