// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.
const Discord = require('discord.js');
const web = require('../webhooks.json');
module.exports = async (client, message) => {
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) return;

  // Grab the settings for this server from Enmap.
  // If there is no guild, get default conf (DMs)
  const settings = message.settings = client.getGuildSettings(message.guild);

  //if (settings.stats === true) {
  if (client.stats.get(`${message.member.id} | ${message.guild.id}`) === undefined) {
    client.stats.set(`${message.member.id} | ${message.guild.id}`, 1);
  } else {
    client.stats.inc(`${message.member.id} | ${message.guild.id}`);
  }
  //}

  // Checks if the bot was mentioned, with no message after it, returns the prefix.
  const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
  if (message.content.match(prefixMention)) {
    return message.channel.send(`Hi, ${message.author.tag}, my prefix on this guild is \`${settings.prefix}\``);
  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if (message.content.indexOf(settings.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // If the member on a guild is invisible or not cached, fetch them.
  if (message.guild && !message.member) await message.guild.fetchMember(message.author);

  // Get the user or member's permission level from the elevation
  const level = client.permlevel(message);

  // Check whether the command, or alias, exist in the collections defined
  // in app.js.
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));
  // using this const varName = thing OR otherthign; is a pretty efficient
  // and clean way to grab one of 2 values!
  if (!cmd) return;

  // Some commands may not be useable in DMs. This check prevents those commands from running
  // and return a friendly error message.
  if (cmd && !message.guild && cmd.conf.guildOnly)
    return message.channel.send('This command is unavailable via private message. Please run this command in a guild.');

  if (level < client.levelCache[cmd.conf.permLevel]) {
    if (settings.systemNotice === 'true') {
      return message.channel.send(`You do not have permission to use this command.
  Your permission level is ${level} **(${client.config.permLevels.find(l => l.level === level).name})**
  This command requires level ${client.levelCache[cmd.conf.permLevel]} **(${cmd.conf.permLevel})**`);
    } else {
      return;
    }
  }

  // To simplify message arguments, the author's level is now put on level (not member so it is supported in DMs)
  // The "level" command module argument will be deprecated in the future.
  message.author.permLevel = level;
  
  message.flags = [];
  while (args[0] && args[0][0] === '-') {
    message.flags.push(args.shift().slice(1));
  }
  // If the command exists, **AND** the user has permission, run it.
  client.logger.cmd(`[CMD] ${client.config.permLevels.find(l => l.level === level).name} ${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`);
  
  const hook = new Discord.WebhookClient(web.commandLogID, web.commandLogToken);
  const embed = new Discord.RichEmbed();
  embed.setTitle('COMMAND EXECUTED');
  embed.addField('User', `${message.author.username} \`(${message.author.id})\``, true);
  embed.addField('User Permissions', client.config.permLevels.find(l => l.level === level).name, true);
  embed.addField('Command', cmd.help.name, true);
  try {
    //if (args > 1) embed.addField('Content', args, true);
    embed.addField('Content', message.content, true);
    embed.addField('Guild', `${message.guild.name} \`(${message.guild.id})\``, true);
    embed.addField('Channel', `${message.channel.name} \`(${message.channel.id})\``, true);
  } catch (error) {
    console.log(error);
  }
  embed.setFooter(client.user.username, client.user.avatarURL);
  embed.setTimestamp();
  //client.channels.get('503391943452000257').send(embed);
  hook.send(embed);

  cmd.run(client, message, args, level);
};