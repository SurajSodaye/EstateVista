# EstateVista — Luxury Real Estate Frontend

A modern, responsive, and creative public-facing real estate website frontend built with **React**, **Vite**, and **Tailwind CSS**.

---

## 🎨 Design System & Palette

- **Deep Forest Green**: `#153E35` (`brand-forest`)
- **Warm Ivory Background**: `#F8F7F2` (`brand-ivory`)
- **Pure White**: `#FFFFFF`
- **Muted Sage**: `#DCE8DF` (`brand-sage`)
- **Charcoal Text**: `#202923` (`brand-charcoal`)
- **Subtle Gold Accent**: `#C7A76C` (`brand-gold`)
- **Secondary Text**: `#737B75`
- **Typography**:
  - Headings: *Playfair Display* (Serif)
  - Body: *Plus Jakarta Sans* (Sans-serif)

---

## 📂 Project Architecture

```
src/
├── app/
│   ├── App.jsx                     # Root application with BrowserRouter
│   └── router.jsx                  # Route definitions and ScrollToTop helper
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              # Responsive header with glassmorphism & mobile drawer
│   │   └── Footer.jsx              # Multi-column footer with quick links & placeholders
│   ├── common/
│   │   ├── Button.jsx              # Reusable button with variants (primary, secondary, gold, outline, etc.)
│   │   ├── Input.jsx               # Form text/email/tel input with validation & icons
│   │   ├── Select.jsx              # Styled dropdown select
│   │   ├── Badge.jsx               # Tags for Sale, Rent, Featured, Type, Status
│   │   ├── LoadingState.jsx        # Subtle spinner & loading animation
│   │   ├── EmptyState.jsx          # Illustrated empty results with reset action
│   │   └── NotFoundState.jsx       # 404 message with navigation actions
│   ├── property/
│   │   ├── PropertyCard.jsx        # Card with price (₹ Cr/Lakh), specs, favorite toggle
│   │   ├── PropertyGrid.jsx        # Adaptive multi-column grid
│   │   ├── PropertySearch.jsx      # Hero search panel with Buy/Rent tabs & budget selector
│   │   ├── PropertyFilters.jsx     # Desktop sidebar & mobile bottom sheet drawer
│   │   ├── PropertyGallery.jsx     # Image viewer with thumbnail strip & full-screen lightbox
│   │   └── PropertyInquiryForm.jsx # Validated inquiry form with demo feedback state
│   └── agent/
│       └── AgentCard.jsx           # Advisor card with ratings, agency, and listing counts
├── pages/
│   ├── Home.jsx                    # Hero, categories, featured, locations, why us, how it works, latest
│   ├── Properties.jsx              # Search & discovery with URL-synced multi-criteria filters
│   ├── PropertyDetails.jsx         # Full property specs, gallery, advisor card, inquiry, related items
│   ├── Agents.jsx                  # Advisor directory with city filters
│   ├── AgentDetails.jsx            # Advisor bio, specialties, contact details, listed properties
│   ├── About.jsx                   # Mission, discovery philosophy, and UX principles
│   ├── Contact.jsx                 # Validated contact form, office placeholders, FAQ accordion
│   ├── Login.jsx                   # Sign-in UI with password toggle & validation
│   ├── Register.jsx                # Account creation UI with buyer/agent role selector
│   ├── ForgotPassword.jsx          # Password recovery UI
│   └── NotFound.jsx                # 404 page
├── data/
│   ├── properties.js               # Demonstration dataset of 12 luxury properties across 6 metros
│   └── agents.js                   # Demonstration dataset of 6 accredited advisors
├── services/
│   ├── propertyService.js          # Async data abstraction ready for Firebase Firestore
│   └── agentService.js             # Async agent abstraction
├── utils/
│   ├── formatCurrency.js           # Indian Rupee (`₹`) formatter (Cr, Lakh, K) and area formatting
│   ├── formatDate.js               # Date and relative time formatters
│   └── validation.js               # Form validation helpers
└── styles/
    └── index.css                   # Tailwind base directives and custom glassmorphism styles
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
Production assets are output to the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🔗 Planned Firebase Integration (Phase 2)

The frontend is architected with clean service abstraction layers:

1. **Authentication**:
   - `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx` are wired to form validation and ready to bind with `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, and `sendPasswordResetEmail`.
2. **Properties & Search**:
   - `src/services/propertyService.js` returns Promises and can be seamlessly switched to read from `collection(db, 'properties')` with Firestore query constraints (`where`, `orderBy`, `limit`).
3. **Inquiries & Contact**:
   - `PropertyInquiryForm.jsx` and `Contact.jsx` handlers are structured to execute `addDoc(collection(db, 'inquiries'), payload)`.
4. **Media Uploads**:
   - Storage uploads can populate `imageUrls` arrays directly into the property schema.
