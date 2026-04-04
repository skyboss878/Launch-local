from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from stripe_checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "")
client = AsyncIOMotorClient(mongo_url) if mongo_url else None
db = client[os.environ.get("DB_NAME", "launchlocal")] if client else None

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "fallback_secret_change_me")

# Create the main app
app = FastAPI(title="Launch Local API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ PASSWORD UTILITIES ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ============ JWT UTILITIES ============
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, 
        "email": email, 
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, 
        "exp": datetime.now(timezone.utc) + timedelta(days=7), 
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# ============ AUTH HELPER ============
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ PYDANTIC MODELS ============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int = 0
    featured: bool = False

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    featured: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int
    featured: bool
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: float

class CheckoutRequest(BaseModel):
    origin_url: str
    cart_items: List[CartItem]
    customer_email: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    items: List[Dict[str, Any]]
    total: float
    status: str
    customer_email: Optional[str]
    created_at: str

# ============ CATEGORIES ============
CATEGORIES = [
    {"id": "home-hardware", "name": "Home & Hardware", "image": "https://images.pexels.com/photos/5583045/pexels-photo-5583045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "fragrances", "name": "Fragrances", "image": "https://images.unsplash.com/photo-1687200877070-143b149c2315?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxwZXJmdW1lJTIwYm90dGxlJTIwYWVzdGhldGljfGVufDB8fHx8MTc3NDg5MjQ2Mnww&ixlib=rb-4.1.0&q=85"},
    {"id": "candles", "name": "Candles", "image": "https://images.unsplash.com/photo-1617213146999-f33c20d2a534?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwY2FuZGxlfGVufDB8fHx8MTc3NDg5MjQ2NHww&ixlib=rb-4.1.0&q=85"},
    {"id": "generators", "name": "Generators", "image": "https://images.pexels.com/photos/32713414/pexels-photo-32713414.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"id": "battery-packs", "name": "Battery Packs", "image": "https://static.prod-images.emergentagent.com/jobs/6c023cc2-2fc0-43fb-8359-ba7aa5d1b242/images/efc28db7f8d671608d14fc0e36d8d2659f56f41699ffd32623c506e98775e6f5.png"},
    {"id": "apparel", "name": "Apparel", "image": "https://images.pexels.com/photos/7671167/pexels-photo-7671167.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"}
]

# ============ AUTH ENDPOINTS ============
@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "customer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "customer"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response, request: Request):
    email = credentials.email.lower()
    
    # Check brute force
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        last_attempt = datetime.fromisoformat(attempts["last_attempt"])
        if datetime.now(timezone.utc) - last_attempt < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user.get("role", "customer")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"id": user["_id"], "email": user["email"], "name": user["name"], "role": user.get("role", "customer")}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    refresh = request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============ PRODUCT ENDPOINTS ============
@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

@api_router.get("/products")
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/admin/products", status_code=201)
async def create_product(product: ProductCreate, request: Request):
    await get_admin_user(request)
    
    product_doc = product.model_dump()
    product_doc["id"] = str(ObjectId())
    product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_doc)
    del product_doc["_id"]
    return product_doc

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, request: Request):
    await get_admin_user(request)
    
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await get_admin_user(request)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============ CART ENDPOINTS ============
@api_router.post("/cart/calculate")
async def calculate_cart(items: List[CartItem]):
    """Calculate cart totals from frontend cart items"""
    cart_items = []
    total = 0.0
    
    for item in items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            item_total = product["price"] * item.quantity
            cart_items.append({
                "product": product,
                "quantity": item.quantity,
                "subtotal": item_total
            })
            total += item_total
    
    return {"items": cart_items, "total": round(total, 2)}

# ============ CHECKOUT & PAYMENT ENDPOINTS ============
@api_router.post("/checkout/create-session")
async def create_checkout_session(checkout_data: CheckoutRequest, request: Request):
    """Create Stripe checkout session"""
    # Calculate cart total
    total = 0.0
    order_items = []
    
    for item in checkout_data.cart_items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            item_total = product["price"] * item.quantity
            order_items.append({
                "product_id": item.product_id,
                "name": product["name"],
                "price": product["price"],
                "quantity": item.quantity,
                "subtotal": item_total
            })
            total += item_total
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Create order in pending state
    order_id = str(ObjectId())
    order_doc = {
        "id": order_id,
        "items": order_items,
        "total": round(total, 2),
        "status": "pending",
        "customer_email": checkout_data.customer_email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Setup Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = checkout_data.origin_url.rstrip("/")
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=round(total, 2),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "customer_email": checkout_data.customer_email or ""
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "order_id": order_id,
        "amount": round(total, 2),
        "currency": "usd",
        "payment_status": "pending",
        "customer_email": checkout_data.customer_email,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"checkout_url": session.url, "session_id": session.session_id, "order_id": order_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    """Get payment status and update order"""
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if tx:
        order_id = tx.get("order_id")
        
        # Only update if not already processed
        if tx.get("payment_status") != "paid" and status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": status.payment_status, "status": status.status}}
            )
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"status": "confirmed", "payment_status": "paid"}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            order_id = webhook_response.metadata.get("order_id")
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}}
            )
            
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"status": "confirmed", "payment_status": "paid"}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============ ORDER ENDPOINTS ============
@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/admin/orders")
async def get_all_orders(request: Request):
    await get_admin_user(request)
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, request: Request):
    await get_admin_user(request)
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# ============ ADMIN DASHBOARD STATS ============
@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    await get_admin_user(request)
    
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Calculate total revenue
    orders = await db.orders.find({"status": {"$in": ["confirmed", "shipped", "delivered"]}}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    
    # Low stock products
    low_stock = await db.products.count_documents({"stock": {"$lt": 10}})
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": round(total_revenue, 2),
        "low_stock_items": low_stock
    }

# ============ ROOT ENDPOINT ============
@api_router.get("/")
async def root():
    return {"message": "Launch Local API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ STARTUP EVENTS ============
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("category")
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@launchlocal.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "LaunchLocal2024!")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    # Seed sample products if none exist
    product_count = await db.products.count_documents({})
    if product_count == 0:
        sample_products = [
            # Home & Hardware
            {"id": "prod-001", "name": "Professional Tool Set", "description": "Complete 120-piece professional tool set with carrying case", "price": 149.99, "category": "home-hardware", "image_url": "https://images.pexels.com/photos/5583045/pexels-photo-5583045.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 25, "featured": True},
            {"id": "prod-002", "name": "Heavy Duty Work Gloves", "description": "Durable leather work gloves for all your DIY projects", "price": 24.99, "category": "home-hardware", "image_url": "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 50, "featured": False},
            {"id": "prod-003", "name": "Cordless Drill Pro", "description": "20V cordless drill with lithium battery and charger", "price": 89.99, "category": "home-hardware", "image_url": "https://images.pexels.com/photos/1249610/pexels-photo-1249610.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 30, "featured": True},
            
            # Fragrances
            {"id": "prod-004", "name": "Midnight Oud", "description": "Luxurious oud-based fragrance with notes of amber and sandalwood", "price": 85.00, "category": "fragrances", "image_url": "https://images.unsplash.com/photo-1687200877070-143b149c2315?w=600", "stock": 40, "featured": True},
            {"id": "prod-005", "name": "Fresh Citrus Cologne", "description": "Invigorating citrus blend perfect for everyday wear", "price": 45.00, "category": "fragrances", "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600", "stock": 60, "featured": False},
            {"id": "prod-006", "name": "Rose Garden Perfume", "description": "Elegant rose bouquet with hints of jasmine and vanilla", "price": 120.00, "category": "fragrances", "image_url": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600", "stock": 35, "featured": True},
            
            # Candles
            {"id": "prod-007", "name": "Vanilla Bean Candle", "description": "Hand-poured soy candle with warm vanilla bean scent", "price": 28.00, "category": "candles", "image_url": "https://images.unsplash.com/photo-1617213146999-f33c20d2a534?w=600", "stock": 80, "featured": True},
            {"id": "prod-008", "name": "Lavender Dreams", "description": "Calming lavender candle perfect for relaxation", "price": 24.00, "category": "candles", "image_url": "https://images.unsplash.com/photo-1602607370832-b0548cf07fd5?w=600", "stock": 70, "featured": False},
            {"id": "prod-009", "name": "Cedar & Pine Set", "description": "Set of 3 forest-inspired candles", "price": 55.00, "category": "candles", "image_url": "https://images.unsplash.com/photo-1603905179676-3ec7c0e8d560?w=600", "stock": 45, "featured": True},
            
            # Generators
            {"id": "prod-010", "name": "Portable Generator 3500W", "description": "Quiet portable generator perfect for camping or emergency backup", "price": 599.00, "category": "generators", "image_url": "https://images.pexels.com/photos/32713414/pexels-photo-32713414.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 15, "featured": True},
            {"id": "prod-011", "name": "Inverter Generator 2000W", "description": "Ultra-quiet inverter generator with fuel efficiency", "price": 449.00, "category": "generators", "image_url": "https://images.pexels.com/photos/4489702/pexels-photo-4489702.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 20, "featured": False},
            {"id": "prod-012", "name": "Heavy Duty Generator 7500W", "description": "Industrial-grade generator for whole home backup", "price": 1299.00, "category": "generators", "image_url": "https://images.pexels.com/photos/2569842/pexels-photo-2569842.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 8, "featured": True},
            
            # Battery Packs
            {"id": "prod-013", "name": "Power Station 500Wh", "description": "Portable power station with solar charging capability", "price": 399.00, "category": "battery-packs", "image_url": "https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 35, "featured": True},
            {"id": "prod-014", "name": "Emergency Battery Pack", "description": "20000mAh portable charger with flashlight", "price": 49.99, "category": "battery-packs", "image_url": "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 100, "featured": False},
            {"id": "prod-015", "name": "Solar Power Bank", "description": "Solar-powered 30000mAh battery pack", "price": 79.99, "category": "battery-packs", "image_url": "https://images.pexels.com/photos/5473298/pexels-photo-5473298.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 55, "featured": True},
            
            # Apparel
            {"id": "prod-016", "name": "Premium Work Jacket", "description": "Durable canvas work jacket with multiple pockets", "price": 89.00, "category": "apparel", "image_url": "https://images.pexels.com/photos/7671167/pexels-photo-7671167.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 40, "featured": True},
            {"id": "prod-017", "name": "Thermal Henley", "description": "Comfortable thermal henley shirt in classic colors", "price": 35.00, "category": "apparel", "image_url": "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 75, "featured": False},
            {"id": "prod-018", "name": "Outdoor Flannel Shirt", "description": "Classic flannel shirt perfect for any occasion", "price": 55.00, "category": "apparel", "image_url": "https://images.pexels.com/photos/6764007/pexels-photo-6764007.jpeg?auto=compress&cs=tinysrgb&w=600", "stock": 60, "featured": True},
        ]
        
        for product in sample_products:
            product["created_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.products.insert_many(sample_products)
        logger.info(f"Seeded {len(sample_products)} sample products")
    
    # Write test credentials
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
""")
    logger.info("Test credentials written to /app/memory/test_credentials.md")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
