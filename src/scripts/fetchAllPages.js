const { fetchData } = require("../helpers/fetchData");
const { filterEpisodes } = require("../helpers/filterEpisodes");
const {
  extractYearFromAired,
  extractYearFromNewgogo,
} = require("../helpers/extractYear");
const { storeInFirestore } = require("../helpers/processEpisodes");

async function fetchAllPages() {
  // Fetch the first page to get total pages
  const response = await fetchData(
    "https://vimal-two.vercel.app/api/az-list?page=1"
  );
  const totalPages = response.results.totalPages;

  console.log(`Total Pages: ${totalPages}`);

  for (let page = 1; page <= totalPages; page++) {
    const pageData = await fetchData(
      `https://vimal-two.vercel.app/api/az-list?page=${page}`
    );

    for (const anime of pageData.results.data) {
      const animeId = anime.data_id;

      // Fetch and process anime details here
      const aniWatchEpisodeUrl = `https://aniwatch-api-8fti.onrender.com/anime/episodes${animeId}`;
      const aniwatchEpi = await fetchData(aniWatchEpisodeUrl);

      // Process each episode
      for (const episode of aniwatchEpi.episodes) {
        const episodeId = episode.episodeId;

        let newgogoEpisodeDetails = null;
        let episodeParts = episodeId.split("?")[0].split("-");

        while (episodeParts.length > 0) {
          try {
            // Attempt to fetch data from newgogo with the current episodeParts
            const episodeUrl = `https://newgogo.vercel.app/${episodeParts.join(
              "-"
            )}`;
            newgogoEpisodeDetails = await fetchData(episodeUrl);

            // If data is found, break out of the loop
            if (
              newgogoEpisodeDetails &&
              newgogoEpisodeDetails.results.length > 0
            ) {
              console.log(`Data found for episode ${episodeParts.join("-")}`);
              break;
            } else {
              console.log(
                `No data for ${episodeParts.join("-")}, reducing parts...`
              );
            }
          } catch (error) {
            console.error(
              `Error fetching data for ${episodeParts.join("-")}: ${
                error.message
              }`
            );
          }

          // If no data found, reduce episodeParts and try again
          episodeParts.pop();
        }

        // If data was not found even after all reductions, log the error and continue to the next episode
        if (!newgogoEpisodeDetails || !newgogoEpisodeDetails.results) {
          console.error(`No data found for episodeId: ${episodeId}`);
          continue; // Skip to the next episodeId
        }
        if (newgogoEpisodeDetails) {
          let dubId;
          let subId;

          // Fetch additional anime details and compare release years
          const aniWatchInfo = `https://aniwatch-api-8fti.onrender.com/anime/info?id=${animeId}`;
          const animeInfo = await fetchData(aniWatchInfo);

          // Extract the release year from AniWatch
          const aniwatchRelease = await extractYearFromAired(
            animeInfo.anime.moreInfo.aired
          );

          // Map through each result and extract the year from the releaseDate field
          const newgogoReleases = newgogoEpisodeDetails.results.map(
            (result) => {
              const releaseYear = extractYearFromNewgogo(result.releaseDate);
              return { ...result, releaseYear }; // Add the extracted year to the object
            }
          );

          // Iterate over each result in newgogoReleases
          newgogoReleases.forEach((result) => {
            // Compare the release year with aniwatchRelease
            if (result.releaseYear === aniwatchRelease) {
              if (result.subOrDub === "sub") {
                subId = result.id;
              }
              if (result.subOrDub === "dub") {
                dubId = result.id;
              }
            }
          });

          if (!aniwatchRelease) {
            const seasonPattern = /(\d+(?:st|nd|rd|th)?-season)/gi;

            // Check if animeId matches the season pattern
            const matchedAnimeSeason = animeId.match(seasonPattern);

            if (matchedAnimeSeason) {
              newgogoReleases.forEach((result) => {
                // Check if result.id matches the season pattern
                const matchedResultSeason = result.id.match(seasonPattern);

                // Proceed only if both animeId and result.id match the same season pattern
                if (
                  matchedResultSeason &&
                  matchedAnimeSeason[0] === matchedResultSeason[0]
                ) {
                  // If we already have a subId or dubId for this season, skip further processing
                  if (subId || dubId) return;

                  // Now both matched parts are the same, and we haven't selected an ID yet
                  if (result.subOrDub === "sub" && !subId) {
                    subId = result.id;
                  }

                  if (result.subOrDub === "dub" && !dubId) {
                    dubId = result.id;
                  }
                }
              });
            }

            // Now subId and dubId will contain the first matched ID for the corresponding sub or dub.
            console.log("First Sub ID:", subId);
            console.log("First Dub ID:", dubId);
          }

          let dubEpisodes;
          let subEpisodes;
          if (subId) {
            subEpisodes = await fetchData(
              `https://newgogo.vercel.app/info/${subId}`
            );
          }
          if (dubId) {
            dubEpisodes = await fetchData(
              `https://newgogo.vercel.app/info/${dubId}`
            );
          }
          // Fetch dub and sub episode details

          // Filter episodes
          let DubStreamUrl = "";
          let streamingDub = "";
          let filteredDubEpisodes = "";
          if (dubEpisodes) {
            filteredDubEpisodes = filterEpisodes(
              dubEpisodes.episodes,
              animeInfo.anime.info.stats.totalEpisodes,
              animeInfo.anime.info.stats.type
            );
            if (
              dubEpisodes.some(
                (subEpisode) => subEpisode.episodes.number === episode.number
              )
            ) {
              DubStreamUrl = `https://newgogo.vercel.app/watch/${
                filteredDubEpisodes[episode.number - 1].id
              }`;
              streamingDub = await fetchData(DubStreamUrl);
            }
          }
          let SubStreamUrl = "";
          let streamingSub = "";
          let filteredSubEpisodes = "";
          if (subEpisodes) {
            filteredSubEpisodes = filterEpisodes(
              subEpisodes.episodes,
              animeInfo.anime.info.stats.totalEpisodes,
              animeInfo.anime.info.stats.type
            );
            if (
              subEpisodes.episodes.some(
                (subEpisode) => subEpisode.number === episode.number
              )
            ) {
              SubStreamUrl = `https://newgogo.vercel.app/watch/${
                filteredSubEpisodes[episode.number - 1].id
              }`;
              streamingSub = await fetchData(SubStreamUrl);
            }
          }

          const resp = await fetchData(
            `https://vimal-two.vercel.app/api/stream?id=${episodeId}`
          );
          const vimalData = resp.results.streamingInfo;

          const filteredSub = vimalData.filter(
            (info) =>
              info.status === "fulfilled" &&
              info.value.decryptionResult.type === "sub" &&
              info.value.decryptionResult.server === "HD-1"
          );

          const filteredDub = vimalData.filter(
            (info) =>
              info.status === "fulfilled" &&
              info.value.decryptionResult.type === "dub" &&
              info.value.decryptionResult.server === "HD-1"
          );

          console.log("Filtered Subtitles:", filteredSub);
          console.log("Filtered Dub:", filteredDub);

          // Store in Firestore
          await storeInFirestore(episodeId, {
            animeInfo,
            streamingSub,
            streamingDub,
            aniwatchEpi,
            filteredDub,
            filteredSub,
          });
        }
      }
    }
  }
}

fetchAllPages();
