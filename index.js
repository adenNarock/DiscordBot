import dotenv from 'dotenv'
import fs from "fs"
dotenv.config()

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits, EmbedBuilder} from 'discord.js';

const games = new Map();

function loadMoney() {
    return JSON.parse(fs.readFileSync("money.json", "utf8"));
}
function saveMoney(data) {
    fs.writeFileSync("money.json", JSON.stringify(data, null, 4));
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.login(process.env.DISCORD_TOKEN);
loadMoney()

client.on("messageCreate", async (message) => {
    
    console.log(message)
    if (message.author.bot) return;
    if (!["1510406268089536522", "1393468209394487346", "1446213677152997539", "1509766418051366942"].some(roleId => message.member.roles.cache.has(roleId))) return; // founder, businessmen, staff

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (command === "-setbal") {
        const money = loadMoney();

        const target = message.mentions.users.first();
        const action = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        if (!target) {
            return message.channel.send("Mention a user.");
        }

        if (!["add", "subtract", "set"].includes(action)) {
            return message.channel.send("Use add, subtract, or set.");
        }

        if (isNaN(amount)) {
            return message.channel.send("Enter a valid amount.");
        }

        if (!money[target.id]) {
            money[target.id] = 0;
        }

        switch (action) {
            case "add":
                money[target.id] += amount;
                break;

            case "subtract":
                money[target.id] -= amount;
                break;

            case "set":
                money[target.id] = amount;
                break;
        }

        saveMoney(money);
        const embed = new EmbedBuilder()
            .setTitle("Balance Change")
            .setColor(0x00BBFF)
            .setDescription(`${target.username} now has ${money[target.id]}<:coin:1486430305207324763>`)
        message.channel.send({embeds: [embed]});
    }

    if (message.content == "-cf"){
    const authorid = message.author.id;
    const btn_heads = new ButtonBuilder()
        .setCustomId('btn1')
        .setLabel('Heads')
        .setStyle(ButtonStyle.Primary);
    const btn_tails = new ButtonBuilder()
        .setCustomId('btn2')
        .setLabel('Tails')
        .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(btn_heads, btn_tails);

    const sentMessage = await message.channel.send({components: [row]});
    }
    
    if (message.content == '-cfa'){
        const num = Math.random();
        let embed = new EmbedBuilder()
            .setTitle
        if (num > 0.5){
            embed = new EmbedBuilder()
                .setTitle("Coinflip Auto")
                .setColor(0xAA00FF)
                .setDescription("Heads!")
        } else {
            embed = new EmbedBuilder()
                .setTitle("Coinflip Auto")
                .setColor(0xAA00FF)
                .setDescription("Tails!")
        }

        message.channel.send({embeds: [embed]});
    }

    if (message.content.startsWith("-bal")) {

        const money = loadMoney();
        const user = message.mentions.users.first() || message.author;
        const balance = money[user.id] ?? 0;
        const embed = new EmbedBuilder()
            .setTitle("<:coin:1486430305207324763> Balance")
            .setColor(0x00BBFF)
            .setDescription(`<@${user.id}> has ${balance}<:coin:1486430305207324763>`)

    return message.channel.send({embeds: [embed]});
}

    if (message.content == '-dice'){
        const btn_p1 = new ButtonBuilder()
            .setCustomId('Player1')
            .setLabel('P1 Join')
            .setStyle(ButtonStyle.Primary);
        const btn_p2 = new ButtonBuilder()
            .setCustomId('Player2')
            .setLabel('P2 Join')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(btn_p1, btn_p2);

        const gameMessage = await message.channel.send({
            content: "Waiting for both buttons...",
            components: [row]
        });
        games.set(gameMessage.id, {
            player1: "",
            player2: ""
        });
    }

});

client.on('interactionCreate', async(interaction) => {
    if (interaction.customId === 'btn1' || interaction.customId === 'btn2'){
        const num = Math.random();
        let hort = "Heads"
        if (num <= 0.5){
            hort = "Tails"
        }
        const money = loadMoney();
        const authorid = interaction.user.id;
        let win = false
        //heads > 0.5  tails < 0.5
        if (interaction.customId === 'btn1'){
            if (num > 0.5){
                win = true;
            } else {
                win = false;
            }
        } else if (interaction.customId === 'btn2'){
            if (num <= 0.5) {
                win = true;
            } else {
                win = false;
            }
        }

        if (win === true){
            if (money[authorid]){
                money[authorid] += 1;
            } else {
                money[authorid] = 1;
            }
        } else {
            if (money[authorid]){
                money[authorid] -= 1;
            } else {
                money[authorid] = -1;
            }
        }

        saveMoney(money);

        const balance = money[authorid];

        const embed = new EmbedBuilder()
            .setTitle(win ? "<:coin:1486430305207324763> Flip Win!" : "<:coin:1486430305207324763> Flip Loss")
            .setColor(win ? 0x00FF00 : 0xFF0000)
            .addFields(
                { name: "Result", value: hort, inline: true },
                { name: "Balance", value: balance.toString(), inline: true }
            )

        await interaction.update({
            embeds: [embed],
            components: []
        });  
    }

    if (interaction.customId === "Player1" || interaction.customId === "Player2") {

        const game = games.get(interaction.message.id);
        const money = loadMoney();

        if (!game) return;

        // Save the player's ID
        if (interaction.customId === "Player1") {

            if (game.player1) {
                return interaction.reply({
                    content: "Player 1 has already joined.",
                    ephemeral: true
                });
            }

            game.player1 = interaction.user.id;
        }

        if (interaction.customId === "Player2") {

            if (game.player2) {
                return interaction.reply({
                    content: "Player 2 has already joined.",
                    ephemeral: true
                });
            }

            if (interaction.user.id === game.player1) {
                return interaction.reply({
                    content: "You can't join as both players.",
                    ephemeral: true
                });
            }

            game.player2 = interaction.user.id;
        }

        // Both players joined
        if (game.player1 && game.player2) {

        games.delete(interaction.message.id);

        const rolls = Array.from(
            { length: 4 },
            () => Math.floor(Math.random() * 6) + 1
        );

        const total1 = rolls[0] + rolls[1];
        const total2 = rolls[2] + rolls[3];

        let winner;
        let loser;
        let tie = false;

        if (total1 > total2) {
            winner = game.player1;
            loser = game.player2;
        } else if (total2 > total1) {
            winner = game.player2;
            loser = game.player1;
        } else {
            tie = true;
        }

        const money = loadMoney();

        if (!tie) {
            money[winner] = (money[winner] ?? 0) + 1;
            money[loser] = (money[loser] ?? 0) - 1;
            saveMoney(money);
        }

        const embed = new EmbedBuilder()
            .setTitle("🎲 Dice Duel")
            .setColor(tie ? 0xFFFF00 : 0x00BBFF)
            .addFields(
                {
                    name: "Player 1",
                    value: `<@${game.player1}>`,
                    inline: true
                },
                {
                    name: "Player 2",
                    value: `<@${game.player2}>`,
                    inline: true
                },
                {
                    name: "Rolls",
                    value:
                        `<@${game.player1}>: ${rolls[0]},${rolls[1]} = ${total1}\n` +
                        `<@${game.player2}>: ${rolls[2]},${rolls[3]} = ${total2}`
                },
                {
                    name: "Result",
                    value: tie
                        ? "🤝 Tie!"
                        : `🏆 <@${winner}> wins (+1<:coin:1486430305207324763>)`
                }
            )

        await interaction.update({
            embeds: [embed],
            components: []
        });

        return;
    }

        // Rebuild buttons, only showing empty slots
        const row = new ActionRowBuilder();

        if (!game.player1) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("Player1")
                    .setLabel("P1 Join")
                    .setStyle(ButtonStyle.Primary)
            );
        }

        if (!game.player2) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("Player2")
                    .setLabel("P2 Join")
                    .setStyle(ButtonStyle.Primary)
            );
        }

        await interaction.update({
            content: "Waiting for both players...",
            components: [row]
        });
        return;
    }
})