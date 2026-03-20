


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
      }}, delay);}
      
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
