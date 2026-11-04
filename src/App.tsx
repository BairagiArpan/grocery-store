import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import {
  ArrowRight, Check, CircleUserRound, Mail, MapPin, Menu,
  MessageCircle, Package, Phone, Search, Settings, ShieldCheck,
  ShoppingBasket, Star, X, Pencil, Trash2, Plus, LogOut,
} from 'lucide-react'

import { auth, db, firebaseReady } from './firebase'
import type { Product, Review, StoreSettings } from './types'

type CustomCategory = {
  id: string
  name: string
}

const defaultSettings: StoreSettings = {
  storeName: 'Sri Krishna Enterprise',
  tagline: 'Quality food packaging and disposable products for every business.',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  heroImage: '',
  logoUrl: '/logo.png',
}

const categories = [
  'All',
  'Paper Plates & Cups',
  'Foil Products',
  'Food Containers',
  'Sweet & Biryani Boxes',
  'Paper Products',
  'Bags',
  'Other Packaging',
  'Disposable Items',
]

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)

const sampleProducts: Product[] = [
  {
    id: 'sample-1',
    name: 'Paper Plates',
    category: 'Paper Plates & Cups',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Paper plates for food serving, parties and catering.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-2',
    name: 'Paper Cups',
    category: 'Paper Plates & Cups',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Disposable paper cups for shops and events.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-3',
    name: 'Aluminium Foil Roll',
    category: 'Foil Products',
    price: 0,
    unit: 'roll',
    stock: 0,
    description: 'Foil rolls for food wrapping and kitchen use.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-4',
    name: 'Food Containers',
    category: 'Food Containers',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Food containers for restaurants and takeaway.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-5',
    name: 'Sweet Boxes',
    category: 'Sweet & Biryani Boxes',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Packaging boxes for sweets and bakery items.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-6',
    name: 'Biryani Boxes',
    category: 'Sweet & Biryani Boxes',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Takeaway boxes for biryani and food items.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-7',
    name: 'Shopping Bags',
    category: 'Bags',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Shopping and grocery bags for retail stores.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-8',
    name: 'Table Paper',
    category: 'Paper Products',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Disposable table paper for restaurants.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
  {
    id: 'sample-9',
    name: 'Rubber Bands',
    category: 'Other Packaging',
    price: 0,
    unit: 'pack',
    stock: 0,
    description: 'Rubber bands and packing accessories.',
    imageUrl: '/product-placeholder.svg',
    active: true,
  },
]

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  //const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [firebaseError, setFirebaseError] = useState('')

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    if (!firebaseReady) return

    const stopProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('name')),
      snap => setProducts(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)),
      ),
      error => setFirebaseError(error.message),
    )

    const stopCategories = onSnapshot(
      collection(db, 'categories'),
      snap => {
        setCustomCategories(
          snap.docs
          .map(d => ({
            id: d.id,
            name: String(d.data().name || ''),
          }))
          .filter(category => Boolean(category.name))
        )
      },
      error => setFirebaseError(error.message),
    )

    const stopSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      snap => {
        if (snap.exists()) {
          setSettings({
            ...defaultSettings,
            ...snap.data(),
          } as StoreSettings)
        }
      },
      error => setFirebaseError(error.message),
    )

    const stopReviews = onSnapshot(
      query(collection(db, 'reviews'), where('status', '==', 'approved')),
      snap => setReviews(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)),
      ),
      error => setFirebaseError(error.message),
    )

    return () => {
      stopCategories()
      stopProducts()
      stopSettings()
      stopReviews()
    }
  }, [])

  const visibleProducts = products.length
    ? products.filter(p => p.active)
    : sampleProducts

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={
          <Admin
            user={user}
            products={products}
            customCategories={customCategories}
            settings={settings}
          />
        }
      />
      <Route
        path="*"
        element={
          <Store
            products={visibleProducts}
            settings={settings}
            reviews={reviews}
            firebaseError={firebaseError}
          />
        }
      />
    </Routes>
  )
}

function Header({ settings }: { settings: StoreSettings }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="header">
      <div className="nav wrap">
        <Link to="/" className="brand">
          <img
            src={settings.logoUrl || '/logo.png'}
            onError={e => {
              e.currentTarget.src = '/logo.png'
            }}
            alt="Sri Krishna Enterprise"
          />
          <span>
            {settings.storeName}
            <small>PACKAGING & DISPOSABLES</small>
          </span>
        </Link>

        <button
          className="mobile-menu icon-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? 'nav-links show' : 'nav-links'}>
          <a href="#products" onClick={() => setOpen(false)}>Products</a>
          <a href="#about" onClick={() => setOpen(false)}>About</a>
          <a href="#reviews" onClick={() => setOpen(false)}>Reviews</a>
          <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
          
        </nav>
      </div>
    </header>
  )
}

function Store({
  products,
  settings,
  reviews,
  firebaseError,
}: {
  products: Product[]
  settings: StoreSettings
  reviews: Review[]
  firebaseError: string
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const filtered = useMemo(
    () =>
      products.filter(p =>
        (category === 'All' || p.category === category) &&
        `${p.name} ${p.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [products, category, search],
  )

  const avg = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0

  return (
    <>
      <Header settings={settings} />

      <main>
        {/* HERO SECTION */}
        <section className="hero hero-upgraded">
          <div className="wrap hero-layout">
            <div className="hero-content">
              <span className="eyebrow">
                WELCOME TO {settings.storeName.toUpperCase()}
              </span>

              <h1>
                Smart packaging starts
                <br />
                with the right supplies.
              </h1>

              <p>{settings.tagline}</p>

              <a className="btn light" href="#products">
                Explore Products <ArrowRight size={18} />
              </a>

              <div className="hero-points">
                <span><Check /> Packaging essentials</span>
                <span><Check /> Wholesale & retail enquiries</span>
              </div>
            </div>

            <div className="hero-image">
              <img
                src="/hero-packaging.png"
                alt="Paper plates, cups, foil containers, takeaway boxes and kraft shopping bags"
              />
            </div>
          </div>
        </section>

        <section className="trust wrap">
          <div>
            <Package />
            <b>Packaging Solutions</b>
            <small>Supplies for food and retail businesses</small>
          </div>
          <div>
            <ShieldCheck />
            <b>Business Ready</b>
            <small>Products for shops, hotels and caterers</small>
          </div>
          <div>
            <MessageCircle />
            <b>Bulk Enquiries</b>
            <small>Contact us for wholesale quantities</small>
          </div>
        </section>

        <section className="section wrap" id="products">
          <div className="section-head">
            <div>
              <span className="eyebrow green">OUR COLLECTION</span>
              <h2>Explore our products</h2>
              <p>
                Packaging and disposable supplies for restaurants,
                sweet shops, hotels, caterers and retailers.
              </p>
            </div>

            <div className="searchbox">
              <Search size={18} />
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="chips">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? 'chip active' : 'chip'}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {firebaseError && (
            <p className="notice">
              Firebase connection issue: {firebaseError}
            </p>
          )}

          <div className="product-grid">
            {filtered.map(p => (
              <article className="product-card" key={p.id}>
                <button
                  className="product-image"
                  onClick={() => setSelected(p)}
                >
                  <img
                    src={p.imageUrl || '/product-placeholder.svg'}
                    onError={e => {
                      e.currentTarget.src = '/product-placeholder.svg'
                    }}
                    alt={p.name}
                  />
                  <span>View details <ArrowRight size={14} /></span>
                </button>

                <div className="product-info">
                  <small>{p.category}</small>
                  <h3>{p.name}</h3>

                  <div className="price-row">
                    <b>
                      {p.price > 0 ? money(p.price) : 'Contact for price'}
                    </b>
                    {p.price > 0 && <span> / {p.unit}</span>}
                  </div>

                  <div className="stock">Ask us for availability</div>

                  <button
                    className="btn outline full"
                    onClick={() => setSelected(p)}
                  >
                    Product details
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!filtered.length && (
            <div className="empty">
              No products found. Try another search or category.
            </div>
          )}
        </section>

        <section className="about-band" id="about">
          <div className="wrap about-inner">
            <div>
              <span className="eyebrow">PACKAGING & DISPOSABLE SUPPLIES</span>
              <h2>Packaging essentials.<br />A supplier you can trust.</h2>
              <p>
                We supply paper plates and cups, foil products, food containers,
                sweet and biryani boxes, bags and other disposable packaging items.
                Contact us for product details and bulk enquiries.
              </p>
            </div>
            <div className="about-mark">
              <img src={settings.logoUrl || '/logo.png'} alt="Store logo" />
            </div>
          </div>
        </section>

        <section className="section wrap" id="reviews">
          <div className="section-head">
            <div>
              <span className="eyebrow green">CUSTOMER FEEDBACK</span>
              <h2>What customers say</h2>
              <p>Feedback from our customers.</p>
            </div>
            <div className="rating-summary">
              <Star fill="currentColor" />
              <b>{avg ? avg.toFixed(1) : '—'}</b>
              <small>{reviews.length} approved reviews</small>
            </div>
          </div>

          <div className="review-grid">
            {reviews.slice(0, 6).map(r => (
              <div className="review-card" key={r.id}>
                <div className="stars">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <p>“{r.comment}”</p>
                <b>{r.customerName}</b>
              </div>
            ))}
            {!reviews.length && (
              <p className="muted">Be the first to share your experience.</p>
            )}
          </div>

          <button className="btn outline" onClick={() => setReviewOpen(true)}>
            Write a review
          </button>
        </section>

        <section className="contact-section" id="contact">
          <div className="wrap contact-inner">
            <div>
              <span className="eyebrow">WE'RE HERE TO HELP</span>
              <h2>Need packaging supplies?<br />Talk to our team.</h2>
              <p>
                Contact us for product availability, sizes, pricing and wholesale quantities.
              </p>
              {settings.address && (
                <p className="contact-line"><MapPin />{settings.address}</p>
              )}
            </div>

            <div className="contact-actions">
              {settings.phone && (
                <a className="contact-action" href={`tel:${settings.phone}`}>
                  <Phone />
                  <span><b>Call us</b><small>{settings.phone}</small></span>
                  <ArrowRight />
                </a>
              )}

              {settings.whatsapp && (
                <a
                  className="contact-action"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, I would like to enquire about your packaging products and wholesale rates.')}`}
                >
                  <MessageCircle />
                  <span><b>WhatsApp</b><small>Product & bulk enquiry</small></span>
                  <ArrowRight />
                </a>
              )}

              {settings.email && (
                <a className="contact-action" href={`mailto:${settings.email}`}>
                  <Mail />
                  <span><b>Email us</b><small>{settings.email}</small></span>
                  <ArrowRight />
                </a>
              )}

              {!settings.phone && !settings.whatsapp && !settings.email && (
                <p className="muted">
                  Store contact details will appear here once configured by the admin.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer-inner">
          <span>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </span>
          
        </div>
      </footer>

      {selected && (
        <ProductModal
          product={selected}
          settings={settings}
          onClose={() => setSelected(null)}
        />
      )}

      {reviewOpen && <ReviewModal onClose={() => setReviewOpen(false)} />}
    </>
  )
}

function ProductModal({ product, settings, onClose }: {
  product: Product
  settings: StoreSettings
  onClose: () => void
}) {
  
const productPrice = product.price > 0
  ? `${money(product.price)} / ${product.unit}`
  : 'Contact for price'

const whatsappText =
  `Hello Sri Krishna Enterprise!

I am interested in this product.

Product Name: ${product.name}
Category: ${product.category}
Price: ${productPrice}

Please share product availability, sizes and wholesale rates.

Thank you!`


  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
    : ''

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal product-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X />
        </button>

        <img
          src={product.imageUrl || '/product-placeholder.svg'}
          onError={e => { e.currentTarget.src = '/product-placeholder.svg' }}
          alt={product.name}
        />

        <div>
          <small className="eyebrow green">{product.category}</small>
          <h2>{product.name}</h2>
          <h3 className="modal-price">
            {product.price > 0 ? money(product.price) : 'Contact for price'}
            {product.price > 0 && <small> / {product.unit}</small>}
          </h3>

          <p>{product.description || 'Contact our team for more product information.'}</p>
          <p className="stock">Contact us to confirm availability and bulk rates.</p>

          <div className="modal-contacts">
            {settings.phone && (
              <a className="btn primary" href={`tel:${settings.phone}`}>
                <Phone size={17} /> Call
              </a>
            )}
            {settings.whatsapp && (
              <a
                className="btn whatsapp"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.52 3.48A11.8 11.8 0 0 0 12.08 0C5.55 0 .23 5.32.23 11.85c0 2.09.55 4.13 1.6 5.93L.13 24l6.38-1.67a11.85 11.85 0 0 0 5.57 1.41h.01c6.53 0 11.85-5.32 11.85-11.85 0-3.17-1.23-6.15-3.42-8.41ZM12.09 21.7a9.84 9.84 0 0 1-5.02-1.38l-.36-.21-3.79.99 1.01-3.69-.24-.38a9.82 9.82 0 0 1-1.51-5.18c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.9 7c0 5.45-4.44 9.89-9.89 9.89Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
                </svg>
                WhatsApp Enquiry
              </a>
            )}
            {settings.email && (
              <a className="btn outline" href={`mailto:${settings.email}`}>
                <Mail size={17} /> Email
              </a>
            )}
            {!settings.phone && !settings.whatsapp && !settings.email && (
              <p className="muted">Contact details will be added soon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(5)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()

    if (!firebaseReady) {
      setError('Reviews will be available after the store is connected.')
      return
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        customerName: name.trim(),
        comment: comment.trim(),
        rating,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSent(true)
    } catch {
      setError('Could not submit your review. Please try again later.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal small-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X /></button>

        {sent ? (
          <>
            <Check className="success-icon" />
            <h2>Thank you!</h2>
            <p>Your review has been submitted and will appear after admin approval.</p>
            <button className="btn primary" onClick={onClose}>Close</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2>Write a review</h2>

            <label>
              Your name
              <input
                required
                maxLength={60}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label>Rating
              <div className="rating-pick">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n)}
                    className={n <= rating ? 'chosen' : ''}
                  >
                    ★
                  </button>
                ))}
              </div>
            </label>

            <label>
              Your feedback
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </label>

            {error && <p className="error">{error}</p>}
            <button className="btn primary full">Submit for approval</button>
          </form>
        )}
      </div>
    </div>
  )
}

const ADMIN_UID = 'qQcveA5KYPRhEYSNYFRtY3DqWbz2'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e: FormEvent) {
  e.preventDefault()
  setError('')

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    if (credential.user.uid !== ADMIN_UID) {
      await signOut(auth)
      setError('This account is not authorized to access the Admin Panel.')
      return
    }

    navigate('/admin')
  } catch {
    setError('Login failed. Check your email and password, then try again.')
  }
}

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.png" alt="Store logo" />
        <span className="eyebrow green">STORE MANAGEMENT</span>
        <h1>Admin Login</h1>
        <p>Sign in to manage Sri Krishna Enterprise.</p>

        <label>
          Email address
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn primary full">Sign in securely</button>
        <Link to="/" className="back-link">← Back to store</Link>
      </form>
    </div>
  )
}

function Admin({ user, products, settings, customCategories }: {
  user: User | null
  products: Product[]
  customCategories: CustomCategory[]
  settings: StoreSettings
}) {
  const [tab, setTab] = useState('overview')
  const [allReviews, setAllReviews] = useState<Review[]>([])  //category list delete korte parbe admin oi features add kore dau ... edit er features darkar nei
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '/logo.png')
  const [uploadingImage, setUploadingImage] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    setLogoUrl(settings.logoUrl || '/logo.png')
  }, [settings.logoUrl])

  useEffect(() => {
  if (!user) {
    navigate('/admin/login', { replace: true })
    return
  }

  if (user.uid !== ADMIN_UID) {
    void signOut(auth)
    navigate('/admin/login', { replace: true })
    return
  }

    if (!firebaseReady) return

    return onSnapshot(
      query(collection(db, 'reviews'), orderBy('createdAt', 'desc')),
      snap => setAllReviews(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)),
      ),
      error => setMessage(error.message),
    )
  }, [user, navigate])

  const pending = allReviews.filter(r => r.status === 'pending')

  
async function upload(file: File, folder = 'products') {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be below 5 MB.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'sri_krishna_products')
  formData.append('folder', folder)

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/rwsrymbl/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Cloudinary upload failed.')
  }

  return result.secure_url as string
}


  async function uploadStoreImage(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image.')
      return
    }

    setUploadingImage(true)
    setMessage('')

    try {
      const url = await upload(file, 'store')
      setLogoUrl(url)
      setMessage('Store logo uploaded. Save store settings to publish it.')
    } catch {
      setMessage('Logo upload failed. Check Firebase Storage setup.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function addCategory(name: string) {
    const cleanName = name.trim()

    if (!cleanName) {
      throw new Error('Please enter a category name.')
    }

    const existingCategories = [
      ...categories.filter(c => c !== 'All'),
      ...customCategories.map(category => category.name),
    ]

    if (existingCategories.some(
      c => c.toLowerCase() === cleanName.toLowerCase()
    )) {
      throw new Error('This category already exists.')
    }

    await addDoc(collection(db, 'categories'), {
      name: cleanName,
      createdAt: serverTimestamp(),
    })
  }

  async function deleteCategory(category: CustomCategory) {
      const usedByProducts = products.some(
        product => product.category === category.name
      )

      if (usedByProducts) {
        setMessage(
          `Cannot delete "${category.name}". First change the category of its products.`
        )
        return
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${category.name}" category?`
      )

      if (!confirmed) return

      try {
        await deleteDoc(doc(db, 'categories', category.id))
        setMessage(`Category "${category.name}" deleted successfully.`)
      } catch (error) {
        console.error('Category delete error:', error)
        setMessage('Could not delete category. Check Firebase permissions.')
      }
    }

  async function saveProduct(data: Omit<Product, 'id'>, id?: string) {
    setSaving(true)

    try {
      if (id) {
        await updateDoc(doc(db, 'products', id), data as Record<string, unknown>)
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
        })
      }

      setShowForm(false)
      setEditing(null)
      setMessage('Product saved successfully.')
    } catch {
      setMessage('Could not save product. Check Firebase setup and permissions.')
    } finally {
      setSaving(false)
    }
  }

  
async function saveSettings(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setMessage('Saving store settings...');

  const formData = new FormData(e.currentTarget);

  const data = {
    storeName: String(formData.get('storeName') || ''),
    tagline: String(formData.get('tagline') || ''),
    phone: String(formData.get('phone') || ''),
    whatsapp: String(formData.get('whatsapp') || ''),
    email: String(formData.get('email') || ''),
    address: String(formData.get('address') || ''),
    logoUrl,
  };

  try {
    await setDoc(doc(db, 'settings', 'store'), data, {
      merge: true,
    });

    setMessage('Store settings saved successfully!');
  } catch (error) {
    console.error('Store settings save error:', error);

    setMessage(
      error instanceof Error
        ? `Save failed: ${error.message}`
        : 'Could not save store settings.'
    );
  }
}


  async function setReview(id: string, status: 'approved' | 'rejected') {
    try {
      await updateDoc(doc(db, 'reviews', id), { status })
      setMessage(`Review ${status}.`)
    } catch {
      setMessage('Could not update review.')
    }
  }

  async function removeProduct(id: string) {
    if (!window.confirm('Delete this product?')) return

    try {
      await deleteDoc(doc(db, 'products', id))
      setMessage('Product deleted.')
    } catch {
      setMessage('Could not delete product.')
    }
  }

 if (!user || user.uid !== ADMIN_UID) return null

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand">
          <img src={logoUrl || '/logo.png'} alt="Store logo" />
          <span>Sri Krishna<small>ADMIN PANEL</small></span>
        </Link>

        <nav>
          {[
            ['overview', '▦', 'Overview'],
            ['products', '▣', 'Products'],
            ['reviews', '☆', 'Reviews'],
            ['settings', '⚙', 'Store settings'],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? 'selected' : ''}
              onClick={() => setTab(id)}
            >
              <span>{icon}</span>{label}
              {id === 'reviews' && pending.length > 0 && (
                <i>{pending.length}</i>
              )}
            </button>
          ))}
        </nav>

        <button className="logout" onClick={() => signOut(auth)}>
          <LogOut /> Sign out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top">
          <div>
            <small>STORE MANAGEMENT</small>
            <h1>
              {tab === 'overview' ? 'Overview'
                : tab === 'products' ? 'Manage products'
                : tab === 'reviews' ? 'Customer reviews'
                : 'Store settings'}
            </h1>
          </div>

          <span className="admin-user">
            <CircleUserRound /> {user.email}
          </span>
        </div>

        {message && (
          <div className="notice">
            {message}
            <button onClick={() => setMessage('')}><X size={15} /></button>
          </div>
        )}

        {tab === 'overview' && (
          <>
            <div className="stat-grid">
              <div className="stat">
                <Package /><b>{products.length}</b>
                <span>Total products</span>
              </div>
              <div className="stat">
                <ShoppingBasket />
                <b>{products.filter(p => p.active).length}</b>
                <span>Active products</span>
              </div>
              <div className="stat">
                <Star /><b>{pending.length}</b>
                <span>Reviews awaiting approval</span>
              </div>
            </div>

            <div className="admin-panel">
              <h2>Quick actions</h2>
              <div className="quick-actions">
                <button onClick={() => {
                  setEditing(null)
                  setShowForm(true)
                  setTab('products')
                }}>
                  <Plus /> Add a product
                </button>
                <button onClick={() => setTab('reviews')}>
                  <Star /> Review feedback
                </button>
                <button onClick={() => setTab('settings')}>
                  <Settings /> Edit store details
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'products' && (
          <div className="admin-panel">
            <div className="panel-heading">
              <h2>Products ({products.length})</h2>
              <button
                className="btn primary"
                onClick={() => {
                  setEditing(null)
                  setShowForm(true)
                }}
              >
                <Plus size={17} /> Add product
              </button>
            </div>

            <div className="admin-product-list">
              {products.map(p => (
                <div className="admin-product" key={p.id}>
                  <img
                    src={p.imageUrl || '/product-placeholder.svg'}
                    alt={p.name}
                  />

                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.category} · {p.price > 0 ? money(p.price) : 'Contact for price'} · Stock: {p.stock}
                    </small>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={() => {
                      setEditing(p)
                      setShowForm(true)
                    }}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil />
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() => removeProduct(p.id)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>

            {!products.length && (
              <p className="muted">No products yet. Add your first product.</p>              
            )}
            <div className="category-management">
              <h2>Manage Custom Categories</h2>

              {!customCategories.length ? (
                <p className="muted">No custom categories added yet.</p>
              ) : (
                <div className="category-admin-list">
                  {customCategories.map(category => (
                    <div className="category-admin-item" key={category.id}>
                      <span>{category.name}</span>

                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => deleteCategory(category)}
                        aria-label={`Delete ${category.name}`}
                        title="Delete category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
                {tab === 'reviews' && (
          <div className="admin-panel">
            <h2>Review moderation</h2>

            {allReviews.map(r => (
              <div className="moderation-card" key={r.id}>
                <div>
                  <b>{r.customerName}</b>
                  <span className="stars">{'★'.repeat(r.rating)}</span>
                  <p>{r.comment}</p>
                  <small className={`status ${r.status}`}>{r.status}</small>
                </div>

                {r.status === 'pending' && (
                  <div className="moderation-actions">
                    <button
                      className="btn primary"
                      onClick={() => setReview(r.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn outline"
                      onClick={() => setReview(r.id, 'rejected')}
                    >
                      Reject
                    </button>         
                  </div>
                )}
              </div>
            ))}

            {!allReviews.length && (
              <p className="muted">No reviews submitted yet.</p>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="admin-panel">
            <h2>Store information</h2>

            <form className="settings-form" onSubmit={saveSettings}>
              <label>
                Store name
                <input name="storeName" defaultValue={settings.storeName} />
              </label>

              <label>
                Tagline
                <input name="tagline" defaultValue={settings.tagline} />
              </label>

              <label>
                Phone number
                <input name="phone" defaultValue={settings.phone} />
              </label>

              <label>
                WhatsApp number (with country code)
                <input
                  name="whatsapp"
                  defaultValue={settings.whatsapp}
                  placeholder="91XXXXXXXXXX"
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  defaultValue={settings.email}
                />
              </label>

              <label>
                Store address
                <textarea name="address" defaultValue={settings.address} />
              </label>

              <div className="image-upload-field">
                <label>
                  Store logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => uploadStoreImage(e.target.files?.[0])}
                  />
                </label>
                {logoUrl && (
                  <img className="image-preview logo-preview" src={logoUrl} alt="Logo preview" />
                )}
              </div>

              {uploadingImage && <p>Uploading image...</p>}

              <button
                type="submit"
                className="btn primary"
                disabled={uploadingImage}
              >
                Save store settings
              </button>
            </form>
          </div>
        )}
      </main>

      {showForm && (
        <ProductForm
          product={editing}
          saving={saving}
          onClose={() => setShowForm(false)}
          onSave={saveProduct}
          onUpload={file => upload(file, 'products')}
          //categories={[...categories.filter(c => c !== 'All'), ...customCategories]}
          categories={[
            ...categories.filter(c => c !== 'All'),
            ...customCategories.map(category => category.name)
          ]}
          onAddCategory={addCategory}
        />
      )}
    </div>
  )
}

function ProductForm({
  product,
  saving,
  onClose,
  onSave,
  onUpload,
  categories,
  onAddCategory,
}: {
  product: Product | null
  saving: boolean
  onClose: () => void
  onSave: (data: Omit<Product, 'id'>, id?: string) => void
  onUpload: (file: File) => Promise<string>
  categories: string[]
  onAddCategory: (name: string) => Promise<void>
}) {
  const [image, setImage] = useState(product?.imageUrl || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [selectedCategory, setSelectedCategory] = useState(
    product?.category || categories[0] || ''
  )

  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  async function handleAddCategory() {
    const cleanName = newCategory.trim()

    if (!cleanName) {
      setError('Please enter a category name.')
      return
    }

    if (
      categories.some(
        category => category.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      setError('This category already exists.')
      return
    }

    setAddingCategory(true)
    setError('')

    try {
      await onAddCategory(cleanName)
      setSelectedCategory(cleanName)
      setNewCategory('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add category.'
      )
    } finally {
      setAddingCategory(false)
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const data = {
      name: String(formData.get('name') || '').trim(),
      category: selectedCategory,
      price: Number(formData.get('price') || 0),
      unit: String(formData.get('unit') || 'pack'),
      stock: Number(formData.get('stock') || 0),
      description: String(formData.get('description') || ''),
      imageUrl: image,
      active: formData.get('active') === 'on',
    }

    if (
      !data.name ||
      !data.category ||
      data.price < 0 ||
      data.stock < 0
    ) {
      setError('Please check product name, category, price and stock.')
      return
    }

    onSave(data, product?.id)
  }

  async function fileChange(file?: File) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be below 5 MB.')
      return
    }

    setUploading(true)
    setError('')

    try {
      setImage(await onUpload(file))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Image upload failed.'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal form-modal"
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
        >
          <X />
        </button>

        <h2>{product ? 'Edit product' : 'Add product'}</h2>

        <label>
          Product name
          <input
            name="name"
            required
            defaultValue={product?.name}
          />
        </label>

        <label>
          Category

          <select
            name="category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            New category
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Enter new category"
            />
          </label>

          <button
            type="button"
            className="btn outline"
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategory.trim()}
          >
            {addingCategory ? 'Adding...' : 'Add Category'}
          </button>
        </div>

        <div className="form-row">
          <label>
            Price (₹)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.price ?? 0}
            />
          </label>

          <label>
            Unit
            <input
              name="unit"
              required
              placeholder="pack / roll / piece"
              defaultValue={product?.unit || 'pack'}
            />
          </label>
        </div>

        <label>
          Available stock
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            defaultValue={product?.description || ''}
          />
        </label>

        <label>
          Product image
          <input
            type="file"
            accept="image/*"
            onChange={e => fileChange(e.target.files?.[0])}
          />
        </label>

        {uploading && <small>Uploading image...</small>}

        {image && (
          <img
            className="image-preview"
            src={image}
            alt="Product preview"
          />
        )}

        <label className="checkbox">
          <input
            name="active"
            type="checkbox"
            defaultChecked={product?.active ?? true}
          />
          Show product on customer website
        </label>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="btn primary full"
          disabled={saving || uploading || addingCategory}
        >
          {saving ? 'Saving...' : 'Save product'}
        </button>
      </form>
    </div>
  )
}

export default App