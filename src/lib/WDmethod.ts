import axios from 'axios';
import { AxiosError, type AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

class WDmethod {
	public base: string;
	public ajax: string;
	public quick: string;
	public cookie: string;
	constructor(base: string) {
		this.base = base;
		this.ajax = `${base}/ajax-module-connector.php`;
		this.quick = `${base}/quick-module-connector.php`;
		this.cookie = '';
	}

	async login(username: string, password: string): Promise<this> {
		const wikidotToken7 = Math.random().toString(36).substring(4).toLowerCase();
		const cookie = `wikidot_token7=${wikidotToken7};`;
		let response: AxiosResponse = await axios({
			method: 'post',
			url: 'https://www.wikidot.com/default--flow/login__LoginPopupScreen',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				Cookie: cookie,
				Origin: this.base,
				Referer: 'Slot Predictor'
			},
			data: {
				callbackIndex: 0,
				wikidot_token7: wikidotToken7,
				login: username,
				password: password,
				action: 'Login2Action',
				event: 'login'
			}
		});
		let $ = cheerio.load(response.data);
		if (
			$('h2.error')
				.map(function () {
					return $(this).text();
				})
				.get()
				.join('')
				.includes('The login and password do not match.')
		) {
			throw new Error(`${new Date().toLocaleString()} - 登录失败，请检查用户名和密码`);
		}
		if (response.headers['set-cookie']) {
			let setCookie = response.headers['set-cookie'][1].split('; ');
			let session = setCookie[0];
			this.cookie = `${session}; wikidot_udsession=1;`;
		}

		return this;
	}

	async ajaxPost(params: any, moduleName: string): Promise<AxiosResponse> {
		const wikidotToken7 = Math.random().toString(36).substring(4).toLowerCase();
		const cookie = `${this.cookie} wikidot_token7=${wikidotToken7};`;
		let response: AxiosResponse = await axios({
			method: 'post',
			url: this.ajax,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				Cookie: cookie,
				Origin: this.base,
				Referer: 'Slot Predictor'
			},
			data: Object.assign(
				{
					moduleName: moduleName,
					callbackIndex: 0,
					wikidot_token7: wikidotToken7
				},
				params
			)
		});

        await new Promise((sleep) => setTimeout(sleep, 1000));

		return response;
	}

	async getPageId(page: string) {
		let response: AxiosResponse | null = null;

		try {
			response = await axios({
				method: 'get',
				url: `${page.startsWith('http') ? page : `${this.base}/${page}`}/norender/true`,
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					Cookie: this.cookie,
					Referer: 'Slot Predictor'
				},
				validateStatus: (status) => status >= 200 && status < 300
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
			let $: cheerio.CheerioAPI = cheerio.load(response.data);
			let scripts = $('head')
				.children('script')
				.filter(function (_index: number, element: cheerio.Element) {
					let html: string | null = $(element).html();
					return html != null ? html.includes('WIKIREQUEST') : false;
				})
				.get();
			let page_id: number;
			let pageIdMatchResult: RegExpMatchArray | null = $(scripts)
				.text()
				.match(/WIKIREQUEST\.info\.pageId\s*=\s*(\d+)\s*;/g);
			if (pageIdMatchResult != null) {
				page_id = parseInt(pageIdMatchResult[0].slice(26));
			} else {
				console.error(`${new Date().toLocaleString()} - 获取 pageId 失败`);
				throw new Error(`${new Date().toLocaleString()} - 获取 pageId 失败`);
			}

			return page_id;
		} else {
			console.error(`获取页面失败`);
			return cheerio.load('<h1>获取页面失败</h1>');
		}
	}
}

export default WDmethod;
