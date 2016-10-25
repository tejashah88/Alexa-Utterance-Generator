function intentUtteranceExpander(originalPhrase) {
	if (Array.isArray(originalPhrase)) {
		return originalPhrase.map(intentUtteranceExpander);
	}

	const phrasePartsRegex = /\{\(.*?\)\}+|\{.*?\}+|\(.*?\)+|[^[\s]+/gi;
	const slotRegex = /^\{.*\}$/i;
	const expandSlotRegex = /\(.*\|.*\)/gi;
	const expandSlotWordRegex = /([^||()]+)/gi;
	const singleWordInsideExpandSlotRegex = /\((\w+)\)/gi;
	const wordsInsideExpandSlotRegex = /([^||()]+)/gi;
	const wordsInsideSlotRegex = /\{\((.*)\).*\|.*\}/i;
	const insideParensRegex = /\(.*\)/i;

	function expand(phrase) {
		if (typeof phrase !== 'string') {
			return [];
		}

		singleWordInsideExpandSlotRegex.lastIndex = 0;
		phrase = phrase.replace(singleWordInsideExpandSlotRegex, '$1');

		phrasePartsRegex.lastIndex = 0;
		const parts = phrase.match(phrasePartsRegex);
		const phrases = [];

		if (Array.isArray(parts)) {
			for (var i = 0; i < parts.length; i++) {
				expandSlotRegex.lastIndex = 0;
				slotRegex.lastIndex = 0;
				var part = parts[i];

				if (expandSlotRegex.test(part)) {

					if (slotRegex.test(part)) {
						wordsInsideSlotRegex.lastIndex = 0;
						const wordsMatch = part.match(wordsInsideSlotRegex);

						if (Array.isArray(wordsMatch) && wordsMatch[1]) {
							const words = wordsMatch[1].split('|');

							for (var j = 0; j < words.length; j++) {
								insideParensRegex.lastIndex = 0;
								const slot = part.replace(insideParensRegex, words[j]);
								var copy = parts.slice(0);

								copy.splice(i, 1, slot);
								phrases.push(copy);
							}
						}
					} else {
						wordsInsideExpandSlotRegex.lastIndex = 0;
						const words = part.match(wordsInsideExpandSlotRegex);

						for (var j = 0; j < words.length; j++) {
							var word = words[j];
							var copy = parts.slice(0);

							copy.splice(i, 1, word);
							phrases.push(copy);

							// remove word, ie. (|foo)
							if (words.length === 1) {
								copy = parts.slice(0);
								copy.splice(i, 1);
								phrases.push(copy);
							}
						}
					}

					break;
				}
			}

			if (!phrases.length) {
				return [phrase];
			}

			const joinedPhrases = phrases.map(function(p) {
				return p.join(' ');
			});

			return joinedPhrases.reduce(function(acc, p, i) {
				expandSlotRegex.lastIndex = 0;
				if (expandSlotRegex.test(p)) {
					acc[i] = expand(p);
				}

				return acc;
			}, joinedPhrases).reduce(function(a, b) {
				return a.concat(b);
			}, []);
		} else {
			return [phrase];
		}
	}

	return expand(originalPhrase);
}

function intentUtteranceGenerator(intents) {
	var utterancesCollection = '';

	if (!(intents instanceof Object) || Array.isArray(intents)) {
		return (utterancesCollection);
	}

	var intentsSize = Object.keys(intents).length;
	var i = 0;

	for (var intent in intents) {
		i++;

		var lines = intents[intent];
		var newline = i < intentsSize ? '\n' : '';

		if (Array.isArray(lines)) {
			var collection = lines.map(function(line) {
				return expand(intent, line);
			});

			utterancesCollection += (collection.join('') + newline);
		} else if (typeof lines === 'string') {
			utterancesCollection += (expand(intent, lines) + newline);
		}
	}

	function expand(intent, line) {
		var intentUtterances = intentUtteranceExpander(line).reduce(function(intentUtterance, phrase) {
			var utterance = intent + ' ' + phrase;
			return intentUtterance += (utterance + '\n');
		}, '');

		return intentUtterances;
	}

	return (utterancesCollection);
}