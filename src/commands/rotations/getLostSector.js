const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require('mongoose');
const keys = require("../../config/keys");
const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));
const wait = require('node:timers/promises').setTimeout;
const lostSectorRotation = require("../../data/lostSectorRotation.json");
const LostSectorIndexes = mongoose.model("lostSectorIndex");
const allLostSectorHashes = require("../../data/allLostSectorHashes.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getlostsector')
        .setDescription('Replies with the current featured lost sector'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(2_000);

		const currLostSector = await LostSectorIndexes.findOne({
			numLostSectors: 11,
		});

		//get info for lost sector
		const currLostSectorName = lostSectorRotation.rotation[currLostSector.currLostSectorIndex];

        //get nightfall activity info
        const response = await fetch(
			`https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/${allLostSectorHashes[currLostSectorName].legend}/`,
			{
				headers: {
					"X-API-Key": keys.apiKey,
				},
			}
		);
		if (response.status === 400 || response.status === 401) {
			return res
				.status(401)
				.send({ error: "error retrieving activity def" });
		}
		const resp = await response.json();
        const activityInfo = resp.Response;

        console.log(activityInfo);

        //create embed message
        const lostSectorEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Lost Sector')
            .setURL('https://d2rotations.report/daily')
            .setAuthor({ name: 'd2rotations', iconURL: 'https://d2rotations.report/destinyapilogoTransparent.png', url: 'https://d2rotations.report' })
            .addFields(
                { name: currLostSectorName, value: " "}
            )
            .setImage(`https://www.bungie.net/${activityInfo.pgcrImage}`)
            .setTimestamp()
            .setFooter({ text: 'via d2rotations', iconURL: 'https://d2rotations.report/destinyapilogoTransparent.png' });

		await interaction.editReply({ embeds: [lostSectorEmbed] });
    }
};