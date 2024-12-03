const { SlashCommandBuilder } = require("discord.js");
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getraidrotator')
        .setDescription('Replies with the current pinnacle raids'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(4_000);
		await interaction.editReply('raid is ...');
    }
    
};