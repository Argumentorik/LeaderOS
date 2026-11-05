"""
Iteration 18: Testing '5+1' to '6' replacement and Fast Track price update to 4.797 EUR
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndPackages:
    """Test health check and package pricing"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_fasttrack_package_price_4797(self):
        """Verify Fast Track package is 4797.00 EUR (not 4997)"""
        # Create checkout to verify package amount
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "fasttrack_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": "test@example.com",
            "user_name": "Test User",
            "user_session_id": "test_session_123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Fast Track checkout created successfully with session_id: {data['session_id']}")
    
    def test_standard_package_price_997(self):
        """Verify Standard package is still 997.00 EUR"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": "test@example.com",
            "user_name": "Test User",
            "user_session_id": "test_session_456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        print("✓ Standard checkout created successfully")
    
    def test_standard_monthly_package(self):
        """Verify Standard monthly package works"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "standard_monthly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": "test@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        print("✓ Standard monthly checkout created successfully")
    
    def test_invalid_package_returns_400(self):
        """Verify invalid package returns 400"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "package_id": "invalid_package",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com"
        })
        assert response.status_code == 400
        print("✓ Invalid package correctly returns 400")


class TestLicenseKeyEndpoints:
    """Test license key functionality"""
    
    def test_create_license_key_fasttrack(self):
        """Create a Fast Track license key"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "fasttrack",
            "email": "test_fasttrack@example.com",
            "name": "Test FastTrack User",
            "notes": "Test iteration 18"
        })
        assert response.status_code == 200
        data = response.json()
        assert "key" in data
        assert data["plan"] == "fasttrack"
        assert data["status"] == "active"
        print(f"✓ Fast Track license key created: {data['key']}")
        return data["key"]
    
    def test_create_license_key_standard(self):
        """Create a Standard license key"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "email": "test_standard@example.com",
            "name": "Test Standard User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "key" in data
        assert data["plan"] == "standard"
        print(f"✓ Standard license key created: {data['key']}")
    
    def test_list_license_keys(self):
        """List all license keys"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        assert "total" in data
        print(f"✓ License keys listed: {data['total']} total")


class TestAdminEndpoints:
    """Test admin dashboard endpoints"""
    
    def test_admin_stats(self):
        """Get admin statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "today" in data
        assert "keys" in data
        assert "conversions" in data
        print(f"✓ Admin stats retrieved - Total users: {data['overview']['total_users']}")
    
    def test_admin_users(self):
        """Get admin users list"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"✓ Admin users retrieved: {data['total']} total")
    
    def test_admin_transactions(self):
        """Get admin transactions list"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        print(f"✓ Admin transactions retrieved: {data['total']} total")
    
    def test_admin_emails(self):
        """Get admin emails list"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert "total" in data
        print(f"✓ Admin emails retrieved: {data['total']} total")


class TestUserAndReportFlow:
    """Test user creation and report generation"""
    
    def test_create_user(self):
        """Create a test user"""
        response = requests.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_Iteration18_User",
            "email": "test_iter18@example.com",
            "role": "Senior Manager",
            "consent_privacy": True,
            "consent_marketing": False
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["name"] == "TEST_Iteration18_User"
        assert data["email"] == "test_iter18@example.com"
        print(f"✓ User created with session_id: {data['session_id']}")
        return data["session_id"]
    
    def test_generate_report(self):
        """Generate a report for a user"""
        # First create a user
        user_response = requests.post(f"{BASE_URL}/api/user/create", json={
            "name": "TEST_Report_User",
            "email": "test_report@example.com",
            "role": "Team Leader",
            "consent_privacy": True
        })
        assert user_response.status_code == 200
        session_id = user_response.json()["session_id"]
        
        # Generate report with quiz answers
        answers = [
            {"question_id": 1, "category": "rhetorik", "layer": "rhetoric", "score": 4},
            {"question_id": 2, "category": "kritisches_denken", "layer": "ai_literacy", "score": 3},
            {"question_id": 3, "category": "entscheidung", "layer": "strategic_eq", "score": 4},
            {"question_id": 4, "category": "fuehrung", "layer": "rhetoric", "score": 3},
            {"question_id": 5, "category": "eq", "layer": "strategic_eq", "score": 4},
            {"question_id": 6, "category": "strategie", "layer": "ai_literacy", "score": 3},
        ]
        
        report_response = requests.post(f"{BASE_URL}/api/quiz/generate-report", json={
            "session_id": session_id,
            "answers": answers
        })
        assert report_response.status_code == 200
        report = report_response.json()
        
        # Verify report structure
        assert "cat_scores" in report
        assert "layer_scores" in report
        assert "leadership_roles" in report
        assert "strongest_role" in report
        assert "weakest_role" in report
        assert "avg_total" in report
        
        # Verify 6 leadership roles exist
        assert len(report["leadership_roles"]) == 6
        print(f"✓ Report generated with {len(report['leadership_roles'])} leadership roles")
        print(f"  - Strongest role: {report['strongest_role']['label']}")
        print(f"  - Weakest role: {report['weakest_role']['label']}")
        print(f"  - Total score: {report['avg_total']}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
