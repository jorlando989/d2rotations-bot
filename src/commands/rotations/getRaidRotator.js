const { SlashCommandBuilder } = require("discord.js");
const mongoose = require('mongoose');
const wait = require('node:timers/promises').setTimeout;
const raidRotationHashes = require("../../data/raidRotationHashes.json");
const RaidAndDungeonRotations = mongoose.model("raidRotation");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getraidrotator')
        .setDescription('Replies with the current pinnacle raids'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(1_000);

        const raidRotationDB = await RaidAndDungeonRotations.findOne({
			featuredRaidIndex: { $gte: 0 },
		});

		const featuredRaid = raidRotationHashes.rotation[raidRotationDB.featuredRaidIndex];
		const featuredRaid2 = raidRotationHashes.rotation[raidRotationDB.featuredRaidIndex + 1];

		await interaction.editReply('Featured raids this week are: ' + featuredRaid + " and " + featuredRaid2);
    }
};