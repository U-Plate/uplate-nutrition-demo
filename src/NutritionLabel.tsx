import type { Ref } from 'react'
import { caloriesText, formatNumber, nutrients } from './menu'

export default function NutritionLabel({ totals, count, ref }: {
  totals: Record<string, number | null>
  count: number
  ref?: Ref<HTMLElement>
}) {
  const itemText = count === 1 ? '1 menu item' : `${count} menu items`

  return (
    <section className="nutrition" aria-labelledby="nutrition-heading" ref={ref}>
      <h2 id="nutrition-heading">Nutrition Facts</h2>
      <p className="label-context">Entire meal ({itemText})</p>
      <div className="calorie-row">
        <strong>Calories</strong>
        <strong className="calorie-number">{caloriesText(totals.calories)}</strong>
      </div>
      {count > 0 && totals.caloriesFromFat !== null && (
        <p className="calories-from-fat">Calories from Fat <span>{caloriesText(totals.caloriesFromFat)}</span></p>
      )}
      <div className="daily-heading">% Daily Value*</div>
      <dl className="nutrient-list">
        {nutrients.map(nutrient => {
          const amount = totals[nutrient.key]
          const optional = 'optional' in nutrient && nutrient.optional
          if (optional && (count === 0 || amount === null)) return null

          const indent = 'indent' in nutrient ? nutrient.indent : 0
          return (
            <div className={`nutrient-row indent-${indent}`} key={nutrient.key}>
              <dt>{nutrient.name} <span>{amount === null ? '—' : `${formatNumber(amount)} ${nutrient.unit}`}</span></dt>
              <dd>{'daily' in nutrient && amount !== null ? `${Math.round(amount / nutrient.daily * 100)}%` : ''}</dd>
            </div>
          )
        })}
      </dl>
      <p className="daily-note">* Daily Values are based on a 2,000-calorie diet.</p>
      {count > 0 && Object.values(totals).includes(null) && (
        <p className="daily-note">Some nutrients are unavailable in the source menu.</p>
      )}
    </section>
  )
}
