import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown, ChevronDown, Cookie, CupSoda, Pencil, Plus, Search, ShoppingBag, Soup, Trash2, Utensils,
} from 'lucide-react'
import ItemEditor from './ItemEditor'
import NutritionLabel from './NutritionLabel'
import {
  caloriesText, categories, formatNumber, isCustomizable, mealNutrition, menu, newMealItem, normalize,
  type Category, type MealItem, type MenuItem,
} from './menu'
import logo from './uplate.png'
import './style.css'

const categoryIcons = { Entrées: Soup, Sides: Utensils, Drinks: CupSoda, Desserts: Cookie }
const pageSize = 8

function App() {
  const [category, setCategory] = useState<Category>('All items')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [meal, setMeal] = useState<MealItem[]>([])
  const [editor, setEditor] = useState<{ item: MealItem; editing: boolean } | null>(null)
  const [status, setStatus] = useState('')
  const nextKey = useRef(1)
  const query = normalize(search)
  const matches = menu.filter(item =>
    (category === 'All items' || item.category === category) && normalize(item.name).includes(query),
  )
  const visibleItems = matches.slice(0, visibleCount)
  const totals = mealNutrition(meal)

  function addItem(item: MenuItem) {
    const entry = newMealItem(item, nextKey.current++)
    if (isCustomizable(item)) {
      setEditor({ item: entry, editing: false })
    } else {
      saveItem(entry)
    }
  }

  function saveItem(entry: MealItem) {
    const editing = editor?.editing
    setMeal(current => editing
      ? current.map(item => item.key === entry.key ? entry : item)
      : [...current, entry])
    setEditor(null)
    setStatus(editing ? `Updated ${entry.item.name}.` : `Added ${entry.item.name} to your meal.`)
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap header-content">
          <div className="wordmark"><img src={logo} alt="" /> UPlate</div>
        </div>
      </header>
      <main className="wrap">
        <div className="page-intro">
          <h1>Nutrition calculator</h1>
          <p>Build a meal from the QDOBA sample menu and see its nutrition update as you make changes.</p>
        </div>
        <div className="calculator">
          <section className="menu-section" aria-labelledby="menu-heading">
            <div className="section-heading">
              <h2 id="menu-heading">QDOBA menu</h2>
              <span>{menu.length} items</span>
            </div>
            <label className="search-box">
              <Search size={19} aria-hidden="true" />
              <input type="search" aria-label="Search menu items" placeholder="Search menu items"
                value={search} onChange={event => {
                  setSearch(event.target.value)
                  setVisibleCount(pageSize)
                }} />
            </label>
            <div className="category-filters" role="group" aria-label="Menu category">
              {categories.map(option => (
                <button type="button" key={option} className="pill" aria-pressed={category === option}
                  onClick={() => {
                    setCategory(option)
                    setVisibleCount(pageSize)
                  }}>{option}</button>
              ))}
            </div>
            <ul className="menu-list panel">
              {visibleItems.map(item => {
                const Icon = categoryIcons[item.category as keyof typeof categoryIcons]
                const entry = newMealItem(item, 0)
                const custom = isCustomizable(item)
                const caption = item.sizes.length > 0 ? `${item.sizes.length} sizes`
                  : item.foods.length === 0 ? 'Choose your ingredients'
                  : `${caloriesText(mealNutrition([entry]).calories)} Cal${custom ? ' · Customizable' : ''}`
                return (
                  <li key={item.id}>
                    <button type="button" className="menu-item"
                      aria-label={`${custom ? 'Customize' : 'Add'} ${item.name}`}
                      onClick={() => addItem(item)}>
                      <span className="category-icon"><Icon size={21} strokeWidth={1.65} aria-hidden="true" /></span>
                      <span className="menu-item-text"><strong>{item.name}</strong><small>{caption}</small></span>
                      <span className="add-button"><Plus size={19} aria-hidden="true" /></span>
                    </button>
                  </li>
                )
              })}
              {matches.length === 0 && <li className="no-results">No menu items match your search.</li>}
            </ul>
            {visibleItems.length < matches.length && (
              <button type="button" className="secondary show-more" onClick={() => setVisibleCount(count => count + pageSize)}>
                Show more items <ChevronDown size={16} aria-hidden="true" />
              </button>
            )}
          </section>
          <aside className="meal-column" aria-label="Your meal and nutrition">
            <section className="meal-panel panel" id="meal" aria-labelledby="meal-heading" tabIndex={-1}>
              <div className="meal-header">
                <div><ShoppingBag size={19} aria-hidden="true" /><h2 id="meal-heading">Your meal</h2></div>
                {meal.length > 0 && <button className="text-button" type="button" onClick={() => {
                  setMeal([])
                  setStatus('Meal cleared.')
                }}>Clear meal</button>}
              </div>
              {meal.length === 0 ? <p className="empty-meal">Add items from the menu to start your meal.</p> : (
                <ul className="meal-items">
                  {meal.map(entry => {
                    const size = entry.item.sizes[entry.size]?.name
                    const calories = mealNutrition([entry]).calories
                    return (
                      <li key={entry.key}>
                        <button type="button" className="meal-edit" aria-label={`Edit ${entry.item.name}`}
                          onClick={() => setEditor({ item: entry, editing: true })}>
                          <span>
                            <strong>{entry.item.name}</strong>
                            <small>{size && `${size} · `}{formatNumber(entry.servings)} × serving · {caloriesText(calories)} Cal</small>
                          </span>
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-button remove-button" aria-label={`Remove ${entry.item.name} from meal`}
                          onClick={() => {
                            setMeal(current => current.filter(item => item.key !== entry.key))
                            setStatus(`Removed ${entry.item.name}.`)
                          }}><Trash2 size={16} /></button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            <NutritionLabel totals={totals} count={meal.length} />
          </aside>
        </div>
        <footer className="site-footer">Sample menu and nutrition data from UPlate’s QDOBA catalog.</footer>
      </main>
      <div className="mobile-meal-wrap">
        <a className="primary mobile-meal" href="#meal">
          <ShoppingBag size={18} aria-hidden="true" /> View meal <span>{meal.length}</span>
          <strong>{caloriesText(totals.calories)} Cal</strong> <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>
      <p className="sr-only" role="status">{status}</p>
      {editor && <ItemEditor initial={editor.item} editing={editor.editing}
        onSave={saveItem} onClose={() => setEditor(null)} />}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
