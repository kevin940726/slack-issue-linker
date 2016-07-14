const { slackbot } = require('botkit');

const DB = {};

const controller = slackbot({
	debug: false,
});

controller.spawn({
	token: 'xoxb-59685306928-TttmiDAVewuj5vuIhsJ45N3G',
}).startRTM();

controller.hears('^issue set-url ([^\\s]+) ?([^\\s]+)?$', ['message_received', 'ambient'], (bot, message) => {
	const channel = message.channel;
	let repo = 'default';
	let url = message.match[1];

	if (message.match[2]) {
		repo = message.match[1];
		url = message.match[2];
	}

	DB[channel] = Object.assign({}, DB[channel], {
		[repo]: url.slice(1, url.length - 1),
	});

	console.log(JSON.stringify(DB, null, '  '));
	bot.reply(message, `set ${repo} to ${url}.`);
});

controller.hears('([^\\s]+)?#(\\d+)', ['message_received', 'direct_mention', 'ambient'], (bot, message) => {
	const channel = message.channel;
	const repo = message.match[1] || 'default';
	const issue = message.match[2];

	bot.reply(message, `${DB[channel][repo]}${issue}`);
});
