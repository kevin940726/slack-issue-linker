const { slackbot } = require('botkit');
const firebase = require('firebase');
const token = require('./slackToken.json').token;

firebase.initializeApp({
	serviceAccount: './serviceAccountCredentials.json',
	databaseURL: 'https://resplendent-inferno-1298.firebaseio.com/',
});

const db = firebase.database();
const ref = db.ref('link-map');

const controller = slackbot({
	debug: false,
});

controller.spawn({ token }).startRTM();

controller.hears('^issue set-url ([^\\s]+) ?([^\\s]+)?$', ['message_received', 'ambient'], (bot, message) => {
	const channel = message.channel;
	let repo = 'default';
	let url = message.match[1];

	if (message.match[2]) {
		repo = message.match[1];
		url = message.match[2];
	}

	ref.update({
		[`${channel}/${repo}`]: url.slice(1, url.length - 1),
	});

	bot.reply(message, `set ${repo} to ${url}.`);
});

controller.hears('([^\\s]+)?#(\\d+)', ['message_received', 'direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;
	const repo = message.match[1] || 'default';
	const issue = message.match[2];

	ref.child(channel).child(repo).once('value', snapshot => {
		bot.reply(message, `${snapshot.val()}/issues/${issue}`);
	});
});
