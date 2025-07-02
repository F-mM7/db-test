import { useState, useEffect } from 'react';
import './PokemonDataTable.css';

function PokemonDataTable() {
  const [pokemonData, setPokemonData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('30');
  const [selectedPattern, setSelectedPattern] = useState('AA');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/pokemon-data.json')
      .then(res => res.json())
      .then(data => {
        setPokemonData(data);
        setFilteredData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Pokemon data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = pokemonData.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, pokemonData]);

  const getPatternValue = (pokemon, pattern, level) => {
    if (!pokemon.ingredientPatterns[pattern]) return '-';
    return pokemon.ingredientPatterns[pattern].values[level] || '-';
  };

  const getAllPatterns = () => {
    const patterns = new Set();
    pokemonData.forEach(pokemon => {
      Object.keys(pokemon.ingredientPatterns).forEach(pattern => {
        patterns.add(pattern);
      });
    });
    return Array.from(patterns).sort();
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  const patterns = getAllPatterns();

  return (
    <div className="pokemon-data-container">
      <h1>ポケモンスリープ 食材獲得数推定値一覧</h1>
      
      <div className="controls">
        <div className="control-group">
          <label>ポケモン検索:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ポケモン名で検索..."
          />
        </div>
        
        <div className="control-group">
          <label>レベル:</label>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            <option value="1">Lv.1</option>
            <option value="30">Lv.30</option>
            <option value="60">Lv.60</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>パターン:</label>
          <select value={selectedPattern} onChange={(e) => setSelectedPattern(e.target.value)}>
            {patterns.map(pattern => (
              <option key={pattern} value={pattern}>{pattern}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="pokemon-table">
          <thead>
            <tr>
              <th>ポケモン名</th>
              <th>基本値 (Lv.{selectedLevel})</th>
              <th>{selectedPattern}パターン 食材</th>
              <th>{selectedPattern}パターン 値</th>
              <th>全パターン比較</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(pokemon => (
              <tr key={pokemon.id}>
                <td className="pokemon-name">{pokemon.name}</td>
                <td className="value">{pokemon.levels[selectedLevel]?.value || '-'}</td>
                <td className="ingredients">
                  {pokemon.ingredientPatterns[selectedPattern]?.ingredients.join(', ') || '-'}
                </td>
                <td className="value">
                  {getPatternValue(pokemon, selectedPattern, selectedLevel)}
                </td>
                <td className="all-patterns">
                  {patterns.map(pattern => (
                    <span key={pattern} className="pattern-value">
                      {pattern}: {getPatternValue(pokemon, pattern, selectedLevel)}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="info">
        <p>データ総数: {filteredData.length} / {pokemonData.length} ポケモン</p>
        <p className="note">
          ※ 推定値はせいかく・サブスキル無補正、睡眠時間8時間半、所持数溢れ無しを想定
        </p>
      </div>
    </div>
  );
}

export default PokemonDataTable;