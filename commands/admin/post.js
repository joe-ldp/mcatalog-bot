// reboot.js
const { Command } = require('discord.js-commando');

module.exports = class extends Command
{
  constructor(client)
  {
    super(client,
    {
      name: 'post',
      group: 'admin',
      memberName: 'post',
      description: 'Posts info about a (new) release in a channel, including links etc.',
      examples: [`${client.commandPrefix}post`]
    });
  }

  async run(message)
  {
    // Prevent third-party usage of administrative commands
    if (!this.client.OWNER_IDS.includes(message.author.id))
      return message.reply(`You don't have the permission to use this command.`);

    const args = message.content.slice(this.client.commandPrefix.length).toUpperCase().trim().split(/ +/g).splice(1);
    if (args.length != 2) return message.reply("Please enter a release ID and channel ID.");

    const ID = args[0];
    const postChannel = args[1];

    // Initialize Discord embed
    const embed = new this.client.Discord.MessageEmbed();
    const json = await mcatJson(this.client, ID);
    const release = json.release;
    
    // Find color in colors.json, default (electronic) color if there is no match
    let color = this.client.colors[release.genreSecondary.toLowerCase()] ?? 'b9b9b9';
  
    // Detect content creator availability and content warnings and mark accordingly
    //const CC = await creatorFriendly(this.client, json.tracks ?? [], row.Track);
    /*const embedDesc = (this.client.licensability[release.explicit] ?? this.client.licensability["default"])
                  + "\n"
                  + (this.client.contentWarning[row.E] ?? this.client.contentWarning["default"]);*/
    
    //const release = json.name !== 'error' ? json.release : {"id": ""};
    const coverImage = await this.client.handler.getCover(this.client, release.id);

    let releaseTypeAddon = release.type == "EP" ? "EP" : release.type == "Album" ? "LP" : "";

    let d = new Date(Date.parse(release.releaseDate));
    let releaseDate = this.client.dateformat(d, "ddd dS mmm yyyy");
    
    let totalDuration = 0;
    let tracklist = [];

    json.tracks.forEach(track => {
      tracklist.push([`${track.trackNumber}. ${track.artistsTitle} - ${track.title}`, `Genre: **${track.genreSecondary}**, Duration: **${this.timeFormat(track.duration)}**`]);
      totalDuration += track.duration;
    });

    // Build the embed
    embed
      .setColor(color)
      .setTitle(`${release.artistsTitle} - ${release.title} ${releaseTypeAddon}`)
      .setURL(`https://monstercat.com/release/${ID}`)
      
      .addField(`**Primary Genre:**`, `${release.genreSecondary}`, true)
      .addField(`**Runtime:**`, `${this.timeFormat(totalDuration)}`, true)
      
      .addField(`**Catalog ID:**`,    `${ID}`, true)
      .addField(`**Release Type:**`,  `${release.type}`, true)

      .addField(`**Release Date:**`,  `${releaseDate}`, false)

      .attachFiles(coverImage)
      .setThumbnail('attachment://cover.jpg')
    ;

    tracklist.forEach(track => {
      embed.addField(track[0], track[1]);
    });

    try
    {
      const chl = this.client.channels.cache.get(postChannel);

      await chl.send(embed).catch(console.error);
    }
    catch (err)
    {
        await this.client.handler.throw(this.client, err, message);
    }
  }

  timeFormat(duration)
  {   
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
  }
}