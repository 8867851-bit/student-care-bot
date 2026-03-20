// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyR0siRWKlScIozsxY1DCSFMdJ1BaGX49GJtdCQuGCfXT81ppnW8NliliRQ-pyCaHo0lQ/exec";
const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5";

// ================= MEMORY =================
const sessions = {};
if (!global.caseMap) global.caseMap = {};

// ================= MAIN =================
module.exports = async (req, res) => {
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
  if (event.source.type === "user") {
    return sendMainMenu(event.replyToken);
  }
}

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;

  // ===== START =====
  if (data === "start_talk") {
    sessions[userId] = { step: 0, answers: {} };
    return sendStep(userId, event.replyToken);
  }
// ===== CHOOSE ROLE =====
if (data.startsWith("chooseRole_")) {
  const caseId = data.replace("chooseRole_", "");

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "คุณจะรับเคสนี้ในบทบาทไหน?",
          weight: "bold"
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "👩‍🎓 นักเรียน",
            data: "accept_" + caseId + "_student"
          }
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "👨‍🏫 ครู",
            data: "accept_" + caseId + "_teacher"
          }
        }
      ]
    }
  });
}
  // ===== FLOW =====
  const s = sessions[userId];

  if (s && s.step < 5) {
    const keys = ["q1","q2","q3","q4","q5"];
    s.answers[keys[s.step]] = data;
    s.step++;

    if (s.step < 5) {
      return sendStep(userId, event.replyToken);
    }

    // ===== CREATE CASE =====
    const caseId = Date.now().toString().slice(-6);
    const level = classify(s.answers);

    await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "create",
        caseId,
        userId,
        ...s.answers,
        level
      })
    });

    await notifyTeam(caseId, level, s.answers);

    const eta = getETA();

    await replyText(event.replyToken,
`💛 เราได้รับเรื่องของคุณแล้วนะ

ตอนนี้ทีมกำลังหาพี่ที่เหมาะสมให้คุณอยู่  
⏳ โดยปกติจะใช้เวลา ${eta}

ถ้าคุณรู้สึกหนักมาก  
คุณสามารถโทร 1323 ได้ตลอด 24 ชม.

คุณไม่ต้องอยู่กับเรื่องนี้คนเดียว 💛`);

    scheduleFollowUp(caseId, userId, level);

    delete sessions[userId];
    return;
  }

  // ===== ACCEPT =====
  if (data.startsWith("accept_")) {
    const caseId = data.replace("accept_", "");
    return acceptCase(caseId, userId, event.replyToken);
  }

  // ===== SLOT =====
  if (data.startsWith("slot_")) {
    const parts = data.split("_");
    const caseId = parts[1];
    const slot = parts.slice(2).join("_");

    const map = global.caseMap[caseId];
    if (!map) return;

    await pushToUser(map.userId,
`💛 พี่ว่างช่วงนี้นะ

👉 ${slot}

คุณสะดวกไหม?`);

    return;
  }

  // ===== CONFIRM =====
  if (data.startsWith("confirm_")) {
    const parts = data.split("_");
    const caseId = parts[1];
    const slot = parts.slice(2).join("_");

    const map = global.caseMap[caseId];
    if (!map) return;

    await pushToUser(map.userId,
`✅ นัดเรียบร้อย

🕒 ${slot}
💛 เจอกันนะ`);

    await pushToUser(map.peerId,
`✅ นัดเรียบร้อย

🕒 ${slot}
เตรียมตัวคุยได้เลย 💛`);

    return;
  }
}

// ================= STEP =================
async function sendStep(userId, replyToken) {
  const flow = [
    { text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ\nตอนนี้คุณอยากคุยเกี่ยวกับอะไร?",
      opts: ["stress","academic","relationship","self"] },

    { text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว?",
      opts: ["short","medium","long"] },

    { text: "เรื่องนี้ส่งผลกับชีวิตคุณแค่ไหน?",
      opts: ["low","medium","high"] },

    { text: "ตอนนี้คุณมีใครคุยเรื่องนี้อยู่ไหม?",
      opts: ["none","friend","adult"] },

    { text: "ตอนนี้คุณอยากได้ความช่วยเหลือแบบไหน?",
      opts: ["peer","teacher","listen"] }
  ];

  const s = sessions[userId];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: flow[s.step].text, wrap: true },
        ...flow[s.step].opts.map(o => ({
          type: "button",
          action: { type: "postback", label: o, data: o }
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

// ================= ETA =================
function getETA() {
  const h = new Date().getHours();
  if (h < 8) return "ในช่วงเช้าวันนี้";
  if (h < 18) return "ภายใน 1–3 ชั่วโมง";
  return "ในช่วงเช้าวันถัดไป";
}

// ================= NOTIFY =================
async function notifyTeam(caseId, level, answers) {
  let text = "👉 ถ้าคุณว่าง ลองรับเคสนี้ได้นะ";
  if (level === "red") text = "👉 ขอคนช่วยดูเคสนี้หน่อยนะ";

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      to: GROUP_ID,
 messages: [{
  type: "flex",
  altText: "มีเคสใหม่",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `📌 เคส #${caseId}`, weight: "bold" },
        { type: "text", text: ระดับ: ${level} },
        { type: "text", text: 👉 เหมาะกับ: ${answers.q5} },
        { type: "text", text: text }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [{
        type: "button",
        action: {
          type: "postback",
          label: "รับเคส",
          data: "chooseRole_" + caseId   // 👈 จุดสำคัญ
        }
      }]
    }
  }
}]

// ================= ACCEPT =================
async function acceptCase(caseId, userId, replyToken) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "accept",
      caseId,
      userId,
      name: "peer",
      role: "student"
    })
  });

  const data = await res.json();

  if (data.status === "OK") {
    global.caseMap[caseId] = {
      userId: data.targetUserId,
      peerId: userId
    };

    await replyText(replyToken, "✅ รับเคสแล้ว");

    await pushToUser(data.targetUserId,
`💛 มีพี่มารับเคสของคุณแล้วนะ

คุณอยากคุยช่วงเวลาไหนบ้าง? 🌿`);
  }

  if (data.status === "FULL") {
    return replyText(replyToken, "❌ เคสนี้มีคนดูแลแล้ว");
  }
}

// ================= FOLLOW-UP =================
async function scheduleFollowUp(caseId, userId, level) {
  let delay = 15 * 60 * 1000;
  if (level === "red") delay = 5 * 60 * 1000;
  if (level === "yellow") delay = 10 * 60 * 1000;

  setTimeout(async () => {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", caseId })
    });

    const data = await res.json();

    if (data.status === "PENDING") {
      await pushToUser(userId,
`💛 เรายังอยู่ตรงนี้นะ  
ทีมกำลังตามหาพี่ให้คุณอยู่ 🙏`);
    }
  }, delay);
}

// ================= UTIL =================
async function pushToUser(userId, text) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }]
    })
  });
}

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
