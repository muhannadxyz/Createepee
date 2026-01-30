<script lang="ts">
	import { trimRange } from '$lib/stores/videoEditor.store';
	import { formatTime } from '$lib/utils/time';

	$: startValue = $trimRange.startTime;
	$: endValue = $trimRange.endTime;

	const readNumber = (event: Event) => Number((event.target as HTMLInputElement).value);

	const updateStart = (value: number) => {
		trimRange.update((range) => ({ ...range, startTime: value }));
	};

	const updateEnd = (value: number) => {
		trimRange.update((range) => ({ ...range, endTime: value }));
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-2">
	<h3 class="text-sm font-semibold">Timeline</h3>
	<div class="text-xs text-[#9aa]">Trim range: {formatTime($trimRange.startTime)} - {formatTime($trimRange.endTime)}</div>
	<div class="grid grid-cols-2 gap-3 text-xs">
		<label class="flex flex-col gap-1">
			Start
			<input
				type="number"
				min="0"
				step="0.1"
				value={startValue}
				on:input={(e) => updateStart(readNumber(e))}
				class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
			/>
		</label>
		<label class="flex flex-col gap-1">
			End
			<input
				type="number"
				min="0"
				step="0.1"
				value={endValue}
				on:input={(e) => updateEnd(readNumber(e))}
				class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
			/>
		</label>
	</div>
</div>
