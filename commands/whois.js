const Discord = require('discord.js');
const talkedRecently = new Set();
const status = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline/Invisible'
};
exports.run = async (client, message, args, level) => {
  const resolvedUser = (args[0] !== undefined) ? message.guild.members.get(args[0].match(/[0-9]/g).join('')) : null;
  if (talkedRecently.has(message.author.id) && !message.member.roles.has('490364533550874644')) {

    const botmessage = await message.channel.send('You are being rate limited!' + message.author);
    botmessage.delete(10000);
  } else {
    if (resolvedUser)
      try {
        level = client.permlevel(resolvedUser.lastMessage);
      } catch (e) {
        level = 0;
      }
    const msg = await message.channel.send('Loading...');
    try {
      const friendly = client.config.permLevels.find(l => l.level === level).name;
      const botuser = resolvedUser ? message.guild.members.get(resolvedUser.id) : message.member;
      const matt = resolvedUser ? message.guild.members.get(resolvedUser.id).roles.sort((a, b) => b.position - a.position).map(i => i.id).slice(0, -1) : message.member.roles.sort((a, b) => b.position - a.position).map(i => i.id).slice(0, -1);
      let bot = '';
      let myDick = '';
      for (let i = 0; i < matt.length; i++) {
        myDick += '<@&' + matt[i] + '>';
        if (matt.length != (i + 1)) myDick += ', ';
      }
      if (botuser.user.bot === true) {
        bot = 'Yes';
      } else {
        bot = 'No';
      }

      const embed = new Discord.RichEmbed()
        .setAuthor(botuser.displayName, botuser.user.avatarURL)
        .setThumbnail(botuser.user.avatarURL)
        .setColor(botuser.displayColor)
        .addField('Joined Server At', `${botuser.joinedAt.toLocaleString('en-US')}`, true)
        .addField('Created Account At', `${botuser.user.createdAt.toLocaleString('en-US')}`, true)
        .addField('Status', `${status[botuser.user.presence.status]}`, true)
        .addField('Playing', `${botuser.user.presence.game ? `${botuser.user.presence.game.name}` : 'No rich presense found.'}`, true)
        .addField(`Roles [${botuser.roles.size - 1}]`, `${myDick}`, true)
        .addField('Acknowledgements', `${friendly}`, true)
        .addField('System Level', `${level}`, true)
        .setTimestamp()
        .setFooter(`${client.user.username} | ID ${botuser.id} |  Beta - Master`);
      if (bot == 'Yes') {
        embed.addField('Bot', `${bot}`, true);
      }
      msg.edit(embed);
    } catch (err) {
      msg.edit('EXCPT*- ' +
      err);
    }
    talkedRecently.add(message.author.id);
    setTimeout(() => {
    // Removes the user from the set after a minute
      talkedRecently.delete(message.author.id);
    }, 2000);
  }
};
exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['userinfo'],
  permLevel: 'Standard User'
};

exports.help = {
  name: 'whois',
  category: 'Misc',
  description: 'Provides user information.',
  usage: 'whois'
};