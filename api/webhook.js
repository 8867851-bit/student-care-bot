// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbyR0siRWKlScIozsxY1DCSFMdJ1BaGX49GJtdCQuGCfXT81ppnW8NliliRQ-pyCaHo0lQ/exec";
const GROUP_ID = "Caa4c88f8d6ec0c5a7efa665d27636bb5";

if (!global.caseMap) global.caseMap = {};
const sessions = {};
const handledEvents = new Set();


// ================= MAIN =================
module.exports = async (req, res) => {
  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

  const events = body?.events || [];

  for (const event of events) {
  const eventId = event.replyToken;
    
  if (handledEvents.has(eventId)) { continue; }  
  handledEvents.add(eventId);
    if (event.type === "follow") {
  await sendMainMenu(event.replyToken); }

if (event.type === "message") await handleMessage(event);
if (event.type === "postback") await handlePostback(event); }

  return res.status(200).send("OK"); };

// ================= MESSAGE ==================
async function handleMessage(event){
    const userId = event.source.userId;
    const text = event.message?.text || "";
    const s = sessions[userId];

// ===== SESSION LOCK =====
if (sessions[userId]?.locked) {

  if (text === "เมนู") {
    return replyFlex(event.replyToken, {
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

  // 👉 default ตอน locked
  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [

        {
          type: "text",
          text: "💛 เราได้รับเรื่องของคุณแล้วนะ",
          weight: "bold"
        },
        {
          type: "text",
          text: `ตอนนี้เรากำลังหาคนที่เหมาะกับคุณอยู่\n⏳ ใช้เวลาประมาณ ${getETA()}`,
          size: "sm",
          wrap: true
        },
        {
          type: "text",
          text: "ระหว่างนี้คุณสามารถเลือกได้เลย 💛",
          size: "sm"
        },

        {
          type: "button",
          action: {
            type: "message",
            label: "📍 เมนู",
            text: "เมนู"
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
            label: "🌱 สำรวจตัวเอง",
            data: "menu_explore"
          }
        }

      ]
    }
  });

} // ✅ ปิด LOCK ตรงนี้
  
  if (text === "เมนู") {
     // 🔒 ถ้ายัง locked → ห้าม reset
  if (sessions[userId]?.locked) {
    return sendLockedMenu(event.replyToken); }
    // 🟢 ปกติ → reset ได้
  delete sessions[userId];
  return sendMainMenu(event.replyToken); }
  
  if (s && s.step < 6) {
  if (text === "reset") {
    delete sessions[userId];
    return replyText(event.replyToken, "เริ่มใหม่ได้เลยนะ 💛"); }
    return replyText(event.replyToken,
`💛 ตอนนี้เรากำลังคุยกันอยู่  ลองกดเลือกคำตอบด้านบน หรือพิมพ์ "เมนู" เพื่อเริ่มใหม่ได้เลยนะ`); }

  if (text === "คุย") {
    sessions[userId] = { step: 0, answers: {} };
    return sendStep(userId, event.replyToken); }

  if (text === "เข้าใจ") {
    return sendExploreMenu(event.replyToken); }

  if (text === "พัก") {
    return replyText(event.replyToken, 
      `💛 ลองพักสักนิดนะ
       หายใจลึก ๆ 3 ครั้ง  
       ดื่มน้ำเย็นสักแก้ว  
       หรือขยับตัวเบา ๆ
       แล้วค่อยกลับมานะ เราอยู่ตรงนี้ 💛`); } 
   
  // ===== Q6 INPUT =====
if (s && s.step === 6) {
  s.answers["q6"] = text;
    // ===== AI ANALYSIS =====
const ai = await getAIAnalysis(text);

if (ai && ai.followups && ai.followups.length > 0) {
s.aiFollowups = ai.followups;
  
  return replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "💛 " + (ai.reflection || "เราอยู่ตรงนี้นะ"),
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

   // ===== ZERO INPUT DETECTION =====
const isEmpty = !text || text.trim() === "" || text.trim() === "1";

if (isEmpty) {
  s.answers["q6"] = "";

  const caseId = Date.now().toString().slice(-6);
  const level = classify(s.answers);
  let intent = detectIntent(s.answers);
  let route = decideRoute(s.answers);

  if (intent === "crisis" || intent === "practical_advice") route = "teacher";
  if (intent === "emotional_support") route = "peer";

  await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "create",
      caseId,
      userId,
      ...s.answers,
      level,
      route
    })
  });

  await notifyTeam(caseId, level, s.answers, route);

  await replyFlex(event.replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: "💛 ไม่เป็นไรเลยนะ", weight: "bold" },
        { type: "text", text: "แค่คุณมาถึงตรงนี้ก็เก่งมากแล้ว", size: "sm" },
        {
          type: "text",
          text: `⏳ เรากำลังหาคนที่เหมาะกับคุณอยู่\nใช้เวลาประมาณ ${getETA()}`,
          size: "sm",
          wrap: true
        },
        { type: "text", text: "ระหว่างนี้คุณสามารถเลือกได้เลย 💛", size: "sm" },

        {
          type: "button",
          action: { type: "message", label: "📍 เมนู", text: "เมนู" }
        },
        {
          type: "button",
          action: { type: "message", label: "💤 พักสักนิด", text: "พัก" }
        },
        {
          type: "button",
          action: { type: "postback", label: "🌱 สำรวจตัวเอง", data: "menu_explore" }
        }
      ]
    }
  });

  // 🔥🔥🔥 สำคัญที่สุด
  sessions[userId].locked = true;

  return;
}
        
    // ===== INTENT + RISK CHECK =====
    
const inputText = (text || "").toLowerCase();
// const isPractical = hasKeyword(inputText, practicalKeywords);
//const isEmotional = hasKeyword(inputText, emotionalKeywords);
const isRisk = hasKeyword(inputText, riskKeywords);
    
    //======= Highrisk check =====
const isHighRisk = isRisk && s.answers.q3 === "q3_high";

    const caseId = Date.now().toString().slice(-6);
    const level = classify(s.answers);
    const intent = detectIntent(s.answers);
    let route = decideRoute(s.answers);
    
// ===== INTENT → ROUTE OVERRIDE =====
    if (intent === "crisis" || intent === "practical_advice") { route = "teacher"; }
    if (intent === "emotional_support") { route = "peer"; }
    
// ==== confidence ====    
const confidence = getConfidence(intent, s.answers);  
const hasMeaningfulSignal = hasKeyword(text, emotionalKeywords) || hasKeyword(text, practicalKeywords) || text.trim().length > 5;
if (confidence <= 1 && !hasMeaningfulSignal && s.answers.q5 === "q5_confused") {
      // 👉 low clarity case
         delete sessions[userId];
  
return replyFlex(event.replyToken, {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: "💛 เราอยากเข้าใจคุณให้ตรงมากขึ้นอีกนิดนะ",
        weight: "bold",
        wrap: true
      },
      {
        type: "text",
        text: "สิ่งที่ใกล้กับคุณที่สุดตอนนี้คืออะไร?",
        size: "sm",
        wrap: true
      },
      {
        type: "button",
        action: {
          type: "postback",
          label: "💬 แค่อยากระบาย",
          data: "clarify_emotional"
        }
      },
      {
        type: "button",
        action: {
          type: "postback",
          label: "🤝 อยากคุยกับคนจริง",
          data: "clarify_peer"
        }
      },
      {
        type: "button",
        action: {
          type: "postback",
          label: "🧠 อยากได้คำแนะนำ",
          data: "clarify_advice"
        }
      }
    ]
  }
}); 
}
    // ===== EMOTIONAL CHECK =====
    const highEmotional =
      s.answers.q3 === "q3_high" &&
      s.answers.q4 === "q4_none"; 
  
// ===== AI OVERRIDE =====
let finalIntent = intent;
let finalRoute = route;

if (ai) {
  if (ai.intent) finalIntent = ai.intent;
  if (ai.suggestion) finalRoute = ai.suggestion;
}
  
// ===== CREATE CASE =====
await fetch(GAS_URL, {
  method: "POST",
  headers: {"Content-Type":"application/json"},
  body: JSON.stringify({
    action: "create",
    caseId,
    userId,
    ...s.answers,
    level,
    route: finalRoute
  })
});

await notifyTeam(caseId, level, s.answers, finalRoute);

// ===== RESPONSE =====
let msg = "";

if (ai) {
  if (ai.reflection) msg += "💛 " + ai.reflection + "\n\n";
  if (ai.summary) msg += "🧠 " + ai.summary + "\n\n";
} else {
  msg += "💛 เราได้อ่านสิ่งที่คุณเล่าแล้วนะ\n\n";
}

msg += buildHumanMessage(finalIntent, s.answers, finalRoute);

msg += `\n⏳ โดยปกติจะใช้เวลา ${getETA()}`;
msg += `\n💛 ระหว่างนี้เราจะช่วยหาคนที่เหมาะกับคุณให้เร็วที่สุดนะ`;

if (finalIntent === "crisis") {
  msg += `\n💛 ถ้าคุณรู้สึกว่ามันหนักมาก
คุณสามารถโทร 1323 ได้ตลอด 24 ชั่วโมงนะ`;
}

// ===== SEND =====
await replyText(event.replyToken, msg);

// ===== FOLLOW UP =====
scheduleFollowUp(caseId, userId, level);

// ===== END =====
sessions[userId] = { done: true, locked: true };
return;
}
  
  // ===== DEFAULT MENU =====
  const type = event.source.type;
  
if (!sessions[userId]) {
  if (text === "เมนู") {
    return sendMainMenu(event.replyToken); }
    return replyText(event.replyToken,
`💛 ตอนนี้ยังไม่ได้อยู่ในโหมดคุยนะ

พิมพ์ "คุย" เพื่อเริ่มเล่าได้เลย  
หรือพิมพ์ "เมนู" เพื่อเลือกอย่างอื่น 💛`); }
  
  if (type === "user") {
    return sendMainMenu(event.replyToken); }

  if (type === "group") {
    if (text === "start") {
      return sendMainMenu(event.replyToken); } } }

// ================= POSTBACK =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  console.log("DATA:", data);
  console.log("SESSION:", sessions[userId])
  

  //=== เพิ่ม3อัน===
    if (data === "clarify_emotional") {
    if (!sessions[userId]) {
      sessions[userId] = { step: 5, answers: {} }; }
    sessions[userId].answers.q5 = "q5_listen";
    return sendStep(userId, event.replyToken); }

  if (data === "clarify_peer") {
    if (!sessions[userId]) {
      sessions[userId] = { step: 5, answers: {} }; }
    sessions[userId].answers.q5 = "q5_understand";
    return sendStep(userId, event.replyToken);}

  if (data === "clarify_advice") {
    if (!sessions[userId]) {
      sessions[userId] = { step: 5, answers: {} };
    }
    sessions[userId].answers.q5 = "q5_advice";
    return sendStep(userId, event.replyToken); }
//===== end3 อัน=====

  // ===== Q6 FOLLOW-UP =====
if (data.startsWith("q6_follow_")) {
  const s = sessions[userId];
  if (!s) return;

  const index = parseInt(data.replace("q6_follow_", ""), 10);

  // 👉 ดึง followup ที่ user กด (ถ้ามี AI เก็บไว้)
  if (s.aiFollowups && s.aiFollowups[index]) {
    s.answers.q6 = s.aiFollowups[index];
  } else {
    s.answers.q6 = "follow_" + index;
  }

  await replyText(event.replyToken,
    "💛 ขอบคุณที่บอกนะ เราเข้าใจคุณมากขึ้นแล้ว");

  // ===== FLOW ต่อเหมือน Q6 ปกติ =====
  const caseId = Date.now().toString().slice(-6);
  const level = classify(s.answers);
  const intent = detectIntent(s.answers);
  let route = decideRoute(s.answers);

  if (intent === "crisis" || intent === "practical_advice") route = "teacher";
  if (intent === "emotional_support") route = "peer";

  await fetch(GAS_URL, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      action: "create",
      caseId,
      userId,
      ...s.answers,
      level,
      route
    })
  });

  await notifyTeam(caseId, level, s.answers, route);

  sessions[userId] = { locked: true };
  return;
}
  
// ===== STEP FLOW (สำคัญมาก) =====
if (data.startsWith("step_")) {
  const parts = data.split("_");
  const value = parts.slice(2).join("_");
  const keys = ["q1","q2","q3","q4","q5"];
  const step = parseInt(parts[1],10);

  // 🔥 guard: กันกดปุ่มเก่า
if (!sessions[userId] || sessions[userId].step !== step) {
  return replyText(event.replyToken,
"💛 ขอเริ่มใหม่อีกครั้งนะ\nลองกด 'คุยเรื่องที่หนักใจ' ใหม่ได้เลย");
}


// ===== SPECIAL CHOICE (transition decision) =====
if (value === "continue") {
  sessions[userId].step = 6; // 👉 บังคับไป Q6
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
        {
          type: "text",
          text: "💛 ไม่เป็นไรเลยนะ",
          weight: "bold"
        },
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
  

  if (!sessions[userId]) {
  sessions[userId] = { step: 0, answers: {} };
}

  if (step < keys.length) {
  sessions[userId].answers[keys[step]] = value; }
  sessions[userId].step = step + 1;
  return sendStep(userId, event.replyToken); 
 }


    // ===== START =====
 if (data === "start_talk") {
  // 🔥 force เริ่มใหม่เสมอ
  sessions[userId] = { step: 0, answers: {} };
  return sendStep(userId, event.replyToken); }

  
  // ===== MENU =====
  if (data === "menu_explore") {
  return sendExploreMenu(event.replyToken);
}
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

   
  //======= Become Peer=====
  if (data === "become_peer") {
  const userId = event.source.userId;

  return replyText(event.replyToken,
`💛 ขอให้โชคดีกับการผจญภัย Peer Support รุ่นที่1!

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
ไม่ว่าจะเป็นพี่นักเรียนหรือครูในโครงการ  
แล้วนัดเวลาคุยกันแบบตัวต่อตัวนะ

คุณสามารถเลือกได้เลย 💛`,
  opts: [
    { label: "💬 ไปต่อ", value: "continue" },
    { label: "🌱 ขอคิดดูก่อน", value: "pause" }
  ]
},
    
{
  text: " ถ้าอยากเล่าเพิ่ม เราจะอ่านทุกอย่างนะ💛 [พิมพ์ 1 เพื่อข้าม]",
  input: true
}
  ];

  const s = sessions[userId];
if (!s) { return replyText(replyToken, "ลองกดเริ่มใหม่อีกครั้งนะ 💛"); }
  
  await replyFlex(replyToken, {
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

      ...(flow[s.step].input || flow[s.step].noInput
        ? []
        : flow[s.step].opts.map(o => ({
            type: "button",
            action: {
              type: "postback",
              label: o.label,
              data: "step_" + s.step + "_" + o.value
            }
          }))
      )
    ]
  }
});
 return; } 
  
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

function decideRoute(answers) {
  let peer = 0;
  let teacher = 0;

  const text = (answers.q6 || "").toLowerCase();

  // ================= HARD RULES (ตัดจบทันที) =================

  // relationship → peer เสมอ
  if (answers.q1 === "q1_relationship") return "peer";
  
  // academic → teacher เสมอ
  if (answers.q1 === "q1_academic") return "teacher";

  // ================= SELF LOGIC (priority สูง) =================

  if (answers.q1 === "q1_self") {
    // ถ้ามี keyword แนว planning → teacher
    if (
      text.includes("อนาคต") ||
      text.includes("เป้าหมาย") ||
      text.includes("แผน") ||
      text.includes("เรียนต่อ") ||
      text.includes("คณะ") ||
      text.includes("อาชีพ")
    ) {
      return "teacher";
    }

    //  self → peer
    return "peer";
  }

  // ================= STRESS ESCALATION =================

  if ( answers.q1 === "q1_stress" &&
    answers.q3 === "q3_high" &&
    answers.q4 === "q4_none" ) { return "teacher"; }

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

  // 👉 สายวางแผน → teacher
  if (
    text.includes("สอบ") ||
    text.includes("tcas") ||
    text.includes("พอร์ต") ||
    text.includes("คณะ") ||
    text.includes("อาชีพ") ||
    text.includes("เรียนต่อ")
  ) {
    teacher += 3;
  }

  // 👉 emotional → peer
  if (
    text.includes("เครียด") ||
    text.includes("เหนื่อย") ||
    text.includes("ท้อ") ||
    text.includes("ไม่ไหว") ||
    text.includes("เสียใจ")
  ) {
    peer += 2;
  }

  // ================= FINAL DECISION =================
  if (teacher > peer) return "teacher";
  return "peer"; }

// ================= KEYWORD SYSTEM (NEW) =================

// ===== KEYWORD GROUPS =====
const practicalKeywords = [
  "สอบ","เรียน","การบ้าน","ตาราง","คะแนน",
  "สอบไม่ติด","อ่านหนังสือ","เกรด","gpa",
  "tcas","กสพท","พอร์ต","คณะ","มหาลัย","ติว"
];
const emotionalKeywords = [
  "เครียด","เหนื่อย","ท้อ","กดดัน","หมดแรง","กังวล","ไม่ไหว", 
  "เศร้า","เสียใจ","ร้องไห้","ดาวน์","หดหู่","สิ้นหวัง",
  "ว่างเปล่า","เฉยๆ","ไม่มีความรู้สึก","ชา","ชินชา",
  "กลัว","แพนิค","ตื่นเต้น","ใจสั่น","คิดมาก","วน","overthink","คิดมาก",
  "ไร้ค่า","ไม่เก่ง","ไม่ดีพอ","แย่","ล้มเหลว",
  "เหงา","โดดเดี่ยว","ไม่มีใคร","อยู่คนเดียว","ไม่มีคนเข้าใจ",
  "หมดไฟ","เบื่อ","ไม่อยากทำอะไร","ขี้เกียจ","ฝืน",
  "งง","สับสน","ไม่รู้","ไม่แน่ใจ","คิดไม่ออก","มึน"
];
const riskKeywords = [
  "ไม่ไหว","อยากหายไป","หมดหวัง",
  "ไม่มีเหตุผลจะอยู่","อยู่ไปก็ไม่มีค่า",
  "อยากหนีไป","ไม่อยากอยู่แล้ว"
];
// ===== HELPER FUNCTION =====
function hasKeyword(text, keywords) {
  return keywords.some(k => text.includes(k));
}
// ================= INTENT DETECTION (V3) =================
function detectIntent(answers) {
  const text = (answers.q6 || "").toLowerCase();

  const isPractical = hasKeyword(text, practicalKeywords);
  const isRisk = hasKeyword(text, riskKeywords);

  // 🚨 crisis
  if ( isRisk && answers.q4 === "q4_none" ) { return "crisis"; }

  // ===== USER NEED FIRST =====
  if ( answers.q5 === "q5_listen" || answers.q5 === "q5_understand" ) { return "emotional_support"; }

  if ( answers.q5 === "q5_confused") { return "emotional_support"; }

  if ( answers.q5 === "q5_advice" && isPractical ) { return "practical_advice"; }

  return "emotional_support"; }

//======== + EMPHATY===========
function buildHumanMessage(intent, answers, route) {

  // ===== base ====
  let msg = "";

  // ===== intent layer =====
  if (intent === "crisis") { msg += "\nเรื่องนี้มันหนักมากจริง ๆ\nคุณไม่จำเป็นต้องอยู่กับมันคนเดียวเลยนะ"; }
    else if (intent === "practical_advice") { msg += "\nดูเหมือนคุณกำลังพยายามหาทางออกอยู่จริง ๆ"; }
    else { msg += "\nมันโอเคเลยนะที่จะรู้สึกแบบนี้"; }

  // ===== suggestion layer =====
  if (route === "teacher") { msg += `\n\nถ้าคุณอยากได้คำแนะนำแบบชัดเจน\nเราจะช่วยจับคู่คุณกับครูในระบบ ที่สามารถช่วยคุณคิดทางออกได้นะ 👩‍🏫`;} 
    else { msg += `\n\nถ้าคุณอยากมีคนฟัง\nเราจะช่วยจับคู่คุณกับพี่นักเรียนในระบบ  
ที่พร้อมฟังและเข้าใจคุณนะ 💛`; }

  // ===== soft autonomy =====
  msg += `\n\nคุณสามารถเลือกแบบที่คุณสบายใจได้เลยนะ`;
    return msg; }

async function getAIAnalysis(text) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `
คุณคือผู้ช่วยด้าน emotional support สำหรับนักเรียนมัธยมปลาย

วิเคราะห์ข้อความแล้วตอบ JSON เท่านั้น:

{
  "emotion": "...",
  "intent": "emotional_support / practical_advice / crisis",
  "summary": "สรุปสิ่งที่ผู้ใช้พูดสั้น ๆ",
  "reflection": "ประโยคสะท้อนความรู้สึก 1-2 ประโยค",
  "suggestion": "peer หรือ teacher",
  "followups": [
    "ตัวเลือกที่ 1",
    "ตัวเลือกที่ 2",
    "ตัวเลือกที่ 3"
  ]
}

กฎ:
- reflection = ฟังแล้วรู้สึกถูกเข้าใจ
- followups = เป็นคำถามหรือทางเลือกสั้น ๆ (ไม่เกิน 10 คำ)
- ถ้าเป็น emotional → suggestion = peer
- ถ้าเป็น planning → suggestion = teacher
- ถ้าเสี่ยง → suggestion = teacher
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

    if (!data.choices || !data.choices[0]) {
      console.log("AI BAD RESPONSE:", data);
      return null;
    }

    try {
      return JSON.parse(data.choices[0].message.content);
    } 
    catch (e) {
      console.log("JSON PARSE ERROR:", data.choices[0].message.content);
      return null; }
  } 
  catch (e) {
    console.log("AI ERROR:", e);
    return null; }
}

  
// ================= ETA =================
function getETA() {
  const h = new Date().getHours();
  if (h < 8) return "ในช่วงเช้าวันนี้";
  if (h < 18) return "ภายใน 1–3 ชั่วโมง";
  return "💛 เราจะติดต่อคุณกลับแน่นอน";
}
// ================= CONFIDENCE (V3) =================
function getConfidence(intent, answers) {
  let score = 0;

  const text = (answers.q6 || "").trim();

  // ===== INTENT =====
  if (intent === "crisis") score += 4;
  if (intent === "practical_advice") score += 2;

  // ===== USER NEED =====
  if (answers.q5 === "q5_advice") score += 2;
  if (answers.q5 === "q5_confused") score -= 2;

  // ===== SUPPORT =====
  if (answers.q4 === "q4_none") score += 1;

  // ===== INTENSITY =====
  if (answers.q3 === "q3_high") score += 1;

  // ===== TEXT QUALITY =====
  if (text.length > 10) score += 1;
  if (text.length > 30) score += 1;

  // ===== KEYWORD SIGNAL =====
  if (hasKeyword(text, practicalKeywords)) score += 1;
  if (hasKeyword(text, emotionalKeywords)) score += 1;

  // ===== CONSISTENCY CHECK =====
  if (answers.q5 === "q5_advice" && intent === "emotional_support") {
    score -= 2;
  }

  return score;
}
// ================= NOTIFY =================
async function notifyTeam(caseId, level, answers, route) {
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
  { type: "text", text: "🧠 ประเภท: " + answers.q1 },
  {
  type: "text",
  text: "🎯 แนะนำ: " + (route === "teacher" ? "👩‍🏫 ครู" : "👩‍🎓 พี่นักเรียน")
},
  { type: "text", text: "📝 " + (answers.q6 || "-"), wrap: true },
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
async function acceptCase(caseId, userId, role, replyToken) {
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

    // 🔗 map user ↔ peer
    global.caseMap[caseId] = {
      userId: data.targetUserId,
      peerId: userId
    };
    sessions[data.targetUserId] = { done: false, locked: false };
    
    // ✅ ตอบ peer
    await replyText(replyToken, "✅ รับเคสแล้ว");

    // 🔥 ดึง slot จริงจาก sheet
    //const name = "peer"; // (เดี๋ยว upgrade ทีหลัง)
    const slots = await getSlots(userId);

    // ✅ ส่ง slot ให้ user
    await pushToUser(data.targetUserId, {
      type: "flex",
      altText: "เลือกเวลา",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "💛 พี่ว่างช่วงนี้นะ" },

            ...(slots.length > 0
              ? slots.slice(0,5).map(s => ({
                  type: "button",
                  action: {
                    type: "postback",
                    label: s,
                    data: "slot_" + caseId + "_" + s
                  }
                }))
              : [
                  { type: "text", text: "⚠️ ยังไม่มีเวลาว่าง" }
                ])
          ]
        }
      }
    });

    return;
  }

  if (data.status === "FULL") {
    return replyText(replyToken, "❌ เคสนี้มีคนดูแลแล้ว");
  }

  return replyText(replyToken, "⚠️ error");
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
// ================= GET SLOTS =================
async function getSlots(userId) {
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
  
function buildPersonalizedQ6(replyToken, ai) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "💛 " + (ai?.reflection || "เราอยู่ตรงนี้นะ"),
          wrap: true
        },

        ...(ai?.followups || []).map((f, i) => ({
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
  
async function sendMainMenu(replyToken) {
  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        
        { type: "text",
          text: "💛 Student Care TU",
          weight: "bold",
          size: "lg" },
        
        { type: "text",
          text: "📍 เมนูหลัก" },
        
        { type: "text",
          text: "เลือกสิ่งที่คุณอยากทำได้เลย 💛",
          size: "sm" },

        { type: "button",
          style: "primary",
          action: {type: "postback",
            label: "💛 คุยเรื่องที่หนักใจ",
            data: "start_talk" } },

        { type: "button",
          action: { type: "postback",
            label: "🌱 สำรวจตัวเอง",
            data: "menu_explore" } },

        { type: "button",
          action: { type: "uri",
            label: "📚 ดูตัวเลือกทั้งหมด",
            uri: "https://hub2-theta.vercel.app" } },

        { type: "button",
          action: { type: "postback",
            label: "🚨 ขอความช่วยเหลือด่วน",
            data: "menu_urgent" } },

        { type: "button",
          action: {
            type: "postback",
            label: "👥 สำหรับ Peer Support",
            data: "become_peer" } }
      ]
    }
  });
}
async function sendExploreMenu(replyToken) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "flex",
          altText: "สำรวจตัวเอง",
          contents: {
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
                  text: "เริ่มต้นแบบไม่ต้องเล่าอะไร",
                  size: "sm"
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
                }
              ]
            }
          }
        }
      ]
    })
  });
}
