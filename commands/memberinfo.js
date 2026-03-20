const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserTimeInfo } = require('../utils/timeUtils');
const { getServerSettings } = require('../utils/serverSettingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memberinfo')
    .setDescription('Shows member information with time and day details')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to get info about')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);
    const requester = await interaction.guild.members.fetch(interaction.user.id);

    // Check if requester is admin or has a "Moderator" role
    const isAdmin = requester.permissions.has('Administrator');
    const isModerator = requester.roles.cache.some(role => 
      role.name.toLowerCase().includes('moderator') || role.name.toLowerCase().includes('mod')
    );
    const canViewSensitiveInfo = isAdmin || isModerator;

    // Get server hour format
    const settings = getServerSettings(interaction.guildId);
    const timeInfo = getUserTimeInfo(user, settings.hourFormat);

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor || '#0099ff')
      .setTitle(`${member.displayName}'s Information`);

    // Add sensitive fields only if requester is admin/moderator
    if (canViewSensitiveInfo) {
      embed.addFields(
        { name: '👤 Username', value: user.username, inline: true },
        { name: '🆔 User ID', value: user.id, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false }
      );
    } else {
      embed.addFields(
        { name: 'ℹ️ Info', value: 'This information is only visible to Admins and Moderators', inline: false }
      );
    }

    // Add member details visible to all
    embed.addFields(
      { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
      { name: '⏰ Current Time', value: `**${timeInfo.time}**`, inline: true },
      { name: '🕐 Timezone', value: `**${timeInfo.timezone}**`, inline: true },
      { name: '📆 Current Day', value: `**${timeInfo.day}**`, inline: false },
      { name: '🎭 Roles', value: member.roles.cache.map(r => r.toString()).join(', ') || 'No roles', inline: false }
    );

    embed.setThumbnail(user.displayAvatarURL({ size: 512 }))
      .setFooter({ 
        text: `Requested by ${interaction.user.username}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    const reply = await interaction.editReply({ embeds: [embed], fetchReply: true });

    setTimeout(() => {
      reply.delete().catch(() => {});
    }, 60000);
  },
};
