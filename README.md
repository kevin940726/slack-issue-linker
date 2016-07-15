# slack-issue-linker
:point_right: Give me the link of an issue!

## Usage
1. Invite your bot to your channel.

  ```/invite @issue```
2. Set up url mapping.

	```issue set[-url] [repo] url```
	For example:
	```
	issue set https://github.com/kevin940726/slack-issue-linker
	issue set website https://gitlab.com/give543/website
	issue set-url ios https://gitlab.com/give543/ios
	issue set android give543/android
	```
	These would create a mapping to...
	- default -> https://github.com/kevin940726/slack-issue-linker
	- website -> https://gitlab.com/give543/website
	- ios -> https://gitlab.com/give543/ios
	- android -> https://github.com/give543/android
	
3. Call your issue with `#`.
	
	- #12 -> https://github.com/kevin940726/slack-issue-linker/issues/12
	- website#2 -> https://gitlab.com/give543/website/issues/2
	- ...etc

## License
MIT
