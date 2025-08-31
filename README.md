BakeJoy — Online Cake and Party Supplies Shop
A complete full-stack online sales platform for cakes and party accessories, featuring a decoupled Frontend and Backend, JWT authentication, a payment gateway (Zarinpal), and SMS notifications (SMS.ir).

This repository contains two main folders:

frontend-cake-shop/ (React + Vite + TypeScript + MUI + Tailwind)

online-cake-shop/ (Django + DRF + PostgreSQL)

Table of Contents
Features

Architecture and Technologies

Prerequisites

Installation and Setup

Backend Setup

Frontend Setup

Environment Variables Configuration

Folder Structure

API Summary

Testing and Validation

Roadmap

Contributing

License

Features
JWT-based authentication (login/register, token refresh, roles, and permissions)

Product catalog: Cake, Flavor, Size, Tag, Image, Party Supplies

Search and filtering (category, flavor, size, color, theme)

Shopping cart, wishlist, order, and payment management

Online payment infrastructure (Zarinpal) and SMS notification delivery (SMS.ir)

Admin panel for managing products, orders, and inventory

Responsive design with MUI and TailwindCSS

RESTful APIs with Django REST Framework

PostgreSQL database and database migrations

Architecture and Technologies
Frontend: React (Vite + TypeScript), React Router, MUI, TailwindCSS, Axios

Backend: Django, Django REST Framework, SimpleJWT, Django Filters

Database: PostgreSQL

Auth: Access/Refresh JWT, protected routes on the frontend

3rd Party: Zarinpal (Payment Gateway), SMS.ir (Messaging)

Dev Tools: Prettier/ESLint, dotenv

React (Client)  ←→  DRF (API)  ←→  PostgreSQL
                            ↘ Zarinpal / SMS.ir
Prerequisites
Node.js 18+ and pnpm or npm

Python 3.10+ and pip

PostgreSQL 13+

(Optional) Docker and Docker Compose

Installation and Setup
Backend Setup
Bash

cd online-cake-shop

python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser

python manage.py runserver 0.0.0.0:8000
Frontend Setup
Bash

cd frontend-cake-shop

pnpm install
pnpm dev
Or with npm:

Bash

npm install
npm run dev
Frontend: http://localhost:5173

Backend: http://localhost:8000

Environment Variables Configuration
Backend (online-cake-shop/.env)
تکه‌کد

DEBUG=True
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=bakejoy
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

ACCESS_TOKEN_LIFETIME_MIN=15
REFRESH_TOKEN_LIFETIME_DAYS=7

ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_CALLBACK_URL=http://localhost:5173/payment/callback

SMSIR_API_KEY=xxxxxxxxxxxxxxxx
SMSIR_LINE_NUMBER=3000xxxxxxx
Frontend (frontend-cake-shop/.env)
تکه‌کد

VITE_API_BASE_URL=http://localhost:8000/api
VITE_ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Folder Structure
bakejoy/
├─ online-cake-shop/           # Backend (Django + DRF)
│  ├─ core/settings.py
│  ├─ products/
│  ├─ orders/
│  ├─ users/
│  └─ ...
└─ frontend-cake-shop/         # Frontend (React + Vite + TS)
   ├─ src/
   │  ├─ pages/
   │  ├─ components/
   │  ├─ layouts/
   │  ├─ services/
   │  └─ store/
   ├─ index.html
   └─ vite.config.ts
API Summary
Authentication
POST /api/auth/login/

POST /api/auth/refresh/

POST /api/auth/register/

GET /api/auth/me/

Products
GET /api/cakes/

GET /api/categories/

GET /api/flavors/, GET /api/sizes/, GET /api/tags/

GET /api/party-supplies/

GET /api/party-supplies/filter-options/

Order and Cart
POST /api/cart/items/, DELETE /api/cart/items/{id}/

POST /api/orders/, GET /api/orders/

POST /api/payment/zarinpal/verify/

Feedback
POST /api/reviews/

GET /api/reviews/?cake={id}

Testing and Validation
Backend: pytest or python manage.py test

Frontend: Vitest/RTL

Performance: Pagination, Lazy Loading images

Code Quality: ESLint/Prettier, flake8/black

Roadmap
AI-based product recommender

Reporting in the admin panel

Docker Compose for deployment

PWA or mobile app version

Contributing
Pull Requests and Issues are welcome.

Clear commit messages

Run tests before submitting a PR

License
This project is licensed under the MIT License.
