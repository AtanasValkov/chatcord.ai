from concurrent.futures.thread import _worker
from tracemalloc import stop
import discord
from discord.ext import commands
import local_requests
from collections import deque
import copy
import time
from datetime import datetime, timedelta
import os
import base64
from PIL import Image
import functools
from typing import List
import string
from transformers import pipeline
import requests
import json
import re

current_date = datetime.now()

# File to store the last execution time
TIME_FILE = 'last_execution_time.txt'

def write_current_time():
    """Writes the current time to the TIME_FILE."""
    with open(TIME_FILE, 'w') as f:
        f.write(str(time.time()))

def get_last_execution_time():
    """Gets the last execution time from the TIME_FILE."""
    if os.path.exists(TIME_FILE):
        with open(TIME_FILE, 'r') as f:
            last_time = float(f.read())
            return datetime.fromtimestamp(last_time)
    return None

def can_execute():
    """Checks if 10 minutes have passed since the last execution."""
    last_time = get_last_execution_time()
    if last_time is None:
        # If there's no record, allow execution
        return True
    return datetime.now() >= last_time + timedelta(minutes=10)

messages = copy.deepcopy(personality_Shapeshifter)
intents = discord.Intents.default()
intents.dm_messages = True  # Enable the intent to receive DM messages
intents.messages = True  # Enable the intent to access message content
intents.message_content = True

character = copy.deepcopy(personality_Shapeshifter)
del character['char_greeting']
character_token_count = local_requests.token_count(character['char_persona'])
new_token_counter = 0
temp_convo_counter = 0
total_tokens = 0
temp_convo = []
temp_convo.insert(temp_convo_counter, personality_Shapeshifter['char_greeting'])
avatar = ''
bot = commands.Bot(command_prefix='!', intents=intents)
last_message = ''
message_to_reply_to = ''
latest_saved_chat = ''
message_queue = deque()
is_processing = False

isFirst = True
loops = 0
stop = False

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name} ({bot.user.id})')

@bot.event
async def on_message(message):
    global is_processing
    global message_queue
    global drawing_queue
    global latest_saved_chat
    global messages
    global last_message
    global message_to_reply_to

    if bot.user not in message.mentions and bot.user != message.author and messages['char_name'] != f"{message.author}".replace("#0000", ""):
        if isinstance(message.channel, discord.DMChannel):
            await message.reply("I do not talk in private! Go back to the group chat!")

        if isinstance(message.channel, discord.TextChannel):
            async with message.channel.typing():
                    if message.webhook_id:
                      #  print(f"HookID = {message.webhook_id}")
                       # print(f"author = {message.author}")
                      #  print(f"content = {message.content}")
                      #  print(f"application_id = {message.application_id}")
                        if message.embeds[0].title == "create":
                            bot_name = f"{message.author}".replace("#0000", "")
                            webhook_url = await createbot(message.channel, bot_name, message.embeds[0].description)
                            webhook_id = f"{message.webhook_id}"
                            #base_url = "https://discord.com/api/webhooks"
                            # Make the GET request
                            #headers = {"Authorization": "Bot n0mDSPFAHf47EsBfR7kley-sW7nJWD_UeZ94GNbNyCnvzMr45pOLw8mHSnwqjmxCDjnu"}
                            #response = requests.get(f"{base_url}/{webhook_id}", headers=headers)
                            # Check if the request was successful
                            #if response.status_code == 200:
                            #    webhook_data = response.json()  # Parse the JSON response
                            #    avatar = webhook_data.avatar
                            #    print("Webhook Data:", webhook_data)
                            #else:
                            #    print("Error:", response.status_code, response.text)
                            
                            messages["char_name"] = f"{message.author}".replace("#0000", "")
                            messages["char_persona"] = message.content
                            webhook_data = load_file('characters.json')
                            webhook_data[webhook_url] = {
                                "name": messages["char_name"],
                                "persona": messages["char_persona"],
                                "id": f"{webhook_id}",
                                "application_id": message.application_id,
                                "avatar": message.embeds[0].description
                            }
                            save_file('characters.json', webhook_data)  # Save the new race to the file
                            char_data = {}
                            char_data.update(load_file('characters.json'))
                            await message.reply(f"saved! {char_data[webhook_url]['name']}")
                        #await handle_message(message, "Introduce yourself briefly to the server while in character.")

                        elif message.embeds[0].title == "new character":
                            char_json = load_file('website-characters.json')
                            counter = f"{len(char_json)}"

                            char_json[counter] = {
                                "name": f"{message.author}".replace("#0000", ""),
                                "persona": message.content,
                                "avatar": message.embeds[0].description,
                                "tags": message.embeds[0].fields[0].value
                            }
                            save_file('website-characters.json', char_json)  # Save the new race to the file

                            char_data = {}
                            char_data.update(load_file('website-characters.json'))
                            await message.reply(f"saved! {char_data[counter]['name']}")
                    else:
                        # Retrieve the content of the message
                        content = message.content
                        
                        # Remove the bot mention from the content
                        mention = f'<@{bot.user.id}>'
                        content = content.replace(mention, '')

                        # Strip leading and trailing whitespaces
                        content = content.strip()

                        # Split the message into words
                        words = content.split()

                        # Check if there is at least one word
                        if words:
                            # Get the first word
                            first_word = words[0]

                        if message.reference != None:
                            msg = await message.channel.fetch_message(message.reference.message_id)
                            if find_character(f"{msg.author}".replace("#0000", "")) == None:
                                return
                            else:
                                first_word = f".{msg.author}".replace("#0000", "")

                        if first_word:
                            if re.search(r'\.\w', first_word):
                                if is_processing:
                                    # Add the message to the queue
                                    if first_word == "reset":
                                        messages = copy.deepcopy(personality_Rocky_bot_Muri_no_dialogue)
                                        await message.reply("What were we talking about again? <:RockytheHuh:1110545801106702507>")
                                    elif first_word.lower() == "regen" and latest_saved_chat != '':
                                        messages['char_greeting'] = messages['char_greeting'].replace(latest_saved_chat, '')
                                        message_queue.append((message_to_reply_to, last_message))
                                    elif first_word == "draw":
                                        content = content.replace(first_word, '')
                                        drawing_queue.append((message, content))
                                    else:
                                        name = first_word.replace(".", '', 1)
                                        webhook_url = find_character(name)
                                        if webhook_url == None:
                                            await message.reply("No such character.")
                                        else:
                                            messages["char_name"] = name
                                            characters = load_file("characters.json")
                                            messages["char_persona"] = characters[webhook_url]["persona"]
                                            content = content.replace(first_word, '')
                                            message_queue.append((message, content))
                                else:
                                    is_processing = True
                                    if first_word == "reset":
                                        messages = copy.deepcopy(personality_Rocky_bot_Muri_no_dialogue)
                                        await message.reply("What were we talking about again? <:RockytheHuh:1110545801106702507>")
                                    elif first_word.lower() == "regen" and latest_saved_chat != '':
                                        messages['char_greeting'] = messages['char_greeting'].replace(latest_saved_chat, '')
                                        await handle_message(message_to_reply_to, last_message)
                                    else:
                                        name = first_word.replace(".", '', 1)
                                        webhook_url = find_character(name)
                                        if webhook_url == None:
                                            await message.reply("No such character.")
                                        else:
                                            messages["char_name"] = name
                                            characters = load_file("characters.json")
                                            messages["char_persona"] = characters[webhook_url]["persona"]
                                            content = content.replace(first_word, '')
                                            await handle_message(message, content)
                                    is_processing = False

                                    if message_queue:
                                        next_message, next_content = message_queue.popleft()
                                        await handle_message(next_message, next_content)

                        elif 2 < 1:
                            if is_processing:
                                message_queue.append((message, content))
                            else:
                                is_processing = True
                                await handle_message(message, content)
                                is_processing = False
                                
                            if message_queue:
                                next_message, next_content = message_queue.popleft()
                                await handle_message(next_message, next_content)
    await bot.process_commands(message)

async def handle_message(message, content):
    global messages
    global character_token_count
    global new_token_counter
    global temp_convo_counter
    global temp_convo
    global total_tokens
    global last_message
    global message_to_reply_to
    global latest_saved_chat
    global current_date
    current_date = datetime.now()

    username = message.author.display_name

    message_to_reply_to = message
    # Reply with an auto-response
    if total_tokens > 1600:
        messages['char_greeting'] = messages['char_greeting'].replace(temp_convo[0], '')
        temp_convo.pop(0)
        temp_convo_counter -= 1

    last_message = content

    """Runs a blocking function in a non-blocking way"""
    func = functools.partial(long_processing_task, messages, content, username) # `run_in_executor` doesn't support kwargs, `functools.partial` does
    response, total_tokens, response_tokens = await bot.loop.run_in_executor(None, func)
    #temp_convo[temp_convo_counter] += f"\n{username}: " + content + "\nRocky: " + response
    temp_convo[temp_convo_counter] += f"{username}: " + content + f"<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n{messages['char_name']}:" + response + "<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n"
    
    new_token_counter += response_tokens
    if new_token_counter >= 200:
        new_token_counter = 0
        temp_convo_counter += 1
        temp_convo.insert(temp_convo_counter, '')
    # Get the username of the person who mentioned the bot
    #content =f"\n{username}: " + content
    #char_input ="\nRocky: " + response
    content =f"{username}: " + content + "<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    char_input =f"{messages['char_name']}:" + response + "<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n"
    latest_saved_chat = content + char_input
    messages['char_greeting'] += content
    messages['char_greeting'] += char_input
    response = replace_character_names(response, username, f"{messages['char_name']}")

    classifier = pipeline("text-classification", model="../Common/Emotion/", top_k=None)
    result = classifier(str(response))
    # Extracting relevant information from the first element
    emotions = result[0]
    emotion0 = emotions[0].get('label', 'N/A')
    emotion1 = emotions[1].get('label', 'N/A')
    score0 = emotions[0].get('score', 'N/A') * 100
    score1 = emotions[1].get('score', 'N/A') * 100
    # Format the scores to display only the first two decimal places
    score0_formatted = "{:.2f}".format(score0)
    score1_formatted = "{:.2f}".format(score1)
    response = response + f" *{messages['char_name']} is feeling {emotion0} at {score0_formatted}% and {emotion1} at {score1_formatted}%*"
    # Send the response


    username = messages["char_name"]
    webhook_url = find_character(username)
    characters = load_file("characters.json")
    avatar = characters[webhook_url]["avatar"]

    data = {
        "username": username,
        "avatar_url": avatar,
        "content": response
    }

    requests.post(webhook_url, json=data)
    #await message.reply(response)

def long_processing_task(messages, content, username):
    # Simulate the processing time (replace with your actual processing code)
    response = local_requests.completion(messages, content, username, messages['char_name'])

    # Return the response
    return response


def replace_character_names(text, name1, name2):
    text = text.replace('{{user}}', name1).replace('{{char}}', name2)
    return text.replace('<USER>', name1).replace('<BOT>', name2)

# Open the file
#with renpy.file("Ana_persistent.json") as file_obj

# Read the contents of the file
#$json_data = json.load(file_obj)
# The game starts here.

@bot.command()
async def rename(ctx, name):
    avatar = f'./input/{name}.png'

    with open(avatar, 'rb') as image_file:   
        await bot.user.edit(avatar=image_file.read())
    
    await ctx.guild.me.edit(nick=name)

async def createbot(channel, name: str, avatar_url: str):
    """Creates a new webhook with a given name and avatar."""
    webhook = await channel.create_webhook(name=name)
    
    # Change webhook avatar
    response = requests.get(avatar_url)
    if response.status_code == 200:
        await webhook.edit(avatar=response.content)
        return(webhook.url)
        #await ctx.send(f"✅ Created bot **{name}**! Webhook: {webhook.url}")
    else:
        await channel.send(f"⚠️ Failed to set avatar for **{name}** (HTTP {response.status_code}). Webhook still created: {webhook.url}")

def find_character(name):
    print(name)
    characters = load_file("characters.json")
    for url, info in characters.items():
        if name in info.get("name"):
            return url
    print("No match found")  # This runs only if no match is found
    return None

async def swapCharacter(guild, bot, name):
    """Your function to be executed."""
    if can_execute():
        avatar = f'./input/{name}.png'
        with open(avatar, 'rb') as image_file:   
            await bot.user.edit(avatar=image_file.read())
    
        await guild.me.edit(nick=name)
        write_current_time()
    else:
        print("Cannot execute function. 10 minutes have not passed since the last execution.")

def save_file(filename, data):
    """ Open the file in write mode and dump the JSON data into it."""
    
    data = {k: data[k] for k in sorted(data.keys())}
    with open(filename, 'w') as file:
        json.dump(data, file, indent=4)

def load_file(filename):
    """Load data from the file."""
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
            
            data = {k: data[k] for k in sorted(data.keys())}
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {}



