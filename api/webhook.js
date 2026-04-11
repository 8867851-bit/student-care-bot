// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyn4Lwrp2uqhCliS5MMSKiCDp5H4hRKhC3mnvBK8QEJP3WPw-nZpdP2G0cpoHudYIth-g/exec";
/* const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5"; */
global.caseMap = global.caseMap || {};

const sessions = {};
const handledEvents = new Set();
function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      step: 0,
      answers: {}
    };
  }
  return sessions[userId];
}
if (handledEvents.size > 1000) {
  handledEvents.clear();
}
const DEV_MODE = true; 
const DRY_RUN = false;     // 🔥 เปิดส่ง LINE จริง
const USE_AI = false;      // 🔥 ปิด AI ก่อน (กัน quota พัง)

//================== CONFIG =============================
// ================= 🎨 V3 CINEMATIC UI =================

// ===== THEME =====
const THEME = {
  text: "#111111",
  sub: "#6B6B6B",
  line: "#EAEAEA",
  primary: "#1A1A1A"
};

// ===== COMPONENT =====

function header(title, subtitle = "") {
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    contents: [
      {
        type: "text",
        text: title,
        weight: "bold",
        size: "lg",
        color: THEME.text
      },
      ...(subtitle ? [{
        type: "text",
        text: subtitle,
        size: "sm",
        color: THEME.sub,
        wrap: true
      }] : [])
    ]
  };
}

function divider() {
  return {
    type: "separator",
    margin: "md",
    color: THEME.line
  };
}

function text(t) {
  return {
    type: "text",
    text: t,
    wrap: true,
    size: "sm",
    color: THEME.text
  };
}

function hint(t) {
  return {
    type: "text",
    text: t,
    size: "xs",
    color: THEME.sub,
    wrap: true
  };
}

function btn(label, data, primary = false) {
  return {
    type: "button",
    style: primary ? "primary" : "secondary",
    color: primary ? THEME.primary : undefined,
    action: {
      type: "postback",
      label,
      data
    }
  };
}

function card(contents) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents
    }
  };
}
function isDeadZone() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();

  return (day === 6 || day === 0) && hour < 18;
}

// ================= 🎬 FLOW =================

// INTRO
function UI_intro() {
  return card([
    header("พื้นที่นี้ปลอดภัยนะ 🤍"),
    text("คุณสามารถเล่าได้ในแบบที่คุณสบายใจ"),
    divider(),
    text("เราจะช่วยหาพี่ที่เหมาะกับคุณ\nและนัดเวลาคุยแบบตัวต่อตัว"),
    hint("📌 ไม่ใช่การคุยในแชทนี้"),
    divider(),
    hint("ค่อย ๆ ไปทีละนิดก็พอ"),
    btn("เริ่มเล่า", "start_talk", true),
    btn("ยังไม่แน่ใจ", "intro_unsure")
  ]);
}

// UNSURE
function UI_unsure() {
  return card([
    header("ไม่เป็นไรเลยนะ 🤍"),
    text("คุณยังไม่ต้องรีบก็ได้"),
    divider(),
    {
      type: "button",
      action: {
        type: "uri",
        label: "🌱 สำรวจตัวเอง",
        uri: "https://your-web.com"
      }
    },
    btn("กลับเมนู", "menu")
  ]);
}

// Q1
function UI_q1() {
  return card([
    header("มีอะไรบางอย่างอยู่ในใจใช่ไหม"),
    hint("เลือกสิ่งที่ใกล้กับคุณที่สุด"),
    divider(),
    btn("ความเครียด", "step_0_q1_stress"),
    btn("เรื่องเรียน", "step_0_q1_academic"),
    btn("ความสัมพันธ์", "step_0_q1_relationship"),
    btn("ความรู้สึกตัวเอง", "step_0_q1_self")
  ]);
}

// Q5
function UI_q5() {
  return card([
    header("ตอนนี้คุณต้องการอะไรจากการคุย"),
    hint("ไม่มีคำตอบที่ถูกหรือผิด"),
    divider(),
    btn("💬 ฟัง", "step_4_q5_listen"),
    btn("🫂 เข้าใจ", "step_4_q5_understand"),
    btn("🌱 เบา ๆ", "step_4_q5_confused"),
    btn("🧠 คำแนะนำ", "step_4_q5_advice")
  ]);
}

// TRANSITION
function UI_transition() {
  return card([
    header("ขั้นตอนถัดไป 🤍"),
    text("เราจะหาพี่และนัดเวลาคุยแบบตัวต่อตัว"),
    hint("📌 ไม่ใช่การคุยในแชทนี้"),
    divider(),
    btn("ไปต่อ", "step_5_continue", true),
    btn("ขอคิดดูก่อน", "step_5_pause")
  ]);
}

// MATCHED
function UI_matched(caseId) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "Matched",
          size: "xs",
          color: "#888888"
        },

        {
          type: "text",
          text: "มีพี่ที่เหมาะกับคุณแล้ว ✨",
          weight: "bold",
          size: "lg",
          wrap: true
        },

        {
          type: "text",
          text: "ขั้นตอนต่อไปคือเลือกเวลาที่คุณสะดวก",
          size: "sm",
          color: "#666666",
          wrap: true
        },

        {
          type: "separator",
          margin: "md"
        },

        {
          type: "button",
          style: "primary",
          color: "#1A1A1A",
          action: {
            type: "postback",
            label: "เลือกเวลา",
            data: `get_slots_${caseId}`
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "ขอเวลาอื่น",
            data: `next_peer_${caseId}`
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "ยังไม่สะดวก",
            data: "pause_case"
          }
        }

      ]
    }
  };
}

// SLOT
function UI_slots(slots, caseId) {
  return card([
    header("เลือกเวลาที่สะดวก 📅"),
    hint("เลือกช่วงที่คุณพร้อมจริง ๆ"),
    divider(),
    ...slots.map(s => ({
      type: "button",
      action: {
        type: "postback",
        label: s,
        data: `confirm_${caseId}_${s}`
      }
    }))
  ]);
}

// ================= MAIN ==================
module.exports = async (req, res) => {

  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  // ================= 🔔 WAITLIST NOTIFY =================
  if (body.type === "notify_waitlist") {

    const { userId, slot, caseId } = body;

    await pushToUser(userId, {
      type: "flex",
      altText: "มีเวลาว่างแล้ว",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [

            {
              type: "text",
              text: "✨ มีเวลาว่างแล้ว",
              weight: "bold",
              size: "lg"
            },

            {
              type: "text",
              text: slot,
              size: "md"
            },

            {
              type: "button",
              style: "primary",
              action: {
                type: "postback",
                label: "เลือกเวลานี้",
                data: `confirm_${caseId}_${encodeURIComponent(slot)}`
              }
            }

          ]
        }
      }
    });

    return res.status(200).send("OK");
  }

  // ================= LINE EVENTS =================
  const events = body?.events || [];

  for (const event of events) {

    const eventId =
      event.timestamp + "_" + (event.source.userId || "");

    if (handledEvents.has(eventId)) continue;
    handledEvents.add(eventId);

    if (event.type === "follow") {
      return replyFlex(event.replyToken, UI_onboarding());
    }

    if (event.type === "message") {
      try {
        await handleMessage(event);
      } catch (err) {
        console.log("❌ handleMessage ERROR:", err);
      }
    }

    if (event.type === "postback") {
      await handlePostback(event);
    }
  }

  return res.status(200).send("OK");
};

async function getMyCase(userId) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getCaseByUser",
      userId
    })
  });

  return await res.json();
}
async function getCaseById(caseId) {
  const res1 = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getCaseById",
      caseId
    })
  });
const map = await res1.json();
  return map;
}
/////////////////////////////////////////////////////////////////////////

// ================= MESSAGE ==================
async function handleMessage(event) {
  const userId = event.source.userId;
  const text = event.message?.text || "";

    // 🔥 MUST: group handler ต้องอยู่บนสุด
  if (event.source.type === "group") {
      return handleGroupMessage(event);
  }

  let s = sessions[userId];

  // ===== RECONNECT SYSTEM =====
if (!sessions[userId]) {
  try {
    const map = await getMyCase(userId);

    if (map && map.status === "active" && map.caseId) {

      sessions[userId] = sessions[userId] || {};

      sessions[userId].inChat = true;
      sessions[userId].activeCase = map.caseId;

      console.log("♻️ RECONNECTED:", userId, map.caseId);
    }

  } catch (e) {
    console.log("❌ RECONNECT ERROR:", e);
  }
}

s = sessions[userId]; // 🔥 refresh session

  // =========================
  // 📌 MY CASES (ใช้ GAS เท่านั้น)
  // =========================
  if (text === "เคสของฉัน") {

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "getMyCases",
        userId
      })
    });

    const textRes = await res.text();

let data;
try {
  data = JSON.parse(textRes);
} catch (e) {
  console.log("❌ NOT JSON:", textRes);
  return replyText(event.replyToken, "⚠️ ระบบ error (ไม่ใช่ JSON)"); } // [ const data = await res.json(); ]
    const myCases = data.myCases || [];

    if (myCases.length === 0) {
      return replyText(event.replyToken, "📭 ยังไม่มีเคสนะ");
    }

    return replyFlex(event.replyToken, {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📌 เคสของคุณ", weight: "bold" },

          ...myCases.map(c => ({
            type: "button",
            action: {
              type: "postback",
              label: "เคส " + c.caseId,
              data: "openCase_" + c.caseId
            }
          }))
        ]
      }
    });
  }

  // =========================
  // ❌ END SESSION
  // =========================
  if (text === "จบการดูแล") {

    const caseId = s?.activeCase;

    if (!caseId) {
      return replyText(event.replyToken, "❌ ไม่พบเคส");
    }

    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "completeCase",
        caseId,
        userId
      })
    });

    // 🔥 ดึงจาก DB (ไม่ใช้ memory)
    const map = await getCaseById(caseId);

    if (map && map.userId && map.peerId) {
      const targetId =
        userId === map.userId ? map.peerId : map.userId;

      // 🔥 push ครั้งเดียว (สำคัญมาก ประหยัด quota)
      await pushToUser(targetId, {
        type: "flex",
        altText: "feedback",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💛 วันนี้การคุยโอเคไหม", weight: "bold" },

              {
                type: "button",
                action: {
                  type: "postback",
                  label: "🙂 ดีขึ้นนิดหน่อย",
                  data: "feedback_good_" + caseId
                }
              },
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "😐 เหมือนเดิม",
                  data: "feedback_same_" + caseId
                }
              },
              {
                type: "button",
                action: {
                  type: "postback",
                  label: "💬 อยากคุยต่อ",
                  data: "feedback_continue_" + caseId
                }
              }
            ]
          }
        }
      });
    }

    // 🔥 clear session เท่านั้น (ไม่ยุ่ง DB)
    delete sessions[userId];

    return replyText(event.replyToken, "💛 จบการดูแลเรียบร้อย");
  }
  // ===== SWITCH CASE =====
if (text.startsWith("เคส ")) {
  const caseId = text.replace("เคส ", "").trim();

  if (!sessions[userId]) sessions[userId] = {};

  const map = await getCaseById(caseId);

  if (map && (map.userId === userId || map.peerId === userId)) {

    sessions[userId].activeCase = caseId;
    sessions[userId].inChat = true;

    // 🔥 cache
    global.caseMap[caseId] = {
      userId: map.userId,
      peerId: map.peerId
    };

    return replyText(
      event.replyToken,
      "📌 ตอนนี้คุณกำลังคุยเคส " + caseId
    );
  }

  return replyText(event.replyToken, "❌ ไม่พบเคสนี้");
}
  // ===== START FLOW =====
if (text === "คุย") {

  if (!DEV_MODE && sessions[userId]?.locked) {
    return replyText(
      event.replyToken,
      "💛 ตอนนี้เรากำลังดูแลเคสของคุณอยู่นะ"
    );
  }

  sessions[userId] = { 
    step: 0, 
    answers: {},
    inChat: false,
    locked: false
  };

  s = sessions[userId];

  try {
    await sendStep(userId, event.replyToken);
  } catch (e) {
    console.log("❌ sendStep reply failed → fallback push");

    // 🔥 fallback กัน message หาย
    await pushToUser(userId, {
      type: "text",
      text: "💛 เริ่มคุยกันนะ (fallback)"
    });

    await sendStep(userId, null); // หรือแก้ sendStep ให้รองรับ push
  }

  return;
}
  
///////////////////////////////////////////////////////////////////////////
  
// ===== SESSION LOCK =====
if (sessions[userId]?.locked) {

  // 🔥 allow escape only
  if (text === "เมนู" || text === "reset") {
    delete sessions[userId];
    return sendMainMenu(event.replyToken);
  }

  // 🔥 กัน spam reply → reply แบบ static เท่านั้น
  return replyText(
    event.replyToken,
    `💛 เรารับเรื่องของคุณแล้วนะ
⏳ กำลังหาคนที่เหมาะกับคุณอยู่ (${getETA()})

พิมพ์ "เมนู" ได้ตลอดนะ`
  );
}


// ===== GLOBAL MENU =====
if (text === "เมนู") {
  delete sessions[userId];
  return sendMainMenu(event.replyToken);
}

// ===== STEP LOCK =====
if (s && typeof s.step === "number" && s.step < 6) {

  if (text === "reset") {
    delete sessions[userId];
    return replyText(event.replyToken, "เริ่มใหม่ได้เลยนะ 💛");
  }

  return replyText(
    event.replyToken,
    "💛 ตอนนี้เรากำลังคุยกันอยู่\nลองกดตัวเลือกด้านบน หรือพิมพ์ \"เมนู\" ได้เลยนะ"
  );
}


// ===== QUICK ACTION =====
if (text === "เข้าใจ") return sendExploreMenu(event.replyToken);

if (text === "พัก") {
  return replyText(event.replyToken,
`💛 ลองพักสักนิดนะ
หายใจลึก ๆ 3 ครั้ง  
ดื่มน้ำเย็นสักแก้ว  
แล้วค่อยกลับมานะ 💛`);
}



// =========================
// 🚀 FINAL STEP (Q6)
// =========================
if (s && s.step === 6) {

  s.answers["q6"] = text;

  const caseId = Date.now().toString().slice(-6);
  const level = classify(s.answers);
  let intent = detectIntent(s.answers);
  let route = decideRoute(s.answers);

  if (intent === "crisis" || intent === "practical_advice") route = "teacher";
  if (intent === "emotional_support") route = "peer";

  // ===== CONFIDENCE =====
  const confidence = getConfidence(intent, s.answers);

  const hasMeaningfulSignal =
    hasKeyword(text, emotionalKeywords) ||
    hasKeyword(text, practicalKeywords) ||
    text.trim().length > 5;

     // ===== OPTIONAL AI (SAFE MODE) =====
if (USE_AI && confidence <= 1) {
  try {
    const ai = await getAIAnalysis(text);

    if (ai?.followups?.length > 0) {
      s.aiFollowups = ai.followups;

      return replyFlex(event.replyToken, {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "💛 เลือกสิ่งที่ใกล้กับคุณที่สุด",
              wrap: true
            },
            ...ai.followups.map((f, i) => ({
              type: "button",
              action: {
                type: "postback",
                label: f,
                data: "q6_follow_" + i
              }
            }))
          ]
        }
      });
    }

  } catch (e) {
    console.log("AI ERROR:", e);
  }
}

  // ===== LOW CLARITY GUARD =====
  if (
    confidence <= 1 &&
    !hasMeaningfulSignal &&
    s.answers.q5 === "q5_confused"
  ) {
    delete sessions[userId];

    return replyFlex(event.replyToken, {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "💛 เราอยากเข้าใจคุณมากขึ้นอีกนิดนะ" },
          {
            type: "button",
            action: { type: "postback", label: "💬 แค่อยากระบาย", data: "clarify_emotional" }
          },
          {
            type: "button",
            action: { type: "postback", label: "🤝 อยากคุยกับคนจริง", data: "clarify_peer" }
          },
          {
            type: "button",
            action: { type: "postback", label: "🧠 อยากได้คำแนะนำ", data: "clarify_advice" }
          }
        ]
      }
    });
  }

  // ===== CREATE CASE =====
  let result;

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        caseId,
        userId,
        ...s.answers,
        level,
        route,
        intent
      })
    });

    result = await res.json();

  } catch (e) {
    console.log("❌ CREATE ERROR:", e);

    return replyText(
      event.replyToken,
      "⚠️ ระบบมีปัญหานิดหน่อย ลองใหม่อีกครั้งนะ"
    );
  }

  const peerId = result?.assignedTo || null;

  // ===== SESSION STATE =====
  sessions[userId] = sessions[userId] || {};

  if (peerId) {
    sessions[userId].inChat = true;
    sessions[userId].activeCase = caseId;
  } else {
    sessions[userId].locked = true;
  }
  if (!peerId) {
  sessions[userId].locked = true;

  await pushToUser(userId, {
  type: "flex",
  altText: "waiting",
  contents: UI_waiting()
});
}

  // ===== SINGLE REPLY ONLY (ประหยัด quota) =====
  return replyText(
  event.replyToken,
`💛 เรารับเรื่องของคุณแล้วนะ

${peerId 
  ? "✨ มีพี่แล้ว กำลังเตรียมเวลานัดให้คุณ"
  : "⏳ ตอนนี้กำลังหาพี่ให้อยู่นะ"}

คุณไม่ต้องทำอะไรเพิ่มเลย 💛`
);
}
  //======= WAITLIST ======
 if (s?.status === "waitlist") {
  return replyText(replyToken,
`💛 ตอนนี้สัปดาห์นี้เต็มแล้วนะ

เราได้จองคิวไว้ให้คุณแล้ว
คุณจะได้เลือกเวลาก่อนในสัปดาห์หน้า

⏰ เปิดเลือกเวลา: วันอาทิตย์ 18:00`
  );
}   
// ===== NOT IN SESSION =====
if (!s) {
  return replyText(event.replyToken,
`💛 ตอนนี้ยังไม่ได้อยู่ในโหมดคุยนะ

พิมพ์ "คุย" เพื่อเริ่มได้เลย  
หรือพิมพ์ "เมนู" 💛`);
}
    // ===== EMOTIONAL CHECK =====
    let highEmotional = false;

      if (s && s.answers) {
        highEmotional =
          s.answers.q3 === "q3_high" &&
          s.answers.q4 === "q4_none";
      }
//===============================
// ===== CHAT BRIDGE =====
//==============================
if (sessions[userId]?.inChat && !sessions[userId]?.locked) {

  const caseId = sessions[userId]?.activeCase;
  if (!caseId) {
    console.log("❌ NO CASE IN SESSION", sessions[userId]);
    return;
  }

  let map = global.caseMap[caseId];

  if (!map) {
    map = await getCaseById(caseId);

    if (map) {
      global.caseMap[caseId] = {
        userId: map.userId,
        peerId: map.peerId
      };
    }
  }

  if (!map) {
    console.log("❌ MAP NOT FOUND", caseId);
    return;
  }

  // 🔥 VALIDATION
  if (!map.userId || !map.peerId) {
    return replyText(event.replyToken,
      "💛 ตอนนี้เรายังหาพี่ให้คุณอยู่");
  }

  // 🔥 GUARD (กันคนนอก)
  if (userId !== map.userId && userId !== map.peerId) {
    console.log("❌ NOT IN CASE", userId, map);
    return;
  }

  const targetId =
    userId === map.userId ? map.peerId : map.userId;

  if (!targetId || targetId === userId) {
    console.log("❌ INVALID TARGET", targetId);
    return;
  }

  // ===== SPAM GUARD =====
  const now = Date.now();
  const last = sessions[userId]?.lastMsgTime || 0;

  if (now - last < 800) {
  console.log("🚫 SPAM BLOCKED");
  return;
}

  sessions[userId].lastMsgTime = now;

  // ===== TEXT FILTER =====
  if (!text || text.trim().length <= 1) return;

  if (text.length > 1000) {
    return replyText(event.replyToken,
      "💛 ข้อความยาวเกินไป ลองแบ่งส่งนะ");
  }

  if (!sessions[userId]) return;
// ===== BUFFER *PUSH* (ประหยัด quota) =====

const prefix =
  userId === map.userId ? "👤 ผู้ใช้:\n" : "🎓 พี่:\n";

// init buffer
if (!sessions[userId].buffer) {
  sessions[userId].buffer = [];
}

// เก็บข้อความ
sessions[userId].buffer.push(prefix + text);

// reset timer
clearTimeout(sessions[userId].timer);

// รอ 1.5 วิ แล้วรวมส่งทีเดียว
sessions[userId].timer = setTimeout(async () => {

  const combined = sessions[userId].buffer.join("\n\n");

  try {
    await pushToUser(targetId, {
      type: "text",
      text: combined
    });

    console.log("✅ BATCH SENT", {
      from: userId,
      to: targetId,
      count: sessions[userId].buffer.length
    });

  } catch (e) {
    console.log("❌ PUSH ERROR:", e);
  }

  sessions[userId].buffer = [];

}, 1500);

return;}
  
// ===== FINAL FALLBACK =====
return replyText(
  event.replyToken,
  "💛 เราอยู่ตรงนี้นะ\nพิมพ์ \"เมนู\" หรือ \"คุย\" ได้เลย"
);
  
} // ✅ ปิด handleMessage 

///////////////////////////////////////////////////////////////////////////////////
// ================= POSTBACK =================
async function handlePostback(event) {
  const userId = event.source.userId;
  console.log("DATA:", data);
  console.log("SESSION:", sessions[userId])
const data = event.postback.data;
  

if (data.startsWith("waitlist_")) {

  const slot = d.replace("waitlist_", "");

  addToWaitlist(caseId, userId, slot);

  return replyText(replyToken,
    "⏳ เราเพิ่มคุณในคิวแล้ว\nถ้ามีที่ว่าง เราจะจัดให้อัตโนมัติ 💛"
  );
} 
  if (data === "no_slot") {

  const caseId = sessions[userId]?.activeCase || "temp";

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        {
          type: "text",
          text: "💛 ตอนนี้ยังไม่มีเวลาที่ตรง",
          weight: "bold"
        },

        {
          type: "text",
          text: "คุณสามารถกลับมาดูใหม่วันอาทิตย์ 18:00",
          size: "sm",
          color: "#666666",
          wrap: true
        },

        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "🔔 แจ้งฉันเมื่อมีรอบใหม่",
            data: `waitlist_${caseId}_any`
          }
        }

      ]
    }
  });
}
if (data.startsWith("waitlist_")) {

  const parts = data.split("_");
  const caseId = parts[1];
  const slot = parts[2] || "any";

  await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "addToWaitlist",
      userId,
      caseId,
      slot
    })
  });

  return replyText(
    event.replyToken,
    "💛 เราจะรีบแจ้งคุณทันทีเมื่อมีเวลาว่างนะ"
  );
}
  
if (data === "intro_unsure") {
  return replyFlex(event.replyToken, UI_unsure());
}
// ===== GET SLOTS (REPLY MODE) =====
if (data.startsWith("get_slots_")) {

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getAvailableSlots"
    })
  });

  const dataRes = await res.json();
  const slots = dataRes.slots || [];

  if (slots.length === 0) {
    return replyFlex(event.replyToken, UI_noSlots());
  }

  return replyFlex(
    event.replyToken,
    UI_slotsWeekly(slots)
  );
}
  
// ===== RECONNECT (POSTBACK SAFE) =====
if (!sessions[userId]) {
  try {
    const map = await getMyCase(userId);

    if (map && map.status === "active" && map.caseId) {
      sessions[userId] = {
        inChat: true,
        activeCase: map.caseId
      };

      // 🔥 FIX สำคัญ: sync global map
      global.caseMap[map.caseId] = {
        userId: map.userId,
        peerId: map.peerId
      };

      console.log("♻️ RECONNECTED (postback):", userId, map.caseId);
    }
  } catch (e) {
    console.log("❌ RECONNECT POSTBACK ERROR:", e);
  }
}
////////////////////////////////////////////////////////////

 // ===== HELPER =====
function ensureSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = { step: 5, answers: {} };
  }
  if (!sessions[userId].answers) {
    sessions[userId].answers = {};
  }
}

// ===== FEEDBACK =====
if (data.startsWith("feedback_")) {
  const parts = data.split("_");
  const type = parts[1];
  const caseId = parts[2];

  // 🔒 กัน spam feedback
  if (sessions[userId]?.feedbackSent) {
    return replyText(event.replyToken, "💛 รับ feedback แล้วนะ");
  }
  sessions[userId] = sessions[userId] || {};
  sessions[userId].feedbackSent = true;

  try {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveFeedback",
        caseId,
        feedback: type
      })
    });
  } catch (e) {
    console.log("❌ feedback error:", e);
  }

  let msg = "💛 ขอบคุณนะที่บอกเรา";

  if (type === "continue") {
    msg = "💛 เราจะหาพี่ให้คุณคุยต่ออีกครั้งนะ";
  }

  return replyText(event.replyToken, msg);
}


// ===== CLARIFY =====
if (data === "clarify_emotional") {
  ensureSession(userId);
  sessions[userId].answers.q5 = "q5_listen";
  return sendStep(userId, event.replyToken);
}

if (data === "clarify_peer") {
  ensureSession(userId);
  sessions[userId].answers.q5 = "q5_understand";
  return sendStep(userId, event.replyToken);
}

if (data === "clarify_advice") {
  ensureSession(userId);
  sessions[userId].answers.q5 = "q5_advice";
  return sendStep(userId, event.replyToken);
}


// ===== Q6 FOLLOW-UP =====
if (data.startsWith("q6_follow_")) {
  const s = sessions[userId];

  if (!s || !s.answers) {
    return replyText(event.replyToken, "💛 ลองเริ่มใหม่อีกครั้งนะ");
  }

  const index = parseInt(data.replace("q6_follow_", ""), 10);

  if (s.aiFollowups && s.aiFollowups[index]) {
    s.answers.q6 = s.aiFollowups[index];
  } else {
    s.answers.q6 = "follow_" + index;
  }

  await replyText(event.replyToken,
    "💛 ขอบคุณที่บอกนะ เราเข้าใจคุณมากขึ้นแล้ว");

  const caseId = Date.now().toString().slice(-6);
  const level = classify(s.answers);
  const intent = detectIntent(s.answers);
  let route = decideRoute(s.answers);

  if (intent === "crisis" || intent === "practical_advice") route = "teacher";
  if (intent === "emotional_support") route = "peer";

  try {
    await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "create",
        caseId,
        userId,
        ...s.answers,
        level,
        route,
        intent // 🔥 FIX สำคัญ
      })
    });
  } catch (e) {
    console.log("❌ create error:", e);
  }

  // 🔒 optional notify
  if (typeof notifyTeam === "function") {
    try {
      await notifyTeam(caseId, level, s.answers, route);
    } catch (e) {
      console.log("❌ notify error:", e);
    }
  }

  sessions[userId] = { locked: true };
  return;
}


// ===== OPEN CASE =====
if (data.startsWith("openCase_")) {
  const caseId = data.replace("openCase_", "");

  const map = await getCaseById(caseId);

  if (!map) {
    return replyText(event.replyToken, "❌ ไม่พบเคสนี้");
  }

  if (!sessions[userId]) sessions[userId] = {};

  sessions[userId].activeCase = caseId;
  sessions[userId].inChat = true;

  // 🔥 sync memory
  global.caseMap[caseId] = {
    userId: map.userId,
    peerId: map.peerId
  };

  return replyText(
    event.replyToken,
    "💛 คุณกำลังคุยเคส " + caseId
  );
}


// ===== STEP FLOW (FINAL CLEAN) =====
if (data.startsWith("step_")) {

  const parts = data.split("_");
  const value = parts.slice(2).join("_");
  const step = parseInt(parts[1], 10);
  const keys = ["q1","q2","q3","q4","q5"];

  if (!sessions[userId] || sessions[userId].step !== step) {
    return replyText(event.replyToken,
      "💛 ขอเริ่มใหม่อีกครั้งนะ\nลองกด 'คุยเรื่องที่หนักใจ' ใหม่ได้เลย");
  }

  // ===== SPECIAL =====
  if (value === "continue") {
    sessions[userId].step = 6;
    return sendStep(userId, event.replyToken);
  }

  if (value === "pause") {
    delete sessions[userId];
    return sendLockedMenu(event.replyToken);
  }

  // ===== SAVE =====
  if (step < keys.length) {
    sessions[userId].answers[keys[step]] = value;
  }

  sessions[userId].step = step + 1;

  return sendStep(userId, event.replyToken);
}


// ===== START FLOW =====
if (data === "start_talk") {

  sessions[userId] = {
    step: 0,
    answers: {}
  };

  return sendStep(userId, event.replyToken);
}


// ===== MENU =====
if (data === "menu_explore") {
  return sendExploreMenu(event.replyToken);
}

if (data === "menu_resource") {
  return replyText(event.replyToken, "📚 กำลังเพิ่มเนื้อหาอยู่นะ");
}

if (data === "menu_activity") {
  return replyText(event.replyToken, "🎯 กำลังเพิ่มกิจกรรมอยู่นะ");
}

if (data === "menu_urgent") {
  return replyText(event.replyToken,
"🚨 ถ้ารู้สึกไม่ไหวจริง ๆ โทร 1323 ได้เลยนะ 💛");
}


// ===== ROLE CHOICE =====
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
/////////////////////////////////////////////////////////////////////////////////////////////////
   
// ===== BECOME PEER =====
if (data === "become_peer") {
  return replyText(event.replyToken,
`💛 ขอให้โชคดีกับการผจญภัย Peer Support รุ่นที่ 1!

📌 นี่คือรหัส (User Id) ของคุณ:
${userId}

👉 กรุณาก๊อปไปใส่ใน Google Form`);
}


// ===== ACCEPT =====
if (data.startsWith("accept_")) {
  const parts = data.split("_");
  const caseId = parts[1];
  const role = parts[2];

  const result = await acceptCase(caseId, userId, role, event.replyToken); 

  if (result?.status === "OK") {

    const targetUserId = result.targetUserId;

   /* // 🔥 สำคัญมาก: เปิด chat bridge
    sessions[targetUserId] = {
      inChat: true,
      activeCase: caseId
    };

    sessions[userId] = {
      inChat: true,
      activeCase: caseId
    }; */ //ลบ--Please delete

    return replyText(event.replyToken, "✅ รับเคสแล้ว");
  }

  return replyText(event.replyToken, "❌ มีคนรับเคสนี้ไปแล้ว");
}


// ===== NEXT PEER (ใช้ GAS เท่านั้น) =====
if (data.startsWith("next_peer_")) {
  const caseId = data.replace("next_peer_", "");

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "reassignPeer",
        caseId
      })
    });

    const dataRes = await res.json();

    if (!dataRes.peerId) {
      return replyText(event.replyToken, "😢 ยังไม่มีพี่คนอื่นตอนนี้");
    }

    const slots = dataRes.slots || [];

    return pushToUser(dataRes.userId, {
      type: "flex",
      altText: "เลือกเวลาใหม่",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "🔄 ลองพี่คนนี้ดูนะ" },

            ...(slots.length > 0
              ? slots.slice(0,5).map(slot => ({
                  type: "button",
                  action: {
                    type: "postback",
                    label: slot,
                    data: "slot_" + caseId + "_" + slot
                  }
                }))
              : [
                  { type: "text", text: "⚠️ ยังไม่มีเวลาว่าง" }
                ])
          ]
        }
      }
    });

  } catch (e) {
    console.log("❌ next_peer error:", e);
    return replyText(event.replyToken, "⚠️ ระบบมีปัญหา");
  }
}


// ===== SLOT (NO PUSH SPAM) =====
if (data.startsWith("slot_")) {
  const parts = data.split("_");
  const caseId = parts[1];
  const slot = decodeURIComponent(parts.slice(2).join("_"));

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
  type: "text",
  text: `เราจะนัดคุยกันตามเวลานี้นะ

คุณโอเคไหม 🤍`,
  wrap: true
},
        { type: "text", text: slot, weight: "bold" },
        {
          type: "button",
          action: {
            type: "postback",
            label: "✅ ยืนยัน",
            data: "confirm_" + caseId + "_" + slot
          }
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "🔄 เลือกใหม่",
            data: "next_peer_" + caseId
          }
        }
      ]
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
  
// ===== CONFIRM (NEW SLOT-BASED MATCHING) =====
if (data.startsWith("confirm_")) {

  const parts = data.split("_");
  const caseId = parts[1];
  const slot = decodeURIComponent(parts.slice(2).join("_"));

  sessions[userId] = sessions[userId] || {};

  // 🔒 กันกดรัว
  if (sessions[userId].bookingLocked) {
    return replyText(event.replyToken, "⏳ กำลังจองอยู่...");
  }

  sessions[userId].bookingLocked = true;

  let dataRes;

  try {

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "matchAndBook",
        userId,
        caseId,
        slot
      })
    });

    dataRes = await res.json();

  } catch (err) {

    console.log("❌ BOOKING ERROR:", err);
    sessions[userId].bookingLocked = false;

    return replyText(event.replyToken,
      "⚠️ ระบบขัดข้อง ลองใหม่อีกครั้งนะ");
  }

  sessions[userId].bookingLocked = false;

  // ===== RESULT =====

  if (!dataRes || !dataRes.status) {
    return replyText(event.replyToken, "⚠️ ระบบผิดพลาด");
  }

  if (dataRes.status === "FULL") {
    return replyText(event.replyToken,
      "💛 เวลานี้เต็มแล้ว ลองเลือกใหม่ได้นะ");
  }

  if (dataRes.status === "NO_PEER") {
    return replyText(event.replyToken,
      "💛 ยังไม่มีพี่ในช่วงเวลานี้นะ");
  }

  if (dataRes.status !== "OK") {
    return replyText(event.replyToken,
      "⚠️ ระบบมีปัญหา ลองใหม่อีกครั้ง");
  }

  // ===== SUCCESS =====

  sessions[userId].inChat = true;
  sessions[userId].activeCase = dataRes.caseId;

  return replyFlex(
    event.replyToken,
    UI_scheduledPremium(dataRes.slot || slot)
  );
}
  ////////////////////////
  
  if (data.startsWith("start_chat_")) {
  const caseId = data.replace("start_chat_", "");

  sessions[userId] = {
    inChat: true,
    activeCase: caseId
  };

  return replyText(event.replyToken, "💬 เริ่มคุยได้เลย");
}
} //ปิด Handle postback
////////////////////////////////////////////////////////////////////
async function sendStep(userId, token) {

  const s = sessions[userId];

  if (!s) return;

  if (s.step === 0) return replyFlex(token, UI_q1());

  if (s.step === 4) return replyFlex(token, UI_q5());

  if (s.step === 5) return replyFlex(token, UI_transition());

  // step อื่นใช้ text ปกติไปก่อน
  return replyText(token, "💛 พิมพ์ตอบได้เลยนะ");
}

// ================= CLASSIFY =================
function classify(s) {
  let score = 0;

  if (s.q2 === "q2_long") score += 2;
  if (s.q3 === "q3_high") score += 3;
  if (s.q4 === "q4_none") score += 2;

  if (score >= 5) return "red";
  if (score >= 3) return "yellow";
  return "green";
}
  
  //////////////////////////////////////////////////////////////////////////////////

// ================= ROUTE DECISION (FINAL PRODUCTION) =================
function decideRoute(answers) {

  let peer = 0;
  let teacher = 0;

  const text = (answers.q6 || "").toLowerCase();

  // ================= HARD RULES =================

  // relationship → peer เสมอ
  if (answers.q1 === "q1_relationship") return "peer";

  // academic → teacher เสมอ
  if (answers.q1 === "q1_academic") return "teacher";


  // ================= SELF LOGIC =================
  if (answers.q1 === "q1_self") {

    // planning → teacher
    if (
      hasKeyword(text, [
        "อนาคต","เป้าหมาย","แผน","เรียนต่อ","คณะ","อาชีพ"
      ])
    ) {
      return "teacher";
    }

    return "peer"; }


// ================= STRESS ESCALATION =================
  if (
    answers.q1 === "q1_stress" &&
    answers.q3 === "q3_high" &&
    answers.q4 === "q4_none"
  ) {
    return "teacher";
  }


  // ================= SCORING SYSTEM =================

  // ----- Q1 -----
  if (answers.q1 === "q1_stress") peer += 2;

  // ----- Q5 -----
  if (answers.q5 === "q5_advice") teacher += 2;
  if (answers.q5 === "q5_listen") peer += 3;
  if (answers.q5 === "q5_understand") peer += 2;
  if (answers.q5 === "q5_confused") peer += 1;

  // ----- Emotional Weight -----
  if (answers.q3 === "q3_high") peer += 1;
  if (answers.q4 === "q4_none") peer += 2;


  // ================= TEXT SIGNAL =================

  // planning → teacher
  if (hasKeyword(text, practicalKeywords)) {
    teacher += 3;
  }

  // emotional → peer
  if (hasKeyword(text, emotionalKeywords)) {
    peer += 2;
  }


  // ================= FINAL =================
  return teacher > peer ? "teacher" : "peer";
}



// ================= KEYWORD SYSTEM =================

// 👉 normalize text (กัน bug ภาษา)
function normalizeText(t) {
  return (t || "").toLowerCase().trim();
}

const practicalKeywords = [
  "สอบ","เรียน","การบ้าน","ตาราง","คะแนน",
  "สอบไม่ติด","อ่านหนังสือ","เกรด","gpa",
  "tcas","กสพท","พอร์ต","คณะ","มหาลัย","ติว"
];

const emotionalKeywords = [
  "เครียด","เหนื่อย","ท้อ","กดดัน","หมดแรง","กังวล","ไม่ไหว", 
  "เศร้า","เสียใจ","ร้องไห้","ดาวน์","หดหู่","สิ้นหวัง",
  "ว่างเปล่า","ไม่มีความรู้สึก","ชา","ชินชา",
  "กลัว","แพนิค","ใจสั่น","คิดมาก","วน","overthink",
  "ไร้ค่า","ไม่ดีพอ","ล้มเหลว",
  "เหงา","โดดเดี่ยว","ไม่มีใคร","ไม่มีคนเข้าใจ",
  "หมดไฟ","เบื่อ","ไม่อยากทำอะไร",
  "งง","สับสน","ไม่รู้","ไม่แน่ใจ"
];

const riskKeywords = [
  "ไม่ไหว","อยากหายไป","หมดหวัง",
  "ไม่มีเหตุผลจะอยู่","อยู่ไปก็ไม่มีค่า",
  "อยากหนีไป","ไม่อยากอยู่แล้ว"
];

// ===== HELPER =====
function hasKeyword(text, keywords) {
  const t = normalizeText(text);
  return keywords.some(k => t.includes(k));
}



// ================= INTENT DETECTION (FINAL) =================
function detectIntent(answers) {

  const text = normalizeText(answers.q6);

  const isPractical = hasKeyword(text, practicalKeywords);
  const isRisk = hasKeyword(text, riskKeywords);

  // 🚨 crisis (เงื่อนไขเข้ม)
  if (isRisk && answers.q4 === "q4_none") {
    return "crisis";
  }

  // ===== USER NEED PRIORITY =====
  if (
    answers.q5 === "q5_listen" ||
    answers.q5 === "q5_understand" ||
    answers.q5 === "q5_confused"
  ) {
    return "emotional_support";
  }

  if (answers.q5 === "q5_advice" && isPractical) {
    return "practical_advice";
  }

  return "emotional_support";
}

  //////////////////////////////////////////////////////////////////////////
  
// ================= HUMAN MESSAGE (FINAL) =================
function buildHumanMessage(intent, answers, route) {

  let msg = "💛 เราได้อ่านสิ่งที่คุณเล่าแล้วนะ\n";

  // ===== intent =====
  if (intent === "crisis") {
    msg += "\nเรื่องนี้มันหนักมากจริง ๆ\nคุณไม่จำเป็นต้องอยู่กับมันคนเดียวเลยนะ";
  }
  else if (intent === "practical_advice") {
    msg += "\nดูเหมือนคุณกำลังพยายามหาทางออกอยู่จริง ๆ";
  }
  else {
    msg += "\nมันโอเคเลยนะที่จะรู้สึกแบบนี้";
  }

  // ===== route =====
  if (route === "teacher") {
    msg += `

💡 เราจะช่วยจับคู่คุณกับครู
ที่ช่วยคิดทางออกให้คุณได้ 👩‍🏫`;
  } else {
    msg += `

💬 เราจะหาพี่ที่พร้อมฟังและเข้าใจคุณนะ 💛`;
  }

  // ===== soft autonomy =====
  msg += "\n\nคุณสามารถเลือกแบบที่คุณสบายใจได้เลยนะ";

  return msg;
}



// ================= AI (SAFE OPTIONAL) =================
async function getAIAnalysis(text) {

  // 🔥 ปิด AI = ไม่เรียกเลย (กัน quota + latency)
  if (!USE_AI) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content: `
คุณคือผู้ช่วย emotional support สำหรับนักเรียนมัธยม

ตอบ JSON เท่านั้น:

{
  "reflection": "...",
  "suggestion": "peer หรือ teacher",
  "followups": ["...","...","..."]
}

กฎ:
- reflection สั้น กระชับ อบอุ่น
- followups ไม่เกิน 10 คำ
`
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const data = await res.json();

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch {
      console.log("AI JSON ERROR:", content);
      return null;
    }

  } catch (e) {
    console.log("AI ERROR:", e);
    return null;
  }
}



// ================= ETA =================
function getETA() {
  const h = new Date().getHours();

  if (h < 8) return "ช่วงเช้านี้";
  if (h < 18) return "ภายใน 1–3 ชั่วโมง";
  return "เร็วที่สุดที่เราทำได้ 💛";
}



// ================= CONFIDENCE (FINAL) =================
function getConfidence(intent, answers) {

  let score = 0;
  const text = (answers.q6 || "").trim();

  // ===== intent weight =====
  if (intent === "crisis") score += 4;
  else if (intent === "practical_advice") score += 2;

  // ===== need clarity =====
  if (answers.q5 === "q5_advice") score += 2;
  if (answers.q5 === "q5_confused") score -= 2;

  // ===== support =====
  if (answers.q4 === "q4_none") score += 1;

  // ===== intensity =====
  if (answers.q3 === "q3_high") score += 1;

  // ===== text quality =====
  if (text.length > 10) score += 1;
  if (text.length > 30) score += 1;

  // ===== keyword signal =====
  if (hasKeyword(text, practicalKeywords)) score += 1;
  if (hasKeyword(text, emotionalKeywords)) score += 1;

  // ===== clamp =====
  if (score < 0) score = 0;
  if (score > 10) score = 10;
  
    if (answers.q5 === "q5_advice" && intent === "emotional_support") {
    score -= 2;
  }

  return score;
}

  ////////////////////////////////////////////////////////////////////////////
  
async function autoAssign(caseId, level, route,intent) {

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getAvailablePeers",
      role: route,
      intent: intent  
    })
  });

  const data = await res.json();
  const peers = data.peers || [];

  if (peers.length === 0) return null;

peers.sort((a, b) => a.load - b.load);
  return peers[0].userId; // 🔥 เลือกคนแรก (load ต่ำสุด)
}

////////////////////////////////////////////////////////////////////////////////////
function UI_slotsWeekly(slots, caseId) {

  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "เลือกเวลาที่สะดวก",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: "คุณไม่จำเป็นต้องใช้เวลาครบชั่วโมงก็ได้นะ",
          size: "xs",
          color: "#888888",
          wrap: true
        },

        {
          type: "separator"
        },

        ...slots.map(s => {

          const label = `${s.time} (${s.available}/${s.capacity})`;

          return {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label,
              data: `confirm_${caseId}_${encodeURIComponent(s.time)}`
            }
          };
        }),

        {
          type: "separator"
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "ไม่มีเวลาที่ต้องการ",
            data: "no_slot"
          }
        }

      ]
    }
  };
}
// ================= ACCEPT (PRODUCTION FINAL) =================
async function acceptCase(caseId, userId, role, replyToken) {
  
  try {

    // ===== CALL GAS =====
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "accept",
        caseId,
        userId,
        role
      })
    });

    const data = await res.json();

    // ===== STATUS =====
    if (data.status === "TAKEN" || data.status === "ASSIGNED") {
      return replyText(replyToken, "❌ เคสนี้มีคนรับไปแล้ว");
    }

    if (data.status === "FULL") {
      return replyText(replyToken, "❌ เคสนี้มีคนดูแลแล้ว");
    }

    if (data.status !== "OK") {
      return replyText(replyToken, "⚠️ เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ");
    }

    const targetUserId = data.targetUserId;

    if (!targetUserId) {
      return replyText(replyToken, "⚠️ ไม่พบผู้ใช้ของเคสนี้");
    }

    // =========================
    // 🔥 START CHAT SESSION
    // =========================

    sessions[targetUserId] = {
      inChat: true,
      activeCase: caseId
    };

    sessions[userId] = {
      inChat: true,
      activeCase: caseId
    };

    // =========================
    // 🔥 GLOBAL MAP
    // =========================

    global.caseMap = global.caseMap || {};

    global.caseMap[caseId] = {
      userId: targetUserId,
      peerId: userId
    };

    // =========================
    // 🔥 REPLY PEER (ไม่ใช้ push)
    // =========================

    await replyText(replyToken, "✅ รับเคสแล้ว เริ่มคุยได้เลย 💛");

    // =========================
    // 🔥 GET SLOT
    // =========================

    let slots = [];

    try {
      slots = await getSlots(userId);
    } catch (e) {
      console.log("❌ getSlots error:", e);
    }
    // ===== NEW PREMIUM MATCHED UI =====

    await pushToUser(targetUserId, {
      type: "flex",
      altText: "matched",
      contents: UI_matched(caseId)
    });

    // =========================
    // 🔥 PUSH USER (ครั้งเดียว)
    // =========================

    return;

  } catch (err) {
    console.log("❌ acceptCase ERROR:", err);

    return replyText(
      replyToken,
      "⚠️ ระบบมีปัญหา ลองใหม่อีกครั้งนะ [โปรดติดต่อ 0621572635 (ลี่) ทางเราจะรีบเเก้ไขระบบโดยด่วน]"
    );
  }
}
  
//////////////////////////////////////////////////////////////////////////////////////
  
// ================= FOLLOW-UP (SERVERLESS SAFE) =================
async function scheduleFollowUp(caseId, userId, level) {

  // ❌ ไม่ใช้ setTimeout ใน Vercel
  // 👉 เปลี่ยนเป็นให้ GAS / CRON เป็นคนยิง

  try {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "scheduleFollowUp",
        caseId,
        userId,
        level
      })
    });
  } catch (e) {
    console.log("❌ scheduleFollowUp error:", e);
  }
}


// ================= PUSH (SAFE + RETRY) =================
async function pushToUser(userId, message) {

  if (!userId) return;

  if (DRY_RUN) {
    console.log("🧪 DRY RUN pushToUser →", userId, message);
    return;
  }

  const msg = typeof message === "string"
    ? [{ type: "text", text: message }]
    : [message];

  const payload = {
    to: userId,
    messages: msg
  };

  // ===== TRY SEND =====
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ LINE PUSH ERROR:", text);

      // 👉 retry 1 ครั้ง
      await retryPush(payload);
    }

  } catch (err) {
    console.log("❌ PUSH FAIL:", err);

    // 👉 retry fallback
    await retryPush(payload);
  }
}


// ===== RETRY =====
async function retryPush(payload) {
  try {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.log("❌ RETRY FAIL:", e);
  }
}



// ================= GET SLOTS (SOURCE OF TRUTH = GAS) =================
async function getSlots(userId) {
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        action: "getSlots",
        userId
      })
    });

    const data = await res.json();
    return data.slots || [];

  } catch (e) {
    console.log("❌ getSlots error:", e);
    return [];
  }
}
  
/////////////////////////////////////////////////////////////////////
  
// ================= SAFE REPLY CORE =================
async function safeReply(payload) {

  if (!payload.replyToken) {
    console.log("❌ missing replyToken");
    return;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("❌ REPLY ERROR:", text);
    }

  } catch (err) {
    console.log("❌ REPLY FAIL:", err);
  }
}



// ================= TEXT =================
async function replyText(replyToken, text) {
  return safeReply({
    replyToken,
    messages: [{ type: "text", text }]
  });
}



// ================= FLEX =================
async function replyFlex(replyToken, bubble, altText = "menu") {
  return safeReply({
    replyToken,
    messages: [{
      type: "flex",
      altText,
      contents: bubble
    }]
  });
}



// ================= AI PERSONALIZED =================
function buildPersonalizedQ6(replyToken, ai) {

  const reflection =
    ai?.reflection ||
    "💛 เราอยู่ตรงนี้นะ";

  const followups = ai?.followups || [];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        {
          type: "text",
          text: reflection,
          wrap: true
        },

        ...(followups.length > 0
          ? followups.slice(0, 3).map((f, i) => ({
              type: "button",
              action: {
                type: "postback",
                label: f,
                data: "q6_follow_" + i
              }
            }))
          : [{
              type: "text",
              text: "คุณสามารถพิมพ์เล่าต่อได้เลยนะ 💬",
              size: "sm",
              wrap: true
            }]
        )
      ]
    }
  }, "Q6 followup");
}



// ================= MAIN MENU =================
async function sendMainMenu(replyToken) {

  return replyFlex(replyToken, {
    type: "bubble",
    styles: {
      body: {
        backgroundColor: "#F7F6F3"
      }
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "Student Care",
          weight: "bold",
          size: "sm",
          color: "#888888"
        },

        {
          type: "text",
          text: "เราจะอยู่ข้างคุณนะ",
          weight: "bold",
          size: "lg",
          wrap: true,
          color: "#2F2F2F"
        },

        {
          type: "text",
          text: "คุณอยากเริ่มแบบไหน",
          size: "sm",
          color: "#666666"
        },

        { type: "separator" },

        {
          type: "button",
          style: "primary",
          color: "#1A1A1A",
          action: {
            type: "postback",
            label: "คุยกับคนจริง",
            data: "start_talk"
          }
        },

        {
          type: "button",
          action: {
            type: "uri",
            label: "สำรวจตัวเอง",
            uri: "https://your-web.com"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "ขอความช่วยเหลือด่วน",
            data: "menu_urgent"
          }
        }

      ]
    }
  }, "main menu");
}

broadcast 
/////////////////////////////////////////////////////////////////////////////////////
  
async function sendExploreMenu(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        {
          type: "text",
          text: "🌱 สำรวจตัวเอง",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: "เริ่มต้นแบบไม่ต้องเล่าอะไรก็ได้",
          size: "sm",
          wrap: true
        },

        {
          type: "button",
          action: {
            type: "uri",
            label: "🧠 อ่าน / เลื่อนดู",
            uri: "https://hub2-theta.vercel.app"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "🪞 สะท้อนความคิดตัวเอง",
            data: "start_reflection"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "😶‍🌫️ ยังไม่รู้จะเริ่มยังไง",
            data: "confused_start"
          }
        },

        {
          type: "button",
          action: {
            type: "message",
            label: "⬅️ กลับเมนู",
            text: "เมนู"
          }
        }
      ]
    }
  }, "explore menu");
}

// ================= GROUP HANDLER (SAFE) =================
async function handleGroupMessage(event) {
  try {
    const text = event.message?.text?.trim();

    // ❌ ignore non-text
    if (event.message?.type !== "text") return;

    // 🔥 command only (กัน spam)
    if (!text.startsWith("/")) return;

    console.log("👥 GROUP CMD:", text);

    // ===== COMMANDS =====
    if (text === "/test") {
      return replyText(event.replyToken, "group working ✅");
    }

    if (text === "/status") {
      return replyText(event.replyToken, "system alive 🟢");
    }

    if (text === "/help") {
      return replyText(event.replyToken,
`📌 commands:
/test
/status
/help`
      );
    }

    // ❌ unknown command
    return replyText(event.replyToken, "❓ ไม่รู้จักคำสั่ง");

  } catch (err) {
    console.log("❌ GROUP ERROR:", err);
  }
}
//---------------------------------------------------------
if (data === "reschedule") {

  const caseId = sessions[userId]?.activeCase;

  if (!caseId) {
    return replyText(event.replyToken, "❌ ไม่พบเคส");
  }

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        {
          type: "text",
          text: "ต้องการเปลี่ยนเวลาใช่ไหม",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: "คุณสามารถเลือกเวลาใหม่ได้เลย",
          size: "sm",
          color: "#666666"
        },

        {
          type: "separator"
        },

        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "เลือกเวลาใหม่",
            data: `get_slots_${caseId}`
          }
        }

      ]
    }
  });
}
function UI_slotsPremium(slots, caseId) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "เลือกเวลาที่สะดวก",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: "เลือกช่วงที่คุณพร้อมจริง ๆ",
          size: "sm",
          color: "#666666"
        },

        {
          type: "separator"
        },

        ...slots.slice(0, 5).map(slot => ({
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: slot,
              size: "sm",
              flex: 3
            },
            {
              type: "button",
              style: "primary",
              color: "#1A1A1A",
              height: "sm",
              action: {
                type: "postback",
                label: "เลือก",
                data: `data: confirm_${caseId}_${encodeURIComponent(slot)}` // ✅ FIX
              }
            }
          ]
        })),

        {
          type: "separator",
          margin: "md"
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "ดูเวลาอื่น",
            data: `next_peer_${caseId}` // ✅ FIX
          }
        },
        {
  type: "button",
  action: {
    type: "postback",
    label: "🔔 แจ้งเตือน",
    data: `waitlist_${encodeURIComponent(slot)}`
  }
}

      ]
    }
  };
}
function UI_onboarding() {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "พื้นที่นี้เป็นของคุณ 🤍",
          weight: "bold",
          size: "xl"
        },

        {
          type: "text",
          text: "คุณสามารถเริ่มจากจุดไหนก็ได้\nไม่ต้องรู้ว่าตัวเองเป็นอะไร",
          size: "sm",
          wrap: true,
          color: "#666666"
        },

        {
          type: "separator"
        },

        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "คุยกับคนจริง",
            data: "start_talk"
          }
        },

        {
          type: "button",
          action: {
            type: "uri",
            label: "🌱 สำรวจตัวเอง",
            uri: "https://your-web.com"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "🚨 ขอความช่วยเหลือด่วน",
            data: "menu_urgent"
          }
        }

      ]
    }
  };
}
// ------------ FUNCTION ---------------------
  

function sendLockedMenu(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        { type: "text", text: "💛 เคสของคุณส่งไปแล้ว", weight: "bold" },

        {
          type: "text",
          text: "ตอนนี้เรากำลังหาคนที่เหมาะกับคุณอยู่\nระหว่างนี้คุณสามารถทำอย่างอื่นได้นะ 💛",
          size: "sm",
          wrap: true
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "🌱 สำรวจตัวเอง",
            data: "menu_explore"
          }
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "📚 ดูตัวเลือกทั้งหมด",
            uri: "https://hub2-theta.vercel.app"
          }
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "🚨 ขอความช่วยเหลือด่วน",
            data: "_urgent"
          }
        },
        {
          type: "button",
          action: {
            type: "message",
            label: "💤 พักสักนิด",
            text: "พัก"
          }
        }

      ]
    }
  });
}
//------------------------------------------
function UI_waiting() {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "เรากำลังหาคนที่เหมาะกับคุณอยู่ 🤍",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: "คุณไม่ต้องรีบตอบอะไรตอนนี้ก็ได้นะ\nค่อย ๆ อยู่กับตัวเองไปก่อนก็ได้",
          size: "sm",
          wrap: true,
          color: "#666666"
        },

        {
          type: "separator"
        },

        {
          type: "text",
          text: "ระหว่างนี้คุณสามารถ:",
          size: "xs",
          color: "#999999"
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "🌱 สำรวจตัวเอง",
            data: "menu_explore"
          }
        },

        {
          type: "button",
          action: {
            type: "message",
            label: "💤 พักสักนิด",
            text: "พัก"
          }
        }

      ]
    }
  };
}
 function UI_scheduled(slot) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [

        {
          type: "text",
          text: "นัดเรียบร้อยแล้ว 🤍",
          weight: "bold",
          size: "lg"
        },

        {
          type: "text",
          text: slot,
          weight: "bold",
          size: "md"
        },

        {
          type: "text",
          text: "เจอกันตามเวลานะ",
          size: "sm",
          color: "#666666"
        },

        {
          type: "separator"
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "🔄 เปลี่ยนเวลา",
            data: "reschedule"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "❌ ยกเลิก",
            data: "cancel_booking"
          }
        }

      ]
    }
  };
} 












  


//------------------ code from the dead -----------------------------------
 
// ========= Notify team ========
/* async function notifyTeam(caseId, level, answers, route) {
  console.log("🔥 notifyTeam CALLED", caseId, level, route);

  let text = "👉 ถ้าคุณว่าง ลองรับเคสนี้ได้นะ";
  let levelEmoji = "🟢";

  if (level === "yellow") levelEmoji = "🟡";
  if (level === "red") {
    levelEmoji = "🔴";
    text = "👉 ขอคนช่วยดูเคสนี้หน่อยนะ";
  }

  // ===== DRY RUN =====
  if (DRY_RUN) {
    console.log("🧪 DRY RUN → NOT SENDING TO GROUP");
    console.log({
      caseId,
      level,
      route,
      q1: answers.q1,
      q6: answers.q6
    });
    return; // 🔥 สำคัญ: หยุดตรงนี้
  }

if (!canPush()) {
  console.log("📌 CASE (NOT SENT):", {
    caseId,
    level,
    route,
    summary: answers.q6
  });
  return;
}

pushCount++;
  
  // ===== REAL PUSH =====
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
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
              { type: "text", text: "🧠 ประเภท: " + answers.q1 },
              {
                type: "text",
                text: "🎯 แนะนำ: " + (route === "teacher" ? "👩‍🏫 ครู" : "👩‍🎓 พี่นักเรียน")
              },
              { type: "text", text: "📝 " + (answers.q6 || "-"), wrap: true },
              { type: "text", text: text }
            ]
          }
        }
      }]
    })
  });

  console.log("📣 LINE PUSH RESULT:", await res.text());
} */

/* let pushCount = 0;
let lastReset = Date.now();
const MAX_PUSH_PER_DAY = 30; // 🔥 คุมลิมิต (กันทะลุ 500);

function canPush() {
  const now = Date.now();

  // reset ทุก 24 ชม.
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    pushCount = 0;
    lastReset = now;
  } return pushCount < MAX_PUSH_PER_DAY; } */

/* // ===== FALLBACK notify =====
  if (!peerId) {
    await notifyTeam(caseId, level, s.answers, route);
  }
   // ===== SEND SLOT =====
   if (peerId) {
    const slots = await getSlots(peerId);

    if (slots.length > 0) {
      await pushToUser(userId, {
        type: "flex",
        altText: "เลือกเวลา",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💛 เลือกเวลาที่คุณสะดวก" },
              ...slots.slice(0, 5).map(slot => ({
                type: "button",
                action: {
                  type: "postback",
                  label: slot,
                  data: "slot_" + caseId + "_" + slot
                }
              })), {
  type: "button",
  action: {
    type: "postback",
    label: "🔄 ดูคนอื่น",
    data: "next_peer_" + caseId
  }
}
            ]
          }
        }
      });
    }
  } */
/*// ================= FLOW STEP (PRODUCTION READY) =================
async function sendStep(userId, replyToken) {
const progress = `STEP ${s.step + 1} / 7`;

const contents = [

  {
    type: "text",
    text: progress,
    size: "xs",
    color: "#999999"
  },

  {
    type: "text",
    text: current.text,
    wrap: true,
    size: "md"
  }
];
  
  const flow = [
    {
      text: "จากสิ่งที่คุณกำลังรู้สึกอยู่ตอนนี้
อะไรใกล้เคียงที่สุด?",
      opts: [
        { label: "ความเครียด 😣", value: "q1_stress" },
        { label: "เรื่องเรียน 📚", value: "q1_academic" },
        { label: "ความสัมพันธ์ 💬", value: "q1_relationship" },
        { label: "ความรู้สึกตัวเอง 🌱", value: "q1_self" }
      ]
    },

    {
      text: "สิ่งนี้อยู่กับคุณมานานแค่ไหนแล้ว",
      opts: [
        { label: "เพิ่งเกิด", value: "q2_short" },
        { label: "สักพักแล้ว", value: "q2_medium" },
        { label: "นานแล้ว", value: "q2_long" }
      ]
    },

    {
      text: "มันส่งผลกับชีวิตคุณมากแค่ไหน",
      opts: [
        { label: "นิดหน่อย", value: "q3_low" },
        { label: "พอสมควร", value: "q3_medium" },
        { label: "มาก", value: "q3_high" }
      ]
    },

    {
      text: "ตอนนี้คุณมีใครที่คุณคุยเรื่องนี้ด้วยอยู่ไหม",
      opts: [
        { label: "ยังไม่มี", value: "q4_none" },
        { label: "มีเพื่อน", value: "q4_friend" },
        { label: "มีครู/ผู้ใหญ่", value: "q4_adult" }
      ]
    },

    {
      text: "ตอนนี้สิ่งที่คุณต้องการมากที่สุดคืออะไร",
      opts: [
        { label: "💬 อยากมีคนฟังจริง ๆ", value: "q5_listen" },
        { label: "🫂 อยากคุยกับคนที่เข้าใจ", value: "q5_understand" },
        { label: "🧠 อยากได้คำแนะนำหรือทางออก", value: "q5_advice" },
        { label: "🌱 ยังไม่แน่ใจ ขอเริ่มเบา ๆ ก่อน", value: "q5_confused" }
      ]
    },

    {
      text: `💛 ขอบคุณที่เล่าให้ฟังนะ

หลังจากนี้เราจะช่วยจับคู่คุณกับคนจริง
แล้วนัดเวลาคุยกันแบบตัวต่อตัว 💛`,
      opts: [
        { label: "💬 ไปต่อ", value: "continue" },
        { label: "🌱 ขอคิดดูก่อน", value: "pause" }
      ]
    },

    {
      text: "ถ้าคุณอยากเล่าเพิ่ม เราพร้อมฟังนะ [พิมพ์ 1 เพื่อข้าม] ",
      input: true
    }
  ];

  const s = sessions[userId];

  // ===== SAFETY =====
  if (!s) {
  return replyText(replyToken, "ลองเริ่มใหม่อีกครั้งนะ 💛");
}

if (typeof s.step !== "number") {
  s.step = 0; // 🔥 force เริ่มใหม่
}
  

  // กัน step หลุด
  if (s.step < 0) s.step = 0;
  if (s.step >= flow.length) s.step = flow.length - 1;

  const current = flow[s.step];

  // ===== BUILD FLEX =====
  const contents = [
    {
      type: "text",
      text: current.text,
      wrap: true
    }
  ];

  // 👉 ถ้าเป็น input → ไม่ต้องมีปุ่ม
  if (!current.input && current.opts) {
    current.opts.forEach(o => {
      contents.push({
        type: "button",
        action: {
          type: "postback",
          label: o.label,
          data: "step_" + s.step + "_" + o.value
        }
      });
    });
  }

  // ===== SEND =====
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents
    }
  });
} */
/* // ================= PREMIUM THEME =================
const THEME = {
  primary: "#1A1A1A",
  surface: "#FFFFFF",
  bg: "#F6F6F7",
  accent: "#E7C6C9", // soft neutral pink
  text: "#111111",
  subtext: "#6B6B6B",
  line: "#EAEAEA"
};


// ================= BASE COMPONENT =================

// 🧠 header (Apple style)
function header(title, subtitle = "") {
  return {
    type: "box",
    layout: "vertical",
    spacing: "xs",
    contents: [
      {
        type: "text",
        text: title,
        weight: "bold",
        size: "lg",
        color: THEME.text
      },
      ...(subtitle ? [{
        type: "text",
        text: subtitle,
        size: "sm",
        color: THEME.subtext,
        wrap: true
      }] : [])
    ]
  };
}

// 🧠 divider
function divider() {
  return {
    type: "separator",
    margin: "md",
    color: THEME.line
  };
}

// 🧠 paragraph
function paragraph(text) {
  return {
    type: "text",
    text,
    wrap: true,
    size: "sm",
    color: THEME.text
  };
}

// 🧠 subtle animation illusion (fade feeling)
function subtleNote(text) {
  return {
    type: "text",
    text,
    size: "xs",
    color: THEME.subtext,
    wrap: true
  };
}

// 🧠 button (premium spacing)
function btn(label, data, style = "secondary") {
  return {
    type: "button",
    style,
    height: "sm",
    margin: "sm",
    action: {
      type: "postback",
      label,
      data
    }
  };
}

// 🧠 primary CTA
function primaryBtn(label, data) {
  return {
    type: "button",
    style: "primary",
    color: THEME.primary,
    action: {
      type: "postback",
      label,
      data
    }
  };
}

// 🧠 base bubble
function buildCard(contents) {
  return {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents
    }
  };
}


// ================= INTRO =================

function flexIntro() {
  return buildCard([
    header("พื้นที่นี้ปลอดภัยนะ 🤍"),

    paragraph("คุณสามารถเล่าได้ในแบบที่คุณสบายใจ"),

    divider(),

    paragraph("เราจะช่วยหาพี่ที่เหมาะกับคุณ\nและนัดเวลาคุยแบบตัวต่อตัว"),

    subtleNote("📌 ไม่ใช่การคุยในแชทนี้"),

    divider(),

    subtleNote("ค่อย ๆ ไปทีละนิดก็พอ"),

    primaryBtn("เริ่มเล่า", "start_talk"),
    btn("ยังไม่แน่ใจ", "intro_unsure")
  ]);
}


// ================= UNSURE =================

function flexUnsure() {
  return buildCard([
    header("ไม่เป็นไรเลยนะ 🤍"),

    paragraph("ถ้ายังไม่พร้อมเล่า\nคุณลองเริ่มแบบเบา ๆ ก่อนได้"),

    divider(),

    {
      type: "button",
      action: {
        type: "uri",
        label: "🌱 สำรวจตัวเอง",
        uri: "https://your-web.com"
      }
    },

    btn("กลับเมนู", "menu")
  ]);
}


// ================= Q1 =================

function flexQ1() {
  return buildCard([
    header("มีอะไรบางอย่างอยู่ในใจใช่ไหม"),

    subtleNote("เลือกสิ่งที่ใกล้กับคุณที่สุด"),

    divider(),

    btn("ความเครียด", "step_0_q1_stress"),
    btn("เรื่องเรียน", "step_0_q1_academic"),
    btn("ความสัมพันธ์", "step_0_q1_relationship"),
    btn("ความรู้สึกตัวเอง", "step_0_q1_self")
  ]);
}


// ================= Q5 =================

function flexQ5() {
  return buildCard([
    header("ตอนนี้คุณต้องการอะไรจากการคุย"),

    subtleNote("ไม่มีคำตอบที่ถูกหรือผิด"),

    divider(),

    btn("💬 แค่อยากมีคนฟัง", "step_4_q5_listen"),
    btn("🫂 อยากให้มีคนเข้าใจ", "step_4_q5_understand"),
    btn("🌱 อยากเริ่มเบา ๆ", "step_4_q5_confused"),
    btn("🧠 อยากได้คำแนะนำ", "step_4_q5_advice")
  ]);
}


// ================= TRANSITION =================

function flexTransition() {
  return buildCard([
    header("ขั้นตอนถัดไป 🤍"),

    paragraph("เราจะหาพี่ที่เหมาะกับคุณ\nและนัดเวลาคุยกันแบบตัวต่อตัว"),

    subtleNote("📌 ไม่ใช่การคุยในแชทนี้"),

    divider(),

    primaryBtn("ไปต่อ", "step_5_continue"),
    btn("ขอคิดดูก่อน", "step_5_pause")
  ]);
}


// ================= MATCHED =================

function flexMatched() {
  return buildCard([
    header("มีพี่ที่เหมาะกับคุณแล้ว ✨"),

    paragraph("ขั้นตอนต่อไปคือเลือกเวลานัดคุย"),

    divider(),

    primaryBtn("เลือกเวลา", "get_slots"),
    btn("ขอเวลาอื่น", "next_peer"),
    btn("ยังไม่สะดวก", "pause_case")
  ]);
}


// ================= SLOT =================

function flexSlots(slots, caseId) {
  return buildCard([
    header("เลือกเวลาที่สะดวก 📅"),

    subtleNote("เลือกช่วงที่คุณพร้อมจริง ๆ"),

    divider(),

    ...slots.map(s => ({
      type: "button",
      action: {
        type: "postback",
        label: s,
        data: `confirm_${caseId}_${s}`
      }
    }))
  ]);
} */
