import axios from 'axios';
import { AxiosError, type AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import type { PageServerLoad } from './$types';
import { deductedAuthors } from '$lib/deductedAuthors';
import WDmodule from '$lib/WDmodule';
import WDmethod from '$lib/WDmethod';
import * as fs from 'fs';

let updateTime: Date = new Date();
let slotConfigs: {
	title: string;
	link: string;
	author: string;
	rating: number;
	slots: number[];
}[] = [];

let wdModule: any = new WDmodule('https://backrooms-wiki-cn.wikidot.com');
let wdMethod: any = new WDmethod('https://backrooms-wiki-cn.wikidot.com');

const config: {
	username: string;
	password: string;
} = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

try {
	await wdMethod.login(config.username, config.password);
} catch (error: any) {
	console.error(error);
}

await mainFunc();

async function mainFunc(): Promise<void> {
	console.log(`${new Date().toLocaleString()} - 程序开始运行`);
	// setInterval(async () => {
	updateTime = new Date();
	let listPages = await wdModule.getListpages({
		category: 'thous',
		order: 'rating desc',
		perPage: '100',
		separate: 'false',
		tags: '+1k竞赛 +原创 -竞赛 -中心 -艺术作品',
		prependLine: '||~ 名称 ||~ 创建者 ||~ 分数 ||',
		module_body: `|| %%title_linked%% || [[*user %%created_by%%]] || %%rating%% ||`
	});
	await pageProcess(cheerio.load(listPages.data.body));
	console.log(`${new Date().toLocaleString()} - 预测已更新`);
	// }, 60000);
}

async function pageFetch(fetchUrl: string): Promise<cheerio.CheerioAPI> {
	// console.log(`${new Date().toLocaleString()} - 正在获取 ${fetchUrl}`);
	let response: AxiosResponse | null = null;
	try {
		response = await axios({
			method: 'get',
			url: fetchUrl
		});
	} catch (error: any) {
		if (error instanceof AxiosError)
			console.error(
				`在获取 ${error.request._currentUrl} 时出现 ${error.code} 错误，原因：${error.cause}`
			);
	} finally {
		// 不能让上一个 get 进程与下一个 get 进程之间间隔太小，否则会报 socket hang up
		// 在这里 sleep(1000) 就可以解决问题
		await new Promise((sleep) => setTimeout(sleep, 1000));
	}

	if (response != null) {
		return cheerio.load(response.data);
	} else {
		console.error(`获取页面失败`);
		return cheerio.load('<h1>获取页面失败</h1>');
	}
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
			ratings[i] = parseFloat((ratings[i] * 0.93).toFixed(2));
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
	// console.log(`${new Date().toLocaleString()} - 正在获取 ${link}`);
	let discussNum: string = (await wdModule.getThreadId(link)).data.thread_id;
	const discussXML: cheerio.CheerioAPI = await pageFetch(
		`https://backrooms-wiki-cn.wikidot.com/feed/forum/t-${discussNum}.xml`
	);

	let slots: number[] = discussXML('channel item')
		.map(function () {
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
