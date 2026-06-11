import dotenv from 'dotenv'
import fs from "fs"
dotenv.config()

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, GatewayIntentBits } from 'discord.js';

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
    if (!message.member.roles.cache.has("1510406268089536522")) return; // businessmen

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
        if (num > 0.5){
            message.channel.send("Heads!")
        } else {
            message.channel.send("Tails!")
        }
    }

    if (message.content == '-bal'){
        const money = loadMoney();
        const authorid = message.author.id;
        const balance = money[authorid]
        message.channel.send(`<@${authorid}>` + " has " + balance.toString() + " points!")
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

    if (message.content == '-new'){
        message.channel.send("newest update real time")
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
            await interaction.update({
                content: "Win! Landed " + hort,
                components: []
            });
        } else {
            if (money[authorid]){
                money[authorid] -= 1;
            } else {
                money[authorid] = -1;
            }
            await interaction.update({
                content: "Lose :c Landed " + hort,
                components: []
            });
        }
        saveMoney(money);
        return;
    }

    if (interaction.customId === "Player1" || interaction.customId === "Player2") {

        const game = games.get(interaction.message.id);

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
            const result = {total1, total2};
            let winner
            let loser
            if (total1 > total2) {
                winner = game.player1;
                loser = game.player2;
            } else if (total2 > total1) {
                winner = game.player2;
                loser = game.player1;
            } else {
                winner = "1510311624047726674"; //bot user id
            }
            await interaction.update({
                content:
                    `Both players joined!\n<@${game.player1}> vs <@${game.player2}>` +
                    `\n${rolls.join(", ")}` + `\n${total1 + " vs " + total2}` + `\n<@${winner}>` + " wins",
                components: []
            });
            const money = loadMoney()
            money[winner] += 1;
            money[loser] -= 1;
            saveMoney(money)
            return; // IMPORTANT
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