const https = require('https');
const fs = require('fs');
const path = require('path');

const file_path = path.resolve(__dirname, "google-translate-api", "languages.js");

const req = https.request("https://cloud.google.com/translate/docs/languages", res => {

	let data = "";

	res.on("data", chunk => {
		data += chunk;
	});

	res.on("end", () => {
		const languagesHTML = data.slice(data.indexOf("<tbody>") + 7, data.indexOf("</tbody>"));
		const parsedLanguages = parseLanguages(languagesHTML).sort( (a, b) => a[1].localeCompare(b[1]));
		for (lang of parsedLanguages) {
			console.info(lang);
		}
		addLanguages(parsedLanguages);
	});
});

req.end();

function parseLanguages (languagesHTML) {
	let name = languagesHTML.slice(languagesHTML.indexOf("<td>") + 4, languagesHTML.indexOf("</td>"));
	let iso = languagesHTML.slice(languagesHTML.indexOf('<td><code translate="no" dir="ltr">') + 35, languagesHTML.indexOf("</code>"));
	
	//Inconsistencies fixed:
	switch (iso) {
		case "he": 
			iso = "iw";
			break;
		case "jv":
			iso = "jw";
			break;
		case "pt": 
			name = "Portuguese";
			break;
		case "tl":
			name = "Filipino";
			break;
		case "ny":
			name = "Chichewa";
			break;
		case "ku":
			name = "Kurdish (Kurmanji)";
			break;
		case "si":
			name = "Sinhala";
			break;
	}
	
	languagesHTML = languagesHTML.slice(languagesHTML.indexOf("</tr>") + 5);
	const parsedLanguages = [ [iso, name] ];
	if (languagesHTML.indexOf("</tr>") !== -1) {
		parsedLanguages.push(...parseLanguages(languagesHTML));
	} else {
		parsedLanguages.push(["la", "Latin"]);
	}
	return parsedLanguages;
}

function addLanguages (languages) {
	const file = fs.readFileSync(file_path);
	const start = file.slice(0, file.indexOf("'auto': 'Automatic',") + 20);
	const end = file.slice(file.indexOf("\n}"));
	languages.forEach( (lang, i) => {
		languages[i] = `\n    '${lang[0]}': '${lang[1]}'`
	});
	languages = languages.join(",");
	fs.writeFileSync(file_path, start + languages + end);
}