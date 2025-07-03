import IngredientFilter from './components/IngredientFilter'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <IngredientFilter />
    </ErrorBoundary>
  )
}

export default App
