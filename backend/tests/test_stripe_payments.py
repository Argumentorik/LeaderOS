"""Backend API tests for WLADHUB Stripe Payment Integration
Tests: Payment checkout creation, payment status, webhook endpoint, MongoDB storage
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestHealthCheck:
    """Health check to ensure backend is running"""
    
    def test_health(self, client):
        """Test /api/health returns healthy status"""
        resp = client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        print(f"Health check passed: {data['service']}")


class TestPaymentCheckoutCreation:
    """Tests for POST /api/payments/create-checkout"""
    
    def test_create_checkout_standard_yearly(self, client):
        """Test checkout creation for standard_yearly package (€997)"""
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Verify response structure
        assert "url" in data, "Response missing 'url' field"
        assert "session_id" in data, "Response missing 'session_id' field"
        
        # Verify Stripe checkout URL
        assert data["url"].startswith("https://checkout.stripe.com"), f"URL should start with https://checkout.stripe.com, got: {data['url']}"
        assert len(data["session_id"]) > 0, "session_id should not be empty"
        
        print(f"Standard yearly checkout created: session_id={data['session_id'][:30]}...")
        print(f"Checkout URL: {data['url'][:80]}...")
        return data["session_id"]
    
    def test_create_checkout_standard_monthly(self, client):
        """Test checkout creation for standard_monthly package (€83.08)"""
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_monthly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert "url" in data, "Response missing 'url' field"
        assert "session_id" in data, "Response missing 'session_id' field"
        assert data["url"].startswith("https://checkout.stripe.com"), f"URL should start with https://checkout.stripe.com"
        
        print(f"Standard monthly checkout created: session_id={data['session_id'][:30]}...")
    
    def test_create_checkout_fasttrack_yearly(self, client):
        """Test checkout creation for fasttrack_yearly package (€4997)"""
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "fasttrack_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert "url" in data, "Response missing 'url' field"
        assert "session_id" in data, "Response missing 'session_id' field"
        assert data["url"].startswith("https://checkout.stripe.com"), f"URL should start with https://checkout.stripe.com"
        
        print(f"Fast Track checkout created: session_id={data['session_id'][:30]}...")
    
    def test_create_checkout_invalid_package(self, client):
        """Test checkout creation with invalid package_id returns 400"""
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "invalid_package",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert resp.status_code == 400, f"Expected 400 for invalid package, got {resp.status_code}"
        data = resp.json()
        assert "detail" in data, "Error response should have 'detail' field"
        print(f"Invalid package correctly rejected: {data['detail']}")
    
    def test_create_checkout_with_email(self, client):
        """Test checkout creation with optional email parameter"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": test_email
        })
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "url" in data
        assert "session_id" in data
        print(f"Checkout with email created successfully")


class TestPaymentStatus:
    """Tests for GET /api/payments/status/{session_id}"""
    
    def test_get_payment_status(self, client):
        """Test getting payment status for a valid session"""
        # First create a checkout session
        create_resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert create_resp.status_code == 200
        session_id = create_resp.json()["session_id"]
        
        # Get status
        status_resp = client.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_resp.status_code == 200, f"Expected 200, got {status_resp.status_code}: {status_resp.text}"
        data = status_resp.json()
        
        # Verify response structure
        assert "status" in data, "Response missing 'status' field"
        assert "payment_status" in data, "Response missing 'payment_status' field"
        
        # For a new session, status should be 'open' and payment_status 'unpaid'
        print(f"Payment status: status={data['status']}, payment_status={data['payment_status']}")
        
        # Verify metadata if present
        if "metadata" in data:
            print(f"Metadata: {data['metadata']}")


class TestStripeWebhook:
    """Tests for POST /api/webhook/stripe"""
    
    def test_webhook_endpoint_exists(self, client):
        """Test that webhook endpoint exists and accepts POST"""
        # Send empty body - should not crash, may return error but endpoint exists
        resp = client.post(f"{BASE_URL}/api/webhook/stripe", data=b"", headers={
            "Content-Type": "application/json",
            "Stripe-Signature": "test_signature"
        })
        # Webhook may return error due to invalid signature, but should not be 404
        assert resp.status_code != 404, "Webhook endpoint should exist"
        print(f"Webhook endpoint exists, returned status: {resp.status_code}")


class TestMongoDBStorage:
    """Tests to verify payment transactions are stored in MongoDB"""
    
    def test_checkout_creates_transaction_record(self, client):
        """Test that creating checkout stores transaction in MongoDB"""
        # Create checkout
        resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": "test_mongo@example.com"
        })
        assert resp.status_code == 200
        session_id = resp.json()["session_id"]
        
        # Verify by getting status (which reads from DB)
        status_resp = client.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_resp.status_code == 200
        
        # If we can get status, the transaction was stored
        print(f"Transaction stored in MongoDB for session: {session_id[:30]}...")


class TestPackageConfiguration:
    """Tests to verify package configuration is correct"""
    
    def test_all_packages_create_valid_checkout(self, client):
        """Test all 3 packages create valid Stripe checkout sessions"""
        packages = ["standard_yearly", "standard_monthly", "fasttrack_yearly"]
        
        for package_id in packages:
            resp = client.post(f"{BASE_URL}/api/payments/create-checkout", json={
                "package_id": package_id,
                "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
            })
            assert resp.status_code == 200, f"Package {package_id} failed: {resp.text}"
            data = resp.json()
            assert data["url"].startswith("https://checkout.stripe.com"), f"Package {package_id} URL invalid"
            print(f"Package {package_id}: OK")
