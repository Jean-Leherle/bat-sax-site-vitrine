const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export type RawgGame = {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
};

// NOUVEAU : L'interface qui décrit ce que RAWG nous renvoie (on ignore les champs inutiles)
interface RawgApiResponseItem {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  [key: string]: unknown; // Permet d'ignorer proprement le reste des données
}

export const searchGames = async (query: string): Promise<RawgGame[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5&ordering=-relevance`
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // NOUVEAU : On utilise notre interface au lieu de 'any'
    return data.results.map((game: RawgApiResponseItem) => ({
      id: game.id,
      name: game.name,
      background_image: game.background_image,
      released: game.released,
    }));

  } catch (error) {
    console.error("Erreur lors de la recherche RAWG :", error);
    return [];
  }
};