const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const MiniSearch = require("minisearch");
const faq = require("./snapshot-faq.json");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config({ path: `.env.local`, override: true });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let miniSearch = new MiniSearch({
  fields: ["question"],
  storeFields: ["question", "answer"],
  searchOptions: {
    fuzzy: 0.1,
  },
});
miniSearch.addAll(faq.data);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userInput = message.content;
  console.log("userInput:", userInput);

  let bestMatchingFaq = miniSearch
    .search(userInput)
    .slice(0, 6)
    .map((x) => {
      return `Q: ${x.question} \n A: ${x.answer}`;
    });

  try {
    const chatResponseUserAnswer = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful FAQ bot for the Snapshot (decentralized governance) support channel. You should only reply to questions (not statements) and can only respond in two ways, 1. answer questions you find in the FAQ or 2. answer 'I don't know that'. Under no circumstances should you response with your own made up answers. Here are Snapshot FAQ: ${bestMatchingFaq}`,
        },
        {
          role: "user",
          content: `${userInput}`,
        },
      ],
    });

    const responseMessage =
      chatResponseUserAnswer.data.choices[0].message.content;

    if (responseMessage.includes("I don't know that")) {
      const fileArray = JSON.parse(
        fs.readFileSync("snapshot-faq-unknown.json")
      );

      if (!fileArray.map((el) => el.content).includes(userInput)) {
        fileArray.push({ count: 0, content: userInput });
      } else {
        const index = fileArray.map((el) => el.content).indexOf(userInput);
        fileArray[index].count += 1;
      }

      const uniqueFileArray = [...new Set(fileArray)];

      fs.writeFileSync(
        "snapshot-faq-unknown.json",
        JSON.stringify(uniqueFileArray, null, 2),
        function (err) {
          if (err) throw err;
          console.log("Saved!");
        }
      );
    }

    message.reply(responseMessage);
  } catch (error) {
    console.log(error);
  }
});

client.login(process.env.DISCORD_BOT_KEY);
