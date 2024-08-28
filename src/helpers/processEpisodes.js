const { db } = require('../config/firebase');
const { collection, doc, setDoc } = require('firebase/firestore');

async function storeInFirestore(episodeId, data) {
  try {
    const docRef = doc(collection(db, 'episodes'), episodeId);
    await setDoc(docRef, data);
    console.log(`Stored data for episodeId ${episodeId}`);
  } catch (error) {
    console.error(`Error storing data for episodeId ${episodeId}:`, error);
  }
}

module.exports = { storeInFirestore };
