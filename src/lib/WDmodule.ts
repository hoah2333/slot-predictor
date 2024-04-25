import axios from 'axios';
import type { AxiosResponse } from 'axios';

class WDmodule {
	public base: string;
	public ajax: string;
	constructor(base: string) {
		this.base = base;
		this.ajax = `${base}/ajax-module-connector.php`;
	}

	async ajaxPost(params: any, moduleName: string) {
		const wikidotToken7 = Math.random().toString(36).substring(4).toLowerCase();
		const cookie = `wikidot_token7=${wikidotToken7};`;
		let response: AxiosResponse = await axios({
			method: 'post',
			url: `${this.base}/ajax-module-connector.php`,
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

		return response;
	}
}

export default WDmodule;
