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

function cardName(card) {
    if (card === 1) return "A";
    if (card === 11) return "J";
    if (card === 12) return "Q";
    if (card === 13) return "K";
    return card.toString();
}

function handValue(cards) {

    let total = 0;
    let aces = 0;

    for (const card of cards) {

        if (card === 1) {
            total += 11;
            aces++;
        }
        else if (card >= 11) {
            total += 10;
        }
        else {
            total += card;
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

function isBlackjack(cards) {
    return cards.length === 2 && handValue(cards) === 21;
}

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

        if (money[target.id] === undefined) {
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

    if (command === "-roll") {

    const numDice = parseInt(args[0]);
    let rolls = [];

    if (args.length === 0) {

        const num = Math.floor(Math.random() * 6) + 1;
        rolls = [num];

    } else if (isNaN(numDice)) {

        return message.channel.send("Enter a valid number");

    } else {

        rolls = Array.from(
            { length: numDice },
            () => Math.floor(Math.random() * 6) + 1
        );

    }
    
    const user = message.author;

        const embed = new EmbedBuilder()
            .setTitle("🎲 Dice Roll")
            .setColor(0xAA00FF)
            .setDescription(`${user} rolled 🎲 **${rolls.join(", ")}**`)

        return message.channel.send({ embeds: [embed] });
    }

    if (message.content == "-cf"){
    const authorid = message.author.id;
    const btn_heads = new ButtonBuilder()
        .setCustomId('btn1')
        .setLabel('Heads')
        .setStyle(ButtonStyle.Secondary);
    const btn_tails = new ButtonBuilder()
        .setCustomId('btn2')
        .setLabel('Tails')
        .setStyle(ButtonStyle.Secondary);
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

    if (command === '-dice'){
        const amount = args[0]
        if (amount === undefined || isNaN(amount) || amount < 0){
            return message.channel.send("Enter a valid amount")
        }
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
            player2: "",
            cost: amount
        });
    }

    if (command === "-bj") {

        const betAmount = parseInt(args[0]);
        const user = message.author;
        const money = loadMoney();
        const existingGame = [...games.values()].find(g => g.playerId === user.id);
            if (existingGame) {
                return message.channel.send(
                    "Finish your current blackjack game first."
                );
            }

        const cards = Array.from(
            { length: 42 },
            () => Math.floor(Math.random() * 13) + 1
        );


        if (money[user.id] === undefined || money[user.id] < betAmount || !betAmount || isNaN(betAmount) || betAmount <= 0) {
            return message.channel.send("Enter a valid amount");
        }

        const playerCards = [cards[0], cards[1]];
        const dealerCards = [cards[2], cards[3]];
        const playerBlackjack = isBlackjack(playerCards);
        const dealerBlackjack = isBlackjack(dealerCards);

        if (playerBlackjack || dealerBlackjack) {
            let result;
            let color;

            if (playerBlackjack && dealerBlackjack) {
                result = "🤝 Both have Blackjack!";
                color = 0xFFFF00;
            }
            else if (playerBlackjack) {
                result = "🃏 BLACKJACK!";
                color = 0xFFD700;
                money[user.id] += Math.round(1.5 * betAmount);
            }
            else {
                result = "💀 Dealer Blackjack!";
                color = 0xFF0000;
                money[user.id] -= betAmount;
            }
            const balance = money[user.id];
            const embed = new EmbedBuilder()
                .setTitle(result)
                .setColor(color)
                .addFields(
                    {
                        name: `Your Hand (${handValue(playerCards)})`,
                        value: playerCards.map(cardName).join(", ")
                    },
                    {
                        name: `Dealer (${handValue(dealerCards)})`,
                        value: dealerCards.map(cardName).join(", ")
                    },
                    {
                        name: "Balance",
                        value: `${balance}<:coin:1486430305207324763>`
                    }
                );
            saveMoney(money);
            return message.channel.send({embeds: [embed]});
        }
        
        const hit = new ButtonBuilder()
            .setCustomId("btnHit")
            .setLabel("Hit")
            .setStyle(ButtonStyle.Success);

        const stand = new ButtonBuilder()
            .setCustomId("btnStand")
            .setLabel("Stand")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(hit, stand);

        const embed = new EmbedBuilder()
            .setTitle("🃏 Blackjack")
            .setColor(0x00AAFF)
            .addFields(
                {
                    name: `Your Hand (${handValue(playerCards)})`,
                    value: playerCards.map(cardName).join(", "),
                    inline: false
                },
                {
                    name: `Dealer (${handValue([dealerCards[0]])})`,
                    value: `${cardName(dealerCards[0])}, ?`,
                    inline: false
                }
            );

        const gameMessage = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        games.set(gameMessage.id, {
            playerId: user.id,
            bet: betAmount,
            playerCards,
            dealerCards,
            deck: cards,
            nextCard: 4
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
                { name: "Balance", value: balance.toString() + "<:coin:1486430305207324763>", inline: true }
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
        if (money[interaction.user.id] < game.cost){
            return interaction.reply({
                content: "Not enough <:coin:1486430305207324763> for this duel",
                ephemeral: true
            });
        }
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
            money[winner] = (money[winner] ?? 0) + game.cost;
            money[loser] = (money[loser] ?? 0) - game.cost;
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
                        : `🏆 <@${winner}> wins (+` + game.cost + ` <:coin:1486430305207324763>)`
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

    if (interaction.customId === "btnHit" || interaction.customId === "btnStand"){
        if (interaction.customId === "btnHit") {

            const game = games.get(interaction.message.id);

            if (!game) {
                return interaction.reply({
                    content: "Game not found.",
                    ephemeral: true
                });
            }

            if (interaction.user.id !== game.playerId) {
                return interaction.reply({
                    content: "This isn't your game.",
                    ephemeral: true
                });
            }

            const newCard = game.deck[game.nextCard];
            game.nextCard++;

            game.playerCards.push(newCard);

            const playerTotal = handValue(game.playerCards);

            if (playerTotal > 21) {

                const money = loadMoney();
                money[game.playerId] -= game.bet;
                saveMoney(money);

                games.delete(interaction.message.id);
                const balance = money[game.playerId];
                const embed = new EmbedBuilder()
                    .setTitle("💥 Bust")
                    .setColor(0xFF0000)
                    .addFields(
                        {
                            name: `Your Hand (${playerTotal})`,
                            value: game.playerCards.map(cardName).join(", ")
                        },
                        {
                            name: `Dealer (${handValue(game.dealerCards)})`,
                            value: game.dealerCards.map(cardName).join(", ")
                        },
                        {
                            name: "Balance",
                            value: `${balance}<:coin:1486430305207324763>`
                        }
                    );

                return interaction.update({
                    embeds: [embed],
                    components: []
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("🃏 Blackjack")
                .setColor(0x00AAFF)
                .addFields(
                    {
                        name: `Your Hand (${playerTotal})`,
                        value: game.playerCards.map(cardName).join(", ")
                    },
                    {
                        name: "Dealer",
                        value: `${cardName(game.dealerCards[0])}, ?`
                    },
                );

            games.set(interaction.message.id, game);

            return interaction.update({
                embeds: [embed],
                components: interaction.message.components
            });
        }
        if (interaction.customId === "btnStand") {

            const game = games.get(interaction.message.id);

            if (!game) {
                return;
            }

            if (interaction.user.id !== game.playerId) {
                return interaction.reply({
                    content: "This isn't your game.",
                    ephemeral: true
                });
            }

            while (handValue(game.dealerCards) < 17) {

                game.dealerCards.push(
                    game.deck[game.nextCard]
                );

                game.nextCard++;
            }

            const playerTotal = handValue(game.playerCards);
            const dealerTotal = handValue(game.dealerCards);

            let result;
            let color;
            const money = loadMoney();
            if (dealerTotal > 21) {

                result = "Dealer Busts! You Win!";
                color = 0x00FF00;
                money[game.playerId] += game.bet;

            } else if (playerTotal > dealerTotal) {

                result = "You Win!";
                color = 0x00FF00;
                money[game.playerId] += game.bet;

            } else if (dealerTotal > playerTotal) {

                result = "You Lose";
                color = 0xFF0000;
                money[game.playerId] -= game.bet;
            } else {

                result = "Push (Tie)";
                color = 0xFFFF00;
            }

            saveMoney(money);
            const balance = money[game.playerId];

            const embed = new EmbedBuilder()
                .setTitle("🃏 Blackjack Final")
                .setColor(color)
                .addFields(
                    {
                        name: `Your Hand (${playerTotal})`,
                        value: game.playerCards.map(cardName).join(", ")
                    },
                    {
                        name: `Dealer (${dealerTotal})`,
                        value: game.dealerCards.map(cardName).join(", ")
                    },
                    {
                        name: "Result",
                        value: result
                    },
                    {
                        name: "Balance",
                        value: `${balance}<:coin:1486430305207324763>`
                    }
                );

            games.delete(interaction.message.id);

            return interaction.update({
                embeds: [embed],
                components: []
            });
        }
    }
})