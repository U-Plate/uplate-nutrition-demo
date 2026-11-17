import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Search, Trash2, X } from 'lucide-react'
import {
  caloriesText, foods, mealNutrition, normalize, variantFor,
  type MealItem, type Portion,
} from './menu'

function QuantityControl({ name, quantity, onChange, minimum }: {
  name: string
  quantity: number
  minimum: number
  onChange: (quantity: number) => void
}) {
  const [input, setInput] = useState<string | null>(null)
  const commit = () => {
    const next = Number(input)
    if (input?.trim() && Number.isFinite(next) && next >= minimum && next <= 99) {
      onChange(Math.max(minimum, Math.round(next * 100) / 100))
    }
    setInput(null)
  }

  return (
    <div className="quantity-control">
      <button type="button" className="icon-button" onClick={() => onChange(Math.max(minimum, Math.round((quantity - 1) * 100) / 100))}
        disabled={quantity <= minimum} aria-label={`Decrease ${name}`}><Minus size={15} /></button>
      <input aria-label={`${name} quantity`} type="number" inputMode="decimal" min={minimum} max={99} step="0.01"
        value={input ?? quantity} onChange={event => setInput(event.target.value)} onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }} />
      <button type="button" className="icon-button" onClick={() => onChange(Math.min(99, Math.round((quantity + 1) * 100) / 100))}
        disabled={quantity >= 99} aria-label={`Increase ${name}`}><Plus size={15} /></button>
    </div>
  )
}

export default function ItemEditor({ initial, editing, onSave, onClose }: {
  initial: MealItem
  editing: boolean
  onSave: (item: MealItem) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(initial)
  const [showOptions, setShowOptions] = useState(initial.portions.length === 0)
  const [query, setQuery] = useState('')
  const { item, portions, servings, size } = draft
  const variant = variantFor(item, size)
  const selected = new Set(portions.map(portion => portion.foodId))
  const available = [...new Map([...variant.foods, ...variant.possibleFoods].map(portion => [portion.foodId, portion])).values()]
    .filter(portion => !selected.has(portion.foodId))
  const matches = available.filter(({ foodId }) => normalize(foods[foodId].name).includes(normalize(query)))
  const totals = mealNutrition([draft])

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  function updatePortion(index: number, quantity: number) {
    setDraft(current => ({
      ...current,
      portions: quantity > 0
        ? current.portions.map((portion, i) => i === index ? { ...portion, quantity } : portion)
        : current.portions.filter((_, i) => i !== index),
    }))
  }

  function addPortion(portion: Portion) {
    setDraft(current => ({ ...current, portions: [...current.portions, portion] }))
  }

  return (
    <dialog ref={dialog} className="editor" aria-labelledby="editor-heading"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="editor-layout">
        <header className="editor-header">
          <div>
            <p>{editing ? 'Edit meal item' : 'Customize item'}</p>
            <h2 id="editor-heading">{item.name}</h2>
          </div>
          <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close editor">
            <X size={20} />
          </button>
        </header>
        <div className="editor-body">
          {item.sizes.length > 0 && (
            <fieldset>
              <legend>Size</legend>
              <div className="size-options">
                {item.sizes.map((option, index) => (
                  <label className="pill" key={option.name}>
                    <input type="radio" name="size" checked={size === index}
                      onChange={() => {
                        setDraft({ ...draft, size: index, portions: option.foods })
                        setShowOptions(option.foods.length === 0)
                        setQuery('')
                      }} />
                    {option.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="servings-row">
            <h3>Servings</h3>
            <QuantityControl name="Servings" quantity={servings} minimum={0.01}
              onChange={servings => setDraft(current => ({ ...current, servings }))} />
          </div>
          <h3>Ingredients</h3>
          {portions.length === 0 && <p className="empty-ingredients">Choose ingredients to build this item.</p>}
          <ul className="ingredients-list">
            {portions.map(({ foodId, quantity }, index) => {
              const food = foods[foodId]
              return (
                <li key={`${foodId}-${index}`}>
                  <div className="ingredient-name">
                    <strong>{food.name}</strong>
                    <small>{food.servingSize && `${food.servingSize} per portion · `}{caloriesText(food.nutritionFacts.calories * quantity)} Cal</small>
                  </div>
                  <QuantityControl name={food.name} quantity={quantity} minimum={0}
                    onChange={next => updatePortion(index, next)} />
                  <button type="button" className="icon-button remove-button" aria-label={`Remove ${food.name}`}
                    onClick={() => updatePortion(index, 0)}><Trash2 size={16} /></button>
                </li>
              )
            })}
          </ul>
          <button type="button" className="secondary add-ingredients" aria-expanded={showOptions}
            aria-controls="available-ingredients" onClick={() => setShowOptions(!showOptions)}>
            {showOptions ? <Minus size={16} /> : <Plus size={16} />} {showOptions ? 'Hide options' : 'Add ingredients'}
          </button>
          <div id="available-ingredients" hidden={!showOptions} className="ingredient-options">
            <label className="search-box">
              <Search size={17} aria-hidden="true" />
              <input type="search" placeholder="Search ingredients" aria-label="Search ingredients"
                value={query} onChange={event => setQuery(event.target.value)} />
            </label>
            <ul className="ingredients-list">
              {matches.map(portion => {
                const food = foods[portion.foodId]
                return (
                  <li key={portion.foodId}>
                    <div className="ingredient-name">
                      <strong>{food.name}</strong>
                      <small>{caloriesText(food.nutritionFacts.calories * portion.quantity)} Cal</small>
                    </div>
                    <button type="button" className="icon-button add-button"
                      aria-label={`Add ${food.name}`} onClick={() => addPortion(portion)}><Plus size={17} /></button>
                  </li>
                )
              })}
            </ul>
            {matches.length === 0 && <p className="empty-ingredients">
              {available.length > 0 ? 'No ingredients match your search.' : 'All available ingredients are included.'}
            </p>}
          </div>
        </div>
        <footer className="editor-footer">
          <strong aria-live="polite">{caloriesText(totals.calories)} Cal</strong>
          <button type="button" className="primary" disabled={portions.length === 0} onClick={() => onSave(draft)}>
            {editing ? 'Save changes' : 'Add to meal'}
          </button>
        </footer>
      </div>
    </dialog>
  )
}
