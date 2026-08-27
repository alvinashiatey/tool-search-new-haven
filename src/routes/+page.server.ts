import type { PageServerLoad } from './$types';
const API_URL =
	'https://script.google.com/macros/s/AKfycbxNA_YiG2NtQ0nPjMFgZyUle_sXSyD2Q5qQpjMQPPUUABCi4fOJi2gJNJSrM6BD2isk/exec';
type ApiTool = {
	Tool?: string;
	Category?: string;
	Location?: string;
	Address?: string;
	'Access Policy'?: string;
	'Item URL'?: string;
};
type ApiResponse = { data?: Array<{ children?: ApiTool[] }> };

function shuffle<T>(items: T[]) {
	for (let index = items.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[items[index], items[randomIndex]] = [items[randomIndex], items[index]];
	}
	return items;
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
	try {
		const response = await fetch(API_URL, { signal: AbortSignal.timeout(12000) });
		if (!response.ok) throw new Error(`Directory returned ${response.status}`);
		const payload = (await response.json()) as ApiResponse;
		const tools = shuffle(
			(payload.data ?? [])
				.flatMap((s) => s.children ?? [])
				.filter((x) => x.Tool)
				.map((x) => ({
					name: x.Tool!.trim(),
					category: x.Category?.trim() || 'Uncategorized',
					location: x.Location?.trim() || 'Location unavailable',
					address: x.Address?.trim() || 'Address unavailable',
					accessPolicy: x['Access Policy']?.trim() || 'Contact location',
					url: x['Item URL']?.trim() || null
				}))
		);
		setHeaders({
			'cache-control': 'no-store, no-cache, must-revalidate'
		});
		return { tools, error: null };
	} catch (cause) {
		console.error('Tool directory fetch failed', cause);
		return { tools: [], error: 'Please check your connection and try again in a moment.' };
	}
};
