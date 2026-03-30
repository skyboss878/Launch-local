#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class LaunchLocalAPITester:
    def __init__(self, base_url="https://launch-faire-store.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, use_auth=False):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return None, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            return response, None if success else f"Expected {expected_status}, got {response.status_code}"
        
        except Exception as e:
            return None, f"Request failed: {str(e)}"

    def test_root_endpoint(self):
        """Test API root endpoint"""
        response, error = self.make_request('GET', '/')
        if error:
            self.log_result("API Root", False, error)
            return False
        
        try:
            data = response.json()
            success = "Launch Local API" in data.get("message", "")
            self.log_result("API Root", success, "" if success else "Invalid response format")
            return success
        except:
            self.log_result("API Root", False, "Invalid JSON response")
            return False

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response, error = self.make_request('GET', '/categories')
        if error:
            self.log_result("GET Categories", False, error)
            return False
        
        try:
            categories = response.json()
            expected_categories = ["home-hardware", "fragrances", "candles", "generators", "battery-packs", "apparel"]
            category_ids = [cat.get("id") for cat in categories]
            
            success = len(categories) == 6 and all(cat_id in category_ids for cat_id in expected_categories)
            self.log_result("GET Categories", success, "" if success else f"Expected 6 categories, got {len(categories)}")
            return success
        except:
            self.log_result("GET Categories", False, "Invalid JSON response")
            return False

    def test_products_endpoint(self):
        """Test products endpoint"""
        # Test basic products endpoint
        response, error = self.make_request('GET', '/products')
        if error:
            self.log_result("GET Products", False, error)
            return False
        
        try:
            products = response.json()
            success = len(products) > 0
            self.log_result("GET Products", success, "" if success else "No products found")
            
            if not success:
                return False
            
            # Test featured products filter
            response, error = self.make_request('GET', '/products?featured=true')
            if error:
                self.log_result("GET Featured Products", False, error)
                return False
            
            featured_products = response.json()
            featured_count = len(featured_products)
            success = featured_count > 0
            self.log_result("GET Featured Products", success, "" if success else "No featured products found")
            
            # Test category filter
            response, error = self.make_request('GET', '/products?category=home-hardware')
            if error:
                self.log_result("GET Products by Category", False, error)
                return False
            
            category_products = response.json()
            success = len(category_products) > 0
            self.log_result("GET Products by Category", success, "" if success else "No products in home-hardware category")
            
            # Test search
            response, error = self.make_request('GET', '/products?search=tool')
            if error:
                self.log_result("GET Products Search", False, error)
                return False
            
            search_products = response.json()
            success = len(search_products) >= 0  # Search can return 0 results
            self.log_result("GET Products Search", success, "" if success else "Search failed")
            
            return True
            
        except Exception as e:
            self.log_result("GET Products", False, f"JSON parsing error: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@launchlocal.com",
            "password": "LaunchLocal2024!"
        }
        
        response, error = self.make_request('POST', '/auth/login', login_data)
        if error:
            self.log_result("Admin Login", False, error)
            return False
        
        try:
            data = response.json()
            success = data.get("role") == "admin" and "id" in data
            if success:
                # Try to extract token from cookies
                cookies = response.cookies
                if 'access_token' in cookies:
                    self.admin_token = cookies['access_token']
                    self.session.cookies.update(cookies)
            
            self.log_result("Admin Login", success, "" if success else "Invalid admin login response")
            return success
        except:
            self.log_result("Admin Login", False, "Invalid JSON response")
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        if not self.admin_token:
            self.log_result("GET Auth Me", False, "No admin token available")
            return False
        
        response, error = self.make_request('GET', '/auth/me', use_auth=True)
        if error:
            self.log_result("GET Auth Me", False, error)
            return False
        
        try:
            data = response.json()
            success = data.get("role") == "admin" and "email" in data
            self.log_result("GET Auth Me", success, "" if success else "Invalid auth/me response")
            return success
        except:
            self.log_result("GET Auth Me", False, "Invalid JSON response")
            return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            self.log_result("GET Admin Stats", False, "No admin token available")
            return False
        
        response, error = self.make_request('GET', '/admin/stats', use_auth=True)
        if error:
            self.log_result("GET Admin Stats", False, error)
            return False
        
        try:
            stats = response.json()
            required_fields = ["total_products", "total_orders", "total_revenue", "low_stock_items"]
            success = all(field in stats for field in required_fields)
            self.log_result("GET Admin Stats", success, "" if success else "Missing required stats fields")
            return success
        except:
            self.log_result("GET Admin Stats", False, "Invalid JSON response")
            return False

    def test_admin_orders(self):
        """Test admin orders endpoint"""
        if not self.admin_token:
            self.log_result("GET Admin Orders", False, "No admin token available")
            return False
        
        response, error = self.make_request('GET', '/admin/orders', use_auth=True)
        if error:
            self.log_result("GET Admin Orders", False, error)
            return False
        
        try:
            orders = response.json()
            success = isinstance(orders, list)  # Orders can be empty list
            self.log_result("GET Admin Orders", success, "" if success else "Invalid orders response format")
            return success
        except:
            self.log_result("GET Admin Orders", False, "Invalid JSON response")
            return False

    def test_product_crud(self):
        """Test product CRUD operations"""
        if not self.admin_token:
            self.log_result("Product CRUD", False, "No admin token available")
            return False
        
        # Create product
        new_product = {
            "name": "Test Product",
            "description": "A test product for API testing",
            "price": 99.99,
            "category": "home-hardware",
            "image_url": "https://example.com/test.jpg",
            "stock": 10,
            "featured": False
        }
        
        response, error = self.make_request('POST', '/admin/products', new_product, 201, use_auth=True)
        if error:
            self.log_result("Create Product", False, error)
            return False
        
        try:
            created_product = response.json()
            product_id = created_product.get("id")
            success = product_id is not None and created_product.get("name") == "Test Product"
            self.log_result("Create Product", success, "" if success else "Invalid product creation response")
            
            if not success or not product_id:
                return False
            
            # Update product
            update_data = {"name": "Updated Test Product", "price": 149.99}
            response, error = self.make_request('PUT', f'/admin/products/{product_id}', update_data, use_auth=True)
            if error:
                self.log_result("Update Product", False, error)
            else:
                try:
                    updated_product = response.json()
                    success = updated_product.get("name") == "Updated Test Product"
                    self.log_result("Update Product", success, "" if success else "Product update failed")
                except:
                    self.log_result("Update Product", False, "Invalid JSON response")
            
            # Delete product
            response, error = self.make_request('DELETE', f'/admin/products/{product_id}', use_auth=True)
            if error:
                self.log_result("Delete Product", False, error)
            else:
                success = response.status_code == 200
                self.log_result("Delete Product", success, "" if success else "Product deletion failed")
            
            return True
            
        except Exception as e:
            self.log_result("Create Product", False, f"JSON parsing error: {str(e)}")
            return False

    def test_cart_calculation(self):
        """Test cart calculation endpoint"""
        # First get a product to add to cart
        response, error = self.make_request('GET', '/products')
        if error:
            self.log_result("Cart Calculation", False, f"Failed to get products: {error}")
            return False
        
        try:
            products = response.json()
            if not products:
                self.log_result("Cart Calculation", False, "No products available for cart test")
                return False
            
            # Test cart calculation
            cart_items = [{"product_id": products[0]["id"], "quantity": 2}]
            response, error = self.make_request('POST', '/cart/calculate', cart_items)
            if error:
                self.log_result("Cart Calculation", False, error)
                return False
            
            cart_data = response.json()
            success = "items" in cart_data and "total" in cart_data
            self.log_result("Cart Calculation", success, "" if success else "Invalid cart calculation response")
            return success
            
        except Exception as e:
            self.log_result("Cart Calculation", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Launch Local API Tests")
        print("=" * 50)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_categories_endpoint()
        self.test_products_endpoint()
        
        # Auth tests
        self.test_admin_login()
        self.test_auth_me()
        
        # Admin functionality tests
        self.test_admin_stats()
        self.test_admin_orders()
        self.test_product_crud()
        
        # Cart functionality
        self.test_cart_calculation()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests: {', '.join(self.passed_tests)}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LaunchLocalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())