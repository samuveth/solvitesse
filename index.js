const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userInput = message.content;
  console.log("🚀 ~ file: index.js:19 ~ client.on ~ userInput:", userInput);

  const chatResponseSearchText = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are analyzing text of support requests for the user. You always give the shortest answer possible. You don't say things like 'yes sure' or 'no problem' cut straight to the point.",
      },
      {
        role: "user",
        content:
          "From the following text pull out 2-5 key parts that are the most important to what the user is looking to get an answer for, each part can be 1-3 words long, separate each part by a comma:" +
          userInput,
      },
    ],
  });

  const searchText =
    chatResponseSearchText.data.choices[0].message.content || "";
  console.log("🚀 ~ file: index.js:39 ~ client.on ~ searchText:", searchText);

  const searchTextArray = searchText.split(",");

  let lastMessage = null;

  while (true) {
    const options = { limit: 10 };
    if (lastMessage) {
      options.before = lastMessage.id;
    }

    const messages = await message.channel.messages.fetch(options);
    lastMessage = messages.last();

    // Add matched messages to the search results
    const matchedMessages = messages
      .filter((m) =>
        searchTextArray.some((searchText) => m.content.includes(searchText))
      )
      .map((m) => m.content);
    console.log(
      "🚀 ~ file: index.js:47 ~ client.on ~ matchedMessages:",
      matchedMessages
    );

    let searchResults = [];
    searchResults = searchResults.concat(matchedMessages);
    searchResults = [...new Set(searchResults)];

    if (searchResults.length > 0) {
      // No more messages available, search complete
      break;
    }
  }

  //   const chatResponseUserAnswer = await openai.createChatCompletion({
  //     model: "gpt-3.5-turbo",
  //     messages: [
  //       { role: "system", content: "You are a helpful assistant." },
  //       { role: "user", content: userInput },
  //     ],
  //   });

  //   const responseMessage =
  //     chatResponseUserAnswer.data.choices[0].message.content;
  //   console.log(
  //     "🚀 ~ file: index.js:38 ~ client.on ~ responseMessage:",
  //     responseMessage
  //   );
  //   message.reply(responseMessage || "nothing");
});

client.login(
  "MTA4NTg4NjEwODA5ODg4NzY4Mg.GptCCa.KtgqspulFZgGLlKO_Mvy9XYV3sC6WO0lm3tFbw"
);
