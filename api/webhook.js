// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyR0siRWKlScIozsxY1DCSFMdJ1BaGX49GJtdCQuGCfXT81ppnW8NliliRQ-pyCaHo0lQ/exec";
const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5";

if (!global.caseMap) global.caseMap = {};
// ================= MEMORY ================
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
  const type = event.source.type;

  // ✅ ถ้าเป็นแชทส่วนตัว → แสดงเมนูเสมอ
  if (type === "user") {
    return await sendMainMenu(event.replyToken);
  }

  // ✅ ถ้าเป็น group → ต้องพิมพ์ start
  if (type === "group") {
    const text = event.message?.text;
    if (text === "start") {
      return await sendMainMenu(event.replyToken);
    }
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
  // ===== MENU =====
if (data === "menu_resource") {
  return replyText(event.replyToken, "📚 เดี๋ยวเพิ่มนะ");
}

if (data === "menu_activity") {
  return replyText(event.replyToken, "🎯 เดี๋ยวเพิ่มนะ");
}

if (data === "menu_urgent") {
  return replyText(event.replyToken, "🚨 ถ้าด่วน โทร 1323 ได้เลยนะ");
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

  // 👉 ถ้าเป็น Q6
  if (s.step === 5) {
    return sendStep(userId, event.replyToken);
  }

  // 👉 ปกติ (Q1–Q4)
  return sendStep(userId, event.replyToken);
}

   // ===== CREATE CASE (เฉพาะตอนจบจริง) =====
if (s && s.step === 5) {
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

 // ===== ACCEPT =====
if (data.startsWith("accept_")) {
  const parts = data.split("_");
  const caseId = parts[1];
  const role = parts[2];

  return acceptCase(caseId, userId, role, event.replyToken);
}

  // ===== SLOT =====
  if (data.startsWith("slot_")) {
    const parts = data.split("_");
    const caseId = parts[1];
    const slot = parts.slice(2).join("_");

    const map = global.caseMap[caseId];
    if (!map) return;

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
        { type: "text", text: slot, weight: "bold" },
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

// =================1.flow STEP =================
async function sendStep(userId, replyToken) {

  const flow = [
    {
      text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ\nตอนนี้คุณอยากคุยเกี่ยวกับอะไร?",
      opts: [
        { label: "ความเครียด 😣", value: "stress" },
        { label: "เรื่องเรียน 📚", value: "academic" },
        { label: "ความสัมพันธ์ 💬", value: "relationship" },
        { label: "ความรู้สึกตัวเอง 🌱", value: "self" }
      ]
    },

    {
      text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว?",
      opts: [
        { label: "เพิ่งเกิด", value: "short" },
        { label: "สักพักแล้ว", value: "medium" },
        { label: "นานแล้ว", value: "long" }
      ]
    },

    {
      text: "เรื่องนี้ส่งผลกับชีวิตคุณแค่ไหน?",
      opts: [
        { label: "นิดหน่อย", value: "low" },
        { label: "พอสมควร", value: "medium" },
        { label: "มาก", value: "high" }
      ]
    },

    {
      text: "ตอนนี้คุณมีใครคุยเรื่องนี้อยู่ไหม?",
      opts: [
        { label: "ยังไม่มี", value: "none" },
        { label: "มีเพื่อน", value: "friend" },
        { label: "มีครู/ผู้ใหญ่", value: "adult" }
      ]
    },

    {
      text: "ตอนนี้คุณอยากได้ความช่วยเหลือแบบไหน?",
      opts: [
        { label: "คุยกับพี่นักเรียน", value: "peer" },
        { label: "คุยกับครู", value: "teacher" },
        { label: "แค่ระบาย", value: "listen" }
      ]
    },

    {
      text: "ถ้าคุณอยากเล่าเพิ่มเติม พิมพ์ได้เลยนะ (ไม่บังคับ)",
      input: true
    }
  ];

  const s = sessions[userId];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: flow[s.step].text,
          wrap: true
        },

        // 👉 ถ้าไม่ใช่ input ค่อยมีปุ่ม
        ...(flow[s.step].input
          ? []
          : flow[s.step].opts.map(o => ({
              type: "button",
              action: {
                type: "postback",
                label: o.label,
                data: o.value
              }
            })))
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
  let levelEmoji = "🟢";
   if (level === "yellow") levelEmoji = "🟡";
  if (level === "red") levelEmoji = "🔴";
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
  { type: "text", text: "📌 เคส #" + caseId, weight: "bold" },
  { type: "text", text: "ระดับ: " + levelEmoji },
  { type: "text", text: "👉 เหมาะกับ: " + answers.q5 },
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
    })   // 👈 ปิด JSON.stringify
  });    // 👈 ปิด fetch
}        // 👈 ปิด function notifyTeam

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
    await sendTimeSlots(data.targetUserId, caseId);
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
async function pushToUser(userId, message) {
  const msg = typeof message === "string"
    ? [{ type: "text", text: message }]
    : [message];

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      to: userId,
      messages: msg
    })
  });
}

// 👇 วางตรงนี้เลย (ต่อท้าย)
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
          { type: "text", text: "คุณสะดวกช่วงไหน?" },
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
