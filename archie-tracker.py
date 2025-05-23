from requests_oauthlib import OAuth2Session
from dotenv import load_dotenv
import os
import json
import discord
from discord import option
from discord.ext import commands
import pymongo
import random

def get_good_boy_count(user_id):
    #get membership_id from database
    results = collection.find_one({"user_id": user_id})
    membership_id = results["membership_id"]
    membership_type = results["membership_type"]
    get_profile_url = f"https://www.bungie.net/Platform/Destiny2/{membership_type}/Profile/{membership_id}/?components=1100"

    get_profile_response = session.get(url=get_profile_url, headers=additional_headers)
    get_profile_json_response = json.loads(get_profile_response.text)
    good_boy_protocol_counter = get_profile_json_response["Response"]["metrics"]["data"]["metrics"]["3131994725"]["objectiveProgress"]["progress"]
    return good_boy_protocol_counter

load_dotenv()

api_key = os.getenv("API_KEY")
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
discord_token = os.getenv("DISCORD_TOKEN")

base_auth_url = "https://www.bungie.net/en/OAuth/Authorize"
redirect_url = "https://jorlando989.github.io"
token_url = "https://www.bungie.net/platform/app/oauth/token/"
get_user_details_endpoint = "https://www.bungie.net/Platform/User/GetCurrentBungieNetUser/"

mongoClient = pymongo.MongoClient(os.getenv("MONGO_URI"))
database = mongoClient["destiny-api-dev"]
collection = database["users"]

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

additional_headers = {"X-API-KEY": os.getenv("API_KEY")}

bot = commands.Bot(command_prefix=".", intents=intents)
session = OAuth2Session(client_id=client_id, redirect_uri=redirect_url)

@bot.event
async def on_ready():
    print(f"we have logged in as {bot.user}")

@bot.slash_command(name="register",
              description="Step 1 for registering with the bot")
async def register(interaction):
    #check if already registered
    results = collection.find_one({"user_id": interaction.user.id})
    if (results != None):
        await interaction.response.send_message("You are already registered.")
    else:
        #oauth
        auth_link = session.authorization_url(base_auth_url)
        await interaction.response.send_message(f"Auth link: {auth_link[0]} \n\n Please visit this site, copy the url, and then call register2 command with the url")

@bot.slash_command(name="register2", description="Step 2 for registering with the bot")
async def register2(interaction, url):
    #check if already registered
    results = collection.find_one({"user_id": interaction.user.id})
    if (results != None):
        await interaction.response.send_message("You are already registered.")
    else:
        session.fetch_token(
            client_id=client_id,
            client_secret=client_secret,
            token_url=token_url,
            authorization_response=url
        )

        get_membership_url = "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/"

        membership_response = session.get(url=get_membership_url, headers=additional_headers)
        membership_response_json = json.loads(membership_response.text)
        membership_type = membership_response_json["Response"]["destinyMemberships"][0]["membershipType"]
        membership_id = membership_response_json["Response"]["destinyMemberships"][0]["membershipId"]

        #save user in database
        #need to save user id and characters ids
        print(membership_type, membership_id, url)
        result = collection.insert_one({"name": interaction.user.display_name, "user_id": interaction.user.id, "client_id": client_id, "membership_id": membership_id, "membership_type": membership_type, "url": url})
        print(result.acknowledged)

        await interaction.response.send_message("You have been registered.")

@bot.slash_command(name="good-boy-protocol", description="Shows the number of times you've activated Good Boy Protocol")
async def rank_good_boy_protocol(interaction):
    response_options = ["You've pet Archie 1 times", "Resetting Good Boy Protocol...You've pet Archie 0 times", "Get Good"]
    good_boy_protocol_counter = get_good_boy_count(interaction.user.id)

    embed = discord.Embed(
        title="Good Boy Protocol", 
        description=f"You've pet Archie {good_boy_protocol_counter} times",
        color=discord.Color.blue()
    )
    if(interaction.user.id == 410595937321353216):
            random_integer = random.randrange(0,3)
            embed.description = response_options[random_integer]
    embed.set_thumbnail(url="https://www.bungie.net/common/destiny2_content/icons/9f8e31dbce0ef4f4d3f58b32dfe9367c.jpg")
    embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.display_avatar)
    await interaction.send(embed=embed)

@bot.slash_command(name="leaderboard", description="View stats for everyone in your server")
@option("leaderboard_name", str, description="Select an option", choices=["Good Boy Protocol"])
async def leaderboard(interaction, leaderboard_name):
    await interaction.defer()
    if (leaderboard_name == "Good Boy Protocol"):
        all_users = collection.find({})
        all_users_gb_counts = []
        for user in all_users:
            good_boy_count = get_good_boy_count(user["user_id"])
            # if(user["user_id"] == 410595937321353216):
            #     good_boy_count = 0

            #check if user in server
            if (interaction.guild.get_member(user["user_id"])):
                all_users_gb_counts.append((user["membership_id"], user["user_id"], good_boy_count, user["name"]))

        all_users_gb_counts.sort(key=lambda x:x[2], reverse=True)

        desc = ""
        i = 1
        for x in all_users_gb_counts:
            desc += f"{i}) {x[3]} - {x[2]} pets\n"
            i += 1

        embed = discord.Embed(
            title="Good Boy Protocol Leaderboard",
            color=discord.Color.blue(),
            description=desc
        )
        await interaction.respond(embed=embed)

bot.run(f"{discord_token}")