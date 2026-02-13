import { useState, useCallback } from 'react'
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

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
  }, [])

  return (
    <ErrorBoundary>
      <nav className="app-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`app-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {activeTab === 'ingredient' ? <IngredientFilter /> : <RecipeCalculator />}
    </ErrorBoundary>
  )
}

export default App
