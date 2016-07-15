const { slackbot } = require('botkit');
const firebase = require('firebase');
const token = require('./slackToken.json').token;

const BASE_URL = 'http://nas25lol.myqnapcloud.com:10088';

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

controller.hears('^issue (?:ls|list)', ['direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;

	ref.child(channel).once('value', snapshot => {
		const mapping = snapshot.val();

		const attachments = Object.keys(mapping)
			.map(repo => ({
				text: `*${repo}* :point_right: ${mapping[repo]}`,
				mrkdwn_in: ['text'],
			}));

		bot.api.chat.postMessage({
			text: '',
			username: `Issue List`,
			icon_url: 'http://nas25lol.myqnapcloud.com:10088/assets/gitlab_logo-cdf021b35c4e6bb149e26460f26fae81e80552bc879179dd80e9e9266b14e894.png', // eslint-disable-line max-len
			channel,
			attachments,
		});
	});
});

controller.hears('^issue set(?:-url)? ([^\\s]+) ?([^\\s]+)?$', ['message_received', 'ambient'], (bot, message) => {
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
			text: `:ok_hand: Mapped *${repo}* to ${url}.`,
			mrkdwn_in: ['text'],
		}],
	});
});

controller.hears('(?:([^\\s\\/]+)\\/)?([^\\s\\/]+)?#(\\d+)', ['direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;
	const regex = /(?:([^\s\/]+)\/)?([^\s\/]+)?#(\d+)/gi;
	const text = message.text;
	let match;
	const matches = [];

	while (match = (regex.exec(text))) {
		matches.push({
			group: match[1],
			repo: match[2] || 'default',
			issue: match[3],
		});
	}

	ref.child(channel).once('value', snapshot => {
		const urls = snapshot.val();

		const attachments = matches
			.map(m => ({
				group: m.group,
				repo: m.repo,
				issue: m.issue,
				url: urls[m.repo],
			}))
			.filter(m => m.group || m.url)
			.map(({ group, repo, url, issue }) => {
				const base = `${group ? `${BASE_URL}/${group}/${repo}` : url}`;
				const labelRepo = group ? `${group}/${repo}` : repo;
				const label = `${repo === 'default' ? '' : labelRepo}#${issue}`;

				return {
					text: `:point_right: <${base}/issues/${issue}|${label}>`,
					parse: 'none',
				};
			});

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
