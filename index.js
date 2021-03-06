const { slackbot } = require('botkit');
const firebase = require('firebase');

const BASE_URL = process.env.BASE_URL || 'https://github.com/';

firebase.initializeApp({
	databaseURL: process.env.DATABASE_URL,
});

const db = firebase.database();
const ref = db.ref('link-map');

const ts = {};

const controller = slackbot({ debug: false });

controller.spawn({ token: process.env.TOKEN }).startRTM();

controller.hears('^(issue )?(?:ls|list)$', ['direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;

	if (message.match[1] || message.event === 'direct_mention') {
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
				icon_url: process.env.ICON_URL,
				channel,
				attachments,
			});
		});
	}
});

controller.hears('^(issue )?set(?:-url)? ([^\\s]+) ?([^\\s]+)?$', ['direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;

	if (message.match[1] || message.event === 'direct_mention') {
		let repo = 'default';
		let url = message.match[2];

		if (message.match[3]) {
			repo = message.match[2];
			url = message.match[3];
		}

		url = url.charAt(0) === '<' ? url.slice(1, url.length - 1) : `${BASE_URL}/${url}`;

		console.log(repo, url);

		ref.update({
			[`${channel}/${repo}`]: url,
		});

		bot.api.chat.postMessage({
			text: '',
			username: `Issue Setting`,
			icon_url: process.env.ICON_URL,
			channel,
			attachments: [{
				text: `:ok_hand: Mapped *${repo}* to ${url}.`,
				mrkdwn_in: ['text'],
			}],
		});
	}
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

		ts[channel] = ts[channel] || {};

		const attachments = matches
			.filter(m => {
				const hash = `${m.group}/${m.repo}/${m.issue}`;
				// abandom if exists and less than 10 minutes
				if (ts[channel][hash] && ts[channel][hash] - Date.now() < 60000) {
					return false;
				}
				ts[channel][hash] = Date.now();
				return true;
			})
			.filter((m, i, a) => a.indexOf(m) === i)
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
				icon_url: process.env.ICON_URL,
				channel,
				attachments,
			});
		}
	});
});
