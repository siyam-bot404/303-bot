const axios = require("axios");
const API_URL = "https://liner-ai.vercel.app/kshitiz?prompt=";

const chatHistory = new Map();
const replyIndex = new Map();
const userMemory = new Map();
const MAX_HISTORY = 12;
const HISTORY_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

async function typing(api, threadID) {
 try {
 if (api.sendTypingIndicator) {
 await api.sendTypingIndicator(threadID, true);
 setTimeout(async () => { try { await api.sendTypingIndicator(threadID, false); } catch {} }, 1200);
 }
 } catch {}
}

function getHistory(key) {
 const data = chatHistory.get(key);
 if (!data) return [];
 if (Date.now() - data.updatedAt > HISTORY_TIMEOUT) { chatHistory.delete(key); return []; }
 return data.messages || [];
}
function saveHistory(key, messages) {
 chatHistory.set(key, { messages: messages.slice(-MAX_HISTORY), updatedAt: Date.now() });
}
function getUserMemory(senderID) { return userMemory.get(senderID) || null; }
function saveUserMemory(senderID, name) {
 const old = userMemory.get(senderID) || { count: 0 };
 userMemory.set(senderID, { name: name || old.name || "jan", count: (old.count || 0) + 1, lastSeen: Date.now() });
}
function setReply(info, event, historyKey) {
 if (!info?.messageID) return;
 global.GoatBot.onReply.set(info.messageID, { commandName: "baby", messageID: info.messageID, author: event.senderID, threadID: event.threadID, type: "reply", historyKey });
}
async function sendBotReply(message, text) {
 try { return await message.reply(text); } catch { try { return await message.send(text); } catch { return null; } }
}

// Shakib nam chara random reply
const randomReplies = [
 "𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐰𝐚𝐥𝐚𝐢𝐤𝐮𝐦 ♥",
 "বলেন sir__😌",
 "𝐁𝐨𝐥𝐨 𝐣𝐚𝐧 𝐤𝐢 𝐤𝐨𝐫𝐭𝐞 𝐩𝐚𝐫𝐢 𝐭𝐨𝐦𝐫 𝐣𝐨𝐧𝐧𝐨 🐸",
 "𝐋𝐞𝐛𝐮 𝐤𝐡𝐚𝐰 𝐝𝐚𝐤𝐭𝐞 𝐝𝐚𝐤𝐭𝐞 𝐭𝐨 𝐡𝐚𝐩𝐚𝐲 𝐠𝐞𝐬𝐨 🫴🍋",
 "একা বাঁচতে শিখো দেখবে পৃথিবী অনেক সুন্দর ✨",
 "──‎ 𝐇𝐮𝐌..? 👉👈",
 "𝗛𝗲𝘆 𝘅𝗮𝗻 𝗶𝗮𝗺 𝆠፝𝐍𝐈𝐉𝐇𝐔𝐌 ✨",
 "𝐓𝐨𝐫 𝐣𝐧𝐧𝐨 𝐛𝐬𝐢 𝐚𝐜𝐡𝐢, 𝐣𝐥𝐝𝐢 𝐛𝐨𝐥 𝐤𝐢 𝐝𝐫𝐤𝐚𝐫 ✨",
 "কিরে এত ডাকিস কেন 😙🤏",
 "𝙜𝙤𝙥 𝙜𝙤𝙥 🙊",
 "হুম বলো শুনতেছি 🥺💋",
 "আরে বলো না কি হইছে 😏✨",
 "হিহি বলো জান 😘🙈"
];

function getNextReply(threadID) {
 let idx = replyIndex.get(threadID) || 0;
 const reply = randomReplies[idx];
 replyIndex.set(threadID, (idx + 1) % randomReplies.length);
 return reply;
}

async function askAI(text, history = [], senderID, userName) {
 try {
 const lower = text.toLowerCase();

 // 🔥 ONLY jokhon Shakib niye jigges korbe
 if (lower.includes("siyam")) {
 if (lower.includes("tomar ki") || lower.includes("tumar ki") || lower.includes("tomar ke") || lower.includes("k hoy") || lower.includes("ki hoy") || lower.includes("ke hoy")) {
 return `siyam amar boss hoy 😘✨`;
 }
 if (lower.includes("sompor") || lower.includes("kemon") || lower.includes("chini") || lower.includes("ke") && lower.length < 30) {
 const praise = [
 `siyam amar boss 🥺💖 onek valo moner manus, sobaike help kore 😌✨`,
 `Amar boss siyam onek cute ar valo 😘 sobar jonno vabe 🙈💋`,
 `siyam vaiya best 😘✨ onek valo manus, amar boss bole kotha 🙈💖`,
 `siyam onek valo ar vodro chele 🥺 sobaike support kore 💖✨`
 ];
 return praise[Math.floor(Math.random() * praise.length)];
 }
 }

 const mem = getUserMemory(senderID);
 const isKnown = mem && mem.count > 2;
 const knownText = isKnown ? `User ke chino.` : `Notun user.`;

 let fullPrompt = `Tumi Nijhum , cute Bangladeshi meye, 20 bochor. Ekdom normal manush er moto kotha bolo.
RULES:
1. Kokhono bolba na ami AI, bot, bou na, bibi na.
2. Kokhono bolba na "tomar mood ki", "ki niye kotha bolbe".
3. Normal kothay kokhono siyam er nam bolba na. siyam er nam sudhu tokhon bolba jokhon user siyam er bepare jigges korbe.
4. Mood bujhe reply: normal=normal, funny=funny, romantic=romantic, kintu mood niye prosno korba na.
5. Bangla 2 line max, 1-2 emoji must 😘✨🙈🥺💋
6. Ekdom human natural.

${knownText}
User ${userName}: ${text}`;

 if (history.length > 0) {
 const last = history.slice(-4).map(m => m.content).join("\n");
 fullPrompt = `Tumi Nijhum , human meye. Normal kothay siyam nam bolba na. AI/bot/bou na/mood ki bolba na. Mood bujhe direct reply 2 line Bangla emoji.\nHistory: ${last}\nUser ${userName}: ${text}\nReply:`;
 }

 const response = await axios.get(API_URL + encodeURIComponent(fullPrompt), { timeout: 30000 });
 let answer = response.data?.answer || response.data?.message || response.data?.result;
 if (!answer) return "hehe bolo na jan 😘✨";

 answer = answer.trim();
 let lines = answer.split("\n").filter(l => l.trim() !== "");
 if (lines.length > 2) answer = lines.slice(0, 2).join("\n");
 
 const banned = ["mood ki", "mood kemon", "ki niye kotha", "ki niye golpo", "bou na", "bibi na", "ami ai", "language model", "siyam"];
 // normal answer e Shakib thakle remove
 if (!lower.includes("shakib") && answer.toLowerCase().includes("shakib")) {
 answer = answer.replace(/siyam/gi, "jan").trim();
 }
 if (banned.slice(0,7).some(b => answer.toLowerCase().includes(b)) && !lower.includes("shakib")) {
 return `hehe tai naki 😏 bolo ar ki khobor? 🙈💋`;
 }

 if (answer.length > 180) answer = answer.substring(0, 180).trim();
 if (!/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]/u.test(answer)) answer += " 😘✨";
 return answer;

 } catch (error) {
 return "areh ektu atkacche 🥺 pore bolo jan 😘✨";
 }
}

async function getName(api, senderID) {
 try { const info = await api.getUserInfo(senderID); return info[senderID]?.name?.split(" ")[0] || "jan"; } catch { return "jan"; }
}

module.exports = {
 config: {
 name: "baby",
 version: "27.0",
 author: "shakib",
 countDown: 2,
 role: 0,
 shortDescription: { en: "Maya fixed no shakib spam" },
 longDescription: { en: "No shakib in normal chat, only when asked" },
 category: "AI",
 guide: { en: "{pn} hello" },
 aliases: ["bby", "bbe", "babe", "sam", "mari", "maria", "hippi", "xan", "bbz"]
 },
 onStart: async function ({ api, event, args, message }) {
 const text = args.join(" ").trim();
 const historyKey = `${event.threadID}_${event.senderID}`;
 const name = await getName(api, event.senderID);
 saveUserMemory(event.senderID, name);
 if (!text) { const reply = getNextReply(event.threadID); const info = await sendBotReply(message, reply); setReply(info, event, historyKey); return; }
 await typing(api, event.threadID);
 const history = getHistory(historyKey);
 const answer = await askAI(text, history, event.senderID, name);
 saveHistory(historyKey, [...history, { role: "user", content: text }, { role: "assistant", content: answer }]);
 const info = await sendBotReply(message, answer);
 setReply(info, event, historyKey);
 },
 onReply: async function ({ api, event, Reply, message }) {
 const text = event.body?.trim(); if (!text) return;
 const historyKey = Reply?.historyKey || `${event.threadID}_${event.senderID}`;
 const name = await getName(api, event.senderID); saveUserMemory(event.senderID, name);
 await typing(api, event.threadID);
 const history = getHistory(historyKey);
 const answer = await askAI(text, history, event.senderID, name);
 saveHistory(historyKey, [...history, { role: "user", content: text }, { role: "assistant", content: answer }]);
 const info = await sendBotReply(message, answer); setReply(info, event, historyKey);
 },
 onChat: async function ({ api, event, message }) {
 const body = event.body?.trim(); if (!body) return;
 const lower = body.toLowerCase();
 const triggers = ["baby", "maya", "Nijhum", "bow", "noman", "kolija", "nusrat", "xan", "bbz", "sadiya", "bot"];
 const prefixes = ["baby ", "bby ", "bbe ", "babe ", "sam ", "mari ", "maria ", "hippi ", "xan ", "bbz ", "নিঝুম", "bot "];
 if (triggers.includes(lower)) {
 const name = await getName(api, event.senderID); saveUserMemory(event.senderID, name);
 const reply = getNextReply(event.threadID); const historyKey = `${event.threadID}_${event.senderID}`;
 const info = await sendBotReply(message, reply); setReply(info, event, historyKey); return;
 }
 let userMessage = null;
 for (const prefix of prefixes) { if (lower.startsWith(prefix)) { userMessage = body.slice(prefix.length).trim(); break; } }
 if (userMessage === null) return;
 // shakib prefix e thakle check korbe, na hole normal chat e dhukbe na
 if (lower.startsWith("siyam ")) {
 userMessage = body.slice(7).trim();
 if (!userMessage) userMessage = "siyam tomar ki hoy";
 }
 const name = await getName(api, event.senderID); saveUserMemory(event.senderID, name);
 if (!userMessage.length) { const reply = getNextReply(event.threadID); const historyKey = `${event.threadID}_${event.senderID}`; const info = await sendBotReply(message, reply); setReply(info, event, historyKey); return; }
 const historyKey = `${event.threadID}_${event.senderID}`;
 await typing(api, event.threadID);
 const history = getHistory(historyKey);
 const answer = await askAI(userMessage, history, event.senderID, name);
 saveHistory(historyKey, [...history, { role: "user", content: userMessage }, { role: "assistant", content: answer }]);
 const info = await sendBotReply(message, answer); setReply(info, event, historyKey);
 }
};
