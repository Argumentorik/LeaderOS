"""
Iteration 19: WLADHUB Pricing Overhaul Tests
- 3 tiers: Starter 199 EUR, Standard 997 EUR, Fast Track 6.970 EUR
- No free tier
- Backend PACKAGES validation
- Checkout endpoint tests
- License key creation for starter plan
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestPricingPackages:
    """Test checkout endpoints for all 3 pricing tiers"""
    
    def test_starter_checkout_199_eur(self):
        """Starter package: 199 EUR one-time"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "starter",
            "origin_url": BASE_URL,
            "email": "test_starter@example.com",
            "user_name": "TEST_Starter_User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Missing checkout URL"
        assert "session_id" in data, "Missing session_id"
        print(f"✓ Starter checkout (199 EUR) created: session_id={data['session_id'][:20]}...")
    
    def test_standard_yearly_checkout_997_eur(self):
        """Standard yearly package: 997 EUR"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": BASE_URL,
            "email": "test_standard@example.com",
            "user_name": "TEST_Standard_User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Missing checkout URL"
        assert "session_id" in data, "Missing session_id"
        print(f"✓ Standard yearly checkout (997 EUR) created: session_id={data['session_id'][:20]}...")
    
    def test_standard_monthly_checkout_83_eur(self):
        """Standard monthly package: 83.08 EUR"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_monthly",
            "origin_url": BASE_URL,
            "email": "test_monthly@example.com",
            "user_name": "TEST_Monthly_User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Missing checkout URL"
        assert "session_id" in data, "Missing session_id"
        print(f"✓ Standard monthly checkout (83.08 EUR) created: session_id={data['session_id'][:20]}...")
    
    def test_fasttrack_yearly_checkout_6970_eur(self):
        """Fast Track yearly package: 6970 EUR"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "fasttrack_yearly",
            "origin_url": BASE_URL,
            "email": "test_fasttrack@example.com",
            "user_name": "TEST_FastTrack_User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Missing checkout URL"
        assert "session_id" in data, "Missing session_id"
        print(f"✓ Fast Track checkout (6970 EUR) created: session_id={data['session_id'][:20]}...")
    
    def test_invalid_package_returns_400(self):
        """Invalid package should return 400"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "free",  # Free tier no longer exists
            "origin_url": BASE_URL
        })
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        print("✓ Invalid package 'free' correctly returns 400")
    
    def test_nonexistent_package_returns_400(self):
        """Non-existent package should return 400"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "premium_ultra",
            "origin_url": BASE_URL
        })
        assert response.status_code == 400, f"Expected 400 for non-existent package, got {response.status_code}"
        print("✓ Non-existent package correctly returns 400")


class TestLicenseKeyCreation:
    """Test license key creation for all plans"""
    
    def test_create_license_key_starter(self):
        """Create license key for starter plan"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "starter",
            "email": "TEST_starter_key@example.com",
            "name": "TEST Starter Key User",
            "notes": "Test iteration 19"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "key" in data, "Missing license key"
        assert data["plan"] == "starter", f"Expected plan 'starter', got {data['plan']}"
        assert data["status"] == "active", f"Expected status 'active', got {data['status']}"
        assert data["key"].startswith("WLAD-"), f"Key should start with WLAD-, got {data['key']}"
        print(f"✓ Starter license key created: {data['key']}")
    
    def test_create_license_key_standard(self):
        """Create license key for standard plan"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "email": "TEST_standard_key@example.com",
            "name": "TEST Standard Key User",
            "notes": "Test iteration 19"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "key" in data, "Missing license key"
        assert data["plan"] == "standard", f"Expected plan 'standard', got {data['plan']}"
        print(f"✓ Standard license key created: {data['key']}")
    
    def test_create_license_key_fasttrack(self):
        """Create license key for fasttrack plan"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "fasttrack",
            "email": "TEST_fasttrack_key@example.com",
            "name": "TEST FastTrack Key User",
            "notes": "Test iteration 19"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "key" in data, "Missing license key"
        assert data["plan"] == "fasttrack", f"Expected plan 'fasttrack', got {data['plan']}"
        print(f"✓ FastTrack license key created: {data['key']}")
    
    def test_list_license_keys(self):
        """List all license keys"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "keys" in data, "Missing keys array"
        assert "total" in data, "Missing total count"
        print(f"✓ License keys listed: {data['total']} total")


class TestAdminEndpoints:
    """Test admin dashboard endpoints"""
    
    def test_admin_stats(self):
        """Admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "overview" in data, "Missing overview"
        assert "today" in data, "Missing today stats"
        assert "keys" in data, "Missing keys stats"
        print(f"✓ Admin stats: {data['overview']['total_users']} users, {data['overview']['total_reports']} reports")
    
    def test_admin_users(self):
        """Admin users endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "users" in data, "Missing users array"
        assert "total" in data, "Missing total count"
        print(f"✓ Admin users: {data['total']} total")
    
    def test_admin_transactions(self):
        """Admin transactions endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "transactions" in data, "Missing transactions array"
        print(f"✓ Admin transactions: {data['total']} total")
    
    def test_admin_emails(self):
        """Admin emails endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "emails" in data, "Missing emails array"
        print(f"✓ Admin emails: {data['total']} total")


class TestUserCreation:
    """Test user creation endpoint"""
    
    def test_create_user(self):
        """Create a test user"""
        import uuid
        unique_email = f"TEST_iter19_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST Iteration 19 User",
            "email": unique_email,
            "role": "team_leader",
            "consent_privacy": True,
            "consent_marketing": False
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "session_id" in data, "Missing session_id"
        assert data["email"] == unique_email, f"Email mismatch"
        print(f"✓ User created: {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
