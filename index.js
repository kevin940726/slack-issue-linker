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

	console.log(repo, url);

	ref.update({
		[`${channel}/${repo}`]: url.slice(1, url.length - 1),
	});

	bot.api.chat.postMessage({
		text: '',
		username: `Issue Setting`,
		icon_url: 'http://nas25lol.myqnapcloud.com:10088/assets/gitlab_logo-cdf021b35c4e6bb149e26460f26fae81e80552bc879179dd80e9e9266b14e894.png', // eslint-disable-line max-len
		channel,
		attachments: [{
			text: `Mapped ${repo} to ${url}.`,
		}],
	});
});

controller.hears('([^\\s]+)?#(\\d+)', ['message_received', 'direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;
	const regex = /([^\s]+)?#(\d+)/gi;
	const text = message.text;
	let match;
	const matches = [];

	while (match = (regex.exec(text))) {
		matches.push({
			repo: match[1] || 'default',
			issue: match[2],
		});
	}

	ref.child(channel).once('value', snapshot => {
		const urls = snapshot.val();

		const attachments = matches
			.map(m => ({
				repo: m.repo,
				issue: m.issue,
				url: urls[m.repo],
			}))
			.filter(m => m.url)
			.map(({ repo, url, issue }) => ({
				text: `<${url}/issues/${issue}|${repo === 'default' ? '' : repo}#${issue}>`,
				parse: 'none',
			}));

		if (urls) {
			bot.api.chat.postMessage({
				text: '',
				username: `Issue Link${matches.length > 1 ? 's' : ''}`,
				icon_url: 'http://nas25lol.myqnapcloud.com:10088/assets/gitlab_logo-cdf021b35c4e6bb149e26460f26fae81e80552bc879179dd80e9e9266b14e894.png', // eslint-disable-line max-len
				channel,
				attachments,
			});
		}
	});
});
