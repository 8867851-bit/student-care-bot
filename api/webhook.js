// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyn4Lwrp2uqhCliS5MMSKiCDp5H4hRKhC3mnvBK8QEJP3WPw-nZpdP2G0cpoHudYIth-g/exec";
/* const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5"; */
global.caseMap = global.caseMap || {};

const handledEvents = new Set();
const sessions = {};
if (handledEvents.size > 1000) {
  handledEvents.clear();
}
const DEV_MODE = true; 
const DRY_RUN = false;     // 🔥 เปิดส่ง LINE จริง
const USE_AI = false;      // 🔥 ปิด AI ก่อน (กัน quota พัง)


// ================= MAIN ==================
module.exports = async (req, res) => {
  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  const events = body?.events || [];

  for (const event of events) {
  const eventId = event.timestamp + "_" + (event.source.userId || "");
    
  if (handledEvents.has(eventId)) { continue; }  
  handledEvents.add(eventId);
    if (event.type === "follow") {
  await sendMainMenu(event.replyToken); }

if (event.type === "message") {
  try {
    await handleMessage(event);
  } catch (err) {
    console.log("❌ handleMessage ERROR:", err);
  }
}
if (event.type === "postback") await handlePostback(event); }

  return res.status(200).send("OK"); };

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
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getCaseById",
      caseId
    })
  });

  return await res.json();
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

    const data = await res.json();
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
//===============================
// ===== CHAT BRIDGE =====
//==============================
if (
  sessions[userId]?.inChat &&
  !sessions[userId]?.locked &&
  sessions[userId]?.step === undefined
) {

  const caseId = sessions[userId]?.activeCase;
  if (!caseId) return;

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

  if (!map) return;

  // 🔥 VALIDATION
  if (!map.userId || !map.peerId) {
    return replyText(event.replyToken,
      "💛 ตอนนี้เรายังหาพี่ให้คุณอยู่");
  }

  // 🔥 GUARD
  if (userId !== map.userId && userId !== map.peerId) {
    return replyText(event.replyToken, "❌ คุณไม่อยู่ในเคสนี้");
  }

  const targetId =
    userId === map.userId ? map.peerId : map.userId;

  if (!targetId || targetId === userId) return;

  // ===== SPAM GUARD =====
  const now = Date.now();
  const last = sessions[userId]?.lastMsgTime || 0;

  if (now - last < 800) return;

  sessions[userId].lastMsgTime = now;

  // ===== TEXT FILTER =====
  if (!text || text.trim().length <= 1) return;

  if (text.length > 1000) {
    return replyText(event.replyToken,
      "💛 ข้อความยาวเกินไป ลองแบ่งส่งนะ");
  }

  // ===== PUSH =====
  await pushToUser(targetId, {
    type: "text",
    text:
      (userId === map.userId ? "👤 ผู้ใช้:\n" : "🎓 พี่:\n") +
      text
  });

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

  // ===== SINGLE REPLY ONLY (ประหยัด quota) =====
  return replyText(
    event.replyToken,
`💛 เรารับเรื่องของคุณแล้วนะ

${peerId 
  ? "✨ มีพี่รับเคสแล้ว เริ่มคุยได้เลย"
  : "⏳ ตอนนี้กำลังหาพี่ให้อยู่นะ"}

คุณไม่ต้องทำอะไรเพิ่มเลย 💛`
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
  
// ===== FINAL FALLBACK =====
return replyText(
  event.replyToken,
  "💛 เราอยู่ตรงนี้นะ\nพิมพ์ \"เมนู\" หรือ \"คุย\" ได้เลย"
);

} // ✅ ปิด handleMessage 

///////////////////////////////////////////////////////////////////////////////////
// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  console.log("DATA:", data);
  console.log("SESSION:", sessions[userId])

// ===== GET SLOTS (REPLY MODE) =====
if (data.startsWith("get_slots_")) {
  const caseId = data.replace("get_slots_", "");

  // 🔥 ดึง case จาก GAS
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "getCaseById",
      caseId
    })
  });

  const map = await res.json();
  if (!map || !map.peerId) {
    return replyText(event.replyToken,
      "💛 ตอนนี้ยังไม่มีเวลาที่เลือกได้ ลองใหม่อีกทีนะ");
  }

  // 🔥 ดึง slot ของ peer
  const slots = await getSlots(map.peerId);

  if (!slots || slots.length === 0) {
    return replyText(event.replyToken,
      "💛 พี่ยังไม่ได้ตั้งเวลาว่าง แต่สามารถเริ่มคุยได้เลยนะ 💬");
  }

  // 🔥 reply (ไม่ push)
  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "📅 เลือกเวลาที่สะดวก",
          weight: "bold"
        },

        ...slots.slice(0, 6).map(slot => ({
          type: "button",
          action: {
            type: "postback",
            label: slot,
            data: "confirm_" + caseId + "_" + slot
          }
        }))
      ]
    }
  });
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


// ===== STEP FLOW =====
if (data.startsWith("step_")) {
  const parts = data.split("_");
  const value = parts.slice(2).join("_");
  const keys = ["q1","q2","q3","q4","q5"];
  const step = parseInt(parts[1],10);

  if (!sessions[userId] || sessions[userId].step !== step) {
    return replyText(event.replyToken,
"💛 ขอเริ่มใหม่อีกครั้งนะ\nลองกด 'คุยเรื่องที่หนักใจ' ใหม่ได้เลย");
  }

  if (step < keys.length) {
    sessions[userId].answers[keys[step]] = value;
  }

  sessions[userId].step = step + 1;

  return sendStep(userId, event.replyToken);
}
  
////////////////////////////////////////////////////////////////////////////////////////
// ===== STEP FLOW CORE =====
if (data.startsWith("step_")) {

  const parts = data.split("_");
  const value = parts.slice(2).join("_");
  const step = parseInt(parts[1], 10);
  const keys = ["q1","q2","q3","q4","q5"];

  // 🔒 กันกดปุ่มเก่า
  if (!sessions[userId] || sessions[userId].step !== step) {
    return replyText(event.replyToken,
"💛 ขอเริ่มใหม่อีกครั้งนะ\nลองกด 'คุยเรื่องที่หนักใจ' ใหม่ได้เลย");
  }

  // ===== SPECIAL DECISION =====
  if (value === "continue") {
    sessions[userId].step = 6;
    return sendStep(userId, event.replyToken);
  }

  if (value === "pause") {
    delete sessions[userId];

    return replyFlex(event.replyToken, {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "💛 ไม่เป็นไรเลยนะ", weight: "bold" },
          {
            type: "text",
            text: "คุณยังไม่ต้องรีบก็ได้\nเรายังอยู่ตรงนี้เสมอ 💛",
            wrap: true,
            size: "sm"
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
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "💬 คุยเรื่องที่หนักใจ",
              data: "start_talk"
            }
          }
        ]
      }
    });
  }

  // ===== SAVE ANSWER =====
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

  return acceptCase(caseId, userId, role, event.replyToken);
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
  const slot = parts.slice(2).join("_");

  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "💛 ยืนยันเวลานี้นะ?" },
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
  
// ===== CONFIRM (PRODUCTION SAFE) =====
if (data.startsWith("confirm_")) {

  const parts = data.split("_");
  const caseId = parts[1];
  const slot = parts.slice(2).join("_");

  try {

    // 🔥 CALL GAS (source of truth)
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bookSlot",
        caseId,
        slot,
        userId // 🔥 ส่ง user ไป validate ด้วย
      })
    });

    const dataRes = await res.json();

    // ===== VALIDATION =====

    if (!dataRes || dataRes.status === "NOT_FOUND") {
      return replyText(event.replyToken,
        "❌ ไม่พบเคสนี้แล้ว");
    }

    if (dataRes.status === "COMPLETED") {
      return replyText(event.replyToken,
        "💛 เคสนี้จบไปแล้วนะ");
    }

    if (dataRes.status === "FULL") {
      return replyText(event.replyToken,
        "❌ เวลานี้ถูกจองไปแล้ว ลองเลือกใหม่ได้นะ");
    }

    if (dataRes.status !== "OK") {
      return replyText(event.replyToken,
        "⚠️ ระบบมีปัญหา ลองใหม่อีกครั้งนะ");
    }

    const targetUserId = dataRes.userId;
    const peerId = dataRes.peerId;

    // ===== SUCCESS =====

    await replyText(event.replyToken,
`✅ นัดเรียบร้อยแล้ว

🕒 ${slot}
💛 รอคุยกันได้เลยนะ`);

    // 🔥 push เฉพาะอีกฝั่ง (ลด quota)
    if (targetUserId !== userId) {
      pushToUser(targetUserId,
`💛 นัดเรียบร้อยแล้วนะ

🕒 ${slot}
พี่จะมาคุยกับคุณตามเวลานี้ 💬`);
    }

    if (peerId && peerId !== userId) {
      pushToUser(peerId,
`✅ มีเคสนัดแล้ว

🕒 ${slot}
เตรียมตัวได้เลย 💛`);
    }

    return;

  } catch (err) {
    console.log("❌ confirm error:", err);

    return replyText(event.replyToken,
      "⚠️ ระบบมีปัญหา ลองใหม่อีกครั้งนะ");
  }
}
} 
////////////////////////////////////////////////////////////////////
// ================= FLOW STEP (PRODUCTION READY) =================
async function sendStep(userId, replyToken) {

  const flow = [
    {
      text: "💛 เราอยู่ตรงนี้เพื่อฟังคุณนะ\nตอนนี้คุณอยากคุยเกี่ยวกับอะไร?",
      opts: [
        { label: "ความเครียด 😣", value: "q1_stress" },
        { label: "เรื่องเรียน 📚", value: "q1_academic" },
        { label: "ความสัมพันธ์ 💬", value: "q1_relationship" },
        { label: "ความรู้สึกตัวเอง 🌱", value: "q1_self" }
      ]
    },

    {
      text: "เรื่องนี้เกิดมานานแค่ไหนแล้ว?",
      opts: [
        { label: "เพิ่งเกิด", value: "q2_short" },
        { label: "สักพักแล้ว", value: "q2_medium" },
        { label: "นานแล้ว", value: "q2_long" }
      ]
    },

    {
      text: "เรื่องนี้ส่งผลกับชีวิตคุณแค่ไหน?",
      opts: [
        { label: "นิดหน่อย", value: "q3_low" },
        { label: "พอสมควร", value: "q3_medium" },
        { label: "มาก", value: "q3_high" }
      ]
    },

    {
      text: "ตอนนี้คุณมีใครคุยเรื่องนี้อยู่ไหม?",
      opts: [
        { label: "ยังไม่มี", value: "q4_none" },
        { label: "มีเพื่อน", value: "q4_friend" },
        { label: "มีครู/ผู้ใหญ่", value: "q4_adult" }
      ]
    },

    {
      text: "ตอนนี้คุณอยากได้ความช่วยเหลือแบบไหนมากที่สุด?",
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
      text: "💛 ถ้าอยากเล่าเพิ่ม พิมพ์มาได้เลยนะ\nหรือพิมพ์ 1 เพื่อข้าม",
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


// ================= ROUTE =================
function decideRoute(answers) {

  let peer = 0;
  let teacher = 0;

  const text = (answers.q6 || "").toLowerCase();

  // 👉 heuristic
  if (answers.q5 === "q5_advice") teacher += 2;
  if (answers.q5 === "q5_listen") peer += 2;
  if (answers.q5 === "q5_understand") peer += 1;

  if (text.includes("เรียน") || text.includes("สอบ")) teacher += 1;
  if (text.includes("เครียด") || text.includes("รู้สึก")) peer += 1;

  return teacher > peer ? "teacher" : "peer";
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

    return "peer";
  }


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

    // ===== MAP (กัน overwrite) =====
    global.caseMap = global.caseMap || {};

    if (!global.caseMap[caseId]) {
      global.caseMap[caseId] = {
        userId: targetUserId,
        peerId: userId
      };
    }

    // ===== SESSION =====
    if (!sessions[targetUserId]) sessions[targetUserId] = {};
    if (!sessions[userId]) sessions[userId] = {};

    sessions[targetUserId].inChat = true;
    sessions[targetUserId].activeCase = caseId;

    sessions[userId].inChat = true;
    sessions[userId].activeCase = caseId;

    // ===== REPLY PEER (FREE) =====
    await replyText(replyToken, "✅ รับเคสแล้ว เริ่มคุยได้เลย 💛");

    // ===== GET SLOT =====
    let slots = [];
    try {
      slots = await getSlots(userId);
    } catch (e) {
      console.log("❌ getSlots error:", e);
    }

    // ===== BUILD MESSAGE (🔥 push แค่ครั้งเดียว) =====
    let message;

    if (slots.length > 0) {
      message = {
        type: "flex",
        altText: "เลือกเวลา",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "💛 มีพี่มาดูแลคุณแล้ว\nเลือกเวลาคุยได้เลยนะ",
                weight: "bold",
                wrap: true
              },
              ...slots.slice(0,5).map(s => ({
                type: "button",
                action: {
                  type: "postback",
                  label: s,
                  data: "slot_" + caseId + "_" + s
                }
              }))
            ]
          }
        }
      };
    } else {
      message = {
        type: "text",
        text:
`💛 มีพี่เข้ามาดูแลคุณแล้วนะ
สามารถเริ่มคุยได้เลย 💬`
      };
    }

    // ===== PUSH ONCE =====
    await pushToUser(targetUserId, message);

    return;

  } catch (err) {
    console.log("❌ acceptCase ERROR:", err);
    return replyText(replyToken, "⚠️ ระบบมีปัญหา ลองใหม่อีกครั้งนะ");
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
          text: "📍 เมนูหลัก"
        },

        {
          type: "text",
          text: "เลือกสิ่งที่คุณอยากทำได้เลย 💛",
          size: "sm",
          wrap: true
        },

        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "💛 คุยเรื่องที่หนักใจ",
            data: "start_talk"
          }
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
            data: "menu_urgent"
          }
        },

        {
          type: "button",
          action: {
            type: "postback",
            label: "👥 สำหรับ Peer Support",
            data: "become_peer"
          }
        }
      ]
    }
  }, "main menu");
}

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
            data: "menu_urgent"
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
