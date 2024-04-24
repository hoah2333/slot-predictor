import axios from 'axios';
import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import type { PageServerLoad } from './$types';
import { deductedAuthors } from '$lib/deductedAuthors';

const fetchUrl: string = 'https://backrooms-wiki-cn.wikidot.com/author:hoah2333';
let updateTime: Date = new Date();
let slotConfigs: {
	title: string;
	link: string;
	author: string;
	rating: number;
	slots: number[];
}[] = [];

await mainFunc();

async function mainFunc(): Promise<void> {
	console.log(`${new Date().toLocaleString()} - 程序开始运行`);
	setInterval(async () => {
		updateTime = new Date();
		const $: cheerio.CheerioAPI = await pageFetch(fetchUrl);
		await pageProcess($);
		console.log(`${new Date().toLocaleString()} - 预测已更新`);
	}, 300000);
}

async function pageFetch(fetchUrl: string): Promise<cheerio.CheerioAPI> {
	console.log(`${new Date().toLocaleString()} - 页面获取中 - ${fetchUrl}`);
	let response: AxiosResponse = await axios({
		method: 'get',
		url: fetchUrl
	});

	// 不能让上一个 get 进程与下一个 get 进程之间间隔太小，否则会报 socket hang up
	// 在这里 sleep(1000) 就可以解决问题
	await new Promise((sleep) => setTimeout(sleep, 1000));

	return cheerio.load(response.data);
}

async function pageProcess($: cheerio.CheerioAPI): Promise<void> {
	slotConfigs = [];
	let titles: string[] = [],
		links: string[] = [],
		authors: string[] = [],
		ratings: number[] = [];
	titles = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(1) a')
		.map(function () {
			let matchResult: RegExpMatchArray | null = $(this)
				.text()
				.match(/“[^”]+”/);
			return matchResult != null ? matchResult[0].slice(1, -1) : $(this).text();
		})
		.get();
	links = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(1) a')
		.map(function () {
			return $(this).prop('href');
		})
		.get();
	authors = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(2) a:nth-of-type(2)')
		.map(function () {
			return $(this).prop('innerText');
		})
		.get();
	ratings = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(3)')
		.map(function () {
			return parseInt($(this).text());
		})
		.get();

	links.forEach(async (link, i) => {
		let slots: number[] = await slotProcess(links[i], authors[i]);
		if (deductedAuthors.includes(authors[i])) {
			ratings[i] *= 0.93;
		}
		slotConfigs.push({
			title: titles[i],
			link: links[i],
			author: authors[i],
			rating: ratings[i],
			slots: slots
		});
	});
	await new Promise((sleep) => setTimeout(sleep, 8000));
	slotConfigs.sort((a, b) => b.rating - a.rating);
}

async function slotProcess(link: string, author: string): Promise<number[]> {
	const page$: cheerio.CheerioAPI = await pageFetch(
		`https://backrooms-wiki-cn.wikidot.com${link}/norender/true`
	);
	const discussLink: string[] | null = page$('#page-options-bottom #discuss-button')
		.map(function () {
			return page$(this).prop('href');
		})
		.get();
	let discussNum: string = discussLink[0].split('/')[2];
	const discussXML: cheerio.CheerioAPI = await pageFetch(
		`https://backrooms-wiki-cn.wikidot.com/feed/forum/${discussNum}.xml`
	);

	let slots: number[] = discussXML('channel item')
		.map(function (index) {
			if (discussXML(this).find('wikidot\\:authorName').text() == author) {
				let matchResult: RegExpMatchArray | null = discussXML(this)
					.find('content\\:encoded')
					.text()
					.match(/(?<!\d)1\d{3}(?!\d)/g);
				return matchResult;
			}
		})
		.get()
		.filter((slot) => slot != '1000')
		.map((slot) => parseInt(slot));
	return slots[0] == undefined ? [1001] : slots;
}

export const load: PageServerLoad = async () => {
	return {
		slotConfigs: slotConfigs,
		time: updateTime
	};
};
