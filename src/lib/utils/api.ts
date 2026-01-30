export type ApiResponse<T> = { success: boolean; data?: T; error?: string };

export async function postJson<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return response.json();
}

export async function postForm<T>(url: string, form: FormData): Promise<ApiResponse<T>> {
	const response = await fetch(url, {
		method: 'POST',
		body: form
	});
	return response.json();
}
