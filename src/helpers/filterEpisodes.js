function filterEpisodes(episodes, totalEpisodes, type) {
  if (type === "Special") {
    return episodes
      .filter(episode => {
        const episodeNumber = episode.number; // Use parseFloat to handle fractional numbers
        // Return episodes that have non-integer or out-of-bounds episode numbers
        return isNaN(episodeNumber) || !Number.isInteger(episodeNumber) || episodeNumber > totalEpisodes || episodeNumber < 1;
      })
      .map(episode => episode.id);
  } else {
    return episodes
      .filter(episode => {
        const episodeNumber = episode.number; // Use parseInt to ensure we only get whole numbers
        // Return episodes that are valid integers and within the episode range
        return Number.isInteger(episodeNumber) || episodeNumber >= 1 || episodeNumber <= totalEpisodes;
      })
      
  }
}

module.exports = { filterEpisodes };
