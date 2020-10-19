const Discord = require('discord.js');
const client = new Discord.Client();
const https = require('https');
var userMap;
var general;

/**
 * BOT RESPONSE WHEN IT LOADS AKA IS 'ready'
 */
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
        general.send("I am online.");

        // Attatch image
//        const webAttatchment =
//            new Discord.MessageAttachment('https://www.devdungeon.com/sites/all/themes/devdungeon2/logo.png');
//        general.send(webAttatchment);

        // Setting bots activity
        client.user.setActivity("$$$", { type: "MONEY" });

        // Map for user data
        userMap = new Map();
    });

/**
 * BOT RESPONDING TO A MESSAGE
 */
client.on('message',
    (receivedMessage) => {
        // Prevent bot from responding to its own messages
        if (receivedMessage.author === client.user) {
            return;
        }

        // Send message
        receivedMessage.channel.send("Message received from " + receivedMessage.author.toString() + ": " + receivedMessage.content);

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
        addUser(receivedMessage.author);
     else if (primaryCommand === "me") 
        getUser(receivedMessage.author);
     else if (primaryCommand === "stock") 
        stockCommand(arguments, receivedMessage);
     else if (primaryCommand === "chart") 
        chartCommand(arguments, receivedMessage);
     else if (primaryCommand === "buy") 
        buyCommand(arguments, receivedMessage, receivedMessage.author);
     else if (primaryCommand === "sell") 
        sellCommand(arguments, receivedMessage, receivedMessage.author);
     else if (primaryCommand === "money") 
        giveMoney();
    
    else {
        receivedMessage.channel.send("Not a command, dumbass");
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
                var prevClose = JSON.parse(data).previousClose;
                var change = JSON.parse(data).changePercent;
                var yearHigh = JSON.parse(data).week52High;
                var yearLow = JSON.parse(data).week52Low;
                var ytdChange = JSON.parse(data).ytdChange;
                var mktCap = JSON.parse(data).marketCap;
                var peRatio = JSON.parse(data).peRatio;

                if (arguments.length == 1) {
                    // stops here
                    console.log(data);
                    // Send stock price
                    receivedMessage.channel.send("`Ticker:` " + ticker + "\n" + "`Current Price:` $" + prevClose + "\n" + "`% change:` " + change);
                } else if (arguments[1] == "details") {
                    console.log(data);

                    receivedMessage.channel.send("`Ticker:` " + ticker + "\n" + "`Current Price:` $" + prevClose + "\n" + "`% change:` " + change + "%\n" + 
                        "`Year High / Low:` $" + yearHigh + " / $" + yearLow + "\n" + "`YTD change:` " + ytdChange + "%\n" + "`Market cap:` $" + mktCap + "\n" + 
                        "`PE ratio:` " + peRatio);
                }
            })
        }).on("error", (err) => {
            console.log("error: " + err.message);
        })

        // Stock details
    } else if (arguments.length == 2 && arguments[1] == ("details")) {
        receivedMessage.channel.send(arguments[1] + "`current price: `" + JSON.parse(data).previousClose + " " + JSON.parse(data).changePercent);

    } else {
        receivedMessage.channel.send("`It looks like you didn't include the ticker and/or the keyword 'details'. Try again.`");
    }
};

// Chart command
function chartCommand (arguments, receivedMessage) {
    
}

// Buy
// arguments[0] = ticker, [1] = amount, [2] (if exists) = leverage
function buyCommand(arguments, receivedMessage, author) {
    general.send("Buying " + arguments[1] + " of " + arguments[0]);
}

// Sell
// arguments[0] = ticker, [1] = amount
function sellCommand(arguments, receivedMessage, author) {
    general.send("Selling " + arguments[1] + " of " + arguments[0]);
}

// Give money to user
function giveMoney() {
    
}

// Add user
function addUser(author) {

}

function getUser(author) {

}
// Help command
function helpCommand(arguments, receivedMessage) {
    if (arguments.length > 0) {
        receivedMessage.channel.send("It looks like you might need help with " + arguments);
    } else {
        receivedMessage.channel.send("Here is the list of my commands:\n" + 
            "`!help - Provides my list of commands.\n" +
            "`!stock {stockTicker} - Provides current price and daily % change for your chosen stock.\n" + 
            "`!stock {stockTicker} details - Provides current price, daily % and extra details for your chosen stock.");
    }
};


client.login("NzY3NjgyNjA4NDEwMjYzNTYy.X41eJA.6PHO_Tjmj2T35cKpZ_5N8WNx0f8");