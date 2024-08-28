function extractYearFromAired(aired) {
    const datePart = aired.includes("to") ? aired.split("to")[0].trim() : aired;
    const yearMatch = datePart.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : null;
  }
  
  function extractYearFromNewgogo(releaseDate) {
    const yearMatch = releaseDate ? releaseDate.match(/\d{4}/) : '';
    return yearMatch ? yearMatch[0] : null;
  }
  
  module.exports = { extractYearFromAired, extractYearFromNewgogo };
  