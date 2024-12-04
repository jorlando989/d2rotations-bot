const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require('mongoose');
const keys = require("../../config/keys");
const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));
const wait = require('node:timers/promises').setTimeout;
const nightfallWeaponsHashes = require("../../data/nightfallWeaponsRotation.json");
const NightfallWeaponRotation = mongoose.model("nightfallWeaponRotation");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getnightfall')
        .setDescription('Replies with the current nightfall and weapon'),
    async execute(interaction) {
        await interaction.deferReply();
		await wait(4_000);

        //get milestones
		const response = await fetch(
			"https://www.bungie.net/Platform/Destiny2/Milestones/",
			{
				headers: {
					"X-API-Key": keys.apiKey,
				},
			}
		);
		if (response.status === 400 || response.status === 401) {
			return res
				.status(401)
				.send({ error: "error retrieving milestones" });
		}
		const resp = await response.json();
		const milestones = resp.Response;

		//1942283261 = completions, 2029743966 = score
		const nightfallMilestoneInfo = milestones["2029743966"];

        //get nightfall activity info
        const response2 = await fetch(
			`https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/${nightfallMilestoneInfo.activities[0].activityHash}/`,
			{
				headers: {
					"X-API-Key": keys.apiKey,
				},
			}
		);
		if (response2.status === 400 || response2.status === 401) {
			return res
				.status(401)
				.send({ error: "error retrieving activity def" });
		}
		const resp2 = await response2.json();
        const activityInfo = resp2.Response;

		//get weapon info
		const nightfallWeaponDB = await NightfallWeaponRotation.findOne({
			nightfallWeaponIndex: { $gte: 0 },
		});

		const currWeapon = nightfallWeaponsHashes.rotation[nightfallWeaponDB.nightfallWeaponIndex];

        //create embed message
        const nightfallEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Weekly Nightfall')
            .setURL('https://d2rotations.report/nightfall')
            .setAuthor({ name: 'd2rotations', iconURL: 'https://d2rotations.report/destinyapilogoTransparent.png', url: 'https://d2rotations.report' })
            .addFields(
                { name: activityInfo.displayProperties.description, value: currWeapon}
            )
            .setImage(`https://www.bungie.net/${activityInfo.pgcrImage}`)
            .setTimestamp()
            .setFooter({ text: 'via d2rotations', iconURL: 'https://d2rotations.report/destinyapilogoTransparent.png' });

        await interaction.editReply({ embeds: [nightfallEmbed] });
    }
};