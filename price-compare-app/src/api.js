// Points the app at the backend's FastAPI server.
//
// - iOS Simulator: 'http://localhost:8000' works as-is.
// - Android Emulator: use 'http://10.0.2.2:8000' — the emulator maps that
//   address to your computer's localhost.
// - Physical phone via Expo Go: 'localhost' means the phone itself, not
//   your computer. Use your computer's LAN IP instead, e.g.
//   'http://192.168.1.23:8000' (same Wi-Fi network as your phone). Find it
//   with `ipconfig getifaddr en0` (Mac), `hostname -I` (Linux), or
//   `ipconfig` (Windows, look for IPv4 Address).
export const API_BASE_URL = 'http://localhost:8000';

export async function fetchComparison(searchQuery, { maxItems = 20, signal } = {}) {
  const queryParams = new URLSearchParams({
    query: searchQuery,
    max_items: String(maxItems),
  });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/compare?${queryParams.toString()}`, { signal });
  } catch (networkError) {
    throw new Error(`Couldn't reach the backend at ${API_BASE_URL}. Is it running? (${networkError.message})`);
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(`Backend returned ${response.status}: ${responseBody || response.statusText}`);
  }

  return response.json();
}
