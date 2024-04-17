import axios from 'axios';
import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

setInterval(mainFunc, 300000);

function mainFunc() {
	const fetchUrl = 'https://backrooms-wiki-cn.wikidot.com/author:hoah2333';
	let now = new Date();
	fs.writeFile('src/lib/time.json', `{"time": "${now.toISOString()}"}`, (err) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Time Updated');
	});
	async function pageFetch(fetchUrl: string) {
		const response: AxiosResponse = await axios.get(fetchUrl);
		const $: cheerio.CheerioAPI = cheerio.load(response.data);
		return $;
	}
	const $ = pageFetch(fetchUrl);
	$.then(($) => {
		let slotsJson: [
			{
				link: string;
				slots: number[];
			}
		] = JSON.parse(fs.readFileSync('src/lib/slots.json', 'utf-8'));
		let titles: string[] = [],
			links: string[] = [],
			authors: string[] = [],
			ratings: string[] = [],
			slots: string[] = [];
		titles = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(1) a')
			.map(function () {
				let matchResult = $(this)
					.text()
					.match(/“[^”]+”/);
				return `${matchResult != null ? matchResult[0].slice(1, -1) : $(this).text()}`;
			})
			.get();
		links = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(1) a')
			.map(function () {
				return `${$(this).prop('href')}`;
			})
			.get();
		authors = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(2) a:nth-of-type(2)')
			.map(function () {
				return `${$(this).prop('innerText')}`;
			})
			.get();
		ratings = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(3)')
			.map(function () {
				return `${$(this).text()}`;
			})
			.get();

		let outputs: string = '[';
		titles.forEach((_, i) => {
			slotsJson.forEach((_, j) => {
				if (links[i] == slotsJson[j].link) {
					let slotString: string = '';
					slotString += '[';
					slotsJson[j].slots.forEach((value, i) => {
						slotString += `${value}${i == slotsJson[j].slots.length - 1 ? '' : ', '}`;
					});
					slotString += ']';
					slots.push(slotString);
				}
			});
			outputs += `
        {
            "title": "${titles[i]}",
            "link": "${links[i]}",
            "author": "${authors[i]}",
            "rating": ${ratings[i]},
            "slots": ${slots[i] == undefined ? `[1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]` : slots[i]}
        }${i == titles.length - 1 ? '' : ','}`;
		});
		outputs += '\n]';

		fs.writeFile('src/lib/config.json', outputs, (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log('Config Updated');
		});
	});
}
