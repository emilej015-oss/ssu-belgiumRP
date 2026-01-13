const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  Routes
} = require("discord.js");
const { REST } = require("@discordjs/rest");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const PREFIX = ".";
const PING_ROLE_ID = "1377958768830316566";

let activePoll = null;
let activeSSUMessage = null;
let activeSSDMessage = null;

client.once("ready", async () => {
  console.log(`Bot online als ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("poll")
      .setDescription("Start SSU poll")
      .addIntegerOption(o =>
        o.setName("aantal")
         .setDescription("Aantal stemmen nodig")
         .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("ssu")
      .setDescription("Server Start Up"),
    new SlashCommandBuilder()
      .setName("ssd")
      .setDescription("Server Shutdown")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
});

async function sendSSU(channel) {
  if (activeSSUMessage) {
    try { await activeSSUMessage.delete(); } catch {}
  }
  if (activeSSDMessage) {
    try { await activeSSDMessage.delete(); activeSSDMessage = null; } catch {}
  }

  const embed = new EmbedBuilder()
    .setTitle("🚨 SSU | Server Start Up 🚨")
    .setDescription(
      "De server is nu officieel geopend.\n" +
      "Join de server en bereid je beste roleplay voor.\n" +
      "Volg de regels en maak er samen een leuke RP van.\n" +
      "Veel plezier!"
    )
    .setImage("https://cdn.discordapp.com/attachments/1324726706300522599/1456407420984361082/image.png")
    .setColor(0x00ff00)
    .setTimestamp();

  activeSSUMessage = await channel.send({
    content: `<@&${PING_ROLE_ID}>`,
    embeds: [embed]
  });
}

async function sendSSD(channel) {
  if (activeSSUMessage) {
    try { await activeSSUMessage.delete(); activeSSUMessage = null; } catch {}
  }

  const embed = new EmbedBuilder()
    .setTitle("🏕️ BELGIUM ROLEPLAY 🌃")
    .setDescription(
      "🛣️ **SERVER SHUTDOWN** 🏙️\n" +
      "🚨 ➨\n\n" +
      "**BESTE, DE SERVER IS NU GESLOTEN.**\n" +
      "Er zal momenteel geen staff beschikbaar zijn in-game.\n" +
      "Bedankt voor het roleplayen."
    )
    .setImage("https://cdn.discordapp.com/attachments/1324726706300522599/1458907477469827206/image_kopie.jpg")
    .setColor(0xff0000)
    .setTimestamp();

  activeSSDMessage = await channel.send({
    content: `<@&${PING_ROLE_ID}>`,
    embeds: [embed]
  });
}

async function sendPoll(channel, needed) {
  if (activeSSDMessage) {
    try { await activeSSDMessage.delete(); activeSSDMessage = null; } catch {}
  }

  const embed = new EmbedBuilder()
    .setTitle("📊 SSU POLL | BELGIUM ROLEPLAY 📊")
    .setDescription(
      `SSU?\n\nBIJ **${needed}x ✅** GAAT DE SERVER OPEN.\n\n✅ = JA\n❌ = NEE`
    )
    .setColor(0x3498db);

  const pollMsg = await channel.send({
    content: `<@&${PING_ROLE_ID}>`,
    embeds: [embed]
  });

  await pollMsg.react("✅");
  await pollMsg.react("❌");

  activePoll = {
    messageId: pollMsg.id,
    needed
  };
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(1).split(" ");
  const cmd = args.shift().toLowerCase();

  if (cmd === "poll") {
    await sendPoll(message.channel, parseInt(args[0]));
    await message.delete();
  }

  if (cmd === "ssu") {
    await sendSSU(message.channel);
    await message.delete();
  }

  if (cmd === "ssd") {
    await sendSSD(message.channel);
    await message.delete();
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "poll") {
    await sendPoll(interaction.channel, interaction.options.getInteger("aantal"));
    await interaction.reply({ content: "Poll gestart", ephemeral: true });
  }

  if (interaction.commandName === "ssu") {
    await sendSSU(interaction.channel);
    await interaction.reply({ content: "SSU verzonden", ephemeral: true });
  }

  if (interaction.commandName === "ssd") {
    await sendSSD(interaction.channel);
    await interaction.reply({ content: "SSD verzonden", ephemeral: true });
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (!activePoll) return;
  if (reaction.message.id !== activePoll.messageId) return;
  if (reaction.emoji.name !== "✅") return;

  const votes = reaction.count - 1;
  if (votes >= activePoll.needed) {
    try { await reaction.message.delete(); } catch {}
    activePoll = null;
    await sendSSU(reaction.message.channel);
  }
});

client.login(process.env.TOKEN);
