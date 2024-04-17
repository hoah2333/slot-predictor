<script lang="ts">
	import * as fs from 'fs';
	let configJson: [
		{
			title: string;
			link: string;
			author: string;
			rating: number;
			slots: number[];
		}
	] = JSON.parse(fs.readFileSync('src/lib/config.json', 'utf-8'));
	let time = JSON.parse(fs.readFileSync('src/lib/time.json', 'utf-8')).time;
	let selectedSlot: number[] = [];
	let selectedIndex: number[] = [];
	let selected: Set<number> = new Set();
	configJson.forEach((config, index) => {
		if (index == 0) {
			selected.add(100);
			selectedSlot.push(1000);
			selectedIndex.push(0);
		} else {
			let loopCount: number = 0;
			for (let slot of config.slots) {
				loopCount++;
				if (!selected.has(slot)) {
					selected.add(slot);
					selectedSlot.push(slot);
					selectedIndex.push(loopCount);
					break;
				}
			}
		}
	});
</script>

<div id="main-wrapper">
	<h1 class="title">编号预测器</h1>
	<div class="info">
		<h4>页面上次更新时间：{new Date(time).toLocaleString()}</h4>
	</div>
	<div class="component-wrapper">
		{#each configJson as config, index}
			<div class="predicts">
				<div class="link">
					<span class="index">#{index + 1}</span>
					<a
						href="https://backrooms-wiki-cn.wikidot.com{config.link}"
						target="_blank"
						rel="noreferrer noopener"
					>
						Level C-{index == 0 ? 1000 : selectedSlot[index]} - {config.title}
					</a>
					（{config.rating > 0 ? `+${config.rating}` : config.rating}）
				</div>
				<div class="author">作者：{config.author}</div>
				<div class="slots">
					<details>
						<summary>要求编号（按顺序列出）</summary>
						<div class="blockquote">
							{#each config.slots as slot, jndex}
								{#if jndex + 1 < selectedIndex[index]}
									<del>{slot}</del>{config.slots.length == jndex + 1 ? '' : ','}&nbsp;
								{:else}
									{slot}{config.slots.length == jndex + 1 ? '' : ','}&nbsp;
								{/if}
							{/each}
						</div>
					</details>
				</div>
			</div>
			<hr />
		{/each}
	</div>
</div>

<style lang="scss" type="text/scss">
	@import './page';
</style>
