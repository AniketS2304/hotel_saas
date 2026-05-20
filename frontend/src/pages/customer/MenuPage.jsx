import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Search, MapPin } from 'lucide-react'
import { getPublicMenu } from '../../services/menuService'
import useCartStore from '../../store/cartStore'
import FoodCard from '../../components/customer/FoodCard'
import CategoryTabs from '../../components/customer/CategoryTabs'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

export default function MenuPage() {
  const { restaurantId, tableId } = useParams()
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const categoryRefs = useRef({})

  const setContext = useCartStore((s) => s.setContext)
  // Subscribe to items directly so the cart button re-renders instantly on every add/remove
  const cartItems = useCartStore((s) => s.items)
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-menu', restaurantId, tableId],
    queryFn: () => getPublicMenu(restaurantId, tableId).then((r) => r.data),
    staleTime: 60000,
  })

  const restaurant = data?.restaurant || {}
  const categories = data?.categories || []
  const tableNumber = data?.table_number ?? null

  // Store context once menu (and table number) is loaded
  useEffect(() => {
    if (restaurantId && tableId) {
      setContext(restaurantId, tableId, tableNumber)
    }
  }, [restaurantId, tableId, tableNumber, setContext])
  const lastOrderId = localStorage.getItem('lastOrderId')

  // Flatten all items from all categories into one list
  const menuItems = categories.flatMap((cat) =>
    (cat.menu_items || []).map((item) => ({ ...item, category_id: cat.id }))
  )

  // Derived: filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !activeCategory || item.category_id === activeCategory
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })



  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center card p-8 max-w-sm mx-4">
          <p className="text-4xl mb-4">🍽️</p>
          <h2 className="font-heading font-bold text-white text-xl mb-2">Menu Unavailable</h2>
          <p className="text-gray-500 text-sm">
            We couldn't load the menu. Please scan the QR code again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark-bg to-dark-bg" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 px-4 pt-12 pb-8 max-w-4xl mx-auto">
          {/* Restaurant Info */}
          <div className="mb-6">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-2xl object-cover mb-4 border-2 border-primary/30"
              />
            )}
            <h1 className="font-heading font-bold text-white text-4xl mb-2 leading-tight">
              {restaurant.name || 'Welcome'}
            </h1>
            {restaurant.description && (
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                {restaurant.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {tableNumber != null && (
                  <span className="text-sm text-gray-400">
                    Table{' '}
                    <span className="font-bold text-primary">#{tableNumber}</span>
                  </span>
                )}
              </div>
              
              {lastOrderId && (
                <button
                  onClick={() => navigate(`/order/${lastOrderId}/track`)}
                  className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg border border-primary/30 transition-all"
                >
                  Track Order
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="input pl-11 bg-white/5 border-white/10 focus:border-primary/60"
            />
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 py-6 max-w-4xl mx-auto pb-32">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="font-heading font-semibold text-white text-xl mb-2">No items found</h3>
            <p className="text-gray-500 text-sm">Try a different category or search term</p>
          </div>
        ) : (
          <>
            {searchQuery === '' && activeCategory === null ? (
              // Show by categories
              categories.map((cat) => {
                const catItems = filteredItems.filter(
                  (item) => item.category_id === cat.id
                )
                if (catItems.length === 0) return null
                return (
                  <div key={cat.id} className="mb-8" ref={(el) => (categoryRefs.current[cat.id] = el)}>
                    <h2 className="font-heading font-bold text-white text-xl mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full inline-block" />
                      {cat.name}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {catItems.map((item) => (
                        <FoodCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-30 flex justify-center animate-slide-up">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-4 bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-2xl shadow-2xl shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] max-w-sm w-full"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span className="font-semibold">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="font-bold text-lg">₹{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
