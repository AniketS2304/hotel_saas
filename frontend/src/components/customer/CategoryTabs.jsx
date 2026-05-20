import { useRef, useEffect } from 'react'

/**
 * CategoryTabs — horizontally scrollable category filter tabs
 * @param {{
 *   categories: Array<{ id: string, name: string }>,
 *   activeCategory: string|null,
 *   onSelect: (id: string|null) => void
 * }} props
 */
export default function CategoryTabs({ categories, activeCategory, onSelect }) {
  const scrollRef = useRef(null)

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return
    const activeEl = scrollRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [activeCategory])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* "All" tab */}
      <button
        data-active={activeCategory === null ? 'true' : 'false'}
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          activeCategory === null
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'bg-dark-card border border-dark-border text-gray-400 hover:text-gray-100 hover:border-gray-600'
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          data-active={activeCategory === cat.id ? 'true' : 'false'}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
            activeCategory === cat.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-dark-card border border-dark-border text-gray-400 hover:text-gray-100 hover:border-gray-600'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
