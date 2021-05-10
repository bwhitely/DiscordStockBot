const Discord = require('discord.js');
const client = new Discord.Client();
const https = require('https');
const { map } = require('jquery');
const fetch = require("node-fetch");
const puppeteer = require('puppeteer');
var userMap;
var general;
var stonks;


// BOT on ready
client.on('ready',
    () => {
        // List servers the bot is connected to
        console.log("Servers:");
        client.guilds.cache.forEach((guild) => {
            console.log(" - " + guild.name);

            // List all channels with IDs
            guild.channels.cache.forEach((channel) => {
                console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`);
            });
        });

        // set General channel to general
        general = client.channels.cache.get("416728981132541954");
        // set stonks channel to stonks-bot-test
        stonks = client.channels.cache.get("841200240077439017");

        // send message to General channel
        general.send("Type !play to register yourself and begin playing with $50,000 USD, or type !help for a list of my commands.");

        // Setting bots activity
        client.user.setPresence({ activity: { name: '$$$' }, status: 'online' })
            .then(console.log)
            .catch(console.error);

        // Map for user data
        userMap = new Map();
    });

// RESPOND to message
client.on('message',
    (receivedMessage) => {
        // Prevent bot from responding to its own messages
        if (receivedMessage.author === client.user) {
            return;
        }

        // If tagged
        if (receivedMessage.content.includes(client.user.toString())) {
            receivedMessage.channel.send("Message received from " +
                receivedMessage.author.toString() +
                ": " +
                receivedMessage.content);
        }
        // Is a command
        if (receivedMessage.content.startsWith("!")) {
            processCommand(receivedMessage);
        }
    });

// Process a command (i.e. a message starting with "!")
function processCommand(receivedMessage) {
    const command = receivedMessage.content.substr(1); // Remove leading exclamation mark
    const splitCommand = command.split(" "); // Split message up in to pieces for each space in message
    const primaryCommand = splitCommand[0]; // The first word in the message (after leading exclamation)
    const arguments = splitCommand.splice(1); // All other words are arguments/parameters/options for the command

    console.log("Command received: " + command);
    console.log("Arguments: " + arguments);

    // Commands
    switch (primaryCommand) {
        case "help":
            helpCommand(arguments, receivedMessage);
            break;
        case "play":
            addUser(receivedMessage.author, receivedMessage);
            break;
        case "me":
            getUser(receivedMessage.author, receivedMessage);
            break;
        case "stock":
            stockCommand(arguments, receivedMessage);
            break;
        case "chart":
            chartCommand(arguments, receivedMessage);
            break;
        case "buy":
            buyCommand(arguments, receivedMessage, receivedMessage.author);
            break;
        case "sell":
            sellCommand(arguments, receivedMessage, receivedMessage.author);
            break;
        case "money":
            giveMoney(receivedMessage.author);
            break;
        case "leaderboard":
            leaderboard(receivedMessage);
            break;
        case "sourcecode":
            sourcecode(receivedMessage);
            break;
        default:
            receivedMessage.channel.send("Not a command, try again, or type !help");
    }
};

// Current price command
function stockCommand(arguments, receivedMessage) {

    if (arguments.length == 1 || arguments[1] == "details") {
        var ticker = arguments[0];
        // IEX GET call
        https.get('https://cloud.iexapis.com/stable/stock/' + ticker + '/quote?token=pk_dbe7d8fdde6744a6bed42869ba27f111 ', (resp) => {

            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });

            /**
             * useful JSON data
             * .previousClose, .changePercent, .peRatio, .week52High, .week52Low, .ytdChange, .marketCap,
             */
            resp.on('end', () => {
                var currPrice = JSON.parse(data).latestPrice;
                var change = JSON.parse(data).changePercent;
                var yearHigh = JSON.parse(data).week52High;
                var yearLow = JSON.parse(data).week52Low;
                var ytdChange = JSON.parse(data).ytdChange;
                var mktCap = JSON.parse(data).marketCap;
                var peRatio = JSON.parse(data).peRatio;

                if (arguments.length == 1) {
                    // Format colour of % change based on negative/positive growth
                    if (change < 0) {
                        // Send stock price
                        receivedMessage.channel.send("```diff\n" + "Ticker: " + ticker + "\n" + "Current Price: $" + currPrice + "\n" + "-% change: " + change
                            + "%\n```");
                    } else if (change >= 0) {
                        // Send stock price
                        receivedMessage.channel.send("```diff\n" + "Ticker: " + ticker + "\n" + "Current Price: $" + currPrice + "\n" + "+% change: +" + change
                            + "%\n```");
                    }

                } else if (arguments[1] == "details") {
                    receivedMessage.channel.send("`Ticker:` " + ticker + "\n" + "`Current Price:` $" + currPrice + "\n" + "`% change:` " + change + "%\n" +
                        "`Year High / Low:` $" + yearHigh + " / $" + yearLow + "\n" + "`YTD change:` " + ytdChange + "%\n" + "`Market cap:` $" + mktCap + "\n" +
                        "`PE ratio:` " + peRatio);
                }
            })
        }).on("error", (err) => {
            console.log("error: " + err.message);
        })

        // Stock details
    } else if (arguments.length == 2 && arguments[1] == ("details")) {
        receivedMessage.channel.send(arguments[1] + "`current price: `" + JSON.parse(data).latestPrice + " " + JSON.parse(data).changePercent);

    } else {
        receivedMessage.channel.send("`It looks like you didn't include the ticker and/or the keyword 'details'. Try again.`");
    }
};

// Chart command
async function chartCommand(arguments, receivedMessage) {
    receivedMessage.channel.send("```diff\n+ ...Loading... +\n```");
    // Launch browser
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    // URL
    await page.goto("https://www.google.com/search?q=$" + arguments);

    // Screenshot
    let screenshot = await page.screenshot();

    await browser.close();

    receivedMessage.channel.send("```fix\n1-Day History for: " + arguments + "\n```", { files: [screenshot] });
}

// !buy
// arguments[0] = ticker, [1] = amount, [2] (if exists) = leverage
async function buyCommand(arguments, receivedMessage, author) {

    // Check if user exists before executing command
    if (userMap.has(author)) {
        try {
            receivedMessage.channel.send("Buying " + arguments[1] + " of " + arguments[0] +
                ".\n```diff\n- Please wait for 'Purchase Complete'!\n```");
            // remove the 'x' in 'x5' for example
            arguments[1] = arguments[1].substr(1);

            var stocks = userMap.get(author);

            // GET price of stock
            const currPrice = await getStockPrice(arguments[0])
                .then(response => {
                    return response;
                });

            let totalCost = currPrice * arguments[1];

            // Update cash reserve
            receivedMessage.channel.send("```\nTotal cost of purchase: $" + totalCost.toFixed(2) + "\n```");
            receivedMessage.channel.send("```\nBalance before: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");

            stocks.cash = stocks.cash - totalCost;

            receivedMessage.channel.send("```\nBalance after: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");

            // Push stock ticker + amount to user arrays
            // Stock not already in portfolio
            if (!stocks.stocks.includes(arguments[0])) {
                stocks.stocks.push(arguments[0]);
                stocks.amount.push(arguments[1]);

                // Stock already in portfolio, increment
            } else {
                var i = stocks.stocks.indexOf(arguments[0]);
                var initial = parseInt(stocks.amount[i]);
                var additional = parseInt(arguments[1]);
                stocks.amount[i] = initial + additional;
            }

            receivedMessage.channel.send("```fix\nPurchase complete.\n```");

        } catch (err) {
            console.log(err);
            receivedMessage.channel.send("That stock does not exist");
        }
    } else {
        receivedMessage.channel.send("You have not registered yet. Type !play");
    }
}


// !sell
// arguments[0] = ticker, [1] = amount
async function sellCommand(arguments, receivedMessage, author) {

    // Check if user exists before executing command
    if (userMap.has(author)) {
        try {
            receivedMessage.channel.send("Selling " + arguments[1] + " of " + arguments[0] +
                ".\n```diff\n- Please wait for 'Sale Complete'!\n```");
            // remove the 'x' in 'x5' for example
            arguments[1] = arguments[1].substr(1);

            var stocks = userMap.get(author);

            if (stocks.stocks.includes(arguments[0])) {

                // GET call to get price of stock.
                const currPrice = await getStockPrice(arguments[0])
                    .then(response => {
                        return response;
                    });

                // get index of stock
                let i = stocks.stocks.indexOf(arguments[0]);
                let sellableUnits;

                // Validate unit amount passed as argument
                if (parseInt(stocks.amount[i]) < parseInt(arguments[1])) {
                    console.log(stocks.amount[i]);
                    receivedMessage.channel.send("Trying to sell more units than you have, selling max amount instead");
                    sellableUnits = stocks.amount[i];
                } else {
                    sellableUnits = arguments[1];
                }

                let totalCost = parseFloat(currPrice) * sellableUnits;
                receivedMessage.channel.send("```\nSale amount: $" + totalCost.toFixed(2) + "\n```");

                // Update cash reserve
                receivedMessage.channel.send("```\nBalance before: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");
                // Update cash
                stocks.cash = stocks.cash + totalCost;
                // Show balance
                receivedMessage.channel.send("```\nBalance after: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");

                // Find stock and alter amount
                stocks.amount[i] -= sellableUnits;

                if (stocks.amount[i] == 0) {
                    stocks.stocks.splice(i, 1);
                    stocks.amount.splice(i, 1);
                }

                receivedMessage.channel.send("```fix\nSale complete.\n```");

            } else {
                receivedMessage.channel.send("No such stock exists in your portfolio.")
            }

        } catch (err) {
            console.log(err);
            receivedMessage.channel.send("That stock does not exist");
        }
    } else {
        receivedMessage.channel.send("You have not registered yet. Type !play");
    }
}

// Give money to user
function giveMoney(author) {
    let portfolio = userMap.get(author);
    console.log(portfolio.cash);
    portfolio.cash = parseFloat(portfolio.cash) + 25000;
    console.log(portfolio.cash);
}

// !play command
function addUser(author, receivedMessage) {

    // Fresh portfolio
    var portfolio = {
        stocks: [],
        amount: [],
        cash: "50000"
    };

    // Check if already registered
    if (userMap.has(author)) {
        receivedMessage.channel.send("You are already registered. Use !me command to see your portfolio");
    } else {
        userMap.set(author, portfolio)
        receivedMessage.channel.send("You have been registered. Starting cash reserve is $50,000 USD. Spend wisely.");
    }

}

// Get user - for '!me' command
async function getUser(author, receivedMessage) {
    // User doesn't exist
    if (!userMap.has(author)) {
        receivedMessage.channel.send("You are not currently registered. Type !play to register yourself.");

    } else {
        // Get user
        var user = userMap.get(author);

        try {
            // Show cash reserve
            receivedMessage.channel.send("```\nCash (USD): $" + user.cash.toFixed(2) + "\n```");
        } catch (err) {
            receivedMessage.channel.send("```\nCash (USD): $" + user.cash + "\n```");
        }

        // store total position
        var totalPosition = user.cash;

        // Print portfolio
        if (user.stocks.length === 0) {
            receivedMessage.channel.send("```\nPortfolio is currently empty. Buy a stock.\n```");
            // send total position
            receivedMessage.channel.send("```\nTotal Position: $" + parseFloat(totalPosition).toFixed(2) + "\n```");
        } else {
            receivedMessage.channel.send("```\nStock : Units : Value : Profit/Loss\n```");

            // Wait for GET request to complete in a Promise
            const results = await Promise.all(user.stocks.map(ticker => getStockPrice(ticker)))
                .then(function (responses) {
                    return responses;
                });

            // Print out stocks : units : $value
            for (i = 0; i < user.stocks.length; i++) {
                receivedMessage.channel.send("```\n" + user.stocks[i].toUpperCase() + " : " + user.amount[i] +
                    " : $" + (parseFloat(results[i] * user.amount[i]).toFixed(2)) + " : $ not done" + "\n```");

            }
            // Tally total position
            for (i = 0; i < results.length; i++) {
                totalPosition += results[i] * user.amount[i];
            }
            // send total position
            receivedMessage.channel.send("```fix\nTotal Position: $" + totalPosition.toFixed(2) + "\n```");
        }
    }
}

// GET stock price
function getStockPrice(ticker) {
    // return GET result
    return fetch('https://cloud.iexapis.com/stable/stock/' +
        ticker +
        '/quote/latestPrice?token=pk_dbe7d8fdde6744a6bed42869ba27f111 ')
        .then(res => res.json());
}

// !leaderboard - Top 10 leaderboard
function leaderboard(receivedMessage) {
    if (userMap.size > 0) {
        // Iterator
        const it = userMap.entries();
        let result = it.next().value;

        // Iterate and print
        while (!result.done) {
            receivedMessage.channel.send("```fix\nUser: " + result[0].username +
                "\nCash: $" + parseFloat(result[1].cash).toFixed(2) + "```\n");

            for (var i = 0; i < result[1].stocks.length; i++) {
                receivedMessage.channel.send("```fix\nStock: " + result[1].stocks[i] +
                    "\nUnits: " + result[1].amount[i] +
                    "\nTotal stock value: not done yet :^)" +
                    "\n```");
            }
            receivedMessage.channel.send("```fix\nTotal value: not yet done " + "```\n");
            result = it.next();
        }

    } else {
        receivedMessage.channel.send("```\nThere are no users registered!\n```");
    }
}

function sourcecode(receivedMessage) {
    receivedMessage.channel.send("https://github.com/bwhitely/DiscordStockBot/blob/main/bot.js");
}

// Help command - for '!help' command
function helpCommand(arguments, receivedMessage) {
    if (arguments.length > 0) {
        receivedMessage.channel.send("It looks like you might need help with " + arguments);
    } else {
        receivedMessage.channel.send("**Here are my commands (case sensitive):**\n" +
            "```css\n[!play] - Registers yourself to buy/sell stocks.\n```" +
            "```css\n[!help] - Provides my list of commands.\n```" +
            "```css\n[!stock ticker] - Provides current price and daily % change for your chosen stock. i.e.: !stock AAPL\n```" +
            "```css\n[!stock ticker details] - Provides current price, daily % and extra details for your chosen stock. i.e.: !stock AMZN details\n```" +
            "```css\n[!buy ticker xUnits] - Buys the specified amount of your chosen stock. i.e.: !buy GME x25\n```" +
            "```css\n[!sell ticker xUnits] - Sells the specified amount of your chosen stock. i.e.: !sell AMC x100\n```" +
            "```css\n[!me] - Gives an overview of your portfolio\n```" +
            "```css\n[!chart ticker] - Provides a screenshot of the intraday stock history. i.e.: !chart TSLA\n```" +
            "```css\n[!money] - Gives a user $25,000 USD for no reason\n```" +
            "```css\n[!leaderboard] - WORK IN PROG! Lists the top 10 users in descending order (cash + stocks)\n```" +
            "```css\n[!sourcecode] - Link to the source code\n```");
    }
};

// Discord token
client.login("redacted");