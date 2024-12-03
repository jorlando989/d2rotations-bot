const { SlashCommandBuilder } = require("discord.js");
const mongoose = require('mongoose');
const wait = require('node:timers/promises').setTimeout;
const lostSectorRotation = require("../../data/lostSectorRotation.json");
const LostSectorIndexes = mongoose.model("lostSectorIndex");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getlostsector')
        .setDescription('Replies with the current featured lost sector'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(1_000);

		const currLostSector = await LostSectorIndexes.findOne({
			numLostSectors: 11,
		});

		//get info for lost sector
		const currLostSectorName = lostSectorRotation.rotation[currLostSector.currLostSectorIndex];

		await interaction.editReply('Today\'s lost sector is: ' + currLostSectorName);
    }
};