// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6guDP4jzMDLBx3WcG3x8Ht0tjO1EIMc0",
  authDomain: "idatori-dd67f.firebaseapp.com",
  databaseURL: "https://idatori-dd67f-default-rtdb.firebaseio.com",
  projectId: "idatori-dd67f",
  storageBucket: "idatori-dd67f.appspot.com",
  messagingSenderId: "481926700896",
  appId: "1:481926700896:web:6c5c913996c4cb3abd8805",
  measurementId: "G-8CZE6KPNWW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore

module.exports = { db }; // Export the Firestore instance
