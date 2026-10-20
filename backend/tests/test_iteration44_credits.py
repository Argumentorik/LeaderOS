from conftest import TEST_EMAIL, TEST_PASSWORD
"""
Iteration 44 - Credits System & Business Logic Tests
Tests for:
- FREE_CREDITS = 50 (not 3)
- soft_pause field in /api/credits
- POST /api/credits/dismiss-pause
- POST /api/credits/reset sets balance to 50
- /api/payments/packages returns €997 and €6970 pricing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCreditsSystem:
    """Test credits system with 50 free credits and soft pause"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code == 200:
            token = login_res.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Login failed: {login_res.status_code}")
    
    def test_credits_endpoint_returns_200(self):
        """GET /api/credits returns 200"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("✓ GET /api/credits returns 200")
    
    def test_credits_limit_is_50(self):
        """GET /api/credits returns limit:50 for free users"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200
        data = res.json()
        assert "limit" in data, "Response missing 'limit' field"
        assert data["limit"] == 50, f"Expected limit=50, got {data['limit']}"
        print(f"✓ Credits limit is 50 (got: {data['limit']})")
    
    def test_credits_has_soft_pause_field(self):
        """GET /api/credits returns soft_pause field"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200
        data = res.json()
        assert "soft_pause" in data, "Response missing 'soft_pause' field"
        assert isinstance(data["soft_pause"], bool), f"soft_pause should be boolean, got {type(data['soft_pause'])}"
        print(f"✓ Credits has soft_pause field (value: {data['soft_pause']})")
    
    def test_credits_has_balance_field(self):
        """GET /api/credits returns balance field"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200
        data = res.json()
        assert "balance" in data, "Response missing 'balance' field"
        print(f"✓ Credits has balance field (value: {data['balance']})")
    
    def test_credits_has_is_premium_field(self):
        """GET /api/credits returns is_premium field"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200
        data = res.json()
        assert "is_premium" in data, "Response missing 'is_premium' field"
        print(f"✓ Credits has is_premium field (value: {data['is_premium']})")
    
    def test_credits_has_total_used_field(self):
        """GET /api/credits returns total_used field"""
        res = self.session.get(f"{BASE_URL}/api/credits")
        assert res.status_code == 200
        data = res.json()
        assert "total_used" in data, "Response missing 'total_used' field"
        print(f"✓ Credits has total_used field (value: {data['total_used']})")


class TestDismissPause:
    """Test POST /api/credits/dismiss-pause endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code == 200:
            token = login_res.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Login failed: {login_res.status_code}")
    
    def test_dismiss_pause_returns_200(self):
        """POST /api/credits/dismiss-pause returns 200"""
        res = self.session.post(f"{BASE_URL}/api/credits/dismiss-pause")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("✓ POST /api/credits/dismiss-pause returns 200")
    
    def test_dismiss_pause_returns_dismissed_true(self):
        """POST /api/credits/dismiss-pause returns dismissed:true"""
        res = self.session.post(f"{BASE_URL}/api/credits/dismiss-pause")
        assert res.status_code == 200
        data = res.json()
        assert "dismissed" in data, "Response missing 'dismissed' field"
        assert data["dismissed"], f"Expected dismissed=True, got {data['dismissed']}"
        print("✓ POST /api/credits/dismiss-pause returns dismissed:true")


class TestCreditsReset:
    """Test POST /api/credits/reset endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code == 200:
            token = login_res.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Login failed: {login_res.status_code}")
    
    def test_reset_credits_returns_200(self):
        """POST /api/credits/reset returns 200"""
        res = self.session.post(f"{BASE_URL}/api/credits/reset")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("✓ POST /api/credits/reset returns 200")
    
    def test_reset_credits_sets_balance_to_50(self):
        """POST /api/credits/reset sets balance to 50"""
        res = self.session.post(f"{BASE_URL}/api/credits/reset")
        assert res.status_code == 200
        data = res.json()
        assert "balance" in data, "Response missing 'balance' field"
        assert data["balance"] == 50, f"Expected balance=50, got {data['balance']}"
        print(f"✓ POST /api/credits/reset sets balance to 50 (got: {data['balance']})")
    
    def test_reset_credits_verify_with_get(self):
        """Verify reset persisted by calling GET /api/credits"""
        # Reset first
        reset_res = self.session.post(f"{BASE_URL}/api/credits/reset")
        assert reset_res.status_code == 200
        
        # Verify with GET
        get_res = self.session.get(f"{BASE_URL}/api/credits")
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["balance"] == 50, f"Expected balance=50 after reset, got {data['balance']}"
        print("✓ Reset verified with GET /api/credits")


class TestPaymentPackages:
    """Test /api/payments/packages returns correct pricing"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code == 200:
            token = login_res.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Login failed: {login_res.status_code}")
    
    def test_packages_endpoint_returns_200(self):
        """GET /api/payments/packages returns 200"""
        res = self.session.get(f"{BASE_URL}/api/payments/packages")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        print("✓ GET /api/payments/packages returns 200")
    
    def test_packages_has_standard_997(self):
        """GET /api/payments/packages returns standard package at €997"""
        res = self.session.get(f"{BASE_URL}/api/payments/packages")
        assert res.status_code == 200
        data = res.json()
        
        # Find standard package
        packages = data if isinstance(data, list) else data.get("packages", [])
        standard = None
        for pkg in packages:
            if pkg.get("id") == "standard":
                standard = pkg
                break
        
        assert standard is not None, f"Standard package not found. Packages: {packages}"
        # API returns 'amount' field, not 'price'
        amount = standard.get("amount", 0)
        assert amount == 997 or amount == 997.0, f"Expected standard amount 997, got {amount}"
        print(f"✓ Standard package found with amount: {amount}")
    
    def test_packages_has_fast_track_6970(self):
        """GET /api/payments/packages returns fast_track package at €6970"""
        res = self.session.get(f"{BASE_URL}/api/payments/packages")
        assert res.status_code == 200
        data = res.json()
        
        # Find fast_track package
        packages = data if isinstance(data, list) else data.get("packages", [])
        fast_track = None
        for pkg in packages:
            if pkg.get("id") == "fast_track":
                fast_track = pkg
                break
        
        assert fast_track is not None, f"Fast track package not found. Packages: {packages}"
        # API returns 'amount' field, not 'price'
        amount = fast_track.get("amount", 0)
        assert amount == 6970 or amount == 6970.0, f"Expected fast_track amount 6970, got {amount}"
        print(f"✓ Fast track package found with amount: {amount}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
