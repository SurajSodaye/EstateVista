# EstateVista — Comprehensive Firebase Integration Plan

> **Status Notice:** This document is a pre-implementation architectural specification. **Firebase is not yet connected to EstateVista.** The application currently runs exclusively on client-side React with demonstration datasets in `src/data/` and asynchronous abstraction layers in `src/services/`. No packages have been installed, no application code has been modified, and demo datasets remain intact.

---

## 1. Current Frontend Architecture & Existing Functionality

### 1.1 Technology Stack & Structure
EstateVista is a modern Single Page Application (SPA) built with:
- **Build Tool & Runtime:** Vite v5 (`vite.config.js`) with React 18 (`@vitejs/plugin-react`).
- **Styling:** Tailwind CSS v3 (`tailwind.config.js`) with custom color tokens:
  - Deep Forest Green (`#153E35`), Warm Ivory (`#F8F7F2`), Pure White (`#FFFFFF`), Muted Sage (`#DCE8DF`), Charcoal (`#202923`), Subtle Gold (`#C7A76C`), Secondary Text (`#737B75`).
- **Routing:** `react-router-dom` v6 with client-side browser history and automatic `ScrollToTop` helper in `src/app/router.jsx`.
- **Icons:** `lucide-react`.

### 1.2 Routing Surface
| Route | Component | Current State |
|---|---|---|
| `/` | `src/pages/Home.jsx` | Full landing page: Hero search, Categories, Featured grid, Locations, Why Us, How It Works, Latest listings, Partner CTA. |
| `/properties` | `src/pages/Properties.jsx` | Property search & discovery: Multi-criteria filters, URL query param sync (`listingType`, `city`, `propertyType`, `bedrooms`, `minPrice`, `maxPrice`, `sortBy`, `query`), active filter chips, load more pagination. |
| `/properties/:id` | `src/pages/PropertyDetails.jsx` | Full property view: Lightbox gallery, specifications, description, amenities, mock map, agent card, inquiry form, related listings, 404 handler. |
| `/agents` | `src/pages/Agents.jsx` | Public advisor directory: Location pills, search by name/agency/specialty, card badges. |
| `/agents/:id` | `src/pages/AgentDetails.jsx` | Advisor profile: Bio, contact details, assigned properties list, 404 handler. |
| `/about` | `src/pages/About.jsx` | Platform mission, visual fidelity principles, architectural standards. |
| `/contact` | `src/pages/Contact.jsx` | Validated contact form, office locations, interactive FAQ accordion. |
| `/login` | `src/pages/Login.jsx` | UI form with email/password validation & password visibility toggle. |
| `/register` | `src/pages/Register.jsx` | UI form with role selector (`Buyer or Tenant` vs `Owner or Advisor`), field validation, password toggle. |
| `/forgot-password` | `src/pages/ForgotPassword.jsx` | UI password reset submission with simulated confirmation state. |
| `*` | `src/pages/NotFound.jsx` | Global 404 fallback with return-to-home actions. |

### 1.3 Service Abstraction & Data Flow
Currently, data access is decoupled from presentation components through asynchronous service functions returning Promises:
- **`src/services/propertyService.js`**: `getAllProperties()`, `getFeaturedProperties()`, `getLatestProperties(limit)`, `getPropertyById(id)`, `getRelatedProperties(currentId, limit)`, `searchProperties(filters)`, `getPropertyCountByLocation(cityName)`, `getPropertyCountByType(typeName)`.
- **`src/services/agentService.js`**: `getAllAgents()`, `getAgentById(id)`.
- **Current Data Source:** `src/data/properties.js` (12 luxury properties) and `src/data/agents.js` (6 advisor profiles).
- **Form Handlers:**
  - `PropertyInquiryForm.jsx`: Validates `name`, `email`, `phone`, `message` and sets a client-side success flag.
  - `Contact.jsx`: Validates `name`, `email`, `phone`, `subject`, `message` and sets a client-side success flag.
  - `PropertyCard.jsx` & `PropertyDetails.jsx`: Favorite toggles currently toggle an ephemeral local component state (`isFavorite`).

---

## 2. Firebase Project Setup Steps for Beginners

Follow these steps step-by-step in the web browser before touching any code:

### Step 1: Create a Firebase Account and Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google Account.
2. Click **Add project** (or **Create a project**).
3. Enter the project name: `estatevista-prod` (or your preferred unique identifier).
4. **Google Analytics:** You can enable Google Analytics (free) or disable it for simplicity.
5. Click **Create project** and wait for Google Cloud infrastructure provisioning to complete.

### Step 2: Register a Web Application
1. In the Firebase Console Project Overview page, click the **Web icon (`</>`)** to register a web app.
2. Enter an App nickname, e.g., `EstateVista Web`.
3. Leave *Firebase Hosting* unchecked for now (can be added later).
4. Click **Register app**.
5. Firebase will display a `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
6. **Do NOT paste these values directly into Git-committed source files.** Keep this window open; we will map these to `.env.local` as detailed in Section 10.

### Step 3: Enable Cloud Firestore
1. In the Firebase Console left sidebar, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. **Database location:** Select the region closest to your target audience (e.g., `asia-south1` for Mumbai, India). *Note: Database location cannot be changed after creation.*
4. **Security Rules mode:** Choose **Start in test mode** for initial development (valid for 30 days) OR start in production mode and immediately apply the secure rules defined in Section 9.

### Step 4: Enable Firebase Authentication
1. In the sidebar, click **Build** > **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable **Email/Password** and click **Save**. *(Optionally enable Email link / passwordless if desired later).*

### Step 5: Enable Cloud Storage
1. In the sidebar, click **Build** > **Storage**.
2. Click **Get started**.
3. Accept the default security rules prompt.
4. Select the storage bucket location (matching your Firestore region, e.g., `asia-south1`).
5. Click **Done**.

---

## 3. Required Firebase Services

EstateVista requires four foundational Firebase services:

```
┌─────────────────────────────────────────────────────────────┐
│                       EstateVista Client                    │
└──────┬──────────────────────┬───────────────┬───────────────┘
       │                      │               │
       ▼                      ▼               ▼
┌──────────────┐       ┌─────────────┐ ┌─────────────┐
│ Firebase     │       │ Cloud       │ │ Cloud       │
│ Auth         │       │ Firestore   │ │ Storage     │
├──────────────┤       ├─────────────┤ ├─────────────┤
│ • Sign Up    │       │ • Properties│ │ • Property  │
│ • Sign In    │       │ • Agents    │ │   Galleries │
│ • Reset PW   │       │ • Inquiries │ │ • Agent     │
│ • User state │       │ • Favorites │ │   Avatars   │
│ • ID Tokens  │       │ • Profiles  │ │ • Floorplans│
└──────────────┘       └─────────────┘ └─────────────┘
       │                      │               │
       └──────────────────────┴───────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │    Firebase Security Rules  │
               │ (Client Data Authorization) │
               └─────────────────────────────┘
```

1. **Firebase Authentication (`firebase/auth`):**
   - Handles email/password authentication, password recovery, session persistence across reloads (`browserLocalPersistence`), and JWT ID tokens containing User UID.
2. **Cloud Firestore (`firebase/firestore`):**
   - High-performance NoSQL document database storing searchable properties, agent portfolios, user profiles, inquiries, and customer favorites.
3. **Cloud Storage (`firebase/storage`):**
   - Object storage bucket hosting high-resolution architectural photography, floorplan diagrams, and advisor profile images.
4. **Firebase Security Rules:**
   - Server-side declarations enforced by Google’s edge infrastructure validating all client reads and writes against user identity and permissions.

---

## 4. Recommended Firestore Collections & Document Schemas

To maintain 100% compatibility with existing components (`PropertyCard`, `PropertyGallery`, `AgentCard`, `PropertyInquiryForm`), document schemas must mirror the existing data models.

### 4.1 Collection: `users`
Stores user profile information and authorization role. Document ID = User UID (`auth.uid`).

```json
{
  "uid": "USER_UID_STRING",
  "email": "customer@example.com",
  "fullName": "Rohini Mehta",
  "phoneNumber": "+91 98200 55443",
  "role": "customer",
  "assignedAgentId": null,
  "createdAt": "2026-10-10T10:00:00.000Z",
  "updatedAt": "2026-10-10T10:00:00.000Z"
}
```

### 4.2 Collection: `properties`
Stores public listings. Document ID = Firestore Auto-ID (or imported legacy ID like `prop-1`).

```json
{
  "id": "prop-1",
  "title": "The Celestia Sky Villa — Sea-Facing Penthouse",
  "description": "Perched high above the Arabian Sea...",
  "listingType": "Buy",
  "propertyType": "Apartment",
  "price": 385000000,
  "pricePeriod": null,
  "location": "Pali Hill, Bandra West, Mumbai",
  "city": "Mumbai",
  "locality": "Bandra West",
  "bedrooms": 5,
  "bathrooms": 6,
  "areaSqFt": 6200,
  "amenities": [
    "Sea View",
    "Private Infinity Pool",
    "Direct Elevator Access"
  ],
  "imageUrls": [
    "https://firebasestorage.googleapis.com/.../celestia_1.jpg",
    "https://firebasestorage.googleapis.com/.../celestia_2.jpg"
  ],
  "agentId": "agent-1",
  "isFeatured": true,
  "furnishing": "Fully Furnished",
  "facing": "West",
  "parkingSlots": 4,
  "floor": "38th of 40 Floors",
  "status": "Ready to Move",
  "isPublished": true,
  "createdAt": "2026-09-28T10:30:00.000Z",
  "updatedAt": "2026-09-28T10:30:00.000Z",
  "createdByUid": "AGENT_OR_ADMIN_UID"
}
```

### 4.3 Collection: `agents`
Stores public advisor profiles. Document ID = Auto-ID or Agent ID (e.g., `agent-1`).

```json
{
  "id": "agent-1",
  "userId": "OPTIONAL_LINKED_AUTH_UID",
  "name": "Arjun Singhania",
  "agency": "Singhania Luxury Estates",
  "title": "Principal Luxury Consultant",
  "email": "arjun.singhania@estatevista.demo",
  "phone": "+91 98201 44520",
  "avatar": "https://firebasestorage.googleapis.com/.../arjun.jpg",
  "serviceLocations": ["Mumbai", "Bandra West", "Worli"],
  "experienceYears": 12,
  "specialties": ["Luxury Seafront Penthouses", "Heritage Bungalows"],
  "bio": "Arjun brings over a decade of distinguished experience...",
  "rating": 4.9,
  "reviewCount": 38,
  "isActive": true,
  "createdAt": "2026-09-01T00:00:00.000Z"
}
```

### 4.4 Collection: `inquiries`
Stores inquiries from `PropertyInquiryForm.jsx` and `Contact.jsx`.

```json
{
  "propertyId": "prop-1",
  "propertyTitle": "The Celestia Sky Villa — Sea-Facing Penthouse",
  "agentId": "agent-1",
  "senderName": "Aarav Sharma",
  "senderEmail": "aarav@example.com",
  "senderPhone": "+91 98200 11223",
  "message": "I would like to schedule a private tour of this residence.",
  "inquiryType": "property",
  "subject": null,
  "status": "new",
  "createdAt": "2026-10-10T12:00:00.000Z",
  "senderUid": "OPTIONAL_LOGGED_IN_UID"
}
```

### 4.5 Collection: `favorites`
Stores customer-saved properties. Recommended Subcollection: `users/{uid}/favorites/{propertyId}`.

```json
{
  "propertyId": "prop-1",
  "addedAt": "2026-10-10T12:30:00.000Z"
}
```
*Why this subcollection pattern?* 
- Querying a user's favorites is an ultra-fast subcollection query: `collection(db, 'users', uid, 'favorites')`.
- Security rules become simple: a user can only read/write their own subcollection (`request.auth.uid == uid`).

---

## 5. User Roles: Customer, Agent, Admin

| Role | Permissions & Capabilities |
|---|---|
| **Customer** (`customer`) | - Browse all published properties and agent profiles.<br>- Save/unsave favorite properties.<br>- Submit property inquiries and general contact requests.<br>- View and edit their own customer profile. |
| **Agent** (`agent`) | - All customer permissions.<br>- Create, edit, and update properties linked to their `agentId`.<br>- View inquiries directed to their listed properties.<br>- Update their public advisor biography and contact details. |
| **Admin** (`admin`) | - Full read/write access across all collections.<br>- Publish, unpublish, or delete any listing.<br>- Create and assign new agents.<br>- Manage user role assignments.<br>- View platform-wide metrics and all submitted inquiries. |

---

## 6. Secure Role Assignment & Authorization

> ⚠️ **CRITICAL SECURITY PRINCIPLE:**
> Users must **never** be permitted to set their own role to `admin` or `agent` by sending a role parameter from client-side code during registration. Any client-sent role can be intercepted and manipulated using browser developer tools.

### Recommended Secure Architecture:

```
[ Client Registration Form ]
            │ (sends email, password, name)
            ▼
[ Firebase Auth: createUserWithEmailAndPassword ]
            │
            ▼
[ Client writes to users/{uid} ]
            │
            ▼
[ FIRESTORE SECURITY RULES CHECK ]
    • Only allow role == 'customer' on document creation
    • Forbid modifications to 'role' by any non-admin!
```

### Implementation Approaches:
1. **Option A: Client Creation with Strict Security Rules (Beginner-Friendly, No Cloud Functions required)**
   - When a user registers in `Register.jsx`, the client writes their document to `users/{uid}`.
   - The security rule explicitly enforces:
     `request.resource.data.role == 'customer'`
   - The security rule strictly prohibits any user from updating their own `role` field:
     `request.resource.data.role == resource.data.role`
   - Role promotion to `agent` or `admin` is performed manually by an administrator directly in the Firebase Console (or through a secure admin script).
2. **Option B: Firebase Custom Claims via Cloud Functions (Advanced / Production Standard)**
   - Cloud Functions (or a server endpoint using Firebase Admin SDK) executes:
     `admin.auth().setCustomUserClaims(uid, { role: 'admin' })`
   - The role is embedded cryptographically inside the user's JWT ID token (`request.auth.token.role`).
   - *Recommendation for EstateVista Phase 2:* Start with **Option A** (Firestore role field with immutable rules) so beginners do not need to configure Node.js Cloud Functions or Blaze billing immediately.

---

## 7. Migration Plan from Demo Datasets to Firestore

The migration must preserve existing component prop interfaces (`PropertyCard`, `PropertyGrid`, `PropertyGallery`, `AgentCard`).

### Phase-by-Phase Migration Strategy:

```
[ src/data/properties.js ]  ──(One-time Seeding Script)──► [ Firestore: properties ]
[ src/data/agents.js ]      ──(One-time Seeding Script)──► [ Firestore: agents ]
                                                                     │
                                                                     ▼
                                                      [ src/services/propertyService.js ]
                                                      [ src/services/agentService.js ]
                                                                     │
                                                                     ▼
                                                      [ Existing UI Components (Unchanged) ]
```

### 7.1 Preserve Service Signatures
`src/services/propertyService.js` and `src/services/agentService.js` already return Promises with identical shapes. When transitioning:
- Replace internal `new Promise(resolve => resolve(DEMO_PROPERTIES))` with Firestore SDK calls:
  - `getDocs(collection(db, 'properties'))`
  - `getDoc(doc(db, 'properties', id))`
  - `query(collection(db, 'properties'), where(...), orderBy(...))`
- Components like `Home.jsx`, `Properties.jsx`, `PropertyDetails.jsx`, and `Agents.jsx` will receive the exact same array shapes and require **zero layout or prop changes**.

### 7.2 Database Seeding Script (`scripts/seedFirestore.js`)
Create a safe Node.js script utilizing `firebase-admin` or client SDK with an admin user to upload the existing 12 properties from `src/data/properties.js` and 6 agents from `src/data/agents.js` into Firestore. Keep demo files as offline test mocks.

---

## 8. Image Upload & Property Storage Workflow

Currently, property images use remote Unsplash URLs. In production with Firebase Storage:

### 8.1 Storage Bucket Hierarchy
```
estatevista.appspot.com/
├── properties/
│   └── {propertyId}/
│       ├── cover.jpg
│       ├── gallery_01.jpg
│       └── gallery_02.jpg
├── agents/
│   └── {agentId}/
│       └── avatar.jpg
└── floorplans/
    └── {propertyId}/
        └── level_1.pdf
```

### 8.2 Client-Side Upload Flow
1. **File Selection:** User selects an image (`<input type="file" accept="image/jpeg,image/png,image/webp">`).
2. **Client Validation:**
   - File size check: Maximum 5MB per image.
   - MIME type check: `image/jpeg`, `image/png`, `image/webp`.
3. **Upload Execution:**
   ```javascript
   import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
   
   const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);
   const uploadTask = uploadBytesResumable(storageRef, file);
   ```
4. **Progress Feedback:** Listen to `uploadTask.on('state_changed', snapshot => ...)` for upload progress percentage bars.
5. **URL Persistence:** Retrieve public download URL with `getDownloadURL(uploadTask.snapshot.ref)` and push the string to the property’s `imageUrls` array in Firestore.

---

## 9. Firebase Security Rules Specifications

Security rules protect your database from unauthorized reads, writes, and modifications.

### 9.1 Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }
    
    function isAgent() {
      return isAuthenticated() && (getUserData().role == 'agent' || isAdmin());
    }

    // 1. Users collection
    match /users/{userId} {
      // Any authenticated user can read their own profile; admins can read all
      allow read: if isOwner(userId) || isAdmin();
      
      // On creation, role must be 'customer'
      allow create: if isOwner(userId) && request.resource.data.role == 'customer';
      
      // Users cannot change their own role; only admins can modify roles
      allow update: if isOwner(userId) && request.resource.data.role == resource.data.role
                    || isAdmin();
      allow delete: if isAdmin();

      // Favorites subcollection
      match /favorites/{propertyId} {
        allow read, write: if isOwner(userId);
      }
    }

    // 2. Properties collection
    match /properties/{propertyId} {
      // Anyone (even unauthenticated guests) can view published properties
      allow read: if resource.data.isPublished == true || isAgent();
      
      // Only certified agents or admins can create/update listings
      allow create: if isAgent();
      allow update: if isAdmin() || (isAgent() && resource.data.createdByUid == request.auth.uid);
      allow delete: if isAdmin();
    }

    // 3. Agents directory
    match /agents/{agentId} {
      // Public directory is viewable by all
      allow read: if true;
      allow write: if isAdmin();
    }

    // 4. Inquiries collection
    match /inquiries/{inquiryId} {
      // Anyone can submit an inquiry with valid required fields
      allow create: if request.resource.data.senderName != null
                    && request.resource.data.senderEmail != null
                    && request.resource.data.message != null;
      // Only agents and admins can read inquiries
      allow read: if isAgent();
      allow update, delete: if isAdmin();
    }
  }
}
```

### 9.2 Cloud Storage Security Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Properties image storage
    match /properties/{propertyId}/{fileName} {
      // Anyone can view property images
      allow read: if true;
      // Only authenticated agents or admins can upload images under 5MB
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Agent avatars
    match /agents/{agentId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 10. Required Environment Variables & Safe `.env.example`

In Vite applications, client-exposed environment variables **must** begin with `VITE_`.

### 10.1 Safe `.env.example`
Create a `.env.example` file in the project root:

```ini
# EstateVista Firebase Client Configuration
# Obtain these values from: Firebase Console > Project Settings > General > Your Apps > Web App
VITE_FIREBASE_API_KEY=AIzaSyYourApiKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 10.2 Critical Security Rules Regarding Keys:
- **Never include Service Account Keys in Frontend:** Files like `serviceAccountKey.json`, private keys, or server admin secrets grant full bypass of security rules. They must **never** exist in a client-side Vite project or Git repository.
- **Vite Public Keys are Identifiers, Not Secrets:** Firebase Web API Keys identify your project to Google APIs. They are public by design, but your database is protected by **Firebase Security Rules** (Section 9).
- **Git Ignore:** Ensure `.env.local` and `.env` containing real keys are listed in `.gitignore`.

---

## 11. Phased Implementation & Testing Checklist

### Phase 1: Preparation & SDK Setup (Planned)
- [ ] Create Firebase Project in Firebase Console.
- [ ] Enable Auth (Email/Password), Firestore, and Storage.
- [ ] Install Firebase SDK: `npm install firebase`.
- [ ] Create `src/lib/firebase.js` to initialize the Firebase app and export `auth`, `db`, and `storage`.
- [ ] Create `.env.example` and local `.env.local`.

### Phase 2: Authentication Integration (Planned)
- [ ] Create `src/context/AuthContext.jsx` providing `currentUser`, `userRole`, `login()`, `signup()`, `logout()`, `resetPassword()`.
- [ ] Connect `src/pages/Login.jsx` to `signInWithEmailAndPassword`.
- [ ] Connect `src/pages/Register.jsx` to `createUserWithEmailAndPassword` + Firestore user profile creation.
- [ ] Connect `src/pages/ForgotPassword.jsx` to `sendPasswordResetEmail`.
- [ ] Update `Navbar.jsx` to display current user profile/sign out button when logged in.

### Phase 3: Firestore Service Migration (Planned)
- [ ] Write and run one-time seeding script to populate Firestore with `DEMO_PROPERTIES` and `DEMO_AGENTS`.
- [ ] Update `src/services/propertyService.js` to fetch from `collection(db, 'properties')`.
- [ ] Update `src/services/agentService.js` to fetch from `collection(db, 'agents')`.
- [ ] Verify search filters, bedroom filters, price sorting, and pagination on `/properties`.
- [ ] Verify single property lookup and 404 handling on `/properties/:id`.

### Phase 4: Inquiries & Favorites Persistence (Planned)
- [ ] Connect `PropertyInquiryForm.jsx` to write to `collection(db, 'inquiries')`.
- [ ] Connect `Contact.jsx` to write to `collection(db, 'inquiries')` with `inquiryType: 'general'`.
- [ ] Replace local favorite toggle in `PropertyCard.jsx` and `PropertyDetails.jsx` with writes to `users/{uid}/favorites/{propertyId}`.

### Phase 5: Image Uploads & Security Verification (Planned)
- [ ] Deploy Firestore Security Rules.
- [ ] Deploy Storage Security Rules.
- [ ] Perform penetration testing: verify unauthenticated users cannot edit listings, and customers cannot modify roles.

---

## 12. Estimated Firebase Usage, Free-Tier Limits & Billing

Firebase operates on a generous free tier (**Spark Plan**) before requiring paid scale (**Blaze Pay-as-you-go Plan**).

### 12.1 Spark (Free) Tier Allowances
| Service | Spark Plan Monthly Free Allowance | EstateVista Impact |
|---|---|---|
| **Firebase Auth** | 50,000 monthly active users (Email/Password) | More than enough for early development and launch. |
| **Cloud Firestore** | • 50,000 document reads / day<br>• 20,000 document writes / day<br>• 20,000 document deletes / day<br>• 1 GB total stored data | Excellent for development. Browsing 10 properties uses ~10 reads. |
| **Cloud Storage** | • 5 GB total stored volume<br>• 1 GB daily download bandwidth<br>• 20,000 upload operations / day | Supports ~1,000 optimized high-res property images (at ~5MB each, or ~5,000 at 1MB). |

### 12.2 Cost Optimization Guidelines for EstateVista
1. **Firestore Query Limits:**
   - Always apply `limit(20)` on property queries in `searchProperties` to avoid reading thousands of documents at once.
2. **Client Image Optimization:**
   - Compress and convert photos to WebP before uploading to Cloud Storage to stay well within the 1 GB/day bandwidth allowance.
3. **Caching:**
   - Enable Firestore client cache persistence (`enableIndexedDbPersistence`) so repeat visits do not re-read unchanged property documents.
4. **Billing Alerts:**
   - When upgrading to the Blaze Plan, set a **Google Cloud Budget Alert** (e.g., at $5 and $25) to avoid unexpected charges.

---

## 13. Identified Uncertainties & Risks to Note

1. **Firestore Compound Query Index Requirements:**
   - Filtering by `city` + `propertyType` + ordering by `price` requires a **composite index** in Firestore. Firebase automatically provides an index creation URL in the browser console upon first execution of compound queries.
2. **Text Search Limitations in Firestore:**
   - Firestore native queries do not support full-text search across multiple fields (e.g., searching "sea view penthouse bandra" simultaneously in title and description).
   - *Mitigation:* The existing frontend filters by city, type, and price brackets natively. For free-form keyword search, client-side filtering on fetched sets or an external index (such as Algolia or Typesense) will eventually be needed for large-scale datasets.
3. **Image Transformation:**
   - Client-side image resizing should be implemented prior to storage upload to prevent users from uploading massive 20MB raw camera files.

---

## 14. Recommended Next Step for a Beginner

When you are ready to begin Phase 1:
1. **Log in to [console.firebase.google.com](https://console.firebase.google.com/)** and create your new Firebase Project named `estatevista`.
2. **Enable Authentication (Email/Password), Firestore, and Storage** in the console as described in Section 2.
3. **Copy your Web App `firebaseConfig` credentials** into a safe notepad (do not commit them to GitHub).
4. Once your Firebase project exists, we will proceed to install the Firebase SDK and create `src/lib/firebase.js`.
