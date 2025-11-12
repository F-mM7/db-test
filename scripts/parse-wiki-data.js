#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定数定義
const CELL_PATTERNS = {
  WITH_C_INGREDIENT: {
    AAA: { start: 10, cells: 2 },
    AAC: { start: 16, cells: 4 },
    ABB: { start: 24, cells: 4 }
  },
  WITHOUT_C_INGREDIENT: {
    AAA: { start: 10, cells: 2 },
    ABB: { start: 21, cells: 4 }
  }
};

const MIN_CELLS = {
  WITH_C: 34,
  WITHOUT_C: 26
};

class PokemonWikiParser {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.htmlPath = path.join(this.dataDir, 'wiki-raw.html');
    this.outputPath = path.join(__dirname, '..', 'public', 'pokemon-data.json');
    this.summaryPath = path.join(this.dataDir, 'parse-summary.json');
  }

  validateInputFile() {
    if (!fs.existsSync(this.htmlPath)) {
      console.error('Error: wiki-raw.html not found!');
      console.error('Please run "npm run download-wiki" first.');
      process.exit(1);
    }
  }

  loadHTML() {
    const html = fs.readFileSync(this.htmlPath, 'utf8');
    console.log(`✓ Loaded HTML file (${html.length} characters)`);
    return html;
  }

  saveResults(pokemonData) {
    // JSONファイルを保存
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(this.outputPath, JSON.stringify(pokemonData, null, 2));

    // パース結果のサマリーを保存
    const summary = this.createSummary(pokemonData);
    fs.writeFileSync(this.summaryPath, JSON.stringify(summary, null, 2));

    this.logResults(pokemonData, summary);
  }

  createSummary(pokemonData) {
    return {
      parseDate: new Date().toISOString(),
      totalPokemon: pokemonData.length,
      uniqueIngredients: this.extractUniqueIngredients(pokemonData),
      sampleData: pokemonData.slice(0, 3)
    };
  }

  logResults(pokemonData, summary) {
    console.log(`✓ Pokemon data saved to: ${this.outputPath}`);
    console.log(`✓ Parse summary saved to: ${this.summaryPath}`);
    console.log(`✓ Total Pokemon: ${pokemonData.length}`);
    console.log(`✓ Unique ingredients: ${summary.uniqueIngredients.length}`);
  }

  extractUniqueIngredients(pokemonData) {
    const ingredientSet = new Set();
    
    pokemonData.forEach(pokemon => {
      Object.values(pokemon.ingredientPatterns).forEach(pattern => {
        pattern.ingredients.forEach(ingredient => {
          ingredientSet.add(ingredient);
        });
      });
    });
    
    return Array.from(ingredientSet).sort();
  }

  parse() {
    console.log('Pokemon Sleep Wiki Data Parser');
    console.log('==============================');
    
    try {
      this.validateInputFile();
      const html = this.loadHTML();
      const pokemonData = this.parseHTMLTable(html);
      this.saveResults(pokemonData);
      return pokemonData;
    } catch (error) {
      console.error('Error parsing wiki data:', error.message);
      process.exit(1);
    }
  }

  parseHTMLTable(html) {
    const $ = cheerio.load(html);
    console.log('Parsing HTML table...');

    const table = $('table').first();
    if (table.length === 0) {
      throw new Error('No table found in HTML');
    }

    console.log(`Processing table with ${table.find('tr').length} rows`);

    const dataRows = table.find('tbody tr');
    const pokemonList = [];
    let pokemonId = 1;
    let successfulParses = 0;
    let failedParses = 0;

    dataRows.each((rowIndex, row) => {
      try {
        const pokemon = this.parsePokemonRow($, $(row).find('td'), pokemonId);
        if (pokemon) {
          pokemonList.push(pokemon);
          pokemonId++;
          successfulParses++;
        } else {
          failedParses++;
        }
      } catch (error) {
        console.warn(`Error parsing row ${rowIndex}:`, error.message);
        failedParses++;
      }
    });

    console.log(`✓ Successfully parsed: ${successfulParses} Pokemon`);
    console.log(`✗ Failed to parse: ${failedParses} rows`);

    if (pokemonList.length === 0) {
      throw new Error('No Pokemon data extracted from table');
    }

    return pokemonList;
  }

  parsePokemonRow($, cells, id) {
    const hasC = cells.length >= MIN_CELLS.WITH_C;
    
    if (cells.length < MIN_CELLS.WITHOUT_C) {
      console.warn(`Row has ${cells.length} cells, expected at least ${MIN_CELLS.WITHOUT_C}`);
      return null;
    }

    const name = this.extractPokemonName($, cells);
    if (!name) {
      console.warn('No Pokemon name found');
      return null;
    }

    console.log(`Parsing: ${name} (${cells.length} cells${!hasC ? ' - no C ingredient' : ''})`);

    const pokemon = {
      id,
      name,
      ingredientPatterns: {}
    };

    const patterns = hasC ? CELL_PATTERNS.WITH_C_INGREDIENT : CELL_PATTERNS.WITHOUT_C_INGREDIENT;
    
    Object.entries(patterns).forEach(([patternName, config]) => {
      const patternData = this.parsePattern($, cells, patternName, config);
      if (patternData) {
        pokemon.ingredientPatterns[patternName] = patternData;
      }
    });

    return pokemon;
  }

  extractPokemonName($, cells) {
    const nameCell = $(cells[1]);
    // <br>で改行されたサイズ情報も含めて取得（例: バケッチャ(こだま)、ピカチュウ(ハロウィン)）
    return nameCell.text().trim().replace(/\n+/g, '');
  }

  parsePattern($, cells, patternName, config) {
    const { start, cells: cellCount } = config;
    
    if (start + cellCount > cells.length) {
      return null;
    }

    if (cellCount === 2) {
      return this.parseAAAPattern($, cells, start);
    } else if (cellCount === 4) {
      return this.parseFourCellPattern($, cells, start, patternName);
    }
    
    return null;
  }

  parseAAAPattern($, cells, start) {
    const ingredient = this.getIngredientFromCell($, cells[start]);
    const value = parseFloat($(cells[start + 1]).text().trim());
    
    if (ingredient && !isNaN(value)) {
      return {
        ingredients: [ingredient, ingredient, ingredient],
        individualValues: { [ingredient]: value }
      };
    }
    return null;
  }

  parseFourCellPattern($, cells, start, patternName) {
    const ingredientA = this.getIngredientFromCell($, cells[start]);
    const valueA = parseFloat($(cells[start + 1]).text().trim());
    const ingredientB = this.getIngredientFromCell($, cells[start + 2]);
    const valueB = parseFloat($(cells[start + 3]).text().trim());
    
    if (ingredientA && ingredientB && !isNaN(valueA) && !isNaN(valueB)) {
      const ingredients = this.createIngredientsArray(patternName, ingredientA, ingredientB);
      
      return {
        ingredients,
        individualValues: {
          [ingredientA]: valueA,
          [ingredientB]: valueB
        }
      };
    }
    return null;
  }

  createIngredientsArray(patternName, ingredientA, ingredientB) {
    switch (patternName) {
      case 'AAC':
        return [ingredientA, ingredientA, ingredientB];
      case 'ABB':
        return [ingredientA, ingredientB, ingredientB];
      default:
        return [ingredientA, ingredientB, ingredientB];
    }
  }

  getIngredientFromCell($, cell) {
    const img = $(cell).find('img');
    if (img.length > 0) {
      return img.attr('alt') || img.attr('title') || '';
    }
    return '';
  }
}

// 関数として公開（後方互換性のため）
function parseWikiData() {
  const parser = new PokemonWikiParser();
  return parser.parse();
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  parseWikiData();
}

export { parseWikiData, PokemonWikiParser };