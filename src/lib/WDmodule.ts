import WDmethod from './WDmethod';

class WDmodule {
	public base: string;
	public wdMethod: any;
	constructor(base: string) {
		this.base = base;
		this.wdMethod = new WDmethod(base);
	}

	async login(username: string, password: string) {
		return await this.wdMethod.login(username, password);
	}

	async getListpages(params: any) {
		return await this.wdMethod.ajaxPost(params, 'list/ListPagesModule');
	}

	async getThreadId(page: number, params?: any) {
		let pageId = await this.wdMethod.getPageId(page);
		return await this.wdMethod.ajaxPost(
			Object.assign(
				{
					page_id: pageId,
					action: 'ForumAction',
					event: 'createPageDiscussionThread'
				},
				params
			),
			'Empty'
		);
	}
}

export default WDmodule;
