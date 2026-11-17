import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUp, ChevronRight, Pencil, Plus, Search, X } from 'lucide-react'
import ItemEditor from './ItemEditor'
import NutritionLabel from './NutritionLabel'
import {
  caloriesText, categories, formatNumber, isCustomizable, mealNutrition, menu, newMealItem, normalize,
  type Category, type MealItem, type MenuItem,
} from './menu'
import logo from './uplate.png'
import './style.css'

const pageSize = 8

function App() {
  const [category, setCategory] = useState<Category>('All items')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [meal, setMeal] = useState<MealItem[]>([])
  const [editor, setEditor] = useState<{ item: MealItem; editing: boolean } | null>(null)
  const [status, setStatus] = useState('')
  const [labelInView, setLabelInView] = useState(false)
  const nutritionLabel = useRef<HTMLElement>(null)
  const nextKey = useRef(1)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setLabelInView(entry.intersectionRatio >= 0.25), {
      rootMargin: '0px 0px -72px 0px',
      threshold: 0.25,
    })
    observer.observe(nutritionLabel.current!)
    return () => observer.disconnect()
  }, [])
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
        </div>
        <div className="calculator">
          <section className="menu-section" aria-labelledby="menu-heading" id="menu" tabIndex={-1}>
            <div className="menu-tools">
              <h2 id="menu-heading">QDOBA sample menu</h2>
              <label className="search-box">
                <Search size={18} aria-hidden="true" />
                <input type="search" aria-label="Search menu items" placeholder="Search menu"
                  value={search} onChange={event => {
                    setSearch(event.target.value)
                    setVisibleCount(pageSize)
                  }} />
              </label>
            </div>
            <div className="category-filters" role="group" aria-label="Menu category">
              {categories.map(option => (
                <button type="button" key={option} className="category-filter" aria-pressed={category === option}
                  onClick={() => {
                    setCategory(option)
                    setVisibleCount(pageSize)
                  }}>{option}</button>
              ))}
            </div>
            <ul className="menu-list">
              {visibleItems.map(item => {
                const custom = isCustomizable(item)
                const calories = mealNutrition([newMealItem(item, 0)]).calories
                return (
                  <li className="menu-item" key={item.id}>
                    <strong>{item.name}</strong>
                    <span className="menu-calories">
                      {item.sizes.length > 0 ? `${item.sizes.length} sizes`
                        : item.foods.length === 0 ? 'Varies'
                        : <>{caloriesText(calories)} <span>Cal</span></>}
                    </span>
                    <button type="button" className={custom ? 'item-action' : 'item-action quick-add'}
                      aria-label={`${custom ? 'Customize' : 'Add'} ${item.name}`}
                      onClick={() => addItem(item)}>
                      {custom ? 'Customize' : 'Add'}
                      {custom ? <ChevronRight size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
              {matches.length === 0 && (
                <li className="no-results">
                  <p>No items found.</p>
                  <button type="button" className="text-button" onClick={() => {
                    setSearch('')
                    setCategory('All items')
                    setVisibleCount(pageSize)
                  }}>Reset filters</button>
                </li>
              )}
            </ul>
            {visibleItems.length < matches.length && (
              <button type="button" className="secondary show-more" onClick={() => setVisibleCount(count => count + pageSize)}>
                Show more items
              </button>
            )}
          </section>
          <aside className="meal-column" aria-label="Your meal and nutrition">
            <section className="meal-panel" id="meal" aria-labelledby="meal-heading" tabIndex={-1}>
              <div className="meal-header">
                <h2 id="meal-heading">Your meal</h2>
                {meal.length > 0 && <button className="text-button" type="button" onClick={() => {
                  setMeal([])
                  setStatus('Meal cleared.')
                }}>Clear meal</button>}
              </div>
              {meal.length === 0 ? <p className="empty-meal">Add an item from the menu.</p> : (
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
                            <small>{size && `${size}, `}{formatNumber(entry.servings)} {entry.servings === 1 ? 'serving' : 'servings'}</small>
                          </span>
                          <span className="meal-item-end">
                            <span>{caloriesText(calories)} Cal</span><Pencil size={14} aria-hidden="true" />
                          </span>
                        </button>
                        <button type="button" className="icon-button remove-button" aria-label={`Remove ${entry.item.name} from meal`}
                          onClick={() => {
                            setMeal(current => current.filter(item => item.key !== entry.key))
                            setStatus(`Removed ${entry.item.name}.`)
                          }}><X size={17} aria-hidden="true" /></button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            <NutritionLabel totals={totals} count={meal.length} ref={nutritionLabel} />
          </aside>
        </div>
        <footer className="site-footer">Nutrition data from UPlate’s QDOBA catalog.</footer>
      </main>
      <div className="mobile-meal-wrap">
        <a className="primary mobile-meal" href={labelInView ? '#menu' : '#meal'}>
          {labelInView ? <><ArrowUp size={16} aria-hidden="true" /> Back to menu</> : <>View meal <ArrowDown size={16} aria-hidden="true" /></>}
          <span>{meal.length === 0 ? '0 items' : `${caloriesText(totals.calories)} Cal`}</span>
        </a>
      </div>
      <p className="sr-only" role="status">{status}</p>
      {editor && <ItemEditor initial={editor.item} editing={editor.editing}
        onSave={saveItem} onClose={() => setEditor(null)} />}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
