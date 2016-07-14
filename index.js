const { slackbot } = require('botkit');
const firebase = require('firebase');

firebase.initializeApp({
	serviceAccount: './serviceAccountCredentials.json',
	databaseURL: 'https://resplendent-inferno-1298.firebaseio.com/',
});

const db = firebase.database();
const ref = db.ref('link-map');

const controller = slackbot({
	debug: false,
});

controller.spawn({
	token: 'xoxb-59685306928-TttmiDAVewuj5vuIhsJ45N3G',
}).startRTM();

controller.hears('([^\\s]+)?#(\\d+)', ['message_received', 'direct_mention', 'ambient'], (bot, message) => {
	const repo = message.match[1] || 'default';
	const issue = message.match[2];

	bot.reply(message, `http://nas25lol.myqnapcloud.com:10088/${repo}/issues/${issue}`);
});
