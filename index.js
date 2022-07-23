const https = require('https');
const fs = require('fs');
const path = require('path');

const js_file_path = path.resolve(__dirname, "google-translate-api", "languages.js");
const ts_file_path = path.resolve(__dirname, "google-translate-api", "index.d.ts");


const req = https.request("https://translate.google.com/", res => {

	let data = "";

	res.on("data", chunk => {
		data += chunk;
	});

	res.on("end", () => {
		let languagesString = data.slice(data.search(/AF_initDataCallback\({key: 'ds:3', hash: '.', data:/) + 50);
		languagesString = languagesString.slice(0, languagesString.indexOf("]]],") + 3);
		const parsedLanguages = addExceptions(JSON.parse(languagesString)[0]);
		addLanguagesJS(JSON.parse(JSON.stringify(parsedLanguages)));
		addLanguagesTS(parsedLanguages);
	});
});

function addExceptions(languages) {
	languages.splice(0, 0, ["auto", "Automatic"]);
	const cnIndex = languages.findIndex(lang => lang[0] === "zh-CN");
	languages[cnIndex][1] = "Chinese (Simplified)";
	languages.splice(cnIndex + 1, 0, ["zh-TW", "Chinese (Traditional)"]);
	const iwIndex = languages.findIndex(lang => lang[0] === "iw");
	languages.splice(iwIndex + 1, 0, ["he", "Hebrew"]);
	return languages;
}

req.end();

function addLanguagesJS (languages) {
	const file = fs.readFileSync(js_file_path);
	const start = file.slice(0, file.indexOf("'auto': 'Automatic',") - 5);
	const end = file.slice(file.indexOf("\n}"));
	languages.forEach( (lang, i) => {
		languages[i] = `\n    '${lang[0]}': '${lang[1]}'`;
	});
	fs.writeFileSync(js_file_path, start + languages.join(",") + end);
}

function addLanguagesTS (languages) {
	const file = fs.readFileSync(ts_file_path);
	const start = file.slice(0, file.indexOf("export enum languages {") + 23);
	const middle = file.slice(file.indexOf("export enum languages {") + 23)
	const end = middle.slice(middle.indexOf("\n  }"));
	languages.forEach( (lang, i) => {
		languages[i] = `\n    "${lang[0]}" = "${lang[1]}"`;
	});
	fs.writeFileSync(ts_file_path, start + languages.join(",") + end);
}