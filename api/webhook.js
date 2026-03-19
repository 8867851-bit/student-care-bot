// ================= CONFIG =================
const CHANNEL_ACCESS_TOKEN = "Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzMsXUhu6RmkIIXq_E5IvnaUJvX7pMOrV20t_5vpQlNteTLBBhcJkddpmGkoOA8Z8T8-Q/exec";

// ================= SESSION =================
const sessions = {};

// ================= FLOW DEFINITION =================
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
export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).send("OK");

   const body = req.body || {};
const events = body.events || [];

    for (const event of events) {
      if (event.type === "message") await handleMessage(event);
      if (event.type === "postback") await handlePostback(event);
    }

  } catch (err) {
    console.log("ERROR:", err);
  }

  return res.status(200).send("OK");
}

// ================= MESSAGE =================
async function handleMessage(event) {
  return replyText(event.replyToken, "hello test");
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
          style: "secondary",
          action: {
            type: "postback",
            label: "รวมข้อมูล",
            data: "menu_resource"
          }
        },
        {
          type: "button",
          style: "secondary",
          action: {
            type: "postback",
            label: "กิจกรรม",
            data: "menu_activity"
          }
        },
        {
          type: "button",
          style: "secondary",
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

// ================= ENGINE =================
async function handlePostback(event) {
  const data = event.postback.data;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // เริ่ม flow
  if (data.startsWith("start_")) {
    const flowName = data.replace("start_", "");
    sessions[userId] = {
      flow: flowName,
      step: 0,
      answers: {}
    };
    return sendStep(userId, replyToken);
  }

  const session = sessions[userId];
 if (!session || !flows[session.flow]) {
  return sendMainMenu(replyToken);
}

  const flow = flows[session.flow];
  const currentStep = flow.steps[session.step];

  // save answer
  session.answers[currentStep.key] = data;

  // next step
  session.step++;

  if (session.step < flow.steps.length) {
    return sendStep(userId, replyToken);
  }

  // ===== END FLOW =====
  const result = classify(session.answers);

  //await sendToSheet({
   // caseId: Date.now(),
    //userId,
   // ...session.answers,
   // level: result
 // });

  delete sessions[userId];

  return sendResult(replyToken, result);
}

// ================= SEND STEP =================
async function sendStep(userId, replyToken) {
  const session = sessions[userId];
  const flow = flows[session.flow];
  const step = flow.steps[session.step];

  return replyFlex(replyToken, {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: step.text, wrap: true },
        ...step.options.map(opt => ({
          type: "button",
          action: {
            type: "postback",
            label: opt.label,
            data: opt.value
          }
        }))
      ]
    }
  });
}

// ================= CLASSIFY =================
function classify(s) {
  let score = 0;

  if (s.q2 === "long") score += 2;
  if (s.q2 === "medium") score += 1;

  if (s.q3 === "high") score += 3;
  if (s.q3 === "medium") score += 2;

  if (s.q4 === "none") score += 2;

  if (score >= 5) return "red";
  if (score >= 3) return "yellow";
  return "green";
}

// ================= RESULT =================
function sendResult(replyToken, level) {
  if (level === "red") {
    return replyText(replyToken,
      "💛 เรื่องนี้หนักมากเลยนะ\nเราจะช่วยพาคุณไปหาผู้ใหญ่ที่ช่วยได้ทันทีนะ"
    );
  }

  if (level === "yellow") {
    return replyText(replyToken,
      "💛 เดี๋ยวเราจะหาพี่ไปคุยกับคุณนะ"
    );
  }

  return replyText(replyToken,
    "🌿 ลองเริ่มจาก resource หรือเล่ากับเราเพิ่มได้เลยนะ"
  );
}

// ================= SHEET =================
async function sendToSheet(data) {
  await fetch(GAS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

// ================= REPLY =================
async function replyFlex(replyToken, bubble) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "flex", altText: "question", contents: bubble }]
    })
  });

  const text = await res.text();
  console.log("REPLY FLEX:", res.status, text);
}

async function replyText(replyToken, textMsg) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: textMsg }]
    })
  });

  const text = await res.text();
  console.log("REPLY TEXT:", res.status, text);
}
