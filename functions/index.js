const functions = require('firebase-functions');
const plivo = require('plivo');
const client = new plivo.Client('YOUR_ID', 'YOUR_TOKEN');

exports.sendInvite = functions.firestore.document('invites/{phoneNumber}').onCreate(async (doc) => {
  const from = '+YOUR_PLIVO_NUMBER';
  const to = doc.data().phoneNumber;

  const text = 'You are one one of the cool kids now! 👋👋👋';

  return client.messages.create(from, to, text);
});
