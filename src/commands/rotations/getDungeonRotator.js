const { SlashCommandBuilder } = require("discord.js");
const mongoose = require('mongoose');
const wait = require('node:timers/promises').setTimeout;
const dungeonRotationHashes = require("../../data/dungeonRotationHashes.json");
const RaidAndDungeonRotations = mongoose.model("raidRotation");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getdungeonrotator')
        .setDescription('Replies with the current pinnacle dungeons'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(1_000);

        const raidRotationDB = await RaidAndDungeonRotations.findOne({
			featuredDungeonIndex: { $gte: 0 },
		});

		const featuredDungeon = dungeonRotationHashes.rotation[raidRotationDB.featuredDungeonIndex];
		const featuredDungeon2 = dungeonRotationHashes.rotation[raidRotationDB.featuredDungeonIndex + 1];

		await interaction.editReply('Featured dungeons this week are: ' + featuredDungeon + " and " + featuredDungeon2);
    }
};