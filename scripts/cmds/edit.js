const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.0.0",
  hasPermission: 0,
  credits: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰",
  description: "AI image editor",
  commandCategory: "image",
  usages: "[reply to image] <prompt>",
  cooldowns: 10
};

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // Im
  let imageUrl = null;

  if (
    messageReply &&
    messageReply.attachments &&
    messageReply.attachments.length > 0
  ) {
    const attachment = messageReply.attachments.find(
      item => item.type === "photo" || item.type === "image"
    );

    if (attachment) {
      imageUrl = attachment.url || attachment.image_data?.url;
    }
  }

  if (!imageUrl && event.attachments && event.attachments.length > 0) {
    const attachment = event.attachments.find(
      item => item.type === "photo" || item.type === "image"
    );

    if (attachment) {
      imageUrl = attachment.url || attachment.image_data?.url;
    }
  }

  if (!imageUrl) {
    return api.sendMessage(
      "» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑\n" +
      "───────────────\n" +
      "» ❌ একটি ছবির মেসেজে reply করে command দিন।\n" +
      "» 📝 উদাহরণ:\n" +
      "» !edit make the background beautiful\n" +
      "───────────────\n" +
      "» 🧚‍♀️𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧",
      threadID,
      messageID
    );
  }

  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage(
      "» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑\n" +
      "───────────────\n" +
      "» ❌ Prompt দিন।\n" +
      "» 📝 উদাহরণ:\n" +
      "» !edit make the sky sunset\n" +
      "───────────────\n" +
      "» 🧚‍♀️𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const inputPath = path.join(cacheDir, `imgedit_input_${Date.now()}.jpg`);
  const outputPath = path.join(cacheDir, `imgedit_output_${Date.now()}.jpg`);
  let waitMsg;

  try {
    waitMsg = await api.sendMessage(
      "» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑\n" +
      "───────────────\n" +
      "» ⏳ please wait bara...\n" +
      "───────────────\n" +
      "» 🧚‍♀️𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧",
      threadID,
      messageID
    );

    // Or
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    await fs.writeFile(inputPath, imageResponse.data);
    const form = new FormData();

    form.append("image", fs.createReadStream(inputPath), {
      filename: "image.jpg",
      contentType: "image/jpeg"
    });

    form.append("prompt", prompt);
    form.append("resolution", "2K");
    form.append("ratio", "match_input_image");

    // তোমার API
    const apiResponse = await axios.post(
      "https://xrahat-image-edit.vercel.app/api/edit",
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const data = apiResponse.data || {};

    if (!data.success || !data.imageUrl) {
      throw new Error(data.error || "Image generation failed");
    }

    // Generated image download
    const outputResponse = await axios.get(data.imageUrl, {
      responseType: "arraybuffer",
      timeout: 60000
    });

    await fs.writeFile(outputPath, outputResponse.data);

    // Wait message ডিলিট করে দেওয়া (যদি থেকে থাকে)
    if (waitMsg && waitMsg.messageID) {
      api.unsendMessage(waitMsg.messageID);
    }

    // Messenger এ image পাঠানো with your custom design
    return api.sendMessage(
      {
        body:
          "» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑\n" +
          "───────────────\n" +
          `» ✅ Image Edit Complete!\n` +
          `» 📝 Prompt: ${prompt}\n` +
          "───────────────\n" +
          "» 🧚‍♀️𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧",
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      messageID
    );

  } catch (error) {
    console.error("imgedit error:", error);

    if (waitMsg && waitMsg.messageID) {
      api.unsendMessage(waitMsg.messageID);
    }

    let errorMessage = "❌ Image edit failed.";

    if (error.response?.data?.error) {
      errorMessage += `\n\n${error.response.data.error}`;
    } else if (error.message) {
      errorMessage += `\n\n${error.message}`;
    }

    return api.sendMessage(
      "» 👑 𝐒𝐈𝐘𝐀𝐌-𝐇𝐀𝐒𝐀𝐍 👑\n" +
      "───────────────\n" +
      `» ${errorMessage}\n` +
      "───────────────\n" +
      "» 🧚‍♀️𝗡𝗜𝗝𝗛𝗨𝗠 𝗖𝗛𝗔𝗧𝗕𝗢𝗧",
      threadID,
      messageID
    );

  } finally {
    // Temporary files cleanup
    setTimeout(async () => {
      try {
        if (await fs.pathExists(inputPath)) {
          await fs.remove(inputPath);
        }

        if (await fs.pathExists(outputPath)) {
          await fs.remove(outputPath);
        }
      } catch (e) {
        console.error("Cleanup error:", e.message);
      }
    }, 5000);
  }
};
