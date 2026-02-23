import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import express from 'express';
import { OpenAI } from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // prevent openai from throwing error on startup if key is missing
});

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot && message.author.id !== '716390085896962058') return;
  
  if (message.author.id === '716390085896962058') {
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      if (embed.title && embed.title.toLowerCase().includes('wild pokémon')) {
        const imageUrl = embed.image?.url;
        if (imageUrl) {
          try {
            if (!process.env.OPENAI_API_KEY) {
               console.log("No OPENAI_API_KEY found, cannot identify Pokemon.");
               return;
            }
            console.log(`Found wild pokemon image: ${imageUrl}`);
            const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Identify the Pokemon in this image. Only reply with the exact name of the Pokemon in English, nothing else. Ignore any background." },
                    { type: "image_url", image_url: { url: imageUrl } }
                  ]
                }
              ],
              max_tokens: 10,
            });

            const pokemonName = response.choices[0].message.content.trim();
            if (pokemonName) {
              await message.channel.send(`It's **${pokemonName}**!`);
            }
          } catch (error) {
            console.error("Error identifying Pokemon:", error);
          }
        }
      }
    }
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN environment variable. Bot will not connect to Discord.");
} else {
  client.login(process.env.DISCORD_TOKEN).catch(console.error);
}
