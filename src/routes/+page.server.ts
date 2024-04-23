import axios from 'axios';
import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { slotsJson } from '$lib/slots';
import type { PageServerLoad } from './$types';

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

async function mainFunc() {
    console.log(`${new Date().toLocaleString()} - 程序开始运行`);
    setInterval(async () => {
        updateTime = new Date();
        const $ = await pageFetch(fetchUrl);
        pageProcess($);
        console.log(`${new Date().toLocaleString()} - 预测已更新`);
    }, 60000);
}

async function pageFetch(fetchUrl: string) {
    console.log(`${new Date().toLocaleString()} - 页面获取中`);
    const response: AxiosResponse = await axios.get(fetchUrl);
    const $: cheerio.CheerioAPI = cheerio.load(response.data);
    return $;
}

function pageProcess($: cheerio.CheerioAPI) {
    slotConfigs = [];
    let titles: string[] = [],
        links: string[] = [],
        authors: string[] = [],
        ratings: number[] = [];
    titles = $('.wiki-content-table:nth-of-type(1) tbody tr td:nth-of-type(1) a')
        .map(function () {
            let matchResult = $(this)
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

    titles.forEach((_, i) => {
        let slots: number[] = [];
        slotsJson.forEach((_, j) => {
            if (links[i] == slotsJson[j].link) {
                slots = slotsJson[j].slots;
            }
        });
        if (slots[0] == undefined) {
            slots = [1001, 1002, 1003, 1004, 1005];
        }

        slotConfigs.push({
            title: titles[i],
            link: links[i],
            author: authors[i],
            rating: ratings[i],
            slots: slots
        });
    });
}

export const load: PageServerLoad = async () => {
	return {
		slotConfigs: slotConfigs,
		time: updateTime
	};
};
