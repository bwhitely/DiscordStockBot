const Discord = require('discord.js');
const client = new Discord.Client();
const https = require('https');
const fetch = require("node-fetch");
const puppeteer = require('puppeteer');
var userMap;
var general;


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
        // send message to General channel
        general.send("@everyone I am online.");
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
    if (primaryCommand === "help")
        helpCommand(arguments, receivedMessage);
    else if (primaryCommand === "play")
        addUser(receivedMessage.author, receivedMessage);
    else if (primaryCommand === "me")
        getUser(receivedMessage.author, receivedMessage);
    else if (primaryCommand === "stock")
        stockCommand(arguments, receivedMessage);
    else if (primaryCommand === "chart")
        chartCommand(arguments, receivedMessage);
    else if (primaryCommand === "buy")
        buyCommand(arguments, receivedMessage, receivedMessage.author);
    else if (primaryCommand === "sell")
        sellCommand(arguments, receivedMessage, receivedMessage.author);
    else if (primaryCommand === "money")
        giveMoney(receivedMessage.author);
    else {
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
    // Launch browser
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    // URL
    await page.goto("https://www.google.com/search?q=$" + arguments);

    // Screenshot
    let screenshot = await page.screenshot();

    await browser.close();

    receivedMessage.channel.send({ files: [screenshot] });
}

// !buy
// arguments[0] = ticker, [1] = amount, [2] (if exists) = leverage
async function buyCommand(arguments, receivedMessage, author) {

    // Check if user exists before executing command
    if (userMap.has(author)) {
        receivedMessage.channel.send("Buying " + arguments[1] + " of " + arguments[0] +
            ".\n```\nPlease wait for 'Purchase Complete' before entering another command.\n```");
        // remove the 'x' in 'x5' for example
        arguments[1] = arguments[1].substr(1);

        var stocks = userMap.get(author);

        // GET price of stock
        const currPrice = await getStockPrice(arguments[0])
            .then(response => {
                return response;
            });

        var totalCost = currPrice * arguments[1];

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
    } else {
        receivedMessage.channel.send("You have not registered yet. Type !play");
    }
}


// !sell
// arguments[0] = ticker, [1] = amount
async function sellCommand(arguments, receivedMessage, author) {

    // Check if user exists before executing command
    if (userMap.has(author)) {
        receivedMessage.channel.send("Selling " + arguments[1] + " of " + arguments[0] +
            ".\n```\nPlease wait for 'Sale Complete' before entering another command.\n```");
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
            var i = stocks.stocks.indexOf(arguments[0]);

            var totalCost = parseFloat(currPrice) * arguments[1];
            receivedMessage.channel.send("```\nSale amount: $" + totalCost.toFixed(2) + "\n```");

            // Update cash reserve
            receivedMessage.channel.send("```\nBalance before: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");
            // Update cash
            stocks.cash = stocks.cash + totalCost;
            // Show balance
            receivedMessage.channel.send("```\nBalance after: $" + parseFloat(stocks.cash).toFixed(2) + "\n```");

            // Find stock and alter amount
            stocks.amount[i] -= arguments[1];

            if (stocks.amount[i] == 0) {
                stocks.stocks.splice(i, 1);
                stocks.amount.splice(i, 1);
            }

        } else {
            receivedMessage.channel.send("No such stock exists in your portfolio.")
        }

        receivedMessage.channel.send("```fix\nSale complete.\n```");
    } else {
        receivedMessage.channel.send("You have not registered yet. Type !play");
    }
}

// Give money to user
function giveMoney(author) {
    var portfolio = userMap.get(author);
    portfolio.cash = 1000;
    userMap.set(author, portfolio)
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
        receivedMessage.channel.send("You have been registered. Starting cash reserve is $50,000 USD");
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

        // Show cash reserve
        receivedMessage.channel.send("```\nCash (USD): $" + user.cash.toFixed(2) + "\n```");

        // store total position
        var totalPosition = user.cash;

        // Print portfolio
        if (user.stocks.length === 0) {
            receivedMessage.channel.send("```\nPortfolio is currently empty. Buy a stock.\n```");
            // send total position
            receivedMessage.channel.send("```\nTotal Position: $" + totalPosition + "\n```");
        } else {
            receivedMessage.channel.send("```\nStock : Units : Value\n```");

            // Wait for GET request to complete in a Promise
            const results = await Promise.all(user.stocks.map(ticker => getStockPrice(ticker)))
                .then(function (responses) {
                    return responses;
                });

            // Print out stocks : units : $value
            for (i = 0; i < user.stocks.length; i++) {
                receivedMessage.channel.send("```\n" + user.stocks[i].toUpperCase() + " : " + user.amount[i] + " : $" + (parseFloat(results[i] * user.amount[i]).toFixed(2)) + "\n```");

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

function getStockPrice(ticker) {
    // return GET result
    return fetch('https://cloud.iexapis.com/stable/stock/' +
        ticker +
        '/quote/latestPrice?token=pk_dbe7d8fdde6744a6bed42869ba27f111 ')
        .then(res => res.json());
}

// Help command - for '!help' command
function helpCommand(arguments, receivedMessage) {
    if (arguments.length > 0) {
        receivedMessage.channel.send("It looks like you might need help with " + arguments);
    } else {
        receivedMessage.channel.send("**Here is the list of my commands:**\n" +
            "```\n" +
            "!play - Registers yourself to play the game.\n" +
            "!help - Provides my list of commands.\n" +
            "!stock {stockTicker} - Provides current price and daily % change for your chosen stock.\n" +
            "!stock {stockTicker} details - Provides current price, daily % and extra details for your chosen stock.\n" +
            "!buy {stockTicker} {xAmount} - Buys the specified amount of your chosen stock.\n" +
            "!sell {stockTicker} {xAmount} - Sells the specified amount of your chosen stock.\n" +
            "```");
    }
};

// Discord token
client.login("redacted");