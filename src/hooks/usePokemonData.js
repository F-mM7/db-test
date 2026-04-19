import { useFetchJson } from './useFetchJson';
import { DATA_URL } from '../utils/constants';

export function usePokemonData() {
  const { data: pokemonData, loading, error } = useFetchJson(DATA_URL, []);
  return { pokemonData, loading, error };
}
