import { useState } from 'react'
import IngredientFilter from './components/IngredientFilter'
import RecipeCalculator from './components/RecipeCalculator'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

const TABS = [
  { id: 'ingredient', label: '食材検索' },
  { id: 'recipe', label: '料理カリキュレーター' }
]

function App() {
  const [activeTab, setActiveTab] = useState('ingredient')

  return (
    <ErrorBoundary>
      <nav className="app-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`app-nav-tab tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={`tab-panel ${activeTab === 'ingredient' ? 'active' : ''}`}>
        <IngredientFilter />
      </div>
      <div className={`tab-panel ${activeTab === 'recipe' ? 'active' : ''}`}>
        <RecipeCalculator />
      </div>
    </ErrorBoundary>
  )
}

export default App
