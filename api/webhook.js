// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyR0siRWKlScIozsxY1DCSFMdJ1BaGX49GJtdCQuGCfXT81ppnW8NliliRQ-pyCaHo0lQ/exec";
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

  // ===== เลือก role =====
  if (data.startsWith("chooseRole_")) {
    const caseId = data.replace("chooseRole_", "");

    return replyFlex(event.replyToken, {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "คุณเป็นใคร?", weight: "bold" },
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
  
  // ===== เลือกสถานที่ =====

  
// ===== SLOT (peer → user) =====
if (data.startsWith("slot_")) {
  const parts = data.split("_");
  const caseId = parts[1];
  const slot = parts.slice(2).join("_");

  const map = global.caseMap?.[caseId];

  // กันพัง
  if (!map) {
    return replyText(event.replyToken, "❌ case not found");
  }
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

  return; // 🔥 สำคัญมาก
}
  // ===== CONFIRM =====
if (data.startsWith("confirm_")) {
  const parts = data.split("_");
  const caseId = parts[1];
  const slot = parts.slice(2).join("_");

  const map = global.caseMap?.[caseId]

  if (!map) {
    return replyText(event.replyToken, "❌ case not found");
  }

  // 👉 แจ้ง user
  await pushToUser(map.userId,
`✅ นัดเรียบร้อย

🕒 ${slot}
💛 เจอกันนะ`);

  // 👉 แจ้ง peer
  await pushToUser(map.peerId,
`✅ นัดเรียบร้อย

🕒 ${slot}
เตรียมตัวคุยได้เลย 💛`);

  return; // 🔥 สำคัญ
}

  // ===== รับเคส =====
  if (data.startsWith("accept_")) {
    const parts = data.split("_");
    const caseId = parts[1];
    const role = parts[2];

    return acceptCase(caseId, userId, role, event.replyToken);
  }

  // ===== เริ่ม flow =====
  if (data.startsWith("start_")) {
    sessions[userId] = { flow: "talk", step: 0, answers: {} };
    return sendStep(userId, event.replyToken);
  }

  // ===== flow ต่อ =====
  const s = sessions[userId];

if (!s) {
  return replyText(event.replyToken, "⚠️ session หมดอายุแล้ว กรุณาเริ่มใหม่");
}

const flow = flows[s.flow];
const step = flow.steps[s.step];

  s.answers[step.key] = data;
  s.step++;

  if (s.step < flow.steps.length) {
    return sendStep(userId, event.replyToken);
  }

  // ===== จบ flow =====
  const level = classify(s.answers);
  const caseId = Date.now().toString().slice(-6);

  await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", caseId, userId, ...s.answers, level })
  });

  await notifyTeam(level, caseId, s.answers, Date.now());
await scheduleFollowUp(caseId, userId, level);
  
const eta = getExpectedTime();

const message = `💛 เราได้รับเรื่องของคุณแล้วนะ

ตอนนี้ทีมกำลังหาพี่ที่เหมาะสมให้คุณอยู่นะ  
⏳ โดยปกติจะใช้เวลา ${eta}

ถ้าคุณรู้สึกหนักมาก  
คุณสามารถโทร 1323 ได้ตลอด 24 ชม.

คุณไม่ต้องอยู่กับเรื่องนี้คนเดียว 💛`;
  await replyText(event.replyToken, message);

  delete sessions[userId];
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
async function acceptCase(caseId, userId, role, replyToken) {
  const name = await getUserName(userId);

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ action:"accept", caseId, userId, name, role })
  });

  const data = await res.json();

  if (data.status === "OK") {
    if (!global.caseMap) global.caseMap = {};
global.caseMap[caseId] = {
  userId: data.targetUserId,
  peerId: userId
};
    await sendTimeSlots(userId, caseId);
    await replyText(replyToken, "✅ รับเคสแล้ว");

    // 👉 แจ้ง group (เหมือนเดิม)
    let text = `📌 เคส ${caseId}\n`;
    data.owners.forEach((o, i) => {
      text += `👤 ${o} (${data.roles[i]})\n`;
    });
    await pushToGroup(text);

    // 🔥🔥🔥 เพิ่มตรงนี้: แจ้ง USER
    const targetUserId = data.targetUserId; // 👈 ต้องให้ GAS ส่งกลับมา

    if (targetUserId) {
      await pushToUser(targetUserId,
`💛 มีพี่มารับเคสของคุณแล้วนะ

พี่กำลังเตรียมติดต่อคุณอยู่
คุณอยากคุยช่วงเวลาไหนบ้าง? 🌿`
                       
      ); } return; }
  if (data.status === "FULL") {
    return replyText(replyToken, "❌ เคสนี้เต็มแล้ว"); }
  return replyText(replyToken, "⚠️ error");}

//====== Push to user ======
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
// ===== Anti-ghost follow up =====
async function scheduleFollowUp(caseId, userId, level) {
  console.log("⏰ scheduleFollowUp START:", caseId);

  let delay = 15 * 60 * 1000; // default green

  if (level === "red") delay = 5 * 60 * 1000;
  if (level === "yellow") delay = 10 * 60 * 1000;

  setTimeout(async () => {
    console.log("⏰ checking case:", caseId);

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", caseId })
    });

    const data = await res.json();
    console.log("⏰ GAS RESPONSE:", data);

      if (data.status === "PENDING") {
         let text = "👉 ถ้าคุณว่าง ลองรับเคสนี้ได้นะ";
  if (level === "red") {
      text = "👉 ขอคนช่วยดูเคสนี้หน่อยนะ"; }
        
  await pushToUser(userId,
`💛 เรายังอยู่ตรงนี้นะ  
ตอนนี้ทีมกำลังหาพี่ที่เหมาะสมให้คุณอยู่ 🙏`);
  await pushFlexToGroup({
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `⏳ เคส #${caseId}`, weight: "bold" },
        { type: "text", text: "ยังไม่มีคนดูแล", color: "#ff5555" },
        { type: "text", text: text }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [{
        type: "button",
        style: "primary",
        action: {
          type: "postback",
          label: "รับเคส",
          data: "chooseRole_" + caseId
        }
      }]
    }
  });
}
      
//===== flextogroup ====
async function pushFlexToGroup(bubble) {
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
        altText: "เคสรอรับ",
        contents: bubble
      }]
    })
  });
}
// ================= NOTIFY =================
async function notifyTeam(level, caseId, answers, createdAt) {
  if (!GROUP_ID) return;

  const p = getPriorityLabel(level, createdAt);
  const flex = {
    type: "flex",
    altText: "📌 มีเคสใหม่",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
   contents: [
      { type: "text", text: `📌 เคส #${caseId}`, weight: "bold", size: "lg" },
      { type: "text", text: p.label, weight: "bold", size: "md" },
        ...(p.wait >= 2 ? [
      { type: "text", text: "⏳ รอมาแล้ว " + p.wait + " นาที" }
        ] : []),
      { type: "separator", margin: "md" },
              // 🔥 เพิ่มตรงนี้
      { type: "text", text: "👉 เหมาะกับ: " + answers.q5 },
      { type: "text", text: "Topic: " + answers.q1, wrap: true }
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
            data: "chooseRole_" + caseId
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
//===== Working time=====
function getExpectedTime() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 8) {
    return "ในช่วงเช้าวันนี้";
  }

  if (hour >= 8 && hour < 18) {
    return "ภายใน 1–3 ชั่วโมง";
  }

  return "ในช่วงเช้าวันถัดไป";
}
//=======Smart Piority ======
function getPriorityLabel(level, createdAt) {
  const now = Date.now();
  const diffMin = Math.floor((now - createdAt) / 1000 / 60);

  let priority = "";

  if (level === "red") {
    if (diffMin >= 10) priority = "🚨🔥 CRITICAL";
    else if (diffMin >= 5) priority = "🚨 URGENT";
    else priority = "🔴 HIGH";
  }

  else if (level === "yellow") {
    if (diffMin >= 20) priority = "🚨 URGENT";
    else if (diffMin >= 10) priority = "🔴 HIGH";
    else priority = "🟡 MEDIUM";
  }

  else {
    if (diffMin >= 30) priority = "🔴 HIGH";
    else if (diffMin >= 15) priority = "🟡 MEDIUM";
    else priority = "🟢 LOW";
  }

  return {
    label: priority,
    wait: diffMin
  };
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
          { type: "text", text: "คุณว่างช่วงไหนบ้าง?" },
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
