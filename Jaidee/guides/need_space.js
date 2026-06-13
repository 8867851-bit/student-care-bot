window.GUIDE_CONTENT = {
  id:'need_space', emoji:'😮‍💨', category:'อยากมีพื้นที่ของตัวเอง',
  title:'ความต่างระหว่าง Solitude กับ Isolation', readTime:'3 นาที',
  sections:[
    { type:'intro', body:`เข้าใจเลยนะ... ความรู้สึกที่อยากอยู่คนเดียวบ้าง อยากมีพื้นที่ที่ไม่ต้องแสดง ไม่ต้องตอบสนอง ไม่ต้องเป็นอะไรให้ใคร แต่บางทีก็สงสัยตัวเองว่า "เราหนีสังคมเกินไปไหม"\n\nมีความต่างที่สำคัญมากระหว่างสองสิ่งนี้ และการรู้จักความต่างนั้นช่วยได้มาก` },
    { type:'section', emoji:'🧠', heading:'Solitude vs Isolation — ต่างกันอย่างไรในระดับ neuroscience',
      callouts:[
        { label:'Solitude — ความสันโดษที่เลือกเอง', body:'การอยู่คนเดียวด้วยความสมัครใจ (Chosen Aloneness) เพื่อพักผ่อน ทบทวน หรือ recharge ร่างกายและจิตใจ งานของ Ester Buchholz แสดงว่า solitude เป็น developmental need ที่สำคัญ โดยเฉพาะสำหรับวัยรุ่นที่กำลัง individuate — มันไม่ใช่ปัญหา มันคือสุขภาพ' },
        { label:'Isolation — ความโดดเดี่ยวที่ถูกบังคับ', body:'ความโดดเดี่ยวที่เราไม่ต้องการ รู้สึกถูกตัดขาดจากคนอื่น และสมองเริ่มประมวลผลมันเป็น social threat งานของ Cacioppo แสดงว่า chronic isolation activate inflammatory pathways และ disrupt sleep — ผลลัพธ์แตกต่างจาก solitude โดยสิ้นเชิง' }
      ]
    },
    { type:'section', emoji:'🌿', heading:'ทำไมวัยรุ่นถึงต้องการ Solitude มากกว่าที่คนอื่นคิด', body:`Elaine Aron's Highly Sensitive Person research แสดงว่าประมาณ 15-20% ของประชากรมี Sensory Processing Sensitivity ที่สูงกว่าปกติ ทำให้ process ข้อมูลรอบตัวลึกกว่า และต้องการ downtime มากกว่าเพื่อ recover มักถูก label ว่า "คิดมาก" หรือ "ขี้อาย" ทั้งที่จริงๆ คือ neurological set point\n\nสำหรับวัยรุ่นที่กำลังสร้างตัวตน เวลาคนเดียวยังช่วยให้ integrate experience และ develop sense of self ที่ stable ได้ด้วย การ "อยากอยู่คนเดียว" ของคุณอาจเป็นสัญญาณของการเติบโต ไม่ใช่การหนีสังคม` },
    { type:'table', emoji:'🛠️', heading:'วิธีสร้างพื้นที่ที่ใช่ให้ตัวเอง',
      columns:['สิ่งที่ควบคุมได้','วิธีทำ','เหตุผลทางวิทยาศาสตร์'],
      rows:[
        ['หายใจในพื้นที่ของตัวเอง','2 นาที คนเดียว ไม่ต้องอธิบายใคร เพียงแค่สูดหายใจและอยู่กับตัวเอง','Physiological Sigh activate parasympathetic nervous system ทำให้ร่างกายเข้าสู่ restorative mode ได้แม้เวลาน้อย'],
        ['อยู่กับมัน (RAIN)','เมื่อรู้สึกว่าต้องการพื้นที่แต่ไม่สามารถมีได้ ลองให้พื้นที่กับความรู้สึกนั้นข้างในก่อน','การ acknowledge ความต้องการโดยไม่ต้องกดข่มมันช่วยลดความตึงเครียดของระบบประสาทได้แม้ในสภาพแวดล้อมที่ยังไม่เปลี่ยน'],
        ['สำรวจว่าต้องการอะไรจริงๆ','ถามตัวเองว่า "ฉันต้องการพื้นที่เพื่ออะไร — recharge, คิดคนเดียว, หรือหนีจากบางอย่าง?" คำตอบบอกได้มากว่าสิ่งที่ต้องการจริงๆ คืออะไร','Self-awareness ช่วยให้ communicate ความต้องการกับคนรอบข้างได้ตรงขึ้น และช่วยให้ตัวเองรู้จักตัวเองมากขึ้น']
      ]
    },
    { type:'closing', body:`การต้องการพื้นที่ส่วนตัวไม่ใช่ความผิดปกติ ไม่ใช่การหนีปัญหา มันเป็นสิ่งที่ระบบประสาทของคุณต้องการเพื่อ function ได้ดี\n\nคืนนี้ถ้าต้องการเงียบ ก็เงียบได้ ไม่ต้องอธิบายใคร` }
  ],
  returnActions:[
    { icon:'🌬️', name:'หายใจผ่อนคลาย', href:'alltools.html#breathe' },
    { icon:'🌊', name:'อยู่กับมัน (RAIN)', href:'alltools.html#rain' },
    { icon:'🪞', name:"What's This Feeling?", href:'reflection.html' }
  ]
};
window.GUIDE_TOOL_LINKS = [{ phrase:'Physiological Sigh', toolId:'breathe' }, { phrase:'RAIN', toolId:'rain' }];
